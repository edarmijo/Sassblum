"""
AuthService — concrete IAuthService implementation (Singleton).

Responsibility (SRP): authentication use cases — authenticate, register, logout,
    verify email, generate tokens. Password-reset tokens are delegated to TokenService (S25).
Depends on: IAuthService (contract), UserRepository (DIP), RegistrationValidatorChain,
    simplejwt for tokens, django.core.signing for the email-verification token.
Pattern: Singleton (module-level accessor) + DIP.
SOLID: DIP · SRP · LSP · OCP

Email verification uses a signed, timestamped token (no extra model needed):
    register() emits a token; verify_email() unsigns it (max age 24 h).
"""

from __future__ import annotations

import logging
import threading

from django.core import signing
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.interfaces import IAuthService
from apps.authentication.models import User
from apps.authentication.repositories import UserRepository
from apps.authentication.validators import RegistrationValidatorChain

logger = logging.getLogger(__name__)

_VERIFY_SALT = "sassblum.email.verify"
_VERIFY_MAX_AGE = 60 * 60 * 24  # 24 h
MAX_FAILED_ATTEMPTS = 5


# ── Domain exceptions ──────────────────────────────────────────────────────────

class AuthenticationFailed(Exception):
    """Wrong email or password."""


class AccountLocked(Exception):
    """Account blocked after too many failed attempts."""


class EmailNotVerified(Exception):
    """Login attempted before email confirmation."""


class EmailAlreadyExists(Exception):
    """Duplicate email on registration."""


class PasswordPolicyViolation(Exception):
    """Password failed the validator chain."""


class InvalidVerificationToken(Exception):
    """Email-verification token invalid or expired."""


# ── Service ────────────────────────────────────────────────────────────────────

