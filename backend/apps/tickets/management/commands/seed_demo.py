"""
seed_demo — carga datos de prueba para la demo/aceptación (idempotente).

Crea:
  - Los 6 servicios reales de SassBlum (catálogo).
  - Cuentas de prueba para los 3 roles (cliente / trabajador / admin), ya verificadas.
  - Tickets de ejemplo en distintos estados con su historial de eventos.

Es idempotente: re-ejecutarlo no duplica datos (usa get_or_create por clave natural).
El envío de correos se desvía a un backend en memoria durante la siembra para no
mandar emails reales al disparar el Observer.

Uso:
    python manage.py seed_demo
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.test.utils import override_settings

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent

DEMO_PASSWORD = "SassBlum2026"

# ── Servicios reales de sassblum.com ────────────────────────────────────────────
_IMG = "https://images.unsplash.com/{id}?auto=format&fit=crop&w=1200&q=80"
SERVICES = [
    {
        "nombre": "Infraestructura IT",
        "categoria": "Infraestructura",
        "descripcion": "Soluciones integradas a la medida: analizamos tus necesidades "
        "tecnológicas y oportunidades de crecimiento para diseñar una infraestructura robusta y escalable.",
        "imagen_url": _IMG.format(id="photo-1558494949-ef010cbdcc31"),
    },
    {
        "nombre": "Soporte Técnico",
        "categoria": "Soporte",
        "descripcion": "Servicio profesional que mejora la experiencia de tus colaboradores "
        "y maximiza la inversión en tus equipos, con atención oportuna y especializada.",
        "imagen_url": _IMG.format(id="photo-1581091226825-a6a2a5aee158"),
    },
    {
        "nombre": "Cableado Estructurado",
        "categoria": "Redes",
        "descripcion": "Implementación de redes de voz y datos con énfasis en estándares "
        "y calidad de conectividad para tu empresa.",
        "imagen_url": _IMG.format(id="photo-1606904825846-647eb07f5be2"),
    },
    {
        "nombre": "Sistema de Vigilancia CCTV",
        "categoria": "CCTV",
        "descripcion": "Videovigilancia y seguridad avanzada. Somos integradores autorizados "
        "de Grandstream, Hikvision, Ubiquiti y ZKTeco.",
        "imagen_url": _IMG.format(id="photo-1557597774-9d273605dfa9"),
    },
    {
        "nombre": "Domótica",
        "categoria": "Domótica",
        "descripcion": "Automatización inteligente: controla tu oficina u hogar desde el "
        "computador o el smartphone.",
        "imagen_url": _IMG.format(id="photo-1558002038-1055907df827"),
    },
    {
        "nombre": "Venta de Servidores",
        "categoria": "Servidores",
        "descripcion": "Importación directa de servidores escalables con virtualización e "
        "implementación de planes de continuidad del negocio (BCP).",
        "imagen_url": _IMG.format(id="photo-1517336714731-489689fd1ca8"),
    },
]

# ── Cuentas de prueba ────────────────────────────────────────────────────────────
ACCOUNTS = [
    {"email": "admin@sassblum.com", "first_name": "Admin", "last_name": "SassBlum", "role": User.Role.ADMIN, "staff": True},
    {"email": "trabajador1@sassblum.com", "first_name": "Carlos", "last_name": "Técnico", "role": User.Role.WORKER},
    {"email": "trabajador2@sassblum.com", "first_name": "Ana", "last_name": "Soporte", "role": User.Role.WORKER},
    {"email": "cliente@sassblum.com", "first_name": "Cliente", "last_name": "Demo", "role": User.Role.CLIENT},
]


class Command(BaseCommand):
    help = "Carga datos de prueba (servicios reales, cuentas y tickets) para la demo. Idempotente."

    def handle(self, *args, **options):
        # Evita enviar correos reales al disparar el Observer durante la siembra.
        with override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            self._seed()

    @transaction.atomic
    def _seed(self):
        services = self._seed_services()
        accounts = self._seed_accounts()
        self._seed_tickets(services, accounts)
        self._print_summary(accounts)

    # ── Servicios ────────────────────────────────────────────────────────────────
    def _seed_services(self) -> dict[str, Service]:
        out: dict[str, Service] = {}
        created = 0
        for data in SERVICES:
            svc, was_created = Service.objects.get_or_create(
                nombre=data["nombre"],
                defaults={
                    "categoria": data["categoria"],
                    "descripcion": data["descripcion"],
                    "imagen_url": data["imagen_url"],
                    "activo": True,
                },
            )
            out[data["nombre"]] = svc
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Servicios: {created} creados, {len(SERVICES) - created} ya existían."))
        return out

    # ── Cuentas ──────────────────────────────────────────────────────────────────
    def _seed_accounts(self) -> dict[str, User]:
        out: dict[str, User] = {}
        created = 0
        for acc in ACCOUNTS:
            user, was_created = User.objects.get_or_create(
                email=acc["email"],
                defaults={
                    "first_name": acc["first_name"],
                    "last_name": acc["last_name"],
                    "role": acc["role"],
                    "estado": User.Estado.ACTIVE,
                    "email_verificado": True,
                    "is_staff": acc.get("staff", False),
                    "is_superuser": acc.get("staff", False),
                },
            )
            if was_created:
                user.set_password(DEMO_PASSWORD)
                user.save()
                created += 1
            out[acc["email"]] = user
        self.stdout.write(self.style.SUCCESS(f"Cuentas: {created} creadas, {len(ACCOUNTS) - created} ya existían."))
        return out

    # ── Tickets + historial ───────────────────────────────────────────────────────
    def _seed_tickets(self, services: dict[str, Service], accounts: dict[str, User]):
        cliente = accounts["cliente@sassblum.com"]
        admin = accounts["admin@sassblum.com"]
        w1 = accounts["trabajador1@sassblum.com"]
        w2 = accounts["trabajador2@sassblum.com"]
        E = Ticket.Estado

        plan = [
            {
                "numero": "T-2026-9001", "asunto": "Servidor de correo caído",
                "descripcion": "El servidor de correo dejó de responder esta mañana y nadie puede enviar mensajes.",
                "servicio": "Infraestructura IT", "prioridad": Ticket.Prioridad.ALTA,
                "estado": E.NUEVO, "asignado": None,
                "events": [("creacion", cliente, "", "", "Ticket creado por el cliente.")],
            },
            {
                "numero": "T-2026-9002", "asunto": "Cámara de seguridad sin señal",
                "descripcion": "La cámara CCTV del ingreso principal no muestra imagen desde ayer.",
                "servicio": "Sistema de Vigilancia CCTV", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.EN_PROCESO, "asignado": w1,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Carlos Técnico."),
                    ("cambio_estado", w1, E.NUEVO, E.EN_PROCESO, "En sitio revisando el cableado de la cámara."),
                ],
            },
            {
                "numero": "T-2026-9003", "asunto": "Cableado para nueva oficina",
                "descripcion": "Necesitamos cableado estructurado de voz y datos para 12 puestos nuevos.",
                "servicio": "Cableado Estructurado", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.EN_ESPERA, "asignado": w1,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Carlos Técnico."),
                    ("cambio_estado", w1, E.NUEVO, E.EN_PROCESO, "Levantamiento de requerimientos en sitio."),
                    ("cambio_estado", w1, E.EN_PROCESO, E.EN_ESPERA, "A la espera de que el cliente confirme la distribución de puestos."),
                ],
            },
            {
                "numero": "T-2026-9004", "asunto": "Configurar domótica en sala de reuniones",
                "descripcion": "Queremos controlar luces y proyector de la sala desde el celular.",
                "servicio": "Domótica", "prioridad": Ticket.Prioridad.BAJA,
                "estado": E.RESUELTO, "asignado": w2,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Ana Soporte."),
                    ("cambio_estado", w2, E.NUEVO, E.EN_PROCESO, "Instalación de módulos de control."),
                    ("cambio_estado", w2, E.EN_PROCESO, E.RESUELTO, "Domótica configurada y probada con el cliente."),
                ],
            },
            {
                "numero": "T-2026-9005", "asunto": "Mantenimiento preventivo de servidores",
                "descripcion": "Mantenimiento trimestral de los dos servidores físicos del rack principal.",
                "servicio": "Venta de Servidores", "prioridad": Ticket.Prioridad.MEDIA,
                "estado": E.CERRADO, "asignado": w2,
                "events": [
                    ("creacion", cliente, "", "", "Ticket creado por el cliente."),
                    ("asignacion", admin, "", "", "Asignado a Ana Soporte."),
                    ("cambio_estado", w2, E.NUEVO, E.EN_PROCESO, "Ejecutando rutina de mantenimiento."),
                    ("cambio_estado", w2, E.EN_PROCESO, E.RESUELTO, "Mantenimiento completado sin incidencias."),
                    ("cambio_estado", admin, E.RESUELTO, E.CERRADO, "Cliente confirma conformidad. Cierre del ticket."),
                ],
            },
        ]

        created = 0
        for p in plan:
            ticket, was_created = Ticket.objects.get_or_create(
                numero=p["numero"],
                defaults={
                    "asunto": p["asunto"],
                    "descripcion": p["descripcion"],
                    "servicio": services[p["servicio"]],
                    "cliente": cliente,
                    "asignado": p["asignado"],
                    "estado": p["estado"],
                    "prioridad": p["prioridad"],
                },
            )
            if was_created:
                created += 1
                for tipo, autor, ant, nue, comentario in p["events"]:
                    TicketEvent.objects.create(
                        ticket=ticket,
                        autor=autor,
                        tipo_evento=tipo,
                        estado_anterior=ant,
                        estado_nuevo=nue,
                        comentario=comentario,
                    )
        self.stdout.write(self.style.SUCCESS(f"Tickets: {created} creados, {len(plan) - created} ya existían."))

    # ── Resumen ──────────────────────────────────────────────────────────────────
    def _print_summary(self, accounts: dict[str, User]):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Cuentas de prueba (contraseña común):"))
        self.stdout.write(f"  Contraseña: {DEMO_PASSWORD}")
        for acc in ACCOUNTS:
            self.stdout.write(f"  [{acc['role']:>6}] {acc['email']}")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Datos de prueba listos. ¡A correr la demo!"))
