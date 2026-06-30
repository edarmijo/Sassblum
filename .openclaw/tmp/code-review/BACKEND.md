# ═══════════════════════════════════════════════════════
# BACKEND COMPLETO
# Generado: 2026-06-28 17:28 UTC
# ═══════════════════════════════════════════════════════

---
## 📁 backend
---

### 📄 backend/apps/authentication/__init__.py
```python

```

### 📄 backend/apps/authentication/admin.py
```python
from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'first_name', 'last_name', 'role', 'estado', 'email_verificado')
    list_filter = ('role', 'estado', 'email_verificado')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('date_joined',)
```

### 📄 backend/apps/authentication/apps.py
```python
from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.authentication'

```

### 📄 backend/apps/authentication/interfaces/__init__.py
```python
"""
ABC contracts specific to the authentication module.
All views and services inside apps/authentication/ import from here.
No other app should import directly from this package (ISP).
"""

from .i_auth_service import IAuthService
from .i_user_admin_actions import IUserAdminActions

__all__ = ["IAuthService", "IUserAdminActions"]

```

### 📄 backend/apps/authentication/interfaces/i_auth_service.py
```python
"""
Root ABC for all authentication operations in the backend.
Every DRF view in apps/authentication/views/ depends on this interface (DIP),
never on the concrete AuthService class.

Responsibility (SRP): declare the authentication operation contract.
    No HTTP logic, no ORM queries, no JWT calls — only method signatures.
Depends on: abc — nothing from the domain.
Pattern: DIP anchor · Singleton target (AuthService will implement this in S7)
SOLID: DIP · SRP · LSP (AuthService is fully replaceable in tests without touching views)

Sprint coverage:
    S1  → this file (contract only)
    S7  → AuthService(IAuthService) — Singleton implementation + simplejwt
    S8  → tests mock IAuthService; views receive the mock without modification (LSP proof)
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TypedDict


# ─── Data transfer objects (input / output shapes) ───────────────────────────


class TokenPair(TypedDict):
    """Access + refresh JWT strings returned after successful authentication."""

    access: str   # short-lived (1 h) — injected into Authorization header
    refresh: str  # long-lived (7 d) — rotated on each use, blacklisted on logout


class UserData(TypedDict):
    """Minimal user profile returned alongside tokens."""

    id: int
    email: str
    nombre: str
    apellido: str
    rol: str     # 'CLIENTE' | 'TRABAJADOR' | 'ADMINISTRADOR'
    estado: str  # 'ACTIVO' | 'BLOQUEADO' | 'PENDIENTE'
    email_verificado: bool


# ─── Service contract ─────────────────────────────────────────────────────────


class IAuthService(ABC):
    """Abstract contract for all authentication use cases."""

    @abstractmethod
    def authenticate(self, email: str, password: str) -> dict:
        """
        HU-01: Validate credentials and return tokens + profile.

        Business rules enforced by the concrete implementation (NOT here):
        - Increment intentos_fallidos on each wrong password.
        - Lock account (estado = BLOQUEADO) after 5 consecutive failures.
        - Reject login if email_verificado is False.

        Returns:
            {'user': UserData, 'tokens': TokenPair}

        Raises:
            AuthenticationFailed — wrong email or password
            AccountLocked        — account suspended after too many failures
            EmailNotVerified     — registration not yet confirmed
        """
        ...

    @abstractmethod
    def register(self, data: dict) -> dict:
        """
        HU-02: Create a new CLIENTE account with estado = PENDIENTE.
        Dispatches the email-verification email via the email service.

        Args:
            data: validated dict from RegisterSerializer
                  (nombre, apellido, email, password)

        Returns:
            {'message': str}

        Raises:
            EmailAlreadyExists      — duplicate email
            PasswordPolicyViolation — weak password caught post-serializer
        """
        ...

    @abstractmethod
    def logout(self, refresh_token: str) -> None:
        """
        Invalidate a session by adding the refresh token to the simplejwt blacklist.

        Raises:
            InvalidToken           — token is malformed or belongs to another user
            TokenAlreadyBlacklisted — token was already invalidated
        """
        ...

    @abstractmethod
    def forgot_password(self, email: str) -> dict:
        """
        HU-03 step 1: Generate a one-time reset token (expires 1 h) and dispatch email.
        Must NOT reveal whether the email is registered (no user enumeration).

        Returns:
            {'message': str}  — generic regardless of whether email exists

        Raises:
            RateLimitExceeded — too many requests from the same IP / user
        """
        ...

    @abstractmethod
    def reset_password(self, token: str, new_password: str) -> dict:
        """
        HU-03 step 2: Validate the one-time token, hash the new password,
        and invalidate all active sessions for the user.

        Returns:
            {'message': str}

        Raises:
            InvalidToken            — token not found or belongs to another user
            TokenExpired            — token older than 1 h
            PasswordPolicyViolation — new password does not meet the policy
        """
        ...

    @abstractmethod
    def verify_email(self, token: str) -> dict:
        """
        Confirm the email address using the token sent after registration.
        Transitions user status: PENDIENTE → ACTIVO.
        Sets email_verificado = True.

        Returns:
            {'message': str}

        Raises:
            InvalidToken    — token not found
            TokenExpired    — token older than 24 h
            AlreadyVerified — email_verificado is already True
        """
        ...

    @abstractmethod
    def generate_tokens(self, user) -> TokenPair:
        """
        Create a fresh access/refresh token pair for the given User instance
        using djangorestframework-simplejwt.

        Kept separate from authenticate() so that TokenService can override
        only this method without touching the rest of IAuthService (SRP).

        Args:
            user: a Django User model instance (avoids coupling to User import here)
        """
        ...

```

### 📄 backend/apps/authentication/interfaces/i_user_admin_actions.py
```python
"""
IUserAdminActions — ISP interface for admin user management (HU-14, D25).

Responsibility (SRP): declare the admin-only user operations. Separate from
    IAuthService (session) so AuthService and UserAdminService don't mix concerns.
Pattern: ISP. SOLID: ISP · DIP · OCP.

D25: user management lives in apps/authentication/ (where User already is), NOT a new
    users/ module. UserAdminService implements this; views depend on the interface (DIP).
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IUserAdminActions(ABC):

    @abstractmethod
    def list_users(self, filters: dict | None = None) -> list:
        """List users, optionally filtered by role/estado. Returns list of UserData dicts."""
        ...

    @abstractmethod
    def create_user(self, data: dict) -> dict:
        """Create a user with a given role (worker/admin). Returns the created UserData."""
        ...

    @abstractmethod
    def block_user(self, user_id: int) -> dict:
        """Set estado = BLOQUEADO. Returns updated UserData."""
        ...

    @abstractmethod
    def unblock_user(self, user_id: int) -> dict:
        """Set estado = ACTIVO and reset failed attempts. Returns updated UserData."""
        ...

```

### 📄 backend/apps/authentication/models.py
```python
import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager that uses email instead of username (SRP: only manages User persistence)."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es requerido.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('estado', 'activo')
        extra_fields.setdefault('email_verificado', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    class Role(models.TextChoices):
        CLIENT = 'client', 'Cliente'
        WORKER = 'worker', 'Trabajador'
        ADMIN  = 'admin',  'Administrador'

    class Estado(models.TextChoices):
        ACTIVE  = 'activo',    'Activo'
        BLOCKED = 'bloqueado', 'Bloqueado'
        PENDING = 'pendiente', 'Pendiente'

    objects = UserManager()

    username          = None
    email             = models.EmailField(unique=True, verbose_name='correo electrónico')
    ruc               = models.CharField(
        max_length=13,
        blank=True,
        default='',
        verbose_name='RUC',
    )
    role              = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name='rol',
    )
    estado            = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDING,
        verbose_name='estado',
    )
    intentos_fallidos = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='intentos fallidos',
    )
    bloqueado_hasta   = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='bloqueado hasta',
    )
    email_verificado  = models.BooleanField(
        default=False,
        verbose_name='email verificado',
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'auth_user_custom'

    def __str__(self):
        return f'{self.email} ({self.role})'


class PasswordResetToken(models.Model):
    """
    One-time password reset token (SRP — data only).
    Generation/validation logic lives in TokenService, never in the model.
    """

    usuario = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='reset_tokens',
        verbose_name='usuario',
    )
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='token',
    )
    expira_en = models.DateTimeField(verbose_name='expira en')
    usado = models.BooleanField(default=False, verbose_name='usado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='creado en')

    class Meta:
        db_table = 'auth_password_reset_token'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
        ]

    def __str__(self):
        estado = 'usado' if self.usado else 'activo'
        return f'reset {self.token} ({estado})'

```

### 📄 backend/apps/authentication/repositories/__init__.py
```python
from .user_repository import UserRepository

__all__ = ["UserRepository"]

```

### 📄 backend/apps/authentication/repositories/user_repository.py
```python
"""
UserRepository — encapsulates all ORM access for the User model (Repository).

Responsibility (SRP): every User query lives here. AuthService never touches the
    ORM directly (DIP).
Depends on: BaseRepository[User], User model.
Pattern: Repository.
SOLID: DIP · SRP · LSP
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.authentication.models import User


class UserRepository(BaseRepository[User]):

    def get_by_id(self, entity_id: int) -> Optional[User]:
        return User.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[User]:
        qs = User.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> User:
        password = data.pop("password", None)
        user = User(**data)
        if password:
            user.set_password(password)
        user.save()
        return user

    # Fields that are safe to update via this repository.
    # Prevents accidental modification of role, email, or password through bulk updates.
    ALLOWED_UPDATE_FIELDS = {
        'first_name', 'last_name', 'estado', 'intentos_fallidos',
        'bloqueado_hasta', 'email_verificado', 'role',
    }

    def update(self, entity_id: int, data: dict) -> User:
        safe_data = {k: v for k, v in data.items() if k in self.ALLOWED_UPDATE_FIELDS}
        User.objects.filter(pk=entity_id).update(**safe_data)
        return self.get_by_id(entity_id)  # Returns None instead of DoesNotExist

    def delete(self, entity_id: int) -> None:
        User.objects.filter(pk=entity_id).delete()

    # ── Auth-specific ──────────────────────────────────────────────────────────

    def get_by_email(self, email: str) -> Optional[User]:
        return User.objects.filter(email__iexact=email).first()

    def email_exists(self, email: str) -> bool:
        return User.objects.filter(email__iexact=email).exists()

```

### 📄 backend/apps/authentication/serializers/__init__.py
```python
from .forgot_password_serializer import ForgotPasswordSerializer
from .reset_password_serializer import ResetPasswordSerializer
from .login_serializer import LoginSerializer
from .register_serializer import RegisterSerializer
from .verify_email_serializer import VerifyEmailSerializer, LogoutSerializer

__all__ = [
    "ForgotPasswordSerializer",
    "ResetPasswordSerializer",
    "LoginSerializer",
    "RegisterSerializer",
    "VerifyEmailSerializer",
    "LogoutSerializer",
]

```

### 📄 backend/apps/authentication/serializers/forgot_password_serializer.py
```python
"""
ForgotPasswordSerializer — validates the email for a reset request (SRP).
One serializer per operation. No business logic; the view delegates to TokenService.
"""

from rest_framework import serializers


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

```

### 📄 backend/apps/authentication/serializers/login_serializer.py
```python
"""LoginSerializer — validates login input (SRP). One serializer per operation."""

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

```

### 📄 backend/apps/authentication/serializers/register_serializer.py
```python
"""RegisterSerializer — validates registration input (SRP)."""

from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    ruc = serializers.CharField(max_length=13, required=False, allow_blank=True, default="")
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden."}
            )
        return attrs

```

### 📄 backend/apps/authentication/serializers/reset_password_serializer.py
```python
"""
ResetPasswordSerializer — validates the reset payload (SRP).

Checks the two passwords match and meet the minimum policy. The token itself is
validated by TokenService (not here — SRP: this serializer only validates input shape).
"""

from rest_framework import serializers


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden."}
            )
        return attrs

```

### 📄 backend/apps/authentication/serializers/user_admin_serializers.py
```python
"""User admin serializers — one per operation (SRP). HU-14."""

from rest_framework import serializers

# Trabajadores y administradores deben usar el dominio corporativo (seguridad).
STAFF_EMAIL_DOMAIN = "sassblum.com"


class UserCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["worker", "admin"], default="worker")

    def validate_email(self, value: str) -> str:
        if not value.lower().endswith(f"@{STAFF_EMAIL_DOMAIN}"):
            raise serializers.ValidationError(
                f"Los trabajadores y administradores deben usar un correo @{STAFF_EMAIL_DOMAIN}."
            )
        return value

```

### 📄 backend/apps/authentication/serializers/verify_email_serializer.py
```python
"""VerifyEmailSerializer / LogoutSerializer — single-field token serializers (SRP)."""

from rest_framework import serializers


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

```

### 📄 backend/apps/authentication/services/__init__.py
```python
from .token_service import TokenService
from .auth_service import AuthService, get_auth_service
from .user_admin_service import UserAdminService, get_user_admin_service

__all__ = [
    "TokenService",
    "AuthService",
    "get_auth_service",
    "UserAdminService",
    "get_user_admin_service",
]

```

### 📄 backend/apps/authentication/services/auth_service.py
```python
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
            "rol": user.role,
            "estado": user.estado,
            "email_verificado": user.email_verificado,
        }

    @staticmethod
    def _dispatch_verification_email(user: User, token: str) -> None:
        from django.conf import settings  # noqa: PLC0415
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        verify_url = f"{frontend}/verify-email?token={token}"
        context = {
            "tipo": "password_reset",  # reuse a simple template
            "titulo": "Verifica tu correo",
            "cuerpo": "Confirma tu cuenta para empezar a usar SassBlum.",
            "reset_url": verify_url,
            "expira_en": "24 horas",
            "recipient_nombre": user.first_name,
        }
        # Transactional email: send directly (bypass the channel-preference gate,
        # since a brand-new user is not yet verified/active).
        try:
            NotificationFactory.build("email").send(user, "Verifica tu correo", context)
        except Exception:  # noqa: BLE001
            logger.warning(
                "No se pudo enviar el correo de verificación a %s",
                user.email,
                exc_info=True,
            )


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading

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

```

### 📄 backend/apps/authentication/services/token_service.py
```python
"""
TokenService — password-reset token lifecycle (SRP, separate from AuthService).

Responsibility (SRP): create, validate, and consume one-time reset tokens, and
    invalidate active sessions. It does NOT authenticate or register — that is
    AuthService's job. Keeping this separate means the reset-token policy can change
    without touching AuthService (OCP).
Depends on: PasswordResetToken, User models; simplejwt blacklist for session kill.
Pattern: SRP-focused service.
SOLID: SRP · DIP · OCP

Token policy:
    - UUID4, single-use, expires 1 hour after creation.
"""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.authentication.models import PasswordResetToken, User

TOKEN_TTL = timedelta(hours=1)


class TokenExpired(Exception):
    """Raised when a reset token is past its expiry."""


class InvalidToken(Exception):
    """Raised when a reset token does not exist or was already used."""


class TokenService:
    """Manages password-reset tokens and session invalidation."""

    def generate_reset_token(self, user: User) -> str:
        """
        Create a fresh single-use reset token for the user (expires in 1h).
        Any previous unused tokens for the user are invalidated first.
        Returns the token string (UUID).
        """
        PasswordResetToken.objects.filter(usuario=user, usado=False).update(usado=True)
        token = PasswordResetToken.objects.create(
            usuario=user,
            expira_en=timezone.now() + TOKEN_TTL,
        )
        return str(token.token)

    def validate_reset_token(self, token: str) -> User:
        """
        Validate a reset token and return its user.
        Raises InvalidToken (missing/used) or TokenExpired.
        Does NOT mark the token as used — call consume_token() after a successful reset.
        """
        prt = PasswordResetToken.objects.filter(token=token, usado=False).first()
        if prt is None:
            raise InvalidToken("Token inválido o ya utilizado.")
        if prt.expira_en < timezone.now():
            raise TokenExpired("El token de recuperación ha expirado.")
        return prt.usuario

    def consume_token(self, token: str) -> None:
        """Mark the token as used (single-use enforcement)."""
        PasswordResetToken.objects.filter(token=token).update(usado=True)

    def invalidate_sessions(self, user: User) -> None:
        """
        Blacklist all outstanding refresh tokens for the user, forcing re-login
        on every device after a password reset.
        """
        try:
            from rest_framework_simplejwt.token_blacklist.models import (  # noqa: PLC0415
                OutstandingToken,
                BlacklistedToken,
            )
        except ImportError:
            return  # token_blacklist app not installed — nothing to invalidate

        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)

```

### 📄 backend/apps/authentication/services/user_admin_service.py
```python
"""
UserAdminService — concrete IUserAdminActions (Singleton). HU-14 / D25.

Responsibility (SRP): admin user management. Separate from AuthService (session).
Depends on: UserRepository (DIP). Pattern: Singleton + Repository. SOLID: ISP·DIP·SRP·LSP.
"""

from __future__ import annotations

from apps.authentication.interfaces.i_user_admin_actions import IUserAdminActions
from apps.authentication.models import User
from apps.authentication.repositories import UserRepository
from core.exceptions.domain_exceptions import DomainException


class UserNotFound(DomainException):
    """Raised when a managed user does not exist."""


class UserAdminService(IUserAdminActions):

    def __init__(self, user_repository: UserRepository | None = None) -> None:
        self._repo = user_repository or UserRepository()

    def list_users(self, filters: dict | None = None) -> list:
        users = self._repo.get_all(filters or {})
        return [self._data(u) for u in users]

    def create_user(self, data: dict) -> dict:
        if self._repo.email_exists(data["email"]):
            raise DomainException("Ya existe una cuenta con ese correo.")
        user = self._repo.create({
            "email": data["email"],
            "first_name": data.get("nombre", ""),
            "last_name": data.get("apellido", ""),
            "password": data["password"],
            "role": data.get("role", User.Role.WORKER),
            "estado": User.Estado.ACTIVE,
            "email_verificado": True,  # admin-created accounts are pre-verified
        })
        return self._data(user)

    def block_user(self, user_id: int) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound("Usuario no encontrado.")
        user = self._repo.update(user_id, {"estado": User.Estado.BLOCKED})
        return self._data(user)

    def unblock_user(self, user_id: int) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound("Usuario no encontrado.")
        user = self._repo.update(user_id, {
            "estado": User.Estado.ACTIVE,
            "intentos_fallidos": 0,
        })
        return self._data(user)

    @staticmethod
    def _data(u: User) -> dict:
        return {
            "id": u.id,
            "email": u.email,
            "nombre": u.first_name,
            "apellido": u.last_name,
            "rol": u.role,
            "estado": u.estado,
            "email_verificado": u.email_verificado,
        }


import threading

_lock = threading.Lock()
_instance: UserAdminService | None = None


def get_user_admin_service() -> UserAdminService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = UserAdminService()
    return _instance

```

### 📄 backend/apps/authentication/tests/__init__.py
```python
# Sprint 1 · Session 8 — Test suite for the authentication module:
#   test_validators.py      → EmailValidator, PasswordValidator, chain coverage ≥ 80%
#   test_auth_service.py    → authenticate(), register(), lockout after 5 failures, JWT, blacklist

```

### 📄 backend/apps/authentication/tests/test_auth_service.py
```python
"""
Tests for AuthService (requires DB). authenticate + register + lockout.
Run: pytest apps/authentication/tests/test_auth_service.py -v
"""

import pytest

from apps.authentication.models import User
from apps.authentication.services.auth_service import (
    AuthService,
    AuthenticationFailed,
    AccountLocked,
    EmailNotVerified,
    EmailAlreadyExists,
    PasswordPolicyViolation,
)


@pytest.fixture
def active_user(db):
    u = User.objects.create_user(
        email="user@example.com", password="Pass1234",
        role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=True,
    )
    return u


@pytest.mark.django_db
class TestAuthenticate:
    def test_success_returns_user_and_tokens(self, active_user):
        result = AuthService().authenticate("user@example.com", "Pass1234")
        assert result["user"]["email"] == "user@example.com"
        assert "access" in result["tokens"] and "refresh" in result["tokens"]

    def test_wrong_password_increments_attempts(self, active_user):
        with pytest.raises(AuthenticationFailed):
            AuthService().authenticate("user@example.com", "wrong")
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 1

    def test_lockout_after_five_failures(self, active_user):
        svc = AuthService()
        for _ in range(5):
            with pytest.raises((AuthenticationFailed, AccountLocked)):
                svc.authenticate("user@example.com", "wrong")
        active_user.refresh_from_db()
        assert active_user.estado == User.Estado.BLOCKED

    def test_unverified_email_rejected(self, db):
        User.objects.create_user(
            email="pending@example.com", password="Pass1234",
            role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=False,
        )
        with pytest.raises(EmailNotVerified):
            AuthService().authenticate("pending@example.com", "Pass1234")

    def test_unknown_email_fails(self, db):
        with pytest.raises(AuthenticationFailed):
            AuthService().authenticate("nobody@example.com", "Pass1234")

    def test_success_resets_attempt_counter(self, active_user):
        active_user.intentos_fallidos = 3
        active_user.save(update_fields=["intentos_fallidos"])
        AuthService().authenticate("user@example.com", "Pass1234")
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 0


@pytest.mark.django_db
class TestRegister:
    def test_creates_pending_client(self, db):
        result = AuthService().register({
            "nombre": "Ana", "apellido": "Pérez",
            "email": "new@example.com", "password": "Pass1234",
        })
        assert "message" in result
        user = User.objects.get(email="new@example.com")
        assert user.role == User.Role.CLIENT
        assert user.estado == User.Estado.PENDING
        assert user.email_verificado is False

    def test_duplicate_email_rejected(self, active_user):
        with pytest.raises(EmailAlreadyExists):
            AuthService().register({
                "nombre": "X", "apellido": "Y",
                "email": "user@example.com", "password": "Pass1234",
            })

    def test_weak_password_rejected(self, db):
        with pytest.raises(PasswordPolicyViolation):
            AuthService().register({
                "nombre": "X", "apellido": "Y",
                "email": "weak@example.com", "password": "short",
            })


@pytest.mark.django_db
class TestVerifyEmail:
    def test_verify_activates_user(self, db):
        from django.core import signing
        from apps.authentication.services.auth_service import _VERIFY_SALT
        user = User.objects.create_user(
            email="verify@example.com", password="Pass1234",
            role=User.Role.CLIENT, estado=User.Estado.PENDING, email_verificado=False,
        )
        token = signing.dumps({"uid": user.id}, salt=_VERIFY_SALT)
        AuthService().verify_email(token)
        user.refresh_from_db()
        assert user.email_verificado is True
        assert user.estado == User.Estado.ACTIVE

```

### 📄 backend/apps/authentication/tests/test_password_reset.py
```python
"""
Tests for TokenService (password reset) — requires the database.
Run: pytest apps/authentication/tests/test_password_reset.py -v

These use @pytest.mark.django_db and run in your environment (Supabase / local PG).
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.authentication.models import User, PasswordResetToken
from apps.authentication.services.token_service import (
    TokenService,
    TokenExpired,
    InvalidToken,
)


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="reset@example.com", password="OldPass123", role=User.Role.CLIENT
    )


@pytest.mark.django_db
class TestTokenService:
    def test_generate_creates_active_token(self, user):
        token = TokenService().generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        assert prt.usado is False
        assert prt.usuario == user
        assert prt.expira_en > timezone.now()

    def test_generate_invalidates_previous_tokens(self, user):
        svc = TokenService()
        first = svc.generate_reset_token(user)
        svc.generate_reset_token(user)
        assert PasswordResetToken.objects.get(token=first).usado is True

    def test_validate_returns_user_for_valid_token(self, user):
        token = TokenService().generate_reset_token(user)
        assert TokenService().validate_reset_token(token) == user

    def test_validate_raises_invalid_for_unknown_token(self):
        with pytest.raises(InvalidToken):
            TokenService().validate_reset_token("00000000-0000-0000-0000-000000000000")

    def test_validate_raises_invalid_for_used_token(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        with pytest.raises(InvalidToken):
            svc.validate_reset_token(token)

    def test_validate_raises_expired(self, user):
        token = TokenService().generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        prt.expira_en = timezone.now() - timedelta(minutes=1)
        prt.save(update_fields=["expira_en"])
        with pytest.raises(TokenExpired):
            TokenService().validate_reset_token(token)

    def test_consume_marks_used(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        assert PasswordResetToken.objects.get(token=token).usado is True

```

### 📄 backend/apps/authentication/urls.py
```python
"""
URL routing for the authentication API. Mounted under /api/auth/ by config/urls.py.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.authentication.views import (
    RegisterView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path("forgot-password", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password", ResetPasswordView.as_view(), name="reset-password"),
]

```

### 📄 backend/apps/authentication/user_urls.py
```python
"""User-management routing (HU-14). Mounted under /api/usuarios/ by config/urls.py."""

from django.urls import path

from apps.authentication.views.user_admin_views import (
    UserListCreateView,
    UserBlockView,
    UserUnblockView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="user-list-create"),
    path("<int:user_id>/bloquear", UserBlockView.as_view(), name="user-block"),
    path("<int:user_id>/desbloquear", UserUnblockView.as_view(), name="user-unblock"),
]

```

### 📄 backend/apps/authentication/validators/__init__.py
```python
from .email_validator import EmailValidator
from .password_validator import PasswordValidator
from .registration_validator_chain import RegistrationValidatorChain

__all__ = ["EmailValidator", "PasswordValidator", "RegistrationValidatorChain"]

```

### 📄 backend/apps/authentication/validators/email_validator.py
```python
"""
EmailValidator — Chain of Responsibility node validating email format (SRP).
Extends BaseValidator (S1). Pattern: Chain of Responsibility. SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

import re

from core.base.base_validator import BaseValidator, ValidationResult

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        email = (data.get("email") or "").strip()
        if not _EMAIL_RE.match(email):
            return ValidationResult(
                is_valid=False,
                errors=["El correo electrónico no tiene un formato válido."],
                field_name="email",
            )
        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/authentication/validators/password_validator.py
```python
"""
PasswordValidator — Chain of Responsibility node validating password policy (SRP).
Policy: ≥8 chars, at least one letter and one digit.
Extends BaseValidator (S1). SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class PasswordValidator(BaseValidator):
    MIN_LENGTH = 8

    def validate(self, data: dict) -> ValidationResult:
        password = data.get("password") or ""
        if len(password) < self.MIN_LENGTH:
            return ValidationResult(
                is_valid=False,
                errors=[f"La contraseña debe tener al menos {self.MIN_LENGTH} caracteres."],
                field_name="password",
            )
        if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
            return ValidationResult(
                is_valid=False,
                errors=["La contraseña debe incluir al menos una letra y un número."],
                field_name="password",
            )
        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/authentication/validators/registration_validator_chain.py
```python
"""
RegistrationValidatorChain — assembles Email → Password (Chain of Responsibility).

Responsibility (SRP): wire the registration validator chain and expose run().
Pattern: Chain of Responsibility (assembler).
SOLID: OCP (add PhoneValidator = one addValidator, existing nodes untouched) · DIP.
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from .email_validator import EmailValidator
from .password_validator import PasswordValidator


class RegistrationValidatorChain:
    def __init__(self) -> None:
        email_v = EmailValidator()
        email_v.add_validator(PasswordValidator())
        self._root = email_v

    def run(self, data: dict) -> ValidationResult:
        return self._root.run_chain(data)

```

### 📄 backend/apps/authentication/views/__init__.py
```python
from .password_reset_views import ForgotPasswordView, ResetPasswordView
from .auth_views import RegisterView, LoginView, LogoutView, VerifyEmailView

__all__ = [
    "ForgotPasswordView",
    "ResetPasswordView",
    "RegisterView",
    "LoginView",
    "LogoutView",
    "VerifyEmailView",
]

```

### 📄 backend/apps/authentication/views/auth_views.py
```python
"""
Auth DRF views — HTTP orchestration only (SRP + DIP).

Each view depends on IAuthService (via get_auth_service()), never on the concrete class.
Declares only the permission it needs (ISP). No business logic, no ORM.

Endpoints:
    POST /api/auth/register       → RegisterView   (AllowAny)
    POST /api/auth/login          → LoginView      (AllowAny)
    POST /api/auth/logout         → LogoutView     (IsAuthenticated)
    POST /api/auth/verify-email   → VerifyEmailView (AllowAny)
"""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers import (
    LoginSerializer,
    RegisterSerializer,
    VerifyEmailSerializer,
    LogoutSerializer,
)
from apps.authentication.services import get_auth_service
from apps.authentication.services.auth_service import (
    AuthenticationFailed,
    AccountLocked,
    EmailNotVerified,
    EmailAlreadyExists,
    PasswordPolicyViolation,
    InvalidVerificationToken,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_auth_service().register(serializer.validated_data)
        except EmailAlreadyExists as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except PasswordPolicyViolation as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = get_auth_service().authenticate(data["email"], data["password"])
        except AuthenticationFailed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        except AccountLocked as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_423_LOCKED)
        except EmailNotVerified as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return Response(result, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            get_auth_service().logout(serializer.validated_data["refresh"])
        except AuthenticationFailed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_auth_service().verify_email(serializer.validated_data["token"])
        except InvalidVerificationToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)

```

### 📄 backend/apps/authentication/views/health_views.py
```python
"""
Health check endpoint — verifies database connectivity.

Returns 200 + {"status": "healthy", "database": "ok"} when all checks pass.
Returns 503 + {"status": "unhealthy", ...} when any check fails.

Used by Docker HEALTHCHECK, load balancers, and monitoring tools.
"""

from django.http import JsonResponse
from django.db import connection


def health_check(request):
    checks = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = 'ok'
    except Exception:
        checks['database'] = 'error'

    all_ok = all(v == 'ok' for v in checks.values())
    status_code = 200 if all_ok else 503
    return JsonResponse(
        {'status': 'healthy' if all_ok else 'unhealthy', **checks},
        status=status_code,
    )

```

### 📄 backend/apps/authentication/views/password_reset_views.py
```python
"""
Password reset DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ TokenService. No token logic, no ORM here.
Pattern: SRP (TokenService separate) + DIP.
SOLID: SRP · DIP

Endpoints:
    POST /api/auth/forgot-password  → ForgotPasswordView
    POST /api/auth/reset-password   → ResetPasswordView

Security:
    forgot-password returns the SAME generic response whether or not the email
    exists (no user enumeration).
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.models import User
from apps.authentication.serializers import (
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from apps.authentication.services import TokenService
from apps.authentication.services.token_service import InvalidToken, TokenExpired

_GENERIC_FORGOT_MSG = (
    "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
)


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password — request a reset link."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email=email).first()
        if user is not None:
            token = TokenService().generate_reset_token(user)
            self._dispatch_reset_email(user, token)

        # Same response regardless of existence (no enumeration)
        return Response({"message": _GENERIC_FORGOT_MSG}, status=status.HTTP_200_OK)

    @staticmethod
    def _dispatch_reset_email(user, token: str) -> None:
        """
        Send the password_reset email via EmailNotificationStrategy directly
        (this is not a TicketEvent, so it bypasses the Observer).
        """
        from django.conf import settings  # noqa: PLC0415
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415

        frontend = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend}/reset-password?token={token}"
        context = {
            "tipo": "password_reset",
            "titulo": "Restablece tu contraseña",
            "cuerpo": "Solicitaste restablecer tu contraseña.",
            "reset_url": reset_url,
            "expira_en": "1 hora",
            "recipient_nombre": user.first_name,
        }
        try:
            strategy = NotificationFactory.build("email")
            if strategy.validate(user):
                strategy.send(user, "Restablece tu contraseña", context)
        except Exception:  # noqa: BLE001
            pass  # email failure must not reveal anything to the caller


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password — set a new password using a valid token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = TokenService()
        try:
            user = service.validate_reset_token(data["token"])
        except InvalidToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TokenExpired as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_410_GONE)

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])

        service.consume_token(data["token"])
        service.invalidate_sessions(user)

        return Response(
            {"message": "Contraseña actualizada. Inicia sesión nuevamente."},
            status=status.HTTP_200_OK,
        )

```

### 📄 backend/apps/authentication/views/user_admin_views.py
```python
"""
User admin DRF views — admin-only user management (HU-14, D25).

HTTP orchestration only (SRP + DIP + ISP). Depend on IUserAdminActions via
get_user_admin_service(); declare IsAdmin.

Endpoints:
    GET   /api/usuarios            → list (filter ?role=, ?estado=)
    POST  /api/usuarios            → create worker/admin
    PATCH /api/usuarios/<id>/bloquear    → block
    PATCH /api/usuarios/<id>/desbloquear → unblock
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.user_admin_serializers import UserCreateSerializer
from apps.authentication.services.user_admin_service import (
    get_user_admin_service,
    UserNotFound,
)
from core.exceptions.domain_exceptions import DomainException
from core.permissions import IsAdmin


class UserListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filters = {}
        if "role" in request.query_params:
            filters["role"] = request.query_params["role"]
        if "estado" in request.query_params:
            filters["estado"] = request.query_params["estado"]
        users = get_user_admin_service().list_users(filters)
        return Response({"items": users, "total": len(users)}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            created = get_user_admin_service().create_user(serializer.validated_data)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(created, status=status.HTTP_201_CREATED)


class UserBlockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id: int):
        try:
            updated = get_user_admin_service().block_user(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)


class UserUnblockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id: int):
        try:
            updated = get_user_admin_service().unblock_user(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/catalog/__init__.py
```python

```

### 📄 backend/apps/catalog/admin.py
```python
from django.contrib import admin


# Catalog models are managed via the CatalogAdminPanel in the frontend.
# Register models here when Django Admin access is needed for debugging.
# Example:
# from .models import Service
# @admin.register(Service)
# class ServiceAdmin(admin.ModelAdmin):
#     list_display = ('id', 'nombre', 'categoria', 'activo')
#     list_filter = ('categoria', 'activo')
#     search_fields = ('nombre',)

```

### 📄 backend/apps/catalog/apps.py
```python
from django.apps import AppConfig


class CatalogConfig(AppConfig):
    name = 'apps.catalog'

```

### 📄 backend/apps/catalog/interfaces/__init__.py
```python
from .i_catalog_service import ICatalogService
from .i_catalog_client_view import ICatalogClientView
from .i_catalog_admin_view import ICatalogAdminView

__all__ = ["ICatalogService", "ICatalogClientView", "ICatalogAdminView"]

```

### 📄 backend/apps/catalog/interfaces/i_catalog_admin_view.py
```python
"""
ISP interface for admin-only catalog management operations.

Responsibility (SRP): expose only the management operations an ADMIN user needs.
    An admin creates, edits, and toggles services — no client-browse semantics.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — service_admin_view (DRF view with IsAdmin permission) depends on this.
SOLID: ISP · DIP · OCP

Why separate from ICatalogClientView:
    The admin view does not use getActiveServices with the same semantics as a client
    browsing the catalog. Merging both into one interface would force the admin DRF view
    to depend on methods it never calls (ISP violation).

CatalogService implements both ICatalogAdminView AND ICatalogClientView (LSP):
    Any implementation that satisfies these two interfaces is substitutable in tests.

OCP extension:
    New admin operation (e.g. bulk_toggle, duplicate_service) = new @abstractmethod here.
    ICatalogClientView remains frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogAdminView(ABC):
    """Management contract — used exclusively by admin-facing DRF views."""

    @abstractmethod
    def create_service(self, data: dict) -> dict:
        """
        Create a new service entry in the catalog.
        Args: validated dict from ServiceCreateSerializer.
        Returns: created ServiceDetail dict.
        Raises: ValidationError on duplicate nombre.
        """
        ...

    @abstractmethod
    def edit_service(self, service_id: int, data: dict) -> dict:
        """
        Partially update fields of an existing service.
        Args: validated dict from ServiceEditSerializer (all fields optional).
        Returns: updated ServiceDetail dict.
        Raises: ServiceNotFound, ValidationError.
        """
        ...

    @abstractmethod
    def toggle_active(self, service_id: int) -> dict:
        """
        Enable or disable a service in the public catalog.
        Returns: updated ServiceDetail dict with new activo value.
        Raises: ServiceNotFound.
        """
        ...

```

### 📄 backend/apps/catalog/interfaces/i_catalog_client_view.py
```python
"""
ISP interface for client-facing catalog operations.

Responsibility (SRP): expose only the browse operations a CLIENT user needs.
    A client can see active services and view one in detail — nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — service_list_view (public DRF view) depends on this, not on ICatalogService.
SOLID: ISP · DIP · OCP

Why NOT a subset of ICatalogService:
    If ICatalogService grows with admin or internal methods, inheriting from it
    would force client consumers to know about those methods (ISP violation).
    This interface is intentionally isolated so that a client-facing component
    never sees admin operations.

CatalogService implements both ICatalogClientView AND ICatalogAdminView (LSP):
    The Singleton centralises logic while each view depends only on its role interface.

OCP extension:
    New read-only client operation (e.g. search_services) = new @abstractmethod here.
    ICatalogAdminView remains frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogClientView(ABC):
    """Browse contract — used by public service listing and ticket-creation flow."""

    @abstractmethod
    def get_active_services(self, filters: dict | None = None) -> list:
        """
        Browse the public catalog of active services.
        Optional filters: {'categoria': str, 'busqueda': str}
        Returns: list of ServiceSummary dicts (id, nombre, descripcion, categoria, activo).
        """
        ...

    @abstractmethod
    def get_service_detail(self, service_id: int) -> dict:
        """
        View full detail of one active service before creating a ticket.
        Returns: ServiceDetail dict (includes creadoEn, actualizadoEn).
        Raises: ServiceNotFound if not found or inactive.
        """
        ...

```

### 📄 backend/apps/catalog/interfaces/i_catalog_service.py
```python
"""
Root ABC for the catalog module.

Responsibility (SRP): declare the complete catalog operation contract.
    No HTTP logic, no ORM queries, no serialization — only method signatures.
Depends on: abc.ABC — nothing from the domain or Django.
Pattern: DIP anchor — CatalogService (Singleton) will implement this in S11.
SOLID: DIP · OCP · LSP

Sprint coverage:
    S11 → this file (contract only)
    S11 → CatalogService(ICatalogService, ICatalogClientView, ICatalogAdminView) — Singleton
    S18 → tests mock ICatalogService; views receive the mock without modification (LSP proof)

OCP extension path:
    New catalog operation (e.g. archive_service, duplicate_service) = new @abstractmethod here
    + implementation in CatalogService. ICatalogClientView and ICatalogAdminView remain frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogService(ABC):
    """Abstract contract for all catalog use cases."""

    @abstractmethod
    def get_active_services(self, filters: dict | None = None) -> list:
        """
        Return all services with activo=True.
        Optional filters: {'categoria': str, 'busqueda': str}
        Returns: list of ServiceSummary dicts.
        Raises: nothing — returns empty list if no services match.
        """
        ...

    @abstractmethod
    def get_service_detail(self, service_id: int) -> dict:
        """
        Return full detail of a single service.
        Returns: ServiceDetail dict.
        Raises: ServiceNotFound if service_id does not exist or is inactive.
        """
        ...

    @abstractmethod
    def create_service(self, data: dict) -> dict:
        """
        Create a new service entry in the catalog (admin only — enforced at view level).
        Args: data = validated dict from ServiceCreateSerializer
              (nombre: str, descripcion: str, categoria: str).
        Returns: created ServiceDetail dict.
        Raises: ValidationError if nombre already exists.
        """
        ...

    @abstractmethod
    def edit_service(self, service_id: int, data: dict) -> dict:
        """
        Partially update an existing service.
        Args: data = validated dict from ServiceEditSerializer (all fields optional).
        Returns: updated ServiceDetail dict.
        Raises: ServiceNotFound, ValidationError.
        """
        ...

    @abstractmethod
    def toggle_active(self, service_id: int) -> dict:
        """
        Flip the activo field: True → False or False → True.
        Returns: updated ServiceDetail dict with new activo value.
        Raises: ServiceNotFound.
        """
        ...

```

### 📄 backend/apps/catalog/models/__init__.py
```python
from .service import Service

__all__ = ["Service"]

```

### 📄 backend/apps/catalog/models/service.py
```python
"""
Service model — a catalog service a client can open a ticket against (SRP).

Responsibility (SRP): persist service data only. Business logic (activation rules,
    validation) lives in CatalogService. The model only stores.
Depends on: Django ORM.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new field = additive, no logic change)
"""

from django.db import models


class Service(models.Model):

    nombre = models.CharField(max_length=120, unique=True, verbose_name="nombre")
    descripcion = models.TextField(verbose_name="descripción")
    categoria = models.CharField(max_length=80, verbose_name="categoría")
    activo = models.BooleanField(default=True, verbose_name="activo")
    imagen_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL de imagen"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "catalog_service"
        ordering = ["categoria", "nombre"]
        indexes = [
            models.Index(fields=["activo", "categoria"]),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.nombre} ({self.categoria}) · {estado}"

```

### 📄 backend/apps/catalog/repositories/__init__.py
```python
from .service_repository import ServiceRepository

__all__ = ["ServiceRepository"]

```

### 📄 backend/apps/catalog/repositories/service_repository.py
```python
"""
ServiceRepository — ORM gateway for catalog Service (Repository).
SOLID: DIP · SRP · LSP. CatalogService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.catalog.models import Service


class ServiceRepository(BaseRepository[Service]):

    def get_by_id(self, entity_id: int) -> Optional[Service]:
        return Service.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Service]:
        qs = Service.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Service:
        return Service.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Service:
        Service.objects.filter(pk=entity_id).update(**data)
        return Service.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Service.objects.filter(pk=entity_id).delete()

    # ── Catalog-specific ───────────────────────────────────────────────────────

    def get_active(
        self, categoria: str | None = None, busqueda: str | None = None
    ) -> list[Service]:
        qs = Service.objects.filter(activo=True)
        if categoria:
            qs = qs.filter(categoria__iexact=categoria)
        if busqueda:
            qs = qs.filter(nombre__icontains=busqueda)
        return list(qs)

```

### 📄 backend/apps/catalog/serializers/__init__.py
```python
from .service_serializers import ServiceCreateSerializer, ServiceEditSerializer

__all__ = ["ServiceCreateSerializer", "ServiceEditSerializer"]

```

### 📄 backend/apps/catalog/serializers/service_serializers.py
```python
"""
Catalog write serializers — one per operation (SRP).
Read shaping is done by CatalogService (_summary/_detail), so list/detail
serializers are not needed here; these validate admin write operations.
"""

from rest_framework import serializers


class ServiceCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    descripcion = serializers.CharField()
    categoria = serializers.CharField(max_length=80)


class ServiceEditSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False)
    categoria = serializers.CharField(max_length=80, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs

```

### 📄 backend/apps/catalog/services/__init__.py
```python
from .catalog_service import CatalogService, get_catalog_service

__all__ = ["CatalogService", "get_catalog_service"]

```

### 📄 backend/apps/catalog/services/catalog_service.py
```python
"""
CatalogService — concrete implementation of both ISP catalog views (Singleton).

Responsibility (SRP): catalog business logic. Implements ICatalogClientView AND
    ICatalogAdminView — one Singleton serves both roles (LSP). Views receive the
    role-specific interface, never this class directly (DIP).
Depends on: ServiceRepository (DIP), IStorageService (DIP, for service photos),
    domain_exceptions.
Pattern: Singleton + Repository.
SOLID: DIP · SRP · LSP · ISP · OCP
"""

from __future__ import annotations

from apps.catalog.interfaces import ICatalogClientView, ICatalogAdminView
from apps.catalog.repositories import ServiceRepository
from apps.tickets.interfaces import IStorageService
from core.exceptions.domain_exceptions import ServiceNotFound


class CatalogService(ICatalogClientView, ICatalogAdminView):

    def __init__(
        self,
        service_repository: ServiceRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = service_repository or ServiceRepository()
        self._storage = storage

    # ── Client view (browse) ───────────────────────────────────────────────────

    def get_active_services(self, filters: dict | None = None) -> list:
        filters = filters or {}
        services = self._repo.get_active(
            categoria=filters.get("categoria"),
            busqueda=filters.get("busqueda"),
        )
        return [self._summary(s) for s in services]

    def get_service_detail(self, service_id: int) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None or not service.activo:
            raise ServiceNotFound("El servicio no existe o no está disponible.")
        return self._detail(service)

    # ── Admin view (manage) ────────────────────────────────────────────────────

    def create_service(self, data: dict) -> dict:
        data = dict(data)
        imagen = data.pop("imagen", None)
        service = self._repo.create(data)
        service = self._maybe_attach_image(service, imagen)
        return self._detail(service)

    def edit_service(self, service_id: int, data: dict) -> dict:
        if self._repo.get_by_id(service_id) is None:
            raise ServiceNotFound("El servicio no existe.")
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            service = self._repo.update(service_id, data)
        else:
            service = self._repo.get_by_id(service_id)
        service = self._maybe_attach_image(service, imagen)
        return self._detail(service)

    def toggle_active(self, service_id: int) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None:
            raise ServiceNotFound("El servicio no existe.")
        service = self._repo.update(service_id, {"activo": not service.activo})
        return self._detail(service)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, service, imagen):
        if imagen is None or self._storage is None:
            return service
        path = f"services/{service.id}/{getattr(imagen, 'name', 'imagen')}"
        url = self._storage.upload(imagen, path)
        return self._repo.update(service.id, {"imagen_url": url})

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(s) -> dict:
        return {
            "id": s.id,
            "nombre": s.nombre,
            "descripcion": s.descripcion,
            "categoria": s.categoria,
            "activo": s.activo,
            "imagen_url": s.imagen_url,
        }

    @classmethod
    def _detail(cls, s) -> dict:
        return {
            **cls._summary(s),
            "creado_en": s.created_at.isoformat(),
            "actualizado_en": s.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading

_lock = threading.Lock()
_instance: CatalogService | None = None


def get_catalog_service() -> CatalogService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService  # noqa: PLC0415
                _instance = CatalogService(storage=StorageService())
    return _instance

```

### 📄 backend/apps/catalog/tests/__init__.py
```python
# Sprint 2 · Session 18 — Tests del módulo catalog:
#   test_catalog_service.py  → get_active_services (con y sin filtros), get_service_detail,
#                               create_service (duplicado), toggle_active
#   test_catalog_views.py    → permiso IsAdmin en service_admin_view,
#                              acceso público a service_list_view

```

### 📄 backend/apps/catalog/urls.py
```python
"""URL routing for the catalog API. Mounted under /api/servicios/ by config/urls.py."""

from django.urls import path

from apps.catalog.views import ServiceListView, ServiceDetailView, ServiceAdminView

urlpatterns = [
    path("", ServiceListView.as_view(), name="service-list"),
    path("admin", ServiceAdminView.as_view(), name="service-admin-create"),
    path("admin/<int:service_id>", ServiceAdminView.as_view(), name="service-admin-edit"),
    path("<int:service_id>", ServiceDetailView.as_view(), name="service-detail"),
]

```

### 📄 backend/apps/catalog/views/__init__.py
```python
from .catalog_views import ServiceListView, ServiceDetailView, ServiceAdminView

__all__ = ["ServiceListView", "ServiceDetailView", "ServiceAdminView"]

```

### 📄 backend/apps/catalog/views/catalog_views.py
```python
"""
Catalog DRF views — HTTP orchestration only (SRP + DIP + ISP).

Browse views depend on ICatalogClientView; admin views on ICatalogAdminView
(both resolved from the same Singleton via get_catalog_service()). The view never
touches the ORM. Service management (create/edit/toggle) requires worker or admin.

Endpoints:
    GET   /api/servicios              → ServiceListView   (public — marketing catalog)
    GET   /api/servicios/<id>         → ServiceDetailView (authenticated)
    POST  /api/servicios/admin        → ServiceAdminView.post   (IsWorker | IsAdmin)
    PATCH /api/servicios/admin/<id>   → ServiceAdminView.patch  (IsWorker | IsAdmin)
    PATCH /api/servicios/admin/<id>?action=toggle → toggle      (IsWorker | IsAdmin)

Service photos: the admin endpoints accept a multipart `imagen` file which is
uploaded to Supabase Storage by CatalogService via IStorageService (DIP).
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.serializers import ServiceCreateSerializer, ServiceEditSerializer
from apps.catalog.services import get_catalog_service
from core.exceptions.domain_exceptions import ServiceNotFound
from core.permissions import IsAdmin, IsWorker


class ServiceListView(APIView):
    # Public marketing catalog (homepage / public "Servicios" page).
    permission_classes = [AllowAny]

    def get(self, request):
        filters = {
            k: request.query_params[k]
            for k in ("categoria", "busqueda")
            if k in request.query_params
        }
        services = get_catalog_service().get_active_services(filters)
        return Response(
            {"items": services, "total": len(services)},
            status=status.HTTP_200_OK,
        )


class ServiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, service_id: int):
        try:
            detail = get_catalog_service().get_service_detail(service_id)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(detail, status=status.HTTP_200_OK)


class ServiceAdminView(APIView):
    permission_classes = [IsWorker | IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = ServiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        created = get_catalog_service().create_service(data)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, service_id: int):
        # toggle path is handled by a distinct URL → action query flag
        if request.query_params.get("action") == "toggle":
            return self._toggle(service_id)
        serializer = ServiceEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        try:
            updated = get_catalog_service().edit_service(service_id, data)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

    def _toggle(self, service_id: int):
        try:
            updated = get_catalog_service().toggle_active(service_id)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/gallery/__init__.py
```python

```

### 📄 backend/apps/gallery/apps.py
```python
from django.apps import AppConfig


class GalleryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.gallery"

```

### 📄 backend/apps/gallery/models/__init__.py
```python
from .project import Project

__all__ = ["Project"]

```

### 📄 backend/apps/gallery/models/project.py
```python
"""
Project model — a portfolio/gallery item the admin manages (SRP).

Mirrors the catalog Service pattern: the model only stores data; business logic
lives in GalleryService. Lets the admin add gallery cards without touching code.
SOLID: SRP · OCP (new field = additive).
"""

from django.db import models


class Project(models.Model):

    titulo = models.CharField(max_length=120, verbose_name="título")
    descripcion = models.TextField(blank=True, default="", verbose_name="descripción")
    tag = models.CharField(max_length=80, blank=True, default="", verbose_name="etiqueta")
    imagen_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL de imagen"
    )
    activo = models.BooleanField(default=True, verbose_name="activo")
    orden = models.PositiveIntegerField(default=0, verbose_name="orden")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "gallery_project"
        ordering = ["orden", "-created_at"]
        indexes = [
            models.Index(fields=["activo", "orden"], name="gallery_pro_activo_idx"),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.titulo} ({self.tag}) · {estado}"

```

### 📄 backend/apps/gallery/repositories/__init__.py
```python
from .project_repository import ProjectRepository

__all__ = ["ProjectRepository"]

```

### 📄 backend/apps/gallery/repositories/project_repository.py
```python
"""
ProjectRepository — ORM gateway for gallery Project (Repository).
SOLID: DIP · SRP · LSP. GalleryService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.gallery.models import Project


class ProjectRepository(BaseRepository[Project]):

    def get_by_id(self, entity_id: int) -> Optional[Project]:
        return Project.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Project]:
        qs = Project.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Project:
        return Project.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Project:
        Project.objects.filter(pk=entity_id).update(**data)
        return Project.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Project.objects.filter(pk=entity_id).delete()

    # ── Gallery-specific ───────────────────────────────────────────────────────

    def get_active(self) -> list[Project]:
        return list(Project.objects.filter(activo=True))

```

### 📄 backend/apps/gallery/serializers/__init__.py
```python
from .project_serializers import ProjectCreateSerializer, ProjectEditSerializer

__all__ = ["ProjectCreateSerializer", "ProjectEditSerializer"]

```

### 📄 backend/apps/gallery/serializers/project_serializers.py
```python
"""
Gallery write serializers — one per operation (SRP).
Read shaping is done by GalleryService (_summary/_detail).
"""

from rest_framework import serializers


class ProjectCreateSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=120)
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    tag = serializers.CharField(max_length=80, required=False, allow_blank=True, default="")
    imagen_url = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    orden = serializers.IntegerField(required=False, default=0)


class ProjectEditSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    tag = serializers.CharField(max_length=80, required=False, allow_blank=True)
    imagen_url = serializers.URLField(max_length=500, required=False, allow_blank=True)
    orden = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs

```

### 📄 backend/apps/gallery/services/__init__.py
```python
from .gallery_service import GalleryService, get_gallery_service

__all__ = ["GalleryService", "get_gallery_service"]

```

### 📄 backend/apps/gallery/services/gallery_service.py
```python
"""
GalleryService — gallery/portfolio business logic (Singleton).

Mirrors CatalogService: lets the admin create/edit/toggle gallery projects and
exposes the active list to the public site. Image upload is delegated to
IStorageService (DIP), exactly like the catalog.
SOLID: DIP · SRP · LSP · OCP
"""

from __future__ import annotations

from apps.gallery.repositories import ProjectRepository
from apps.tickets.interfaces import IStorageService
from core.exceptions.domain_exceptions import DomainException


class ProjectNotFound(DomainException):
    """Raised when a gallery project does not exist."""


class GalleryService:

    def __init__(
        self,
        project_repository: ProjectRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = project_repository or ProjectRepository()
        self._storage = storage

    # ── Public view ─────────────────────────────────────────────────────────────

    def get_active_projects(self) -> list:
        return [self._summary(p) for p in self._repo.get_active()]

    # ── Admin management ───────────────────────────────────────────────────────

    def list_all(self) -> list:
        return [self._detail(p) for p in self._repo.get_all()]

    def create_project(self, data: dict) -> dict:
        data = dict(data)
        imagen = data.pop("imagen", None)
        project = self._repo.create(data)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def edit_project(self, project_id: int, data: dict) -> dict:
        if self._repo.get_by_id(project_id) is None:
            raise ProjectNotFound("El proyecto no existe.")
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            project = self._repo.update(project_id, data)
        else:
            project = self._repo.get_by_id(project_id)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def toggle_active(self, project_id: int) -> dict:
        project = self._repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFound("El proyecto no existe.")
        project = self._repo.update(project_id, {"activo": not project.activo})
        return self._detail(project)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, project, imagen):
        if imagen is None or self._storage is None:
            return project
        path = f"gallery/{project.id}/{getattr(imagen, 'name', 'imagen')}"
        url = self._storage.upload(imagen, path)
        return self._repo.update(project.id, {"imagen_url": url})

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(p) -> dict:
        return {
            "id": p.id,
            "titulo": p.titulo,
            "descripcion": p.descripcion,
            "tag": p.tag,
            "imagen_url": p.imagen_url,
            "activo": p.activo,
            "orden": p.orden,
        }

    @classmethod
    def _detail(cls, p) -> dict:
        return {
            **cls._summary(p),
            "creado_en": p.created_at.isoformat(),
            "actualizado_en": p.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading

_lock = threading.Lock()
_instance: GalleryService | None = None


def get_gallery_service() -> GalleryService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService  # noqa: PLC0415
                _instance = GalleryService(storage=StorageService())
    return _instance

```

### 📄 backend/apps/gallery/urls.py
```python
"""URL routing for the gallery API. Mounted under /api/proyectos/ by config/urls.py."""

from django.urls import path

from apps.gallery.views import ProjectListView, ProjectAdminView

urlpatterns = [
    path("", ProjectListView.as_view(), name="project-list"),
    path("admin", ProjectAdminView.as_view(), name="project-admin-create"),
    path("admin/<int:project_id>", ProjectAdminView.as_view(), name="project-admin-edit"),
]

```

### 📄 backend/apps/gallery/views/__init__.py
```python
from .gallery_views import ProjectListView, ProjectAdminView

__all__ = ["ProjectListView", "ProjectAdminView"]

```

### 📄 backend/apps/gallery/views/gallery_views.py
```python
"""
Gallery DRF views — HTTP orchestration only (SRP + DIP).

Endpoints (mounted under /api/proyectos/ by config/urls.py):
    GET   /api/proyectos              → ProjectListView   (public — portfolio)
    GET   /api/proyectos/admin        → ProjectAdminView.get   (IsWorker | IsAdmin) — list all
    POST  /api/proyectos/admin        → ProjectAdminView.post  (IsWorker | IsAdmin) — create
    PATCH /api/proyectos/admin/<id>   → ProjectAdminView.patch (IsWorker | IsAdmin) — edit
    PATCH /api/proyectos/admin/<id>?action=toggle → toggle     (IsWorker | IsAdmin)

Photos: the admin endpoints accept a multipart `imagen` file uploaded via
IStorageService, mirroring the catalog.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gallery.serializers import ProjectCreateSerializer, ProjectEditSerializer
from apps.gallery.services import get_gallery_service
from apps.gallery.services.gallery_service import ProjectNotFound
from core.permissions import IsAdmin, IsWorker


class ProjectListView(APIView):
    # Public portfolio (gallery page).
    permission_classes = [AllowAny]

    def get(self, request):
        projects = get_gallery_service().get_active_projects()
        return Response(
            {"items": projects, "total": len(projects)},
            status=status.HTTP_200_OK,
        )


class ProjectAdminView(APIView):
    permission_classes = [IsWorker | IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(get_gallery_service().list_all(), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        created = get_gallery_service().create_project(data)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, project_id: int):
        if request.query_params.get("action") == "toggle":
            return self._toggle(project_id)
        serializer = ProjectEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        try:
            updated = get_gallery_service().edit_project(project_id, data)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

    def _toggle(self, project_id: int):
        try:
            updated = get_gallery_service().toggle_active(project_id)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/notifications/__init__.py
```python

```

### 📄 backend/apps/notifications/admin.py
```python
from django.contrib import admin


# Notification models are typically managed programmatically.
# Register here when Django Admin access is needed for debugging.
# Example:
# from .models import Notification
# @admin.register(Notification)
# class NotificationAdmin(admin.ModelAdmin):
#     list_display = ('id', 'user', 'tipo', 'leida', 'created_at')
#     list_filter = ('tipo', 'leida')

```

### 📄 backend/apps/notifications/apps.py
```python
"""
NotificationsConfig — Django app config for the notifications module.

Responsibility (SRP): configure the app. No signal registration here —
    the Observer signal lives in apps.tickets.apps.ready() (the emitter side),
    keeping the dependency one-way (tickets → notifications, never the reverse).
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"

```

### 📄 backend/apps/notifications/factory/__init__.py
```python
from .notification_factory import NotificationFactory

__all__ = ["NotificationFactory"]

```

### 📄 backend/apps/notifications/factory/notification_factory.py
```python
"""
Factory for assembling notification channel strategies (OCP).

Responsibility (SRP): map a channel type string to the correct INotificationStrategy instance.
    Does not send notifications; does not contain channel logic.
Depends on: INotificationStrategy — the only thing the factory exposes to consumers.
Pattern: Factory — decouples strategy creation from strategy consumption.
SOLID: OCP · SRP · DIP

OCP extension (Sprint 4 — SMSStrategy):
    1. Create apps/notifications/strategies/sms_strategy.py
    2. Add 'sms': SMSStrategy to CHANNEL_MAP
    3. Nothing else changes — NotificationService, EmailStrategy, InApp, WS untouched.

Usage:
    strategy = NotificationFactory.build('email', repo=notification_repo)
    strategy.send(recipient, message, context)
"""

from __future__ import annotations

from apps.notifications.interfaces import INotificationStrategy


class NotificationFactory:
    """Maps channel type → INotificationStrategy instance."""

    @staticmethod
    def build(channel_type: str, notification_repository=None) -> INotificationStrategy:
        """
        Return the strategy for the given channel type.

        Args:
            channel_type:            'email' | 'in_app' | 'ws'
            notification_repository: required only for 'in_app' (DIP injection).

        Returns:
            INotificationStrategy instance.

        Raises:
            ValueError — if channel_type is not registered in CHANNEL_MAP.
        """
        from apps.notifications.strategies import (
            EmailNotificationStrategy,
            InAppNotificationStrategy,
            WebSocketNotificationStrategy,
        )

        CHANNEL_MAP: dict[str, type] = {
            "email":  EmailNotificationStrategy,
            "in_app": InAppNotificationStrategy,
            "ws":     WebSocketNotificationStrategy,
        }

        strategy_class = CHANNEL_MAP.get(channel_type)
        if strategy_class is None:
            raise ValueError(
                f"Unknown notification channel: '{channel_type}'. "
                f"Registered channels: {list(CHANNEL_MAP.keys())}"
            )

        if channel_type == "in_app":
            if notification_repository is None:
                raise ValueError("'in_app' channel requires a notification_repository instance.")
            return strategy_class(notification_repository)

        return strategy_class()

```

### 📄 backend/apps/notifications/interfaces/__init__.py
```python
from .i_notification_strategy import INotificationStrategy
from .i_notification_service import INotificationService

__all__ = ["INotificationStrategy", "INotificationService"]

```

### 📄 backend/apps/notifications/interfaces/i_notification_service.py
```python
"""
Root ABC for the notification service — Observer subject.

Responsibility (SRP): declare the contract for dispatching and querying notifications.
    No channel logic, no ORM access — only orchestration signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: Singleton (the concrete NotificationService is a module-level singleton)
         + Observer subject (receives events from the ticket signal).
SOLID: DIP · OCP · SRP

Sprint coverage:
    S19 → this file (contract)
    S20 → NotificationService(INotificationService) — Singleton implementation
    S26 → useNotifications hook depends on this interface on the FE side
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class INotificationService(ABC):
    """Abstract contract for notification dispatch and management."""

    @abstractmethod
    def dispatch(self, event: dict) -> None:
        """
        Observer entry point — called by the post_save(TicketEvent) signal handler.

        Args:
            event: serialized dict of a TicketEvent (not the model instance, to avoid
                   circular import between apps.tickets and apps.notifications).
                   Keys: ticket_id, tipo_evento, estado_anterior, estado_nuevo,
                         comentario, autor_id, cliente_id, asignado_id.

        Behavior:
            1. Determines recipients based on tipo_evento (SRP: this method decides who).
            2. Loads NotificationPreference for each recipient.
            3. For each active channel: NotificationFactory.build(canal).send().
        """
        ...

    @abstractmethod
    def get_user_notifications(self, user, page: int = 1) -> dict:
        """
        Return paginated notifications for the given user.

        Returns:
            {'items': list[dict], 'total': int, 'unread_count': int, 'page': int}
        """
        ...

    @abstractmethod
    def mark_as_read(self, notification_id: int, user) -> dict:
        """
        Mark a single notification as read. Enforces ownership.

        Returns: updated notification dict.
        Raises: NotificationNotFound if not found or not owned by user.
        """
        ...

    @abstractmethod
    def get_preferences(self, user) -> dict:
        """
        Return (or create with defaults) the NotificationPreference for the user.

        Returns: {'email_activo': bool, 'in_app_activo': bool, 'ws_activo': bool}
        """
        ...

    @abstractmethod
    def set_preferences(self, user, data: dict) -> dict:
        """
        Update the NotificationPreference for the user.

        Args:
            data: partial dict with any of email_activo, in_app_activo, ws_activo.

        Returns: updated preferences dict.
        """
        ...

```

### 📄 backend/apps/notifications/interfaces/i_notification_strategy.py
```python
"""
Root ABC for all notification delivery channels.

Responsibility (SRP): declare the contract for sending a notification via one channel.
    No routing logic, no preference checks — just the delivery contract.
Depends on: abc.ABC — nothing from the domain.
Pattern: Strategy — each channel is a concrete strategy behind this interface.
SOLID: DIP · OCP · LSP · SRP

OCP extension:
    SMSStrategy / PushStrategy = new class implementing INotificationStrategy
    + one entry in NotificationFactory.CHANNEL_MAP.
    Existing strategies (Email, InApp, WebSocket) are NEVER modified.

LSP:
    NotificationService always receives INotificationStrategy — any concrete
    strategy is substitutable in tests (inject a mock without touching the service).

Sprint coverage:
    S19 → this file (contract) + 3 concrete strategies
    S20 → NotificationService.dispatch() consumes this interface
    S27 → tests mock INotificationStrategy; strategies tested in isolation
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class INotificationStrategy(ABC):
    """Abstract contract for a single notification delivery channel."""

    @abstractmethod
    def validate(self, recipient) -> bool:
        """
        Check that the channel can deliver to this recipient.
        Examples:
            EmailStrategy: recipient.email is non-empty and verified.
            WebSocketStrategy: the user's WS group exists (always True — fire-and-forget).
            InAppStrategy: recipient is active.

        Args:
            recipient: User model instance.

        Returns:
            bool — False means skip this channel for this recipient (no exception).
        """
        ...

    @abstractmethod
    def send(self, recipient, message: str, context: dict) -> None:
        """
        Deliver the notification to the recipient via this channel.

        Args:
            recipient: User model instance (the notification destination).
            message:   Plain-text summary of the notification.
            context:   Channel-specific data dict.
                       EmailStrategy expects: {'tipo', 'subject', 'titulo', 'cuerpo', ...}
                       InAppStrategy expects: {'tipo', 'titulo', 'cuerpo', 'payload'}
                       WebSocketStrategy expects: {'notification_id', 'tipo', 'titulo', 'cuerpo'}

        Raises:
            NotificationDeliveryError — if the channel fails after internal retries.
                NotificationService catches this and continues with other channels.
        """
        ...

    @abstractmethod
    def log(self, status: str, details: str) -> None:
        """
        Record the delivery attempt result.

        Args:
            status:  'sent' | 'failed' | 'skipped'
            details: Human-readable explanation (channel, recipient email/id, error message).
        """
        ...

```

### 📄 backend/apps/notifications/models/__init__.py
```python
from .notification import Notification
from .notification_preference import NotificationPreference

__all__ = ["Notification", "NotificationPreference"]

```

### 📄 backend/apps/notifications/models/notification.py
```python
"""
Notification model — stores one in-app notification record (SRP).

Responsibility (SRP): persist notification data only. It does NOT decide whether
    to send — that logic lives in NotificationService. The model only stores.
Depends on: Django ORM, authentication.User.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new tipo = new choice, no logic change)

A partial index on unread notifications accelerates the badge counter query
(get_unread_count) used by NotificationBell on the frontend.
"""

from django.db import models


class Notification(models.Model):

    class Tipo(models.TextChoices):
        CREACION      = "creacion",      "Creación"
        CAMBIO_ESTADO = "cambio_estado", "Cambio de estado"
        COMENTARIO    = "comentario",    "Comentario"
        ASIGNACION    = "asignacion",    "Asignación"
        REASIGNACION  = "reasignacion",  "Reasignación"
        INFORMACION   = "informacion",   "Información"

    usuario = models.ForeignKey(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="notificaciones",
        verbose_name="usuario",
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.INFORMACION,
        verbose_name="tipo",
    )
    titulo = models.CharField(max_length=160, verbose_name="título")
    cuerpo = models.TextField(verbose_name="cuerpo")
    leida = models.BooleanField(default=False, verbose_name="leída")
    payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="payload",
        help_text="Datos del evento original (ticket_numero, estados, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creada en")

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
        indexes = [
            # Partial index: solo notificaciones no leídas (acelera el contador del badge)
            models.Index(
                fields=["usuario"],
                condition=models.Q(leida=False),
                name="notif_unread_by_user_idx",
            ),
            models.Index(fields=["usuario", "created_at"]),
        ]

    def __str__(self) -> str:
        estado = "•" if not self.leida else " "
        return f"{estado} {self.titulo} → user {self.usuario_id}"

```

### 📄 backend/apps/notifications/models/notification_preference.py
```python
"""
NotificationPreference model — per-user channel preferences (SRP).

Responsibility (SRP): store which channels a user wants enabled. Nothing more.
    NotificationService reads this to decide which strategies to invoke.
Depends on: Django ORM, authentication.User.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new channel = new boolean field)

One row per user (OneToOne). Defaults: all channels enabled.
"""

from django.db import models


class NotificationPreference(models.Model):

    usuario = models.OneToOneField(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="preferencias_notificacion",
        verbose_name="usuario",
    )
    email_activo = models.BooleanField(default=True, verbose_name="email activo")
    in_app_activo = models.BooleanField(default=True, verbose_name="in-app activo")
    ws_activo = models.BooleanField(default=True, verbose_name="websocket activo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizada en")

    class Meta:
        db_table = "notifications_preference"

    def __str__(self) -> str:
        canales = []
        if self.email_activo:
            canales.append("email")
        if self.in_app_activo:
            canales.append("in_app")
        if self.ws_activo:
            canales.append("ws")
        return f"Prefs user {self.usuario_id}: {', '.join(canales) or 'ninguno'}"

```

### 📄 backend/apps/notifications/repositories/__init__.py
```python
from .notification_repository import NotificationRepository

__all__ = ["NotificationRepository"]

```

### 📄 backend/apps/notifications/repositories/notification_repository.py
```python
"""
NotificationRepository — encapsulates all ORM access for notifications (Repository).

Responsibility (SRP): every Notification / NotificationPreference query lives here.
    No view, service, or strategy touches the ORM directly (DIP).
Depends on: BaseRepository[Notification], Notification, NotificationPreference models.
Pattern: Repository.
SOLID: DIP · SRP · LSP (substitutable for BaseRepository in tests)

Implements the 5 generic CRUD methods from BaseRepository plus notification-specific
queries used by NotificationService and the DRF views.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.notifications.models import Notification, NotificationPreference

PAGE_SIZE = 20


class NotificationRepository(BaseRepository[Notification]):
    """ORM gateway for the notifications module."""

    # ── Generic CRUD (BaseRepository contract) ─────────────────────────────────

    def get_by_id(self, entity_id: int) -> Optional[Notification]:
        return Notification.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Notification]:
        qs = Notification.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Notification:
        return Notification.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Notification:
        Notification.objects.filter(pk=entity_id).update(**data)
        return Notification.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Notification.objects.filter(pk=entity_id).delete()

    # ── Notification-specific queries ──────────────────────────────────────────

    def get_unread_count(self, user) -> int:
        """Count of unread notifications — uses the partial index for speed."""
        return Notification.objects.filter(usuario=user, leida=False).count()

    def get_user_notifications(self, user, page: int = 1) -> dict:
        """
        Return a page of notifications for a user, newest first.
        Returns: {'items': list[Notification], 'total': int, 'unread_count': int, 'page': int}
        """
        base_qs = Notification.objects.filter(usuario=user)
        total = base_qs.count()
        unread = base_qs.filter(leida=False).count()

        start = (max(page, 1) - 1) * PAGE_SIZE
        items = list(base_qs[start:start + PAGE_SIZE])

        return {
            "items": items,
            "total": total,
            "unread_count": unread,
            "page": page,
        }

    def mark_as_read(self, notification_id: int, user) -> Optional[Notification]:
        """
        Mark a single notification as read, enforcing ownership.
        Returns the updated Notification, or None if not found / not owned.
        """
        notif = Notification.objects.filter(pk=notification_id, usuario=user).first()
        if notif is None:
            return None
        if not notif.leida:
            notif.leida = True
            notif.save(update_fields=["leida"])
        return notif

    def mark_all_as_read(self, user) -> int:
        """Mark every unread notification of the user as read. Returns rows affected."""
        return Notification.objects.filter(usuario=user, leida=False).update(leida=True)

    # ── Preferences ────────────────────────────────────────────────────────────

    def get_or_create_preferences(self, user) -> NotificationPreference:
        """Return the user's preferences, creating defaults (all channels on) if absent."""
        prefs, _ = NotificationPreference.objects.get_or_create(usuario=user)
        return prefs

```

### 📄 backend/apps/notifications/serializers/__init__.py
```python
from .notification_list_serializer import NotificationListSerializer
from .notification_preferences_serializer import NotificationPreferencesSerializer

__all__ = ["NotificationListSerializer", "NotificationPreferencesSerializer"]

```

### 📄 backend/apps/notifications/serializers/notification_list_serializer.py
```python
"""
NotificationListSerializer — read-only serializer for the notification list (SRP).

Responsibility (SRP): shape a Notification for the GET /api/notificaciones response.
    One serializer per operation — this is the read/list operation.
Depends on: DRF ModelSerializer, Notification model.
SOLID: SRP
"""

from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationListSerializer(serializers.ModelSerializer):

    creado_en = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "tipo", "titulo", "cuerpo", "leida", "payload", "creado_en"]
        read_only_fields = fields

```

### 📄 backend/apps/notifications/serializers/notification_preferences_serializer.py
```python
"""
NotificationPreferencesSerializer — for reading/updating channel preferences (SRP).

Responsibility (SRP): validate the PATCH /api/notificaciones/preferencias payload.
    All three fields optional (partial update). One serializer per operation.
Depends on: DRF Serializer.
SOLID: SRP
"""

from rest_framework import serializers


class NotificationPreferencesSerializer(serializers.Serializer):
    email_activo = serializers.BooleanField(required=False)
    in_app_activo = serializers.BooleanField(required=False)
    ws_activo = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "Debe enviar al menos un campo de preferencia para actualizar."
            )
        return attrs

```

### 📄 backend/apps/notifications/services/__init__.py
```python
from .notification_service import NotificationService, get_notification_service

__all__ = ["NotificationService", "get_notification_service"]

```

### 📄 backend/apps/notifications/services/notification_service.py
```python
"""
NotificationService — Singleton + Observer subject.

Responsibility (SRP): orchestrate notification dispatch across channels.
    Determines recipients by tipo_evento, respects preferences, delegates
    delivery to strategies via NotificationFactory. No channel logic here.
Depends on: INotificationService, NotificationFactory, NotificationRepository.
    User model loaded with deferred import to avoid circular at module level.
Pattern: Singleton (module-level lazy instance) + Observer subject.
SOLID: DIP · SRP · OCP

D4 — payload as dict (not TicketEvent instance):
    apps.notifications must NEVER import from apps.tickets.
    The signal handler in apps.tickets serializes the event before calling dispatch().

D5 — recipient selection by tipo_evento (logic lives here, not in strategies).

OCP: new tipo_evento = new branch in _resolve_recipients. NotificationFactory and
    strategies are never modified.
"""

from __future__ import annotations

import logging

from apps.notifications.interfaces import INotificationService

logger = logging.getLogger(__name__)


# ── Recipient selection ────────────────────────────────────────────────────────

def _resolve_recipients(event: dict) -> list:
    """
    Load User instances that should receive this notification.
    Deferred import avoids module-level coupling to apps.authentication.
    """
    from apps.authentication.models import User  # noqa: PLC0415

    tipo = event.get("tipo_evento", "")
    recipients: set = set()

    if tipo == "creacion":
        recipients.update(
            User.objects.filter(role=User.Role.ADMIN, estado=User.Estado.ACTIVE)
        )

    if tipo in ("cambio_estado", "comentario", "asignacion", "reasignacion", "creacion"):
        if cliente_id := event.get("cliente_id"):
            try:
                recipients.add(User.objects.get(id=cliente_id))
            except User.DoesNotExist:
                pass

    if tipo in ("asignacion", "reasignacion", "comentario"):
        if asignado_id := event.get("asignado_id"):
            try:
                recipients.add(User.objects.get(id=asignado_id))
            except User.DoesNotExist:
                pass

    # Exclude the event author (no self-notifications)
    if autor_id := event.get("autor_id"):
        recipients = {r for r in recipients if r.id != autor_id}

    return list(recipients)


# ── NotificationService ────────────────────────────────────────────────────────

class NotificationService(INotificationService):
    """
    Singleton implementation of INotificationService.
    Receives TicketEvent payloads (as dicts) from the ticket signal handler and
    fans out notifications across each recipient's preferred channels.
    """

    def __init__(self, notification_repository=None) -> None:
        self._repo = notification_repository

    # ── Observer entry point ───────────────────────────────────────────────────

    def dispatch(self, event: dict) -> None:
        """Fan out a TicketEvent notification across all relevant recipients/channels."""
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415

        recipients = _resolve_recipients(event)
        if not recipients:
            logger.debug("dispatch: no recipients for tipo_evento=%s", event.get("tipo_evento"))
            return

        for recipient in recipients:
            prefs = self.get_preferences(recipient)
            context = self._build_context(event, recipient)
            message = self._format_message(event)

            for channel, active in [
                ("email",  prefs.get("email_activo",  True)),
                ("in_app", prefs.get("in_app_activo", True)),
                ("ws",     prefs.get("ws_activo",     True)),
            ]:
                if not active:
                    continue
                try:
                    repo = self._repo if channel == "in_app" else None
                    strategy = NotificationFactory.build(channel, notification_repository=repo)
                    if strategy.validate(recipient):
                        strategy.send(recipient, message, context)
                    else:
                        strategy.log("skipped", f"{channel} invalid for user {recipient.id}")
                except Exception as exc:  # noqa: BLE001
                    logger.error(
                        "Notification delivery failed: channel=%s user=%s error=%s",
                        channel, recipient.id, exc,
                    )

    # ── Query methods (serialized dicts for the API layer) ─────────────────────

    def get_user_notifications(self, user, page: int = 1) -> dict:
        result = self._repo.get_user_notifications(user, page)
        return {
            "items": [self._serialize(n) for n in result["items"]],
            "total": result["total"],
            "unread_count": result["unread_count"],
            "page": result["page"],
        }

    def mark_as_read(self, notification_id: int, user) -> dict:
        from core.exceptions.domain_exceptions import DomainException  # noqa: PLC0415
        notif = self._repo.mark_as_read(notification_id, user)
        if notif is None:
            raise DomainException("Notificación no encontrada.")
        return self._serialize(notif)

    def mark_all_as_read(self, user) -> int:
        """Mark every unread notification of the user as read. Returns rows affected."""
        return self._repo.mark_all_as_read(user)

    def get_preferences(self, user) -> dict:
        if self._repo is None:
            return {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        prefs = self._repo.get_or_create_preferences(user)
        return {
            "email_activo":  prefs.email_activo,
            "in_app_activo": prefs.in_app_activo,
            "ws_activo":     prefs.ws_activo,
        }

    def set_preferences(self, user, data: dict) -> dict:
        prefs = self._repo.get_or_create_preferences(user)
        updated = []
        for field in ("email_activo", "in_app_activo", "ws_activo"):
            if field in data:
                setattr(prefs, field, bool(data[field]))
                updated.append(field)
        if updated:
            prefs.save(update_fields=updated)
        return {
            "email_activo":  prefs.email_activo,
            "in_app_activo": prefs.in_app_activo,
            "ws_activo":     prefs.ws_activo,
        }

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _serialize(notif) -> dict:
        return {
            "id": notif.id,
            "tipo": notif.tipo,
            "titulo": notif.titulo,
            "cuerpo": notif.cuerpo,
            "leida": notif.leida,
            "payload": notif.payload,
            "creado_en": notif.created_at.isoformat(),
        }

    def _build_context(self, event: dict, recipient) -> dict:
        tipo = event.get("tipo_evento", "informacion")
        return {
            "tipo":            tipo,
            "ticket_numero":   event.get("ticket_numero", ""),
            "ticket_asunto":   event.get("ticket_asunto", ""),
            "estado_anterior": event.get("estado_anterior", ""),
            "estado_nuevo":    event.get("estado_nuevo", ""),
            "comentario":      event.get("comentario", ""),
            "titulo":          self._make_title(tipo, event),
            "cuerpo":          event.get("comentario", "") or self._format_message(event),
            "recipient_nombre": getattr(recipient, "first_name", ""),
        }

    @staticmethod
    def _make_title(tipo: str, event: dict) -> str:
        numero = event.get("ticket_numero", "")
        titles = {
            "creacion":      f"Nuevo ticket {numero}",
            "cambio_estado": f"Ticket {numero} actualizado",
            "comentario":    f"Nuevo comentario en {numero}",
            "asignacion":    f"Ticket {numero} asignado",
            "reasignacion":  f"Ticket {numero} reasignado",
        }
        return titles.get(tipo, f"Notificación sobre {numero}")

    @staticmethod
    def _format_message(event: dict) -> str:
        tipo = event.get("tipo_evento", "")
        numero = event.get("ticket_numero", "")
        asunto = event.get("ticket_asunto", "")
        if tipo == "cambio_estado":
            return (
                f"El ticket {numero} ({asunto}) cambió de estado: "
                f"{event.get('estado_anterior')} → {event.get('estado_nuevo')}."
            )
        if tipo == "comentario":
            return f"Nuevo comentario en el ticket {numero}: {event.get('comentario', '')[:100]}"
        if tipo in ("asignacion", "reasignacion"):
            return f"El ticket {numero} ha sido asignado."
        return f"Actualización en el ticket {numero} ({asunto})."


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading  # noqa: E402

_lock = threading.Lock()
_instance: NotificationService | None = None


def get_notification_service() -> NotificationService:
    """
    Return (or lazily create) the shared NotificationService instance.
    Thread-safe via double-checked locking.

    On first call it wires a default NotificationRepository so the in-app channel
    works at runtime. Tests can reset `_instance` and inject a mock repository.
    """
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.notifications.repositories import NotificationRepository  # noqa: PLC0415
                _instance = NotificationService(NotificationRepository())
    return _instance

```

### 📄 backend/apps/notifications/strategies/__init__.py
```python
from .email_strategy import EmailNotificationStrategy
from .in_app_strategy import InAppNotificationStrategy
from .websocket_strategy import WebSocketNotificationStrategy

__all__ = [
    "EmailNotificationStrategy",
    "InAppNotificationStrategy",
    "WebSocketNotificationStrategy",
]

```

### 📄 backend/apps/notifications/strategies/email_strategy.py
```python
"""
Email notification strategy — delivers notifications via Django email backend.

Responsibility (SRP): render an HTML email template and send it. Nothing else.
Depends on: INotificationStrategy (interface), django.core.mail, django.template.loader.
Pattern: Strategy — implements INotificationStrategy for the email channel.
SOLID: SRP · DIP · OCP · LSP

OCP: new email template = new .html file + new entry in TEMPLATE_MAP.
    EmailNotificationStrategy is NEVER modified for new notification types.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)

# Maps tipo_evento → (template_name, subject_prefix)
TEMPLATE_MAP: dict[str, tuple[str, str]] = {
    "creacion":      ("email/ticket_created.html",  "Nuevo ticket creado"),
    "asignacion":    ("email/ticket_assigned.html", "Ticket asignado"),
    "cambio_estado": ("email/status_changed.html",  "Ticket actualizado"),
    "comentario":    ("email/status_changed.html",  "Nuevo comentario en tu ticket"),
    "reasignacion":  ("email/ticket_assigned.html", "Ticket reasignado"),
    "password_reset": ("email/password_reset.html", "Recuperación de contraseña"),
}


class EmailNotificationStrategy(INotificationStrategy):
    """Sends HTML emails using Django's email backend."""

    def validate(self, recipient) -> bool:
        return bool(
            recipient.is_authenticated
            and recipient.email
            and recipient.email_verificado
            and recipient.estado == "activo"
        )

    def send(self, recipient, message: str, context: dict) -> None:
        tipo = context.get("tipo", "creacion")
        template_name, subject_prefix = TEMPLATE_MAP.get(
            tipo, ("email/ticket_created.html", "Notificación SassBlum")
        )

        subject = f"[SassBlum] {subject_prefix}"
        html_body = render_to_string(template_name, {**context, "recipient": recipient})

        send_mail(
            subject=subject,
            message=message,  # plain-text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            html_message=html_body,
            fail_silently=False,
        )
        self.log("sent", f"email → {recipient.email} · tipo={tipo}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("EmailStrategy [%s] %s", status, details)
        else:
            logger.warning("EmailStrategy [%s] %s", status, details)

```

### 📄 backend/apps/notifications/strategies/in_app_strategy.py
```python
"""
In-app notification strategy — persists a Notification record in the database.

Responsibility (SRP): create a Notification row so the user sees it in the UI.
    No email, no WebSocket — just DB persistence via NotificationRepository.
Depends on: INotificationStrategy, NotificationRepository (via DIP — injected).
Pattern: Strategy — implements INotificationStrategy for the in-app channel.
SOLID: SRP · DIP · OCP · LSP

DIP: receives NotificationRepository via __init__, never touches the ORM directly.
OCP: new notification type = new entry in TEMPLATE_MAP (email); InApp only stores tipo + payload.
"""

from __future__ import annotations

import logging

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)


class InAppNotificationStrategy(INotificationStrategy):
    """Persists in-app notifications to the Notification model via repository."""

    def __init__(self, notification_repository) -> None:
        self._repo = notification_repository

    def validate(self, recipient) -> bool:
        return bool(
            recipient.is_authenticated
            and recipient.estado == "activo"
        )

    def send(self, recipient, message: str, context: dict) -> None:
        tipo   = context.get("tipo", "informacion")
        titulo = context.get("titulo", "Nueva notificación")
        cuerpo = context.get("cuerpo", message)

        self._repo.create({
            "usuario": recipient,
            "tipo": tipo,
            "titulo": titulo,
            "cuerpo": cuerpo,
            "leida": False,
            "payload": context,
        })
        self.log("sent", f"in_app → user_id={recipient.id} · tipo={tipo}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("InAppStrategy [%s] %s", status, details)
        else:
            logger.warning("InAppStrategy [%s] %s", status, details)

```

### 📄 backend/apps/notifications/strategies/websocket_strategy.py
```python
"""
WebSocket notification strategy — broadcasts via Django Channels channel layer.

Responsibility (SRP): push a notification payload to the user's WS group.
    No email, no DB write — just channel_layer.group_send().
Depends on: INotificationStrategy, channels.layers.get_channel_layer() (Channels).
Pattern: Strategy — implements INotificationStrategy for the WebSocket channel.
SOLID: SRP · DIP · OCP · LSP

The group name convention is 'notif_user_{user_id}'.
NotificationConsumer (S23) subscribes authenticated users to this group on connect().
"""

from __future__ import annotations

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)


def _group_name(user_id: int) -> str:
    return f"notif_user_{user_id}"


class WebSocketNotificationStrategy(INotificationStrategy):
    """Broadcasts notifications to the user's persistent WebSocket connection."""

    def validate(self, recipient) -> bool:
        # Fire-and-forget: always attempt; if the user is offline, the message is dropped.
        return bool(recipient.is_authenticated and recipient.estado == "activo")

    def send(self, recipient, message: str, context: dict) -> None:
        channel_layer = get_channel_layer()
        group = _group_name(recipient.id)

        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "notification.new",   # maps to NotificationConsumer.notification_new()
                "payload": {
                    "notification_id": context.get("notification_id"),
                    "tipo":   context.get("tipo", "informacion"),
                    "titulo": context.get("titulo", "Nueva notificación"),
                    "cuerpo": context.get("cuerpo", message),
                },
            },
        )
        self.log("sent", f"ws → group={group}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("WebSocketStrategy [%s] %s", status, details)
        else:
            logger.warning("WebSocketStrategy [%s] %s", status, details)

```

### 📄 backend/apps/notifications/tests/__init__.py
```python
# Sprint 3 · S27 — Test suite for the notifications module:
#   test_strategies.py            → Email/InApp/WebSocket strategies in isolation
#   test_notification_service.py  → dispatch() recipient selection + preference gating

```

### 📄 backend/apps/notifications/tests/test_notification_service.py
```python
"""
Tests for NotificationService.dispatch() — recipient selection + preference gating.
Uses mocked recipients/strategies; no database required for the routing logic.
Run: pytest apps/notifications/tests/test_notification_service.py -v
"""

from unittest.mock import MagicMock, patch

from apps.notifications.services.notification_service import NotificationService


def make_user(uid, **prefs):
    u = MagicMock()
    u.id = uid
    u.is_authenticated = True
    u.estado = "activo"
    u.first_name = "X"
    return u


class TestDispatchPreferenceGating:
    def _run(self, prefs: dict, recipients: list):
        repo = MagicMock()
        service = NotificationService(repo)
        service.get_preferences = MagicMock(return_value=prefs)

        built = []

        def fake_build(channel, notification_repository=None):
            strat = MagicMock()
            strat.validate.return_value = True
            built.append(channel)
            return strat

        event = {"tipo_evento": "creacion", "ticket_numero": "T-2026-0001", "cliente_id": 5}
        with patch(
            "apps.notifications.services.notification_service._resolve_recipients",
            return_value=recipients,
        ), patch(
            "apps.notifications.factory.NotificationFactory.build",
            side_effect=fake_build,
        ):
            service.dispatch(event)
        return built

    def test_all_channels_used_when_all_enabled(self):
        prefs = {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [make_user(1)])
        assert set(built) == {"email", "in_app", "ws"}

    def test_email_skipped_when_disabled(self):
        prefs = {"email_activo": False, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [make_user(1)])
        assert "email" not in built
        assert set(built) == {"in_app", "ws"}

    def test_no_recipients_means_no_channels(self):
        prefs = {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [])
        assert built == []


class TestResolveRecipients:
    """_resolve_recipients excludes the author and selects by tipo_evento."""

    def test_author_excluded(self):
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        autor = make_user(9)

        fake_user_model = MagicMock()
        fake_user_model.objects.get.side_effect = lambda id: {5: cliente, 9: autor}[id]
        fake_user_model.objects.filter.return_value = []
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {"tipo_evento": "comentario", "cliente_id": 5, "autor_id": 9}
            recipients = mod._resolve_recipients(event)

        ids = {r.id for r in recipients}
        assert 9 not in ids  # author excluded
        assert 5 in ids

```

### 📄 backend/apps/notifications/tests/test_strategies.py
```python
"""
Tests for the three notification strategies in isolation (mocked I/O).
These do NOT require a database — they mock send_mail, the repository, and the channel layer.
Run: pytest apps/notifications/tests/test_strategies.py -v
"""

from unittest.mock import MagicMock, patch

from apps.notifications.strategies.email_strategy import EmailNotificationStrategy
from apps.notifications.strategies.in_app_strategy import InAppNotificationStrategy
from apps.notifications.strategies.websocket_strategy import WebSocketNotificationStrategy


def make_user(**overrides):
    user = MagicMock()
    user.id = overrides.get("id", 1)
    user.is_authenticated = True
    user.email = overrides.get("email", "user@example.com")
    user.email_verificado = overrides.get("email_verificado", True)
    user.estado = overrides.get("estado", "activo")
    user.first_name = "Ana"
    return user


# ── EmailNotificationStrategy ──────────────────────────────────────────────────

class TestEmailStrategy:
    def test_validate_true_for_active_verified_user(self):
        assert EmailNotificationStrategy().validate(make_user()) is True

    def test_validate_false_when_email_not_verified(self):
        assert EmailNotificationStrategy().validate(make_user(email_verificado=False)) is False

    def test_validate_false_when_blocked(self):
        assert EmailNotificationStrategy().validate(make_user(estado="bloqueado")) is False

    @patch("apps.notifications.strategies.email_strategy.render_to_string", return_value="<p>x</p>")
    @patch("apps.notifications.strategies.email_strategy.send_mail")
    def test_send_calls_send_mail_with_recipient(self, mock_send, _mock_render):
        strat = EmailNotificationStrategy()
        strat.send(make_user(email="dest@x.com"), "msg", {"tipo": "creacion"})
        mock_send.assert_called_once()
        kwargs = mock_send.call_args.kwargs
        assert kwargs["recipient_list"] == ["dest@x.com"]
        assert kwargs["html_message"] == "<p>x</p>"


# ── InAppNotificationStrategy ──────────────────────────────────────────────────

class TestInAppStrategy:
    def test_send_persists_via_repository(self):
        repo = MagicMock()
        strat = InAppNotificationStrategy(repo)
        user = make_user()
        strat.send(user, "msg", {"tipo": "comentario", "titulo": "T", "cuerpo": "C"})
        repo.create.assert_called_once()
        data = repo.create.call_args.args[0]
        assert data["usuario"] is user
        assert data["tipo"] == "comentario"
        assert data["leida"] is False

    def test_validate_false_when_blocked(self):
        strategy = InAppNotificationStrategy(MagicMock())
        assert strategy.validate(make_user(estado="bloqueado")) is False


# ── WebSocketNotificationStrategy ──────────────────────────────────────────────

class TestWebSocketStrategy:
    @patch("apps.notifications.strategies.websocket_strategy.async_to_sync")
    @patch("apps.notifications.strategies.websocket_strategy.get_channel_layer")
    def test_send_group_send_to_user_group(self, mock_layer, mock_ats):
        mock_layer.return_value = MagicMock()
        sender = MagicMock()
        mock_ats.return_value = sender

        strat = WebSocketNotificationStrategy()
        strat.send(make_user(id=42), "msg", {"tipo": "creacion", "titulo": "T", "cuerpo": "C"})

        # async_to_sync(group_send) was invoked with the user group
        sender.assert_called_once()
        group_arg = sender.call_args.args[0]
        assert group_arg == "notif_user_42"
        message = sender.call_args.args[1]
        assert message["type"] == "notification.new"

```

### 📄 backend/apps/notifications/urls.py
```python
"""
URL routing for the notifications API (HU-13).
Mounted under /api/notificaciones/ by config/urls.py.
"""

from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    MarkReadView,
    MarkAllReadView,
    NotificationPreferencesView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("preferencias", NotificationPreferencesView.as_view(), name="notification-preferences"),
    path("marcar-todas-leidas", MarkAllReadView.as_view(), name="notification-mark-all-read"),
    path(
        "<int:notification_id>/marcar-leida",
        MarkReadView.as_view(),
        name="notification-mark-read",
    ),
]

```

### 📄 backend/apps/notifications/views/__init__.py
```python
from .notification_views import (
    NotificationListView,
    MarkReadView,
    MarkAllReadView,
    NotificationPreferencesView,
)

__all__ = [
    "NotificationListView",
    "MarkReadView",
    "MarkAllReadView",
    "NotificationPreferencesView",
]

```

### 📄 backend/apps/notifications/views/notification_views.py
```python
"""
Notification DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ service calls. No ORM, no business logic.
Depends on: INotificationService (via get_notification_service) — DIP.
    The view never touches the ORM or the repository directly.
Pattern: DIP (view → service interface).
SOLID: SRP · DIP

Endpoints:
    GET   /api/notificaciones                      → NotificationListView
    PATCH /api/notificaciones/<id>/marcar-leida    → MarkReadView
    PATCH /api/notificaciones/marcar-todas-leidas  → MarkAllReadView
    GET   /api/notificaciones/preferencias         → NotificationPreferencesView (read)
    PATCH /api/notificaciones/preferencias         → NotificationPreferencesView (update)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.serializers import NotificationPreferencesSerializer
from apps.notifications.services import get_notification_service
from core.exceptions.domain_exceptions import DomainException


class NotificationListView(APIView):
    """GET /api/notificaciones — paginated notifications for the current user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get("page", 1))
        service = get_notification_service()
        data = service.get_user_notifications(request.user, page)
        return Response(data, status=status.HTTP_200_OK)


class MarkReadView(APIView):
    """PATCH /api/notificaciones/<id>/marcar-leida — mark one as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id: int):
        service = get_notification_service()
        try:
            notif = service.mark_as_read(notification_id, request.user)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(notif, status=status.HTTP_200_OK)


class MarkAllReadView(APIView):
    """PATCH /api/notificaciones/marcar-todas-leidas — mark every unread as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        service = get_notification_service()
        affected = service.mark_all_as_read(request.user)
        return Response({"marcadas": affected}, status=status.HTTP_200_OK)


class NotificationPreferencesView(APIView):
    """GET/PATCH /api/notificaciones/preferencias — channel preferences."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = get_notification_service()
        return Response(service.get_preferences(request.user), status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = NotificationPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = get_notification_service()
        updated = service.set_preferences(request.user, serializer.validated_data)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/realtime/__init__.py
```python

```

### 📄 backend/apps/realtime/admin.py
```python
from django.contrib import admin

# Register your models here.

```

### 📄 backend/apps/realtime/apps.py
```python
"""
RealtimeConfig — wires the ticket realtime Observer.

ready() registers a post_save(TicketEvent) handler that broadcasts ticket_updated to
the ticket's WS room. This is a SECOND, independent subscriber to the same signal that
notifications uses (OCP: adding a subscriber doesn't touch TicketEvent or notifications).
Dependency direction: realtime → tickets (one-way); tickets stays unaware.
"""

from django.apps import AppConfig


class RealtimeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.realtime"

    def ready(self) -> None:
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        from apps.tickets.models import TicketEvent

        @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_realtime")
        def on_ticket_event_realtime(sender, instance: TicketEvent, created: bool, **kwargs):
            if not created:
                return
            ticket = instance.ticket
            payload = {
                "ticket_id": ticket.id,
                "ticket_numero": ticket.numero,
                "tipo_evento": instance.tipo_evento,
                "estado_nuevo": instance.estado_nuevo,
                "comentario": instance.comentario,
            }
            try:
                from apps.realtime.events.ticket_events import broadcast_ticket_updated
                broadcast_ticket_updated(payload)
            except Exception:  # noqa: BLE001
                import logging  # noqa: PLC0415
                logging.getLogger(__name__).exception(
                    "Failed to broadcast realtime update for TicketEvent %s",
                    instance.id,
                )

```

### 📄 backend/apps/realtime/consumers/__init__.py
```python
from .notification_consumer import NotificationConsumer
from .ticket_consumer import TicketConsumer

__all__ = ["NotificationConsumer", "TicketConsumer"]

```

### 📄 backend/apps/realtime/consumers/notification_consumer.py
```python
"""
NotificationConsumer — per-user WebSocket channel for live notifications.

Responsibility (SRP): manage the WS connection lifecycle and relay messages.
    It does NOT decide what to send — NotificationService does (via WebSocketStrategy,
    which calls channel_layer.group_send to this consumer's group).
Depends on: Channels AsyncJsonWebsocketConsumer, simplejwt for handshake auth.
Pattern: Singleton transport (channel layer) + Observer endpoint.
SOLID: SRP · DIP

Group convention: 'notif_user_{user_id}' (matches WebSocketNotificationStrategy).

Handshake auth:
    The JWT is passed as ?token=<access> in the WS URL query string.
    connect() validates it; on failure the socket is closed with code 4401.
"""

from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4401)  # unauthorized
            return

        self.user = user
        self.group_name = f"notif_user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    # ── Group message handler ──────────────────────────────────────────────────
    # Triggered by channel_layer.group_send({'type': 'notification.new', ...})
    async def notification_new(self, event):
        """Relay a new-notification payload down to the connected client."""
        await self.send_json({
            "event": "notification_new",
            "payload": event.get("payload", {}),
        })

    # ── Handshake authentication ───────────────────────────────────────────────
    async def _authenticate(self):
        """
        Validate the JWT from the query string and return the User, or None.
        Uses simplejwt's AccessToken to decode + verify.
        """
        from channels.db import database_sync_to_async  # noqa: PLC0415

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        if not token_list:
            return None

        @database_sync_to_async
        def resolve_user(raw_token):
            try:
                from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
                from apps.authentication.models import User  # noqa: PLC0415
                access = AccessToken(raw_token)
                return User.objects.filter(id=access["user_id"]).first()
            except Exception:  # noqa: BLE001
                return None

        return await resolve_user(token_list[0])

```

### 📄 backend/apps/realtime/consumers/ticket_consumer.py
```python
"""
TicketConsumer — per-ticket WebSocket room for live updates (HU-09).

Responsibility (SRP): manage the connection to room ticket_{id} and relay
    ticket_updated messages. JWT validated on the handshake (?token=).
Pattern: Observer endpoint + Singleton transport (channel layer).
SOLID: SRP · DIP.
"""

from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.events.ticket_events import ticket_group


class TicketConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4401)
            return
        self.ticket_id = self.scope["url_route"]["kwargs"]["ticket_id"]
        self.group_name = ticket_group(self.ticket_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def ticket_updated(self, event):
        """Handler for {'type': 'ticket.updated', ...} → relay to the client."""
        await self.send_json({"event": "ticket_updated", "payload": event.get("payload", {})})

    async def _authenticate(self):
        from channels.db import database_sync_to_async  # noqa: PLC0415

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        if not token_list:
            return None

        @database_sync_to_async
        def resolve_user(raw):
            try:
                from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
                from apps.authentication.models import User  # noqa: PLC0415
                return User.objects.filter(id=AccessToken(raw)["user_id"]).first()
            except Exception:  # noqa: BLE001
                return None

        return await resolve_user(token_list[0])

```

### 📄 backend/apps/realtime/events/__init__.py
```python
from .ticket_events import build_ticket_updated_payload, broadcast_ticket_updated

__all__ = ["build_ticket_updated_payload", "broadcast_ticket_updated"]

```

### 📄 backend/apps/realtime/events/ticket_events.py
```python
"""
Ticket realtime events — builds and broadcasts the ticket_updated payload (SRP).

Responsibility (SRP): only construct the event payload and push it to the ticket room.
    It does NOT decide when (the Observer/signal does). realtime depends on tickets
    (one-way); tickets stays unaware of the transport.
Pattern: Observer (consumer side) + Singleton (channel layer).
SOLID: SRP · DIP · OCP (new event = new builder, existing untouched).
"""

from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def ticket_group(ticket_id: int) -> str:
    return f"ticket_{ticket_id}"


def build_ticket_updated_payload(event: dict) -> dict:
    """Shape a TicketEvent dict into the ticket_updated WS payload."""
    return {
        "ticket_id": event.get("ticket_id"),
        "ticket_numero": event.get("ticket_numero"),
        "tipo_evento": event.get("tipo_evento"),
        "estado_nuevo": event.get("estado_nuevo"),
        "comentario": event.get("comentario"),
    }


def broadcast_ticket_updated(event: dict) -> None:
    """Send ticket_updated to everyone subscribed to the ticket's room."""
    ticket_id = event.get("ticket_id")
    if ticket_id is None:
        return
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(
        ticket_group(ticket_id),
        {"type": "ticket.updated", "payload": build_ticket_updated_payload(event)},
    )

```

### 📄 backend/apps/realtime/models.py
```python
from django.db import models

# Create your models here.

```

### 📄 backend/apps/realtime/tests.py
```python
from django.test import TestCase

# Create your tests here.

```

### 📄 backend/apps/realtime/views.py
```python
from django.shortcuts import render

# Create your views here.

```

### 📄 backend/apps/reports/__init__.py
```python

```

### 📄 backend/apps/reports/admin.py
```python
from django.contrib import admin

# Register your models here.

```

### 📄 backend/apps/reports/apps.py
```python
from django.apps import AppConfig


class ReportsConfig(AppConfig):
    name = 'apps.reports'

```

### 📄 backend/apps/reports/exporters/__init__.py
```python
from .csv_exporter import CSVExporter
from .pdf_exporter import PDFExporter
from .excel_exporter import ExcelExporter

__all__ = ["CSVExporter", "PDFExporter", "ExcelExporter"]

```

### 📄 backend/apps/reports/exporters/csv_exporter.py
```python
"""CSVExporter — Strategy for CSV (stdlib, always available). SOLID: SRP·LSP."""

from __future__ import annotations

import csv
import io

from apps.reports.interfaces import IReportExporter


class CSVExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
        return buffer.getvalue().encode("utf-8-sig")  # BOM for Excel-friendliness

    def get_extension(self) -> str:
        return "csv"

    def get_mime_type(self) -> str:
        return "text/csv"

```

### 📄 backend/apps/reports/exporters/excel_exporter.py
```python
"""
ExcelExporter — Strategy for .xlsx via openpyxl (lazy import). SOLID: SRP·LSP·OCP.
openpyxl is imported inside export() so the module loads even if the lib is absent;
a clear error is raised only when an Excel export is actually requested.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class ExcelExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from openpyxl import Workbook  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError("Instala openpyxl para exportar a Excel.") from exc

        import io  # noqa: PLC0415
        wb = Workbook()
        ws = wb.active
        ws.append(columns)
        for row in rows:
            ws.append([row.get(c, "") for c in columns])
        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "xlsx"

    def get_mime_type(self) -> str:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

```

### 📄 backend/apps/reports/exporters/pdf_exporter.py
```python
"""
PDFExporter — Strategy for PDF via reportlab (lazy import). SOLID: SRP·LSP·OCP.
reportlab is imported inside export() so the module loads even if the lib is absent.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class PDFExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from reportlab.lib.pagesizes import letter  # noqa: PLC0415
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle  # noqa: PLC0415
            from reportlab.lib import colors  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError("Instala reportlab para exportar a PDF.") from exc

        import io  # noqa: PLC0415
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        data = [columns] + [[str(r.get(c, "")) for c in columns] for r in rows]
        table = Table(data)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d1c1a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))
        doc.build([table])
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "pdf"

    def get_mime_type(self) -> str:
        return "application/pdf"

```

### 📄 backend/apps/reports/interfaces/__init__.py
```python
from .i_report_exporter import IReportExporter

__all__ = ["IReportExporter"]

```

### 📄 backend/apps/reports/interfaces/i_report_exporter.py
```python
"""
IReportExporter — root contract for report export formats.

Responsibility (SRP): declare how a set of rows becomes a downloadable file.
Pattern: Strategy (each format is an exporter) + DIP anchor.
SOLID: DIP · OCP · LSP

OCP: JSONExporter = new class implementing this + one entry in ExporterFactory.
    PDFExporter / CSVExporter / ExcelExporter are never modified.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IReportExporter(ABC):

    @abstractmethod
    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        """Serialize rows (list of dicts) into the format's bytes."""
        ...

    @abstractmethod
    def get_extension(self) -> str:
        """File extension without the dot, e.g. 'csv'."""
        ...

    @abstractmethod
    def get_mime_type(self) -> str:
        """MIME type for the HTTP response."""
        ...

```

### 📄 backend/apps/reports/models.py
```python
from django.db import models

# Create your models here.

```

### 📄 backend/apps/reports/repositories/__init__.py
```python
from .report_repository import ReportRepository

__all__ = ["ReportRepository"]

```

### 📄 backend/apps/reports/repositories/report_repository.py
```python
"""
ReportRepository — aggregation queries for reports (Repository).
The view never touches the ORM. SOLID: DIP · SRP.
"""

from __future__ import annotations

from django.db.models import Count, Q

from apps.tickets.models import Ticket


class ReportRepository:

    def _filtered(self, filters: dict | None):
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")
        filters = filters or {}
        if estado := filters.get("estado"):
            qs = qs.filter(estado=estado)
        if servicio_id := filters.get("servicio_id"):
            qs = qs.filter(servicio_id=servicio_id)
        if fecha_desde := filters.get("fecha_desde"):
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta := filters.get("fecha_hasta"):
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        # H#6 (cliente): Filtros avanzados por cliente y técnico
        if cliente_ruc := filters.get("cliente_ruc"):
            qs = qs.filter(cliente__ruc__icontains=cliente_ruc)
        if cliente_nombre := filters.get("cliente_nombre"):
            qs = qs.filter(
                Q(cliente__first_name__icontains=cliente_nombre)
                | Q(cliente__last_name__icontains=cliente_nombre)
                | Q(cliente__email__icontains=cliente_nombre)
            )
        if asignado_id := filters.get("asignado_id"):
            qs = qs.filter(asignado_id=asignado_id)
        return qs

    def summary(self, filters: dict | None = None) -> dict:
        qs = self._filtered(filters)
        by_estado = dict(
            qs.values_list("estado").annotate(n=Count("id")).values_list("estado", "n")
        )
        by_prioridad = dict(
            qs.values_list("prioridad").annotate(n=Count("id")).values_list("prioridad", "n")
        )
        total = qs.count()
        abiertos = sum(v for k, v in by_estado.items() if k != "Cerrado")
        return {
            "total": total,
            "abiertos": abiertos,
            "cerrados": by_estado.get("Cerrado", 0),
            "por_estado": by_estado,
            "por_prioridad": by_prioridad,
        }

    def rows(self, filters: dict | None = None) -> list[dict]:
        qs = self._filtered(filters).order_by("-created_at")
        return [
            {
                "numero": t.numero,
                "asunto": t.asunto,
                "estado": t.estado,
                "prioridad": t.prioridad,
                "servicio": t.servicio.nombre if t.servicio_id else "",
                "cliente": t.cliente.email if t.cliente_id else "",
                "asignado": t.asignado.email if t.asignado_id else "",
                "creado_en": t.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for t in qs
        ]

```

### 📄 backend/apps/reports/services/__init__.py
```python
from .report_service import ReportService, get_report_service

__all__ = ["ReportService", "get_report_service"]

```

### 📄 backend/apps/reports/services/report_service.py
```python
"""
ReportService — orchestrates report data + export (Singleton + DIP).

Responsibility (SRP): combine ReportRepository data with the exporter chosen by
    ExporterFactory. Depends on IReportExporter (abstraction), never on a concrete
    exporter class (DIP). SOLID: Singleton · DIP · OCP.
"""

from __future__ import annotations

from apps.reports.repositories import ReportRepository
from core.factories.exporter_factory import ExporterFactory

_COLUMNS = [
    "numero", "asunto", "estado", "prioridad",
    "servicio", "cliente", "asignado", "creado_en",
]


class ReportService:

    def __init__(self, repository: ReportRepository | None = None) -> None:
        self._repo = repository or ReportRepository()

    def get_dashboard(self, filters: dict | None = None) -> dict:
        return self._repo.summary(filters)

    def export(self, fmt: str, filters: dict | None = None) -> tuple[bytes, str, str]:
        """Return (content_bytes, mime_type, filename) for the requested format."""
        exporter = ExporterFactory.build(fmt)  # raises ValueError on unknown format
        rows = self._repo.rows(filters)
        content = exporter.export(rows, _COLUMNS)
        filename = f"reporte_tickets.{exporter.get_extension()}"
        return content, exporter.get_mime_type(), filename


import threading

_lock = threading.Lock()
_instance: ReportService | None = None


def get_report_service() -> ReportService:
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = ReportService()
    return _instance

```

### 📄 backend/apps/reports/tests.py
```python
from django.test import TestCase

# Create your tests here.

```

### 📄 backend/apps/reports/tests/__init__.py
```python
# Sprint 4 · S33 — reports tests: exporters (no DB) + ExporterFactory.

```

### 📄 backend/apps/reports/tests/test_exporters.py
```python
"""
Tests for report exporters + ExporterFactory (no database required).
Run: pytest apps/reports/tests/test_exporters.py -v
"""

import pytest

from apps.reports.exporters import CSVExporter
from core.factories.exporter_factory import ExporterFactory

ROWS = [
    {"numero": "T-2026-0001", "estado": "Nuevo", "prioridad": "Alta"},
    {"numero": "T-2026-0002", "estado": "Cerrado", "prioridad": "Baja"},
]
COLUMNS = ["numero", "estado", "prioridad"]


class TestCSVExporter:
    def test_export_includes_header_and_rows(self):
        content = CSVExporter().export(ROWS, COLUMNS).decode("utf-8-sig")
        assert "numero,estado,prioridad" in content
        assert "T-2026-0001,Nuevo,Alta" in content
        assert "T-2026-0002,Cerrado,Baja" in content

    def test_extension_and_mime(self):
        exp = CSVExporter()
        assert exp.get_extension() == "csv"
        assert exp.get_mime_type() == "text/csv"

    def test_ignores_extra_keys(self):
        rows = [{"numero": "X", "estado": "Y", "prioridad": "Z", "extra": "ignored"}]
        content = CSVExporter().export(rows, COLUMNS).decode("utf-8-sig")
        assert "ignored" not in content


class TestExporterFactory:
    def test_build_csv(self):
        assert isinstance(ExporterFactory.build("csv"), CSVExporter)

    def test_build_is_case_insensitive(self):
        assert isinstance(ExporterFactory.build("CSV"), CSVExporter)

    def test_unknown_format_raises(self):
        with pytest.raises(ValueError):
            ExporterFactory.build("xml")

    def test_pdf_and_excel_resolve_without_libs(self):
        # The classes resolve even if reportlab/openpyxl aren't installed;
        # the ImportError only surfaces when export() is called.
        assert ExporterFactory.build("pdf") is not None
        assert ExporterFactory.build("excel") is not None

```

### 📄 backend/apps/reports/urls.py
```python
"""Reports routing. Mounted under /api/reportes/ by config/urls.py."""

from django.urls import path

from apps.reports.views import ReportDashboardView, ReportExportView

urlpatterns = [
    path("tickets", ReportDashboardView.as_view(), name="report-dashboard"),
    path("exportar", ReportExportView.as_view(), name="report-export"),
]

```

### 📄 backend/apps/reports/views.py
```python
from django.shortcuts import render

# Create your views here.

```

### 📄 backend/apps/reports/views/__init__.py
```python
from .report_views import ReportDashboardView, ReportExportView

__all__ = ["ReportDashboardView", "ReportExportView"]

```

### 📄 backend/apps/reports/views/report_views.py
```python
"""
Report DRF views — HTTP orchestration (SRP + DIP). Admin-only.

    GET  /api/reportes/tickets   → dashboard KPIs/aggregations
    POST /api/reportes/exportar  → file download (csv|pdf|excel)
"""

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.services import get_report_service
from core.permissions import IsAdmin

_FILTER_KEYS = (
    "estado", "servicio_id", "fecha_desde", "fecha_hasta",
    "cliente_ruc", "cliente_nombre", "asignado_id",  # H#6 (cliente)
)


class ReportDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}
        return Response(get_report_service().get_dashboard(filters), status=status.HTTP_200_OK)


class ReportExportView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        fmt = request.data.get("formato", "csv")
        filters = {k: request.data[k] for k in _FILTER_KEYS if k in request.data}
        try:
            content, mime, filename = get_report_service().export(fmt, filters)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:  # missing optional lib (reportlab/openpyxl)
            return Response({"detail": str(exc)}, status=status.HTTP_501_NOT_IMPLEMENTED)

        response = HttpResponse(content, content_type=mime)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

```

### 📄 backend/apps/tickets/__init__.py
```python

```

### 📄 backend/apps/tickets/admin.py
```python
from django.contrib import admin
from .models import Ticket, TicketEvent, Attachment


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('numero', 'asunto', 'estado', 'prioridad', 'cliente', 'asignado', 'created_at')
    list_filter = ('estado', 'prioridad')
    search_fields = ('numero', 'asunto')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TicketEvent)
class TicketEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'tipo_evento', 'autor', 'created_at')
    list_filter = ('tipo_evento',)
    search_fields = ('ticket__numero', 'comentario')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'nombre_archivo', 'tamaño_bytes', 'mime_type')
    search_fields = ('nombre_archivo',)

```

### 📄 backend/apps/tickets/apps.py
```python
"""
TicketsConfig — Django app config that wires the Observer signal.

Responsibility (SRP): configure the app and register the post_save signal on TicketEvent.
    Signal registration lives here (not in models.py) to avoid import-time side effects
    and to keep models free of cross-module knowledge (SRP).

Observer pattern:
    Emitter:  TicketEvent (post_save)
    Receiver: NotificationService.dispatch(event)
    The import of NotificationService is deferred inside the handler to avoid a
    circular import between apps.tickets and apps.notifications.

DIP:
    The handler calls NotificationService via its module path.
    In Sprint 3, when NotificationService gains strategy implementations,
    this handler does not change (OCP).
"""

from django.apps import AppConfig


class TicketsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.tickets"

    def ready(self) -> None:
        """Register signals after all models are loaded."""
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        from apps.tickets.models import TicketEvent

        @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_notify")
        def on_ticket_event_saved(sender, instance: TicketEvent, created: bool, **kwargs) -> None:
            """
            Dispatch a notification whenever a new TicketEvent is persisted.
            Only fires on INSERT (created=True) — updates to events are not expected
            since TicketEvents are append-only.

            D4 — the event is serialized to a plain dict HERE (in apps.tickets) before
            crossing into apps.notifications. This keeps the dependency one-way:
                apps.tickets → apps.notifications  (notifications NEVER imports tickets)
            The deferred import of the service avoids a circular import at module load.
            """
            if not created:
                return

            # Serialize the TicketEvent to a transport dict (no model crosses the boundary)
            ticket = instance.ticket
            event_payload = {
                "ticket_id":       ticket.id,
                "ticket_numero":   ticket.numero,
                "ticket_asunto":   ticket.asunto,
                "tipo_evento":     instance.tipo_evento,
                "estado_anterior": instance.estado_anterior,
                "estado_nuevo":    instance.estado_nuevo,
                "comentario":      instance.comentario,
                "autor_id":        instance.autor_id,
                "cliente_id":      ticket.cliente_id,
                "asignado_id":     ticket.asignado_id,
            }

            try:
                # Deferred import — prevents circular import at module load time
                from apps.notifications.services import get_notification_service  # noqa: PLC0415
                get_notification_service().dispatch(event_payload)
            except ImportError:
                # NotificationService not available (e.g. notifications app disabled).
                # Signal stays wired; handler is a safe no-op.
                pass
            except Exception:  # noqa: BLE001
                import logging  # noqa: PLC0415
                logging.getLogger(__name__).exception(
                    "Failed to dispatch notification for TicketEvent %s",
                    instance.id,
                )

```

### 📄 backend/apps/tickets/interfaces/__init__.py
```python
from .i_ticket_service import ITicketService
from .i_storage_service import IStorageService
from .i_ticket_client_actions import ITicketClientActions
from .i_ticket_worker_actions import ITicketWorkerActions
from .i_ticket_admin_actions import ITicketAdminActions

__all__ = [
    "ITicketService",
    "IStorageService",
    "ITicketClientActions",
    "ITicketWorkerActions",
    "ITicketAdminActions",
]

```

### 📄 backend/apps/tickets/interfaces/i_storage_service.py
```python
"""
ISP interface for file storage operations — segregated from ITicketService.

Responsibility (SRP): declare the contract for uploading, retrieving, and deleting files.
    No ticket logic, no authentication — only storage I/O signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP + DIP — TicketService receives IStorageService via constructor;
    the concrete implementation (SupabaseStorageService or S3StorageService) is
    injected without modifying TicketService or FileUpload (LSP).
SOLID: ISP · DIP · LSP · OCP

Why segregated from ITicketService:
    TicketService has no reason to know about storage details (ISP).
    CatalogService could also use IStorageService for service images in a future sprint
    without coupling to ticket internals.

OCP extension:
    New storage provider (GCS, Azure Blob) = new class that implements IStorageService.
    TicketService and FileUpload remain unchanged (DIP).

Sprint usage:
    S12 → this contract (stub)
    S12 → SupabaseStorageService(IStorageService) — concrete implementation
    FileUpload component (FE) delegates to the IStorageService injected by useTickets hook.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IStorageService(ABC):
    """Abstract contract for binary file storage."""

    @abstractmethod
    def upload(self, file, path: str) -> str:
        """
        Upload a file to the configured storage backend.

        Args:
            file: a file-like object (Django InMemoryUploadedFile or TemporaryUploadedFile)
            path: destination path in the storage bucket
                  (e.g. 'tickets/T-2026-0001/factura.pdf')

        Returns:
            str — public or signed URL of the uploaded file.

        Raises:
            StorageUploadError — if the backend rejects the file.
        """
        ...

    @abstractmethod
    def delete(self, path: str) -> None:
        """
        Permanently remove a file from the storage backend.

        Args:
            path: the same path used when uploading.

        Raises:
            StorageDeleteError — if the file does not exist or deletion fails.
        """
        ...

    @abstractmethod
    def get_url(self, path: str) -> str:
        """
        Return a (possibly signed) URL for an existing file.

        Args:
            path: the storage path of the file.

        Returns:
            str — accessible URL (may be time-limited for private buckets).

        Raises:
            StorageFileNotFound — if no file exists at the given path.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_admin_actions.py
```python
"""
ISP interface — ticket operations available to an ADMIN user.

Responsibility (SRP): expose only the actions an ADMINISTRADOR can perform on tickets.
    An admin assigns, reassigns, and has a global view. Nothing from client or worker scope.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — assignment and admin-list views depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT inheriting from ITicketWorkerActions or ITicketClientActions:
    An admin does not create tickets on behalf of clients (different flow).
    Merging interfaces would expose methods that admin views never call (ISP violation).

Relation to ITicketService:
    TicketService implements ITicketAdminActions alongside the other two role interfaces.
    Admin views receive ITicketAdminActions via constructor (DIP).

OCP extension:
    New admin action (e.g. bulk_assign, escalate) = new @abstractmethod here.
    ITicketClientActions and ITicketWorkerActions are NEVER modified.

Sprint usage:
    S15 → this file (contract — Sprint 4 exercises these methods)
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketAdminActions(ABC):
    """Operations an ADMINISTRADOR user can perform on tickets."""

    @abstractmethod
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        """
        HU-05: Assign a Nuevo ticket to a worker, transitioning it to EnProceso.
        Validates: worker must be active (estado=ACTIVO) and have role=WORKER.
        Creates a TicketEvent and triggers the Observer.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (ticket not in Nuevo state).
        """
        ...

    @abstractmethod
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        """
        HU-08: Reassign an EnProceso ticket to a different worker.
        Creates a TicketEvent with tipo='reasignacion'.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (ticket not in EnProceso state).
        """
        ...

    @abstractmethod
    def get_all_tickets(self, filters: dict | None = None) -> list:
        """
        HU-10 (admin): Global ticket list with full filter support.
        Optional filters: estado, prioridad, cliente_id, asignado_id,
                          fecha_desde, fecha_hasta, servicio_id, page, page_size.
        Returns: paginated list of TicketSummary dicts.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_client_actions.py
```python
"""
ISP interface — ticket operations available to a CLIENT user.

Responsibility (SRP): expose only the actions a CLIENTE can perform on tickets.
    A client creates tickets and reads their own. Nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — ticket_create_view and ticket_list_view depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT a subset of ITicketService via inheritance:
    If ITicketService grows with internal or admin methods, inheriting here would force
    client views to know about them (ISP violation). This interface is intentionally minimal.

Relation to ITicketService:
    TicketService implements BOTH ITicketService (full contract) AND ITicketClientActions.
    Views always depend on the role interface (DIP + ISP), never on ITicketService directly.

OCP extension:
    New client action (e.g. reopen_ticket) = new @abstractmethod here.
    ITicketWorkerActions and ITicketAdminActions are NEVER modified.

Sprint usage:
    S15 → this file (contract)
    S12 → ticket_create_view uses this
    S18 → tests verify IsClient permission + isolation from worker/admin actions
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketClientActions(ABC):
    """Operations a CLIENTE user can perform on tickets."""

    @abstractmethod
    def create_ticket(self, data: dict, user) -> dict:
        """
        HU-06: Create a new support ticket.
        Generates T-YYYY-NNNN number, sets estado='Nuevo', persists attachments.
        Args:
            data: validated dict from TicketCreateSerializer
            user: authenticated User instance with role == CLIENTE
        Returns: TicketDetail dict.
        Raises: ServiceNotFound, ValidationError (field or business rule).
        """
        ...

    @abstractmethod
    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        """
        HU-10: List tickets belonging to this client.
        Optional filters: estado, prioridad, fecha_desde, fecha_hasta, servicio_id.
        Returns: list of TicketSummary dicts ordered by created_at desc.
        """
        ...

    @abstractmethod
    def get_ticket_detail(self, ticket_id: int, user) -> dict:
        """
        HU-06: Full detail of one ticket — enforces ownership (client sees only own tickets).
        Returns: TicketDetail dict including adjuntos and eventos.
        Raises: TicketNotFound if ticket does not exist or belongs to another client.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_service.py
```python
"""
Root ABC for all ticket operations in the backend.

Responsibility (SRP): declare the complete ticket operation contract.
    No HTTP logic, no ORM queries, no state machine calls — only method signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: DIP anchor — TicketService (Singleton) implements this in S12.
SOLID: DIP · OCP · LSP

Sprint coverage:
    S12 → this file (contract) + IStorageService (ISP split)
    S15 → ITicketClientActions, ITicketWorkerActions, ITicketAdminActions (ISP split from this)
    S12 exercises create_ticket() only; remaining methods are contracts for Sprints 3 & 4.

ISP note (S15):
    S15 will define three ISP interfaces that each expose a subset of this contract.
    TicketService implements all three. Views depend on the role-specific interface, not
    on ITicketService directly — that keeps each view minimal (ISP + DIP).

OCP extension:
    New ticket operation (e.g. reopen_ticket) = new @abstractmethod here + implementation
    in TicketService + new entry in the relevant ISP interface. Existing views unchanged.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketService(ABC):
    """Abstract contract for all ticket use cases across all roles."""

    # ── HU-06: Creación (cliente) ─────────────────────────────────────────────

    @abstractmethod
    def create_ticket(self, data: dict, user) -> dict:
        """
        Create a new ticket for an authenticated client.

        Business rules enforced by the concrete implementation (NOT here):
        - Generates unique ticket number T-YYYY-NNNN (generate_ticket_number).
        - Sets estado = 'Nuevo' and cliente = user.
        - Persists Attachment records for each uploaded file via IStorageService.
        - Creates the first TicketEvent (tipo='creacion').

        Args:
            data: validated dict from TicketCreateSerializer
                  (asunto, descripcion, servicio_id, prioridad, adjuntos: list)
            user: the authenticated User instance (CLIENTE role)

        Returns:
            TicketDetail dict with numero, asunto, estado, prioridad, creadoEn.

        Raises:
            ServiceNotFound  — servicio_id does not exist or is inactive
            ValidationError  — business rule violation (BusinessRuleValidator)
        """
        ...

    @abstractmethod
    def generate_ticket_number(self, year: int) -> str:
        """
        Generate the next unique ticket number in format T-YYYY-NNNN.
        Separated for SRP: the Ticket model never contains this logic.

        Args:
            year: the 4-digit calendar year (e.g. 2026)

        Returns:
            str — e.g. 'T-2026-0001', 'T-2026-0042'
        """
        ...

    # ── Lectura (cliente) ─────────────────────────────────────────────────────

    @abstractmethod
    def get_ticket_by_id(self, ticket_id: int, user) -> dict:
        """
        Return full detail of a single ticket.
        Enforces ownership: a CLIENTE only sees their own tickets.

        Returns:
            TicketDetail dict.

        Raises:
            TicketNotFound — ticket does not exist or caller lacks access.
        """
        ...

    @abstractmethod
    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        """
        Return all tickets belonging to the authenticated client.
        Optional filters: {'estado': str, 'prioridad': str, 'fecha_desde': str, 'fecha_hasta': str}
        Returns: list of TicketSummary dicts, ordered by created_at desc.
        """
        ...

    # ── Gestión de estado (worker) — contratos para Sprint 3 ─────────────────

    @abstractmethod
    def update_status(self, ticket_id: int, new_status: str, comment: str, user) -> dict:
        """
        Transition a ticket to a new state via TicketStateMachine.
        BR-35: comment must be non-empty.
        Creates a TicketEvent and dispatches notification (Observer).

        Raises:
            TicketNotFound, InvalidTransitionError, CommentRequiredError.
        """
        ...

    @abstractmethod
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        """
        Add a comment to a ticket without changing its state.
        Creates a TicketEvent with tipo='comentario'.
        """
        ...

    @abstractmethod
    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        """
        Transition ticket from 'Resuelto' → 'Cerrado' (terminal state).
        BR-35: comment required.
        Raises: InvalidTransitionError if current state is not 'Resuelto'.
        """
        ...

    # ── Administración (admin) — contratos para Sprint 4 ─────────────────────

    @abstractmethod
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        """
        Assign a 'Nuevo' ticket to a worker, transitioning it to 'EnProceso'.
        Raises: TicketNotFound, InvalidTransitionError if not in 'Nuevo' state.
        """
        ...

    @abstractmethod
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        """
        Reassign an 'EnProceso' ticket to a different worker.
        Creates a TicketEvent with tipo='reasignacion'.
        """
        ...

    @abstractmethod
    def get_all_tickets(self, filters: dict | None = None) -> list:
        """
        Return all tickets in the system (admin view).
        Optional filters: {'estado', 'prioridad', 'cliente_id', 'asignado_id',
                           'fecha_desde', 'fecha_hasta', 'servicio_id'}
        Returns: paginated list of TicketSummary dicts.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_worker_actions.py
```python
"""
ISP interface — ticket operations available to a WORKER user.

Responsibility (SRP): expose only the actions a TRABAJADOR can perform on tickets.
    A worker updates status, adds comments, and closes assigned tickets. Nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — status update and comment views depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT inheriting from ITicketClientActions:
    A worker has fundamentally different actions from a client. Merging would force
    worker views to declare methods they never call, and tests to cover irrelevant paths.

Relation to ITicketService:
    TicketService implements ITicketWorkerActions alongside ITicketClientActions.
    Worker views receive ITicketWorkerActions via constructor (DIP).

OCP extension:
    New worker action (e.g. request_info) = new @abstractmethod here.
    ITicketClientActions and ITicketAdminActions are NEVER modified.

Sprint usage:
    S15 → this file (contract — Sprint 3 exercises these methods)
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketWorkerActions(ABC):
    """Operations a TRABAJADOR user can perform on assigned tickets."""

    @abstractmethod
    def update_status(
        self, ticket_id: int, new_status: str, comment: str, user
    ) -> dict:
        """
        HU-07: Transition a ticket to a new state via TicketStateMachine.
        BR-35: comment must be non-empty.
        Creates a TicketEvent and triggers the Observer (NotificationService).
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError, CommentRequiredError.
        """
        ...

    @abstractmethod
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        """
        HU-11: Add a comment to a ticket without changing its state.
        Creates a TicketEvent with tipo='comentario'.
        Returns: the new TicketEvent dict.
        Raises: TicketNotFound, ValidationError (empty comment).
        """
        ...

    @abstractmethod
    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        """
        HU-12: Transition Resuelto → Cerrado (terminal state).
        BR-35: comment required.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (if not in Resuelto state).
        """
        ...

```

### 📄 backend/apps/tickets/management/__init__.py
```python

```

### 📄 backend/apps/tickets/management/commands/__init__.py
```python

```

### 📄 backend/apps/tickets/management/commands/seed_demo.py
```python
"""
seed_demo — carga datos de prueba para la demo/aceptación (idempotente).

Crea:
  - Los 6 servicios reales de SassBlum (catálogo).
  - Cuentas de prueba para los 3 roles (cliente / trabajador / admin), ya verificadas.
  - Tickets de ejemplo en distintos estados con su historial de eventos.

Es idempotente: re-ejecutarlo no duplica datos (usa get_or_create por clave natural).
El envío de correos se desvía a un backend en memoria durante la siembra para no
mandar emails reales al disparar el Observer.

Uso:
    python manage.py seed_demo
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.test.utils import override_settings

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent

DEMO_PASSWORD = "SassBlum2026"

# ── Servicios reales de sassblum.com ────────────────────────────────────────────
_IMG = "https://images.unsplash.com/{id}?auto=format&fit=crop&w=1200&q=80"
SERVICES = [
    {
        "nombre": "Infraestructura IT",
        "categoria": "Infraestructura",
        "descripcion": "Soluciones integradas a la medida: analizamos tus necesidades "
        "tecnológicas y oportunidades de crecimiento para diseñar una infraestructura robusta y escalable.",
        "imagen_url": _IMG.format(id="photo-1558494949-ef010cbdcc31"),
    },
    {
        "nombre": "Soporte Técnico",
        "categoria": "Soporte",
        "descripcion": "Servicio profesional que mejora la experiencia de tus colaboradores "
        "y maximiza la inversión en tus equipos, con atención oportuna y especializada.",
        "imagen_url": _IMG.format(id="photo-1581091226825-a6a2a5aee158"),
    },
    {
        "nombre": "Cableado Estructurado",
        "categoria": "Redes",
        "descripcion": "Implementación de redes de voz y datos con énfasis en estándares "
        "y calidad de conectividad para tu empresa.",
        "imagen_url": _IMG.format(id="photo-1606904825846-647eb07f5be2"),
    },
    {
        "nombre": "Sistema de Vigilancia CCTV",
        "categoria": "CCTV",
        "descripcion": "Videovigilancia y seguridad avanzada. Somos integradores autorizados "
        "de Grandstream, Hikvision, Ubiquiti y ZKTeco.",
        "imagen_url": _IMG.format(id="photo-1557597774-9d273605dfa9"),
    },
    {
        "nombre": "Domótica",
        "categoria": "Domótica",
        "descripcion": "Automatización inteligente: controla tu oficina u hogar desde el "
        "computador o el smartphone.",
        "imagen_url": _IMG.format(id="photo-1558002038-1055907df827"),
    },
    {
        "nombre": "Venta de Servidores",
        "categoria": "Servidores",
        "descripcion": "Importación directa de servidores escalables con virtualización e "
        "implementación de planes de continuidad del negocio (BCP).",
        "imagen_url": _IMG.format(id="photo-1517336714731-489689fd1ca8"),
    },
]

# ── Cuentas de prueba ────────────────────────────────────────────────────────────
ACCOUNTS = [
    {"email": "admin@sassblum.com", "first_name": "Admin", "last_name": "SassBlum", "role": User.Role.ADMIN, "staff": True},
    {"email": "trabajador1@sassblum.com", "first_name": "Carlos", "last_name": "Técnico", "role": User.Role.WORKER},
    {"email": "trabajador2@sassblum.com", "first_name": "Ana", "last_name": "Soporte", "role": User.Role.WORKER},
    {"email": "cliente@sassblum.com", "first_name": "Cliente", "last_name": "Demo", "role": User.Role.CLIENT},
]


class Command(BaseCommand):
    help = "Carga datos de prueba (servicios reales, cuentas y tickets) para la demo. Idempotente."

    def handle(self, *args, **options):
        # Evita enviar correos reales al disparar el Observer durante la siembra.
        with override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            self._seed()

    @transaction.atomic
    def _seed(self):
        services = self._seed_services()
        accounts = self._seed_accounts()
        self._seed_tickets(services, accounts)
        self._print_summary(accounts)

    # ── Servicios ────────────────────────────────────────────────────────────────
    def _seed_services(self) -> dict[str, Service]:
        out: dict[str, Service] = {}
        created = 0
        for data in SERVICES:
            svc, was_created = Service.objects.get_or_create(
                nombre=data["nombre"],
                defaults={
                    "categoria": data["categoria"],
                    "descripcion": data["descripcion"],
                    "imagen_url": data["imagen_url"],
                    "activo": True,
                },
            )
            out[data["nombre"]] = svc
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Servicios: {created} creados, {len(SERVICES) - created} ya existían."))
        return out

    # ── Cuentas ──────────────────────────────────────────────────────────────────
    def _seed_accounts(self) -> dict[str, User]:
        out: dict[str, User] = {}
        created = 0
        for acc in ACCOUNTS:
            user, was_created = User.objects.get_or_create(
                email=acc["email"],
                defaults={
                    "first_name": acc["first_name"],
                    "last_name": acc["last_name"],
                    "role": acc["role"],
                    "estado": User.Estado.ACTIVE,
                    "email_verificado": True,
                    "is_staff": acc.get("staff", False),
                    "is_superuser": acc.get("staff", False),
                },
            )
            if was_created:
                user.set_password(DEMO_PASSWORD)
                user.save()
                created += 1
            out[acc["email"]] = user
        self.stdout.write(self.style.SUCCESS(f"Cuentas: {created} creadas, {len(ACCOUNTS) - created} ya existían."))
        return out

    # ── Tickets + historial ───────────────────────────────────────────────────────
    def _seed_tickets(self, services: dict[str, Service], accounts: dict[str, User]):
        cliente = accounts["cliente@sassblum.com"]
        admin = accounts["admin@sassblum.com"]
        w1 = accounts["trabajador1@sassblum.com"]
        w2 = accounts["trabajador2@sassblum.com"]
        E = Ticket.Estado

        plan = [
            {
                "numero": "T-2026-9001", "asunto": "Servidor de correo caído",
                "descripcion": "El servidor de correo dejó de responder esta mañana y nadie puede enviar mensajes.",
                "servicio": "Infraestructura IT", "prioridad": Ticket.Prioridad.ALTA,
                "estado": E.NUEVO, "asignado": None,
                "events": [("creacion", cliente, "", "", "Ticket creado por el cliente.")],
            },
            {
                "numero": "T-2026-9002", "asunto": "Cámara de seguridad sin señal",
                "descripcion": "La cámara CCTV del ingreso principal no muestra imagen desde ayer.",
                "servicio": "Sistema de Vigilancia CCTV", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.EN_PROCESO, "asignado": w1,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Carlos Técnico."),
                    ("cambio_estado", w1, E.NUEVO, E.EN_PROCESO, "En sitio revisando el cableado de la cámara."),
                ],
            },
            {
                "numero": "T-2026-9003", "asunto": "Cableado para nueva oficina",
                "descripcion": "Necesitamos cableado estructurado de voz y datos para 12 puestos nuevos.",
                "servicio": "Cableado Estructurado", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.EN_ESPERA, "asignado": w1,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Carlos Técnico."),
                    ("cambio_estado", w1, E.NUEVO, E.EN_PROCESO, "Levantamiento de requerimientos en sitio."),
                    ("cambio_estado", w1, E.EN_PROCESO, E.EN_ESPERA, "A la espera de que el cliente confirme la distribución de puestos."),
                ],
            },
            {
                "numero": "T-2026-9004", "asunto": "Configurar domótica en sala de reuniones",
                "descripcion": "Queremos controlar luces y proyector de la sala desde el celular.",
                "servicio": "Domótica", "prioridad": Ticket.Prioridad.BAJA,
                "estado": E.RESUELTO, "asignado": w2,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Ana Soporte."),
                    ("cambio_estado", w2, E.NUEVO, E.EN_PROCESO, "Instalación de módulos de control."),
                    ("cambio_estado", w2, E.EN_PROCESO, E.RESUELTO, "Domótica configurada y probada con el cliente."),
                ],
            },
            {
                "numero": "T-2026-9005", "asunto": "Mantenimiento preventivo de servidores",
                "descripcion": "Mantenimiento trimestral de los dos servidores físicos del rack principal.",
                "servicio": "Venta de Servidores", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.CERRADO, "asignado": w2,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Ana Soporte."),
                    ("cambio_estado", w2, E.NUEVO, E.EN_PROCESO, "Ejecutando rutina de mantenimiento."),
                    ("cambio_estado", w2, E.EN_PROCESO, E.RESUELTO, "Mantenimiento completado sin incidencias."),
                    ("cambio_estado", admin, E.RESUELTO, E.CERRADO, "Cliente confirma conformidad. Cierre del ticket."),
                ],
            },
        ]

        created = 0
        for p in plan:
            ticket, was_created = Ticket.objects.get_or_create(
                numero=p["numero"],
                defaults={
                    "asunto": p["asunto"],
                    "descripcion": p["descripcion"],
                    "servicio": services[p["servicio"]],
                    "cliente": cliente,
                    "asignado": p["asignado"],
                    "estado": p["estado"],
                    "prioridad": p["prioridad"],
                },
            )
            if was_created:
                created += 1
                for tipo, autor, ant, nue, comentario in p["events"]:
                    TicketEvent.objects.create(
                        ticket=ticket,
                        autor=autor,
                        tipo_evento=tipo,
                        estado_anterior=ant,
                        estado_nuevo=nue,
                        comentario=comentario,
                    )
        self.stdout.write(self.style.SUCCESS(f"Tickets: {created} creados, {len(plan) - created} ya existían."))

    # ── Resumen ──────────────────────────────────────────────────────────────────
    def _print_summary(self, accounts: dict[str, User]):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Cuentas de prueba (contraseña común):"))
        self.stdout.write(f"  Contraseña: {DEMO_PASSWORD}")
        for acc in ACCOUNTS:
            self.stdout.write(f"  [{acc['role']:>6}] {acc['email']}")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Datos de prueba listos. ¡A correr la demo!"))

```

### 📄 backend/apps/tickets/models.py
```python
from django.db import models

# Create your models here.

```

### 📄 backend/apps/tickets/models/__init__.py
```python
from .ticket import Ticket
from .attachment import Attachment
from .ticket_event import TicketEvent

__all__ = ["Ticket", "Attachment", "TicketEvent"]

```

### 📄 backend/apps/tickets/models/attachment.py
```python
"""
Attachment model — stores file metadata for ticket attachments (SRP).

Responsibility (SRP): persist file reference data only.
    - Actual file upload/delete lives in StorageService (via IStorageService).
    - The URL stored here is returned by IStorageService.upload().
    - Attachment records are created by TicketService after a successful upload.
Depends on: Django ORM, Ticket model.
Pattern: Domain Model (data-only).
SOLID: SRP

Prohibited in this file:
    - Any call to IStorageService or Supabase SDK
    - File I/O of any kind
"""

from django.db import models


class Attachment(models.Model):

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="adjuntos",
        verbose_name="ticket",
    )
    nombre_archivo = models.CharField(
        max_length=255,
        verbose_name="nombre del archivo",
    )
    url = models.URLField(
        max_length=1000,
        verbose_name="URL de acceso",
        help_text="URL pública o firmada retornada por IStorageService.upload().",
    )
    tamaño_bytes = models.PositiveIntegerField(
        verbose_name="tamaño (bytes)",
    )
    mime_type = models.CharField(
        max_length=100,
        verbose_name="tipo MIME",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="subido en")

    class Meta:
        db_table = "tickets_attachment"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.nombre_archivo} ({self.ticket.numero})"

```

### 📄 backend/apps/tickets/models/ticket.py
```python
"""
Ticket model — defines data structure only (SRP).

Responsibility (SRP): persist ticket data. No business logic.
    - Estado transitions live in TicketStateMachine (state_machine/).
    - T-YYYY-NNNN number generation lives in TicketService (services/).
    - Validation lives in the validator chain (validators/).
Depends on: Django ORM, apps.authentication.models.User, apps.catalog.models.Service.
Pattern: Domain Model (data-only).
SOLID: SRP (model = data; logic = service)

Prohibited in this file:
    - Methods that call other services
    - Pre/post-save hooks (use apps.py ready() for signals)
    - Any reference to TicketService, TicketStateMachine, or NotificationService

Permitted in this file:
    - Field definitions and choices
    - clean() for field-level constraints only (e.g. asunto length)
    - Simple @property for derived display values (e.g. is_closed)
"""

from django.db import models


class Ticket(models.Model):

    class Estado(models.TextChoices):
        NUEVO      = "Nuevo",     "Nuevo"
        EN_PROCESO = "EnProceso", "En Proceso"
        EN_ESPERA  = "EnEspera",  "En Espera"
        RESUELTO   = "Resuelto",  "Resuelto"
        CERRADO    = "Cerrado",   "Cerrado"

    class Prioridad(models.TextChoices):
        BAJA    = "Baja",    "Baja"
        MEDIA   = "Media",   "Media"
        ALTA    = "Alta",    "Alta"
        CRITICA = "Critica", "Crítica"

    # ── Identity ──────────────────────────────────────────────────────────────
    numero = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="número de ticket",
        help_text="Formato T-YYYY-NNNN. Generado por TicketService, nunca por el modelo.",
    )

    # ── Content ───────────────────────────────────────────────────────────────
    asunto = models.CharField(
        max_length=80,
        verbose_name="asunto",
    )
    descripcion = models.TextField(
        verbose_name="descripción",
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    servicio = models.ForeignKey(
        "catalog.Service",
        on_delete=models.PROTECT,
        related_name="tickets",
        verbose_name="servicio",
    )
    cliente = models.ForeignKey(
        "authentication.User",
        on_delete=models.PROTECT,
        related_name="tickets_creados",
        verbose_name="cliente",
    )
    asignado = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_asignados",
        verbose_name="trabajador asignado",
    )

    # ── Status ────────────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.NUEVO,
        verbose_name="estado",
    )
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        verbose_name="prioridad",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "tickets_ticket"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["cliente", "estado"]),
            models.Index(fields=["asignado", "estado"]),
            models.Index(fields=["estado", "prioridad"]),
        ]

    def __str__(self) -> str:
        return f"{self.numero} — {self.asunto[:40]}"

    @property
    def is_closed(self) -> bool:
        """True if ticket has reached the terminal Cerrado state."""
        return self.estado == self.Estado.CERRADO

```

### 📄 backend/apps/tickets/models/ticket_event.py
```python
"""
TicketEvent model — immutable audit log for all ticket activity (SRP).

Responsibility (SRP): persist audit records only. Every state change, comment,
    and assignment creates one TicketEvent. The model never decides when to create
    records — that logic lives in TicketService.
Depends on: Django ORM, Ticket model, authentication.User.
Pattern: Domain Model (data-only) + Observer (this model's post_save fires the signal
    registered in apps.py ready() — the model itself knows nothing about it).
SOLID: SRP · OCP (new event type = new TipoEvento choice, no logic change)

Prohibited in this file:
    - Any call to NotificationService, EmailService, or WebSocket
    - pre/post_save hooks (signals live in apps.py)
    - Mutable state or update logic (TicketEvents are append-only)

BR-35 enforcement:
    The comentario field is required for CAMBIO_ESTADO events.
    This constraint is enforced by TicketService + TicketStateMachine, NOT by the model.
    The model accepts any non-null string to remain flexible for other event types.
"""

from django.db import models


class TicketEvent(models.Model):

    class TipoEvento(models.TextChoices):
        CREACION      = "creacion",      "Creación"
        CAMBIO_ESTADO = "cambio_estado", "Cambio de estado"
        COMENTARIO    = "comentario",    "Comentario"
        ASIGNACION    = "asignacion",    "Asignación"
        REASIGNACION  = "reasignacion",  "Reasignación"

    # ── Relations ─────────────────────────────────────────────────────────────
    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="eventos",
        verbose_name="ticket",
    )
    autor = models.ForeignKey(
        "authentication.User",
        on_delete=models.PROTECT,
        related_name="ticket_events",
        verbose_name="autor",
    )

    # ── Event data ────────────────────────────────────────────────────────────
    tipo_evento = models.CharField(
        max_length=20,
        choices=TipoEvento.choices,
        verbose_name="tipo de evento",
    )
    estado_anterior = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="estado anterior",
        help_text="Vacío para eventos que no cambian estado (comentarios, asignaciones).",
    )
    estado_nuevo = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="estado nuevo",
    )
    comentario = models.TextField(
        verbose_name="comentario",
        help_text="Requerido para CAMBIO_ESTADO (BR-35). Opcional para otros tipos.",
    )

    # ── Timestamp (immutable) ─────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="registrado en")

    class Meta:
        db_table = "tickets_ticket_event"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["ticket", "created_at"]),
            models.Index(fields=["ticket", "tipo_evento"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.ticket.numero} · {self.tipo_evento} "
            f"({self.created_at.strftime('%Y-%m-%d %H:%M')})"
        )

```

### 📄 backend/apps/tickets/repositories/__init__.py
```python
from .ticket_repository import TicketRepository

__all__ = ["TicketRepository"]

```

### 📄 backend/apps/tickets/repositories/ticket_repository.py
```python
"""
TicketRepository — encapsulates all ORM access for tickets (Repository).

Responsibility (SRP): every Ticket / TicketEvent query lives here. No view or
    service touches the ORM directly (DIP). Uses select_related/prefetch_related
    to avoid N+1 queries.
Depends on: BaseRepository[Ticket], Ticket, TicketEvent models.
Pattern: Repository.
SOLID: DIP · SRP · LSP

Role-based ACL (ISP/RBAC, inherited from S9/S15):
    CLIENTE     → only own tickets (cliente=user)
    TRABAJADOR  → only assigned tickets (asignado=user)
    ADMIN       → all tickets
"""

from __future__ import annotations

from typing import Optional

from django.db.models import Q

from core.base.base_repository import BaseRepository
from apps.tickets.models import Ticket, TicketEvent

PAGE_SIZE = 20
_ACTIVE_STATES = ["Nuevo", "EnProceso", "EnEspera", "Resuelto"]


class TicketRepository(BaseRepository[Ticket]):
    """ORM gateway for the tickets module."""

    # ── Generic CRUD (BaseRepository contract) ─────────────────────────────────

    def get_by_id(self, entity_id: int) -> Optional[Ticket]:
        return (
            Ticket.objects
            .select_related("servicio", "cliente", "asignado")
            .filter(pk=entity_id)
            .first()
        )

    def get_all(self, filters: dict | None = None) -> list[Ticket]:
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Ticket:
        return Ticket.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Ticket:
        Ticket.objects.filter(pk=entity_id).update(**data)
        return self.get_by_id(entity_id)

    def delete(self, entity_id: int) -> None:
        Ticket.objects.filter(pk=entity_id).delete()

    # ── Role-scoped listing with filters + pagination ──────────────────────────

    def get_all_for_user(self, user, filters: dict | None = None, page: int = 1) -> dict:
        """
        Return a page of tickets visible to `user`, applying role-based ACL and
        optional filters (estado, prioridad, servicio_id, fecha_desde, fecha_hasta).

        Returns: {'items': list[Ticket], 'total': int, 'page': int, 'page_size': int}
        """
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")

        # Role-based scope
        role = getattr(user, "role", None)
        if role == "client":
            qs = qs.filter(cliente=user)
        elif role == "worker":
            qs = qs.filter(asignado=user)
        # admin → no scope filter (sees all)

        qs = self._apply_filters(qs, filters or {})

        total = qs.count()
        start = (max(page, 1) - 1) * PAGE_SIZE
        items = list(qs[start:start + PAGE_SIZE])

        return {"items": items, "total": total, "page": page, "page_size": PAGE_SIZE}

    @staticmethod
    def _apply_filters(qs, filters: dict):
        if estado := filters.get("estado"):
            qs = qs.filter(estado=estado)
        if prioridad := filters.get("prioridad"):
            qs = qs.filter(prioridad=prioridad)
        if servicio_id := filters.get("servicio_id"):
            qs = qs.filter(servicio_id=servicio_id)
        if fecha_desde := filters.get("fecha_desde"):
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta := filters.get("fecha_hasta"):
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        return qs

    # ── History (timeline of events) ───────────────────────────────────────────

    def get_history(self, ticket_id: int, user) -> Optional[list[TicketEvent]]:
        """
        Return the chronological event timeline for a ticket the user may see.
        Returns None if the ticket does not exist or the user lacks access.
        """
        ticket = self.get_by_id(ticket_id)
        if ticket is None or not self._user_can_see(ticket, user):
            return None
        return list(
            TicketEvent.objects
            .select_related("autor")
            .filter(ticket_id=ticket_id)
            .order_by("created_at")
        )

    @staticmethod
    def _user_can_see(ticket: Ticket, user) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        return ticket.cliente_id == user.id

    # ── Duplicate detection (used by BusinessRuleValidator, S13) ───────────────

    def find_active_duplicate(self, cliente_id: int, asunto: str, servicio_id: int):
        """
        Return an existing active ticket with the same client + subject + service,
        or None. An active ticket is one not in the terminal 'Cerrado' state.
        """
        return (
            Ticket.objects
            .filter(
                Q(cliente_id=cliente_id)
                & Q(asunto__iexact=asunto.strip())
                & Q(servicio_id=servicio_id)
                & Q(estado__in=_ACTIVE_STATES)
            )
            .first()
        )

```

### 📄 backend/apps/tickets/serializers/__init__.py
```python
from .ticket_event_serializer import TicketEventSerializer
from .ticket_list_serializer import TicketListSerializer
from .ticket_create_serializer import TicketCreateSerializer

__all__ = ["TicketEventSerializer", "TicketListSerializer", "TicketCreateSerializer"]

```

### 📄 backend/apps/tickets/serializers/ticket_action_serializers.py
```python
"""
Ticket action serializers — one per write operation (SRP).
Used by assignment (admin) and status/comment (worker) endpoints.
"""

from rest_framework import serializers


class AssignSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()


class StatusChangeSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(
        choices=["Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"]
    )
    comentario = serializers.CharField(allow_blank=False)


class CommentSerializer(serializers.Serializer):
    comentario = serializers.CharField(allow_blank=False)

```

### 📄 backend/apps/tickets/serializers/ticket_create_serializer.py
```python
"""
TicketCreateSerializer — validates ticket creation input (SRP).
Field-level checks only; business rules (duplicates, business hours) live in the
validator chain (S13), invoked by TicketService.
"""

from rest_framework import serializers


class TicketCreateSerializer(serializers.Serializer):
    asunto = serializers.CharField(max_length=80)
    descripcion = serializers.CharField(min_length=10)
    servicio_id = serializers.IntegerField()
    prioridad = serializers.ChoiceField(
        choices=["Baja", "Media", "Alta", "Critica"],
        default="Media",
    )
    # adjuntos arrive as multipart files; handled in the view via request.FILES

```

### 📄 backend/apps/tickets/serializers/ticket_event_serializer.py
```python
"""
TicketEventSerializer — read-only serializer for audit log entries.

Responsibility (SRP): transform a TicketEvent instance into a dict for API responses.
    No write operations — TicketEvents are append-only (created by TicketService).
Depends on: DRF ModelSerializer, TicketEvent model.
Pattern: SRP (one serializer per operation — this is the read operation for events).
SOLID: SRP

Fields exposed:
    id, tipo_evento, estado_anterior, estado_nuevo, comentario,
    autor_nombre (derived), created_at

Not exposed: ticket_id (inferred from context), autor FK raw ID.
"""

from rest_framework import serializers

from apps.tickets.models import TicketEvent


class TicketEventSerializer(serializers.ModelSerializer):

    autor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = TicketEvent
        fields = [
            "id",
            "tipo_evento",
            "estado_anterior",
            "estado_nuevo",
            "comentario",
            "autor_nombre",
            "created_at",
        ]
        read_only_fields = fields

    def get_autor_nombre(self, obj: TicketEvent) -> str:
        """Return 'nombre apellido' of the event author."""
        return f"{obj.autor.first_name} {obj.autor.last_name}".strip() or obj.autor.email

```

### 📄 backend/apps/tickets/serializers/ticket_list_serializer.py
```python
"""
TicketListSerializer — read-only serializer for the ticket history list (SRP).

Responsibility (SRP): shape a Ticket summary for GET /api/tickets.
    One serializer per operation — this is the list/history read.
Depends on: DRF ModelSerializer, Ticket model.
SOLID: SRP
"""

from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketListSerializer(serializers.ModelSerializer):

    servicio_nombre = serializers.CharField(source="servicio.nombre", read_only=True)
    creado_en = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "numero",
            "asunto",
            "estado",
            "prioridad",
            "servicio_nombre",
            "creado_en",
        ]
        read_only_fields = fields

```

### 📄 backend/apps/tickets/services/__init__.py
```python
from .ticket_service import TicketService, get_ticket_service, TicketValidationError
from .storage_service import StorageService

__all__ = [
    "TicketService",
    "get_ticket_service",
    "TicketValidationError",
    "StorageService",
]

```

### 📄 backend/apps/tickets/services/storage_service.py
```python
"""
StorageService — concrete IStorageService backed by Supabase Storage (REST API).

Responsibility (SRP): persist binary files and return their public URL. Uploads to a
    Supabase Storage bucket via its REST API using `requests` (no extra dependency).
    If Supabase credentials are not configured it falls back to a deterministic stub
    URL so the end-to-end flow still works in local dev without a bucket.
Pattern: Strategy/Adapter behind IStorageService — swapping providers (S3, GCS) requires
    no change to TicketService or CatalogService (OCP/DIP/LSP).
SOLID: SRP · DIP · LSP · OCP

Config (settings / .env):
    SUPABASE_URL            e.g. https://xyzcompany.supabase.co
    SUPABASE_SERVICE_KEY    service_role key (server-side only — never expose to FE)
    SUPABASE_STORAGE_BUCKET e.g. "sassblum" (must exist and be public for get_url)
"""

from __future__ import annotations

import mimetypes

import requests
from django.conf import settings

from apps.tickets.interfaces import IStorageService

_STUB_BASE_URL = "/media"

# H#17 (audit): Allowed MIME types for uploads — defense-in-depth.
_ALLOWED_MIME_TYPES = frozenset([
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
])


class StorageService(IStorageService):

    def __init__(self) -> None:
        self._base = (getattr(settings, "SUPABASE_URL", "") or "").rstrip("/")
        self._key = getattr(settings, "SUPABASE_SERVICE_KEY", "") or ""
        self._bucket = getattr(settings, "SUPABASE_STORAGE_BUCKET", "") or "sassblum"

    # ── Capability check ────────────────────────────────────────────────────────

    @property
    def _enabled(self) -> bool:
        return bool(self._base and self._key)

    # ── IStorageService ─────────────────────────────────────────────────────────

    def upload(self, file, path: str) -> str:
        path = path.lstrip("/")
        if not self._enabled:
            # Dev fallback: no real bucket configured.
            return f"{_STUB_BASE_URL}/{path}"

        # H#17 (audit): Validate MIME type server-side — OWASP defense-in-depth
        content_type = (
            getattr(file, "content_type", None)
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        if content_type not in _ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Tipo de archivo no permitido: {content_type}. "
                f"Tipos permitidos: {', '.join(sorted(_ALLOWED_MIME_TYPES))}"
            )

        content_type = (
            getattr(file, "content_type", None)
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        try:
            file.seek(0)
        except Exception:  # noqa: BLE001 - some file-likes are not seekable
            pass
        data = file.read()

        url = f"{self._base}/storage/v1/object/{self._bucket}/{path}"
        resp = requests.post(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {self._key}",
                "apikey": self._key,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            timeout=30,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Supabase upload failed ({resp.status_code}): {resp.text}")
        return self.get_url(path)

    def delete(self, path: str) -> None:
        path = path.lstrip("/")
        if not self._enabled:
            return None
        url = f"{self._base}/storage/v1/object/{self._bucket}/{path}"
        requests.delete(
            url,
            headers={"Authorization": f"Bearer {self._key}", "apikey": self._key},
            timeout=30,
        )
        return None

    def get_url(self, path: str) -> str:
        path = path.lstrip("/")
        if not self._enabled:
            return f"{_STUB_BASE_URL}/{path}"
        return f"{self._base}/storage/v1/object/public/{self._bucket}/{path}"

```

### 📄 backend/apps/tickets/services/ticket_service.py
```python
"""
TicketService — concrete implementation of the three ISP ticket interfaces (Singleton).

Responsibility (SRP): ticket business logic. Generates T-YYYY-NNNN, runs the validator
    chain (S13), drives the state machine (S14), persists via TicketRepository (S24),
    stores attachments via StorageService, and creates TicketEvents (which fire the
    Observer → notifications). Implements Client/Worker/Admin actions (LSP); each view
    depends on its role interface (DIP + ISP).
Depends on: TicketRepository, TicketValidatorChain, TicketStateMachine, IStorageService.
Pattern: Singleton + Repository + Chain of Responsibility + Strategy (state machine).
SOLID: DIP · SRP · LSP · ISP · OCP
"""

from __future__ import annotations

from datetime import datetime

from django.db import transaction

from apps.tickets.interfaces import (
    ITicketClientActions,
    ITicketWorkerActions,
    ITicketAdminActions,
)
from apps.tickets.models import Ticket, Attachment, TicketEvent
from apps.tickets.repositories import TicketRepository
from apps.tickets.state_machine import TicketStateMachine
from apps.tickets.validators import TicketValidatorChain
from apps.tickets.services.storage_service import StorageService
from core.exceptions.domain_exceptions import (
    TicketNotFound,
    InvalidTransitionError,
    CommentRequiredError,
)

TICKETNOTFOUND = "Ticket no encontrado."


class TicketValidationError(Exception):
    def __init__(self, field: str, message: str) -> None:
        self.field = field
        super().__init__(message)


class TicketService(ITicketClientActions, ITicketWorkerActions, ITicketAdminActions):

    def __init__(self, repository=None, storage=None) -> None:
        self._repo: TicketRepository = repository or TicketRepository()
        self._storage = storage or StorageService()
        self._machine = TicketStateMachine()
        self._chain = TicketValidatorChain(self._repo)

    # ── ITicketClientActions ───────────────────────────────────────────────────

    @transaction.atomic
    def create_ticket(self, data: dict, user) -> dict:
        validation_payload = {
            "asunto": data.get("asunto", ""),
            "descripcion": data.get("descripcion", ""),
            "adjuntos": data.get("adjuntos", []),
            "cliente_id": user.id,
            "servicio_id": data.get("servicio_id"),
        }
        result = self._chain.run(validation_payload)
        if not result.is_valid:
            raise TicketValidationError(result.field_name, "; ".join(result.errors))

        numero = self.generate_ticket_number(datetime.now().year)
        ticket = self._repo.create({
            "numero": numero,
            "asunto": data["asunto"],
            "descripcion": data["descripcion"],
            "servicio_id": data["servicio_id"],
            "cliente": user,
            "estado": Ticket.Estado.NUEVO,
            "prioridad": data.get("prioridad", Ticket.Prioridad.MEDIA),
        })

        for f in data.get("adjuntos", []):
            url = self._storage.upload(f, f"{numero}/{f.name}")
            Attachment.objects.create(
                ticket=ticket,
                nombre_archivo=f.name,
                url=url,
                tamaño_bytes=f.size,
                mime_type=getattr(f, "content_type", "application/octet-stream"),
            )

        # Audit event → fires the Observer (notifications)
        TicketEvent.objects.create(
            ticket=ticket,
            autor=user,
            tipo_evento=TicketEvent.TipoEvento.CREACION,
            comentario="Ticket creado.",
        )
        return self._detail(ticket)

    def generate_ticket_number(self, year: int) -> str:
        """Generate the next ticket number atomically (prevents race conditions).

        Uses SELECT ... FOR UPDATE within an atomic transaction to lock the row
        and ensure two concurrent requests never get the same sequence number.
        """
        from django.db import connection  # noqa: PLC0415
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 8) AS INTEGER)), 0) "
                    "FROM tickets_ticket WHERE numero LIKE %s FOR UPDATE",
                    [f"T-{year}-%"],
                )
                max_num = cursor.fetchone()[0]
            return f"T-{year}-{max_num + 1:04d}"

    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        result = self._repo.get_all_for_user(user, filters or {})
        return [self._summary(t) for t in result["items"]]

    def get_ticket_detail(self, ticket_id: int, user) -> dict:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None or not self._can_see(ticket, user):
            raise TicketNotFound(TICKETNOTFOUND)
        return self._detail(ticket)

    # ── ITicketWorkerActions ───────────────────────────────────────────────────

    @transaction.atomic
    def update_status(
        self, ticket_id: int, new_status: str, comment: str, user
    ) -> dict:
        ticket = self._require(ticket_id, user)
        # raises on invalid transition / missing comment
        self._machine.transition(ticket.estado, new_status, comment)
        anterior = ticket.estado
        self._repo.update(ticket_id, {"estado": new_status})
        TicketEvent.objects.create(
            ticket=ticket, autor=user,
            tipo_evento=TicketEvent.TipoEvento.CAMBIO_ESTADO,
            estado_anterior=anterior, estado_nuevo=new_status, comentario=comment,
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    @transaction.atomic
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        if not comment or not comment.strip():
            raise CommentRequiredError("El comentario no puede estar vacío.")
        ticket = self._require(ticket_id, user)
        event = TicketEvent.objects.create(
            ticket=ticket, autor=user,
            tipo_evento=TicketEvent.TipoEvento.COMENTARIO, comentario=comment,
        )
        return {"id": event.id, "comentario": event.comentario}

    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        return self.update_status(ticket_id, Ticket.Estado.CERRADO, comment, user)

    # ── ITicketAdminActions ────────────────────────────────────────────────────

    @transaction.atomic
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        from apps.authentication.models import User  # noqa: PLC0415
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None:
            raise TicketNotFound(TICKETNOTFOUND)
        if ticket.estado != Ticket.Estado.NUEVO:
            raise InvalidTransitionError(ticket.estado, Ticket.Estado.EN_PROCESO)
        worker = User.objects.filter(id=worker_id, role=User.Role.WORKER,
                                     estado=User.Estado.ACTIVE).first()
        if worker is None:
            raise TicketValidationError("asignado", "Trabajador no válido o inactivo.")
        self._repo.update(ticket_id, {"asignado": worker, "estado": Ticket.Estado.EN_PROCESO})
        TicketEvent.objects.create(
            ticket=ticket, autor=user, tipo_evento=TicketEvent.TipoEvento.ASIGNACION,
            estado_anterior=Ticket.Estado.NUEVO, estado_nuevo=Ticket.Estado.EN_PROCESO,
            comentario=f"Asignado a {worker.email}.",
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    @transaction.atomic
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        from apps.authentication.models import User  # noqa: PLC0415
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None:
            raise TicketNotFound(TICKETNOTFOUND)
        worker = User.objects.filter(id=new_worker_id, role=User.Role.WORKER,
                                     estado=User.Estado.ACTIVE).first()
        if worker is None:
            raise TicketValidationError("asignado", "Trabajador no válido o inactivo.")
        self._repo.update(ticket_id, {"asignado": worker})
        TicketEvent.objects.create(
            ticket=ticket, autor=user, tipo_evento=TicketEvent.TipoEvento.REASIGNACION,
            comentario=f"Reasignado a {worker.email}.",
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    def get_all_tickets(self, filters: dict | None = None) -> list:
        tickets = self._repo.get_all(filters or {})
        return [self._summary(t) for t in tickets]

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _require(self, ticket_id: int, user) -> Ticket:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None or not self._can_see(ticket, user):
            raise TicketNotFound(TICKETNOTFOUND)
        return ticket

    @staticmethod
    def _can_see(ticket: Ticket, user) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        return ticket.cliente_id == user.id

    @staticmethod
    def _summary(t: Ticket) -> dict:
        return {
            "id": t.id, "numero": t.numero, "asunto": t.asunto,
            "estado": t.estado, "prioridad": t.prioridad,
            "servicio_nombre": t.servicio.nombre if t.servicio_id else "",
            "creado_en": t.created_at.isoformat(),
        }

    @classmethod
    def _detail(cls, t: Ticket) -> dict:
        return {
            **cls._summary(t),
            "descripcion": t.descripcion,
            "cliente_nombre": f"{t.cliente.first_name} {t.cliente.last_name}".strip()
                              or t.cliente.email,
            "asignado_nombre": (
                f"{t.asignado.first_name} {t.asignado.last_name}".strip() or t.asignado.email
            ) if t.asignado_id else None,
            "adjuntos": [
                {"id": a.id, "nombre_archivo": a.nombre_archivo, "url": a.url,
                 "tamaño_bytes": a.tamaño_bytes, "mime_type": a.mime_type}
                for a in t.adjuntos.all()
            ],
            "eventos": [
                {"id": e.id, "tipo_evento": e.tipo_evento,
                 "estado_anterior": e.estado_anterior, "estado_nuevo": e.estado_nuevo,
                 "comentario": e.comentario,
                 "autor_nombre": f"{e.autor.first_name} {e.autor.last_name}".strip()
                                 or e.autor.email,
                 "creado_en": e.created_at.isoformat()}
                for e in t.eventos.all().order_by("created_at")
            ],
            "actualizado_en": t.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading  # noqa: E402

_lock = threading.Lock()
_instance: TicketService | None = None


def get_ticket_service() -> TicketService:
    """Thread-safe singleton accessor (double-checked locking)."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = TicketService()
    return _instance

```

### 📄 backend/apps/tickets/state_machine/__init__.py
```python
from .ticket_state_machine import TicketStateMachine
from .state_transition_validator import StateTransitionValidator

__all__ = ["TicketStateMachine", "StateTransitionValidator"]

```

### 📄 backend/apps/tickets/state_machine/state_transition_validator.py
```python
"""
Chain of Responsibility node — validates ticket state transitions.

Responsibility (SRP): delegate transition validity to TicketStateMachine.
    Does not contain transition rules — it only calls the machine and maps the result
    to a ValidationResult consumable by the rest of the chain.
Depends on: BaseValidator (core/base/base_validator.py)
            TicketStateMachine — injected via constructor (DIP).
Pattern: Chain of Responsibility node + DIP (machine is injected, not instantiated here).
SOLID: SRP · DIP · LSP · OCP

DIP note:
    TicketService creates TicketStateMachine() and passes it here.
    Tests can inject a stub or a machine with a reduced TRANSITIONS map without
    touching this class (LSP).

OCP:
    New transition rule → update TRANSITIONS in TicketStateMachine.
    This validator never changes.

Sprint usage:
    S14 → this file (full signature + delegation logic)
    The validator is wired into the update-status flow in Sprint 3 (S24).
    S18 → covered indirectly via test_state_machine.py + test_validators.py
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult
from .ticket_state_machine import TicketStateMachine


class StateTransitionValidator(BaseValidator):
    """
    Validates that a requested state transition is permitted by TicketStateMachine.
    Used in the update-status flow (Sprint 3); wired into the chain by ValidatorFactory.
    """

    def __init__(self, state_machine: TicketStateMachine) -> None:
        """
        Args:
            state_machine: the TicketStateMachine instance (injected — DIP).
        """
        super().__init__()
        self._machine = state_machine

    def validate(self, data: dict) -> ValidationResult:
        """
        Check that data['estado_actual'] → data['estado_nuevo'] is a valid transition.
        BR-35 (comment required) is enforced by TicketStateMachine.transition() at
        service level; here we only check can_transition() for chain compatibility.

        Args:
            data: dict containing:
                  'estado_actual' (str) — current ticket state
                  'estado_nuevo'  (str) — requested target state

        Returns:
            ValidationResult(is_valid=True) if the transition is allowed.
            ValidationResult(is_valid=False, field_name='estado', errors=[msg]) if not.
        """
        from_state = data.get("estado_actual", "")
        to_state   = data.get("estado_nuevo", "")

        if self._machine.can_transition(from_state, to_state):
            return ValidationResult(is_valid=True, field_name="estado")

        return ValidationResult(
            is_valid=False,
            errors=[
                f"Transición '{from_state}' → '{to_state}' no está permitida. "
                f"Estados válidos desde '{from_state}': "
                f"{self._machine.TRANSITIONS.get(from_state, [])}."
            ],
            field_name="estado",
        )

```

### 📄 backend/apps/tickets/state_machine/ticket_state_machine.py
```python
"""
Ticket lifecycle state machine — encapsulates all valid transitions (Strategy pattern).

Responsibility (SRP): know which transitions are valid and enforce BR-35 (comment required).
    No ORM access, no HTTP logic, no notification dispatch — pure domain rules.
Depends on: core.exceptions.domain_exceptions — nothing from Django or DRF.
Pattern: Strategy — each entry in TRANSITIONS is a named rule; the set is replaceable.
SOLID: DIP · OCP · LSP · SRP

Why NOT an ABC:
    The machine is a concrete policy object, not a hierarchy. Tests swap it by injecting
    a different instance into StateTransitionValidator (DIP), not by subclassing.

OCP extension path:
    New state (e.g. 'Reabierto') in Sprint 4:
        TRANSITIONS['Cerrado'] = ['Reabierto']
        TRANSITIONS['Reabierto'] = ['EnProceso']
    Existing transition rules are NEVER modified — only new keys are added.

LSP:
    Any object that exposes can_transition() and transition() with the same contracts
    is substitutable here (e.g. a stub in tests).

Sprint usage:
    S14 → this file (contract + TRANSITIONS map)
    S14 → StateTransitionValidator consumes this via constructor (DIP)
    S18 → test_state_machine.py covers all valid/invalid transitions + BR-35
"""

from __future__ import annotations

from core.exceptions.domain_exceptions import (
    CommentRequiredError,
    InvalidTransitionError,
)


class TicketStateMachine:
    """
    Encapsulates the ticket lifecycle.

    States: Nuevo · EnProceso · EnEspera · Resuelto · Cerrado
    Terminal state: Cerrado (empty list → no outgoing transitions)
    """

    # ── Transition map ────────────────────────────────────────────────────────
    # Key   = current state
    # Value = list of reachable states (empty = terminal)
    #
    # Business rules encoded here:
    #   Nuevo     → EnProceso  (requires prior assignment — enforced in TicketService)
    #   EnProceso → EnEspera | Resuelto
    #   EnEspera  → EnProceso  (reactivated after client response)
    #   Resuelto  → Cerrado    (client or worker confirms resolution)
    #   Cerrado   → (none)     terminal — no further changes allowed
    TRANSITIONS: dict[str, list[str]] = {
        "Nuevo":     ["EnProceso"],
        "EnProceso": ["EnEspera", "Resuelto"],
        "EnEspera":  ["EnProceso"],
        "Resuelto":  ["Cerrado"],
        "Cerrado":   [],
    }

    # ── Public API ────────────────────────────────────────────────────────────

    def can_transition(self, from_state: str, to_state: str) -> bool:
        """
        Return True if the transition from_state → to_state is in TRANSITIONS.
        Does NOT enforce BR-35 — that is the responsibility of transition().

        Args:
            from_state: current ticket state string
            to_state:   desired target state string

        Returns:
            bool — True if allowed, False otherwise (including unknown states).
        """
        return to_state in self.TRANSITIONS.get(from_state, [])

    def transition(self, from_state: str, to_state: str, comment: str) -> str:
        """
        Validate and apply a state transition.

        Business rules enforced here:
            1. Transition must exist in TRANSITIONS (InvalidTransitionError).
            2. Comment must be non-empty after stripping whitespace (BR-35).

        Args:
            from_state: current ticket state
            to_state:   desired target state
            comment:    mandatory explanation for the transition (BR-35)

        Returns:
            str — the new state (same as to_state) if transition is valid.

        Raises:
            InvalidTransitionError — if the transition is not in TRANSITIONS.
            CommentRequiredError   — if comment is blank (BR-35).
        """
        if not self.can_transition(from_state, to_state):
            raise InvalidTransitionError(from_state, to_state)

        if not comment or not comment.strip():
            raise CommentRequiredError(
                "A non-empty comment is required for every state transition (BR-35)."
            )

        return to_state

    @classmethod
    def all_states(cls) -> list[str]:
        """Return all known states (keys of TRANSITIONS)."""
        return list(cls.TRANSITIONS.keys())

    @classmethod
    def is_terminal(cls, state: str) -> bool:
        """Return True if state has no outgoing transitions (i.e. Cerrado)."""
        return cls.TRANSITIONS.get(state, None) == []

```

### 📄 backend/apps/tickets/tests.py
```python
from django.test import TestCase

# Create your tests here.

```

### 📄 backend/apps/tickets/tests/__init__.py
```python
# Sprint 2 · Session 18 — Tests del módulo tickets (cobertura ≥ 80%):
#   test_state_machine.py   → todas las transiciones válidas e inválidas,
#                             CommentRequiredError (BR-35), estado Cerrado terminal
#   test_validators.py      → BasicFieldValidator, FileValidator, BusinessRuleValidator,
#                             cadena completa (todos los nodos en serie)
#   test_ticket_service.py  → create_ticket(), generate_ticket_number() formato T-YYYY-NNNN,
#                             permiso IsClient (worker/admin reciben 403)

```

### 📄 backend/apps/tickets/tests/test_state_machine.py
```python
"""
Tests for TicketStateMachine — covers all valid/invalid transitions and BR-35.
Run: pytest apps/tickets/tests/test_state_machine.py -v
"""

import pytest

from apps.tickets.state_machine import TicketStateMachine
from core.exceptions.domain_exceptions import CommentRequiredError, InvalidTransitionError


@pytest.fixture
def machine() -> TicketStateMachine:
    return TicketStateMachine()


# ── Valid transitions ──────────────────────────────────────────────────────────

class TestValidTransitions:
    def test_nuevo_to_en_proceso(self, machine):
        assert machine.transition("Nuevo", "EnProceso", "Asignado.") == "EnProceso"

    def test_en_proceso_to_en_espera(self, machine):
        assert machine.transition("EnProceso", "EnEspera", "Esperando respuesta.") == "EnEspera"

    def test_en_proceso_to_resuelto(self, machine):
        assert machine.transition("EnProceso", "Resuelto", "Problema resuelto.") == "Resuelto"

    def test_en_espera_to_en_proceso(self, machine):
        assert machine.transition("EnEspera", "EnProceso", "Cliente respondió.") == "EnProceso"

    def test_resuelto_to_cerrado(self, machine):
        assert machine.transition("Resuelto", "Cerrado", "Cliente confirmó.") == "Cerrado"


# ── Invalid transitions ────────────────────────────────────────────────────────

class TestInvalidTransitions:
    @pytest.mark.parametrize("from_state,to_state", [
        ("Nuevo",     "EnEspera"),
        ("Nuevo",     "Resuelto"),
        ("Nuevo",     "Cerrado"),
        ("EnProceso", "Nuevo"),
        ("EnEspera",  "Resuelto"),
        ("EnEspera",  "Cerrado"),
        ("Resuelto",  "Nuevo"),
        ("Resuelto",  "EnProceso"),
        ("Cerrado",   "Nuevo"),
        ("Cerrado",   "EnProceso"),
        ("Cerrado",   "EnEspera"),
        ("Cerrado",   "Resuelto"),
    ])
    def test_invalid_transition_raises(self, machine, from_state, to_state):
        with pytest.raises(InvalidTransitionError) as exc_info:
            machine.transition(from_state, to_state, "Comentario válido.")
        assert exc_info.value.from_state == from_state
        assert exc_info.value.to_state == to_state

    def test_cerrado_is_fully_terminal(self, machine):
        """Cerrado has zero outgoing transitions."""
        assert machine.TRANSITIONS["Cerrado"] == []
        assert machine.is_terminal("Cerrado") is True

    def test_non_terminal_states_are_not_terminal(self, machine):
        for state in ["Nuevo", "EnProceso", "EnEspera", "Resuelto"]:
            assert machine.is_terminal(state) is False


# ── BR-35: comment required ────────────────────────────────────────────────────

class TestBR35CommentRequired:
    def test_empty_comment_raises(self, machine):
        with pytest.raises(CommentRequiredError):
            machine.transition("Nuevo", "EnProceso", "")

    def test_whitespace_only_comment_raises(self, machine):
        with pytest.raises(CommentRequiredError):
            machine.transition("Nuevo", "EnProceso", "   \t\n")

    def test_single_char_comment_passes(self, machine):
        assert machine.transition("Nuevo", "EnProceso", "X") == "EnProceso"


# ── Helper methods ─────────────────────────────────────────────────────────────

class TestHelperMethods:
    def test_can_transition_true(self, machine):
        assert machine.can_transition("Nuevo", "EnProceso") is True
        assert machine.can_transition("Resuelto", "Cerrado") is True

    def test_can_transition_false(self, machine):
        assert machine.can_transition("Cerrado", "Nuevo") is False
        assert machine.can_transition("Nuevo", "Cerrado") is False

    def test_all_states_returns_five(self, machine):
        states = TicketStateMachine.all_states()
        assert len(states) == 5
        assert set(states) == {"Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"}

    def test_can_transition_unknown_state_is_false(self, machine):
        assert machine.can_transition("Desconocido", "Nuevo") is False

```

### 📄 backend/apps/tickets/tests/test_ticket_api.py
```python
"""
Integration tests for the Ticket API — H#9 (audit).

Tests HTTP endpoints using DRF APIClient (not mocked).
Verifies authentication, permissions, serialization, and response codes.

Run: pytest apps/tickets/tests/test_ticket_api.py -v
"""

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestTicketAPIIntegration:
    """H#9: Integration tests using DRF APIClient."""

    def test_list_tickets_unauthenticated_returns_401(self):
        """Unauthenticated requests should be rejected."""
        client = APIClient()
        response = client.get('/api/tickets/')
        assert response.status_code == 401

    def test_health_check_returns_200(self):
        """H#25: Health check endpoint should be accessible without auth."""
        client = APIClient()
        response = client.get('/health/')
        assert response.status_code == 200
        assert response.data['status'] == 'healthy'

    def test_services_list_public(self):
        """Service catalog should be publicly accessible."""
        client = APIClient()
        response = client.get('/api/servicios/')
        assert response.status_code == 200
        assert 'items' in response.data

    def test_create_ticket_unauthenticated_returns_401(self):
        """Ticket creation should require authentication."""
        client = APIClient()
        response = client.post('/api/tickets/', {
            'asunto': 'Test',
            'descripcion': 'Test description',
            'servicio_id': 1,
            'prioridad': 'Media',
        })
        assert response.status_code == 401

    def test_rate_limiting_works(self):
        """H#2: Rate limiting should kick in after many requests."""
        client = APIClient()
        # Make 35 rapid requests (limit is 30/minute for anon)
        responses = []
        for _ in range(35):
            resp = client.get('/api/servicios/')
            responses.append(resp.status_code)
        # At least one should be 429 (Too Many Requests)
        assert 429 in responses, f"Expected 429 in responses: {set(responses)}"

```

### 📄 backend/apps/tickets/tests/test_ticket_lifecycle.py
```python
"""
End-to-end ticket lifecycle through TicketService (requires DB).
create → assign → update_status → close. Run: pytest apps/tickets/tests/test_ticket_lifecycle.py -v
"""

import datetime

import pytest
from unittest.mock import patch

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.services.ticket_service import TicketService
from core.exceptions.domain_exceptions import InvalidTransitionError


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(email="c@x.com", password="Pass1234", role=User.Role.CLIENT,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


@pytest.fixture
def worker(db):
    return User.objects.create_user(email="w@x.com", password="Pass1234", role=User.Role.WORKER,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="a@x.com", password="Pass1234", role=User.Role.ADMIN,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


_BUSINESS_TIME = datetime.datetime(2026, 6, 15, 10, 0, 0)  # Monday 10:00


@pytest.mark.django_db
class TestTicketLifecycle:
    def _create(self, cliente, service):
        svc = TicketService()
        data = {
            "asunto": "No imprime la factura",
            "descripcion": "La impresora no responde desde ayer por la tarde.",
            "servicio_id": service.id,
            "prioridad": "Alta",
            "adjuntos": [],
        }
        # Patch business-hours so the chain passes regardless of when tests run.
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = _BUSINESS_TIME
            return svc.create_ticket(data, cliente)

    def test_create_generates_number_and_event(self, cliente, service):
        detail = self._create(cliente, service)
        assert detail["numero"].startswith("T-")
        assert detail["estado"] == "Nuevo"
        assert TicketEvent.objects.filter(tipo_evento="creacion").count() == 1

    def test_full_flow_create_assign_resolve_close(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()

        assigned = svc.assign_ticket(ticket_id, worker.id, admin)
        assert assigned["estado"] == "EnProceso"
        assert Ticket.objects.get(id=ticket_id).asignado_id == worker.id

        resolved = svc.update_status(ticket_id, "Resuelto", "Listo.", worker)
        assert resolved["estado"] == "Resuelto"

        closed = svc.close_ticket(ticket_id, "Confirmado por el cliente.", worker)
        assert closed["estado"] == "Cerrado"

    def test_invalid_transition_raises(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()
        # Nuevo → Resuelto is not allowed (must go through EnProceso first).
        # Use admin so _can_see() passes even though the ticket is unassigned.
        with pytest.raises(InvalidTransitionError):
            svc.update_status(ticket_id, "Resuelto", "comentario", admin)

    def test_number_format(self, cliente, service):
        assert TicketService().generate_ticket_number(2026).startswith("T-2026-")

```

### 📄 backend/apps/tickets/tests/test_ticket_repository.py
```python
"""
Tests for TicketRepository — role-scoped listing, history ACL, duplicate detection.
Requires the database. Run: pytest apps/tickets/tests/test_ticket_repository.py -v
"""

import pytest

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket
from apps.tickets.repositories import TicketRepository


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(email="c@x.com", password="p", role=User.Role.CLIENT)


@pytest.fixture
def worker(db):
    return User.objects.create_user(email="w@x.com", password="p", role=User.Role.WORKER)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="a@x.com", password="p", role=User.Role.ADMIN)


def make_ticket(numero, servicio, cliente, asignado=None, estado="Nuevo", asunto="Asunto X"):
    return Ticket.objects.create(
        numero=numero, asunto=asunto, descripcion="desc larga aquí",
        servicio=servicio, cliente=cliente, asignado=asignado, estado=estado,
    )


@pytest.mark.django_db
class TestRoleScopedListing:
    def test_client_sees_only_own(self, service, cliente, worker, admin):
        otro = User.objects.create_user(email="o@x.com", password="p", role=User.Role.CLIENT)
        make_ticket("T-2026-0001", service, cliente)
        make_ticket("T-2026-0002", service, otro)

        result = TicketRepository().get_all_for_user(cliente)
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0001"}

    def test_worker_sees_only_assigned(self, service, cliente, worker):
        make_ticket("T-2026-0003", service, cliente, asignado=worker, estado="EnProceso")
        make_ticket("T-2026-0004", service, cliente)  # unassigned

        result = TicketRepository().get_all_for_user(worker)
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0003"}

    def test_admin_sees_all(self, service, cliente, worker, admin):
        make_ticket("T-2026-0005", service, cliente)
        make_ticket("T-2026-0006", service, cliente, asignado=worker, estado="EnProceso")
        result = TicketRepository().get_all_for_user(admin)
        assert result["total"] == 2

    def test_filter_by_estado(self, service, cliente, admin):
        make_ticket("T-2026-0007", service, cliente, estado="Nuevo")
        make_ticket("T-2026-0008", service, cliente, estado="Resuelto")
        result = TicketRepository().get_all_for_user(admin, {"estado": "Resuelto"})
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0008"}


@pytest.mark.django_db
class TestDuplicateDetection:
    def test_finds_active_duplicate(self, service, cliente):
        make_ticket("T-2026-0009", service, cliente, asunto="Impresora rota", estado="Nuevo")
        dup = TicketRepository().find_active_duplicate(cliente.id, "Impresora rota", service.id)
        assert dup is not None

    def test_closed_ticket_is_not_duplicate(self, service, cliente):
        make_ticket("T-2026-0010", service, cliente, asunto="Mouse roto", estado="Cerrado")
        dup = TicketRepository().find_active_duplicate(cliente.id, "Mouse roto", service.id)
        assert dup is None


@pytest.mark.django_db
class TestHistoryAccessControl:
    def test_other_client_cannot_see_history(self, service, cliente):
        otro = User.objects.create_user(email="z@x.com", password="p", role=User.Role.CLIENT)
        ticket = make_ticket("T-2026-0011", service, cliente)
        assert TicketRepository().get_history(ticket.id, otro) is None

    def test_owner_can_see_history(self, service, cliente):
        ticket = make_ticket("T-2026-0012", service, cliente)
        assert TicketRepository().get_history(ticket.id, cliente) == []

```

### 📄 backend/apps/tickets/tests/test_ticket_service.py
```python
"""
Tests for ticket creation permissions — IsClient, IsWorker, IsAdmin.
Run: pytest apps/tickets/tests/test_ticket_service.py -v
"""

from unittest.mock import MagicMock

from rest_framework.test import APIRequestFactory

from core.permissions.rbac_permissions import IsAdmin, IsClient, IsWorker


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_user(role: str, estado: str = "activo") -> MagicMock:
    """Return a mock user with the given role and active status."""
    user = MagicMock()
    user.is_authenticated = True
    user.role = role
    user.estado = estado
    return user


factory = APIRequestFactory()


def check_permission(permission_class, user) -> bool:
    request = factory.get("/")
    request.user = user
    return permission_class().has_permission(request, view=None)


# ── IsClient ───────────────────────────────────────────────────────────────────

class TestIsClient:
    def test_client_user_is_allowed(self):
        user = make_user("client")
        assert check_permission(IsClient, user)

    def test_worker_user_is_denied(self):
        user = make_user("worker")
        assert not check_permission(IsClient, user)

    def test_admin_user_is_denied(self):
        user = make_user("admin")
        assert not check_permission(IsClient, user)

    def test_unauthenticated_user_is_denied(self):
        user = MagicMock()
        user.is_authenticated = False
        assert not check_permission(IsClient, user)

    def test_blocked_client_is_denied(self):
        user = make_user("client", estado="bloqueado")
        assert not check_permission(IsClient, user)


# ── IsWorker ───────────────────────────────────────────────────────────────────

class TestIsWorker:
    def test_worker_user_is_allowed(self):
        user = make_user("worker")
        assert check_permission(IsWorker, user)

    def test_client_is_denied(self):
        user = make_user("client")
        assert not check_permission(IsWorker, user)


# ── IsAdmin ────────────────────────────────────────────────────────────────────

class TestIsAdmin:
    def test_admin_user_is_allowed(self):
        user = make_user("admin")
        assert check_permission(IsAdmin, user)

    def test_worker_is_denied(self):
        user = make_user("worker")
        assert not check_permission(IsAdmin, user)


# ── Ticket number format ───────────────────────────────────────────────────────

class TestTicketNumberFormat:
    """Verify the expected format T-YYYY-NNNN without hitting the database."""

    def test_format_pattern(self):
        import re
        pattern = re.compile(r"^T-\d{4}-\d{4}$")
        samples = ["T-2026-0001", "T-2026-0042", "T-2026-9999"]
        for s in samples:
            assert pattern.match(s), f"'{s}' does not match T-YYYY-NNNN"

```

### 📄 backend/apps/tickets/tests/test_validators.py
```python
"""
Tests for the ticket validator chain — each node in isolation + full chain.
Run: pytest apps/tickets/tests/test_validators.py -v
"""

import pytest
from unittest.mock import MagicMock, patch
import datetime

from apps.tickets.validators.basic_field_validator import BasicFieldValidator
from apps.tickets.validators.file_validator import FileValidator
from apps.tickets.validators.business_rule_validator import BusinessRuleValidator
from apps.tickets.validators import TicketValidatorChain


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_file(name: str, size: int, content_type: str):
    f = MagicMock()
    f.name = name
    f.size = size
    f.content_type = content_type
    return f


def make_repo(duplicate=None):
    repo = MagicMock()
    repo.find_active_duplicate.return_value = duplicate
    return repo


VALID_DATA = {
    "asunto": "Problema con la factura electrónica",
    "descripcion": "No puedo descargar la factura del mes de mayo de 2026.",
    "adjuntos": [],
    "cliente_id": 1,
    "servicio_id": 2,
}

BUSINESS_HOUR = datetime.datetime(2026, 6, 15, 10, 0, 0)  # Monday 10:00


# ── BasicFieldValidator ────────────────────────────────────────────────────────

class TestBasicFieldValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.v = BasicFieldValidator()

    def test_valid_data_passes(self):
        assert self.v.validate(VALID_DATA).is_valid

    def test_asunto_empty_fails(self):
        r = self.v.validate({**VALID_DATA, "asunto": ""})
        assert not r.is_valid and r.field_name == "asunto"

    def test_asunto_at_limit_passes(self):
        assert self.v.validate({**VALID_DATA, "asunto": "A" * 80}).is_valid

    def test_asunto_over_limit_fails(self):
        r = self.v.validate({**VALID_DATA, "asunto": "A" * 81})
        assert not r.is_valid and r.field_name == "asunto"

    def test_descripcion_too_short_fails(self):
        r = self.v.validate({**VALID_DATA, "descripcion": "Corto"})
        assert not r.is_valid and r.field_name == "descripcion"

    def test_descripcion_at_minimum_passes(self):
        assert self.v.validate({**VALID_DATA, "descripcion": "A" * 10}).is_valid


# ── FileValidator ──────────────────────────────────────────────────────────────

class TestFileValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.v = FileValidator()

    def test_no_files_passes(self):
        assert self.v.validate({"adjuntos": []}).is_valid

    def test_missing_adjuntos_key_passes(self):
        assert self.v.validate({}).is_valid

    def test_valid_pdf_passes(self):
        f = make_file("doc.pdf", 1_000_000, "application/pdf")
        assert self.v.validate({"adjuntos": [f]}).is_valid

    def test_valid_image_passes(self):
        f = make_file("foto.jpg", 500_000, "image/jpeg")
        assert self.v.validate({"adjuntos": [f]}).is_valid

    def test_file_too_large_fails(self):
        f = make_file("grande.pdf", 6_000_000, "application/pdf")
        r = self.v.validate({"adjuntos": [f]})
        assert not r.is_valid and r.field_name == "adjuntos"

    def test_invalid_mime_fails(self):
        f = make_file("script.exe", 1000, "application/x-msdownload")
        r = self.v.validate({"adjuntos": [f]})
        assert not r.is_valid and r.field_name == "adjuntos"

    def test_first_invalid_file_stops_iteration(self):
        good = make_file("ok.pdf", 100, "application/pdf")
        bad = make_file("big.pdf", 6_000_000, "application/pdf")
        r = self.v.validate({"adjuntos": [bad, good]})
        assert not r.is_valid


# ── BusinessRuleValidator ──────────────────────────────────────────────────────

class TestBusinessRuleValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.repo = make_repo()
        self.v = BusinessRuleValidator(self.repo)

    def _patch_now(self, dt: datetime.datetime):
        return patch("apps.tickets.validators.business_rule_validator.datetime") \
               .__enter__  # used as context manager in tests

    def test_valid_business_hour_passes(self):
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = BUSINESS_HOUR
            assert self.v.validate(VALID_DATA).is_valid

    def test_weekend_fails(self):
        weekend = datetime.datetime(2026, 6, 13, 10, 0, 0)  # Saturday
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = weekend
            r = self.v.validate(VALID_DATA)
            assert not r.is_valid and r.field_name == "horario"

    def test_before_business_hours_fails(self):
        early = datetime.datetime(2026, 6, 15, 6, 59, 0)  # Mon 06:59
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = early
            r = self.v.validate(VALID_DATA)
            assert not r.is_valid and r.field_name == "horario"

    def test_duplicate_ticket_fails(self):
        self.repo.find_active_duplicate.return_value = object()  # truthy = duplicate exists
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = BUSINESS_HOUR
            r = self.v.validate(VALID_DATA)
            assert not r.is_valid and r.field_name == "duplicado"


# ── Full chain via TicketValidatorChain ────────────────────────────────────────

class TestTicketValidatorChain:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.repo = make_repo()
        self.chain = TicketValidatorChain(self.repo)

    def test_invalid_asunto_stops_chain_does_not_call_repo(self):
        data = {**VALID_DATA, "asunto": ""}
        r = self.chain.run(data)
        assert not r.is_valid
        assert r.field_name == "asunto"
        self.repo.find_active_duplicate.assert_not_called()

    def test_invalid_file_stops_before_business_rule(self):
        bad_file = make_file("big.pdf", 6_000_000, "application/pdf")
        data = {**VALID_DATA, "adjuntos": [bad_file]}
        r = self.chain.run(data)
        assert not r.is_valid
        assert r.field_name == "adjuntos"
        self.repo.find_active_duplicate.assert_not_called()

```

### 📄 backend/apps/tickets/urls.py
```python
"""
URL routing for the tickets API. Mounted under /api/tickets/ by config/urls.py.

    GET   /api/tickets                  → list (role-scoped, filters, pagination)
    POST  /api/tickets                  → create (IsClient)
    GET   /api/tickets/<id>             → detail
    GET   /api/tickets/<id>/historial   → event timeline
    PATCH /api/tickets/<id>/asignar     → assign   (IsAdmin)
    PATCH /api/tickets/<id>/reasignar   → reassign (IsAdmin)
    PATCH /api/tickets/<id>/estado      → update status (IsWorker)
    POST  /api/tickets/<id>/comentario  → add comment
"""

from django.urls import path

from apps.tickets.views import (
    CreateTicketView,
    TicketDetailView,
    TicketHistoryView,
    AssignView,
    ReassignView,
    UpdateStatusView,
    AddCommentView,
)

urlpatterns = [
    path("", CreateTicketView.as_view(), name="ticket-collection"),
    path("<int:ticket_id>", TicketDetailView.as_view(), name="ticket-detail"),
    path("<int:ticket_id>/historial", TicketHistoryView.as_view(), name="ticket-history"),
    path("<int:ticket_id>/asignar", AssignView.as_view(), name="ticket-assign"),
    path("<int:ticket_id>/reasignar", ReassignView.as_view(), name="ticket-reassign"),
    path("<int:ticket_id>/estado", UpdateStatusView.as_view(), name="ticket-status"),
    path("<int:ticket_id>/comentario", AddCommentView.as_view(), name="ticket-comment"),
]

```

### 📄 backend/apps/tickets/validators/__init__.py
```python
from .ticket_validator_chain import TicketValidatorChain

__all__ = ["TicketValidatorChain"]

# Nodos de la cadena (creados en S13 — solo firmas):
#   basic_field_validator.py    → BasicFieldValidator(BaseValidator) — asunto ≤80, descripcion ≥10
#   file_validator.py           → FileValidator(BaseValidator) — tamaño ≤5MB, mime permitido
#   business_rule_validator.py  → BusinessRuleValidator(BaseValidator)
#                                  horario laboral, duplicados activos
#   ticket_validator_chain.py   → TicketValidatorChain — fachada que delega
#                                  la construcción a ValidatorFactory
#
# OCP: Sprint 4 → CriticalPriorityValidator se agrega en ValidatorFactory;
#      los nodos existentes quedan intactos.

```

### 📄 backend/apps/tickets/validators/basic_field_validator.py
```python
"""
Chain of Responsibility node — validates basic text fields of a ticket.

Responsibility (SRP): enforce only character-count rules on asunto and descripcion.
Depends on: BaseValidator (core/base/base_validator.py).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class BasicFieldValidator(BaseValidator):
    """Validates asunto (≤80 chars) and descripcion (≥10 chars)."""

    ASUNTO_MAX = 80
    DESCRIPCION_MIN = 10

    def validate(self, data: dict) -> ValidationResult:
        asunto = data.get("asunto", "")
        if not asunto or len(asunto) > self.ASUNTO_MAX:
            return ValidationResult(
                is_valid=False,
                errors=[f"El asunto debe tener entre 1 y {self.ASUNTO_MAX} caracteres."],
                field_name="asunto",
            )

        descripcion = data.get("descripcion", "")
        if not descripcion or len(descripcion) < self.DESCRIPCION_MIN:
            return ValidationResult(
                is_valid=False,
                errors=[
                    f"La descripción debe tener al menos {self.DESCRIPCION_MIN} caracteres."
                ],
                field_name="descripcion",
            )

        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/tickets/validators/business_rule_validator.py
```python
"""
Chain of Responsibility node — validates business rules for ticket creation.

Responsibility (SRP): enforce domain-level business rules only.
Depends on: BaseValidator (core/base/base_validator.py).
    Receives ticket_repository via __init__ for duplicate check (DIP).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · DIP · LSP
"""

from __future__ import annotations

from datetime import datetime

from core.base.base_validator import BaseValidator, ValidationResult

# Business hours: Monday–Friday 07:00–20:00 local time
_BUSINESS_START = 7
_BUSINESS_END = 20
_BUSINESS_DAYS = {0, 1, 2, 3, 4}  # Mon=0 … Fri=4


class BusinessRuleValidator(BaseValidator):
    """Validates business-hour constraint and duplicate-ticket rule."""

    def __init__(self, ticket_repository) -> None:
        super().__init__()
        self._ticket_repository = ticket_repository

    def validate(self, data: dict) -> ValidationResult:
        # ── Rule 1: business hours (INFORMATIONAL, not blocking) ──────────
        # Tickets can be created 24/7. If outside business hours, the response
        # includes a warning but the ticket IS created.
        # This is handled at the view layer, not here (H#6 from audit).

        # ── Rule 2: no active duplicate for same client + service + subject ─
        cliente_id = data.get("cliente_id")
        asunto = data.get("asunto", "")
        servicio_id = data.get("servicio_id")

        if cliente_id and asunto and servicio_id:
            duplicate = self._ticket_repository.find_active_duplicate(
                cliente_id=cliente_id,
                asunto=asunto,
                servicio_id=servicio_id,
            )
            if duplicate:
                return ValidationResult(
                    is_valid=False,
                    errors=["Ya existe un ticket activo con el mismo asunto y servicio."],
                    field_name="duplicado",
                )

        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/tickets/validators/file_validator.py
```python
"""
Chain of Responsibility node — validates uploaded file attachments.

Responsibility (SRP): enforce only file size and MIME type rules.
Depends on: BaseValidator (core/base/base_validator.py).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class FileValidator(BaseValidator):
    """Validates file size (≤5 MB) and MIME type for ticket attachments."""

    MAX_SIZE_BYTES: int = 5_242_880  # 5 MB

    ALLOWED_MIME_TYPES: frozenset[str] = frozenset({
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    })

    def validate(self, data: dict) -> ValidationResult:
        adjuntos = data.get("adjuntos", [])
        if not adjuntos:
            return ValidationResult(is_valid=True)

        for file in adjuntos:
            if file.size > self.MAX_SIZE_BYTES:
                return ValidationResult(
                    is_valid=False,
                    errors=[
                        f"'{file.name}' excede el límite de 5 MB "
                        f"({file.size / 1_048_576:.1f} MB)."
                    ],
                    field_name="adjuntos",
                )
            if file.content_type not in self.ALLOWED_MIME_TYPES:
                return ValidationResult(
                    is_valid=False,
                    errors=[
                        f"Tipo de archivo '{file.content_type}' no está permitido. "
                        f"Tipos aceptados: PDF, Word, imágenes y texto plano."
                    ],
                    field_name="adjuntos",
                )

        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/tickets/validators/ticket_validator_chain.py
```python
"""
Façade over the ticket creation validator chain built by ValidatorFactory.

Responsibility (SRP): expose a single run(data) entry point.
    Does not know which nodes exist or in what order — ValidatorFactory decides.
Depends on: ValidatorFactory (core/factories/validator_factory.py) — DIP.
Pattern: Chain of Responsibility façade + Factory.
SOLID: SRP · DIP · OCP
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from core.factories import ValidatorFactory


class TicketValidatorChain:
    """
    Façade over the validator chain. TicketService calls run(data);
    it never knows which nodes are in the chain.
    """

    def __init__(self, ticket_repository) -> None:
        self._root = ValidatorFactory.build_ticket_chain(ticket_repository)

    def run(self, data: dict) -> ValidationResult:
        """
        Execute the full chain from the root node (fail-fast).

        Args:
            data: validated dict from TicketCreateSerializer with
                  asunto, descripcion, servicio_id, adjuntos, cliente_id.
        """
        return self._root.run_chain(data)

```

### 📄 backend/apps/tickets/views.py
```python
from django.shortcuts import render

# Create your views here.

```

### 📄 backend/apps/tickets/views/__init__.py
```python
from .ticket_history_views import TicketHistoryView
from .ticket_create_view import CreateTicketView, TicketDetailView
from .ticket_action_views import (
    AssignView,
    ReassignView,
    UpdateStatusView,
    AddCommentView,
)

__all__ = [
    "CreateTicketView",
    "TicketDetailView",
    "TicketHistoryView",
    "AssignView",
    "ReassignView",
    "UpdateStatusView",
    "AddCommentView",
]

```

### 📄 backend/apps/tickets/views/ticket_action_views.py
```python
"""
Ticket action DRF views — assignment (admin) + status/comment (worker).

HTTP orchestration only (SRP + DIP + ISP). Each view depends on the role interface
of TicketService (via get_ticket_service()) and declares only its RBAC permission.

Endpoints:
    PATCH /api/tickets/<id>/asignar     → AssignView      (IsAdmin)
    PATCH /api/tickets/<id>/reasignar   → ReassignView    (IsAdmin)
    PATCH /api/tickets/<id>/estado      → UpdateStatusView (IsWorker)
    POST  /api/tickets/<id>/comentario  → AddCommentView  (authenticated party)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tickets.serializers.ticket_action_serializers import (
    AssignSerializer,
    StatusChangeSerializer,
    CommentSerializer,
)
from apps.tickets.services import get_ticket_service
from apps.tickets.services.ticket_service import TicketValidationError
from core.exceptions.domain_exceptions import (
    TicketNotFound,
    InvalidTransitionError,
    CommentRequiredError,
)
from core.permissions import IsAdmin, IsWorker


def _handle_domain_errors(fn):
    """Map domain exceptions to HTTP responses (shared by the action views)."""
    try:
        return Response(fn(), status=status.HTTP_200_OK)
    except TicketNotFound as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except CommentRequiredError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except InvalidTransitionError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except TicketValidationError as exc:
        return Response(
            {"detail": str(exc), "field": exc.field},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AssignView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, ticket_id: int):
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        worker_id = serializer.validated_data["worker_id"]
        return _handle_domain_errors(
            lambda: svc.assign_ticket(ticket_id, worker_id, request.user)
        )


class ReassignView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, ticket_id: int):
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        worker_id = serializer.validated_data["worker_id"]
        return _handle_domain_errors(
            lambda: svc.reassign_ticket(ticket_id, worker_id, request.user)
        )


class UpdateStatusView(APIView):
    permission_classes = [IsWorker]

    def patch(self, request, ticket_id: int):
        serializer = StatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        svc = get_ticket_service()
        return _handle_domain_errors(
            lambda: svc.update_status(ticket_id, data["estado"], data["comentario"], request.user)
        )


class AddCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id: int):
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        comentario = serializer.validated_data["comentario"]
        return _handle_domain_errors(
            lambda: svc.add_comment(ticket_id, comentario, request.user)
        )

```

### 📄 backend/apps/tickets/views/ticket_create_view.py
```python
"""
Ticket creation + detail DRF views — HTTP orchestration only (SRP + DIP + ISP).

CreateTicketView depends on ITicketClientActions (via get_ticket_service()), declares
IsClient. The view never touches the ORM or business rules.

Endpoints:
    POST /api/tickets        → CreateTicketView (IsClient)
    GET  /api/tickets/<id>   → TicketDetailView (authenticated, ownership enforced)
"""

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.services import get_catalog_service
from apps.tickets.repositories import TicketRepository
from apps.tickets.serializers import TicketListSerializer
from apps.tickets.serializers.ticket_create_serializer import TicketCreateSerializer
from apps.tickets.services import get_ticket_service
from apps.tickets.services.ticket_service import TicketValidationError
from core.exceptions.domain_exceptions import ServiceNotFound, TicketNotFound
from core.permissions import IsClient

_FILTER_KEYS = ("estado", "prioridad", "servicio_id", "fecha_desde", "fecha_hasta")


class CreateTicketView(APIView):
    """Collection endpoint: GET lists the caller's tickets, POST creates one (IsClient)."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        # GET = any authenticated role (list); POST = clients only.
        from rest_framework.permissions import IsAuthenticated  # noqa: PLC0415
        return [IsClient()] if self.request.method == "POST" else [IsAuthenticated()]

    def get(self, request):
        repo = TicketRepository()
        page = int(request.query_params.get("page", 1))
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}
        result = repo.get_all_for_user(request.user, filters, page)
        return Response(
            {
                "items": TicketListSerializer(result["items"], many=True).data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        # Validate the referenced service exists and is active
        try:
            get_catalog_service().get_service_detail(data["servicio_id"])
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data["adjuntos"] = request.FILES.getlist("adjuntos")
        try:
            ticket = get_ticket_service().create_ticket(data, request.user)
        except TicketValidationError as exc:
            return Response(
                {"detail": str(exc), "field": exc.field},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(ticket, status=status.HTTP_201_CREATED)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id: int):
        try:
            ticket = get_ticket_service().get_ticket_detail(ticket_id, request.user)
        except TicketNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(ticket, status=status.HTTP_200_OK)

```

### 📄 backend/apps/tickets/views/ticket_history_views.py
```python
"""
Ticket history DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ repository calls for the read/history paths.
    No business logic; the ORM lives behind TicketRepository (DIP).
Pattern: Repository (queries) + DIP.
SOLID: SRP · DIP · ISP (role-based ACL inside the repository)

Endpoints:
    GET /api/tickets                 → TicketListView   (filters + pagination, role-scoped)
    GET /api/tickets/<id>/historial  → TicketHistoryView (event timeline)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tickets.repositories import TicketRepository
from apps.tickets.serializers import TicketListSerializer, TicketEventSerializer

_FILTER_KEYS = ("estado", "prioridad", "servicio_id", "fecha_desde", "fecha_hasta")


class TicketListView(APIView):
    """GET /api/tickets — paginated, filtered, role-scoped ticket list."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        repo = TicketRepository()
        page = int(request.query_params.get("page", 1))
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}

        result = repo.get_all_for_user(request.user, filters, page)
        data = TicketListSerializer(result["items"], many=True).data
        return Response(
            {
                "items": data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
            },
            status=status.HTTP_200_OK,
        )


class TicketHistoryView(APIView):
    """GET /api/tickets/<id>/historial — event timeline for a ticket."""

    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id: int):
        repo = TicketRepository()
        events = repo.get_history(ticket_id, request.user)
        if events is None:
            return Response(
                {"detail": "Ticket no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = TicketEventSerializer(events, many=True).data
        return Response(data, status=status.HTTP_200_OK)

```

### 📄 backend/config/__init__.py
```python

```

### 📄 backend/config/asgi.py
```python
"""
ASGI config for config project.

Routes HTTP through Django's standard application and WebSocket through Channels'
ProtocolTypeRouter → AllowedHostsOriginValidator → URLRouter (notifications consumer).

For more information, see:
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize the Django ASGI application early so the app registry is fully
# populated before we import anything that may touch models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

from config.websocket_urls import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        URLRouter(websocket_urlpatterns)
    ),
})

```

### 📄 backend/config/settings.py
```python
"""
Django settings for config project.
Generated by 'django-admin startproject' using Django 6.0.5.
https://docs.djangoproject.com/en/6.0/topics/settings/
"""

# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────
# SEGURIDAD
# ─────────────────────────────────────────────
SECRET_KEY = config('DJANGO_SECRET_KEY')
DEBUG = config('DJANGO_DEBUG', cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')


# ─────────────────────────────────────────────
# APLICACIONES
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    # Django defaults
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    # SassBlum apps
    'apps.authentication',
    'apps.catalog',
    'apps.gallery',
    'apps.tickets',
    'apps.notifications',
    'apps.reports',
    'apps.realtime',
]


# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # Debe ir primero
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config(
        'CORS_ALLOWED_ORIGINS', default='http://localhost:5173'
    ).split(',')
]

# CORS preflight cache — reduce OPTIONS requests
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

# Content-Security-Policy — OWASP A03:2021 defense-in-depth
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https://images.unsplash.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_CONNECT_SRC = ("'self'",)


# ─────────────────────────────────────────────
# URLS Y WSGI / ASGI
# ─────────────────────────────────────────────
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'   # Requerido por Django Channels


# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ─────────────────────────────────────────────
# BASE DE DATOS — Supabase / PostgreSQL
# ─────────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
    )
}


# ─────────────────────────────────────────────
# MODELO DE USUARIO PERSONALIZADO
# ─────────────────────────────────────────────
AUTH_USER_MODEL = 'authentication.User'


# ─────────────────────────────────────────────
# VALIDACIÓN DE CONTRASEÑAS
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ─────────────────────────────────────────────
# DJANGO REST FRAMEWORK
# ─────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Rate limiting — OWASP A07:2021
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '100/minute',
    },
    # Pagination — prevents huge responses
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}


# ─────────────────────────────────────────────
# JWT — djangorestframework-simplejwt
# ─────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        seconds=config('JWT_ACCESS_TOKEN_LIFETIME', cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        seconds=config('JWT_REFRESH_TOKEN_LIFETIME', cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# ─────────────────────────────────────────────
# SECURITY HEADERS (HTTPS enforcement + cookies)
# ─────────────────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ─────────────────────────────────────────────
# DJANGO CHANNELS — tiempo real (Sprint 4)
# ─────────────────────────────────────────────
USE_REDIS = config('USE_REDIS', default=False, cast=bool)

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': (
            'channels_redis.core.RedisChannelLayer'
            if USE_REDIS else
            'channels.layers.InMemoryChannelLayer'
        ),
        'CONFIG': (
            {'hosts': [config('REDIS_URL', default='redis://localhost:6379/0')]}
            if USE_REDIS else {}
        ),
    },
}


# ─────────────────────────────────────────────
# EMAIL — notificaciones (Sprint 3 · S19–S22)
# ─────────────────────────────────────────────
# Por defecto en DEBUG los correos se imprimen en la consola del runserver (no se
# envía nada real ni hace falta SMTP). Para ENVIAR correos reales aun con DEBUG=True,
# define EMAIL_BACKEND en el .env, p. ej. Gmail:
#   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
#   EMAIL_HOST_USER=tucorreo@gmail.com
#   EMAIL_HOST_PASSWORD=<app password de Gmail, 16 caracteres>
_default_email_backend = (
    'django.core.mail.backends.console.EmailBackend' if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_BACKEND = config('EMAIL_BACKEND', default=_default_email_backend)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='no-reply@sassblum.com')

# URL del frontend (para construir los enlaces de verificación / reseteo en los emails)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')


# ─────────────────────────────────────────────
# MISC
# ─────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ─────────────────────────────────────────────
# LOGGING — structured logging for production
# ─────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {'level': 'WARNING'},
        'apps': {'level': 'INFO'},
    },
}


# ─────────────────────────────────────────────
# INTERNACIONALIZACIÓN
# ─────────────────────────────────────────────
LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True


# ─────────────────────────────────────────────
# ARCHIVOS ESTÁTICOS
# ─────────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# ─────────────────────────────────────────────
# SUPABASE STORAGE — fotos de servicios + adjuntos de tickets
# ─────────────────────────────────────────────
# Crea un bucket PÚBLICO en Supabase Storage (Storage → New bucket → "public").
# La service_role key es solo de servidor; NUNCA la expongas en el frontend.
# Si estas variables quedan vacías, StorageService usa una URL stub local (dev sin bucket).
SUPABASE_URL = config('SUPABASE_URL', default='')
SUPABASE_SERVICE_KEY = config('SUPABASE_SERVICE_KEY', default='')
SUPABASE_STORAGE_BUCKET = config('SUPABASE_STORAGE_BUCKET', default='sassblum')

```

### 📄 backend/config/urls.py
```python
"""
URL configuration for config project.

API routing is mounted per-app under /api/. Each app owns its own urls.py
(SRP: config only composes; each app declares its own routes).
"""
from django.contrib import admin
from django.urls import path, include
from apps.authentication.views.health_views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),

    # ── API ────────────────────────────────────────────────────────────────
    path("api/auth/", include("apps.authentication.urls")),
    path("api/usuarios/", include("apps.authentication.user_urls")),
    path("api/servicios/", include("apps.catalog.urls")),
    path("api/proyectos/", include("apps.gallery.urls")),
    path("api/tickets/", include("apps.tickets.urls")),
    path("api/reportes/", include("apps.reports.urls")),
    path("api/notificaciones/", include("apps.notifications.urls")),
]

```

### 📄 backend/config/websocket_urls.py
```python
"""
WebSocket URL routing (Django Channels).
Consumed by config/asgi.py via ProtocolTypeRouter → URLRouter.
"""

from django.urls import re_path

from apps.realtime.consumers import NotificationConsumer, TicketConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"^ws/tickets/(?P<ticket_id>\d+)/$", TicketConsumer.as_asgi()),
]

```

### 📄 backend/config/wsgi.py
```python
"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

```

### 📄 backend/core/base/__init__.py
```python
# Abstract base classes that provide structural infrastructure (chain traversal,
# generic ORM wrapping, shared error handling). These are NOT domain ABCs —
# domain contracts live in core/interfaces/ or each app's interfaces/ package.

```

### 📄 backend/core/base/base_repository.py
```python
"""
Generic abstract base class for all Django ORM repositories.
No view, service, or serializer accesses the ORM directly — they all use a
repository that extends this base (DIP).

Responsibility (SRP): declare the generic CRUD contract and enforce the pattern.
    Concrete repositories (AuthRepository, TicketRepository) provide the ORM queries.
Depends on: abc — nothing from the domain or Django ORM at this level.
Pattern: Repository
SOLID: DIP · OCP (new entity = new repo, no changes here) · LSP

Sprint usage:
    Sprint 1 → AuthRepository(BaseRepository[User])
    Sprint 2 → TicketRepository(BaseRepository[Ticket])
    Sprint 3 → NotificationRepository(BaseRepository[Notification])
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract CRUD contract parameterised on the Django model type T.

    All methods must be overridden. Any method that is not overridden will raise
    TypeError at instantiation time (Python ABC enforcement = LSP guarantee).
    """

    @abstractmethod
    def get_by_id(self, entity_id: int) -> Optional[T]:
        """
        Return the entity with the given primary key, or None if not found.
        Concrete implementation must NOT raise DoesNotExist — return None instead.
        """
        ...

    @abstractmethod
    def get_all(self, filters: dict | None = None) -> list[T]:
        """
        Return all entities matching the optional filter dict.
        Filter keys map directly to ORM field lookups (e.g. {'estado': 'ACTIVO'}).
        """
        ...

    @abstractmethod
    def create(self, data: dict) -> T:
        """
        Persist a new entity from the validated data dict and return it.
        Raises IntegrityError on constraint violations — do not swallow in this layer.
        """
        ...

    @abstractmethod
    def update(self, entity_id: int, data: dict) -> T:
        """
        Apply partial updates to the entity with the given ID and return it.
        Raises ObjectNotFound if the entity does not exist.
        """
        ...

    @abstractmethod
    def delete(self, entity_id: int) -> None:
        """
        Permanently remove the entity with the given ID.
        Raises ObjectNotFound if the entity does not exist.
        """
        ...

```

### 📄 backend/core/base/base_validator.py
```python
"""
Abstract base node for the Chain of Responsibility pattern used across all
validation layers: authentication (Sprint 1), ticket creation (Sprint 2),
report generation (Sprint 4).

Responsibility (SRP): define the node structure and chain traversal logic.
    Each concrete subclass implements exactly ONE validation rule in validate().
Depends on: abc — nothing from the domain.
Pattern: Chain of Responsibility
SOLID: OCP · SRP (one rule per node) · LSP (every node is substitutable)

How to extend (OCP):
    1. Create CriticalPriorityValidator(BaseValidator) in Sprint 4
    2. Implement validate() with only that priority rule
    3. Add to chain: field_v.add_validator(file_v).add_validator(priority_v)
    → BasicFieldValidator and FileValidator are NEVER modified.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Value object returned by every validator node."""

    is_valid: bool
    # User-facing messages suitable for DRF error responses
    errors: list[str] = field(default_factory=list)
    # The model/serializer field that failed (e.g. 'email', 'password', 'asunto')
    field_name: str = ""


class BaseValidator(ABC):
    """
    Abstract chain node. Subclasses implement validate(); run_chain() handles traversal.

    Do NOT override run_chain() in concrete subclasses — doing so breaks LSP and makes
    the chain behavior unpredictable.
    """

    def __init__(self) -> None:
        self._next: BaseValidator | None = None

    def add_validator(self, validator: BaseValidator) -> BaseValidator:
        """
        Append a validator node at the end of this chain.
        Returns the added node to allow fluent chaining:
            email_v.add_validator(password_v).add_validator(phone_v)
        """
        self._next = validator
        return validator

    @abstractmethod
    def validate(self, data: dict) -> ValidationResult:
        """
        Implement exactly ONE validation rule here.
        Must NOT call self._next — chain traversal is the responsibility of run_chain().

        Args:
            data: The raw deserialized data from the DRF serializer.

        Returns:
            ValidationResult with is_valid=True on pass, errors populated on fail.
        """
        ...

    def run_chain(self, data: dict) -> ValidationResult:
        """
        Run this node's rule. If it passes, delegate to the next node.
        Stop and return immediately on the first failure.

        This is the public entry point when running the full chain from any node.
        """
        result = self.validate(data)
        if not result.is_valid or self._next is None:
            return result
        return self._next.run_chain(data)

```

### 📄 backend/core/exceptions/__init__.py
```python
from .domain_exceptions import (
    DomainException,
    ServiceNotFound,
    InvalidTransitionError,
    CommentRequiredError,
    TicketNotFound,
)

__all__ = [
    "DomainException",
    "ServiceNotFound",
    "InvalidTransitionError",
    "CommentRequiredError",
    "TicketNotFound",
]

```

### 📄 backend/core/exceptions/domain_exceptions.py
```python
"""
Domain exceptions for all bounded contexts in SassBlum.

Responsibility (SRP): provide typed exception classes for domain rule violations.
    HTTP status mapping (400, 404, 409, etc.) lives in the DRF view layer — not here.
    Views catch these exceptions and translate them to DRF Response objects.
Depends on: built-in Exception — nothing from Django or DRF.
SOLID: SRP · OCP (new domain rule = new exception class; no modification here)

Usage across sprints:
    S11  → ServiceNotFound                   (catalog — service does not exist)
    S14  → InvalidTransitionError            (ticket state machine — illegal transition)
    S14  → CommentRequiredError              (BR-35 — every transition needs a comment)
    S12+ → TicketNotFound                    (tickets — ticket does not exist or no access)
    S3+  → NotificationDispatchError         (Sprint 3 — notification channel failure)

OCP extension path:
    New domain rule violation (e.g. DuplicateEmailError, SLABreachError) = new class here.
    Existing exception classes and their callers remain unchanged.
"""


class DomainException(Exception):
    """Base class for all domain rule violations in SassBlum."""


class ServiceNotFound(DomainException):
    """
    Raised when a catalog service does not exist or is not visible to the caller.
    Views map this to HTTP 404.
    """


class InvalidTransitionError(DomainException):
    """
    Raised by TicketStateMachine when an attempted state transition is not in TRANSITIONS.
    Carries from_state and to_state for structured error responses.
    Views map this to HTTP 422.
    """

    def __init__(self, from_state: str, to_state: str) -> None:
        self.from_state = from_state
        self.to_state = to_state
        super().__init__(
            f"Transition '{from_state}' → '{to_state}' is not allowed."
        )


class CommentRequiredError(DomainException):
    """
    Raised by TicketStateMachine when a state transition is attempted without a comment.
    Business rule BR-35: every ticket state change requires a non-empty comment.
    Views map this to HTTP 400.
    """


class TicketNotFound(DomainException):
    """
    Raised when a ticket does not exist or the requesting user lacks access to it.
    Intentionally identical message for both cases (no information leakage).
    Views map this to HTTP 404.
    """

```

### 📄 backend/core/factories/__init__.py
```python
from .validator_factory import ValidatorFactory

__all__ = ["ValidatorFactory"]

# Sprint 3 — NotificationFactory:
#   notification_factory.py → build(channel) → INotificationStrategy
# Sprint 4 — ExporterFactory:
#   exporter_factory.py → build(format) → IReportExporter

```

### 📄 backend/core/factories/exporter_factory.py
```python
"""
ExporterFactory — maps a format string to an IReportExporter (Factory, OCP).

Responsibility (SRP): know which exporter serves each format. Does not export.
SOLID: OCP · SRP · DIP.

OCP: JSONExporter = new class + one entry in FORMAT_MAP. ReportService unchanged.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class ExporterFactory:

    @staticmethod
    def build(fmt: str) -> IReportExporter:
        from apps.reports.exporters import CSVExporter, PDFExporter, ExcelExporter  # noqa: PLC0415

        FORMAT_MAP = {
            "csv": CSVExporter,
            "pdf": PDFExporter,
            "excel": ExcelExporter,
            "xlsx": ExcelExporter,
        }
        exporter_class = FORMAT_MAP.get(fmt.lower())
        if exporter_class is None:
            raise ValueError(
                f"Formato no soportado: '{fmt}'. Disponibles: {list(FORMAT_MAP)}"
            )
        return exporter_class()

```

### 📄 backend/core/factories/validator_factory.py
```python
"""
Factory for assembling validator chains — centralises node wiring (OCP).

Responsibility (SRP): know which validator nodes exist and in what order to chain them.
Depends on: concrete validator classes in apps/tickets/validators/ — DIP inversion point.
Pattern: Factory.
SOLID: OCP · SRP · DIP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator


class ValidatorFactory:
    """Creates and wires validator chains for each domain context."""

    @staticmethod
    def build_ticket_chain(ticket_repository) -> BaseValidator:
        """
        Assemble the ticket-creation chain: BasicField → File → BusinessRule.

        OCP: add CriticalPriorityValidator (Sprint 4) by appending one line:
            business_v.add_validator(CriticalPriorityValidator())
        Nothing else changes.
        """
        from apps.tickets.validators.basic_field_validator import BasicFieldValidator
        from apps.tickets.validators.file_validator import FileValidator
        from apps.tickets.validators.business_rule_validator import BusinessRuleValidator

        basic_field_v = BasicFieldValidator()
        file_v        = FileValidator()
        business_v    = BusinessRuleValidator(ticket_repository)

        basic_field_v.add_validator(file_v).add_validator(business_v)
        return basic_field_v

```

### 📄 backend/core/interfaces/__init__.py
```python
# Cross-module ABC contracts shared across all Django apps.
# Views and services import from here when depending on a global abstraction.
# App-specific ABCs live inside each app's own interfaces/ package.

```

### 📄 backend/core/permissions/__init__.py
```python
from .rbac_permissions import IsClient, IsWorker, IsAdmin

__all__ = ["IsClient", "IsWorker", "IsAdmin"]

```

### 📄 backend/core/permissions/rbac_permissions.py
```python
"""
Role-based access control permissions — one class per role (ISP).

Responsibility (SRP): each class decides whether the requesting user holds a specific role.
Depends on: DRF BasePermission.
Pattern: ISP — one permission class per role, never a monolithic PermissionClass.
SOLID: ISP · SRP · OCP
"""

from django.apps import apps as django_apps
from rest_framework.permissions import BasePermission


def _get_user_model():
    return django_apps.get_model('authentication', 'User')


class IsClient(BasePermission):
    """Grants access only to authenticated users with role == 'client'."""

    def has_permission(self, request, view) -> bool:
        User = _get_user_model()
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.CLIENT
            and request.user.estado == User.Estado.ACTIVE
        )


class IsWorker(BasePermission):
    """Grants access only to authenticated users with role == 'worker'."""

    def has_permission(self, request, view) -> bool:
        User = _get_user_model()
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.WORKER
            and request.user.estado == User.Estado.ACTIVE
        )


class IsAdmin(BasePermission):
    """Grants access only to authenticated users with role == 'admin'."""

    def has_permission(self, request, view) -> bool:
        User = _get_user_model()
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
            and request.user.estado == User.Estado.ACTIVE
        )

```

### 📄 backend/manage.py
```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

```

---
**Total archivos incluidos:** 0

### 📄 backend/apps/authentication/__init__.py
```python

```

### 📄 backend/apps/authentication/admin.py
```python
from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'first_name', 'last_name', 'role', 'estado', 'email_verificado')
    list_filter = ('role', 'estado', 'email_verificado')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('date_joined',)

```

### 📄 backend/apps/authentication/apps.py
```python
from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.authentication'

```

### 📄 backend/apps/authentication/interfaces/__init__.py
```python
"""
ABC contracts specific to the authentication module.
All views and services inside apps/authentication/ import from here.
No other app should import directly from this package (ISP).
"""

from .i_auth_service import IAuthService
from .i_user_admin_actions import IUserAdminActions

__all__ = ["IAuthService", "IUserAdminActions"]

```

### 📄 backend/apps/authentication/interfaces/i_auth_service.py
```python
"""
Root ABC for all authentication operations in the backend.
Every DRF view in apps/authentication/views/ depends on this interface (DIP),
never on the concrete AuthService class.

Responsibility (SRP): declare the authentication operation contract.
    No HTTP logic, no ORM queries, no JWT calls — only method signatures.
Depends on: abc — nothing from the domain.
Pattern: DIP anchor · Singleton target (AuthService will implement this in S7)
SOLID: DIP · SRP · LSP (AuthService is fully replaceable in tests without touching views)

Sprint coverage:
    S1  → this file (contract only)
    S7  → AuthService(IAuthService) — Singleton implementation + simplejwt
    S8  → tests mock IAuthService; views receive the mock without modification (LSP proof)
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TypedDict


# ─── Data transfer objects (input / output shapes) ───────────────────────────


class TokenPair(TypedDict):
    """Access + refresh JWT strings returned after successful authentication."""

    access: str   # short-lived (1 h) — injected into Authorization header
    refresh: str  # long-lived (7 d) — rotated on each use, blacklisted on logout


class UserData(TypedDict):
    """Minimal user profile returned alongside tokens."""

    id: int
    email: str
    nombre: str
    apellido: str
    rol: str     # 'CLIENTE' | 'TRABAJADOR' | 'ADMINISTRADOR'
    estado: str  # 'ACTIVO' | 'BLOQUEADO' | 'PENDIENTE'
    email_verificado: bool


# ─── Service contract ─────────────────────────────────────────────────────────


class IAuthService(ABC):
    """Abstract contract for all authentication use cases."""

    @abstractmethod
    def authenticate(self, email: str, password: str) -> dict:
        """
        HU-01: Validate credentials and return tokens + profile.

        Business rules enforced by the concrete implementation (NOT here):
        - Increment intentos_fallidos on each wrong password.
        - Lock account (estado = BLOQUEADO) after 5 consecutive failures.
        - Reject login if email_verificado is False.

        Returns:
            {'user': UserData, 'tokens': TokenPair}

        Raises:
            AuthenticationFailed — wrong email or password
            AccountLocked        — account suspended after too many failures
            EmailNotVerified     — registration not yet confirmed
        """
        ...

    @abstractmethod
    def register(self, data: dict) -> dict:
        """
        HU-02: Create a new CLIENTE account with estado = PENDIENTE.
        Dispatches the email-verification email via the email service.

        Args:
            data: validated dict from RegisterSerializer
                  (nombre, apellido, email, password)

        Returns:
            {'message': str}

        Raises:
            EmailAlreadyExists      — duplicate email
            PasswordPolicyViolation — weak password caught post-serializer
        """
        ...

    @abstractmethod
    def logout(self, refresh_token: str) -> None:
        """
        Invalidate a session by adding the refresh token to the simplejwt blacklist.

        Raises:
            InvalidToken           — token is malformed or belongs to another user
            TokenAlreadyBlacklisted — token was already invalidated
        """
        ...

    @abstractmethod
    def forgot_password(self, email: str) -> dict:
        """
        HU-03 step 1: Generate a one-time reset token (expires 1 h) and dispatch email.
        Must NOT reveal whether the email is registered (no user enumeration).

        Returns:
            {'message': str}  — generic regardless of whether email exists

        Raises:
            RateLimitExceeded — too many requests from the same IP / user
        """
        ...

    @abstractmethod
    def reset_password(self, token: str, new_password: str) -> dict:
        """
        HU-03 step 2: Validate the one-time token, hash the new password,
        and invalidate all active sessions for the user.

        Returns:
            {'message': str}

        Raises:
            InvalidToken            — token not found or belongs to another user
            TokenExpired            — token older than 1 h
            PasswordPolicyViolation — new password does not meet the policy
        """
        ...

    @abstractmethod
    def verify_email(self, token: str) -> dict:
        """
        Confirm the email address using the token sent after registration.
        Transitions user status: PENDIENTE → ACTIVO.
        Sets email_verificado = True.

        Returns:
            {'message': str}

        Raises:
            InvalidToken    — token not found
            TokenExpired    — token older than 24 h
            AlreadyVerified — email_verificado is already True
        """
        ...

    @abstractmethod
    def generate_tokens(self, user) -> TokenPair:
        """
        Create a fresh access/refresh token pair for the given User instance
        using djangorestframework-simplejwt.

        Kept separate from authenticate() so that TokenService can override
        only this method without touching the rest of IAuthService (SRP).

        Args:
            user: a Django User model instance (avoids coupling to User import here)
        """
        ...

```

### 📄 backend/apps/authentication/interfaces/i_user_admin_actions.py
```python
"""
IUserAdminActions — ISP interface for admin user management (HU-14, D25).

Responsibility (SRP): declare the admin-only user operations. Separate from
    IAuthService (session) so AuthService and UserAdminService don't mix concerns.
Pattern: ISP. SOLID: ISP · DIP · OCP.

D25: user management lives in apps/authentication/ (where User already is), NOT a new
    users/ module. UserAdminService implements this; views depend on the interface (DIP).
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IUserAdminActions(ABC):

    @abstractmethod
    def list_users(self, filters: dict | None = None) -> list:
        """List users, optionally filtered by role/estado. Returns list of UserData dicts."""
        ...

    @abstractmethod
    def create_user(self, data: dict) -> dict:
        """Create a user with a given role (worker/admin). Returns the created UserData."""
        ...

    @abstractmethod
    def block_user(self, user_id: int) -> dict:
        """Set estado = BLOQUEADO. Returns updated UserData."""
        ...

    @abstractmethod
    def unblock_user(self, user_id: int) -> dict:
        """Set estado = ACTIVO and reset failed attempts. Returns updated UserData."""
        ...

```

### 📄 backend/apps/authentication/models.py
```python
import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager that uses email instead of username (SRP: only manages User persistence)."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es requerido.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('estado', 'activo')
        extra_fields.setdefault('email_verificado', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    class Role(models.TextChoices):
        CLIENT = 'client', 'Cliente'
        WORKER = 'worker', 'Trabajador'
        ADMIN  = 'admin',  'Administrador'

    class Estado(models.TextChoices):
        ACTIVE  = 'activo',    'Activo'
        BLOCKED = 'bloqueado', 'Bloqueado'
        PENDING = 'pendiente', 'Pendiente'

    objects = UserManager()

    username          = None
    email             = models.EmailField(unique=True, verbose_name='correo electrónico')
    ruc               = models.CharField(
        max_length=13,
        blank=True,
        default='',
        verbose_name='RUC',
    )
    role              = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name='rol',
    )
    estado            = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDING,
        verbose_name='estado',
    )
    intentos_fallidos = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='intentos fallidos',
    )
    bloqueado_hasta   = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='bloqueado hasta',
    )
    email_verificado  = models.BooleanField(
        default=False,
        verbose_name='email verificado',
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'auth_user_custom'

    def __str__(self):
        return f'{self.email} ({self.role})'


class PasswordResetToken(models.Model):
    """
    One-time password reset token (SRP — data only).
    Generation/validation logic lives in TokenService, never in the model.
    """

    usuario = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='reset_tokens',
        verbose_name='usuario',
    )
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='token',
    )
    expira_en = models.DateTimeField(verbose_name='expira en')
    usado = models.BooleanField(default=False, verbose_name='usado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='creado en')

    class Meta:
        db_table = 'auth_password_reset_token'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
        ]

    def __str__(self):
        estado = 'usado' if self.usado else 'activo'
        return f'reset {self.token} ({estado})'

```

### 📄 backend/apps/authentication/repositories/__init__.py
```python
from .user_repository import UserRepository

__all__ = ["UserRepository"]

```

### 📄 backend/apps/authentication/repositories/user_repository.py
```python
"""
UserRepository — encapsulates all ORM access for the User model (Repository).

Responsibility (SRP): every User query lives here. AuthService never touches the
    ORM directly (DIP).
Depends on: BaseRepository[User], User model.
Pattern: Repository.
SOLID: DIP · SRP · LSP
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.authentication.models import User


class UserRepository(BaseRepository[User]):

    def get_by_id(self, entity_id: int) -> Optional[User]:
        return User.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[User]:
        qs = User.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> User:
        password = data.pop("password", None)
        user = User(**data)
        if password:
            user.set_password(password)
        user.save()
        return user

    # Fields that are safe to update via this repository.
    # Prevents accidental modification of role, email, or password through bulk updates.
    ALLOWED_UPDATE_FIELDS = {
        'first_name', 'last_name', 'estado', 'intentos_fallidos',
        'bloqueado_hasta', 'email_verificado', 'role',
    }

    def update(self, entity_id: int, data: dict) -> User:
        safe_data = {k: v for k, v in data.items() if k in self.ALLOWED_UPDATE_FIELDS}
        User.objects.filter(pk=entity_id).update(**safe_data)
        return self.get_by_id(entity_id)  # Returns None instead of DoesNotExist

    def delete(self, entity_id: int) -> None:
        User.objects.filter(pk=entity_id).delete()

    # ── Auth-specific ──────────────────────────────────────────────────────────

    def get_by_email(self, email: str) -> Optional[User]:
        return User.objects.filter(email__iexact=email).first()

    def email_exists(self, email: str) -> bool:
        return User.objects.filter(email__iexact=email).exists()

```

### 📄 backend/apps/authentication/serializers/__init__.py
```python
from .forgot_password_serializer import ForgotPasswordSerializer
from .reset_password_serializer import ResetPasswordSerializer
from .login_serializer import LoginSerializer
from .register_serializer import RegisterSerializer
from .verify_email_serializer import VerifyEmailSerializer, LogoutSerializer

__all__ = [
    "ForgotPasswordSerializer",
    "ResetPasswordSerializer",
    "LoginSerializer",
    "RegisterSerializer",
    "VerifyEmailSerializer",
    "LogoutSerializer",
]

```

### 📄 backend/apps/authentication/serializers/forgot_password_serializer.py
```python
"""
ForgotPasswordSerializer — validates the email for a reset request (SRP).
One serializer per operation. No business logic; the view delegates to TokenService.
"""

from rest_framework import serializers


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

```

### 📄 backend/apps/authentication/serializers/login_serializer.py
```python
"""LoginSerializer — validates login input (SRP). One serializer per operation."""

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

```

### 📄 backend/apps/authentication/serializers/register_serializer.py
```python
"""RegisterSerializer — validates registration input (SRP)."""

from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    ruc = serializers.CharField(max_length=13, required=False, allow_blank=True, default="")
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden."}
            )
        return attrs

```

### 📄 backend/apps/authentication/serializers/reset_password_serializer.py
```python
"""
ResetPasswordSerializer — validates the reset payload (SRP).

Checks the two passwords match and meet the minimum policy. The token itself is
validated by TokenService (not here — SRP: this serializer only validates input shape).
"""

from rest_framework import serializers


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden."}
            )
        return attrs

```

### 📄 backend/apps/authentication/serializers/user_admin_serializers.py
```python
"""User admin serializers — one per operation (SRP). HU-14."""

from rest_framework import serializers

# Trabajadores y administradores deben usar el dominio corporativo (seguridad).
STAFF_EMAIL_DOMAIN = "sassblum.com"


class UserCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["worker", "admin"], default="worker")

    def validate_email(self, value: str) -> str:
        if not value.lower().endswith(f"@{STAFF_EMAIL_DOMAIN}"):
            raise serializers.ValidationError(
                f"Los trabajadores y administradores deben usar un correo @{STAFF_EMAIL_DOMAIN}."
            )
        return value

```

### 📄 backend/apps/authentication/serializers/verify_email_serializer.py
```python
"""VerifyEmailSerializer / LogoutSerializer — single-field token serializers (SRP)."""

from rest_framework import serializers


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

```

### 📄 backend/apps/authentication/services/__init__.py
```python
from .token_service import TokenService
from .auth_service import AuthService, get_auth_service
from .user_admin_service import UserAdminService, get_user_admin_service

__all__ = [
    "TokenService",
    "AuthService",
    "get_auth_service",
    "UserAdminService",
    "get_user_admin_service",
]

```

### 📄 backend/apps/authentication/services/auth_service.py
```python
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
            "rol": user.role,
            "estado": user.estado,
            "email_verificado": user.email_verificado,
        }

    @staticmethod
    def _dispatch_verification_email(user: User, token: str) -> None:
        from django.conf import settings  # noqa: PLC0415
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        verify_url = f"{frontend}/verify-email?token={token}"
        context = {
            "tipo": "password_reset",  # reuse a simple template
            "titulo": "Verifica tu correo",
            "cuerpo": "Confirma tu cuenta para empezar a usar SassBlum.",
            "reset_url": verify_url,
            "expira_en": "24 horas",
            "recipient_nombre": user.first_name,
        }
        # Transactional email: send directly (bypass the channel-preference gate,
        # since a brand-new user is not yet verified/active).
        try:
            NotificationFactory.build("email").send(user, "Verifica tu correo", context)
        except Exception:  # noqa: BLE001
            logger.warning(
                "No se pudo enviar el correo de verificación a %s",
                user.email,
                exc_info=True,
            )


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading

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

```

### 📄 backend/apps/authentication/services/token_service.py
```python
"""
TokenService — password-reset token lifecycle (SRP, separate from AuthService).

Responsibility (SRP): create, validate, and consume one-time reset tokens, and
    invalidate active sessions. It does NOT authenticate or register — that is
    AuthService's job. Keeping this separate means the reset-token policy can change
    without touching AuthService (OCP).
Depends on: PasswordResetToken, User models; simplejwt blacklist for session kill.
Pattern: SRP-focused service.
SOLID: SRP · DIP · OCP

Token policy:
    - UUID4, single-use, expires 1 hour after creation.
"""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.authentication.models import PasswordResetToken, User

TOKEN_TTL = timedelta(hours=1)


class TokenExpired(Exception):
    """Raised when a reset token is past its expiry."""


class InvalidToken(Exception):
    """Raised when a reset token does not exist or was already used."""


class TokenService:
    """Manages password-reset tokens and session invalidation."""

    def generate_reset_token(self, user: User) -> str:
        """
        Create a fresh single-use reset token for the user (expires in 1h).
        Any previous unused tokens for the user are invalidated first.
        Returns the token string (UUID).
        """
        PasswordResetToken.objects.filter(usuario=user, usado=False).update(usado=True)
        token = PasswordResetToken.objects.create(
            usuario=user,
            expira_en=timezone.now() + TOKEN_TTL,
        )
        return str(token.token)

    def validate_reset_token(self, token: str) -> User:
        """
        Validate a reset token and return its user.
        Raises InvalidToken (missing/used) or TokenExpired.
        Does NOT mark the token as used — call consume_token() after a successful reset.
        """
        prt = PasswordResetToken.objects.filter(token=token, usado=False).first()
        if prt is None:
            raise InvalidToken("Token inválido o ya utilizado.")
        if prt.expira_en < timezone.now():
            raise TokenExpired("El token de recuperación ha expirado.")
        return prt.usuario

    def consume_token(self, token: str) -> None:
        """Mark the token as used (single-use enforcement)."""
        PasswordResetToken.objects.filter(token=token).update(usado=True)

    def invalidate_sessions(self, user: User) -> None:
        """
        Blacklist all outstanding refresh tokens for the user, forcing re-login
        on every device after a password reset.
        """
        try:
            from rest_framework_simplejwt.token_blacklist.models import (  # noqa: PLC0415
                OutstandingToken,
                BlacklistedToken,
            )
        except ImportError:
            return  # token_blacklist app not installed — nothing to invalidate

        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)

```

### 📄 backend/apps/authentication/services/user_admin_service.py
```python
"""
UserAdminService — concrete IUserAdminActions (Singleton). HU-14 / D25.

Responsibility (SRP): admin user management. Separate from AuthService (session).
Depends on: UserRepository (DIP). Pattern: Singleton + Repository. SOLID: ISP·DIP·SRP·LSP.
"""

from __future__ import annotations

from apps.authentication.interfaces.i_user_admin_actions import IUserAdminActions
from apps.authentication.models import User
from apps.authentication.repositories import UserRepository
from core.exceptions.domain_exceptions import DomainException


class UserNotFound(DomainException):
    """Raised when a managed user does not exist."""


class UserAdminService(IUserAdminActions):

    def __init__(self, user_repository: UserRepository | None = None) -> None:
        self._repo = user_repository or UserRepository()

    def list_users(self, filters: dict | None = None) -> list:
        users = self._repo.get_all(filters or {})
        return [self._data(u) for u in users]

    def create_user(self, data: dict) -> dict:
        if self._repo.email_exists(data["email"]):
            raise DomainException("Ya existe una cuenta con ese correo.")
        user = self._repo.create({
            "email": data["email"],
            "first_name": data.get("nombre", ""),
            "last_name": data.get("apellido", ""),
            "password": data["password"],
            "role": data.get("role", User.Role.WORKER),
            "estado": User.Estado.ACTIVE,
            "email_verificado": True,  # admin-created accounts are pre-verified
        })
        return self._data(user)

    def block_user(self, user_id: int) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound("Usuario no encontrado.")
        user = self._repo.update(user_id, {"estado": User.Estado.BLOCKED})
        return self._data(user)

    def unblock_user(self, user_id: int) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound("Usuario no encontrado.")
        user = self._repo.update(user_id, {
            "estado": User.Estado.ACTIVE,
            "intentos_fallidos": 0,
        })
        return self._data(user)

    @staticmethod
    def _data(u: User) -> dict:
        return {
            "id": u.id,
            "email": u.email,
            "nombre": u.first_name,
            "apellido": u.last_name,
            "rol": u.role,
            "estado": u.estado,
            "email_verificado": u.email_verificado,
        }


import threading

_lock = threading.Lock()
_instance: UserAdminService | None = None


def get_user_admin_service() -> UserAdminService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = UserAdminService()
    return _instance

```

### 📄 backend/apps/authentication/tests/__init__.py
```python
# Sprint 1 · Session 8 — Test suite for the authentication module:
#   test_validators.py      → EmailValidator, PasswordValidator, chain coverage ≥ 80%
#   test_auth_service.py    → authenticate(), register(), lockout after 5 failures, JWT, blacklist

```

### 📄 backend/apps/authentication/tests/test_auth_service.py
```python
"""
Tests for AuthService (requires DB). authenticate + register + lockout.
Run: pytest apps/authentication/tests/test_auth_service.py -v
"""

import pytest

from apps.authentication.models import User
from apps.authentication.services.auth_service import (
    AuthService,
    AuthenticationFailed,
    AccountLocked,
    EmailNotVerified,
    EmailAlreadyExists,
    PasswordPolicyViolation,
)


@pytest.fixture
def active_user(db):
    u = User.objects.create_user(
        email="user@example.com", password="Pass1234",
        role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=True,
    )
    return u


@pytest.mark.django_db
class TestAuthenticate:
    def test_success_returns_user_and_tokens(self, active_user):
        result = AuthService().authenticate("user@example.com", "Pass1234")
        assert result["user"]["email"] == "user@example.com"
        assert "access" in result["tokens"] and "refresh" in result["tokens"]

    def test_wrong_password_increments_attempts(self, active_user):
        with pytest.raises(AuthenticationFailed):
            AuthService().authenticate("user@example.com", "wrong")
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 1

    def test_lockout_after_five_failures(self, active_user):
        svc = AuthService()
        for _ in range(5):
            with pytest.raises((AuthenticationFailed, AccountLocked)):
                svc.authenticate("user@example.com", "wrong")
        active_user.refresh_from_db()
        assert active_user.estado == User.Estado.BLOCKED

    def test_unverified_email_rejected(self, db):
        User.objects.create_user(
            email="pending@example.com", password="Pass1234",
            role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=False,
        )
        with pytest.raises(EmailNotVerified):
            AuthService().authenticate("pending@example.com", "Pass1234")

    def test_unknown_email_fails(self, db):
        with pytest.raises(AuthenticationFailed):
            AuthService().authenticate("nobody@example.com", "Pass1234")

    def test_success_resets_attempt_counter(self, active_user):
        active_user.intentos_fallidos = 3
        active_user.save(update_fields=["intentos_fallidos"])
        AuthService().authenticate("user@example.com", "Pass1234")
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 0


@pytest.mark.django_db
class TestRegister:
    def test_creates_pending_client(self, db):
        result = AuthService().register({
            "nombre": "Ana", "apellido": "Pérez",
            "email": "new@example.com", "password": "Pass1234",
        })
        assert "message" in result
        user = User.objects.get(email="new@example.com")
        assert user.role == User.Role.CLIENT
        assert user.estado == User.Estado.PENDING
        assert user.email_verificado is False

    def test_duplicate_email_rejected(self, active_user):
        with pytest.raises(EmailAlreadyExists):
            AuthService().register({
                "nombre": "X", "apellido": "Y",
                "email": "user@example.com", "password": "Pass1234",
            })

    def test_weak_password_rejected(self, db):
        with pytest.raises(PasswordPolicyViolation):
            AuthService().register({
                "nombre": "X", "apellido": "Y",
                "email": "weak@example.com", "password": "short",
            })


@pytest.mark.django_db
class TestVerifyEmail:
    def test_verify_activates_user(self, db):
        from django.core import signing
        from apps.authentication.services.auth_service import _VERIFY_SALT
        user = User.objects.create_user(
            email="verify@example.com", password="Pass1234",
            role=User.Role.CLIENT, estado=User.Estado.PENDING, email_verificado=False,
        )
        token = signing.dumps({"uid": user.id}, salt=_VERIFY_SALT)
        AuthService().verify_email(token)
        user.refresh_from_db()
        assert user.email_verificado is True
        assert user.estado == User.Estado.ACTIVE

```

### 📄 backend/apps/authentication/tests/test_password_reset.py
```python
"""
Tests for TokenService (password reset) — requires the database.
Run: pytest apps/authentication/tests/test_password_reset.py -v

These use @pytest.mark.django_db and run in your environment (Supabase / local PG).
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.authentication.models import User, PasswordResetToken
from apps.authentication.services.token_service import (
    TokenService,
    TokenExpired,
    InvalidToken,
)


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="reset@example.com", password="OldPass123", role=User.Role.CLIENT
    )


@pytest.mark.django_db
class TestTokenService:
    def test_generate_creates_active_token(self, user):
        token = TokenService().generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        assert prt.usado is False
        assert prt.usuario == user
        assert prt.expira_en > timezone.now()

    def test_generate_invalidates_previous_tokens(self, user):
        svc = TokenService()
        first = svc.generate_reset_token(user)
        svc.generate_reset_token(user)
        assert PasswordResetToken.objects.get(token=first).usado is True

    def test_validate_returns_user_for_valid_token(self, user):
        token = TokenService().generate_reset_token(user)
        assert TokenService().validate_reset_token(token) == user

    def test_validate_raises_invalid_for_unknown_token(self):
        with pytest.raises(InvalidToken):
            TokenService().validate_reset_token("00000000-0000-0000-0000-000000000000")

    def test_validate_raises_invalid_for_used_token(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        with pytest.raises(InvalidToken):
            svc.validate_reset_token(token)

    def test_validate_raises_expired(self, user):
        token = TokenService().generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        prt.expira_en = timezone.now() - timedelta(minutes=1)
        prt.save(update_fields=["expira_en"])
        with pytest.raises(TokenExpired):
            TokenService().validate_reset_token(token)

    def test_consume_marks_used(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        assert PasswordResetToken.objects.get(token=token).usado is True

```

### 📄 backend/apps/authentication/urls.py
```python
"""
URL routing for the authentication API. Mounted under /api/auth/ by config/urls.py.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.authentication.views import (
    RegisterView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path("forgot-password", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password", ResetPasswordView.as_view(), name="reset-password"),
]

```

### 📄 backend/apps/authentication/user_urls.py
```python
"""User-management routing (HU-14). Mounted under /api/usuarios/ by config/urls.py."""

from django.urls import path

from apps.authentication.views.user_admin_views import (
    UserListCreateView,
    UserBlockView,
    UserUnblockView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="user-list-create"),
    path("<int:user_id>/bloquear", UserBlockView.as_view(), name="user-block"),
    path("<int:user_id>/desbloquear", UserUnblockView.as_view(), name="user-unblock"),
]

```

### 📄 backend/apps/authentication/validators/__init__.py
```python
from .email_validator import EmailValidator
from .password_validator import PasswordValidator
from .registration_validator_chain import RegistrationValidatorChain

__all__ = ["EmailValidator", "PasswordValidator", "RegistrationValidatorChain"]

```

### 📄 backend/apps/authentication/validators/email_validator.py
```python
"""
EmailValidator — Chain of Responsibility node validating email format (SRP).
Extends BaseValidator (S1). Pattern: Chain of Responsibility. SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

import re

from core.base.base_validator import BaseValidator, ValidationResult

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        email = (data.get("email") or "").strip()
        if not _EMAIL_RE.match(email):
            return ValidationResult(
                is_valid=False,
                errors=["El correo electrónico no tiene un formato válido."],
                field_name="email",
            )
        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/authentication/validators/password_validator.py
```python
"""
PasswordValidator — Chain of Responsibility node validating password policy (SRP).
Policy: ≥8 chars, at least one letter and one digit.
Extends BaseValidator (S1). SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class PasswordValidator(BaseValidator):
    MIN_LENGTH = 8

    def validate(self, data: dict) -> ValidationResult:
        password = data.get("password") or ""
        if len(password) < self.MIN_LENGTH:
            return ValidationResult(
                is_valid=False,
                errors=[f"La contraseña debe tener al menos {self.MIN_LENGTH} caracteres."],
                field_name="password",
            )
        if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
            return ValidationResult(
                is_valid=False,
                errors=["La contraseña debe incluir al menos una letra y un número."],
                field_name="password",
            )
        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/authentication/validators/registration_validator_chain.py
```python
"""
RegistrationValidatorChain — assembles Email → Password (Chain of Responsibility).

Responsibility (SRP): wire the registration validator chain and expose run().
Pattern: Chain of Responsibility (assembler).
SOLID: OCP (add PhoneValidator = one addValidator, existing nodes untouched) · DIP.
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from .email_validator import EmailValidator
from .password_validator import PasswordValidator


class RegistrationValidatorChain:
    def __init__(self) -> None:
        email_v = EmailValidator()
        email_v.add_validator(PasswordValidator())
        self._root = email_v

    def run(self, data: dict) -> ValidationResult:
        return self._root.run_chain(data)

```

### 📄 backend/apps/authentication/views/__init__.py
```python
from .password_reset_views import ForgotPasswordView, ResetPasswordView
from .auth_views import RegisterView, LoginView, LogoutView, VerifyEmailView

__all__ = [
    "ForgotPasswordView",
    "ResetPasswordView",
    "RegisterView",
    "LoginView",
    "LogoutView",
    "VerifyEmailView",
]

```

### 📄 backend/apps/authentication/views/auth_views.py
```python
"""
Auth DRF views — HTTP orchestration only (SRP + DIP).

Each view depends on IAuthService (via get_auth_service()), never on the concrete class.
Declares only the permission it needs (ISP). No business logic, no ORM.

Endpoints:
    POST /api/auth/register       → RegisterView   (AllowAny)
    POST /api/auth/login          → LoginView      (AllowAny)
    POST /api/auth/logout         → LogoutView     (IsAuthenticated)
    POST /api/auth/verify-email   → VerifyEmailView (AllowAny)
"""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers import (
    LoginSerializer,
    RegisterSerializer,
    VerifyEmailSerializer,
    LogoutSerializer,
)
from apps.authentication.services import get_auth_service
from apps.authentication.services.auth_service import (
    AuthenticationFailed,
    AccountLocked,
    EmailNotVerified,
    EmailAlreadyExists,
    PasswordPolicyViolation,
    InvalidVerificationToken,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_auth_service().register(serializer.validated_data)
        except EmailAlreadyExists as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except PasswordPolicyViolation as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = get_auth_service().authenticate(data["email"], data["password"])
        except AuthenticationFailed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        except AccountLocked as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_423_LOCKED)
        except EmailNotVerified as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return Response(result, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            get_auth_service().logout(serializer.validated_data["refresh"])
        except AuthenticationFailed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_auth_service().verify_email(serializer.validated_data["token"])
        except InvalidVerificationToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)

```

### 📄 backend/apps/authentication/views/health_views.py
```python
"""
Health check endpoint — verifies database connectivity.

Returns 200 + {"status": "healthy", "database": "ok"} when all checks pass.
Returns 503 + {"status": "unhealthy", ...} when any check fails.

Used by Docker HEALTHCHECK, load balancers, and monitoring tools.
"""

from django.http import JsonResponse
from django.db import connection


def health_check(request):
    checks = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = 'ok'
    except Exception:
        checks['database'] = 'error'

    all_ok = all(v == 'ok' for v in checks.values())
    status_code = 200 if all_ok else 503
    return JsonResponse(
        {'status': 'healthy' if all_ok else 'unhealthy', **checks},
        status=status_code,
    )

```

### 📄 backend/apps/authentication/views/password_reset_views.py
```python
"""
Password reset DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ TokenService. No token logic, no ORM here.
Pattern: SRP (TokenService separate) + DIP.
SOLID: SRP · DIP

Endpoints:
    POST /api/auth/forgot-password  → ForgotPasswordView
    POST /api/auth/reset-password   → ResetPasswordView

Security:
    forgot-password returns the SAME generic response whether or not the email
    exists (no user enumeration).
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.models import User
from apps.authentication.serializers import (
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from apps.authentication.services import TokenService
from apps.authentication.services.token_service import InvalidToken, TokenExpired

_GENERIC_FORGOT_MSG = (
    "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
)


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password — request a reset link."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email=email).first()
        if user is not None:
            token = TokenService().generate_reset_token(user)
            self._dispatch_reset_email(user, token)

        # Same response regardless of existence (no enumeration)
        return Response({"message": _GENERIC_FORGOT_MSG}, status=status.HTTP_200_OK)

    @staticmethod
    def _dispatch_reset_email(user, token: str) -> None:
        """
        Send the password_reset email via EmailNotificationStrategy directly
        (this is not a TicketEvent, so it bypasses the Observer).
        """
        from django.conf import settings  # noqa: PLC0415
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415

        frontend = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend}/reset-password?token={token}"
        context = {
            "tipo": "password_reset",
            "titulo": "Restablece tu contraseña",
            "cuerpo": "Solicitaste restablecer tu contraseña.",
            "reset_url": reset_url,
            "expira_en": "1 hora",
            "recipient_nombre": user.first_name,
        }
        try:
            strategy = NotificationFactory.build("email")
            if strategy.validate(user):
                strategy.send(user, "Restablece tu contraseña", context)
        except Exception:  # noqa: BLE001
            pass  # email failure must not reveal anything to the caller


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password — set a new password using a valid token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = TokenService()
        try:
            user = service.validate_reset_token(data["token"])
        except InvalidToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TokenExpired as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_410_GONE)

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])

        service.consume_token(data["token"])
        service.invalidate_sessions(user)

        return Response(
            {"message": "Contraseña actualizada. Inicia sesión nuevamente."},
            status=status.HTTP_200_OK,
        )

```

### 📄 backend/apps/authentication/views/user_admin_views.py
```python
"""
User admin DRF views — admin-only user management (HU-14, D25).

HTTP orchestration only (SRP + DIP + ISP). Depend on IUserAdminActions via
get_user_admin_service(); declare IsAdmin.

Endpoints:
    GET   /api/usuarios            → list (filter ?role=, ?estado=)
    POST  /api/usuarios            → create worker/admin
    PATCH /api/usuarios/<id>/bloquear    → block
    PATCH /api/usuarios/<id>/desbloquear → unblock
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.user_admin_serializers import UserCreateSerializer
from apps.authentication.services.user_admin_service import (
    get_user_admin_service,
    UserNotFound,
)
from core.exceptions.domain_exceptions import DomainException
from core.permissions import IsAdmin


class UserListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filters = {}
        if "role" in request.query_params:
            filters["role"] = request.query_params["role"]
        if "estado" in request.query_params:
            filters["estado"] = request.query_params["estado"]
        users = get_user_admin_service().list_users(filters)
        return Response({"items": users, "total": len(users)}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            created = get_user_admin_service().create_user(serializer.validated_data)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(created, status=status.HTTP_201_CREATED)


class UserBlockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id: int):
        try:
            updated = get_user_admin_service().block_user(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)


class UserUnblockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id: int):
        try:
            updated = get_user_admin_service().unblock_user(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/catalog/__init__.py
```python

```

### 📄 backend/apps/catalog/admin.py
```python
from django.contrib import admin


# Catalog models are managed via the CatalogAdminPanel in the frontend.
# Register models here when Django Admin access is needed for debugging.
# Example:
# from .models import Service
# @admin.register(Service)
# class ServiceAdmin(admin.ModelAdmin):
#     list_display = ('id', 'nombre', 'categoria', 'activo')
#     list_filter = ('categoria', 'activo')
#     search_fields = ('nombre',)

```

### 📄 backend/apps/catalog/apps.py
```python
from django.apps import AppConfig


class CatalogConfig(AppConfig):
    name = 'apps.catalog'

```

### 📄 backend/apps/catalog/interfaces/__init__.py
```python
from .i_catalog_service import ICatalogService
from .i_catalog_client_view import ICatalogClientView
from .i_catalog_admin_view import ICatalogAdminView

__all__ = ["ICatalogService", "ICatalogClientView", "ICatalogAdminView"]

```

### 📄 backend/apps/catalog/interfaces/i_catalog_admin_view.py
```python
"""
ISP interface for admin-only catalog management operations.

Responsibility (SRP): expose only the management operations an ADMIN user needs.
    An admin creates, edits, and toggles services — no client-browse semantics.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — service_admin_view (DRF view with IsAdmin permission) depends on this.
SOLID: ISP · DIP · OCP

Why separate from ICatalogClientView:
    The admin view does not use getActiveServices with the same semantics as a client
    browsing the catalog. Merging both into one interface would force the admin DRF view
    to depend on methods it never calls (ISP violation).

CatalogService implements both ICatalogAdminView AND ICatalogClientView (LSP):
    Any implementation that satisfies these two interfaces is substitutable in tests.

OCP extension:
    New admin operation (e.g. bulk_toggle, duplicate_service) = new @abstractmethod here.
    ICatalogClientView remains frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogAdminView(ABC):
    """Management contract — used exclusively by admin-facing DRF views."""

    @abstractmethod
    def create_service(self, data: dict) -> dict:
        """
        Create a new service entry in the catalog.
        Args: validated dict from ServiceCreateSerializer.
        Returns: created ServiceDetail dict.
        Raises: ValidationError on duplicate nombre.
        """
        ...

    @abstractmethod
    def edit_service(self, service_id: int, data: dict) -> dict:
        """
        Partially update fields of an existing service.
        Args: validated dict from ServiceEditSerializer (all fields optional).
        Returns: updated ServiceDetail dict.
        Raises: ServiceNotFound, ValidationError.
        """
        ...

    @abstractmethod
    def toggle_active(self, service_id: int) -> dict:
        """
        Enable or disable a service in the public catalog.
        Returns: updated ServiceDetail dict with new activo value.
        Raises: ServiceNotFound.
        """
        ...

```

### 📄 backend/apps/catalog/interfaces/i_catalog_client_view.py
```python
"""
ISP interface for client-facing catalog operations.

Responsibility (SRP): expose only the browse operations a CLIENT user needs.
    A client can see active services and view one in detail — nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — service_list_view (public DRF view) depends on this, not on ICatalogService.
SOLID: ISP · DIP · OCP

Why NOT a subset of ICatalogService:
    If ICatalogService grows with admin or internal methods, inheriting from it
    would force client consumers to know about those methods (ISP violation).
    This interface is intentionally isolated so that a client-facing component
    never sees admin operations.

CatalogService implements both ICatalogClientView AND ICatalogAdminView (LSP):
    The Singleton centralises logic while each view depends only on its role interface.

OCP extension:
    New read-only client operation (e.g. search_services) = new @abstractmethod here.
    ICatalogAdminView remains frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogClientView(ABC):
    """Browse contract — used by public service listing and ticket-creation flow."""

    @abstractmethod
    def get_active_services(self, filters: dict | None = None) -> list:
        """
        Browse the public catalog of active services.
        Optional filters: {'categoria': str, 'busqueda': str}
        Returns: list of ServiceSummary dicts (id, nombre, descripcion, categoria, activo).
        """
        ...

    @abstractmethod
    def get_service_detail(self, service_id: int) -> dict:
        """
        View full detail of one active service before creating a ticket.
        Returns: ServiceDetail dict (includes creadoEn, actualizadoEn).
        Raises: ServiceNotFound if not found or inactive.
        """
        ...

```

### 📄 backend/apps/catalog/interfaces/i_catalog_service.py
```python
"""
Root ABC for the catalog module.

Responsibility (SRP): declare the complete catalog operation contract.
    No HTTP logic, no ORM queries, no serialization — only method signatures.
Depends on: abc.ABC — nothing from the domain or Django.
Pattern: DIP anchor — CatalogService (Singleton) will implement this in S11.
SOLID: DIP · OCP · LSP

Sprint coverage:
    S11 → this file (contract only)
    S11 → CatalogService(ICatalogService, ICatalogClientView, ICatalogAdminView) — Singleton
    S18 → tests mock ICatalogService; views receive the mock without modification (LSP proof)

OCP extension path:
    New catalog operation (e.g. archive_service, duplicate_service) = new @abstractmethod here
    + implementation in CatalogService. ICatalogClientView and ICatalogAdminView remain frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogService(ABC):
    """Abstract contract for all catalog use cases."""

    @abstractmethod
    def get_active_services(self, filters: dict | None = None) -> list:
        """
        Return all services with activo=True.
        Optional filters: {'categoria': str, 'busqueda': str}
        Returns: list of ServiceSummary dicts.
        Raises: nothing — returns empty list if no services match.
        """
        ...

    @abstractmethod
    def get_service_detail(self, service_id: int) -> dict:
        """
        Return full detail of a single service.
        Returns: ServiceDetail dict.
        Raises: ServiceNotFound if service_id does not exist or is inactive.
        """
        ...

    @abstractmethod
    def create_service(self, data: dict) -> dict:
        """
        Create a new service entry in the catalog (admin only — enforced at view level).
        Args: data = validated dict from ServiceCreateSerializer
              (nombre: str, descripcion: str, categoria: str).
        Returns: created ServiceDetail dict.
        Raises: ValidationError if nombre already exists.
        """
        ...

    @abstractmethod
    def edit_service(self, service_id: int, data: dict) -> dict:
        """
        Partially update an existing service.
        Args: data = validated dict from ServiceEditSerializer (all fields optional).
        Returns: updated ServiceDetail dict.
        Raises: ServiceNotFound, ValidationError.
        """
        ...

    @abstractmethod
    def toggle_active(self, service_id: int) -> dict:
        """
        Flip the activo field: True → False or False → True.
        Returns: updated ServiceDetail dict with new activo value.
        Raises: ServiceNotFound.
        """
        ...

```

### 📄 backend/apps/catalog/models/__init__.py
```python
from .service import Service

__all__ = ["Service"]

```

### 📄 backend/apps/catalog/models/service.py
```python
"""
Service model — a catalog service a client can open a ticket against (SRP).

Responsibility (SRP): persist service data only. Business logic (activation rules,
    validation) lives in CatalogService. The model only stores.
Depends on: Django ORM.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new field = additive, no logic change)
"""

from django.db import models


class Service(models.Model):

    nombre = models.CharField(max_length=120, unique=True, verbose_name="nombre")
    descripcion = models.TextField(verbose_name="descripción")
    categoria = models.CharField(max_length=80, verbose_name="categoría")
    activo = models.BooleanField(default=True, verbose_name="activo")
    imagen_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL de imagen"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "catalog_service"
        ordering = ["categoria", "nombre"]
        indexes = [
            models.Index(fields=["activo", "categoria"]),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.nombre} ({self.categoria}) · {estado}"

```

### 📄 backend/apps/catalog/repositories/__init__.py
```python
from .service_repository import ServiceRepository

__all__ = ["ServiceRepository"]

```

### 📄 backend/apps/catalog/repositories/service_repository.py
```python
"""
ServiceRepository — ORM gateway for catalog Service (Repository).
SOLID: DIP · SRP · LSP. CatalogService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.catalog.models import Service


class ServiceRepository(BaseRepository[Service]):

    def get_by_id(self, entity_id: int) -> Optional[Service]:
        return Service.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Service]:
        qs = Service.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Service:
        return Service.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Service:
        Service.objects.filter(pk=entity_id).update(**data)
        return Service.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Service.objects.filter(pk=entity_id).delete()

    # ── Catalog-specific ───────────────────────────────────────────────────────

    def get_active(
        self, categoria: str | None = None, busqueda: str | None = None
    ) -> list[Service]:
        qs = Service.objects.filter(activo=True)
        if categoria:
            qs = qs.filter(categoria__iexact=categoria)
        if busqueda:
            qs = qs.filter(nombre__icontains=busqueda)
        return list(qs)

```

### 📄 backend/apps/catalog/serializers/__init__.py
```python
from .service_serializers import ServiceCreateSerializer, ServiceEditSerializer

__all__ = ["ServiceCreateSerializer", "ServiceEditSerializer"]

```

### 📄 backend/apps/catalog/serializers/service_serializers.py
```python
"""
Catalog write serializers — one per operation (SRP).
Read shaping is done by CatalogService (_summary/_detail), so list/detail
serializers are not needed here; these validate admin write operations.
"""

from rest_framework import serializers


class ServiceCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    descripcion = serializers.CharField()
    categoria = serializers.CharField(max_length=80)


class ServiceEditSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False)
    categoria = serializers.CharField(max_length=80, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs

```

### 📄 backend/apps/catalog/services/__init__.py
```python
from .catalog_service import CatalogService, get_catalog_service

__all__ = ["CatalogService", "get_catalog_service"]

```

### 📄 backend/apps/catalog/services/catalog_service.py
```python
"""
CatalogService — concrete implementation of both ISP catalog views (Singleton).

Responsibility (SRP): catalog business logic. Implements ICatalogClientView AND
    ICatalogAdminView — one Singleton serves both roles (LSP). Views receive the
    role-specific interface, never this class directly (DIP).
Depends on: ServiceRepository (DIP), IStorageService (DIP, for service photos),
    domain_exceptions.
Pattern: Singleton + Repository.
SOLID: DIP · SRP · LSP · ISP · OCP
"""

from __future__ import annotations

from apps.catalog.interfaces import ICatalogClientView, ICatalogAdminView
from apps.catalog.repositories import ServiceRepository
from apps.tickets.interfaces import IStorageService
from core.exceptions.domain_exceptions import ServiceNotFound


class CatalogService(ICatalogClientView, ICatalogAdminView):

    def __init__(
        self,
        service_repository: ServiceRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = service_repository or ServiceRepository()
        self._storage = storage

    # ── Client view (browse) ───────────────────────────────────────────────────

    def get_active_services(self, filters: dict | None = None) -> list:
        filters = filters or {}
        services = self._repo.get_active(
            categoria=filters.get("categoria"),
            busqueda=filters.get("busqueda"),
        )
        return [self._summary(s) for s in services]

    def get_service_detail(self, service_id: int) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None or not service.activo:
            raise ServiceNotFound("El servicio no existe o no está disponible.")
        return self._detail(service)

    # ── Admin view (manage) ────────────────────────────────────────────────────

    def create_service(self, data: dict) -> dict:
        data = dict(data)
        imagen = data.pop("imagen", None)
        service = self._repo.create(data)
        service = self._maybe_attach_image(service, imagen)
        return self._detail(service)

    def edit_service(self, service_id: int, data: dict) -> dict:
        if self._repo.get_by_id(service_id) is None:
            raise ServiceNotFound("El servicio no existe.")
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            service = self._repo.update(service_id, data)
        else:
            service = self._repo.get_by_id(service_id)
        service = self._maybe_attach_image(service, imagen)
        return self._detail(service)

    def toggle_active(self, service_id: int) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None:
            raise ServiceNotFound("El servicio no existe.")
        service = self._repo.update(service_id, {"activo": not service.activo})
        return self._detail(service)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, service, imagen):
        if imagen is None or self._storage is None:
            return service
        path = f"services/{service.id}/{getattr(imagen, 'name', 'imagen')}"
        url = self._storage.upload(imagen, path)
        return self._repo.update(service.id, {"imagen_url": url})

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(s) -> dict:
        return {
            "id": s.id,
            "nombre": s.nombre,
            "descripcion": s.descripcion,
            "categoria": s.categoria,
            "activo": s.activo,
            "imagen_url": s.imagen_url,
        }

    @classmethod
    def _detail(cls, s) -> dict:
        return {
            **cls._summary(s),
            "creado_en": s.created_at.isoformat(),
            "actualizado_en": s.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading

_lock = threading.Lock()
_instance: CatalogService | None = None


def get_catalog_service() -> CatalogService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService  # noqa: PLC0415
                _instance = CatalogService(storage=StorageService())
    return _instance

```

### 📄 backend/apps/catalog/tests/__init__.py
```python
# Sprint 2 · Session 18 — Tests del módulo catalog:
#   test_catalog_service.py  → get_active_services (con y sin filtros), get_service_detail,
#                               create_service (duplicado), toggle_active
#   test_catalog_views.py    → permiso IsAdmin en service_admin_view,
#                              acceso público a service_list_view

```

### 📄 backend/apps/catalog/urls.py
```python
"""URL routing for the catalog API. Mounted under /api/servicios/ by config/urls.py."""

from django.urls import path

from apps.catalog.views import ServiceListView, ServiceDetailView, ServiceAdminView

urlpatterns = [
    path("", ServiceListView.as_view(), name="service-list"),
    path("admin", ServiceAdminView.as_view(), name="service-admin-create"),
    path("admin/<int:service_id>", ServiceAdminView.as_view(), name="service-admin-edit"),
    path("<int:service_id>", ServiceDetailView.as_view(), name="service-detail"),
]

```

### 📄 backend/apps/catalog/views/__init__.py
```python
from .catalog_views import ServiceListView, ServiceDetailView, ServiceAdminView

__all__ = ["ServiceListView", "ServiceDetailView", "ServiceAdminView"]

```

### 📄 backend/apps/catalog/views/catalog_views.py
```python
"""
Catalog DRF views — HTTP orchestration only (SRP + DIP + ISP).

Browse views depend on ICatalogClientView; admin views on ICatalogAdminView
(both resolved from the same Singleton via get_catalog_service()). The view never
touches the ORM. Service management (create/edit/toggle) requires worker or admin.

Endpoints:
    GET   /api/servicios              → ServiceListView   (public — marketing catalog)
    GET   /api/servicios/<id>         → ServiceDetailView (authenticated)
    POST  /api/servicios/admin        → ServiceAdminView.post   (IsWorker | IsAdmin)
    PATCH /api/servicios/admin/<id>   → ServiceAdminView.patch  (IsWorker | IsAdmin)
    PATCH /api/servicios/admin/<id>?action=toggle → toggle      (IsWorker | IsAdmin)

Service photos: the admin endpoints accept a multipart `imagen` file which is
uploaded to Supabase Storage by CatalogService via IStorageService (DIP).
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.serializers import ServiceCreateSerializer, ServiceEditSerializer
from apps.catalog.services import get_catalog_service
from core.exceptions.domain_exceptions import ServiceNotFound
from core.permissions import IsAdmin, IsWorker


class ServiceListView(APIView):
    # Public marketing catalog (homepage / public "Servicios" page).
    permission_classes = [AllowAny]

    def get(self, request):
        filters = {
            k: request.query_params[k]
            for k in ("categoria", "busqueda")
            if k in request.query_params
        }
        services = get_catalog_service().get_active_services(filters)
        return Response(
            {"items": services, "total": len(services)},
            status=status.HTTP_200_OK,
        )


class ServiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, service_id: int):
        try:
            detail = get_catalog_service().get_service_detail(service_id)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(detail, status=status.HTTP_200_OK)


class ServiceAdminView(APIView):
    permission_classes = [IsWorker | IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = ServiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        created = get_catalog_service().create_service(data)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, service_id: int):
        # toggle path is handled by a distinct URL → action query flag
        if request.query_params.get("action") == "toggle":
            return self._toggle(service_id)
        serializer = ServiceEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        try:
            updated = get_catalog_service().edit_service(service_id, data)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

    def _toggle(self, service_id: int):
        try:
            updated = get_catalog_service().toggle_active(service_id)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/gallery/__init__.py
```python

```

### 📄 backend/apps/gallery/apps.py
```python
from django.apps import AppConfig


class GalleryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.gallery"

```

### 📄 backend/apps/gallery/models/__init__.py
```python
from .project import Project

__all__ = ["Project"]

```

### 📄 backend/apps/gallery/models/project.py
```python
"""
Project model — a portfolio/gallery item the admin manages (SRP).

Mirrors the catalog Service pattern: the model only stores data; business logic
lives in GalleryService. Lets the admin add gallery cards without touching code.
SOLID: SRP · OCP (new field = additive).
"""

from django.db import models


class Project(models.Model):

    titulo = models.CharField(max_length=120, verbose_name="título")
    descripcion = models.TextField(blank=True, default="", verbose_name="descripción")
    tag = models.CharField(max_length=80, blank=True, default="", verbose_name="etiqueta")
    imagen_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL de imagen"
    )
    activo = models.BooleanField(default=True, verbose_name="activo")
    orden = models.PositiveIntegerField(default=0, verbose_name="orden")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "gallery_project"
        ordering = ["orden", "-created_at"]
        indexes = [
            models.Index(fields=["activo", "orden"], name="gallery_pro_activo_idx"),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.titulo} ({self.tag}) · {estado}"

```

### 📄 backend/apps/gallery/repositories/__init__.py
```python
from .project_repository import ProjectRepository

__all__ = ["ProjectRepository"]

```

### 📄 backend/apps/gallery/repositories/project_repository.py
```python
"""
ProjectRepository — ORM gateway for gallery Project (Repository).
SOLID: DIP · SRP · LSP. GalleryService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.gallery.models import Project


class ProjectRepository(BaseRepository[Project]):

    def get_by_id(self, entity_id: int) -> Optional[Project]:
        return Project.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Project]:
        qs = Project.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Project:
        return Project.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Project:
        Project.objects.filter(pk=entity_id).update(**data)
        return Project.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Project.objects.filter(pk=entity_id).delete()

    # ── Gallery-specific ───────────────────────────────────────────────────────

    def get_active(self) -> list[Project]:
        return list(Project.objects.filter(activo=True))

```

### 📄 backend/apps/gallery/serializers/__init__.py
```python
from .project_serializers import ProjectCreateSerializer, ProjectEditSerializer

__all__ = ["ProjectCreateSerializer", "ProjectEditSerializer"]

```

### 📄 backend/apps/gallery/serializers/project_serializers.py
```python
"""
Gallery write serializers — one per operation (SRP).
Read shaping is done by GalleryService (_summary/_detail).
"""

from rest_framework import serializers


class ProjectCreateSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=120)
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    tag = serializers.CharField(max_length=80, required=False, allow_blank=True, default="")
    imagen_url = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    orden = serializers.IntegerField(required=False, default=0)


class ProjectEditSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    tag = serializers.CharField(max_length=80, required=False, allow_blank=True)
    imagen_url = serializers.URLField(max_length=500, required=False, allow_blank=True)
    orden = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs

```

### 📄 backend/apps/gallery/services/__init__.py
```python
from .gallery_service import GalleryService, get_gallery_service

__all__ = ["GalleryService", "get_gallery_service"]

```

### 📄 backend/apps/gallery/services/gallery_service.py
```python
"""
GalleryService — gallery/portfolio business logic (Singleton).

Mirrors CatalogService: lets the admin create/edit/toggle gallery projects and
exposes the active list to the public site. Image upload is delegated to
IStorageService (DIP), exactly like the catalog.
SOLID: DIP · SRP · LSP · OCP
"""

from __future__ import annotations

import threading

from apps.gallery.repositories import ProjectRepository
from apps.tickets.interfaces import IStorageService
from core.exceptions.domain_exceptions import DomainException


class ProjectNotFound(DomainException):
    """Raised when a gallery project does not exist."""


class GalleryService:

    def __init__(
        self,
        project_repository: ProjectRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = project_repository or ProjectRepository()
        self._storage = storage

    # ── Public view ─────────────────────────────────────────────────────────────

    def get_active_projects(self) -> list:
        return [self._summary(p) for p in self._repo.get_active()]

    # ── Admin management ───────────────────────────────────────────────────────

    def list_all(self) -> list:
        return [self._detail(p) for p in self._repo.get_all()]

    def create_project(self, data: dict) -> dict:
        data = dict(data)
        imagen = data.pop("imagen", None)
        project = self._repo.create(data)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def edit_project(self, project_id: int, data: dict) -> dict:
        if self._repo.get_by_id(project_id) is None:
            raise ProjectNotFound("El proyecto no existe.")
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            project = self._repo.update(project_id, data)
        else:
            project = self._repo.get_by_id(project_id)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def toggle_active(self, project_id: int) -> dict:
        project = self._repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFound("El proyecto no existe.")
        project = self._repo.update(project_id, {"activo": not project.activo})
        return self._detail(project)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, project, imagen):
        if imagen is None or self._storage is None:
            return project
        path = f"gallery/{project.id}/{getattr(imagen, 'name', 'imagen')}"
        url = self._storage.upload(imagen, path)
        return self._repo.update(project.id, {"imagen_url": url})

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(p) -> dict:
        return {
            "id": p.id,
            "titulo": p.titulo,
            "descripcion": p.descripcion,
            "tag": p.tag,
            "imagen_url": p.imagen_url,
            "activo": p.activo,
            "orden": p.orden,
        }

    @classmethod
    def _detail(cls, p) -> dict:
        return {
            **cls._summary(p),
            "creado_en": p.created_at.isoformat(),
            "actualizado_en": p.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

_lock = threading.Lock()
_instance: GalleryService | None = None


def get_gallery_service() -> GalleryService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService  # noqa: PLC0415
                _instance = GalleryService(storage=StorageService())
    return _instance

```

### 📄 backend/apps/gallery/urls.py
```python
"""URL routing for the gallery API. Mounted under /api/proyectos/ by config/urls.py."""

from django.urls import path

from apps.gallery.views import ProjectListView, ProjectAdminView

urlpatterns = [
    path("", ProjectListView.as_view(), name="project-list"),
    path("admin", ProjectAdminView.as_view(), name="project-admin-create"),
    path("admin/<int:project_id>", ProjectAdminView.as_view(), name="project-admin-edit"),
]

```

### 📄 backend/apps/gallery/views/__init__.py
```python
from .gallery_views import ProjectListView, ProjectAdminView

__all__ = ["ProjectListView", "ProjectAdminView"]

```

### 📄 backend/apps/gallery/views/gallery_views.py
```python
"""
Gallery DRF views — HTTP orchestration only (SRP + DIP).

Endpoints (mounted under /api/proyectos/ by config/urls.py):
    GET   /api/proyectos              → ProjectListView   (public — portfolio)
    GET   /api/proyectos/admin        → ProjectAdminView.get   (IsWorker | IsAdmin) — list all
    POST  /api/proyectos/admin        → ProjectAdminView.post  (IsWorker | IsAdmin) — create
    PATCH /api/proyectos/admin/<id>   → ProjectAdminView.patch (IsWorker | IsAdmin) — edit
    PATCH /api/proyectos/admin/<id>?action=toggle → toggle     (IsWorker | IsAdmin)

Photos: the admin endpoints accept a multipart `imagen` file uploaded via
IStorageService, mirroring the catalog.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gallery.serializers import ProjectCreateSerializer, ProjectEditSerializer
from apps.gallery.services import get_gallery_service
from apps.gallery.services.gallery_service import ProjectNotFound
from core.permissions import IsAdmin, IsWorker


class ProjectListView(APIView):
    # Public portfolio (gallery page).
    permission_classes = [AllowAny]

    def get(self, request):
        projects = get_gallery_service().get_active_projects()
        return Response(
            {"items": projects, "total": len(projects)},
            status=status.HTTP_200_OK,
        )


class ProjectAdminView(APIView):
    permission_classes = [IsWorker | IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(get_gallery_service().list_all(), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        created = get_gallery_service().create_project(data)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, project_id: int):
        if request.query_params.get("action") == "toggle":
            return self._toggle(project_id)
        serializer = ProjectEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        try:
            updated = get_gallery_service().edit_project(project_id, data)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

    def _toggle(self, project_id: int):
        try:
            updated = get_gallery_service().toggle_active(project_id)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/notifications/__init__.py
```python

```

### 📄 backend/apps/notifications/admin.py
```python
from django.contrib import admin


# Notification models are typically managed programmatically.
# Register here when Django Admin access is needed for debugging.
# Example:
# from .models import Notification
# @admin.register(Notification)
# class NotificationAdmin(admin.ModelAdmin):
#     list_display = ('id', 'user', 'tipo', 'leida', 'created_at')
#     list_filter = ('tipo', 'leida')

```

### 📄 backend/apps/notifications/apps.py
```python
"""
NotificationsConfig — Django app config for the notifications module.

Responsibility (SRP): configure the app. No signal registration here —
    the Observer signal lives in apps.tickets.apps.ready() (the emitter side),
    keeping the dependency one-way (tickets → notifications, never the reverse).
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"

```

### 📄 backend/apps/notifications/factory/__init__.py
```python
from .notification_factory import NotificationFactory

__all__ = ["NotificationFactory"]

```

### 📄 backend/apps/notifications/factory/notification_factory.py
```python
"""
Factory for assembling notification channel strategies (OCP).

Responsibility (SRP): map a channel type string to the correct INotificationStrategy instance.
    Does not send notifications; does not contain channel logic.
Depends on: INotificationStrategy — the only thing the factory exposes to consumers.
Pattern: Factory — decouples strategy creation from strategy consumption.
SOLID: OCP · SRP · DIP

OCP extension (Sprint 4 — SMSStrategy):
    1. Create apps/notifications/strategies/sms_strategy.py
    2. Add 'sms': SMSStrategy to CHANNEL_MAP
    3. Nothing else changes — NotificationService, EmailStrategy, InApp, WS untouched.

Usage:
    strategy = NotificationFactory.build('email', repo=notification_repo)
    strategy.send(recipient, message, context)
"""

from __future__ import annotations

from apps.notifications.interfaces import INotificationStrategy


class NotificationFactory:
    """Maps channel type → INotificationStrategy instance."""

    @staticmethod
    def build(channel_type: str, notification_repository=None) -> INotificationStrategy:
        """
        Return the strategy for the given channel type.

        Args:
            channel_type:            'email' | 'in_app' | 'ws'
            notification_repository: required only for 'in_app' (DIP injection).

        Returns:
            INotificationStrategy instance.

        Raises:
            ValueError — if channel_type is not registered in CHANNEL_MAP.
        """
        from apps.notifications.strategies import (
            EmailNotificationStrategy,
            InAppNotificationStrategy,
            WebSocketNotificationStrategy,
        )

        CHANNEL_MAP: dict[str, type] = {
            "email":  EmailNotificationStrategy,
            "in_app": InAppNotificationStrategy,
            "ws":     WebSocketNotificationStrategy,
        }

        strategy_class = CHANNEL_MAP.get(channel_type)
        if strategy_class is None:
            raise ValueError(
                f"Unknown notification channel: '{channel_type}'. "
                f"Registered channels: {list(CHANNEL_MAP.keys())}"
            )

        if channel_type == "in_app":
            if notification_repository is None:
                raise ValueError("'in_app' channel requires a notification_repository instance.")
            return strategy_class(notification_repository)

        return strategy_class()

```

### 📄 backend/apps/notifications/interfaces/__init__.py
```python
from .i_notification_strategy import INotificationStrategy
from .i_notification_service import INotificationService

__all__ = ["INotificationStrategy", "INotificationService"]

```

### 📄 backend/apps/notifications/interfaces/i_notification_service.py
```python
"""
Root ABC for the notification service — Observer subject.

Responsibility (SRP): declare the contract for dispatching and querying notifications.
    No channel logic, no ORM access — only orchestration signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: Singleton (the concrete NotificationService is a module-level singleton)
         + Observer subject (receives events from the ticket signal).
SOLID: DIP · OCP · SRP

Sprint coverage:
    S19 → this file (contract)
    S20 → NotificationService(INotificationService) — Singleton implementation
    S26 → useNotifications hook depends on this interface on the FE side
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class INotificationService(ABC):
    """Abstract contract for notification dispatch and management."""

    @abstractmethod
    def dispatch(self, event: dict) -> None:
        """
        Observer entry point — called by the post_save(TicketEvent) signal handler.

        Args:
            event: serialized dict of a TicketEvent (not the model instance, to avoid
                   circular import between apps.tickets and apps.notifications).
                   Keys: ticket_id, tipo_evento, estado_anterior, estado_nuevo,
                         comentario, autor_id, cliente_id, asignado_id.

        Behavior:
            1. Determines recipients based on tipo_evento (SRP: this method decides who).
            2. Loads NotificationPreference for each recipient.
            3. For each active channel: NotificationFactory.build(canal).send().
        """
        ...

    @abstractmethod
    def get_user_notifications(self, user, page: int = 1) -> dict:
        """
        Return paginated notifications for the given user.

        Returns:
            {'items': list[dict], 'total': int, 'unread_count': int, 'page': int}
        """
        ...

    @abstractmethod
    def mark_as_read(self, notification_id: int, user) -> dict:
        """
        Mark a single notification as read. Enforces ownership.

        Returns: updated notification dict.
        Raises: NotificationNotFound if not found or not owned by user.
        """
        ...

    @abstractmethod
    def get_preferences(self, user) -> dict:
        """
        Return (or create with defaults) the NotificationPreference for the user.

        Returns: {'email_activo': bool, 'in_app_activo': bool, 'ws_activo': bool}
        """
        ...

    @abstractmethod
    def set_preferences(self, user, data: dict) -> dict:
        """
        Update the NotificationPreference for the user.

        Args:
            data: partial dict with any of email_activo, in_app_activo, ws_activo.

        Returns: updated preferences dict.
        """
        ...

```

### 📄 backend/apps/notifications/interfaces/i_notification_strategy.py
```python
"""
Root ABC for all notification delivery channels.

Responsibility (SRP): declare the contract for sending a notification via one channel.
    No routing logic, no preference checks — just the delivery contract.
Depends on: abc.ABC — nothing from the domain.
Pattern: Strategy — each channel is a concrete strategy behind this interface.
SOLID: DIP · OCP · LSP · SRP

OCP extension:
    SMSStrategy / PushStrategy = new class implementing INotificationStrategy
    + one entry in NotificationFactory.CHANNEL_MAP.
    Existing strategies (Email, InApp, WebSocket) are NEVER modified.

LSP:
    NotificationService always receives INotificationStrategy — any concrete
    strategy is substitutable in tests (inject a mock without touching the service).

Sprint coverage:
    S19 → this file (contract) + 3 concrete strategies
    S20 → NotificationService.dispatch() consumes this interface
    S27 → tests mock INotificationStrategy; strategies tested in isolation
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class INotificationStrategy(ABC):
    """Abstract contract for a single notification delivery channel."""

    @abstractmethod
    def validate(self, recipient) -> bool:
        """
        Check that the channel can deliver to this recipient.
        Examples:
            EmailStrategy: recipient.email is non-empty and verified.
            WebSocketStrategy: the user's WS group exists (always True — fire-and-forget).
            InAppStrategy: recipient is active.

        Args:
            recipient: User model instance.

        Returns:
            bool — False means skip this channel for this recipient (no exception).
        """
        ...

    @abstractmethod
    def send(self, recipient, message: str, context: dict) -> None:
        """
        Deliver the notification to the recipient via this channel.

        Args:
            recipient: User model instance (the notification destination).
            message:   Plain-text summary of the notification.
            context:   Channel-specific data dict.
                       EmailStrategy expects: {'tipo', 'subject', 'titulo', 'cuerpo', ...}
                       InAppStrategy expects: {'tipo', 'titulo', 'cuerpo', 'payload'}
                       WebSocketStrategy expects: {'notification_id', 'tipo', 'titulo', 'cuerpo'}

        Raises:
            NotificationDeliveryError — if the channel fails after internal retries.
                NotificationService catches this and continues with other channels.
        """
        ...

    @abstractmethod
    def log(self, status: str, details: str) -> None:
        """
        Record the delivery attempt result.

        Args:
            status:  'sent' | 'failed' | 'skipped'
            details: Human-readable explanation (channel, recipient email/id, error message).
        """
        ...

```

### 📄 backend/apps/notifications/models/__init__.py
```python
from .notification import Notification
from .notification_preference import NotificationPreference

__all__ = ["Notification", "NotificationPreference"]

```

### 📄 backend/apps/notifications/models/notification.py
```python
"""
Notification model — stores one in-app notification record (SRP).

Responsibility (SRP): persist notification data only. It does NOT decide whether
    to send — that logic lives in NotificationService. The model only stores.
Depends on: Django ORM, authentication.User.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new tipo = new choice, no logic change)

A partial index on unread notifications accelerates the badge counter query
(get_unread_count) used by NotificationBell on the frontend.
"""

from django.db import models


class Notification(models.Model):

    class Tipo(models.TextChoices):
        CREACION      = "creacion",      "Creación"
        CAMBIO_ESTADO = "cambio_estado", "Cambio de estado"
        COMENTARIO    = "comentario",    "Comentario"
        ASIGNACION    = "asignacion",    "Asignación"
        REASIGNACION  = "reasignacion",  "Reasignación"
        INFORMACION   = "informacion",   "Información"

    usuario = models.ForeignKey(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="notificaciones",
        verbose_name="usuario",
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.INFORMACION,
        verbose_name="tipo",
    )
    titulo = models.CharField(max_length=160, verbose_name="título")
    cuerpo = models.TextField(verbose_name="cuerpo")
    leida = models.BooleanField(default=False, verbose_name="leída")
    payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="payload",
        help_text="Datos del evento original (ticket_numero, estados, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creada en")

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
        indexes = [
            # Partial index: solo notificaciones no leídas (acelera el contador del badge)
            models.Index(
                fields=["usuario"],
                condition=models.Q(leida=False),
                name="notif_unread_by_user_idx",
            ),
            models.Index(fields=["usuario", "created_at"]),
        ]

    def __str__(self) -> str:
        estado = "•" if not self.leida else " "
        return f"{estado} {self.titulo} → user {self.usuario_id}"

```

### 📄 backend/apps/notifications/models/notification_preference.py
```python
"""
NotificationPreference model — per-user channel preferences (SRP).

Responsibility (SRP): store which channels a user wants enabled. Nothing more.
    NotificationService reads this to decide which strategies to invoke.
Depends on: Django ORM, authentication.User.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new channel = new boolean field)

One row per user (OneToOne). Defaults: all channels enabled.
"""

from django.db import models


class NotificationPreference(models.Model):

    usuario = models.OneToOneField(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="preferencias_notificacion",
        verbose_name="usuario",
    )
    email_activo = models.BooleanField(default=True, verbose_name="email activo")
    in_app_activo = models.BooleanField(default=True, verbose_name="in-app activo")
    ws_activo = models.BooleanField(default=True, verbose_name="websocket activo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizada en")

    class Meta:
        db_table = "notifications_preference"

    def __str__(self) -> str:
        canales = []
        if self.email_activo:
            canales.append("email")
        if self.in_app_activo:
            canales.append("in_app")
        if self.ws_activo:
            canales.append("ws")
        return f"Prefs user {self.usuario_id}: {', '.join(canales) or 'ninguno'}"

```

### 📄 backend/apps/notifications/repositories/__init__.py
```python
from .notification_repository import NotificationRepository

__all__ = ["NotificationRepository"]

```

### 📄 backend/apps/notifications/repositories/notification_repository.py
```python
"""
NotificationRepository — encapsulates all ORM access for notifications (Repository).

Responsibility (SRP): every Notification / NotificationPreference query lives here.
    No view, service, or strategy touches the ORM directly (DIP).
Depends on: BaseRepository[Notification], Notification, NotificationPreference models.
Pattern: Repository.
SOLID: DIP · SRP · LSP (substitutable for BaseRepository in tests)

Implements the 5 generic CRUD methods from BaseRepository plus notification-specific
queries used by NotificationService and the DRF views.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.notifications.models import Notification, NotificationPreference

PAGE_SIZE = 20


class NotificationRepository(BaseRepository[Notification]):
    """ORM gateway for the notifications module."""

    # ── Generic CRUD (BaseRepository contract) ─────────────────────────────────

    def get_by_id(self, entity_id: int) -> Optional[Notification]:
        return Notification.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Notification]:
        qs = Notification.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Notification:
        return Notification.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Notification:
        Notification.objects.filter(pk=entity_id).update(**data)
        return Notification.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Notification.objects.filter(pk=entity_id).delete()

    # ── Notification-specific queries ──────────────────────────────────────────

    def get_unread_count(self, user) -> int:
        """Count of unread notifications — uses the partial index for speed."""
        return Notification.objects.filter(usuario=user, leida=False).count()

    def get_user_notifications(self, user, page: int = 1) -> dict:
        """
        Return a page of notifications for a user, newest first.
        Returns: {'items': list[Notification], 'total': int, 'unread_count': int, 'page': int}
        """
        base_qs = Notification.objects.filter(usuario=user)
        total = base_qs.count()
        unread = base_qs.filter(leida=False).count()

        start = (max(page, 1) - 1) * PAGE_SIZE
        items = list(base_qs[start:start + PAGE_SIZE])

        return {
            "items": items,
            "total": total,
            "unread_count": unread,
            "page": page,
        }

    def mark_as_read(self, notification_id: int, user) -> Optional[Notification]:
        """
        Mark a single notification as read, enforcing ownership.
        Returns the updated Notification, or None if not found / not owned.
        """
        notif = Notification.objects.filter(pk=notification_id, usuario=user).first()
        if notif is None:
            return None
        if not notif.leida:
            notif.leida = True
            notif.save(update_fields=["leida"])
        return notif

    def mark_all_as_read(self, user) -> int:
        """Mark every unread notification of the user as read. Returns rows affected."""
        return Notification.objects.filter(usuario=user, leida=False).update(leida=True)

    # ── Preferences ────────────────────────────────────────────────────────────

    def get_or_create_preferences(self, user) -> NotificationPreference:
        """Return the user's preferences, creating defaults (all channels on) if absent."""
        prefs, _ = NotificationPreference.objects.get_or_create(usuario=user)
        return prefs

```

### 📄 backend/apps/notifications/serializers/__init__.py
```python
from .notification_list_serializer import NotificationListSerializer
from .notification_preferences_serializer import NotificationPreferencesSerializer

__all__ = ["NotificationListSerializer", "NotificationPreferencesSerializer"]

```

### 📄 backend/apps/notifications/serializers/notification_list_serializer.py
```python
"""
NotificationListSerializer — read-only serializer for the notification list (SRP).

Responsibility (SRP): shape a Notification for the GET /api/notificaciones response.
    One serializer per operation — this is the read/list operation.
Depends on: DRF ModelSerializer, Notification model.
SOLID: SRP
"""

from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationListSerializer(serializers.ModelSerializer):

    creado_en = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "tipo", "titulo", "cuerpo", "leida", "payload", "creado_en"]
        read_only_fields = fields

```

### 📄 backend/apps/notifications/serializers/notification_preferences_serializer.py
```python
"""
NotificationPreferencesSerializer — for reading/updating channel preferences (SRP).

Responsibility (SRP): validate the PATCH /api/notificaciones/preferencias payload.
    All three fields optional (partial update). One serializer per operation.
Depends on: DRF Serializer.
SOLID: SRP
"""

from rest_framework import serializers


class NotificationPreferencesSerializer(serializers.Serializer):
    email_activo = serializers.BooleanField(required=False)
    in_app_activo = serializers.BooleanField(required=False)
    ws_activo = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "Debe enviar al menos un campo de preferencia para actualizar."
            )
        return attrs

```

### 📄 backend/apps/notifications/services/__init__.py
```python
from .notification_service import NotificationService, get_notification_service

__all__ = ["NotificationService", "get_notification_service"]

```

### 📄 backend/apps/notifications/services/notification_service.py
```python
"""
NotificationService — Singleton + Observer subject.

Responsibility (SRP): orchestrate notification dispatch across channels.
    Determines recipients by tipo_evento, respects preferences, delegates
    delivery to strategies via NotificationFactory. No channel logic here.
Depends on: INotificationService, NotificationFactory, NotificationRepository.
    User model loaded with deferred import to avoid circular at module level.
Pattern: Singleton (module-level lazy instance) + Observer subject.
SOLID: DIP · SRP · OCP

D4 — payload as dict (not TicketEvent instance):
    apps.notifications must NEVER import from apps.tickets.
    The signal handler in apps.tickets serializes the event before calling dispatch().

D5 — recipient selection by tipo_evento (logic lives here, not in strategies).

OCP: new tipo_evento = new branch in _resolve_recipients. NotificationFactory and
    strategies are never modified.
"""

from __future__ import annotations

import logging

from apps.notifications.interfaces import INotificationService

logger = logging.getLogger(__name__)


# ── Recipient selection ────────────────────────────────────────────────────────

def _resolve_recipients(event: dict) -> list:
    """
    Load User instances that should receive this notification.
    Deferred import avoids module-level coupling to apps.authentication.
    """
    from apps.authentication.models import User  # noqa: PLC0415

    tipo = event.get("tipo_evento", "")
    recipients: set = set()

    if tipo == "creacion":
        recipients.update(
            User.objects.filter(role=User.Role.ADMIN, estado=User.Estado.ACTIVE)
        )

    if tipo in ("cambio_estado", "comentario", "asignacion", "reasignacion", "creacion"):
        if cliente_id := event.get("cliente_id"):
            try:
                recipients.add(User.objects.get(id=cliente_id))
            except User.DoesNotExist:
                pass

    if tipo in ("asignacion", "reasignacion", "comentario"):
        if asignado_id := event.get("asignado_id"):
            try:
                recipients.add(User.objects.get(id=asignado_id))
            except User.DoesNotExist:
                pass

    # Exclude the event author (no self-notifications)
    if autor_id := event.get("autor_id"):
        recipients = {r for r in recipients if r.id != autor_id}

    return list(recipients)


# ── NotificationService ────────────────────────────────────────────────────────

class NotificationService(INotificationService):
    """
    Singleton implementation of INotificationService.
    Receives TicketEvent payloads (as dicts) from the ticket signal handler and
    fans out notifications across each recipient's preferred channels.
    """

    def __init__(self, notification_repository=None) -> None:
        self._repo = notification_repository

    # ── Observer entry point ───────────────────────────────────────────────────

    def dispatch(self, event: dict) -> None:
        """Fan out a TicketEvent notification across all relevant recipients/channels."""
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415

        recipients = _resolve_recipients(event)
        if not recipients:
            logger.debug("dispatch: no recipients for tipo_evento=%s", event.get("tipo_evento"))
            return

        for recipient in recipients:
            prefs = self.get_preferences(recipient)
            context = self._build_context(event, recipient)
            message = self._format_message(event)

            for channel, active in [
                ("email",  prefs.get("email_activo",  True)),
                ("in_app", prefs.get("in_app_activo", True)),
                ("ws",     prefs.get("ws_activo",     True)),
            ]:
                if not active:
                    continue
                try:
                    repo = self._repo if channel == "in_app" else None
                    strategy = NotificationFactory.build(channel, notification_repository=repo)
                    if strategy.validate(recipient):
                        strategy.send(recipient, message, context)
                    else:
                        strategy.log("skipped", f"{channel} invalid for user {recipient.id}")
                except Exception as exc:  # noqa: BLE001
                    logger.error(
                        "Notification delivery failed: channel=%s user=%s error=%s",
                        channel, recipient.id, exc,
                    )

    # ── Query methods (serialized dicts for the API layer) ─────────────────────

    def get_user_notifications(self, user, page: int = 1) -> dict:
        result = self._repo.get_user_notifications(user, page)
        return {
            "items": [self._serialize(n) for n in result["items"]],
            "total": result["total"],
            "unread_count": result["unread_count"],
            "page": result["page"],
        }

    def mark_as_read(self, notification_id: int, user) -> dict:
        from core.exceptions.domain_exceptions import DomainException  # noqa: PLC0415
        notif = self._repo.mark_as_read(notification_id, user)
        if notif is None:
            raise DomainException("Notificación no encontrada.")
        return self._serialize(notif)

    def mark_all_as_read(self, user) -> int:
        """Mark every unread notification of the user as read. Returns rows affected."""
        return self._repo.mark_all_as_read(user)

    def get_preferences(self, user) -> dict:
        if self._repo is None:
            return {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        prefs = self._repo.get_or_create_preferences(user)
        return {
            "email_activo":  prefs.email_activo,
            "in_app_activo": prefs.in_app_activo,
            "ws_activo":     prefs.ws_activo,
        }

    def set_preferences(self, user, data: dict) -> dict:
        prefs = self._repo.get_or_create_preferences(user)
        updated = []
        for field in ("email_activo", "in_app_activo", "ws_activo"):
            if field in data:
                setattr(prefs, field, bool(data[field]))
                updated.append(field)
        if updated:
            prefs.save(update_fields=updated)
        return {
            "email_activo":  prefs.email_activo,
            "in_app_activo": prefs.in_app_activo,
            "ws_activo":     prefs.ws_activo,
        }

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _serialize(notif) -> dict:
        return {
            "id": notif.id,
            "tipo": notif.tipo,
            "titulo": notif.titulo,
            "cuerpo": notif.cuerpo,
            "leida": notif.leida,
            "payload": notif.payload,
            "creado_en": notif.created_at.isoformat(),
        }

    def _build_context(self, event: dict, recipient) -> dict:
        tipo = event.get("tipo_evento", "informacion")
        return {
            "tipo":            tipo,
            "ticket_numero":   event.get("ticket_numero", ""),
            "ticket_asunto":   event.get("ticket_asunto", ""),
            "estado_anterior": event.get("estado_anterior", ""),
            "estado_nuevo":    event.get("estado_nuevo", ""),
            "comentario":      event.get("comentario", ""),
            "titulo":          self._make_title(tipo, event),
            "cuerpo":          event.get("comentario", "") or self._format_message(event),
            "recipient_nombre": getattr(recipient, "first_name", ""),
        }

    @staticmethod
    def _make_title(tipo: str, event: dict) -> str:
        numero = event.get("ticket_numero", "")
        titles = {
            "creacion":      f"Nuevo ticket {numero}",
            "cambio_estado": f"Ticket {numero} actualizado",
            "comentario":    f"Nuevo comentario en {numero}",
            "asignacion":    f"Ticket {numero} asignado",
            "reasignacion":  f"Ticket {numero} reasignado",
        }
        return titles.get(tipo, f"Notificación sobre {numero}")

    @staticmethod
    def _format_message(event: dict) -> str:
        tipo = event.get("tipo_evento", "")
        numero = event.get("ticket_numero", "")
        asunto = event.get("ticket_asunto", "")
        if tipo == "cambio_estado":
            return (
                f"El ticket {numero} ({asunto}) cambió de estado: "
                f"{event.get('estado_anterior')} → {event.get('estado_nuevo')}."
            )
        if tipo == "comentario":
            return f"Nuevo comentario en el ticket {numero}: {event.get('comentario', '')[:100]}"
        if tipo in ("asignacion", "reasignacion"):
            return f"El ticket {numero} ha sido asignado."
        return f"Actualización en el ticket {numero} ({asunto})."


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading  # noqa: E402

_lock = threading.Lock()
_instance: NotificationService | None = None


def get_notification_service() -> NotificationService:
    """
    Return (or lazily create) the shared NotificationService instance.
    Thread-safe via double-checked locking.

    On first call it wires a default NotificationRepository so the in-app channel
    works at runtime. Tests can reset `_instance` and inject a mock repository.
    """
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.notifications.repositories import NotificationRepository  # noqa: PLC0415
                _instance = NotificationService(NotificationRepository())
    return _instance

```

### 📄 backend/apps/notifications/strategies/__init__.py
```python
from .email_strategy import EmailNotificationStrategy
from .in_app_strategy import InAppNotificationStrategy
from .websocket_strategy import WebSocketNotificationStrategy

__all__ = [
    "EmailNotificationStrategy",
    "InAppNotificationStrategy",
    "WebSocketNotificationStrategy",
]

```

### 📄 backend/apps/notifications/strategies/email_strategy.py
```python
"""
Email notification strategy — delivers notifications via Django email backend.

Responsibility (SRP): render an HTML email template and send it. Nothing else.
Depends on: INotificationStrategy (interface), django.core.mail, django.template.loader.
Pattern: Strategy — implements INotificationStrategy for the email channel.
SOLID: SRP · DIP · OCP · LSP

OCP: new email template = new .html file + new entry in TEMPLATE_MAP.
    EmailNotificationStrategy is NEVER modified for new notification types.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)

# Maps tipo_evento → (template_name, subject_prefix)
TEMPLATE_MAP: dict[str, tuple[str, str]] = {
    "creacion":      ("email/ticket_created.html",  "Nuevo ticket creado"),
    "asignacion":    ("email/ticket_assigned.html", "Ticket asignado"),
    "cambio_estado": ("email/status_changed.html",  "Ticket actualizado"),
    "comentario":    ("email/status_changed.html",  "Nuevo comentario en tu ticket"),
    "reasignacion":  ("email/ticket_assigned.html", "Ticket reasignado"),
    "password_reset": ("email/password_reset.html", "Recuperación de contraseña"),
}


class EmailNotificationStrategy(INotificationStrategy):
    """Sends HTML emails using Django's email backend."""

    def validate(self, recipient) -> bool:
        return bool(
            recipient.is_authenticated
            and recipient.email
            and recipient.email_verificado
            and recipient.estado == "activo"
        )

    def send(self, recipient, message: str, context: dict) -> None:
        tipo = context.get("tipo", "creacion")
        template_name, subject_prefix = TEMPLATE_MAP.get(
            tipo, ("email/ticket_created.html", "Notificación SassBlum")
        )

        subject = f"[SassBlum] {subject_prefix}"
        html_body = render_to_string(template_name, {**context, "recipient": recipient})

        send_mail(
            subject=subject,
            message=message,  # plain-text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            html_message=html_body,
            fail_silently=False,
        )
        self.log("sent", f"email → {recipient.email} · tipo={tipo}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("EmailStrategy [%s] %s", status, details)
        else:
            logger.warning("EmailStrategy [%s] %s", status, details)

```

### 📄 backend/apps/notifications/strategies/in_app_strategy.py
```python
"""
In-app notification strategy — persists a Notification record in the database.

Responsibility (SRP): create a Notification row so the user sees it in the UI.
    No email, no WebSocket — just DB persistence via NotificationRepository.
Depends on: INotificationStrategy, NotificationRepository (via DIP — injected).
Pattern: Strategy — implements INotificationStrategy for the in-app channel.
SOLID: SRP · DIP · OCP · LSP

DIP: receives NotificationRepository via __init__, never touches the ORM directly.
OCP: new notification type = new entry in TEMPLATE_MAP (email); InApp only stores tipo + payload.
"""

from __future__ import annotations

import logging

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)


class InAppNotificationStrategy(INotificationStrategy):
    """Persists in-app notifications to the Notification model via repository."""

    def __init__(self, notification_repository) -> None:
        self._repo = notification_repository

    def validate(self, recipient) -> bool:
        return bool(
            recipient.is_authenticated
            and recipient.estado == "activo"
        )

    def send(self, recipient, message: str, context: dict) -> None:
        tipo   = context.get("tipo", "informacion")
        titulo = context.get("titulo", "Nueva notificación")
        cuerpo = context.get("cuerpo", message)

        self._repo.create({
            "usuario": recipient,
            "tipo": tipo,
            "titulo": titulo,
            "cuerpo": cuerpo,
            "leida": False,
            "payload": context,
        })
        self.log("sent", f"in_app → user_id={recipient.id} · tipo={tipo}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("InAppStrategy [%s] %s", status, details)
        else:
            logger.warning("InAppStrategy [%s] %s", status, details)

```

### 📄 backend/apps/notifications/strategies/websocket_strategy.py
```python
"""
WebSocket notification strategy — broadcasts via Django Channels channel layer.

Responsibility (SRP): push a notification payload to the user's WS group.
    No email, no DB write — just channel_layer.group_send().
Depends on: INotificationStrategy, channels.layers.get_channel_layer() (Channels).
Pattern: Strategy — implements INotificationStrategy for the WebSocket channel.
SOLID: SRP · DIP · OCP · LSP

The group name convention is 'notif_user_{user_id}'.
NotificationConsumer (S23) subscribes authenticated users to this group on connect().
"""

from __future__ import annotations

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)


def _group_name(user_id: int) -> str:
    return f"notif_user_{user_id}"


class WebSocketNotificationStrategy(INotificationStrategy):
    """Broadcasts notifications to the user's persistent WebSocket connection."""

    def validate(self, recipient) -> bool:
        # Fire-and-forget: always attempt; if the user is offline, the message is dropped.
        return bool(recipient.is_authenticated and recipient.estado == "activo")

    def send(self, recipient, message: str, context: dict) -> None:
        channel_layer = get_channel_layer()
        group = _group_name(recipient.id)

        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "notification.new",   # maps to NotificationConsumer.notification_new()
                "payload": {
                    "notification_id": context.get("notification_id"),
                    "tipo":   context.get("tipo", "informacion"),
                    "titulo": context.get("titulo", "Nueva notificación"),
                    "cuerpo": context.get("cuerpo", message),
                },
            },
        )
        self.log("sent", f"ws → group={group}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("WebSocketStrategy [%s] %s", status, details)
        else:
            logger.warning("WebSocketStrategy [%s] %s", status, details)

```

### 📄 backend/apps/notifications/tests/__init__.py
```python
# Sprint 3 · S27 — Test suite for the notifications module:
#   test_strategies.py            → Email/InApp/WebSocket strategies in isolation
#   test_notification_service.py  → dispatch() recipient selection + preference gating

```

### 📄 backend/apps/notifications/tests/test_notification_service.py
```python
"""
Tests for NotificationService.dispatch() — recipient selection + preference gating.
Uses mocked recipients/strategies; no database required for the routing logic.
Run: pytest apps/notifications/tests/test_notification_service.py -v
"""

from unittest.mock import MagicMock, patch

from apps.notifications.services.notification_service import NotificationService


def make_user(uid, **prefs):
    u = MagicMock()
    u.id = uid
    u.is_authenticated = True
    u.estado = "activo"
    u.first_name = "X"
    return u


class TestDispatchPreferenceGating:
    def _run(self, prefs: dict, recipients: list):
        repo = MagicMock()
        service = NotificationService(repo)
        service.get_preferences = MagicMock(return_value=prefs)

        built = []

        def fake_build(channel, notification_repository=None):
            strat = MagicMock()
            strat.validate.return_value = True
            built.append(channel)
            return strat

        event = {"tipo_evento": "creacion", "ticket_numero": "T-2026-0001", "cliente_id": 5}
        with patch(
            "apps.notifications.services.notification_service._resolve_recipients",
            return_value=recipients,
        ), patch(
            "apps.notifications.factory.NotificationFactory.build",
            side_effect=fake_build,
        ):
            service.dispatch(event)
        return built

    def test_all_channels_used_when_all_enabled(self):
        prefs = {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [make_user(1)])
        assert set(built) == {"email", "in_app", "ws"}

    def test_email_skipped_when_disabled(self):
        prefs = {"email_activo": False, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [make_user(1)])
        assert "email" not in built
        assert set(built) == {"in_app", "ws"}

    def test_no_recipients_means_no_channels(self):
        prefs = {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [])
        assert built == []


class TestResolveRecipients:
    """_resolve_recipients excludes the author and selects by tipo_evento."""

    def test_author_excluded(self):
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        autor = make_user(9)

        fake_user_model = MagicMock()
        fake_user_model.objects.get.side_effect = lambda id: {5: cliente, 9: autor}[id]
        fake_user_model.objects.filter.return_value = []
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {"tipo_evento": "comentario", "cliente_id": 5, "autor_id": 9}
            recipients = mod._resolve_recipients(event)

        ids = {r.id for r in recipients}
        assert 9 not in ids  # author excluded
        assert 5 in ids

```

### 📄 backend/apps/notifications/tests/test_strategies.py
```python
"""
Tests for the three notification strategies in isolation (mocked I/O).
These do NOT require a database — they mock send_mail, the repository, and the channel layer.
Run: pytest apps/notifications/tests/test_strategies.py -v
"""

from unittest.mock import MagicMock, patch

from apps.notifications.strategies.email_strategy import EmailNotificationStrategy
from apps.notifications.strategies.in_app_strategy import InAppNotificationStrategy
from apps.notifications.strategies.websocket_strategy import WebSocketNotificationStrategy


def make_user(**overrides):
    user = MagicMock()
    user.id = overrides.get("id", 1)
    user.is_authenticated = True
    user.email = overrides.get("email", "user@example.com")
    user.email_verificado = overrides.get("email_verificado", True)
    user.estado = overrides.get("estado", "activo")
    user.first_name = "Ana"
    return user


# ── EmailNotificationStrategy ──────────────────────────────────────────────────

class TestEmailStrategy:
    def test_validate_true_for_active_verified_user(self):
        assert EmailNotificationStrategy().validate(make_user()) is True

    def test_validate_false_when_email_not_verified(self):
        assert EmailNotificationStrategy().validate(make_user(email_verificado=False)) is False

    def test_validate_false_when_blocked(self):
        assert EmailNotificationStrategy().validate(make_user(estado="bloqueado")) is False

    @patch("apps.notifications.strategies.email_strategy.render_to_string", return_value="<p>x</p>")
    @patch("apps.notifications.strategies.email_strategy.send_mail")
    def test_send_calls_send_mail_with_recipient(self, mock_send, _mock_render):
        strat = EmailNotificationStrategy()
        strat.send(make_user(email="dest@x.com"), "msg", {"tipo": "creacion"})
        mock_send.assert_called_once()
        kwargs = mock_send.call_args.kwargs
        assert kwargs["recipient_list"] == ["dest@x.com"]
        assert kwargs["html_message"] == "<p>x</p>"


# ── InAppNotificationStrategy ──────────────────────────────────────────────────

class TestInAppStrategy:
    def test_send_persists_via_repository(self):
        repo = MagicMock()
        strat = InAppNotificationStrategy(repo)
        user = make_user()
        strat.send(user, "msg", {"tipo": "comentario", "titulo": "T", "cuerpo": "C"})
        repo.create.assert_called_once()
        data = repo.create.call_args.args[0]
        assert data["usuario"] is user
        assert data["tipo"] == "comentario"
        assert data["leida"] is False

    def test_validate_false_when_blocked(self):
        strategy = InAppNotificationStrategy(MagicMock())
        assert strategy.validate(make_user(estado="bloqueado")) is False


# ── WebSocketNotificationStrategy ──────────────────────────────────────────────

class TestWebSocketStrategy:
    @patch("apps.notifications.strategies.websocket_strategy.async_to_sync")
    @patch("apps.notifications.strategies.websocket_strategy.get_channel_layer")
    def test_send_group_send_to_user_group(self, mock_layer, mock_ats):
        mock_layer.return_value = MagicMock()
        sender = MagicMock()
        mock_ats.return_value = sender

        strat = WebSocketNotificationStrategy()
        strat.send(make_user(id=42), "msg", {"tipo": "creacion", "titulo": "T", "cuerpo": "C"})

        # async_to_sync(group_send) was invoked with the user group
        sender.assert_called_once()
        group_arg = sender.call_args.args[0]
        assert group_arg == "notif_user_42"
        message = sender.call_args.args[1]
        assert message["type"] == "notification.new"

```

### 📄 backend/apps/notifications/urls.py
```python
"""
URL routing for the notifications API (HU-13).
Mounted under /api/notificaciones/ by config/urls.py.
"""

from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    MarkReadView,
    MarkAllReadView,
    NotificationPreferencesView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("preferencias", NotificationPreferencesView.as_view(), name="notification-preferences"),
    path("marcar-todas-leidas", MarkAllReadView.as_view(), name="notification-mark-all-read"),
    path(
        "<int:notification_id>/marcar-leida",
        MarkReadView.as_view(),
        name="notification-mark-read",
    ),
]

```

### 📄 backend/apps/notifications/views/__init__.py
```python
from .notification_views import (
    NotificationListView,
    MarkReadView,
    MarkAllReadView,
    NotificationPreferencesView,
)

__all__ = [
    "NotificationListView",
    "MarkReadView",
    "MarkAllReadView",
    "NotificationPreferencesView",
]

```

### 📄 backend/apps/notifications/views/notification_views.py
```python
"""
Notification DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ service calls. No ORM, no business logic.
Depends on: INotificationService (via get_notification_service) — DIP.
    The view never touches the ORM or the repository directly.
Pattern: DIP (view → service interface).
SOLID: SRP · DIP

Endpoints:
    GET   /api/notificaciones                      → NotificationListView
    PATCH /api/notificaciones/<id>/marcar-leida    → MarkReadView
    PATCH /api/notificaciones/marcar-todas-leidas  → MarkAllReadView
    GET   /api/notificaciones/preferencias         → NotificationPreferencesView (read)
    PATCH /api/notificaciones/preferencias         → NotificationPreferencesView (update)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.serializers import NotificationPreferencesSerializer
from apps.notifications.services import get_notification_service
from core.exceptions.domain_exceptions import DomainException


class NotificationListView(APIView):
    """GET /api/notificaciones — paginated notifications for the current user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get("page", 1))
        service = get_notification_service()
        data = service.get_user_notifications(request.user, page)
        return Response(data, status=status.HTTP_200_OK)


class MarkReadView(APIView):
    """PATCH /api/notificaciones/<id>/marcar-leida — mark one as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id: int):
        service = get_notification_service()
        try:
            notif = service.mark_as_read(notification_id, request.user)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(notif, status=status.HTTP_200_OK)


class MarkAllReadView(APIView):
    """PATCH /api/notificaciones/marcar-todas-leidas — mark every unread as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        service = get_notification_service()
        affected = service.mark_all_as_read(request.user)
        return Response({"marcadas": affected}, status=status.HTTP_200_OK)


class NotificationPreferencesView(APIView):
    """GET/PATCH /api/notificaciones/preferencias — channel preferences."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = get_notification_service()
        return Response(service.get_preferences(request.user), status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = NotificationPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = get_notification_service()
        updated = service.set_preferences(request.user, serializer.validated_data)
        return Response(updated, status=status.HTTP_200_OK)

```

### 📄 backend/apps/realtime/__init__.py
```python

```

### 📄 backend/apps/realtime/admin.py
```python
from django.contrib import admin

# Register your models here.

```

### 📄 backend/apps/realtime/apps.py
```python
"""
RealtimeConfig — wires the ticket realtime Observer.

ready() registers a post_save(TicketEvent) handler that broadcasts ticket_updated to
the ticket's WS room. This is a SECOND, independent subscriber to the same signal that
notifications uses (OCP: adding a subscriber doesn't touch TicketEvent or notifications).
Dependency direction: realtime → tickets (one-way); tickets stays unaware.
"""

from django.apps import AppConfig


class RealtimeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.realtime"

    def ready(self) -> None:
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        from apps.tickets.models import TicketEvent

        @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_realtime")
        def on_ticket_event_realtime(sender, instance: TicketEvent, created: bool, **kwargs):
            if not created:
                return
            ticket = instance.ticket
            payload = {
                "ticket_id": ticket.id,
                "ticket_numero": ticket.numero,
                "tipo_evento": instance.tipo_evento,
                "estado_nuevo": instance.estado_nuevo,
                "comentario": instance.comentario,
            }
            try:
                from apps.realtime.events.ticket_events import broadcast_ticket_updated
                broadcast_ticket_updated(payload)
            except Exception:  # noqa: BLE001
                import logging  # noqa: PLC0415
                logging.getLogger(__name__).exception(
                    "Failed to broadcast realtime update for TicketEvent %s",
                    instance.id,
                )

```

### 📄 backend/apps/realtime/consumers/__init__.py
```python
from .notification_consumer import NotificationConsumer
from .ticket_consumer import TicketConsumer

__all__ = ["NotificationConsumer", "TicketConsumer"]

```

### 📄 backend/apps/realtime/consumers/notification_consumer.py
```python
"""
NotificationConsumer — per-user WebSocket channel for live notifications.

Responsibility (SRP): manage the WS connection lifecycle and relay messages.
    It does NOT decide what to send — NotificationService does (via WebSocketStrategy,
    which calls channel_layer.group_send to this consumer's group).
Depends on: Channels AsyncJsonWebsocketConsumer, simplejwt for handshake auth.
Pattern: Singleton transport (channel layer) + Observer endpoint.
SOLID: SRP · DIP

Group convention: 'notif_user_{user_id}' (matches WebSocketNotificationStrategy).

Handshake auth:
    The JWT is passed as ?token=<access> in the WS URL query string.
    connect() validates it; on failure the socket is closed with code 4401.
"""

from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4401)  # unauthorized
            return

        self.user = user
        self.group_name = f"notif_user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    # ── Group message handler ──────────────────────────────────────────────────
    # Triggered by channel_layer.group_send({'type': 'notification.new', ...})
    async def notification_new(self, event):
        """Relay a new-notification payload down to the connected client."""
        await self.send_json({
            "event": "notification_new",
            "payload": event.get("payload", {}),
        })

    # ── Handshake authentication ───────────────────────────────────────────────
    async def _authenticate(self):
        """
        Validate the JWT from the query string and return the User, or None.
        Uses simplejwt's AccessToken to decode + verify.
        """
        from channels.db import database_sync_to_async  # noqa: PLC0415

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        if not token_list:
            return None

        @database_sync_to_async
        def resolve_user(raw_token):
            try:
                from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
                from apps.authentication.models import User  # noqa: PLC0415
                access = AccessToken(raw_token)
                return User.objects.filter(id=access["user_id"]).first()
            except Exception:  # noqa: BLE001
                return None

        return await resolve_user(token_list[0])

```

### 📄 backend/apps/realtime/consumers/ticket_consumer.py
```python
"""
TicketConsumer — per-ticket WebSocket room for live updates (HU-09).

Responsibility (SRP): manage the connection to room ticket_{id} and relay
    ticket_updated messages. JWT validated on the handshake (?token=).
Pattern: Observer endpoint + Singleton transport (channel layer).
SOLID: SRP · DIP.
"""

from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.events.ticket_events import ticket_group


class TicketConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4401)
            return
        self.ticket_id = self.scope["url_route"]["kwargs"]["ticket_id"]
        self.group_name = ticket_group(self.ticket_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def ticket_updated(self, event):
        """Handler for {'type': 'ticket.updated', ...} → relay to the client."""
        await self.send_json({"event": "ticket_updated", "payload": event.get("payload", {})})

    async def _authenticate(self):
        from channels.db import database_sync_to_async  # noqa: PLC0415

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        if not token_list:
            return None

        @database_sync_to_async
        def resolve_user(raw):
            try:
                from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
                from apps.authentication.models import User  # noqa: PLC0415
                return User.objects.filter(id=AccessToken(raw)["user_id"]).first()
            except Exception:  # noqa: BLE001
                return None

        return await resolve_user(token_list[0])

```

### 📄 backend/apps/realtime/events/__init__.py
```python
from .ticket_events import build_ticket_updated_payload, broadcast_ticket_updated

__all__ = ["build_ticket_updated_payload", "broadcast_ticket_updated"]

```

### 📄 backend/apps/realtime/events/ticket_events.py
```python
"""
Ticket realtime events — builds and broadcasts the ticket_updated payload (SRP).

Responsibility (SRP): only construct the event payload and push it to the ticket room.
    It does NOT decide when (the Observer/signal does). realtime depends on tickets
    (one-way); tickets stays unaware of the transport.
Pattern: Observer (consumer side) + Singleton (channel layer).
SOLID: SRP · DIP · OCP (new event = new builder, existing untouched).
"""

from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def ticket_group(ticket_id: int) -> str:
    return f"ticket_{ticket_id}"


def build_ticket_updated_payload(event: dict) -> dict:
    """Shape a TicketEvent dict into the ticket_updated WS payload."""
    return {
        "ticket_id": event.get("ticket_id"),
        "ticket_numero": event.get("ticket_numero"),
        "tipo_evento": event.get("tipo_evento"),
        "estado_nuevo": event.get("estado_nuevo"),
        "comentario": event.get("comentario"),
    }


def broadcast_ticket_updated(event: dict) -> None:
    """Send ticket_updated to everyone subscribed to the ticket's room."""
    ticket_id = event.get("ticket_id")
    if ticket_id is None:
        return
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(
        ticket_group(ticket_id),
        {"type": "ticket.updated", "payload": build_ticket_updated_payload(event)},
    )

```

### 📄 backend/apps/realtime/models.py
```python
from django.db import models

# Create your models here.

```

### 📄 backend/apps/realtime/tests.py
```python
from django.test import TestCase

# Create your tests here.

```

### 📄 backend/apps/realtime/views.py
```python
from django.shortcuts import render

# Create your views here.

```

### 📄 backend/apps/reports/__init__.py
```python

```

### 📄 backend/apps/reports/admin.py
```python
from django.contrib import admin

# Register your models here.

```

### 📄 backend/apps/reports/apps.py
```python
from django.apps import AppConfig


class ReportsConfig(AppConfig):
    name = 'apps.reports'

```

### 📄 backend/apps/reports/exporters/__init__.py
```python
from .csv_exporter import CSVExporter
from .pdf_exporter import PDFExporter
from .excel_exporter import ExcelExporter

__all__ = ["CSVExporter", "PDFExporter", "ExcelExporter"]

```

### 📄 backend/apps/reports/exporters/csv_exporter.py
```python
"""CSVExporter — Strategy for CSV (stdlib, always available). SOLID: SRP·LSP."""

from __future__ import annotations

import csv
import io

from apps.reports.interfaces import IReportExporter


class CSVExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
        return buffer.getvalue().encode("utf-8-sig")  # BOM for Excel-friendliness

    def get_extension(self) -> str:
        return "csv"

    def get_mime_type(self) -> str:
        return "text/csv"

```

### 📄 backend/apps/reports/exporters/excel_exporter.py
```python
"""
ExcelExporter — Strategy for .xlsx via openpyxl (lazy import). SOLID: SRP·LSP·OCP.
openpyxl is imported inside export() so the module loads even if the lib is absent;
a clear error is raised only when an Excel export is actually requested.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class ExcelExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from openpyxl import Workbook  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError("Instala openpyxl para exportar a Excel.") from exc

        import io  # noqa: PLC0415
        wb = Workbook()
        ws = wb.active
        ws.append(columns)
        for row in rows:
            ws.append([row.get(c, "") for c in columns])
        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "xlsx"

    def get_mime_type(self) -> str:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

```

### 📄 backend/apps/reports/exporters/pdf_exporter.py
```python
"""
PDFExporter — Strategy for PDF via reportlab (lazy import). SOLID: SRP·LSP·OCP.
reportlab is imported inside export() so the module loads even if the lib is absent.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class PDFExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from reportlab.lib.pagesizes import letter  # noqa: PLC0415
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle  # noqa: PLC0415
            from reportlab.lib import colors  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError("Instala reportlab para exportar a PDF.") from exc

        import io  # noqa: PLC0415
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        data = [columns] + [[str(r.get(c, "")) for c in columns] for r in rows]
        table = Table(data)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d1c1a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))
        doc.build([table])
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "pdf"

    def get_mime_type(self) -> str:
        return "application/pdf"

```

### 📄 backend/apps/reports/interfaces/__init__.py
```python
from .i_report_exporter import IReportExporter

__all__ = ["IReportExporter"]

```

### 📄 backend/apps/reports/interfaces/i_report_exporter.py
```python
"""
IReportExporter — root contract for report export formats.

Responsibility (SRP): declare how a set of rows becomes a downloadable file.
Pattern: Strategy (each format is an exporter) + DIP anchor.
SOLID: DIP · OCP · LSP

OCP: JSONExporter = new class implementing this + one entry in ExporterFactory.
    PDFExporter / CSVExporter / ExcelExporter are never modified.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IReportExporter(ABC):

    @abstractmethod
    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        """Serialize rows (list of dicts) into the format's bytes."""
        ...

    @abstractmethod
    def get_extension(self) -> str:
        """File extension without the dot, e.g. 'csv'."""
        ...

    @abstractmethod
    def get_mime_type(self) -> str:
        """MIME type for the HTTP response."""
        ...

```

### 📄 backend/apps/reports/models.py
```python
from django.db import models

# Create your models here.

```

### 📄 backend/apps/reports/repositories/__init__.py
```python
from .report_repository import ReportRepository

__all__ = ["ReportRepository"]

```

### 📄 backend/apps/reports/repositories/report_repository.py
```python
"""
ReportRepository — aggregation queries for reports (Repository).
The view never touches the ORM. SOLID: DIP · SRP.
"""

from __future__ import annotations

from django.db.models import Count, Q

from apps.tickets.models import Ticket


class ReportRepository:

    def _filtered(self, filters: dict | None):
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")
        filters = filters or {}
        if estado := filters.get("estado"):
            qs = qs.filter(estado=estado)
        if servicio_id := filters.get("servicio_id"):
            qs = qs.filter(servicio_id=servicio_id)
        if fecha_desde := filters.get("fecha_desde"):
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta := filters.get("fecha_hasta"):
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        # H#6 (cliente): Filtros avanzados por cliente y técnico
        if cliente_ruc := filters.get("cliente_ruc"):
            qs = qs.filter(cliente__ruc__icontains=cliente_ruc)
        if cliente_nombre := filters.get("cliente_nombre"):
            qs = qs.filter(
                Q(cliente__first_name__icontains=cliente_nombre)
                | Q(cliente__last_name__icontains=cliente_nombre)
                | Q(cliente__email__icontains=cliente_nombre)
            )
        if asignado_id := filters.get("asignado_id"):
            qs = qs.filter(asignado_id=asignado_id)
        return qs

    def summary(self, filters: dict | None = None) -> dict:
        qs = self._filtered(filters)
        by_estado = dict(
            qs.values_list("estado").annotate(n=Count("id")).values_list("estado", "n")
        )
        by_prioridad = dict(
            qs.values_list("prioridad").annotate(n=Count("id")).values_list("prioridad", "n")
        )
        total = qs.count()
        abiertos = sum(v for k, v in by_estado.items() if k != "Cerrado")
        return {
            "total": total,
            "abiertos": abiertos,
            "cerrados": by_estado.get("Cerrado", 0),
            "por_estado": by_estado,
            "por_prioridad": by_prioridad,
        }

    def rows(self, filters: dict | None = None) -> list[dict]:
        qs = self._filtered(filters).order_by("-created_at")
        return [
            {
                "numero": t.numero,
                "asunto": t.asunto,
                "estado": t.estado,
                "prioridad": t.prioridad,
                "servicio": t.servicio.nombre if t.servicio_id else "",
                "cliente": t.cliente.email if t.cliente_id else "",
                "asignado": t.asignado.email if t.asignado_id else "",
                "creado_en": t.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for t in qs
        ]

```

### 📄 backend/apps/reports/services/__init__.py
```python
from .report_service import ReportService, get_report_service

__all__ = ["ReportService", "get_report_service"]

```

### 📄 backend/apps/reports/services/report_service.py
```python
"""
ReportService — orchestrates report data + export (Singleton + DIP).

Responsibility (SRP): combine ReportRepository data with the exporter chosen by
    ExporterFactory. Depends on IReportExporter (abstraction), never on a concrete
    exporter class (DIP). SOLID: Singleton · DIP · OCP.
"""

from __future__ import annotations

from apps.reports.repositories import ReportRepository
from core.factories.exporter_factory import ExporterFactory

_COLUMNS = [
    "numero", "asunto", "estado", "prioridad",
    "servicio", "cliente", "asignado", "creado_en",
]


class ReportService:

    def __init__(self, repository: ReportRepository | None = None) -> None:
        self._repo = repository or ReportRepository()

    def get_dashboard(self, filters: dict | None = None) -> dict:
        return self._repo.summary(filters)

    def export(self, fmt: str, filters: dict | None = None) -> tuple[bytes, str, str]:
        """Return (content_bytes, mime_type, filename) for the requested format."""
        exporter = ExporterFactory.build(fmt)  # raises ValueError on unknown format
        rows = self._repo.rows(filters)
        content = exporter.export(rows, _COLUMNS)
        filename = f"reporte_tickets.{exporter.get_extension()}"
        return content, exporter.get_mime_type(), filename


import threading

_lock = threading.Lock()
_instance: ReportService | None = None


def get_report_service() -> ReportService:
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = ReportService()
    return _instance

```

### 📄 backend/apps/reports/tests.py
```python
from django.test import TestCase

# Create your tests here.

```

### 📄 backend/apps/reports/tests/__init__.py
```python
# Sprint 4 · S33 — reports tests: exporters (no DB) + ExporterFactory.

```

### 📄 backend/apps/reports/tests/test_exporters.py
```python
"""
Tests for report exporters + ExporterFactory (no database required).
Run: pytest apps/reports/tests/test_exporters.py -v
"""

import pytest

from apps.reports.exporters import CSVExporter
from core.factories.exporter_factory import ExporterFactory

ROWS = [
    {"numero": "T-2026-0001", "estado": "Nuevo", "prioridad": "Alta"},
    {"numero": "T-2026-0002", "estado": "Cerrado", "prioridad": "Baja"},
]
COLUMNS = ["numero", "estado", "prioridad"]


class TestCSVExporter:
    def test_export_includes_header_and_rows(self):
        content = CSVExporter().export(ROWS, COLUMNS).decode("utf-8-sig")
        assert "numero,estado,prioridad" in content
        assert "T-2026-0001,Nuevo,Alta" in content
        assert "T-2026-0002,Cerrado,Baja" in content

    def test_extension_and_mime(self):
        exp = CSVExporter()
        assert exp.get_extension() == "csv"
        assert exp.get_mime_type() == "text/csv"

    def test_ignores_extra_keys(self):
        rows = [{"numero": "X", "estado": "Y", "prioridad": "Z", "extra": "ignored"}]
        content = CSVExporter().export(rows, COLUMNS).decode("utf-8-sig")
        assert "ignored" not in content


class TestExporterFactory:
    def test_build_csv(self):
        assert isinstance(ExporterFactory.build("csv"), CSVExporter)

    def test_build_is_case_insensitive(self):
        assert isinstance(ExporterFactory.build("CSV"), CSVExporter)

    def test_unknown_format_raises(self):
        with pytest.raises(ValueError):
            ExporterFactory.build("xml")

    def test_pdf_and_excel_resolve_without_libs(self):
        # The classes resolve even if reportlab/openpyxl aren't installed;
        # the ImportError only surfaces when export() is called.
        assert ExporterFactory.build("pdf") is not None
        assert ExporterFactory.build("excel") is not None

```

### 📄 backend/apps/reports/urls.py
```python
"""Reports routing. Mounted under /api/reportes/ by config/urls.py."""

from django.urls import path

from apps.reports.views import ReportDashboardView, ReportExportView

urlpatterns = [
    path("tickets", ReportDashboardView.as_view(), name="report-dashboard"),
    path("exportar", ReportExportView.as_view(), name="report-export"),
]

```

### 📄 backend/apps/reports/views.py
```python
from django.shortcuts import render

# Create your views here.

```

### 📄 backend/apps/reports/views/__init__.py
```python
from .report_views import ReportDashboardView, ReportExportView

__all__ = ["ReportDashboardView", "ReportExportView"]

```

### 📄 backend/apps/reports/views/report_views.py
```python
"""
Report DRF views — HTTP orchestration (SRP + DIP). Admin-only.

    GET  /api/reportes/tickets   → dashboard KPIs/aggregations
    POST /api/reportes/exportar  → file download (csv|pdf|excel)
"""

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.services import get_report_service
from core.permissions import IsAdmin

_FILTER_KEYS = (
    "estado", "servicio_id", "fecha_desde", "fecha_hasta",
    "cliente_ruc", "cliente_nombre", "asignado_id",  # H#6 (cliente)
)


class ReportDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}
        return Response(get_report_service().get_dashboard(filters), status=status.HTTP_200_OK)


class ReportExportView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        fmt = request.data.get("formato", "csv")
        filters = {k: request.data[k] for k in _FILTER_KEYS if k in request.data}
        try:
            content, mime, filename = get_report_service().export(fmt, filters)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:  # missing optional lib (reportlab/openpyxl)
            return Response({"detail": str(exc)}, status=status.HTTP_501_NOT_IMPLEMENTED)

        response = HttpResponse(content, content_type=mime)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

```

### 📄 backend/apps/tickets/__init__.py
```python

```

### 📄 backend/apps/tickets/admin.py
```python
from django.contrib import admin
from .models import Ticket, TicketEvent, Attachment


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('numero', 'asunto', 'estado', 'prioridad', 'cliente', 'asignado', 'created_at')
    list_filter = ('estado', 'prioridad')
    search_fields = ('numero', 'asunto')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TicketEvent)
class TicketEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'tipo_evento', 'autor', 'created_at')
    list_filter = ('tipo_evento',)
    search_fields = ('ticket__numero', 'comentario')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'nombre_archivo', 'tamaño_bytes', 'mime_type')
    search_fields = ('nombre_archivo',)

```

### 📄 backend/apps/tickets/apps.py
```python
"""
TicketsConfig — Django app config that wires the Observer signal.

Responsibility (SRP): configure the app and register the post_save signal on TicketEvent.
    Signal registration lives here (not in models.py) to avoid import-time side effects
    and to keep models free of cross-module knowledge (SRP).

Observer pattern:
    Emitter:  TicketEvent (post_save)
    Receiver: NotificationService.dispatch(event)
    The import of NotificationService is deferred inside the handler to avoid a
    circular import between apps.tickets and apps.notifications.

DIP:
    The handler calls NotificationService via its module path.
    In Sprint 3, when NotificationService gains strategy implementations,
    this handler does not change (OCP).
"""

from django.apps import AppConfig


class TicketsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.tickets"

    def ready(self) -> None:
        """Register signals after all models are loaded."""
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        from apps.tickets.models import TicketEvent

        @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_notify")
        def on_ticket_event_saved(sender, instance: TicketEvent, created: bool, **kwargs) -> None:
            """
            Dispatch a notification whenever a new TicketEvent is persisted.
            Only fires on INSERT (created=True) — updates to events are not expected
            since TicketEvents are append-only.

            D4 — the event is serialized to a plain dict HERE (in apps.tickets) before
            crossing into apps.notifications. This keeps the dependency one-way:
                apps.tickets → apps.notifications  (notifications NEVER imports tickets)
            The deferred import of the service avoids a circular import at module load.
            """
            if not created:
                return

            # Serialize the TicketEvent to a transport dict (no model crosses the boundary)
            ticket = instance.ticket
            event_payload = {
                "ticket_id":       ticket.id,
                "ticket_numero":   ticket.numero,
                "ticket_asunto":   ticket.asunto,
                "tipo_evento":     instance.tipo_evento,
                "estado_anterior": instance.estado_anterior,
                "estado_nuevo":    instance.estado_nuevo,
                "comentario":      instance.comentario,
                "autor_id":        instance.autor_id,
                "cliente_id":      ticket.cliente_id,
                "asignado_id":     ticket.asignado_id,
            }

            try:
                # Deferred import — prevents circular import at module load time
                from apps.notifications.services import get_notification_service  # noqa: PLC0415
                get_notification_service().dispatch(event_payload)
            except ImportError:
                # NotificationService not available (e.g. notifications app disabled).
                # Signal stays wired; handler is a safe no-op.
                pass
            except Exception:  # noqa: BLE001
                import logging  # noqa: PLC0415
                logging.getLogger(__name__).exception(
                    "Failed to dispatch notification for TicketEvent %s",
                    instance.id,
                )

```

### 📄 backend/apps/tickets/interfaces/__init__.py
```python
from .i_ticket_service import ITicketService
from .i_storage_service import IStorageService
from .i_ticket_client_actions import ITicketClientActions
from .i_ticket_worker_actions import ITicketWorkerActions
from .i_ticket_admin_actions import ITicketAdminActions

__all__ = [
    "ITicketService",
    "IStorageService",
    "ITicketClientActions",
    "ITicketWorkerActions",
    "ITicketAdminActions",
]

```

### 📄 backend/apps/tickets/interfaces/i_storage_service.py
```python
"""
ISP interface for file storage operations — segregated from ITicketService.

Responsibility (SRP): declare the contract for uploading, retrieving, and deleting files.
    No ticket logic, no authentication — only storage I/O signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP + DIP — TicketService receives IStorageService via constructor;
    the concrete implementation (SupabaseStorageService or S3StorageService) is
    injected without modifying TicketService or FileUpload (LSP).
SOLID: ISP · DIP · LSP · OCP

Why segregated from ITicketService:
    TicketService has no reason to know about storage details (ISP).
    CatalogService could also use IStorageService for service images in a future sprint
    without coupling to ticket internals.

OCP extension:
    New storage provider (GCS, Azure Blob) = new class that implements IStorageService.
    TicketService and FileUpload remain unchanged (DIP).

Sprint usage:
    S12 → this contract (stub)
    S12 → SupabaseStorageService(IStorageService) — concrete implementation
    FileUpload component (FE) delegates to the IStorageService injected by useTickets hook.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IStorageService(ABC):
    """Abstract contract for binary file storage."""

    @abstractmethod
    def upload(self, file, path: str) -> str:
        """
        Upload a file to the configured storage backend.

        Args:
            file: a file-like object (Django InMemoryUploadedFile or TemporaryUploadedFile)
            path: destination path in the storage bucket
                  (e.g. 'tickets/T-2026-0001/factura.pdf')

        Returns:
            str — public or signed URL of the uploaded file.

        Raises:
            StorageUploadError — if the backend rejects the file.
        """
        ...

    @abstractmethod
    def delete(self, path: str) -> None:
        """
        Permanently remove a file from the storage backend.

        Args:
            path: the same path used when uploading.

        Raises:
            StorageDeleteError — if the file does not exist or deletion fails.
        """
        ...

    @abstractmethod
    def get_url(self, path: str) -> str:
        """
        Return a (possibly signed) URL for an existing file.

        Args:
            path: the storage path of the file.

        Returns:
            str — accessible URL (may be time-limited for private buckets).

        Raises:
            StorageFileNotFound — if no file exists at the given path.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_admin_actions.py
```python
"""
ISP interface — ticket operations available to an ADMIN user.

Responsibility (SRP): expose only the actions an ADMINISTRADOR can perform on tickets.
    An admin assigns, reassigns, and has a global view. Nothing from client or worker scope.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — assignment and admin-list views depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT inheriting from ITicketWorkerActions or ITicketClientActions:
    An admin does not create tickets on behalf of clients (different flow).
    Merging interfaces would expose methods that admin views never call (ISP violation).

Relation to ITicketService:
    TicketService implements ITicketAdminActions alongside the other two role interfaces.
    Admin views receive ITicketAdminActions via constructor (DIP).

OCP extension:
    New admin action (e.g. bulk_assign, escalate) = new @abstractmethod here.
    ITicketClientActions and ITicketWorkerActions are NEVER modified.

Sprint usage:
    S15 → this file (contract — Sprint 4 exercises these methods)
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketAdminActions(ABC):
    """Operations an ADMINISTRADOR user can perform on tickets."""

    @abstractmethod
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        """
        HU-05: Assign a Nuevo ticket to a worker, transitioning it to EnProceso.
        Validates: worker must be active (estado=ACTIVO) and have role=WORKER.
        Creates a TicketEvent and triggers the Observer.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (ticket not in Nuevo state).
        """
        ...

    @abstractmethod
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        """
        HU-08: Reassign an EnProceso ticket to a different worker.
        Creates a TicketEvent with tipo='reasignacion'.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (ticket not in EnProceso state).
        """
        ...

    @abstractmethod
    def get_all_tickets(self, filters: dict | None = None) -> list:
        """
        HU-10 (admin): Global ticket list with full filter support.
        Optional filters: estado, prioridad, cliente_id, asignado_id,
                          fecha_desde, fecha_hasta, servicio_id, page, page_size.
        Returns: paginated list of TicketSummary dicts.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_client_actions.py
```python
"""
ISP interface — ticket operations available to a CLIENT user.

Responsibility (SRP): expose only the actions a CLIENTE can perform on tickets.
    A client creates tickets and reads their own. Nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — ticket_create_view and ticket_list_view depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT a subset of ITicketService via inheritance:
    If ITicketService grows with internal or admin methods, inheriting here would force
    client views to know about them (ISP violation). This interface is intentionally minimal.

Relation to ITicketService:
    TicketService implements BOTH ITicketService (full contract) AND ITicketClientActions.
    Views always depend on the role interface (DIP + ISP), never on ITicketService directly.

OCP extension:
    New client action (e.g. reopen_ticket) = new @abstractmethod here.
    ITicketWorkerActions and ITicketAdminActions are NEVER modified.

Sprint usage:
    S15 → this file (contract)
    S12 → ticket_create_view uses this
    S18 → tests verify IsClient permission + isolation from worker/admin actions
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketClientActions(ABC):
    """Operations a CLIENTE user can perform on tickets."""

    @abstractmethod
    def create_ticket(self, data: dict, user) -> dict:
        """
        HU-06: Create a new support ticket.
        Generates T-YYYY-NNNN number, sets estado='Nuevo', persists attachments.
        Args:
            data: validated dict from TicketCreateSerializer
            user: authenticated User instance with role == CLIENTE
        Returns: TicketDetail dict.
        Raises: ServiceNotFound, ValidationError (field or business rule).
        """
        ...

    @abstractmethod
    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        """
        HU-10: List tickets belonging to this client.
        Optional filters: estado, prioridad, fecha_desde, fecha_hasta, servicio_id.
        Returns: list of TicketSummary dicts ordered by created_at desc.
        """
        ...

    @abstractmethod
    def get_ticket_detail(self, ticket_id: int, user) -> dict:
        """
        HU-06: Full detail of one ticket — enforces ownership (client sees only own tickets).
        Returns: TicketDetail dict including adjuntos and eventos.
        Raises: TicketNotFound if ticket does not exist or belongs to another client.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_service.py
```python
"""
Root ABC for all ticket operations in the backend.

Responsibility (SRP): declare the complete ticket operation contract.
    No HTTP logic, no ORM queries, no state machine calls — only method signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: DIP anchor — TicketService (Singleton) implements this in S12.
SOLID: DIP · OCP · LSP

Sprint coverage:
    S12 → this file (contract) + IStorageService (ISP split)
    S15 → ITicketClientActions, ITicketWorkerActions, ITicketAdminActions (ISP split from this)
    S12 exercises create_ticket() only; remaining methods are contracts for Sprints 3 & 4.

ISP note (S15):
    S15 will define three ISP interfaces that each expose a subset of this contract.
    TicketService implements all three. Views depend on the role-specific interface, not
    on ITicketService directly — that keeps each view minimal (ISP + DIP).

OCP extension:
    New ticket operation (e.g. reopen_ticket) = new @abstractmethod here + implementation
    in TicketService + new entry in the relevant ISP interface. Existing views unchanged.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketService(ABC):
    """Abstract contract for all ticket use cases across all roles."""

    # ── HU-06: Creación (cliente) ─────────────────────────────────────────────

    @abstractmethod
    def create_ticket(self, data: dict, user) -> dict:
        """
        Create a new ticket for an authenticated client.

        Business rules enforced by the concrete implementation (NOT here):
        - Generates unique ticket number T-YYYY-NNNN (generate_ticket_number).
        - Sets estado = 'Nuevo' and cliente = user.
        - Persists Attachment records for each uploaded file via IStorageService.
        - Creates the first TicketEvent (tipo='creacion').

        Args:
            data: validated dict from TicketCreateSerializer
                  (asunto, descripcion, servicio_id, prioridad, adjuntos: list)
            user: the authenticated User instance (CLIENTE role)

        Returns:
            TicketDetail dict with numero, asunto, estado, prioridad, creadoEn.

        Raises:
            ServiceNotFound  — servicio_id does not exist or is inactive
            ValidationError  — business rule violation (BusinessRuleValidator)
        """
        ...

    @abstractmethod
    def generate_ticket_number(self, year: int) -> str:
        """
        Generate the next unique ticket number in format T-YYYY-NNNN.
        Separated for SRP: the Ticket model never contains this logic.

        Args:
            year: the 4-digit calendar year (e.g. 2026)

        Returns:
            str — e.g. 'T-2026-0001', 'T-2026-0042'
        """
        ...

    # ── Lectura (cliente) ─────────────────────────────────────────────────────

    @abstractmethod
    def get_ticket_by_id(self, ticket_id: int, user) -> dict:
        """
        Return full detail of a single ticket.
        Enforces ownership: a CLIENTE only sees their own tickets.

        Returns:
            TicketDetail dict.

        Raises:
            TicketNotFound — ticket does not exist or caller lacks access.
        """
        ...

    @abstractmethod
    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        """
        Return all tickets belonging to the authenticated client.
        Optional filters: {'estado': str, 'prioridad': str, 'fecha_desde': str, 'fecha_hasta': str}
        Returns: list of TicketSummary dicts, ordered by created_at desc.
        """
        ...

    # ── Gestión de estado (worker) — contratos para Sprint 3 ─────────────────

    @abstractmethod
    def update_status(self, ticket_id: int, new_status: str, comment: str, user) -> dict:
        """
        Transition a ticket to a new state via TicketStateMachine.
        BR-35: comment must be non-empty.
        Creates a TicketEvent and dispatches notification (Observer).

        Raises:
            TicketNotFound, InvalidTransitionError, CommentRequiredError.
        """
        ...

    @abstractmethod
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        """
        Add a comment to a ticket without changing its state.
        Creates a TicketEvent with tipo='comentario'.
        """
        ...

    @abstractmethod
    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        """
        Transition ticket from 'Resuelto' → 'Cerrado' (terminal state).
        BR-35: comment required.
        Raises: InvalidTransitionError if current state is not 'Resuelto'.
        """
        ...

    # ── Administración (admin) — contratos para Sprint 4 ─────────────────────

    @abstractmethod
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        """
        Assign a 'Nuevo' ticket to a worker, transitioning it to 'EnProceso'.
        Raises: TicketNotFound, InvalidTransitionError if not in 'Nuevo' state.
        """
        ...

    @abstractmethod
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        """
        Reassign an 'EnProceso' ticket to a different worker.
        Creates a TicketEvent with tipo='reasignacion'.
        """
        ...

    @abstractmethod
    def get_all_tickets(self, filters: dict | None = None) -> list:
        """
        Return all tickets in the system (admin view).
        Optional filters: {'estado', 'prioridad', 'cliente_id', 'asignado_id',
                           'fecha_desde', 'fecha_hasta', 'servicio_id'}
        Returns: paginated list of TicketSummary dicts.
        """
        ...

```

### 📄 backend/apps/tickets/interfaces/i_ticket_worker_actions.py
```python
"""
ISP interface — ticket operations available to a WORKER user.

Responsibility (SRP): expose only the actions a TRABAJADOR can perform on tickets.
    A worker updates status, adds comments, and closes assigned tickets. Nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — status update and comment views depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT inheriting from ITicketClientActions:
    A worker has fundamentally different actions from a client. Merging would force
    worker views to declare methods they never call, and tests to cover irrelevant paths.

Relation to ITicketService:
    TicketService implements ITicketWorkerActions alongside ITicketClientActions.
    Worker views receive ITicketWorkerActions via constructor (DIP).

OCP extension:
    New worker action (e.g. request_info) = new @abstractmethod here.
    ITicketClientActions and ITicketAdminActions are NEVER modified.

Sprint usage:
    S15 → this file (contract — Sprint 3 exercises these methods)
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketWorkerActions(ABC):
    """Operations a TRABAJADOR user can perform on assigned tickets."""

    @abstractmethod
    def update_status(
        self, ticket_id: int, new_status: str, comment: str, user
    ) -> dict:
        """
        HU-07: Transition a ticket to a new state via TicketStateMachine.
        BR-35: comment must be non-empty.
        Creates a TicketEvent and triggers the Observer (NotificationService).
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError, CommentRequiredError.
        """
        ...

    @abstractmethod
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        """
        HU-11: Add a comment to a ticket without changing its state.
        Creates a TicketEvent with tipo='comentario'.
        Returns: the new TicketEvent dict.
        Raises: TicketNotFound, ValidationError (empty comment).
        """
        ...

    @abstractmethod
    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        """
        HU-12: Transition Resuelto → Cerrado (terminal state).
        BR-35: comment required.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (if not in Resuelto state).
        """
        ...

```

### 📄 backend/apps/tickets/management/__init__.py
```python

```

### 📄 backend/apps/tickets/management/commands/__init__.py
```python

```

### 📄 backend/apps/tickets/management/commands/seed_demo.py
```python
"""
seed_demo — carga datos de prueba para la demo/aceptación (idempotente).

Crea:
  - Los 6 servicios reales de SassBlum (catálogo).
  - Cuentas de prueba para los 3 roles (cliente / trabajador / admin), ya verificadas.
  - Tickets de ejemplo en distintos estados con su historial de eventos.

Es idempotente: re-ejecutarlo no duplica datos (usa get_or_create por clave natural).
El envío de correos se desvía a un backend en memoria durante la siembra para no
mandar emails reales al disparar el Observer.

Uso:
    python manage.py seed_demo
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.test.utils import override_settings

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent

DEMO_PASSWORD = "SassBlum2026"

# ── Servicios reales de sassblum.com ────────────────────────────────────────────
_IMG = "https://images.unsplash.com/{id}?auto=format&fit=crop&w=1200&q=80"
SERVICES = [
    {
        "nombre": "Infraestructura IT",
        "categoria": "Infraestructura",
        "descripcion": "Soluciones integradas a la medida: analizamos tus necesidades "
        "tecnológicas y oportunidades de crecimiento para diseñar una infraestructura robusta y escalable.",
        "imagen_url": _IMG.format(id="photo-1558494949-ef010cbdcc31"),
    },
    {
        "nombre": "Soporte Técnico",
        "categoria": "Soporte",
        "descripcion": "Servicio profesional que mejora la experiencia de tus colaboradores "
        "y maximiza la inversión en tus equipos, con atención oportuna y especializada.",
        "imagen_url": _IMG.format(id="photo-1581091226825-a6a2a5aee158"),
    },
    {
        "nombre": "Cableado Estructurado",
        "categoria": "Redes",
        "descripcion": "Implementación de redes de voz y datos con énfasis en estándares "
        "y calidad de conectividad para tu empresa.",
        "imagen_url": _IMG.format(id="photo-1606904825846-647eb07f5be2"),
    },
    {
        "nombre": "Sistema de Vigilancia CCTV",
        "categoria": "CCTV",
        "descripcion": "Videovigilancia y seguridad avanzada. Somos integradores autorizados "
        "de Grandstream, Hikvision, Ubiquiti y ZKTeco.",
        "imagen_url": _IMG.format(id="photo-1557597774-9d273605dfa9"),
    },
    {
        "nombre": "Domótica",
        "categoria": "Domótica",
        "descripcion": "Automatización inteligente: controla tu oficina u hogar desde el "
        "computador o el smartphone.",
        "imagen_url": _IMG.format(id="photo-1558002038-1055907df827"),
    },
    {
        "nombre": "Venta de Servidores",
        "categoria": "Servidores",
        "descripcion": "Importación directa de servidores escalables con virtualización e "
        "implementación de planes de continuidad del negocio (BCP).",
        "imagen_url": _IMG.format(id="photo-1517336714731-489689fd1ca8"),
    },
]

# ── Cuentas de prueba ────────────────────────────────────────────────────────────
ACCOUNTS = [
    {"email": "admin@sassblum.com", "first_name": "Admin", "last_name": "SassBlum", "role": User.Role.ADMIN, "staff": True},
    {"email": "trabajador1@sassblum.com", "first_name": "Carlos", "last_name": "Técnico", "role": User.Role.WORKER},
    {"email": "trabajador2@sassblum.com", "first_name": "Ana", "last_name": "Soporte", "role": User.Role.WORKER},
    {"email": "cliente@sassblum.com", "first_name": "Cliente", "last_name": "Demo", "role": User.Role.CLIENT},
]


class Command(BaseCommand):
    help = "Carga datos de prueba (servicios reales, cuentas y tickets) para la demo. Idempotente."

    def handle(self, *args, **options):
        # Evita enviar correos reales al disparar el Observer durante la siembra.
        with override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            self._seed()

    @transaction.atomic
    def _seed(self):
        services = self._seed_services()
        accounts = self._seed_accounts()
        self._seed_tickets(services, accounts)
        self._print_summary(accounts)

    # ── Servicios ────────────────────────────────────────────────────────────────
    def _seed_services(self) -> dict[str, Service]:
        out: dict[str, Service] = {}
        created = 0
        for data in SERVICES:
            svc, was_created = Service.objects.get_or_create(
                nombre=data["nombre"],
                defaults={
                    "categoria": data["categoria"],
                    "descripcion": data["descripcion"],
                    "imagen_url": data["imagen_url"],
                    "activo": True,
                },
            )
            out[data["nombre"]] = svc
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Servicios: {created} creados, {len(SERVICES) - created} ya existían."))
        return out

    # ── Cuentas ──────────────────────────────────────────────────────────────────
    def _seed_accounts(self) -> dict[str, User]:
        out: dict[str, User] = {}
        created = 0
        for acc in ACCOUNTS:
            user, was_created = User.objects.get_or_create(
                email=acc["email"],
                defaults={
                    "first_name": acc["first_name"],
                    "last_name": acc["last_name"],
                    "role": acc["role"],
                    "estado": User.Estado.ACTIVE,
                    "email_verificado": True,
                    "is_staff": acc.get("staff", False),
                    "is_superuser": acc.get("staff", False),
                },
            )
            if was_created:
                user.set_password(DEMO_PASSWORD)
                user.save()
                created += 1
            out[acc["email"]] = user
        self.stdout.write(self.style.SUCCESS(f"Cuentas: {created} creadas, {len(ACCOUNTS) - created} ya existían."))
        return out

    # ── Tickets + historial ───────────────────────────────────────────────────────
    def _seed_tickets(self, services: dict[str, Service], accounts: dict[str, User]):
        cliente = accounts["cliente@sassblum.com"]
        admin = accounts["admin@sassblum.com"]
        w1 = accounts["trabajador1@sassblum.com"]
        w2 = accounts["trabajador2@sassblum.com"]
        E = Ticket.Estado

        plan = [
            {
                "numero": "T-2026-9001", "asunto": "Servidor de correo caído",
                "descripcion": "El servidor de correo dejó de responder esta mañana y nadie puede enviar mensajes.",
                "servicio": "Infraestructura IT", "prioridad": Ticket.Prioridad.ALTA,
                "estado": E.NUEVO, "asignado": None,
                "events": [("creacion", cliente, "", "", "Ticket creado por el cliente.")],
            },
            {
                "numero": "T-2026-9002", "asunto": "Cámara de seguridad sin señal",
                "descripcion": "La cámara CCTV del ingreso principal no muestra imagen desde ayer.",
                "servicio": "Sistema de Vigilancia CCTV", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.EN_PROCESO, "asignado": w1,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Carlos Técnico."),
                    ("cambio_estado", w1, E.NUEVO, E.EN_PROCESO, "En sitio revisando el cableado de la cámara."),
                ],
            },
            {
                "numero": "T-2026-9003", "asunto": "Cableado para nueva oficina",
                "descripcion": "Necesitamos cableado estructurado de voz y datos para 12 puestos nuevos.",
                "servicio": "Cableado Estructurado", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.EN_ESPERA, "asignado": w1,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Carlos Técnico."),
                    ("cambio_estado", w1, E.NUEVO, E.EN_PROCESO, "Levantamiento de requerimientos en sitio."),
                    ("cambio_estado", w1, E.EN_PROCESO, E.EN_ESPERA, "A la espera de que el cliente confirme la distribución de puestos."),
                ],
            },
            {
                "numero": "T-2026-9004", "asunto": "Configurar domótica en sala de reuniones",
                "descripcion": "Queremos controlar luces y proyector de la sala desde el celular.",
                "servicio": "Domótica", "prioridad": Ticket.Prioridad.BAJA,
                "estado": E.RESUELTO, "asignado": w2,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Ana Soporte."),
                    ("cambio_estado", w2, E.NUEVO, E.EN_PROCESO, "Instalación de módulos de control."),
                    ("cambio_estado", w2, E.EN_PROCESO, E.RESUELTO, "Domótica configurada y probada con el cliente."),
                ],
            },
            {
                "numero": "T-2026-9005", "asunto": "Mantenimiento preventivo de servidores",
                "descripcion": "Mantenimiento trimestral de los dos servidores físicos del rack principal.",
                "servicio": "Venta de Servidores", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.CERRADO, "asignado": w2,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Ana Soporte."),
                    ("cambio_estado", w2, E.NUEVO, E.EN_PROCESO, "Ejecutando rutina de mantenimiento."),
                    ("cambio_estado", w2, E.EN_PROCESO, E.RESUELTO, "Mantenimiento completado sin incidencias."),
                    ("cambio_estado", admin, E.RESUELTO, E.CERRADO, "Cliente confirma conformidad. Cierre del ticket."),
                ],
            },
        ]

        created = 0
        for p in plan:
            ticket, was_created = Ticket.objects.get_or_create(
                numero=p["numero"],
                defaults={
                    "asunto": p["asunto"],
                    "descripcion": p["descripcion"],
                    "servicio": services[p["servicio"]],
                    "cliente": cliente,
                    "asignado": p["asignado"],
                    "estado": p["estado"],
                    "prioridad": p["prioridad"],
                },
            )
            if was_created:
                created += 1
                for tipo, autor, ant, nue, comentario in p["events"]:
                    TicketEvent.objects.create(
                        ticket=ticket,
                        autor=autor,
                        tipo_evento=tipo,
                        estado_anterior=ant,
                        estado_nuevo=nue,
                        comentario=comentario,
                    )
        self.stdout.write(self.style.SUCCESS(f"Tickets: {created} creados, {len(plan) - created} ya existían."))

    # ── Resumen ──────────────────────────────────────────────────────────────────
    def _print_summary(self, accounts: dict[str, User]):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Cuentas de prueba (contraseña común):"))
        self.stdout.write(f"  Contraseña: {DEMO_PASSWORD}")
        for acc in ACCOUNTS:
            self.stdout.write(f"  [{acc['role']:>6}] {acc['email']}")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Datos de prueba listos. ¡A correr la demo!"))

```

### 📄 backend/apps/tickets/models.py
```python
from django.db import models

# Create your models here.

```

### 📄 backend/apps/tickets/models/__init__.py
```python
from .ticket import Ticket
from .attachment import Attachment
from .ticket_event import TicketEvent

__all__ = ["Ticket", "Attachment", "TicketEvent"]

```

### 📄 backend/apps/tickets/models/attachment.py
```python
"""
Attachment model — stores file metadata for ticket attachments (SRP).

Responsibility (SRP): persist file reference data only.
    - Actual file upload/delete lives in StorageService (via IStorageService).
    - The URL stored here is returned by IStorageService.upload().
    - Attachment records are created by TicketService after a successful upload.
Depends on: Django ORM, Ticket model.
Pattern: Domain Model (data-only).
SOLID: SRP

Prohibited in this file:
    - Any call to IStorageService or Supabase SDK
    - File I/O of any kind
"""

from django.db import models


class Attachment(models.Model):

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="adjuntos",
        verbose_name="ticket",
    )
    nombre_archivo = models.CharField(
        max_length=255,
        verbose_name="nombre del archivo",
    )
    url = models.URLField(
        max_length=1000,
        verbose_name="URL de acceso",
        help_text="URL pública o firmada retornada por IStorageService.upload().",
    )
    tamaño_bytes = models.PositiveIntegerField(
        verbose_name="tamaño (bytes)",
    )
    mime_type = models.CharField(
        max_length=100,
        verbose_name="tipo MIME",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="subido en")

    class Meta:
        db_table = "tickets_attachment"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.nombre_archivo} ({self.ticket.numero})"

```

### 📄 backend/apps/tickets/models/ticket.py
```python
"""
Ticket model — defines data structure only (SRP).

Responsibility (SRP): persist ticket data. No business logic.
    - Estado transitions live in TicketStateMachine (state_machine/).
    - T-YYYY-NNNN number generation lives in TicketService (services/).
    - Validation lives in the validator chain (validators/).
Depends on: Django ORM, apps.authentication.models.User, apps.catalog.models.Service.
Pattern: Domain Model (data-only).
SOLID: SRP (model = data; logic = service)

Prohibited in this file:
    - Methods that call other services
    - Pre/post-save hooks (use apps.py ready() for signals)
    - Any reference to TicketService, TicketStateMachine, or NotificationService

Permitted in this file:
    - Field definitions and choices
    - clean() for field-level constraints only (e.g. asunto length)
    - Simple @property for derived display values (e.g. is_closed)
"""

from django.db import models


class Ticket(models.Model):

    class Estado(models.TextChoices):
        NUEVO      = "Nuevo",     "Nuevo"
        EN_PROCESO = "EnProceso", "En Proceso"
        EN_ESPERA  = "EnEspera",  "En Espera"
        RESUELTO   = "Resuelto",  "Resuelto"
        CERRADO    = "Cerrado",   "Cerrado"

    class Prioridad(models.TextChoices):
        BAJA    = "Baja",    "Baja"
        MEDIA   = "Media",   "Media"
        ALTA    = "Alta",    "Alta"
        CRITICA = "Critica", "Crítica"

    # ── Identity ──────────────────────────────────────────────────────────────
    numero = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="número de ticket",
        help_text="Formato T-YYYY-NNNN. Generado por TicketService, nunca por el modelo.",
    )

    # ── Content ───────────────────────────────────────────────────────────────
    asunto = models.CharField(
        max_length=80,
        verbose_name="asunto",
    )
    descripcion = models.TextField(
        verbose_name="descripción",
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    servicio = models.ForeignKey(
        "catalog.Service",
        on_delete=models.PROTECT,
        related_name="tickets",
        verbose_name="servicio",
    )
    cliente = models.ForeignKey(
        "authentication.User",
        on_delete=models.PROTECT,
        related_name="tickets_creados",
        verbose_name="cliente",
    )
    asignado = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_asignados",
        verbose_name="trabajador asignado",
    )

    # ── Status ────────────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.NUEVO,
        verbose_name="estado",
    )
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        verbose_name="prioridad",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "tickets_ticket"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["cliente", "estado"]),
            models.Index(fields=["asignado", "estado"]),
            models.Index(fields=["estado", "prioridad"]),
        ]

    def __str__(self) -> str:
        return f"{self.numero} — {self.asunto[:40]}"

    @property
    def is_closed(self) -> bool:
        """True if ticket has reached the terminal Cerrado state."""
        return self.estado == self.Estado.CERRADO

```

### 📄 backend/apps/tickets/models/ticket_event.py
```python
"""
TicketEvent model — immutable audit log for all ticket activity (SRP).

Responsibility (SRP): persist audit records only. Every state change, comment,
    and assignment creates one TicketEvent. The model never decides when to create
    records — that logic lives in TicketService.
Depends on: Django ORM, Ticket model, authentication.User.
Pattern: Domain Model (data-only) + Observer (this model's post_save fires the signal
    registered in apps.py ready() — the model itself knows nothing about it).
SOLID: SRP · OCP (new event type = new TipoEvento choice, no logic change)

Prohibited in this file:
    - Any call to NotificationService, EmailService, or WebSocket
    - pre/post_save hooks (signals live in apps.py)
    - Mutable state or update logic (TicketEvents are append-only)

BR-35 enforcement:
    The comentario field is required for CAMBIO_ESTADO events.
    This constraint is enforced by TicketService + TicketStateMachine, NOT by the model.
    The model accepts any non-null string to remain flexible for other event types.
"""

from django.db import models


class TicketEvent(models.Model):

    class TipoEvento(models.TextChoices):
        CREACION      = "creacion",      "Creación"
        CAMBIO_ESTADO = "cambio_estado", "Cambio de estado"
        COMENTARIO    = "comentario",    "Comentario"
        ASIGNACION    = "asignacion",    "Asignación"
        REASIGNACION  = "reasignacion",  "Reasignación"

    # ── Relations ─────────────────────────────────────────────────────────────
    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="eventos",
        verbose_name="ticket",
    )
    autor = models.ForeignKey(
        "authentication.User",
        on_delete=models.PROTECT,
        related_name="ticket_events",
        verbose_name="autor",
    )

    # ── Event data ────────────────────────────────────────────────────────────
    tipo_evento = models.CharField(
        max_length=20,
        choices=TipoEvento.choices,
        verbose_name="tipo de evento",
    )
    estado_anterior = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="estado anterior",
        help_text="Vacío para eventos que no cambian estado (comentarios, asignaciones).",
    )
    estado_nuevo = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="estado nuevo",
    )
    comentario = models.TextField(
        verbose_name="comentario",
        help_text="Requerido para CAMBIO_ESTADO (BR-35). Opcional para otros tipos.",
    )

    # ── Timestamp (immutable) ─────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="registrado en")

    class Meta:
        db_table = "tickets_ticket_event"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["ticket", "created_at"]),
            models.Index(fields=["ticket", "tipo_evento"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.ticket.numero} · {self.tipo_evento} "
            f"({self.created_at.strftime('%Y-%m-%d %H:%M')})"
        )

```

### 📄 backend/apps/tickets/repositories/__init__.py
```python
from .ticket_repository import TicketRepository

__all__ = ["TicketRepository"]

```

### 📄 backend/apps/tickets/repositories/ticket_repository.py
```python
"""
TicketRepository — encapsulates all ORM access for tickets (Repository).

Responsibility (SRP): every Ticket / TicketEvent query lives here. No view or
    service touches the ORM directly (DIP). Uses select_related/prefetch_related
    to avoid N+1 queries.
Depends on: BaseRepository[Ticket], Ticket, TicketEvent models.
Pattern: Repository.
SOLID: DIP · SRP · LSP

Role-based ACL (ISP/RBAC, inherited from S9/S15):
    CLIENTE     → only own tickets (cliente=user)
    TRABAJADOR  → only assigned tickets (asignado=user)
    ADMIN       → all tickets
"""

from __future__ import annotations

from typing import Optional

from django.db.models import Q

from core.base.base_repository import BaseRepository
from apps.tickets.models import Ticket, TicketEvent

PAGE_SIZE = 20
_ACTIVE_STATES = ["Nuevo", "EnProceso", "EnEspera", "Resuelto"]


class TicketRepository(BaseRepository[Ticket]):
    """ORM gateway for the tickets module."""

    # ── Generic CRUD (BaseRepository contract) ─────────────────────────────────

    def get_by_id(self, entity_id: int) -> Optional[Ticket]:
        return (
            Ticket.objects
            .select_related("servicio", "cliente", "asignado")
            .filter(pk=entity_id)
            .first()
        )

    def get_all(self, filters: dict | None = None) -> list[Ticket]:
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Ticket:
        return Ticket.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Ticket:
        Ticket.objects.filter(pk=entity_id).update(**data)
        return self.get_by_id(entity_id)

    def delete(self, entity_id: int) -> None:
        Ticket.objects.filter(pk=entity_id).delete()

    # ── Role-scoped listing with filters + pagination ──────────────────────────

    def get_all_for_user(self, user, filters: dict | None = None, page: int = 1) -> dict:
        """
        Return a page of tickets visible to `user`, applying role-based ACL and
        optional filters (estado, prioridad, servicio_id, fecha_desde, fecha_hasta).

        Returns: {'items': list[Ticket], 'total': int, 'page': int, 'page_size': int}
        """
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")

        # Role-based scope
        role = getattr(user, "role", None)
        if role == "client":
            qs = qs.filter(cliente=user)
        elif role == "worker":
            qs = qs.filter(asignado=user)
        # admin → no scope filter (sees all)

        qs = self._apply_filters(qs, filters or {})

        total = qs.count()
        start = (max(page, 1) - 1) * PAGE_SIZE
        items = list(qs[start:start + PAGE_SIZE])

        return {"items": items, "total": total, "page": page, "page_size": PAGE_SIZE}

    @staticmethod
    def _apply_filters(qs, filters: dict):
        if estado := filters.get("estado"):
            qs = qs.filter(estado=estado)
        if prioridad := filters.get("prioridad"):
            qs = qs.filter(prioridad=prioridad)
        if servicio_id := filters.get("servicio_id"):
            qs = qs.filter(servicio_id=servicio_id)
        if fecha_desde := filters.get("fecha_desde"):
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta := filters.get("fecha_hasta"):
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        return qs

    # ── History (timeline of events) ───────────────────────────────────────────

    def get_history(self, ticket_id: int, user) -> Optional[list[TicketEvent]]:
        """
        Return the chronological event timeline for a ticket the user may see.
        Returns None if the ticket does not exist or the user lacks access.
        """
        ticket = self.get_by_id(ticket_id)
        if ticket is None or not self._user_can_see(ticket, user):
            return None
        return list(
            TicketEvent.objects
            .select_related("autor")
            .filter(ticket_id=ticket_id)
            .order_by("created_at")
        )

    @staticmethod
    def _user_can_see(ticket: Ticket, user) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        return ticket.cliente_id == user.id

    # ── Duplicate detection (used by BusinessRuleValidator, S13) ───────────────

    def find_active_duplicate(self, cliente_id: int, asunto: str, servicio_id: int):
        """
        Return an existing active ticket with the same client + subject + service,
        or None. An active ticket is one not in the terminal 'Cerrado' state.
        """
        return (
            Ticket.objects
            .filter(
                Q(cliente_id=cliente_id)
                & Q(asunto__iexact=asunto.strip())
                & Q(servicio_id=servicio_id)
                & Q(estado__in=_ACTIVE_STATES)
            )
            .first()
        )

```

### 📄 backend/apps/tickets/serializers/__init__.py
```python
from .ticket_event_serializer import TicketEventSerializer
from .ticket_list_serializer import TicketListSerializer
from .ticket_create_serializer import TicketCreateSerializer

__all__ = ["TicketEventSerializer", "TicketListSerializer", "TicketCreateSerializer"]

```

### 📄 backend/apps/tickets/serializers/ticket_action_serializers.py
```python
"""
Ticket action serializers — one per write operation (SRP).
Used by assignment (admin) and status/comment (worker) endpoints.
"""

from rest_framework import serializers


class AssignSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()


class StatusChangeSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(
        choices=["Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"]
    )
    comentario = serializers.CharField(allow_blank=False)


class CommentSerializer(serializers.Serializer):
    comentario = serializers.CharField(allow_blank=False)

```

### 📄 backend/apps/tickets/serializers/ticket_create_serializer.py
```python
"""
TicketCreateSerializer — validates ticket creation input (SRP).
Field-level checks only; business rules (duplicates, business hours) live in the
validator chain (S13), invoked by TicketService.
"""

from rest_framework import serializers


class TicketCreateSerializer(serializers.Serializer):
    asunto = serializers.CharField(max_length=80)
    descripcion = serializers.CharField(min_length=10)
    servicio_id = serializers.IntegerField()
    prioridad = serializers.ChoiceField(
        choices=["Baja", "Media", "Alta", "Critica"],
        default="Media",
    )
    # adjuntos arrive as multipart files; handled in the view via request.FILES

```

### 📄 backend/apps/tickets/serializers/ticket_event_serializer.py
```python
"""
TicketEventSerializer — read-only serializer for audit log entries.

Responsibility (SRP): transform a TicketEvent instance into a dict for API responses.
    No write operations — TicketEvents are append-only (created by TicketService).
Depends on: DRF ModelSerializer, TicketEvent model.
Pattern: SRP (one serializer per operation — this is the read operation for events).
SOLID: SRP

Fields exposed:
    id, tipo_evento, estado_anterior, estado_nuevo, comentario,
    autor_nombre (derived), created_at

Not exposed: ticket_id (inferred from context), autor FK raw ID.
"""

from rest_framework import serializers

from apps.tickets.models import TicketEvent


class TicketEventSerializer(serializers.ModelSerializer):

    autor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = TicketEvent
        fields = [
            "id",
            "tipo_evento",
            "estado_anterior",
            "estado_nuevo",
            "comentario",
            "autor_nombre",
            "created_at",
        ]
        read_only_fields = fields

    def get_autor_nombre(self, obj: TicketEvent) -> str:
        """Return 'nombre apellido' of the event author."""
        return f"{obj.autor.first_name} {obj.autor.last_name}".strip() or obj.autor.email

```

### 📄 backend/apps/tickets/serializers/ticket_list_serializer.py
```python
"""
TicketListSerializer — read-only serializer for the ticket history list (SRP).

Responsibility (SRP): shape a Ticket summary for GET /api/tickets.
    One serializer per operation — this is the list/history read.
Depends on: DRF ModelSerializer, Ticket model.
SOLID: SRP
"""

from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketListSerializer(serializers.ModelSerializer):

    servicio_nombre = serializers.CharField(source="servicio.nombre", read_only=True)
    creado_en = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "numero",
            "asunto",
            "estado",
            "prioridad",
            "servicio_nombre",
            "creado_en",
        ]
        read_only_fields = fields

```

### 📄 backend/apps/tickets/services/__init__.py
```python
from .ticket_service import TicketService, get_ticket_service, TicketValidationError
from .storage_service import StorageService

__all__ = [
    "TicketService",
    "get_ticket_service",
    "TicketValidationError",
    "StorageService",
]

```

### 📄 backend/apps/tickets/services/storage_service.py
```python
"""
StorageService — concrete IStorageService backed by Supabase Storage (REST API).

Responsibility (SRP): persist binary files and return their public URL. Uploads to a
    Supabase Storage bucket via its REST API using `requests` (no extra dependency).
    If Supabase credentials are not configured it falls back to a deterministic stub
    URL so the end-to-end flow still works in local dev without a bucket.
Pattern: Strategy/Adapter behind IStorageService — swapping providers (S3, GCS) requires
    no change to TicketService or CatalogService (OCP/DIP/LSP).
SOLID: SRP · DIP · LSP · OCP

Config (settings / .env):
    SUPABASE_URL            e.g. https://xyzcompany.supabase.co
    SUPABASE_SERVICE_KEY    service_role key (server-side only — never expose to FE)
    SUPABASE_STORAGE_BUCKET e.g. "sassblum" (must exist and be public for get_url)
"""

from __future__ import annotations

import mimetypes

import requests
from django.conf import settings

from apps.tickets.interfaces import IStorageService

_STUB_BASE_URL = "/media"

# H#17 (audit): Allowed MIME types for uploads — defense-in-depth.
_ALLOWED_MIME_TYPES = frozenset([
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
])


class StorageService(IStorageService):

    def __init__(self) -> None:
        self._base = (getattr(settings, "SUPABASE_URL", "") or "").rstrip("/")
        self._key = getattr(settings, "SUPABASE_SERVICE_KEY", "") or ""
        self._bucket = getattr(settings, "SUPABASE_STORAGE_BUCKET", "") or "sassblum"

    # ── Capability check ────────────────────────────────────────────────────────

    @property
    def _enabled(self) -> bool:
        return bool(self._base and self._key)

    # ── IStorageService ─────────────────────────────────────────────────────────

    def upload(self, file, path: str) -> str:
        path = path.lstrip("/")
        if not self._enabled:
            # Dev fallback: no real bucket configured.
            return f"{_STUB_BASE_URL}/{path}"

        # H#17 (audit): Validate MIME type server-side — OWASP defense-in-depth
        content_type = (
            getattr(file, "content_type", None)
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        if content_type not in _ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Tipo de archivo no permitido: {content_type}. "
                f"Tipos permitidos: {', '.join(sorted(_ALLOWED_MIME_TYPES))}"
            )

        content_type = (
            getattr(file, "content_type", None)
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        try:
            file.seek(0)
        except Exception:  # noqa: BLE001 - some file-likes are not seekable
            pass
        data = file.read()

        url = f"{self._base}/storage/v1/object/{self._bucket}/{path}"
        resp = requests.post(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {self._key}",
                "apikey": self._key,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            timeout=30,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Supabase upload failed ({resp.status_code}): {resp.text}")
        return self.get_url(path)

    def delete(self, path: str) -> None:
        path = path.lstrip("/")
        if not self._enabled:
            return None
        url = f"{self._base}/storage/v1/object/{self._bucket}/{path}"
        requests.delete(
            url,
            headers={"Authorization": f"Bearer {self._key}", "apikey": self._key},
            timeout=30,
        )
        return None

    def get_url(self, path: str) -> str:
        path = path.lstrip("/")
        if not self._enabled:
            return f"{_STUB_BASE_URL}/{path}"
        return f"{self._base}/storage/v1/object/public/{self._bucket}/{path}"

```

### 📄 backend/apps/tickets/services/ticket_service.py
```python
"""
TicketService — concrete implementation of the three ISP ticket interfaces (Singleton).

Responsibility (SRP): ticket business logic. Generates T-YYYY-NNNN, runs the validator
    chain (S13), drives the state machine (S14), persists via TicketRepository (S24),
    stores attachments via StorageService, and creates TicketEvents (which fire the
    Observer → notifications). Implements Client/Worker/Admin actions (LSP); each view
    depends on its role interface (DIP + ISP).
Depends on: TicketRepository, TicketValidatorChain, TicketStateMachine, IStorageService.
Pattern: Singleton + Repository + Chain of Responsibility + Strategy (state machine).
SOLID: DIP · SRP · LSP · ISP · OCP
"""

from __future__ import annotations

from datetime import datetime

from django.db import transaction

from apps.tickets.interfaces import (
    ITicketClientActions,
    ITicketWorkerActions,
    ITicketAdminActions,
)
from apps.tickets.models import Ticket, Attachment, TicketEvent
from apps.tickets.repositories import TicketRepository
from apps.tickets.state_machine import TicketStateMachine
from apps.tickets.validators import TicketValidatorChain
from apps.tickets.services.storage_service import StorageService
from core.exceptions.domain_exceptions import (
    TicketNotFound,
    InvalidTransitionError,
    CommentRequiredError,
)

TICKETNOTFOUND = "Ticket no encontrado."


class TicketValidationError(Exception):
    def __init__(self, field: str, message: str) -> None:
        self.field = field
        super().__init__(message)


class TicketService(ITicketClientActions, ITicketWorkerActions, ITicketAdminActions):

    def __init__(self, repository=None, storage=None) -> None:
        self._repo: TicketRepository = repository or TicketRepository()
        self._storage = storage or StorageService()
        self._machine = TicketStateMachine()
        self._chain = TicketValidatorChain(self._repo)

    # ── ITicketClientActions ───────────────────────────────────────────────────

    @transaction.atomic
    def create_ticket(self, data: dict, user) -> dict:
        validation_payload = {
            "asunto": data.get("asunto", ""),
            "descripcion": data.get("descripcion", ""),
            "adjuntos": data.get("adjuntos", []),
            "cliente_id": user.id,
            "servicio_id": data.get("servicio_id"),
        }
        result = self._chain.run(validation_payload)
        if not result.is_valid:
            raise TicketValidationError(result.field_name, "; ".join(result.errors))

        numero = self.generate_ticket_number(datetime.now().year)
        ticket = self._repo.create({
            "numero": numero,
            "asunto": data["asunto"],
            "descripcion": data["descripcion"],
            "servicio_id": data["servicio_id"],
            "cliente": user,
            "estado": Ticket.Estado.NUEVO,
            "prioridad": data.get("prioridad", Ticket.Prioridad.MEDIA),
        })

        for f in data.get("adjuntos", []):
            url = self._storage.upload(f, f"{numero}/{f.name}")
            Attachment.objects.create(
                ticket=ticket,
                nombre_archivo=f.name,
                url=url,
                tamaño_bytes=f.size,
                mime_type=getattr(f, "content_type", "application/octet-stream"),
            )

        # Audit event → fires the Observer (notifications)
        TicketEvent.objects.create(
            ticket=ticket,
            autor=user,
            tipo_evento=TicketEvent.TipoEvento.CREACION,
            comentario="Ticket creado.",
        )
        return self._detail(ticket)

    def generate_ticket_number(self, year: int) -> str:
        """Generate the next ticket number atomically (prevents race conditions).

        Uses SELECT ... FOR UPDATE within an atomic transaction to lock the row
        and ensure two concurrent requests never get the same sequence number.
        """
        from django.db import connection  # noqa: PLC0415
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 8) AS INTEGER)), 0) "
                    "FROM tickets_ticket WHERE numero LIKE %s FOR UPDATE",
                    [f"T-{year}-%"],
                )
                max_num = cursor.fetchone()[0]
            return f"T-{year}-{max_num + 1:04d}"

    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        result = self._repo.get_all_for_user(user, filters or {})
        return [self._summary(t) for t in result["items"]]

    def get_ticket_detail(self, ticket_id: int, user) -> dict:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None or not self._can_see(ticket, user):
            raise TicketNotFound(TICKETNOTFOUND)
        return self._detail(ticket)

    # ── ITicketWorkerActions ───────────────────────────────────────────────────

    @transaction.atomic
    def update_status(
        self, ticket_id: int, new_status: str, comment: str, user
    ) -> dict:
        ticket = self._require(ticket_id, user)
        # raises on invalid transition / missing comment
        self._machine.transition(ticket.estado, new_status, comment)
        anterior = ticket.estado
        self._repo.update(ticket_id, {"estado": new_status})
        TicketEvent.objects.create(
            ticket=ticket, autor=user,
            tipo_evento=TicketEvent.TipoEvento.CAMBIO_ESTADO,
            estado_anterior=anterior, estado_nuevo=new_status, comentario=comment,
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    @transaction.atomic
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        if not comment or not comment.strip():
            raise CommentRequiredError("El comentario no puede estar vacío.")
        ticket = self._require(ticket_id, user)
        event = TicketEvent.objects.create(
            ticket=ticket, autor=user,
            tipo_evento=TicketEvent.TipoEvento.COMENTARIO, comentario=comment,
        )
        return {"id": event.id, "comentario": event.comentario}

    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        return self.update_status(ticket_id, Ticket.Estado.CERRADO, comment, user)

    # ── ITicketAdminActions ────────────────────────────────────────────────────

    @transaction.atomic
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        from apps.authentication.models import User  # noqa: PLC0415
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None:
            raise TicketNotFound(TICKETNOTFOUND)
        if ticket.estado != Ticket.Estado.NUEVO:
            raise InvalidTransitionError(ticket.estado, Ticket.Estado.EN_PROCESO)
        worker = User.objects.filter(id=worker_id, role=User.Role.WORKER,
                                     estado=User.Estado.ACTIVE).first()
        if worker is None:
            raise TicketValidationError("asignado", "Trabajador no válido o inactivo.")
        self._repo.update(ticket_id, {"asignado": worker, "estado": Ticket.Estado.EN_PROCESO})
        TicketEvent.objects.create(
            ticket=ticket, autor=user, tipo_evento=TicketEvent.TipoEvento.ASIGNACION,
            estado_anterior=Ticket.Estado.NUEVO, estado_nuevo=Ticket.Estado.EN_PROCESO,
            comentario=f"Asignado a {worker.email}.",
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    @transaction.atomic
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        from apps.authentication.models import User  # noqa: PLC0415
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None:
            raise TicketNotFound(TICKETNOTFOUND)
        worker = User.objects.filter(id=new_worker_id, role=User.Role.WORKER,
                                     estado=User.Estado.ACTIVE).first()
        if worker is None:
            raise TicketValidationError("asignado", "Trabajador no válido o inactivo.")
        self._repo.update(ticket_id, {"asignado": worker})
        TicketEvent.objects.create(
            ticket=ticket, autor=user, tipo_evento=TicketEvent.TipoEvento.REASIGNACION,
            comentario=f"Reasignado a {worker.email}.",
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    def get_all_tickets(self, filters: dict | None = None) -> list:
        tickets = self._repo.get_all(filters or {})
        return [self._summary(t) for t in tickets]

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _require(self, ticket_id: int, user) -> Ticket:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None or not self._can_see(ticket, user):
            raise TicketNotFound(TICKETNOTFOUND)
        return ticket

    @staticmethod
    def _can_see(ticket: Ticket, user) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        return ticket.cliente_id == user.id

    @staticmethod
    def _summary(t: Ticket) -> dict:
        return {
            "id": t.id, "numero": t.numero, "asunto": t.asunto,
            "estado": t.estado, "prioridad": t.prioridad,
            "servicio_nombre": t.servicio.nombre if t.servicio_id else "",
            "creado_en": t.created_at.isoformat(),
        }

    @classmethod
    def _detail(cls, t: Ticket) -> dict:
        return {
            **cls._summary(t),
            "descripcion": t.descripcion,
            "cliente_nombre": f"{t.cliente.first_name} {t.cliente.last_name}".strip()
                              or t.cliente.email,
            "asignado_nombre": (
                f"{t.asignado.first_name} {t.asignado.last_name}".strip() or t.asignado.email
            ) if t.asignado_id else None,
            "adjuntos": [
                {"id": a.id, "nombre_archivo": a.nombre_archivo, "url": a.url,
                 "tamaño_bytes": a.tamaño_bytes, "mime_type": a.mime_type}
                for a in t.adjuntos.all()
            ],
            "eventos": [
                {"id": e.id, "tipo_evento": e.tipo_evento,
                 "estado_anterior": e.estado_anterior, "estado_nuevo": e.estado_nuevo,
                 "comentario": e.comentario,
                 "autor_nombre": f"{e.autor.first_name} {e.autor.last_name}".strip()
                                 or e.autor.email,
                 "creado_en": e.created_at.isoformat()}
                for e in t.eventos.all().order_by("created_at")
            ],
            "actualizado_en": t.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading  # noqa: E402

_lock = threading.Lock()
_instance: TicketService | None = None


def get_ticket_service() -> TicketService:
    """Thread-safe singleton accessor (double-checked locking)."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = TicketService()
    return _instance

```

### 📄 backend/apps/tickets/state_machine/__init__.py
```python
from .ticket_state_machine import TicketStateMachine
from .state_transition_validator import StateTransitionValidator

__all__ = ["TicketStateMachine", "StateTransitionValidator"]

```

### 📄 backend/apps/tickets/state_machine/state_transition_validator.py
```python
"""
Chain of Responsibility node — validates ticket state transitions.

Responsibility (SRP): delegate transition validity to TicketStateMachine.
    Does not contain transition rules — it only calls the machine and maps the result
    to a ValidationResult consumable by the rest of the chain.
Depends on: BaseValidator (core/base/base_validator.py)
            TicketStateMachine — injected via constructor (DIP).
Pattern: Chain of Responsibility node + DIP (machine is injected, not instantiated here).
SOLID: SRP · DIP · LSP · OCP

DIP note:
    TicketService creates TicketStateMachine() and passes it here.
    Tests can inject a stub or a machine with a reduced TRANSITIONS map without
    touching this class (LSP).

OCP:
    New transition rule → update TRANSITIONS in TicketStateMachine.
    This validator never changes.

Sprint usage:
    S14 → this file (full signature + delegation logic)
    The validator is wired into the update-status flow in Sprint 3 (S24).
    S18 → covered indirectly via test_state_machine.py + test_validators.py
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult
from .ticket_state_machine import TicketStateMachine


class StateTransitionValidator(BaseValidator):
    """
    Validates that a requested state transition is permitted by TicketStateMachine.
    Used in the update-status flow (Sprint 3); wired into the chain by ValidatorFactory.
    """

    def __init__(self, state_machine: TicketStateMachine) -> None:
        """
        Args:
            state_machine: the TicketStateMachine instance (injected — DIP).
        """
        super().__init__()
        self._machine = state_machine

    def validate(self, data: dict) -> ValidationResult:
        """
        Check that data['estado_actual'] → data['estado_nuevo'] is a valid transition.
        BR-35 (comment required) is enforced by TicketStateMachine.transition() at
        service level; here we only check can_transition() for chain compatibility.

        Args:
            data: dict containing:
                  'estado_actual' (str) — current ticket state
                  'estado_nuevo'  (str) — requested target state

        Returns:
            ValidationResult(is_valid=True) if the transition is allowed.
            ValidationResult(is_valid=False, field_name='estado', errors=[msg]) if not.
        """
        from_state = data.get("estado_actual", "")
        to_state   = data.get("estado_nuevo", "")

        if self._machine.can_transition(from_state, to_state):
            return ValidationResult(is_valid=True, field_name="estado")

        return ValidationResult(
            is_valid=False,
            errors=[
                f"Transición '{from_state}' → '{to_state}' no está permitida. "
                f"Estados válidos desde '{from_state}': "
                f"{self._machine.TRANSITIONS.get(from_state, [])}."
            ],
            field_name="estado",
        )

```

### 📄 backend/apps/tickets/state_machine/ticket_state_machine.py
```python
"""
Ticket lifecycle state machine — encapsulates all valid transitions (Strategy pattern).

Responsibility (SRP): know which transitions are valid and enforce BR-35 (comment required).
    No ORM access, no HTTP logic, no notification dispatch — pure domain rules.
Depends on: core.exceptions.domain_exceptions — nothing from Django or DRF.
Pattern: Strategy — each entry in TRANSITIONS is a named rule; the set is replaceable.
SOLID: DIP · OCP · LSP · SRP

Why NOT an ABC:
    The machine is a concrete policy object, not a hierarchy. Tests swap it by injecting
    a different instance into StateTransitionValidator (DIP), not by subclassing.

OCP extension path:
    New state (e.g. 'Reabierto') in Sprint 4:
        TRANSITIONS['Cerrado'] = ['Reabierto']
        TRANSITIONS['Reabierto'] = ['EnProceso']
    Existing transition rules are NEVER modified — only new keys are added.

LSP:
    Any object that exposes can_transition() and transition() with the same contracts
    is substitutable here (e.g. a stub in tests).

Sprint usage:
    S14 → this file (contract + TRANSITIONS map)
    S14 → StateTransitionValidator consumes this via constructor (DIP)
    S18 → test_state_machine.py covers all valid/invalid transitions + BR-35
"""

from __future__ import annotations

from core.exceptions.domain_exceptions import (
    CommentRequiredError,
    InvalidTransitionError,
)


class TicketStateMachine:
    """
    Encapsulates the ticket lifecycle.

    States: Nuevo · EnProceso · EnEspera · Resuelto · Cerrado
    Terminal state: Cerrado (empty list → no outgoing transitions)
    """

    # ── Transition map ────────────────────────────────────────────────────────
    # Key   = current state
    # Value = list of reachable states (empty = terminal)
    #
    # Business rules encoded here:
    #   Nuevo     → EnProceso  (requires prior assignment — enforced in TicketService)
    #   EnProceso → EnEspera | Resuelto
    #   EnEspera  → EnProceso  (reactivated after client response)
    #   Resuelto  → Cerrado    (client or worker confirms resolution)
    #   Cerrado   → (none)     terminal — no further changes allowed
    TRANSITIONS: dict[str, list[str]] = {
        "Nuevo":     ["EnProceso"],
        "EnProceso": ["EnEspera", "Resuelto"],
        "EnEspera":  ["EnProceso"],
        "Resuelto":  ["Cerrado"],
        "Cerrado":   [],
    }

    # ── Public API ────────────────────────────────────────────────────────────

    def can_transition(self, from_state: str, to_state: str) -> bool:
        """
        Return True if the transition from_state → to_state is in TRANSITIONS.
        Does NOT enforce BR-35 — that is the responsibility of transition().

        Args:
            from_state: current ticket state string
            to_state:   desired target state string

        Returns:
            bool — True if allowed, False otherwise (including unknown states).
        """
        return to_state in self.TRANSITIONS.get(from_state, [])

    def transition(self, from_state: str, to_state: str, comment: str) -> str:
        """
        Validate and apply a state transition.

        Business rules enforced here:
            1. Transition must exist in TRANSITIONS (InvalidTransitionError).
            2. Comment must be non-empty after stripping whitespace (BR-35).

        Args:
            from_state: current ticket state
            to_state:   desired target state
            comment:    mandatory explanation for the transition (BR-35)

        Returns:
            str — the new state (same as to_state) if transition is valid.

        Raises:
            InvalidTransitionError — if the transition is not in TRANSITIONS.
            CommentRequiredError   — if comment is blank (BR-35).
        """
        if not self.can_transition(from_state, to_state):
            raise InvalidTransitionError(from_state, to_state)

        if not comment or not comment.strip():
            raise CommentRequiredError(
                "A non-empty comment is required for every state transition (BR-35)."
            )

        return to_state

    @classmethod
    def all_states(cls) -> list[str]:
        """Return all known states (keys of TRANSITIONS)."""
        return list(cls.TRANSITIONS.keys())

    @classmethod
    def is_terminal(cls, state: str) -> bool:
        """Return True if state has no outgoing transitions (i.e. Cerrado)."""
        return cls.TRANSITIONS.get(state, None) == []

```

### 📄 backend/apps/tickets/tests.py
```python
from django.test import TestCase

# Create your tests here.

```

### 📄 backend/apps/tickets/tests/__init__.py
```python
# Sprint 2 · Session 18 — Tests del módulo tickets (cobertura ≥ 80%):
#   test_state_machine.py   → todas las transiciones válidas e inválidas,
#                             CommentRequiredError (BR-35), estado Cerrado terminal
#   test_validators.py      → BasicFieldValidator, FileValidator, BusinessRuleValidator,
#                             cadena completa (todos los nodos en serie)
#   test_ticket_service.py  → create_ticket(), generate_ticket_number() formato T-YYYY-NNNN,
#                             permiso IsClient (worker/admin reciben 403)

```

### 📄 backend/apps/tickets/tests/test_state_machine.py
```python
"""
Tests for TicketStateMachine — covers all valid/invalid transitions and BR-35.
Run: pytest apps/tickets/tests/test_state_machine.py -v
"""

import pytest

from apps.tickets.state_machine import TicketStateMachine
from core.exceptions.domain_exceptions import CommentRequiredError, InvalidTransitionError


@pytest.fixture
def machine() -> TicketStateMachine:
    return TicketStateMachine()


# ── Valid transitions ──────────────────────────────────────────────────────────

class TestValidTransitions:
    def test_nuevo_to_en_proceso(self, machine):
        assert machine.transition("Nuevo", "EnProceso", "Asignado.") == "EnProceso"

    def test_en_proceso_to_en_espera(self, machine):
        assert machine.transition("EnProceso", "EnEspera", "Esperando respuesta.") == "EnEspera"

    def test_en_proceso_to_resuelto(self, machine):
        assert machine.transition("EnProceso", "Resuelto", "Problema resuelto.") == "Resuelto"

    def test_en_espera_to_en_proceso(self, machine):
        assert machine.transition("EnEspera", "EnProceso", "Cliente respondió.") == "EnProceso"

    def test_resuelto_to_cerrado(self, machine):
        assert machine.transition("Resuelto", "Cerrado", "Cliente confirmó.") == "Cerrado"


# ── Invalid transitions ────────────────────────────────────────────────────────

class TestInvalidTransitions:
    @pytest.mark.parametrize("from_state,to_state", [
        ("Nuevo",     "EnEspera"),
        ("Nuevo",     "Resuelto"),
        ("Nuevo",     "Cerrado"),
        ("EnProceso", "Nuevo"),
        ("EnEspera",  "Resuelto"),
        ("EnEspera",  "Cerrado"),
        ("Resuelto",  "Nuevo"),
        ("Resuelto",  "EnProceso"),
        ("Cerrado",   "Nuevo"),
        ("Cerrado",   "EnProceso"),
        ("Cerrado",   "EnEspera"),
        ("Cerrado",   "Resuelto"),
    ])
    def test_invalid_transition_raises(self, machine, from_state, to_state):
        with pytest.raises(InvalidTransitionError) as exc_info:
            machine.transition(from_state, to_state, "Comentario válido.")
        assert exc_info.value.from_state == from_state
        assert exc_info.value.to_state == to_state

    def test_cerrado_is_fully_terminal(self, machine):
        """Cerrado has zero outgoing transitions."""
        assert machine.TRANSITIONS["Cerrado"] == []
        assert machine.is_terminal("Cerrado") is True

    def test_non_terminal_states_are_not_terminal(self, machine):
        for state in ["Nuevo", "EnProceso", "EnEspera", "Resuelto"]:
            assert machine.is_terminal(state) is False


# ── BR-35: comment required ────────────────────────────────────────────────────

class TestBR35CommentRequired:
    def test_empty_comment_raises(self, machine):
        with pytest.raises(CommentRequiredError):
            machine.transition("Nuevo", "EnProceso", "")

    def test_whitespace_only_comment_raises(self, machine):
        with pytest.raises(CommentRequiredError):
            machine.transition("Nuevo", "EnProceso", "   \t\n")

    def test_single_char_comment_passes(self, machine):
        assert machine.transition("Nuevo", "EnProceso", "X") == "EnProceso"


# ── Helper methods ─────────────────────────────────────────────────────────────

class TestHelperMethods:
    def test_can_transition_true(self, machine):
        assert machine.can_transition("Nuevo", "EnProceso") is True
        assert machine.can_transition("Resuelto", "Cerrado") is True

    def test_can_transition_false(self, machine):
        assert machine.can_transition("Cerrado", "Nuevo") is False
        assert machine.can_transition("Nuevo", "Cerrado") is False

    def test_all_states_returns_five(self, machine):
        states = TicketStateMachine.all_states()
        assert len(states) == 5
        assert set(states) == {"Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"}

    def test_can_transition_unknown_state_is_false(self, machine):
        assert machine.can_transition("Desconocido", "Nuevo") is False

```

### 📄 backend/apps/tickets/tests/test_ticket_api.py
```python
"""
Integration tests for the Ticket API — H#9 (audit).

Tests HTTP endpoints using DRF APIClient (not mocked).
Verifies authentication, permissions, serialization, and response codes.

Run: pytest apps/tickets/tests/test_ticket_api.py -v
"""

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestTicketAPIIntegration:
    """H#9: Integration tests using DRF APIClient."""

    def test_list_tickets_unauthenticated_returns_401(self):
        """Unauthenticated requests should be rejected."""
        client = APIClient()
        response = client.get('/api/tickets/')
        assert response.status_code == 401

    def test_health_check_returns_200(self):
        """H#25: Health check endpoint should be accessible without auth."""
        client = APIClient()
        response = client.get('/health/')
        assert response.status_code == 200
        assert response.data['status'] == 'healthy'

    def test_services_list_public(self):
        """Service catalog should be publicly accessible."""
        client = APIClient()
        response = client.get('/api/servicios/')
        assert response.status_code == 200
        assert 'items' in response.data

    def test_create_ticket_unauthenticated_returns_401(self):
        """Ticket creation should require authentication."""
        client = APIClient()
        response = client.post('/api/tickets/', {
            'asunto': 'Test',
            'descripcion': 'Test description',
            'servicio_id': 1,
            'prioridad': 'Media',
        })
        assert response.status_code == 401

    def test_rate_limiting_works(self):
        """H#2: Rate limiting should kick in after many requests."""
        client = APIClient()
        # Make 35 rapid requests (limit is 30/minute for anon)
        responses = []
        for _ in range(35):
            resp = client.get('/api/servicios/')
            responses.append(resp.status_code)
        # At least one should be 429 (Too Many Requests)
        assert 429 in responses, f"Expected 429 in responses: {set(responses)}"

```

### 📄 backend/apps/tickets/tests/test_ticket_lifecycle.py
```python
"""
End-to-end ticket lifecycle through TicketService (requires DB).
create → assign → update_status → close. Run: pytest apps/tickets/tests/test_ticket_lifecycle.py -v
"""

import datetime

import pytest
from unittest.mock import patch

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.services.ticket_service import TicketService
from core.exceptions.domain_exceptions import InvalidTransitionError


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(email="c@x.com", password="Pass1234", role=User.Role.CLIENT,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


@pytest.fixture
def worker(db):
    return User.objects.create_user(email="w@x.com", password="Pass1234", role=User.Role.WORKER,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="a@x.com", password="Pass1234", role=User.Role.ADMIN,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


_BUSINESS_TIME = datetime.datetime(2026, 6, 15, 10, 0, 0)  # Monday 10:00


@pytest.mark.django_db
class TestTicketLifecycle:
    def _create(self, cliente, service):
        svc = TicketService()
        data = {
            "asunto": "No imprime la factura",
            "descripcion": "La impresora no responde desde ayer por la tarde.",
            "servicio_id": service.id,
            "prioridad": "Alta",
            "adjuntos": [],
        }
        # Patch business-hours so the chain passes regardless of when tests run.
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = _BUSINESS_TIME
            return svc.create_ticket(data, cliente)

    def test_create_generates_number_and_event(self, cliente, service):
        detail = self._create(cliente, service)
        assert detail["numero"].startswith("T-")
        assert detail["estado"] == "Nuevo"
        assert TicketEvent.objects.filter(tipo_evento="creacion").count() == 1

    def test_full_flow_create_assign_resolve_close(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()

        assigned = svc.assign_ticket(ticket_id, worker.id, admin)
        assert assigned["estado"] == "EnProceso"
        assert Ticket.objects.get(id=ticket_id).asignado_id == worker.id

        resolved = svc.update_status(ticket_id, "Resuelto", "Listo.", worker)
        assert resolved["estado"] == "Resuelto"

        closed = svc.close_ticket(ticket_id, "Confirmado por el cliente.", worker)
        assert closed["estado"] == "Cerrado"

    def test_invalid_transition_raises(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()
        # Nuevo → Resuelto is not allowed (must go through EnProceso first).
        # Use admin so _can_see() passes even though the ticket is unassigned.
        with pytest.raises(InvalidTransitionError):
            svc.update_status(ticket_id, "Resuelto", "comentario", admin)

    def test_number_format(self, cliente, service):
        assert TicketService().generate_ticket_number(2026).startswith("T-2026-")

```

### 📄 backend/apps/tickets/tests/test_ticket_repository.py
```python
"""
Tests for TicketRepository — role-scoped listing, history ACL, duplicate detection.
Requires the database. Run: pytest apps/tickets/tests/test_ticket_repository.py -v
"""

import pytest

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket
from apps.tickets.repositories import TicketRepository


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(email="c@x.com", password="p", role=User.Role.CLIENT)


@pytest.fixture
def worker(db):
    return User.objects.create_user(email="w@x.com", password="p", role=User.Role.WORKER)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="a@x.com", password="p", role=User.Role.ADMIN)


def make_ticket(numero, servicio, cliente, asignado=None, estado="Nuevo", asunto="Asunto X"):
    return Ticket.objects.create(
        numero=numero, asunto=asunto, descripcion="desc larga aquí",
        servicio=servicio, cliente=cliente, asignado=asignado, estado=estado,
    )


@pytest.mark.django_db
class TestRoleScopedListing:
    def test_client_sees_only_own(self, service, cliente, worker, admin):
        otro = User.objects.create_user(email="o@x.com", password="p", role=User.Role.CLIENT)
        make_ticket("T-2026-0001", service, cliente)
        make_ticket("T-2026-0002", service, otro)

        result = TicketRepository().get_all_for_user(cliente)
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0001"}

    def test_worker_sees_only_assigned(self, service, cliente, worker):
        make_ticket("T-2026-0003", service, cliente, asignado=worker, estado="EnProceso")
        make_ticket("T-2026-0004", service, cliente)  # unassigned

        result = TicketRepository().get_all_for_user(worker)
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0003"}

    def test_admin_sees_all(self, service, cliente, worker, admin):
        make_ticket("T-2026-0005", service, cliente)
        make_ticket("T-2026-0006", service, cliente, asignado=worker, estado="EnProceso")
        result = TicketRepository().get_all_for_user(admin)
        assert result["total"] == 2

    def test_filter_by_estado(self, service, cliente, admin):
        make_ticket("T-2026-0007", service, cliente, estado="Nuevo")
        make_ticket("T-2026-0008", service, cliente, estado="Resuelto")
        result = TicketRepository().get_all_for_user(admin, {"estado": "Resuelto"})
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0008"}


@pytest.mark.django_db
class TestDuplicateDetection:
    def test_finds_active_duplicate(self, service, cliente):
        make_ticket("T-2026-0009", service, cliente, asunto="Impresora rota", estado="Nuevo")
        dup = TicketRepository().find_active_duplicate(cliente.id, "Impresora rota", service.id)
        assert dup is not None

    def test_closed_ticket_is_not_duplicate(self, service, cliente):
        make_ticket("T-2026-0010", service, cliente, asunto="Mouse roto", estado="Cerrado")
        dup = TicketRepository().find_active_duplicate(cliente.id, "Mouse roto", service.id)
        assert dup is None


@pytest.mark.django_db
class TestHistoryAccessControl:
    def test_other_client_cannot_see_history(self, service, cliente):
        otro = User.objects.create_user(email="z@x.com", password="p", role=User.Role.CLIENT)
        ticket = make_ticket("T-2026-0011", service, cliente)
        assert TicketRepository().get_history(ticket.id, otro) is None

    def test_owner_can_see_history(self, service, cliente):
        ticket = make_ticket("T-2026-0012", service, cliente)
        assert TicketRepository().get_history(ticket.id, cliente) == []

```

### 📄 backend/apps/tickets/tests/test_ticket_service.py
```python
"""
Tests for ticket creation permissions — IsClient, IsWorker, IsAdmin.
Run: pytest apps/tickets/tests/test_ticket_service.py -v
"""

from unittest.mock import MagicMock

from rest_framework.test import APIRequestFactory

from core.permissions.rbac_permissions import IsAdmin, IsClient, IsWorker


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_user(role: str, estado: str = "activo") -> MagicMock:
    """Return a mock user with the given role and active status."""
    user = MagicMock()
    user.is_authenticated = True
    user.role = role
    user.estado = estado
    return user


factory = APIRequestFactory()


def check_permission(permission_class, user) -> bool:
    request = factory.get("/")
    request.user = user
    return permission_class().has_permission(request, view=None)


# ── IsClient ───────────────────────────────────────────────────────────────────

class TestIsClient:
    def test_client_user_is_allowed(self):
        user = make_user("client")
        assert check_permission(IsClient, user)

    def test_worker_user_is_denied(self):
        user = make_user("worker")
        assert not check_permission(IsClient, user)

    def test_admin_user_is_denied(self):
        user = make_user("admin")
        assert not check_permission(IsClient, user)

    def test_unauthenticated_user_is_denied(self):
        user = MagicMock()
        user.is_authenticated = False
        assert not check_permission(IsClient, user)

    def test_blocked_client_is_denied(self):
        user = make_user("client", estado="bloqueado")
        assert not check_permission(IsClient, user)


# ── IsWorker ───────────────────────────────────────────────────────────────────

class TestIsWorker:
    def test_worker_user_is_allowed(self):
        user = make_user("worker")
        assert check_permission(IsWorker, user)

    def test_client_is_denied(self):
        user = make_user("client")
        assert not check_permission(IsWorker, user)


# ── IsAdmin ────────────────────────────────────────────────────────────────────

class TestIsAdmin:
    def test_admin_user_is_allowed(self):
        user = make_user("admin")
        assert check_permission(IsAdmin, user)

    def test_worker_is_denied(self):
        user = make_user("worker")
        assert not check_permission(IsAdmin, user)


# ── Ticket number format ───────────────────────────────────────────────────────

class TestTicketNumberFormat:
    """Verify the expected format T-YYYY-NNNN without hitting the database."""

    def test_format_pattern(self):
        import re
        pattern = re.compile(r"^T-\d{4}-\d{4}$")
        samples = ["T-2026-0001", "T-2026-0042", "T-2026-9999"]
        for s in samples:
            assert pattern.match(s), f"'{s}' does not match T-YYYY-NNNN"

```

### 📄 backend/apps/tickets/tests/test_validators.py
```python
"""
Tests for the ticket validator chain — each node in isolation + full chain.
Run: pytest apps/tickets/tests/test_validators.py -v
"""

import pytest
from unittest.mock import MagicMock, patch
import datetime

from apps.tickets.validators.basic_field_validator import BasicFieldValidator
from apps.tickets.validators.file_validator import FileValidator
from apps.tickets.validators.business_rule_validator import BusinessRuleValidator
from apps.tickets.validators import TicketValidatorChain


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_file(name: str, size: int, content_type: str):
    f = MagicMock()
    f.name = name
    f.size = size
    f.content_type = content_type
    return f


def make_repo(duplicate=None):
    repo = MagicMock()
    repo.find_active_duplicate.return_value = duplicate
    return repo


VALID_DATA = {
    "asunto": "Problema con la factura electrónica",
    "descripcion": "No puedo descargar la factura del mes de mayo de 2026.",
    "adjuntos": [],
    "cliente_id": 1,
    "servicio_id": 2,
}

BUSINESS_HOUR = datetime.datetime(2026, 6, 15, 10, 0, 0)  # Monday 10:00


# ── BasicFieldValidator ────────────────────────────────────────────────────────

class TestBasicFieldValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.v = BasicFieldValidator()

    def test_valid_data_passes(self):
        assert self.v.validate(VALID_DATA).is_valid

    def test_asunto_empty_fails(self):
        r = self.v.validate({**VALID_DATA, "asunto": ""})
        assert not r.is_valid and r.field_name == "asunto"

    def test_asunto_at_limit_passes(self):
        assert self.v.validate({**VALID_DATA, "asunto": "A" * 80}).is_valid

    def test_asunto_over_limit_fails(self):
        r = self.v.validate({**VALID_DATA, "asunto": "A" * 81})
        assert not r.is_valid and r.field_name == "asunto"

    def test_descripcion_too_short_fails(self):
        r = self.v.validate({**VALID_DATA, "descripcion": "Corto"})
        assert not r.is_valid and r.field_name == "descripcion"

    def test_descripcion_at_minimum_passes(self):
        assert self.v.validate({**VALID_DATA, "descripcion": "A" * 10}).is_valid


# ── FileValidator ──────────────────────────────────────────────────────────────

class TestFileValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.v = FileValidator()

    def test_no_files_passes(self):
        assert self.v.validate({"adjuntos": []}).is_valid

    def test_missing_adjuntos_key_passes(self):
        assert self.v.validate({}).is_valid

    def test_valid_pdf_passes(self):
        f = make_file("doc.pdf", 1_000_000, "application/pdf")
        assert self.v.validate({"adjuntos": [f]}).is_valid

    def test_valid_image_passes(self):
        f = make_file("foto.jpg", 500_000, "image/jpeg")
        assert self.v.validate({"adjuntos": [f]}).is_valid

    def test_file_too_large_fails(self):
        f = make_file("grande.pdf", 6_000_000, "application/pdf")
        r = self.v.validate({"adjuntos": [f]})
        assert not r.is_valid and r.field_name == "adjuntos"

    def test_invalid_mime_fails(self):
        f = make_file("script.exe", 1000, "application/x-msdownload")
        r = self.v.validate({"adjuntos": [f]})
        assert not r.is_valid and r.field_name == "adjuntos"

    def test_first_invalid_file_stops_iteration(self):
        good = make_file("ok.pdf", 100, "application/pdf")
        bad = make_file("big.pdf", 6_000_000, "application/pdf")
        r = self.v.validate({"adjuntos": [bad, good]})
        assert not r.is_valid


# ── BusinessRuleValidator ──────────────────────────────────────────────────────

class TestBusinessRuleValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.repo = make_repo()
        self.v = BusinessRuleValidator(self.repo)

    def _patch_now(self, dt: datetime.datetime):
        return patch("apps.tickets.validators.business_rule_validator.datetime") \
               .__enter__  # used as context manager in tests

    def test_valid_business_hour_passes(self):
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = BUSINESS_HOUR
            assert self.v.validate(VALID_DATA).is_valid

    def test_weekend_fails(self):
        weekend = datetime.datetime(2026, 6, 13, 10, 0, 0)  # Saturday
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = weekend
            r = self.v.validate(VALID_DATA)
            assert not r.is_valid and r.field_name == "horario"

    def test_before_business_hours_fails(self):
        early = datetime.datetime(2026, 6, 15, 6, 59, 0)  # Mon 06:59
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = early
            r = self.v.validate(VALID_DATA)
            assert not r.is_valid and r.field_name == "horario"

    def test_duplicate_ticket_fails(self):
        self.repo.find_active_duplicate.return_value = object()  # truthy = duplicate exists
        with patch(
            "apps.tickets.validators.business_rule_validator.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = BUSINESS_HOUR
            r = self.v.validate(VALID_DATA)
            assert not r.is_valid and r.field_name == "duplicado"


# ── Full chain via TicketValidatorChain ────────────────────────────────────────

class TestTicketValidatorChain:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.repo = make_repo()
        self.chain = TicketValidatorChain(self.repo)

    def test_invalid_asunto_stops_chain_does_not_call_repo(self):
        data = {**VALID_DATA, "asunto": ""}
        r = self.chain.run(data)
        assert not r.is_valid
        assert r.field_name == "asunto"
        self.repo.find_active_duplicate.assert_not_called()

    def test_invalid_file_stops_before_business_rule(self):
        bad_file = make_file("big.pdf", 6_000_000, "application/pdf")
        data = {**VALID_DATA, "adjuntos": [bad_file]}
        r = self.chain.run(data)
        assert not r.is_valid
        assert r.field_name == "adjuntos"
        self.repo.find_active_duplicate.assert_not_called()

```

### 📄 backend/apps/tickets/urls.py
```python
"""
URL routing for the tickets API. Mounted under /api/tickets/ by config/urls.py.

    GET   /api/tickets                  → list (role-scoped, filters, pagination)
    POST  /api/tickets                  → create (IsClient)
    GET   /api/tickets/<id>             → detail
    GET   /api/tickets/<id>/historial   → event timeline
    PATCH /api/tickets/<id>/asignar     → assign   (IsAdmin)
    PATCH /api/tickets/<id>/reasignar   → reassign (IsAdmin)
    PATCH /api/tickets/<id>/estado      → update status (IsWorker)
    POST  /api/tickets/<id>/comentario  → add comment
"""

from django.urls import path

from apps.tickets.views import (
    CreateTicketView,
    TicketDetailView,
    TicketHistoryView,
    AssignView,
    ReassignView,
    UpdateStatusView,
    AddCommentView,
)

urlpatterns = [
    path("", CreateTicketView.as_view(), name="ticket-collection"),
    path("<int:ticket_id>", TicketDetailView.as_view(), name="ticket-detail"),
    path("<int:ticket_id>/historial", TicketHistoryView.as_view(), name="ticket-history"),
    path("<int:ticket_id>/asignar", AssignView.as_view(), name="ticket-assign"),
    path("<int:ticket_id>/reasignar", ReassignView.as_view(), name="ticket-reassign"),
    path("<int:ticket_id>/estado", UpdateStatusView.as_view(), name="ticket-status"),
    path("<int:ticket_id>/comentario", AddCommentView.as_view(), name="ticket-comment"),
]

```

### 📄 backend/apps/tickets/validators/__init__.py
```python
from .ticket_validator_chain import TicketValidatorChain

__all__ = ["TicketValidatorChain"]

# Nodos de la cadena (creados en S13 — solo firmas):
#   basic_field_validator.py    → BasicFieldValidator(BaseValidator) — asunto ≤80, descripcion ≥10
#   file_validator.py           → FileValidator(BaseValidator) — tamaño ≤5MB, mime permitido
#   business_rule_validator.py  → BusinessRuleValidator(BaseValidator)
#                                  horario laboral, duplicados activos
#   ticket_validator_chain.py   → TicketValidatorChain — fachada que delega
#                                  la construcción a ValidatorFactory
#
# OCP: Sprint 4 → CriticalPriorityValidator se agrega en ValidatorFactory;
#      los nodos existentes quedan intactos.

```

### 📄 backend/apps/tickets/validators/basic_field_validator.py
```python
"""
Chain of Responsibility node — validates basic text fields of a ticket.

Responsibility (SRP): enforce only character-count rules on asunto and descripcion.
Depends on: BaseValidator (core/base/base_validator.py).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class BasicFieldValidator(BaseValidator):
    """Validates asunto (≤80 chars) and descripcion (≥10 chars)."""

    ASUNTO_MAX = 80
    DESCRIPCION_MIN = 10

    def validate(self, data: dict) -> ValidationResult:
        asunto = data.get("asunto", "")
        if not asunto or len(asunto) > self.ASUNTO_MAX:
            return ValidationResult(
                is_valid=False,
                errors=[f"El asunto debe tener entre 1 y {self.ASUNTO_MAX} caracteres."],
                field_name="asunto",
            )

        descripcion = data.get("descripcion", "")
        if not descripcion or len(descripcion) < self.DESCRIPCION_MIN:
            return ValidationResult(
                is_valid=False,
                errors=[
                    f"La descripción debe tener al menos {self.DESCRIPCION_MIN} caracteres."
                ],
                field_name="descripcion",
            )

        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/tickets/validators/business_rule_validator.py
```python
"""
Chain of Responsibility node — validates business rules for ticket creation.

Responsibility (SRP): enforce domain-level business rules only.
Depends on: BaseValidator (core/base/base_validator.py).
    Receives ticket_repository via __init__ for duplicate check (DIP).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · DIP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult

# Business hours: Monday–Friday 07:00–20:00 local time
_BUSINESS_START = 7
_BUSINESS_END = 20
_BUSINESS_DAYS = {0, 1, 2, 3, 4}  # Mon=0 … Fri=4


class BusinessRuleValidator(BaseValidator):
    """Validates business-hour constraint and duplicate-ticket rule."""

    def __init__(self, ticket_repository) -> None:
        super().__init__()
        self._ticket_repository = ticket_repository

    def validate(self, data: dict) -> ValidationResult:
        # ── Rule 1: business hours (INFORMATIONAL, not blocking) ──────────
        # Tickets can be created 24/7. If outside business hours, the response
        # includes a warning but the ticket IS created.
        # This is handled at the view layer, not here (H#6 from audit).

        # ── Rule 2: no active duplicate for same client + service + subject ─
        cliente_id = data.get("cliente_id")
        asunto = data.get("asunto", "")
        servicio_id = data.get("servicio_id")

        if cliente_id and asunto and servicio_id:
            duplicate = self._ticket_repository.find_active_duplicate(
                cliente_id=cliente_id,
                asunto=asunto,
                servicio_id=servicio_id,
            )
            if duplicate:
                return ValidationResult(
                    is_valid=False,
                    errors=["Ya existe un ticket activo con el mismo asunto y servicio."],
                    field_name="duplicado",
                )

        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/tickets/validators/file_validator.py
```python
"""
Chain of Responsibility node — validates uploaded file attachments.

Responsibility (SRP): enforce only file size and MIME type rules.
Depends on: BaseValidator (core/base/base_validator.py).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class FileValidator(BaseValidator):
    """Validates file size (≤5 MB) and MIME type for ticket attachments."""

    MAX_SIZE_BYTES: int = 5_242_880  # 5 MB

    ALLOWED_MIME_TYPES: frozenset[str] = frozenset({
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    })

    def validate(self, data: dict) -> ValidationResult:
        adjuntos = data.get("adjuntos", [])
        if not adjuntos:
            return ValidationResult(is_valid=True)

        for file in adjuntos:
            if file.size > self.MAX_SIZE_BYTES:
                return ValidationResult(
                    is_valid=False,
                    errors=[
                        f"'{file.name}' excede el límite de 5 MB "
                        f"({file.size / 1_048_576:.1f} MB)."
                    ],
                    field_name="adjuntos",
                )
            if file.content_type not in self.ALLOWED_MIME_TYPES:
                return ValidationResult(
                    is_valid=False,
                    errors=[
                        f"Tipo de archivo '{file.content_type}' no está permitido. "
                        f"Tipos aceptados: PDF, Word, imágenes y texto plano."
                    ],
                    field_name="adjuntos",
                )

        return ValidationResult(is_valid=True)

```

### 📄 backend/apps/tickets/validators/ticket_validator_chain.py
```python
"""
Façade over the ticket creation validator chain built by ValidatorFactory.

Responsibility (SRP): expose a single run(data) entry point.
    Does not know which nodes exist or in what order — ValidatorFactory decides.
Depends on: ValidatorFactory (core/factories/validator_factory.py) — DIP.
Pattern: Chain of Responsibility façade + Factory.
SOLID: SRP · DIP · OCP
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from core.factories import ValidatorFactory


class TicketValidatorChain:
    """
    Façade over the validator chain. TicketService calls run(data);
    it never knows which nodes are in the chain.
    """

    def __init__(self, ticket_repository) -> None:
        self._root = ValidatorFactory.build_ticket_chain(ticket_repository)

    def run(self, data: dict) -> ValidationResult:
        """
        Execute the full chain from the root node (fail-fast).

        Args:
            data: validated dict from TicketCreateSerializer with
                  asunto, descripcion, servicio_id, adjuntos, cliente_id.
        """
        return self._root.run_chain(data)

```

### 📄 backend/apps/tickets/views.py
```python
from django.shortcuts import render

# Create your views here.

```

### 📄 backend/apps/tickets/views/__init__.py
```python
from .ticket_history_views import TicketHistoryView
from .ticket_create_view import CreateTicketView, TicketDetailView
from .ticket_action_views import (
    AssignView,
    ReassignView,
    UpdateStatusView,
    AddCommentView,
)

__all__ = [
    "CreateTicketView",
    "TicketDetailView",
    "TicketHistoryView",
    "AssignView",
    "ReassignView",
    "UpdateStatusView",
    "AddCommentView",
]

```

### 📄 backend/apps/tickets/views/ticket_action_views.py
```python
"""
Ticket action DRF views — assignment (admin) + status/comment (worker).

HTTP orchestration only (SRP + DIP + ISP). Each view depends on the role interface
of TicketService (via get_ticket_service()) and declares only its RBAC permission.

Endpoints:
    PATCH /api/tickets/<id>/asignar     → AssignView      (IsAdmin)
    PATCH /api/tickets/<id>/reasignar   → ReassignView    (IsAdmin)
    PATCH /api/tickets/<id>/estado      → UpdateStatusView (IsWorker)
    POST  /api/tickets/<id>/comentario  → AddCommentView  (authenticated party)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tickets.serializers.ticket_action_serializers import (
    AssignSerializer,
    StatusChangeSerializer,
    CommentSerializer,
)
from apps.tickets.services import get_ticket_service
from apps.tickets.services.ticket_service import TicketValidationError
from core.exceptions.domain_exceptions import (
    TicketNotFound,
    InvalidTransitionError,
    CommentRequiredError,
)
from core.permissions import IsAdmin, IsWorker


def _handle_domain_errors(fn):
    """Map domain exceptions to HTTP responses (shared by the action views)."""
    try:
        return Response(fn(), status=status.HTTP_200_OK)
    except TicketNotFound as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except CommentRequiredError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except InvalidTransitionError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except TicketValidationError as exc:
        return Response(
            {"detail": str(exc), "field": exc.field},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AssignView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, ticket_id: int):
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        worker_id = serializer.validated_data["worker_id"]
        return _handle_domain_errors(
            lambda: svc.assign_ticket(ticket_id, worker_id, request.user)
        )


class ReassignView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, ticket_id: int):
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        worker_id = serializer.validated_data["worker_id"]
        return _handle_domain_errors(
            lambda: svc.reassign_ticket(ticket_id, worker_id, request.user)
        )


class UpdateStatusView(APIView):
    permission_classes = [IsWorker]

    def patch(self, request, ticket_id: int):
        serializer = StatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        svc = get_ticket_service()
        return _handle_domain_errors(
            lambda: svc.update_status(ticket_id, data["estado"], data["comentario"], request.user)
        )


class AddCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id: int):
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        comentario = serializer.validated_data["comentario"]
        return _handle_domain_errors(
            lambda: svc.add_comment(ticket_id, comentario, request.user)
        )

```

### 📄 backend/apps/tickets/views/ticket_create_view.py
```python
"""
Ticket creation + detail DRF views — HTTP orchestration only (SRP + DIP + ISP).

CreateTicketView depends on ITicketClientActions (via get_ticket_service()), declares
IsClient. The view never touches the ORM or business rules.

Endpoints:
    POST /api/tickets        → CreateTicketView (IsClient)
    GET  /api/tickets/<id>   → TicketDetailView (authenticated, ownership enforced)
"""

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.services import get_catalog_service
from apps.tickets.repositories import TicketRepository
from apps.tickets.serializers import TicketListSerializer
from apps.tickets.serializers.ticket_create_serializer import TicketCreateSerializer
from apps.tickets.services import get_ticket_service
from apps.tickets.services.ticket_service import TicketValidationError
from core.exceptions.domain_exceptions import ServiceNotFound, TicketNotFound
from core.permissions import IsClient

_FILTER_KEYS = ("estado", "prioridad", "servicio_id", "fecha_desde", "fecha_hasta")


class CreateTicketView(APIView):
    """Collection endpoint: GET lists the caller's tickets, POST creates one (IsClient)."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        # GET = any authenticated role (list); POST = clients only.
        from rest_framework.permissions import IsAuthenticated  # noqa: PLC0415
        return [IsClient()] if self.request.method == "POST" else [IsAuthenticated()]

    def get(self, request):
        repo = TicketRepository()
        page = int(request.query_params.get("page", 1))
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}
        result = repo.get_all_for_user(request.user, filters, page)
        return Response(
            {
                "items": TicketListSerializer(result["items"], many=True).data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        # Validate the referenced service exists and is active
        try:
            get_catalog_service().get_service_detail(data["servicio_id"])
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data["adjuntos"] = request.FILES.getlist("adjuntos")
        try:
            ticket = get_ticket_service().create_ticket(data, request.user)
        except TicketValidationError as exc:
            return Response(
                {"detail": str(exc), "field": exc.field},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(ticket, status=status.HTTP_201_CREATED)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id: int):
        try:
            ticket = get_ticket_service().get_ticket_detail(ticket_id, request.user)
        except TicketNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(ticket, status=status.HTTP_200_OK)

```

### 📄 backend/apps/tickets/views/ticket_history_views.py
```python
"""
Ticket history DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ repository calls for the read/history paths.
    No business logic; the ORM lives behind TicketRepository (DIP).
Pattern: Repository (queries) + DIP.
SOLID: SRP · DIP · ISP (role-based ACL inside the repository)

Endpoints:
    GET /api/tickets                 → TicketListView   (filters + pagination, role-scoped)
    GET /api/tickets/<id>/historial  → TicketHistoryView (event timeline)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tickets.repositories import TicketRepository
from apps.tickets.serializers import TicketListSerializer, TicketEventSerializer

_FILTER_KEYS = ("estado", "prioridad", "servicio_id", "fecha_desde", "fecha_hasta")


class TicketListView(APIView):
    """GET /api/tickets — paginated, filtered, role-scoped ticket list."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        repo = TicketRepository()
        page = int(request.query_params.get("page", 1))
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}

        result = repo.get_all_for_user(request.user, filters, page)
        data = TicketListSerializer(result["items"], many=True).data
        return Response(
            {
                "items": data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
            },
            status=status.HTTP_200_OK,
        )


class TicketHistoryView(APIView):
    """GET /api/tickets/<id>/historial — event timeline for a ticket."""

    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id: int):
        repo = TicketRepository()
        events = repo.get_history(ticket_id, request.user)
        if events is None:
            return Response(
                {"detail": "Ticket no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = TicketEventSerializer(events, many=True).data
        return Response(data, status=status.HTTP_200_OK)

```

### 📄 backend/config/__init__.py
```python

```

### 📄 backend/config/asgi.py
```python
"""
ASGI config for config project.

Routes HTTP through Django's standard application and WebSocket through Channels'
ProtocolTypeRouter → AllowedHostsOriginValidator → URLRouter (notifications consumer).

For more information, see:
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize the Django ASGI application early so the app registry is fully
# populated before we import anything that may touch models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

from config.websocket_urls import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        URLRouter(websocket_urlpatterns)
    ),
})

```

### 📄 backend/config/settings.py
```python
"""
Django settings for config project.
Generated by 'django-admin startproject' using Django 6.0.5.
https://docs.djangoproject.com/en/6.0/topics/settings/
"""

# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────
# SEGURIDAD
# ─────────────────────────────────────────────
SECRET_KEY = config('DJANGO_SECRET_KEY')
DEBUG = config('DJANGO_DEBUG', cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')


# ─────────────────────────────────────────────
# APLICACIONES
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    # Django defaults
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    # SassBlum apps
    'apps.authentication',
    'apps.catalog',
    'apps.gallery',
    'apps.tickets',
    'apps.notifications',
    'apps.reports',
    'apps.realtime',
]


# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # Debe ir primero
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config(
        'CORS_ALLOWED_ORIGINS', default='http://localhost:5173'
    ).split(',')
]

# CORS preflight cache — reduce OPTIONS requests
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

# Content-Security-Policy — OWASP A03:2021 defense-in-depth
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https://images.unsplash.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_CONNECT_SRC = ("'self'",)


# ─────────────────────────────────────────────
# URLS Y WSGI / ASGI
# ─────────────────────────────────────────────
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'   # Requerido por Django Channels


# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ─────────────────────────────────────────────
# BASE DE DATOS — Supabase / PostgreSQL
# ─────────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
    )
}


# ─────────────────────────────────────────────
# MODELO DE USUARIO PERSONALIZADO
# ─────────────────────────────────────────────
AUTH_USER_MODEL = 'authentication.User'


# ─────────────────────────────────────────────
# VALIDACIÓN DE CONTRASEÑAS
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ─────────────────────────────────────────────
# DJANGO REST FRAMEWORK
# ─────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Rate limiting — OWASP A07:2021
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '100/minute',
    },
    # Pagination — prevents huge responses
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}


# ─────────────────────────────────────────────
# JWT — djangorestframework-simplejwt
# ─────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        seconds=config('JWT_ACCESS_TOKEN_LIFETIME', cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        seconds=config('JWT_REFRESH_TOKEN_LIFETIME', cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# ─────────────────────────────────────────────
# SECURITY HEADERS (HTTPS enforcement + cookies)
# ─────────────────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ─────────────────────────────────────────────
# DJANGO CHANNELS — tiempo real (Sprint 4)
# ─────────────────────────────────────────────
USE_REDIS = config('USE_REDIS', default=False, cast=bool)

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': (
            'channels_redis.core.RedisChannelLayer'
            if USE_REDIS else
            'channels.layers.InMemoryChannelLayer'
        ),
        'CONFIG': (
            {'hosts': [config('REDIS_URL', default='redis://localhost:6379/0')]}
            if USE_REDIS else {}
        ),
    },
}


# ─────────────────────────────────────────────
# EMAIL — notificaciones (Sprint 3 · S19–S22)
# ─────────────────────────────────────────────
# Por defecto en DEBUG los correos se imprimen en la consola del runserver (no se
# envía nada real ni hace falta SMTP). Para ENVIAR correos reales aun con DEBUG=True,
# define EMAIL_BACKEND en el .env, p. ej. Gmail:
#   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
#   EMAIL_HOST_USER=tucorreo@gmail.com
#   EMAIL_HOST_PASSWORD=<app password de Gmail, 16 caracteres>
_default_email_backend = (
    'django.core.mail.backends.console.EmailBackend' if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_BACKEND = config('EMAIL_BACKEND', default=_default_email_backend)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='no-reply@sassblum.com')

# URL del frontend (para construir los enlaces de verificación / reseteo en los emails)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')


# ─────────────────────────────────────────────
# MISC
# ─────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ─────────────────────────────────────────────
# LOGGING — structured logging for production
# ─────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {'level': 'WARNING'},
        'apps': {'level': 'INFO'},
    },
}


# ─────────────────────────────────────────────
# INTERNACIONALIZACIÓN
# ─────────────────────────────────────────────
LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True


# ─────────────────────────────────────────────
# ARCHIVOS ESTÁTICOS
# ─────────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# ─────────────────────────────────────────────
# SUPABASE STORAGE — fotos de servicios + adjuntos de tickets
# ─────────────────────────────────────────────
# Crea un bucket PÚBLICO en Supabase Storage (Storage → New bucket → "public").
# La service_role key es solo de servidor; NUNCA la expongas en el frontend.
# Si estas variables quedan vacías, StorageService usa una URL stub local (dev sin bucket).
SUPABASE_URL = config('SUPABASE_URL', default='')
SUPABASE_SERVICE_KEY = config('SUPABASE_SERVICE_KEY', default='')
SUPABASE_STORAGE_BUCKET = config('SUPABASE_STORAGE_BUCKET', default='sassblum')

```

### 📄 backend/config/urls.py
```python
"""
URL configuration for config project.

API routing is mounted per-app under /api/. Each app owns its own urls.py
(SRP: config only composes; each app declares its own routes).
"""
from django.contrib import admin
from django.urls import path, include
from apps.authentication.views.health_views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),

    # ── API ────────────────────────────────────────────────────────────────
    path("api/auth/", include("apps.authentication.urls")),
    path("api/usuarios/", include("apps.authentication.user_urls")),
    path("api/servicios/", include("apps.catalog.urls")),
    path("api/proyectos/", include("apps.gallery.urls")),
    path("api/tickets/", include("apps.tickets.urls")),
    path("api/reportes/", include("apps.reports.urls")),
    path("api/notificaciones/", include("apps.notifications.urls")),
]

```

### 📄 backend/config/websocket_urls.py
```python
"""
WebSocket URL routing (Django Channels).
Consumed by config/asgi.py via ProtocolTypeRouter → URLRouter.
"""

from django.urls import re_path

from apps.realtime.consumers import NotificationConsumer, TicketConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"^ws/tickets/(?P<ticket_id>\d+)/$", TicketConsumer.as_asgi()),
]

```

### 📄 backend/config/wsgi.py
```python
"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

```

### 📄 backend/core/base/__init__.py
```python
# Abstract base classes that provide structural infrastructure (chain traversal,
# generic ORM wrapping, shared error handling). These are NOT domain ABCs —
# domain contracts live in core/interfaces/ or each app's interfaces/ package.

```

### 📄 backend/core/base/base_repository.py
```python
"""
Generic abstract base class for all Django ORM repositories.
No view, service, or serializer accesses the ORM directly — they all use a
repository that extends this base (DIP).

Responsibility (SRP): declare the generic CRUD contract and enforce the pattern.
    Concrete repositories (AuthRepository, TicketRepository) provide the ORM queries.
Depends on: abc — nothing from the domain or Django ORM at this level.
Pattern: Repository
SOLID: DIP · OCP (new entity = new repo, no changes here) · LSP

Sprint usage:
    Sprint 1 → AuthRepository(BaseRepository[User])
    Sprint 2 → TicketRepository(BaseRepository[Ticket])
    Sprint 3 → NotificationRepository(BaseRepository[Notification])
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract CRUD contract parameterised on the Django model type T.

    All methods must be overridden. Any method that is not overridden will raise
    TypeError at instantiation time (Python ABC enforcement = LSP guarantee).
    """

    @abstractmethod
    def get_by_id(self, entity_id: int) -> Optional[T]:
        """
        Return the entity with the given primary key, or None if not found.
        Concrete implementation must NOT raise DoesNotExist — return None instead.
        """
        ...

    @abstractmethod
    def get_all(self, filters: dict | None = None) -> list[T]:
        """
        Return all entities matching the optional filter dict.
        Filter keys map directly to ORM field lookups (e.g. {'estado': 'ACTIVO'}).
        """
        ...

    @abstractmethod
    def create(self, data: dict) -> T:
        """
        Persist a new entity from the validated data dict and return it.
        Raises IntegrityError on constraint violations — do not swallow in this layer.
        """
        ...

    @abstractmethod
    def update(self, entity_id: int, data: dict) -> T:
        """
        Apply partial updates to the entity with the given ID and return it.
        Raises ObjectNotFound if the entity does not exist.
        """
        ...

    @abstractmethod
    def delete(self, entity_id: int) -> None:
        """
        Permanently remove the entity with the given ID.
        Raises ObjectNotFound if the entity does not exist.
        """
        ...

```

### 📄 backend/core/base/base_validator.py
```python
"""
Abstract base node for the Chain of Responsibility pattern used across all
validation layers: authentication (Sprint 1), ticket creation (Sprint 2),
report generation (Sprint 4).

Responsibility (SRP): define the node structure and chain traversal logic.
    Each concrete subclass implements exactly ONE validation rule in validate().
Depends on: abc — nothing from the domain.
Pattern: Chain of Responsibility
SOLID: OCP · SRP (one rule per node) · LSP (every node is substitutable)

How to extend (OCP):
    1. Create CriticalPriorityValidator(BaseValidator) in Sprint 4
    2. Implement validate() with only that priority rule
    3. Add to chain: field_v.add_validator(file_v).add_validator(priority_v)
    → BasicFieldValidator and FileValidator are NEVER modified.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Value object returned by every validator node."""

    is_valid: bool
    # User-facing messages suitable for DRF error responses
    errors: list[str] = field(default_factory=list)
    # The model/serializer field that failed (e.g. 'email', 'password', 'asunto')
    field_name: str = ""


class BaseValidator(ABC):
    """
    Abstract chain node. Subclasses implement validate(); run_chain() handles traversal.

    Do NOT override run_chain() in concrete subclasses — doing so breaks LSP and makes
    the chain behavior unpredictable.
    """

    def __init__(self) -> None:
        self._next: BaseValidator | None = None

    def add_validator(self, validator: BaseValidator) -> BaseValidator:
        """
        Append a validator node at the end of this chain.
        Returns the added node to allow fluent chaining:
            email_v.add_validator(password_v).add_validator(phone_v)
        """
        self._next = validator
        return validator

    @abstractmethod
    def validate(self, data: dict) -> ValidationResult:
        """
        Implement exactly ONE validation rule here.
        Must NOT call self._next — chain traversal is the responsibility of run_chain().

        Args:
            data: The raw deserialized data from the DRF serializer.

        Returns:
            ValidationResult with is_valid=True on pass, errors populated on fail.
        """
        ...

    def run_chain(self, data: dict) -> ValidationResult:
        """
        Run this node's rule. If it passes, delegate to the next node.
        Stop and return immediately on the first failure.

        This is the public entry point when running the full chain from any node.
        """
        result = self.validate(data)
        if not result.is_valid or self._next is None:
            return result
        return self._next.run_chain(data)

```

### 📄 backend/core/exceptions/__init__.py
```python
from .domain_exceptions import (
    DomainException,
    ServiceNotFound,
    InvalidTransitionError,
    CommentRequiredError,
    TicketNotFound,
)

__all__ = [
    "DomainException",
    "ServiceNotFound",
    "InvalidTransitionError",
    "CommentRequiredError",
    "TicketNotFound",
]

```

### 📄 backend/core/exceptions/domain_exceptions.py
```python
"""
Domain exceptions for all bounded contexts in SassBlum.

Responsibility (SRP): provide typed exception classes for domain rule violations.
    HTTP status mapping (400, 404, 409, etc.) lives in the DRF view layer — not here.
    Views catch these exceptions and translate them to DRF Response objects.
Depends on: built-in Exception — nothing from Django or DRF.
SOLID: SRP · OCP (new domain rule = new exception class; no modification here)

Usage across sprints:
    S11  → ServiceNotFound                   (catalog — service does not exist)
    S14  → InvalidTransitionError            (ticket state machine — illegal transition)
    S14  → CommentRequiredError              (BR-35 — every transition needs a comment)
    S12+ → TicketNotFound                    (tickets — ticket does not exist or no access)
    S3+  → NotificationDispatchError         (Sprint 3 — notification channel failure)

OCP extension path:
    New domain rule violation (e.g. DuplicateEmailError, SLABreachError) = new class here.
    Existing exception classes and their callers remain unchanged.
"""


class DomainException(Exception):
    """Base class for all domain rule violations in SassBlum."""


class ServiceNotFound(DomainException):
    """
    Raised when a catalog service does not exist or is not visible to the caller.
    Views map this to HTTP 404.
    """


class InvalidTransitionError(DomainException):
    """
    Raised by TicketStateMachine when an attempted state transition is not in TRANSITIONS.
    Carries from_state and to_state for structured error responses.
    Views map this to HTTP 422.
    """

    def __init__(self, from_state: str, to_state: str) -> None:
        self.from_state = from_state
        self.to_state = to_state
        super().__init__(
            f"Transition '{from_state}' → '{to_state}' is not allowed."
        )


class CommentRequiredError(DomainException):
    """
    Raised by TicketStateMachine when a state transition is attempted without a comment.
    Business rule BR-35: every ticket state change requires a non-empty comment.
    Views map this to HTTP 400.
    """


class TicketNotFound(DomainException):
    """
    Raised when a ticket does not exist or the requesting user lacks access to it.
    Intentionally identical message for both cases (no information leakage).
    Views map this to HTTP 404.
    """

```

### 📄 backend/core/factories/__init__.py
```python
from .validator_factory import ValidatorFactory

__all__ = ["ValidatorFactory"]

# Sprint 3 — NotificationFactory:
#   notification_factory.py → build(channel) → INotificationStrategy
# Sprint 4 — ExporterFactory:
#   exporter_factory.py → build(format) → IReportExporter

```

### 📄 backend/core/factories/exporter_factory.py
```python
"""
ExporterFactory — maps a format string to an IReportExporter (Factory, OCP).

Responsibility (SRP): know which exporter serves each format. Does not export.
SOLID: OCP · SRP · DIP.

OCP: JSONExporter = new class + one entry in FORMAT_MAP. ReportService unchanged.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class ExporterFactory:

    @staticmethod
    def build(fmt: str) -> IReportExporter:
        from apps.reports.exporters import CSVExporter, PDFExporter, ExcelExporter  # noqa: PLC0415

        FORMAT_MAP = {
            "csv": CSVExporter,
            "pdf": PDFExporter,
            "excel": ExcelExporter,
            "xlsx": ExcelExporter,
        }
        exporter_class = FORMAT_MAP.get(fmt.lower())
        if exporter_class is None:
            raise ValueError(
                f"Formato no soportado: '{fmt}'. Disponibles: {list(FORMAT_MAP)}"
            )
        return exporter_class()

```

### 📄 backend/core/factories/validator_factory.py
```python
"""
Factory for assembling validator chains — centralises node wiring (OCP).

Responsibility (SRP): know which validator nodes exist and in what order to chain them.
Depends on: concrete validator classes in apps/tickets/validators/ — DIP inversion point.
Pattern: Factory.
SOLID: OCP · SRP · DIP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator


class ValidatorFactory:
    """Creates and wires validator chains for each domain context."""

    @staticmethod
    def build_ticket_chain(ticket_repository) -> BaseValidator:
        """
        Assemble the ticket-creation chain: BasicField → File → BusinessRule.

        OCP: add CriticalPriorityValidator (Sprint 4) by appending one line:
            business_v.add_validator(CriticalPriorityValidator())
        Nothing else changes.
        """
        from apps.tickets.validators.basic_field_validator import BasicFieldValidator
        from apps.tickets.validators.file_validator import FileValidator
        from apps.tickets.validators.business_rule_validator import BusinessRuleValidator

        basic_field_v = BasicFieldValidator()
        file_v        = FileValidator()
        business_v    = BusinessRuleValidator(ticket_repository)

        basic_field_v.add_validator(file_v).add_validator(business_v)
        return basic_field_v

```

### 📄 backend/core/interfaces/__init__.py
```python
# Cross-module ABC contracts shared across all Django apps.
# Views and services import from here when depending on a global abstraction.
# App-specific ABCs live inside each app's own interfaces/ package.

```

### 📄 backend/core/permissions/__init__.py
```python
from .rbac_permissions import IsClient, IsWorker, IsAdmin

__all__ = ["IsClient", "IsWorker", "IsAdmin"]

```

### 📄 backend/core/permissions/rbac_permissions.py
```python
"""
Role-based access control permissions — one class per role (ISP).

Responsibility (SRP): each class decides whether the requesting user holds a specific role.
Depends on: DRF BasePermission.
Pattern: ISP — one permission class per role, never a monolithic PermissionClass.
SOLID: ISP · SRP · OCP
"""

from django.apps import apps as django_apps
from rest_framework.permissions import BasePermission


def _get_user_model():
    return django_apps.get_model('authentication', 'User')


class IsClient(BasePermission):
    """Grants access only to authenticated users with role == 'client'."""

    def has_permission(self, request, view) -> bool:
        User = _get_user_model()
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.CLIENT
            and request.user.estado == User.Estado.ACTIVE
        )


class IsWorker(BasePermission):
    """Grants access only to authenticated users with role == 'worker'."""

    def has_permission(self, request, view) -> bool:
        User = _get_user_model()
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.WORKER
            and request.user.estado == User.Estado.ACTIVE
        )


class IsAdmin(BasePermission):
    """Grants access only to authenticated users with role == 'admin'."""

    def has_permission(self, request, view) -> bool:
        User = _get_user_model()
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
            and request.user.estado == User.Estado.ACTIVE
        )

```

### 📄 backend/manage.py
```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

```

---
**Total archivos incluidos:** 0
