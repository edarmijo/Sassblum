"""
UserAdminService — concrete IUserAdminActions (Singleton). HU-14 / D25.

Responsibility (SRP): admin user management. Separate from AuthService (session).
Depends on: UserRepository (DIP). Pattern: Singleton + Repository. SOLID: ISP·DIP·SRP·LSP.
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable

from django.conf import settings
from django.db import transaction

from apps.authentication.interfaces import (
    IMailboxProvider,
    IUserAdminActions,
    MailboxProviderError,
)
from apps.authentication.models import User, UserMailboxEvent
from apps.authentication.repositories import UserRepository
from apps.authentication.services.cpanel_mailbox_provider import build_mailbox_provider
from apps.authentication.services.credential_generator import (
    generate_temporary_credential,
)
from apps.authentication.services.password_policy import PasswordPolicy
from apps.authentication.services.token_service import TokenService
from apps.authentication.signals import password_sessions_revoked
from apps.authentication.validators import WorkerEmailDomainValidator
from core.base.base_validator import BaseValidator
from core.exceptions.domain_exceptions import DomainException

logger = logging.getLogger(__name__)
USER_NOT_FOUND_MESSAGE = "Usuario no encontrado."


class UserNotFound(DomainException):
    """Raised when a managed user does not exist."""


class MailboxOperationFailed(DomainException):
    """Una operación explícita de buzón no pudo confirmarse."""


class UserAdminService(IUserAdminActions):

    def __init__(
        self,
        user_repository: UserRepository | None = None,
        worker_email_validator: BaseValidator | None = None,
        mailbox_provider: IMailboxProvider | None = None,
        credential_generator: Callable[[], str] | None = None,
        password_policy: PasswordPolicy | None = None,
    ) -> None:
        self._repo = user_repository or UserRepository()
        self._worker_email_validator = (
            worker_email_validator
            or WorkerEmailDomainValidator(settings.WORKER_EMAIL_DOMAIN)
        )
        self._mailbox_provider = mailbox_provider
        self._credential_generator = (
            credential_generator or generate_temporary_credential
        )
        self._password_policy = password_policy or PasswordPolicy()

    def list_users(self, filters: dict | None = None) -> list:
        users = self._repo.get_all(filters or {})
        return [self._data(u) for u in users]

    def create_user(self, data: dict) -> dict:
        # Defensa en profundidad: el serializer ya restringe los roles, pero el
        # servicio garantiza por sí mismo que JAMÁS se cree un admin por esta vía
        # (regla de negocio: administrador único, solo vía createsuperuser).
        if data.get("role") == User.Role.ADMIN:
            raise DomainException("No se pueden crear administradores desde el panel.")
        validation = self._worker_email_validator.validate(data)
        if not validation.is_valid:
            raise DomainException(validation.errors[0])
        if self._repo.email_exists(data["email"]):
            raise DomainException("Ya existe una cuenta con ese correo.")
        role = data.get("role", User.Role.WORKER)
        mailbox_management = User.BuzonGestion.NOT_APPLICABLE
        if role == User.Role.WORKER:
            mailbox_management = (
                User.BuzonGestion.UAPI
                if self._mailbox_provider is not None
                else User.BuzonGestion.MANUAL
            )
        user = self._repo.create({
            "email": data["email"],
            "first_name": data.get("nombre", ""),
            "last_name": data.get("apellido", ""),
            "password": data["password"],
            "role": role,
            "estado": User.Estado.ACTIVE,
            "email_verificado": True,  # admin-created accounts are pre-verified
            "buzon_estado": (
                User.BuzonEstado.PENDING
                if role == User.Role.WORKER
                else User.BuzonEstado.NOT_APPLICABLE
            ),
            "buzon_gestion": mailbox_management,
        })
        if role != User.Role.WORKER:
            return self._data(user)
        return self._ensure_mailbox(user)

    def update_user(self, user_id: int, data: dict) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        changes = {}
        if "nombre" in data:
            changes["first_name"] = data["nombre"]
        if "apellido" in data:
            changes["last_name"] = data["apellido"]
        user = self._repo.update(user_id, changes)
        return self._data(user)

    def block_user(self, user_id: int) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        user = self._repo.update(user_id, {"estado": User.Estado.BLOCKED})
        return self._data(user)

    def unblock_user(self, user_id: int) -> dict:
        if self._repo.get_by_id(user_id) is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        user = self._repo.update(user_id, {
            "estado": User.Estado.ACTIVE,
            "intentos_fallidos": 0,
        })
        return self._data(user)

    def retry_mailbox(self, user_id: int) -> dict:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        if user.role != User.Role.WORKER:
            raise DomainException("Solo los trabajadores administran un buzón corporativo.")
        return self._ensure_mailbox(user)

    def confirm_manual_mailbox(self, user_id: int, email: str, actor: User) -> dict:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        self._validate_manual_mailbox_confirmation(user, email)

        with transaction.atomic():
            locked_user = self._repo.get_by_id_for_update(user_id)
            if locked_user is None:
                raise UserNotFound(USER_NOT_FOUND_MESSAGE)
            self._validate_manual_mailbox_confirmation(locked_user, email)
            if (
                locked_user.buzon_estado == User.BuzonEstado.CREATED
                and locked_user.buzon_gestion == User.BuzonGestion.MANUAL
            ):
                return self._data(locked_user)
            if locked_user.buzon_gestion == User.BuzonGestion.UAPI:
                raise DomainException(
                    "Este buzón está configurado para gestión UAPI y no puede confirmarse manualmente."
                )
            self._repo.save_mailbox_state(
                locked_user,
                User.BuzonEstado.CREATED,
                User.BuzonGestion.MANUAL,
            )
            self._repo.record_mailbox_event(
                locked_user,
                actor,
                UserMailboxEvent.Action.MANUAL_CONFIRMED,
            )
        return self._data(locked_user)

    def rotate_occupant(self, user_id: int, data: dict, actor: User) -> dict:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        if user.role != User.Role.WORKER:
            raise DomainException("Solo se puede rotar el ocupante de un trabajador.")
        if self._mailbox_provider is None:
            raise MailboxOperationFailed(
                "El proveedor de buzones no está habilitado; no se cambió el ocupante."
            )

        application_credential = self._credential_generator()
        mailbox_credential = self._credential_generator()
        self._password_policy.validate(application_credential)

        try:
            if not self._mailbox_provider.mailbox_exists(user.email):
                raise MailboxOperationFailed(
                    "El buzón no existe todavía; reintenta su creación antes de rotar."
                )
            self._mailbox_provider.rotate_credential(
                user.email,
                mailbox_credential,
            )
        except MailboxProviderError as exc:
            logger.warning(
                "No se confirmó la rotación del buzón para user_id=%s (%s)",
                user_id,
                type(exc).__name__,
            )
            raise MailboxOperationFailed(
                "No se pudo confirmar la rotación con cPanel; no se cambió el ocupante."
            ) from exc

        result = self._complete_occupant_rotation(
            user_id,
            data,
            actor,
            application_credential,
        )
        result["buzon_password"] = mailbox_credential
        return result

    def rotate_occupant_manually(
        self,
        user_id: int,
        data: dict,
        actor: User,
    ) -> dict:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise UserNotFound(USER_NOT_FOUND_MESSAGE)
        if user.role != User.Role.WORKER:
            raise DomainException("Solo se puede rotar el ocupante de un trabajador.")
        self._validate_manual_mailbox_confirmation(
            user,
            data["email_confirmacion"],
        )
        if not data.get("rotacion_buzon_confirmada"):
            raise DomainException(
                "Debes confirmar que la contraseña del buzón ya cambió en cPanel."
            )
        if (
            user.buzon_estado != User.BuzonEstado.CREATED
            or user.buzon_gestion != User.BuzonGestion.MANUAL
        ):
            raise DomainException(
                "Confirma primero que el buzón manual existe en cPanel."
            )

        application_credential = self._credential_generator()
        self._password_policy.validate(application_credential)
        return self._complete_occupant_rotation(
            user_id,
            data,
            actor,
            application_credential,
            mailbox_action=UserMailboxEvent.Action.MANUAL_ROTATED,
            required_management=User.BuzonGestion.MANUAL,
        )

    def _ensure_mailbox(self, user: User) -> dict:
        if self._mailbox_provider is None:
            return self._data(user)

        try:
            if self._mailbox_provider.mailbox_exists(user.email):
                return self._mark_mailbox_created(user)

            mailbox_credential = self._credential_generator()
            self._mailbox_provider.create_mailbox(user.email, mailbox_credential)
            result = self._mark_mailbox_created(user)
            result["buzon_password"] = mailbox_credential
            return result
        except MailboxProviderError as exc:
            logger.warning(
                "Buzón pendiente para user_id=%s (%s)",
                user.pk,
                type(exc).__name__,
            )
            # Puede existir si cPanel completó la operación pero se perdió la
            # respuesta. Reconciliar sin devolver una credencial no confirmada.
            try:
                if self._mailbox_provider.mailbox_exists(user.email):
                    return self._mark_mailbox_created(user)
            except MailboxProviderError:
                pass
            return self._data(user)

    def _mark_mailbox_created(self, user: User) -> dict:
        user = self._repo.update(
            user.pk,
            {
                "buzon_estado": User.BuzonEstado.CREATED,
                "buzon_gestion": User.BuzonGestion.UAPI,
            },
        )
        return self._data(user)

    def _complete_occupant_rotation(
        self,
        user_id: int,
        data: dict,
        actor: User,
        application_credential: str,
        mailbox_action: str | None = None,
        required_management: str | None = None,
    ) -> dict:
        with transaction.atomic():
            locked_user = self._repo.get_by_id_for_update(user_id)
            if locked_user is None:
                raise UserNotFound(USER_NOT_FOUND_MESSAGE)
            if (
                required_management is not None
                and (
                    locked_user.buzon_estado != User.BuzonEstado.CREATED
                    or locked_user.buzon_gestion != required_management
                )
            ):
                raise DomainException(
                    "El modo de gestión del buzón cambió; no se modificó el ocupante."
                )
            previous_first_name = locked_user.first_name
            previous_last_name = locked_user.last_name
            self._repo.save_rotated_occupant(
                locked_user,
                data["nombre"],
                data["apellido"],
                application_credential,
            )
            self._repo.record_occupant_change(
                locked_user,
                actor,
                previous_first_name,
                previous_last_name,
                data["nombre"],
                data["apellido"],
            )
            if mailbox_action is not None:
                self._repo.record_mailbox_event(
                    locked_user,
                    actor,
                    mailbox_action,
                )
            TokenService().invalidate_sessions(locked_user)

        password_sessions_revoked.send(
            sender=UserAdminService,
            user_id=locked_user.pk,
        )
        result = self._data(locked_user)
        result["app_password"] = application_credential
        return result

    @staticmethod
    def _validate_manual_mailbox_confirmation(user: User, email: str) -> None:
        if user.role != User.Role.WORKER:
            raise DomainException("Solo los trabajadores administran un buzón corporativo.")
        if email.strip().casefold() != user.email.strip().casefold():
            raise DomainException(
                "El correo de confirmación no coincide con la cuenta del trabajador."
            )

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
            "buzon_estado": u.buzon_estado,
            "buzon_gestion": u.buzon_gestion,
        }


_lock = threading.Lock()
_instance: UserAdminService | None = None


def get_user_admin_service() -> UserAdminService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = UserAdminService(
                    mailbox_provider=build_mailbox_provider(),
                )
    return _instance
