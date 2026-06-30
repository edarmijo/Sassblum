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
