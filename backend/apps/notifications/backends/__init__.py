"""Custom Django email backends."""

from .cpanel_relay_backend import CpanelRelayBackend

__all__ = ["CpanelRelayBackend"]
