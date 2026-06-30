"""
ISP interface for client-facing catalog operations.

Responsibility (SRP): expose only the browse operations a CLIENT user needs.
    A client can see active services and view one in detail — nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — service_list_view (public DRF view) depends on this, not on ICatalogService.
SOLID: ISP · DIP · OCP

Why NOT a subset of ICatalogService:
    If ICatalogService grows with admin or internal methods, inheriting from it
    would force client consumers to know about those methods (ISP violation).
    This interface is intentionally isolated so that a client-facing component
    never sees admin operations.

CatalogService implements both ICatalogClientView AND ICatalogAdminView (LSP):
    The Singleton centralises logic while each view depends only on its role interface.

OCP extension:
    New read-only client operation (e.g. search_services) = new @abstractmethod here.
    ICatalogAdminView remains frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogClientView(ABC):
    """Browse contract — used by public service listing and ticket-creation flow."""

    @abstractmethod
    def get_active_services(self, filters: dict | None = None) -> list:
        """
        Browse the public catalog of active services.
        Optional filters: {'categoria': str, 'busqueda': str}
        Returns: list of ServiceSummary dicts (id, nombre, descripcion, categoria, activo).
        """
        ...

    @abstractmethod
    def get_service_detail(self, service_id: int) -> dict:
        """
        View full detail of one active service before creating a ticket.
        Returns: ServiceDetail dict (includes creadoEn, actualizadoEn).
        Raises: ServiceNotFound if not found or inactive.
        """
        ...
