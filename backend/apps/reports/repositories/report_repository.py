"""
ReportRepository — aggregation queries for reports (Repository).
The view never touches the ORM. SOLID: DIP · SRP.
"""

from __future__ import annotations

from django.db.models import Count, Q

from apps.tickets.models import Ticket

_DESC_MAX_LEN = 200


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
                | Q(cliente__empresa__icontains=cliente_nombre)
            )
        if cliente_email := filters.get("cliente_email"):
            qs = qs.filter(cliente__email__icontains=cliente_email)
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
        rows = []
        for t in qs:
            # Datos del cliente
            cliente_empresa = t.cliente.empresa if t.cliente_id else ""
            cliente_ruc = t.cliente.ruc if t.cliente_id else ""
            cliente_email = t.cliente.email if t.cliente_id else ""
            # Datos del asignado
            if t.asignado_id:
                asig_first = t.asignado.first_name or ""
                asig_last = t.asignado.last_name or ""
                asignado_nombre = f"{asig_first} {asig_last}".strip() or t.asignado.email
                asignado_email = t.asignado.email
            else:
                asignado_nombre = ""
                asignado_email = ""
            # Descripción truncada para evitar celdas PDF demasiado grandes
            descripcion = (t.descripcion or "")
            if len(descripcion) > _DESC_MAX_LEN:
                descripcion = descripcion[:_DESC_MAX_LEN] + "…"
            rows.append({
                "numero": t.numero,
                "asunto": t.asunto,
                "estado": t.estado,
                "prioridad": t.prioridad,
                "servicio": t.servicio.nombre if t.servicio_id else "",
                "empresa_cliente": cliente_empresa,
                "ruc_cliente": cliente_ruc,
                "cliente_email": cliente_email,
                "asignado_nombre": asignado_nombre,
                "asignado_email": asignado_email,
                "descripcion": descripcion,
                "creado_en": t.created_at.strftime("%Y-%m-%d %H:%M"),
            })
        return rows

