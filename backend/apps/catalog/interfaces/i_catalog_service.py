"""
Root ABC for the catalog module.

Responsibility (SRP): declare the complete catalog operation contract.
    No HTTP logic, no ORM queries, no serialization — only method signatures.
Depends on: abc.ABC — nothing from the domain or Django.
Pattern: DIP anchor — CatalogService (Singleton) will implement this in S11.
SOLID: DIP · OCP · LSP

Sprint coverage:
    S11 → this file (contract only)
    S11 → CatalogService(ICatalogService, ICatalogClientView, ICatalogAdminView) — Singleton
    S18 → tests mock ICatalogService; views receive the mock without modification (LSP proof)

OCP extension path:
    New catalog operation (e.g. archive_service, duplicate_service) = new @abstractmethod here
    + implementation in CatalogService. ICatalogClientView and ICatalogAdminView remain frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogService(ABC):
    """Abstract contract for all catalog use cases."""

    @abstractmethod
    def get_active_services(self, filters: dict | None = None) -> list:
        """
        Return all services with activo=True.
        Optional filters: {'categoria': str, 'busqueda': str}
        Returns: list of ServiceSummary dicts.
        Raises: nothing — returns empty list if no services match.
        """
        ...

    @abstractmethod
    def get_service_detail(self, service_id: int) -> dict:
        """
        Return full detail of a single service.
        Returns: ServiceDetail dict.
        Raises: ServiceNotFound if service_id does not exist or is inactive.
        """
        ...

    @abstractmethod
    def create_service(self, data: dict) -> dict:
        """
        Create a new service entry in the catalog (admin only — enforced at view level).
        Args: data = validated dict from ServiceCreateSerializer
              (nombre: str, descripcion: str, categoria: str).
        Returns: created ServiceDetail dict.
        Raises: ValidationError if nombre already exists.
        """
        ...

    @abstractmethod
    def edit_service(self, service_id: int, data: dict) -> dict:
        """
        Partially update an existing service.
        Args: data = validated dict from ServiceEditSerializer (all fields optional).
        Returns: updated ServiceDetail dict.
        Raises: ServiceNotFound, ValidationError.
        """
        ...

    @abstractmethod
    def toggle_active(self, service_id: int) -> dict:
        """
        Flip the activo field: True → False or False → True.
        Returns: updated ServiceDetail dict with new activo value.
        Raises: ServiceNotFound.
        """
        ...
