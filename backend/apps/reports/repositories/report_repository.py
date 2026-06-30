"""
ReportRepository — aggregation queries for reports (Repository).
The view never touches the ORM. SOLID: DIP · SRP.
"""

from __future__ import annotations

from django.db.models import Count, Q

from apps.tickets.models import Ticket


class ReportRepository:

    def _filtered(self, filters: dict | None):
        qs = Ticket.objects.select_related("servicio", "cliente", "asignado")
        filters = filters or {}
        if estado := filters.get("estado"):
            qs = qs.filter(estado=estado)
        if servicio_id := filters.get("servicio_id"):
            qs = qs.filter(servicio_id=servicio_id)
        if fecha_desde := filters.get("fecha_desde"):
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta := filters.get("fecha_hasta"):
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        # H#6 (cliente): Filtros avanzados por cliente y técnico
        if cliente_ruc := filters.get("cliente_ruc"):
            qs = qs.filter(cliente__ruc__icontains=cliente_ruc)
        if cliente_nombre := filters.get("cliente_nombre"):
            qs = qs.filter(
                Q(cliente__first_name__icontains=cliente_nombre)
                | Q(cliente__last_name__icontains=cliente_nombre)
                | Q(cliente__email__icontains=cliente_nombre)
            )
        if asignado_id := filters.get("asignado_id"):
            qs = qs.filter(asignado_id=asignado_id)
        return qs

    def summary(self, filters: dict | None = None) -> dict:
        qs = self._filtered(filters)
        by_estado = dict(
            qs.values_list("estado").annotate(n=Count("id")).values_list("estado", "n")
        )
        by_prioridad = dict(
            qs.values_list("prioridad").annotate(n=Count("id")).values_list("prioridad", "n")
        )
        total = qs.count()
        abiertos = sum(v for k, v in by_estado.items() if k != "Cerrado")
        return {
            "total": total,
            "abiertos": abiertos,
            "cerrados": by_estado.get("Cerrado", 0),
            "por_estado": by_estado,
            "por_prioridad": by_prioridad,
        }

    def rows(self, filters: dict | None = None) -> list[dict]:
        qs = self._filtered(filters).order_by("-created_at")
        return [
            {
                "numero": t.numero,
                "asunto": t.asunto,
                "estado": t.estado,
                "prioridad": t.prioridad,
                "servicio": t.servicio.nombre if t.servicio_id else "",
                "cliente": t.cliente.email if t.cliente_id else "",
                "asignado": t.asignado.email if t.asignado_id else "",
                "creado_en": t.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for t in qs
        ]
