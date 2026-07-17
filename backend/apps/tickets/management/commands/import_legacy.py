"""
import_legacy — migra los tickets históricos del sistema cPanel (PHP/MySQL).

Responsibility (SRP): parsear el dump `sassblum_tickets.sql` y crear User + Ticket
    + evento de resolución. No toca vistas ni servicios; comando aislado.
Fuente: legacy_cpanel/extracted/.../mysql/sassblum_tickets.sql (latin1).
Paridad: LN-5 del plan de unificación (docs/PLAN_UNIFICACION.md).

Uso:
    python manage.py import_legacy --file <ruta al .sql> --dry-run   # simula y cataloga
    python manage.py import_legacy --file <ruta al .sql>             # importa

Garantías:
    - Idempotente: User por email (iexact), Ticket por legacy_codigo. Re-ejecutable.
    - --dry-run no escribe nada: reporta conteos, estados encontrados y errores.
    - Desconecta el signal Observer durante la corrida: la importación NO envía
      emails ni notificaciones a los clientes históricos (458 tickets, 84 clientes).
    - Fechas originales preservadas (bypass de auto_now_add vía queryset.update).
    - latin1 → UTF-8; asunto truncado a 80 (límite del modelo).
"""

from __future__ import annotations

import re
from collections import Counter
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models.signals import post_save
from django.utils import timezone

# Mapa de estados legado → máquina de estados nueva.
# El dry-run reporta cualquier estado no contemplado aquí (queda como Nuevo).
ESTADO_MAP = {
    "abierto":    "Nuevo",
    "en proceso": "EnProceso",
    "pendiente":  "EnEspera",
    "resuelto":   "Resuelto",
    "cerrado":    "Cerrado",
    "atendido":   "Cerrado",
}

LEGACY_SERVICE_NAME = "Soporte técnico (histórico)"

_ESCAPES = {"n": "\n", "r": "\r", "t": "\t", "0": "\0"}


# ── Parser del dump (funciones puras, sin Django) ──────────────────────────────

def _read_quoted(sql_text: str, i: int) -> tuple[str, int]:
    """Lee un literal entre comillas simples desde i (tras la comilla inicial)."""
    buf: list[str] = []
    while i < len(sql_text):
        ch = sql_text[i]
        if ch == "\\" and i + 1 < len(sql_text):
            buf.append(_ESCAPES.get(sql_text[i + 1], sql_text[i + 1]))
            i += 2
        elif ch == "'":
            if i + 1 < len(sql_text) and sql_text[i + 1] == "'":
                buf.append("'")
                i += 2
            else:
                return "".join(buf), i + 1
        else:
            buf.append(ch)
            i += 1
    return "".join(buf), i


def _read_tuple(sql_text: str, i: int) -> tuple[list[str | None], int]:
    """Lee una tupla '(v1, v2, …)' desde i (tras el paréntesis inicial)."""
    row: list[str | None] = []
    buf: list[str] = []
    quoted = False
    while i < len(sql_text):
        ch = sql_text[i]
        if ch == "'":
            value, i = _read_quoted(sql_text, i + 1)
            buf.append(value)
            quoted = True
        elif ch in ",)":
            raw = "".join(buf).strip()
            row.append(raw if quoted else (None if raw.upper() == "NULL" else raw))
            buf, quoted = [], False
            i += 1
            if ch == ")":
                return row, i
        else:
            buf.append(ch)
            i += 1
    return row, i


def parse_sql_rows(sql_text: str, table: str) -> list[list[str | None]]:
    """Extrae las tuplas de los INSERT INTO `table` de un dump mysqldump."""
    rows: list[list[str | None]] = []
    pattern = rf"INSERT INTO `{table}`(?:\s*\([^)]*\))?\s*VALUES\s*"
    for match in re.finditer(pattern, sql_text):
        i = match.end()
        while i < len(sql_text):
            while i < len(sql_text) and sql_text[i] in ", \n\r\t":
                i += 1
            if i >= len(sql_text) or sql_text[i] != "(":
                break
            row, i = _read_tuple(sql_text, i + 1)
            rows.append(row)
    return rows


def split_nombre(full: str) -> tuple[str, str]:
    parts = (full or "").strip().split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def _clean_row(row: list[str | None]) -> dict:
    """Normaliza una fila del legado al formato del sistema nuevo."""
    codigo, fecha, usuario, email, ruc, empresa, asunto, mensaje, solucion, estado = row
    return {
        "codigo": int(codigo),
        "fecha": fecha,
        "usuario": (usuario or "").strip(),
        "email": (email or "").strip().lower(),
        "ruc": (ruc or "").strip()[:13],
        "empresa": (empresa or "").strip()[:150],
        "asunto": ((asunto or "").strip() or "(sin asunto)")[:80],
        "mensaje": (mensaje or "").strip() or "(sin mensaje)",
        "solucion": (solucion or "").strip(),
        "estado": ESTADO_MAP.get((estado or "").strip().lower(), "Nuevo"),
    }


def clean_rows(raw_rows: list) -> tuple[list[dict], Counter, list[str]]:
    """Valida y normaliza todas las filas. Devuelve (filas, estados, errores)."""
    estados: Counter = Counter()
    errores: list[str] = []
    parsed: list[dict] = []
    for row in raw_rows:
        if len(row) != 10:
            errores.append(f"Fila con {len(row)} columnas (se esperaban 10): {row[:2]}")
            continue
        estados[(row[9] or "").strip() or "(vacío)"] += 1
        item = _clean_row(row)
        if "@" not in item["email"]:
            errores.append(
                f"Ticket #{item['codigo']}: email inválido ({item['email']!r}) — se omite"
            )
            continue
        parsed.append(item)
    return parsed, estados, errores


