"""
ABC contracts specific to the authentication module.
All views and services inside apps/authentication/ import from here.
No other app should import directly from this package (ISP).
"""

from .i_auth_service import IAuthService
from .i_user_admin_actions import IUserAdminActions

__all__ = ["IAuthService", "IUserAdminActions"]
