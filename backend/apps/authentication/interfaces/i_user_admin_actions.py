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
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.authentication.models import User


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
    def update_user(self, user_id: int, data: dict) -> dict:
        """Update only the managed user's first and/or last name."""
        ...

    @abstractmethod
    def block_user(self, user_id: int) -> dict:
        """Set estado = BLOQUEADO. Returns updated UserData."""
        ...

    @abstractmethod
    def unblock_user(self, user_id: int) -> dict:
        """Set estado = ACTIVO and reset failed attempts. Returns updated UserData."""
        ...

    @abstractmethod
    def retry_mailbox(self, user_id: int) -> dict:
        """Reintenta idempotentemente el buzón corporativo de un trabajador."""
        ...

    @abstractmethod
    def confirm_manual_mailbox(self, user_id: int, email: str, actor: User) -> dict:
        """Registra que el administrador creó el buzón manualmente en cPanel."""
        ...

    @abstractmethod
    def rotate_occupant(self, user_id: int, data: dict, actor: User) -> dict:
        """Cambia el ocupante y rota ambas credenciales sin alterar el correo."""
        ...

    @abstractmethod
    def rotate_occupant_manually(
        self,
        user_id: int,
        data: dict,
        actor: User,
    ) -> dict:
        """Cambia el ocupante tras confirmar la rotación manual del buzón."""
        ...