def parse_fecha(raw: str | None):
    if not raw:
        return None
    try:
        dt = datetime.strptime(raw.strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None
    return timezone.make_aware(dt) if timezone.is_naive(dt) else dt


# ── Comando ────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Importa tickets históricos del dump MySQL del sistema legado (cPanel)."

    def add_arguments(self, parser):
        parser.add_argument("--file", required=True, help="Ruta al sassblum_tickets.sql")
        parser.add_argument("--dry-run", action="store_true", help="Simula sin escribir")

    def handle(self, *args, **options):
        sql_text = self._read_dump(options["file"])
        raw_rows = parse_sql_rows(sql_text, "tickets")
        if not raw_rows:
            raise CommandError("No se encontraron INSERT INTO `tickets` en el dump.")

        parsed, estados, errores = clean_rows(raw_rows)
        self._report(len(raw_rows), parsed, estados, errores)

        if options["dry_run"]:
            self.stdout.write(self.style.SUCCESS("Dry-run: no se escribió nada."))
            return

        creados_u, creados_t, omitidos = self._import(parsed)
        self.stdout.write(self.style.SUCCESS(
            f"Importación completa: {creados_u} usuarios creados, "
            f"{creados_t} tickets creados, {omitidos} ya existían (omitidos)."
        ))

    # ── Pasos del comando (SRP: un método por responsabilidad) ────────────────

    @staticmethod
    def _read_dump(path: str) -> str:
        try:
            with open(path, encoding="latin-1") as fh:
                return fh.read()
        except OSError as exc:
            raise CommandError(f"No se pudo leer el archivo: {exc}") from exc

    def _report(self, total: int, parsed: list, estados: Counter, errores: list) -> None:
        self.stdout.write(self.style.MIGRATE_HEADING("Resumen del dump"))
        self.stdout.write(f"  Tuplas leídas:    {total}")
        self.stdout.write(f"  Tickets válidos:  {len(parsed)}")
        self.stdout.write(f"  Clientes únicos:  {len({p['email'] for p in parsed})}")
        self.stdout.write(f"  Estados legados:  {dict(estados)}")
        for e in errores[:20]:
            self.stdout.write(self.style.WARNING(f"  ⚠ {e}"))
        if len(errores) > 20:
            self.stdout.write(self.style.WARNING(f"  … y {len(errores) - 20} avisos más"))

    def _import(self, parsed: list[dict]) -> tuple[int, int, int]:
        """Corrida real: Observer desconectado para no notificar a clientes."""
        from apps.tickets.models import TicketEvent  # noqa: PLC0415

        post_save.disconnect(sender=TicketEvent, dispatch_uid="ticket_event_notify")
        try:
            with transaction.atomic():
                servicio = self._legacy_service()
                users, creados_u = self._get_or_create_users(parsed)
                creados_t, omitidos = self._create_tickets(parsed, users, servicio)
        finally:
            # Re-registra el receptor de apps.py ready() (dispatch_uid evita duplicados)
            from django.apps import apps as django_apps  # noqa: PLC0415
            django_apps.get_app_config("tickets").ready()
        return creados_u, creados_t, omitidos

    @staticmethod
    def _legacy_service():
        from apps.catalog.models import Service  # noqa: PLC0415
        servicio, _ = Service.objects.get_or_create(
            nombre=LEGACY_SERVICE_NAME,
            defaults={
                "descripcion": "Tickets migrados del sistema anterior (cPanel).",
                "categoria": "Soporte",
                "activo": False,  # no seleccionable para tickets nuevos
            },
        )
        return servicio

    @staticmethod
    def _get_or_create_users(parsed: list[dict]) -> tuple[dict, int]:
        from apps.authentication.models import User  # noqa: PLC0415

        users: dict[str, object] = {}
        creados = 0
        # El ticket más reciente de cada email define nombre/ruc/empresa
        for p in sorted(parsed, key=lambda x: x["fecha"] or ""):
            user = users.get(p["email"]) or User.objects.filter(
                email__iexact=p["email"]
            ).first()
            if user is None:
                first, last = split_nombre(p["usuario"])
                user = User.objects.create_user(
                    email=p["email"],
                    first_name=first,
                    last_name=last,
                    ruc=p["ruc"],
                    empresa=p["empresa"],
                    role=User.Role.CLIENT,
                    estado=User.Estado.PENDING,
                    email_verificado=False,
                )
                creados += 1
            users[p["email"]] = user
        return users, creados

    @staticmethod
    def _create_tickets(parsed: list[dict], users: dict, servicio) -> tuple[int, int]:
        from apps.tickets.models import Ticket, TicketEvent  # noqa: PLC0415

        creados = omitidos = 0
        for p in parsed:
            if Ticket.objects.filter(legacy_codigo=p["codigo"]).exists():
                omitidos += 1
                continue
            ticket = Ticket.objects.create(
                numero=f"T-LEG-{p['codigo']:04d}",
                legacy_codigo=p["codigo"],
                asunto=p["asunto"],
                descripcion=p["mensaje"],
                servicio=servicio,
                cliente=users[p["email"]],
                estado=p["estado"],
                prioridad=Ticket.Prioridad.MEDIA,
            )
            fecha = parse_fecha(p["fecha"])
            if fecha:  # preservar fecha original (bypass de auto_now_add)
                Ticket.objects.filter(pk=ticket.pk).update(
                    created_at=fecha, updated_at=fecha
                )
            if p["solucion"]:
                TicketEvent.objects.create(
                    ticket=ticket,
                    autor=None,
                    tipo_evento=TicketEvent.TipoEvento.COMENTARIO,
                    comentario=f"[Resolución del sistema anterior] {p['solucion']}",
                )
            creados += 1
        return creados, omitidos
