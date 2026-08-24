"""
ABC contracts specific to the authentication module.
All views and services inside apps/authentication/ import from here.
No other app should import directly from this package (ISP).
"""

from .i_auth_service import IAuthService
from .i_mailbox_provider import (
    IMailboxProvider,
    MailboxProviderError,
    MailboxProviderRejected,
    MailboxProviderUnavailable,
)
from .i_user_admin_actions import IUserAdminActions

__all__ = [
    "IAuthService",
    "IMailboxProvider",
    "IUserAdminActions",
    "MailboxProviderError",
    "MailboxProviderRejected",
    "MailboxProviderUnavailable",
]
