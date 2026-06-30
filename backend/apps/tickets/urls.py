"""
URL routing for the tickets API. Mounted under /api/tickets/ by config/urls.py.

    GET   /api/tickets                  → list (role-scoped, filters, pagination)
    POST  /api/tickets                  → create (IsClient)
    GET   /api/tickets/<id>             → detail
    GET   /api/tickets/<id>/historial   → event timeline
    PATCH /api/tickets/<id>/asignar     → assign   (IsAdmin)
    PATCH /api/tickets/<id>/reasignar   → reassign (IsAdmin)
    PATCH /api/tickets/<id>/estado      → update status (IsWorker)
    POST  /api/tickets/<id>/comentario  → add comment
"""

from django.urls import path

from apps.tickets.views import (
    CreateTicketView,
    TicketDetailView,
    TicketHistoryView,
    AssignView,
    ReassignView,
    UpdateStatusView,
    AddCommentView,
)

urlpatterns = [
    path("", CreateTicketView.as_view(), name="ticket-collection"),
    path("<int:ticket_id>", TicketDetailView.as_view(), name="ticket-detail"),
    path("<int:ticket_id>/historial", TicketHistoryView.as_view(), name="ticket-history"),
    path("<int:ticket_id>/asignar", AssignView.as_view(), name="ticket-assign"),
    path("<int:ticket_id>/reasignar", ReassignView.as_view(), name="ticket-reassign"),
    path("<int:ticket_id>/estado", UpdateStatusView.as_view(), name="ticket-status"),
    path("<int:ticket_id>/comentario", AddCommentView.as_view(), name="ticket-comment"),
]
