"""
ISP interface for file storage operations — segregated from ITicketService.

Responsibility (SRP): declare the contract for uploading, retrieving, and deleting files.
    No ticket logic, no authentication — only storage I/O signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP + DIP — TicketService receives IStorageService via constructor;
    the concrete implementation (SupabaseStorageService or S3StorageService) is
    injected without modifying TicketService or FileUpload (LSP).
SOLID: ISP · DIP · LSP · OCP

Why segregated from ITicketService:
    TicketService has no reason to know about storage details (ISP).
    CatalogService could also use IStorageService for service images in a future sprint
    without coupling to ticket internals.

OCP extension:
    New storage provider (GCS, Azure Blob) = new class that implements IStorageService.
    TicketService and FileUpload remain unchanged (DIP).

Sprint usage:
    S12 → this contract (stub)
    S12 → SupabaseStorageService(IStorageService) — concrete implementation
    FileUpload component (FE) delegates to the IStorageService injected by useTickets hook.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IStorageService(ABC):
    """Abstract contract for binary file storage."""

    @abstractmethod
    def upload(self, file, path: str) -> str:
        """
        Upload a file to the configured storage backend.

        Args:
            file: a file-like object (Django InMemoryUploadedFile or TemporaryUploadedFile)
            path: destination path in the storage bucket
                  (e.g. 'tickets/T-2026-0001/factura.pdf')

        Returns:
            str — public or signed URL of the uploaded file.

        Raises:
            StorageUploadError — if the backend rejects the file.
        """
        ...

    @abstractmethod
    def delete(self, path: str) -> None:
        """
        Permanently remove a file from the storage backend.

        Args:
            path: the same path used when uploading.

        Raises:
            StorageDeleteError — if the file does not exist or deletion fails.
        """
        ...

    @abstractmethod
    def get_url(self, path: str) -> str:
        """
        Return a (possibly signed) URL for an existing file.

        Args:
            path: the storage path of the file.

        Returns:
            str — accessible URL (may be time-limited for private buckets).

        Raises:
            StorageFileNotFound — if no file exists at the given path.
        """
        ...
