"""Contrato segregado para gestionar buzones corporativos (B15)."""

from __future__ import annotations

from abc import ABC, abstractmethod


class MailboxProviderError(Exception):
    """Fallo seguro del proveedor; nunca contiene credenciales."""


class MailboxProviderUnavailable(MailboxProviderError):
    """El proveedor no pudo confirmar la operación."""


class MailboxProviderRejected(MailboxProviderError):
    """El proveedor rechazó una operación válida."""


class IMailboxProvider(ABC):
    """ISP/DIP: operaciones mínimas requeridas por la administración de cuentas."""

    @abstractmethod
    def mailbox_exists(self, email: str) -> bool:
        """Indica si el buzón completo existe en el proveedor."""
        ...

    @abstractmethod
    def create_mailbox(self, email: str, credential: str) -> None:
        """Crea un buzón con una credencial efímera proporcionada por el servicio."""
        ...

    @abstractmethod
    def rotate_credential(self, email: str, credential: str) -> None:
        """Reemplaza la credencial de un buzón existente."""
        ...
