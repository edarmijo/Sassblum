"""
TicketService — concrete implementation of the three ISP ticket interfaces (Singleton).

Responsibility (SRP): ticket business logic. Generates T-YYYY-NNNN, runs the validator
    chain (S13), drives the state machine (S14), persists via TicketRepository (S24),
    stores attachments via StorageService, and creates TicketEvents (which fire the
    Observer → notifications). Implements Client/Worker/Admin actions (LSP); each view
    depends on its role interface (DIP + ISP).
Depends on: TicketRepository, TicketValidatorChain, TicketStateMachine, IStorageService.
Pattern: Singleton + Repository + Chain of Responsibility + Strategy (state machine).
SOLID: DIP · SRP · LSP · ISP · OCP
"""

from __future__ import annotations

from datetime import datetime

from django.db import transaction

from apps.tickets.interfaces import (
    ITicketClientActions,
    ITicketWorkerActions,
    ITicketAdminActions,
)
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.repositories import TicketRepository
from apps.tickets.state_machine import TicketStateMachine
from apps.tickets.validators import TicketValidatorChain
from apps.tickets.services.storage_service import StorageService
from core.exceptions.domain_exceptions import (
    TicketNotFound,
    InvalidTransitionError,
    CommentRequiredError,
)

TICKETNOTFOUND = "Ticket no encontrado."


class TicketValidationError(Exception):
    def __init__(self, field: str, message: str) -> None:
        self.field = field
        super().__init__(message)


