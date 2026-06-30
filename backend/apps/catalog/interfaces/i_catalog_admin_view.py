"""
ISP interface for admin-only catalog management operations.

Responsibility (SRP): expose only the management operations an ADMIN user needs.
    An admin creates, edits, and toggles services — no client-browse semantics.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — service_admin_view (DRF view with IsAdmin permission) depends on this.
SOLID: ISP · DIP · OCP

Why separate from ICatalogClientView:
    The admin view does not use getActiveServices with the same semantics as a client
    browsing the catalog. Merging both into one interface would force the admin DRF view
    to depend on methods it never calls (ISP violation).

CatalogService implements both ICatalogAdminView AND ICatalogClientView (LSP):
    Any implementation that satisfies these two interfaces is substitutable in tests.

OCP extension:
    New admin operation (e.g. bulk_toggle, duplicate_service) = new @abstractmethod here.
    ICatalogClientView remains frozen.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ICatalogAdminView(ABC):
    """Management contract — used exclusively by admin-facing DRF views."""

    @abstractmethod
    def create_service(self, data: dict) -> dict:
        """
        Create a new service entry in the catalog.
        Args: validated dict from ServiceCreateSerializer.
        Returns: created ServiceDetail dict.
        Raises: ValidationError on duplicate nombre.
        """
        ...

    @abstractmethod
    def edit_service(self, service_id: int, data: dict) -> dict:
        """
        Partially update fields of an existing service.
        Args: validated dict from ServiceEditSerializer (all fields optional).
        Returns: updated ServiceDetail dict.
        Raises: ServiceNotFound, ValidationError.
        """
        ...

    @abstractmethod
    def toggle_active(self, service_id: int) -> dict:
        """
        Enable or disable a service in the public catalog.
        Returns: updated ServiceDetail dict with new activo value.
        Raises: ServiceNotFound.
        """
        ...
