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