class AuthService(IAuthService):

    def __init__(self, user_repository: UserRepository | None = None) -> None:
        self._repo = user_repository or UserRepository()
        self._reg_chain = RegistrationValidatorChain()

    # ── HU-01: login ───────────────────────────────────────────────────────────

    def authenticate(self, email: str, password: str) -> dict:
        user = self._repo.get_by_email(email)
        if user is None:
            raise AuthenticationFailed("Credenciales inválidas.")

        if user.estado == User.Estado.BLOCKED:
            raise AccountLocked("La cuenta está bloqueada por intentos fallidos.")

        if not user.check_password(password):
            user.intentos_fallidos += 1
            if user.intentos_fallidos >= MAX_FAILED_ATTEMPTS:
                user.estado = User.Estado.BLOCKED
            user.save(update_fields=["intentos_fallidos", "estado"])
            raise AuthenticationFailed("Credenciales inválidas.")

        if not user.email_verificado:
            raise EmailNotVerified("Debes verificar tu correo antes de iniciar sesión.")

        # success → reset counter
        if user.intentos_fallidos:
            user.intentos_fallidos = 0
            user.save(update_fields=["intentos_fallidos"])

        return {"user": self._user_data(user), "tokens": self.generate_tokens(user)}

    # ── HU-02: register ────────────────────────────────────────────────────────

    def register(self, data: dict) -> dict:
        result = self._reg_chain.run(data)
        if not result.is_valid:
            raise PasswordPolicyViolation("; ".join(result.errors))

        if self._repo.email_exists(data["email"]):
            raise EmailAlreadyExists("Ya existe una cuenta con ese correo.")

        user = self._repo.create({
            "email": data["email"],
            "first_name": data.get("nombre", ""),
            "last_name": data.get("apellido", ""),
            "ruc": data.get("ruc", ""),
            "empresa": data.get("empresa", ""),
            "password": data["password"],
            "role": User.Role.CLIENT,
            "estado": User.Estado.PENDING,
            "email_verificado": False,
        })

        token = signing.dumps({"uid": user.id}, salt=_VERIFY_SALT)
        self._dispatch_verification_email(user, token)
        return {
            "message": "Cuenta creada. Revisa tu correo para verificarla.",
            "verify_token": token,
        }

    # ── logout ─────────────────────────────────────────────────────────────────

    def logout(self, refresh_token: str) -> None:
        try:
            RefreshToken(refresh_token).blacklist()
        except Exception as exc:  # noqa: BLE001
            raise AuthenticationFailed("Token inválido.") from exc

    # ── HU-03: forgot / reset (delegated to TokenService) ──────────────────────

    def forgot_password(self, email: str) -> dict:
        from apps.authentication.services.token_service import TokenService  # noqa: PLC0415
        user = self._repo.get_by_email(email)
        if user is not None:
            TokenService().generate_reset_token(user)
        return {"message": "Si el correo está registrado, recibirás un enlace."}

    def reset_password(self, token: str, new_password: str) -> dict:
        from apps.authentication.services.token_service import TokenService  # noqa: PLC0415
        svc = TokenService()
        user = svc.validate_reset_token(token)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        svc.consume_token(token)
        svc.invalidate_sessions(user)
        return {"message": "Contraseña actualizada."}

    # ── verify email ───────────────────────────────────────────────────────────

    def verify_email(self, token: str) -> dict:
        try:
            payload = signing.loads(token, salt=_VERIFY_SALT, max_age=_VERIFY_MAX_AGE)
        except signing.BadSignature as exc:
            raise InvalidVerificationToken("Token de verificación inválido o expirado.") from exc

        user = self._repo.get_by_id(payload["uid"])
        if user is None:
            raise InvalidVerificationToken("Usuario no encontrado.")

        if user.email_verificado:
            return {"message": "El correo ya estaba verificado."}

        user.email_verificado = True
        user.estado = User.Estado.ACTIVE
        user.save(update_fields=["email_verificado", "estado"])
        return {"message": "Correo verificado. Ya puedes iniciar sesión."}

    # ── perfil propio (GET/PATCH /api/auth/perfil) ─────────────────────────────

    def get_profile(self, user: User) -> dict:
        return self._user_data(user)

    def update_profile(self, user: User, data: dict) -> dict:
        """
        Actualiza SOLO los campos editables del propio usuario.
        Email y rol quedan fuera por diseño (identidad / decisión de admin).
        """
        editable = {"nombre": "first_name", "apellido": "last_name",
                    "ruc": "ruc", "empresa": "empresa"}
        changed: list[str] = []
        for field, model_field in editable.items():
            if field in data:
                setattr(user, model_field, data[field])
                changed.append(model_field)
        if changed:
            user.save(update_fields=changed)
        return self._user_data(user)

    # ── tokens ─────────────────────────────────────────────────────────────────

    def generate_tokens(self, user) -> dict:
        refresh = RefreshToken.for_user(user)
        return {"access": str(refresh.access_token), "refresh": str(refresh)}

    # ── helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def _user_data(user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "nombre": user.first_name,
            "apellido": user.last_name,
            "ruc": user.ruc,
            "empresa": user.empresa,
            "rol": user.role,
            "estado": user.estado,
            "email_verificado": user.email_verificado,
        }

    @staticmethod
    def _dispatch_verification_email(user: User, token: str) -> None:
        """
        Envía el correo de verificación en un hilo de fondo (fire-and-forget).

        El envío de email NUNCA debe estar en el camino de la respuesta HTTP:
        si el SMTP está lento o inalcanzable (p. ej. red de Render), el registro
        responde igual de inmediato y el fallo queda solo en logs.
        """
        from django.conf import settings  # noqa: PLC0415
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        verify_url = f"{frontend}/verify-email?token={token}"
        context = {
            "tipo": "email_verification",
            "titulo": "Verifica tu correo",
            "cuerpo": "Confirma tu cuenta para empezar a usar SassBlum.",
            "verify_url": verify_url,
            "expira_en": "24 horas",
            "recipient_nombre": user.first_name,
        }

        def _send() -> None:
            # Transactional email: send directly (bypass the channel-preference
            # gate, since a brand-new user is not yet verified/active).
            from apps.notifications.factory import NotificationFactory  # noqa: PLC0415
            try:
                NotificationFactory.build("email").send(
                    user, "Verifica tu correo", context
                )
            except Exception:  # noqa: BLE001
                logger.warning(
                    "No se pudo enviar el correo de verificación a %s",
                    user.email,
                    exc_info=True,
                )

        threading.Thread(target=_send, daemon=True, name="verify-email").start()


# ── Singleton accessor ─────────────────────────────────────────────────────────

_lock = threading.Lock()
_instance: AuthService | None = None


def get_auth_service() -> AuthService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = AuthService()
    return _instance