class TicketService(ITicketClientActions, ITicketWorkerActions, ITicketAdminActions):

    def __init__(self, repository=None, storage=None) -> None:
        self._repo: TicketRepository = repository or TicketRepository()
        self._storage = storage or StorageService()
        self._machine = TicketStateMachine()
        self._chain = TicketValidatorChain(self._repo)

    # ── ITicketClientActions ───────────────────────────────────────────────────

    @transaction.atomic
    @transaction.atomic
    def create_ticket(self, data: dict, user) -> dict:
        validation_payload = {
            "asunto": data.get("asunto", ""),
            "descripcion": data.get("descripcion", ""),
            "adjuntos": data.get("adjuntos", []),
            "cliente_id": user.id,
            "servicio_id": data.get("servicio_id"),
        }
        result = self._chain.run(validation_payload)
        if not result.is_valid:
            raise TicketValidationError(result.field_name, "; ".join(result.errors))

        numero = self.generate_ticket_number(datetime.now().year)
        contacto_nombre = f"{user.first_name} {user.last_name}".strip() or user.email
        ticket = self._repo.create({
            "numero": numero,
            "asunto": data["asunto"],
            "descripcion": data["descripcion"],
            "servicio_id": data["servicio_id"],
            "cliente": user,
            "contacto_nombre": contacto_nombre,
            "contacto_ruc": user.ruc,
            "contacto_empresa": user.empresa,
            "estado": Ticket.Estado.NUEVO,
            "prioridad": data.get("prioridad", Ticket.Prioridad.MEDIA),
        })

        # Regla de negocio: los tickets NO almacenan archivos/fotos. Las imágenes
        # se gestionan por WhatsApp (decisión del cliente). Solo Servicios y
        # Galería (Proyectos) guardan imágenes. Por eso no se crean Attachments aquí.

        # Audit event → fires the Observer (notifications)
        TicketEvent.objects.create(
            ticket=ticket,
            autor=user,
            tipo_evento=TicketEvent.TipoEvento.CREACION,
            comentario="Ticket creado.",
        )
        return self._detail(ticket)

    def generate_ticket_number(self, year: int) -> str:
        """Generate the next ticket number atomically (prevents race conditions).

        PostgreSQL no permite `FOR UPDATE` junto a una función de agregado, así que
        se serializa la numeración con un *advisory lock* de transacción
        (`pg_advisory_xact_lock`): se libera automáticamente al terminar la
        transacción. Debe ejecutarse dentro de una transacción (create_ticket lo
        envuelve en `@transaction.atomic`, por lo que el lock se mantiene hasta que
        el ticket queda insertado). En otros motores, usados para pruebas locales,
        el repositorio omite el lock y conserva la consulta portable.
        """
        with transaction.atomic():
            self._repo.lock_ticket_number_sequence(year)
            max_num = self._repo.get_max_ticket_sequence(year)
            return f"T-{year}-{max_num + 1:04d}"

    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        result = self._repo.get_all_for_user(user, filters or {})
        return [self._summary(t) for t in result["items"]]

    def get_ticket_detail(self, ticket_id: int, user) -> dict:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None or not self._can_see(ticket, user):
            raise TicketNotFound(TICKETNOTFOUND)
        return self._detail(ticket)

    # ── ITicketWorkerActions ───────────────────────────────────────────────────

    @transaction.atomic
    def update_status(
        self, ticket_id: int, new_status: str, comment: str, user
    ) -> dict:
        ticket = self._require(ticket_id, user)
        if ticket.estado == Ticket.Estado.NUEVO and new_status == Ticket.Estado.EN_PROCESO:
            raise TicketValidationError(
                "estado",
                "Un ticket Nuevo pasa a EnProceso únicamente mediante su primera asignación.",
            )
        # raises on invalid transition / missing comment
        self._machine.transition(ticket.estado, new_status, comment)
        anterior = ticket.estado
        self._repo.update(ticket_id, {"estado": new_status})
        TicketEvent.objects.create(
            ticket=ticket, autor=user,
            tipo_evento=TicketEvent.TipoEvento.CAMBIO_ESTADO,
            estado_anterior=anterior, estado_nuevo=new_status, comentario=comment,
        )
        return self._detail(self._repo.get_by_id(ticket_id))

    @transaction.atomic
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        if not comment or not comment.strip():
            raise CommentRequiredError("El comentario no puede estar vacío.")
        ticket = self._require(ticket_id, user)
        event = TicketEvent.objects.create(
            ticket=ticket, autor=user,
            tipo_evento=TicketEvent.TipoEvento.COMENTARIO, comentario=comment,
        )
        return self._event_summary(event)

    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        return self.update_status(ticket_id, Ticket.Estado.CERRADO, comment, user)

    # ── ITicketAdminActions ────────────────────────────────────────────────────

    @transaction.atomic
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        from apps.authentication.models import User  # noqa: PLC0415
        ticket = self._repo.get_by_id_for_update(ticket_id)
        if ticket is None:
            raise TicketNotFound(TICKETNOTFOUND)
        if ticket.asignado_id is not None:
            raise TicketValidationError(
                "asignado",
                "El ticket ya tiene un trabajador asignado; use la reasignación.",
            )
        if ticket.estado != Ticket.Estado.NUEVO:
            raise InvalidTransitionError(ticket.estado, Ticket.Estado.EN_PROCESO)
        worker = User.objects.filter(id=worker_id, role=User.Role.WORKER,
                                     estado=User.Estado.ACTIVE).first()
        if worker is None:
            raise TicketValidationError("asignado", "Trabajador no válido o inactivo.")
        # The Observer reads ticket.asignado_id as soon as the event is created.
        # Keep this instance synchronized so the worker is not omitted.
        ticket = self._repo.update(
            ticket_id,
            {"asignado": worker, "estado": Ticket.Estado.EN_PROCESO},
        )
        TicketEvent.objects.create(
            ticket=ticket, autor=user, tipo_evento=TicketEvent.TipoEvento.ASIGNACION,
            estado_anterior=Ticket.Estado.NUEVO, estado_nuevo=Ticket.Estado.EN_PROCESO,
            comentario=f"Asignado a {worker.email}.",
        )
        return self._detail(ticket)

    @transaction.atomic
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        from apps.authentication.models import User  # noqa: PLC0415
        ticket = self._repo.get_by_id_for_update(ticket_id)
        if ticket is None:
            raise TicketNotFound(TICKETNOTFOUND)
        if ticket.estado == Ticket.Estado.NUEVO or ticket.asignado_id is None:
            raise TicketValidationError(
                "asignado",
                "Solo se puede reasignar un ticket que ya tenga un trabajador.",
            )
        if ticket.asignado_id == new_worker_id:
            raise TicketValidationError(
                "asignado",
                "El trabajador seleccionado ya está asignado al ticket.",
            )
        worker = User.objects.filter(id=new_worker_id, role=User.Role.WORKER,
                                     estado=User.Estado.ACTIVE).first()
        if worker is None:
            raise TicketValidationError("asignado", "Trabajador no válido o inactivo.")
        previous_worker = ticket.asignado
        # Use the refreshed ticket so the Observer resolves the new worker.
        ticket = self._repo.update(ticket_id, {"asignado": worker})
        TicketEvent.objects.create(
            ticket=ticket, autor=user, tipo_evento=TicketEvent.TipoEvento.REASIGNACION,
            asignado_anterior=previous_worker,
            comentario=f"Reasignado de {previous_worker.email} a {worker.email}.",
        )
        return self._detail(ticket)

    def get_all_tickets(self, filters: dict | None = None) -> list:
        tickets = self._repo.get_all(filters or {})
        return [self._summary(t) for t in tickets]

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _require(self, ticket_id: int, user) -> Ticket:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None or not self._can_see(ticket, user):
            raise TicketNotFound(TICKETNOTFOUND)
        return ticket

    @staticmethod
    def _can_see(ticket: Ticket, user) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        return ticket.cliente_id == user.id

    @staticmethod
    def _summary(t: Ticket) -> dict:
        return {
            "id": t.id, "numero": t.numero, "asunto": t.asunto,
            "estado": t.estado, "prioridad": t.prioridad,
            "servicio_nombre": t.servicio.nombre if t.servicio_id else "",
            "creado_en": t.created_at.isoformat(),
        }

    @staticmethod
    def _event_summary(event: TicketEvent) -> dict:
        """Return an event in the API shape shared by detail and comment actions."""
        return {
            "id": event.id,
            "tipo_evento": event.tipo_evento,
            "estado_anterior": event.estado_anterior,
            "estado_nuevo": event.estado_nuevo,
            "comentario": event.comentario,
            "autor_nombre": (
                f"{event.autor.first_name} {event.autor.last_name}".strip()
                or event.autor.email
            ),
            "creado_en": event.created_at.isoformat(),
        }

    @classmethod
    def _detail(cls, t: Ticket) -> dict:
        return {
            **cls._summary(t),
            "descripcion": t.descripcion,
            "cliente_nombre": t.contacto_nombre_efectivo,
            "asignado_nombre": (
                f"{t.asignado.first_name} {t.asignado.last_name}".strip() or t.asignado.email
            ) if t.asignado_id else None,
            "adjuntos": [
                {"id": a.id, "nombre_archivo": a.nombre_archivo, "url": a.url,
                 "tamaño_bytes": a.tamaño_bytes, "mime_type": a.mime_type}
                for a in t.adjuntos.all()
            ],
            "eventos": [
                cls._event_summary(e)
                for e in t.eventos.all().order_by("created_at")
            ],
            "actualizado_en": t.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading  # noqa: E402

_lock = threading.Lock()
_instance: TicketService | None = None


def get_ticket_service() -> TicketService:
    """Thread-safe singleton accessor (double-checked locking)."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = TicketService()
    return _instance
