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
