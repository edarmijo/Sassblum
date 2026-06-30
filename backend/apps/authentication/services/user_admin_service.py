"""
UserAdminService — concrete IUserAdminActions (Singleton). HU-14 / D25.

Responsibility (SRP): admin user management. Separate from AuthService (session).
Depends on: UserRepository (DIP). Pattern: Singleton + Repository. SOLID: ISP·DIP·SRP·LSP.
"""

from __future__ import annotations

import threading

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
