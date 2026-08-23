"""
Report DRF views — HTTP orchestration (SRP + DIP). Admin-only.

    GET  /api/reportes/tickets   → dashboard KPIs/aggregations
    POST /api/reportes/exportar  → file download (csv|pdf|excel)
"""

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.services import get_report_service
from core.permissions import IsAdmin

_FILTER_KEYS = (
    "estado", "servicio_id", "fecha_desde", "fecha_hasta",
    "cliente_ruc", "cliente_nombre", "asignado_id",  # H#6 (cliente)
)


class ReportDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}
        return Response(get_report_service().get_dashboard(filters), status=status.HTTP_200_OK)


class ReportExportView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        fmt = request.data.get("formato", "excel")
        filters = {k: request.data[k] for k in _FILTER_KEYS if k in request.data}
        try:
            content, mime, filename = get_report_service().export(fmt, filters)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:  # missing optional lib (reportlab/openpyxl)
            return Response({"detail": str(exc)}, status=status.HTTP_501_NOT_IMPLEMENTED)

        response = HttpResponse(content, content_type=mime)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
