"""
TicketRepository — encapsulates all ORM access for tickets (Repository).

Responsibility (SRP): every Ticket / TicketEvent query lives here. No view or
    service touches the ORM directly (DIP). Uses select_related/prefetch_related
    to avoid N+1 queries.
Depends on: BaseRepository[Ticket], Ticket, TicketEvent models.
Pattern: Repository.
SOLID: DIP · SRP · LSP

Role-based ACL (ISP/RBAC, inherited from S9/S15):
    CLIENTE     → only own tickets (cliente=user)
    TRABAJADOR  → only assigned tickets (asignado=user)
    ADMIN       → all tickets
"""

from __future__ import annotations

from typing import Optional

from django.db.models import Q

from core.base.base_repository import BaseRepository
from apps.tickets.models import Ticket, TicketEvent

PAGE_SIZE = 20
_ACTIVE_STATES = ["Nuevo", "EnProceso", "EnEspera", "Resuelto"]


class TicketRepository(BaseRepository[Ticket]):
    """ORM gateway for the tickets module."""

    # ── Generic CRUD (BaseRepository contract) ─────────────────────────────────

    def get_by_id(self, entity_id: int) -> Optional[Ticket]:
        return (
            Ticket.objects
            .select_related("servicio", "cliente", "asignado")
            .filter(pk=entity_id)
            .first()
        )

    def get_by_id_for_update(self, entity_id: int) -> Optional[Ticket]:
        """Lock a ticket row while an assignment transaction decides its outcome."""
        return (
            Ticket.objects
            .select_for_update(of=("self",))
            .select_related("servicio", "cliente", "asignado")
            .filter(pk=entity_id)
            .first()
        )

    def get_all(self, filters: dict | None = None) -> list[Ticket]:
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Ticket:
        return Ticket.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Ticket:
        Ticket.objects.filter(pk=entity_id).update(**data)
        return self.get_by_id(entity_id)

    def delete(self, entity_id: int) -> None:
        Ticket.objects.filter(pk=entity_id).delete()

    # ── Role-scoped listing with filters + pagination ──────────────────────────

    def get_all_for_user(self, user, filters: dict | None = None, page: int = 1) -> dict:
        """
        Return a page of tickets visible to `user`, applying role-based ACL and
        optional filters (estado, prioridad, servicio_id, fecha_desde, fecha_hasta).

        Returns: {'items': list[Ticket], 'total': int, 'page': int, 'page_size': int}
        """
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")

        # Role-based scope
        role = getattr(user, "role", None)
        if role == "client":
            qs = qs.filter(cliente=user)
        elif role == "worker":
            qs = qs.filter(asignado=user)
        # admin → no scope filter (sees all)

        qs = self._apply_filters(qs, filters or {})

        total = qs.count()
        start = (max(page, 1) - 1) * PAGE_SIZE
        items = list(qs[start:start + PAGE_SIZE])

        return {"items": items, "total": total, "page": page, "page_size": PAGE_SIZE}

    @staticmethod
    def _apply_filters(qs, filters: dict):
        if estado := filters.get("estado"):
            qs = qs.filter(estado=estado)
        if prioridad := filters.get("prioridad"):
            qs = qs.filter(prioridad=prioridad)
        if servicio_id := filters.get("servicio_id"):
            qs = qs.filter(servicio_id=servicio_id)
        if fecha_desde := filters.get("fecha_desde"):
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta := filters.get("fecha_hasta"):
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        if cliente_id := filters.get("cliente_id"):
            qs = qs.filter(cliente_id=cliente_id)
        if asignado_id := filters.get("asignado_id"):
            qs = qs.filter(asignado_id=asignado_id)
        return qs

    # ── History (timeline of events) ───────────────────────────────────────────

    def get_history(self, ticket_id: int, user) -> Optional[list[TicketEvent]]:
        """
        Return the chronological event timeline for a ticket the user may see.
        Returns None if the ticket does not exist or the user lacks access.
        """
        ticket = self.get_by_id(ticket_id)
        if ticket is None or not self._user_can_see(ticket, user):
            return None
        return list(
            TicketEvent.objects
            .select_related("autor")
            .filter(ticket_id=ticket_id)
            .order_by("created_at")
        )

    @staticmethod
    def _user_can_see(ticket: Ticket, user) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        return ticket.cliente_id == user.id

    # ── Duplicate detection (used by BusinessRuleValidator, S13) ───────────────

    def find_active_duplicate(self, cliente_id: int, asunto: str, servicio_id: int):
        """
        Return an existing active ticket with the same client + subject + service,
        or None. For reporting, an active ticket is one not currently in 'Cerrado'.
        """
        return (
            Ticket.objects
            .filter(
                Q(cliente_id=cliente_id)
                & Q(asunto__iexact=asunto.strip())
                & Q(servicio_id=servicio_id)
                & Q(estado__in=_ACTIVE_STATES)
            )
            .first()
        )
