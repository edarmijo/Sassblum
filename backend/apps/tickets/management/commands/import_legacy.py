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
      emails ni notificaciones a los clientes históricos (459 tickets, 85 clientes).
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


def parse_sql_rows(sql_text: str, table: str) -> list[list[str | None]]:
    """
    Extrae las tuplas de los INSERT INTO `table` de un dump mysqldump.
    Parser por máquina de estados (no regex) para respetar comillas y escapes.
    """
    rows: list[list[str | None]] = []
    for match in re.finditer(
        rf"INSERT INTO `{table}`(?:\s*\([^)]*\))?\s*VALUES\s*", sql_text
    ):
        i = match.end()
        while i < len(sql_text) and sql_text[i] in " \n\r\t":
            i += 1
        while i < len(sql_text) and sql_text[i] == "(":
            row: list[str | None] = []
            buf: list[str] = []
            in_str = False
            is_null = False
            i += 1  # consume '('
            while i < len(sql_text):
                ch = sql_text[i]
                if in_str:
                    if ch == "\\" and i + 1 < len(sql_text):
                        nxt = sql_text[i + 1]
                        buf.append({"n": "\n", "r": "\r", "t": "\t", "0": "\0"}.get(nxt, nxt))
                        i += 2
                        continue
                    if ch == "'":
                        if i + 1 < len(sql_text) and sql_text[i + 1] == "'":
                            buf.append("'")
                            i += 2
                            continue
                        in_str = False
                        i += 1
                        continue
                    buf.append(ch)
                    i += 1
                    continue
                if ch == "'":
                    in_str = True
                    i += 1
                    continue
                if ch in ",)":
                    value = "".join(buf).strip()
                    row.append(None if is_null or value.upper() == "NULL" else value)
                    buf, is_null = [], False
                    i += 1
                    if ch == ")":
                        rows.append(row)
                        # separador entre tuplas: ",(" o ";"
                        while i < len(sql_text) and sql_text[i] in ", \n\r\t":
                            i += 1
                        break
                    continue
                buf.append(ch)
                i += 1
    return rows


def split_nombre(full: str) -> tuple[str, str]:
    parts = (full or "").strip().split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


class Command(BaseCommand):
    help = "Importa tickets históricos del dump MySQL del sistema legado (cPanel)."

    def add_arguments(self, parser):
        parser.add_argument("--file", required=True, help="Ruta al sassblum_tickets.sql")
        parser.add_argument("--dry-run", action="store_true", help="Simula sin escribir")

    def handle(self, *args, **options):
        # Imports diferidos: el comando no debe cargar modelos a nivel de módulo
        from apps.authentication.models import User  # noqa: PLC0415
        from apps.catalog.models import Service  # noqa: PLC0415
        from apps.tickets.models import Ticket, TicketEvent  # noqa: PLC0415

        dry = options["dry_run"]
        try:
            with open(options["file"], encoding="latin-1") as fh:
                sql_text = fh.read()
        except OSError as exc:
            raise CommandError(f"No se pudo leer el archivo: {exc}") from exc

        raw_rows = parse_sql_rows(sql_text, "tickets")
        if not raw_rows:
            raise CommandError("No se encontraron INSERT INTO `tickets` en el dump.")

        # Columnas del legado: codigo, fecha, usuario, email, ruc, empresa,
        #                      asunto, mensaje, solucion, estado
        estados = Counter()
        errores: list[str] = []
        parsed = []
        for row in raw_rows:
            if len(row) != 10:
                errores.append(f"Fila con {len(row)} columnas (se esperaban 10): {row[:2]}")
                continue
            codigo, fecha, usuario, email, ruc, empresa, asunto, mensaje, solucion, estado = row
            email = (email or "").strip().lower()
            estados[(estado or "").strip() or "(vacío)"] += 1
            if not email or "@" not in email:
                errores.append(f"Ticket #{codigo}: email inválido ({email!r}) — se omite")
                continue
            parsed.append({
                "codigo": int(codigo),
                "fecha": fecha,
                "usuario": (usuario or "").strip(),
                "email": email,
                "ruc": (ruc or "").strip()[:13],
                "empresa": (empresa or "").strip()[:150],
                "asunto": ((asunto or "").strip() or "(sin asunto)")[:80],
                "mensaje": (mensaje or "").strip() or "(sin mensaje)",
                "solucion": (solucion or "").strip(),
                "estado": ESTADO_MAP.get((estado or "").strip().lower(), "Nuevo"),
            })

        emails_unicos = {p["email"] for p in parsed}
        self.stdout.write(self.style.MIGRATE_HEADING("Resumen del dump"))
        self.stdout.write(f"  Tuplas leídas:    {len(raw_rows)}")
        self.stdout.write(f"  Tickets válidos:  {len(parsed)}")
        self.stdout.write(f"  Clientes únicos:  {len(emails_unicos)}")
        self.stdout.write(f"  Estados legados:  {dict(estados)}")
        for e in errores[:20]:
            self.stdout.write(self.style.WARNING(f"  ⚠ {e}"))
        if len(errores) > 20:
            self.stdout.write(self.style.WARNING(f"  … y {len(errores) - 20} avisos más"))

        if dry:
            self.stdout.write(self.style.SUCCESS("Dry-run: no se escribió nada."))
            return

        # Importación real — sin notificaciones (Observer desconectado)
        post_save.disconnect(sender=TicketEvent, dispatch_uid="ticket_event_notify")
        try:
            creados_u = creados_t = omitidos = 0
            with transaction.atomic():
                servicio, _ = Service.objects.get_or_create(
                    nombre=LEGACY_SERVICE_NAME,
                    defaults={
                        "descripcion": "Tickets migrados del sistema anterior (cPanel).",
                        "categoria": "Soporte",
                        "activo": False,  # no seleccionable para tickets nuevos
                    },
                )
                users_by_email: dict[str, object] = {}
                # El ticket más reciente de cada email define nombre/ruc/empresa
                for p in sorted(parsed, key=lambda x: x["fecha"] or ""):
                    u = users_by_email.get(p["email"]) or User.objects.filter(
                        email__iexact=p["email"]
                    ).first()
                    if u is None:
                        first, last = split_nombre(p["usuario"])
                        u = User.objects.create_user(
                            email=p["email"],
                            password=None,  # sin contraseña → flujo "olvidé mi contraseña"
                            first_name=first,
                            last_name=last,
                            ruc=p["ruc"],
                            empresa=p["empresa"],
                            role=User.Role.CLIENT,
                            estado=User.Estado.PENDING,
                            email_verificado=False,
                        )
                        creados_u += 1
                    users_by_email[p["email"]] = u

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
                        cliente=users_by_email[p["email"]],
                        estado=p["estado"],
                        prioridad=Ticket.Prioridad.MEDIA,
                    )
                    # Preservar la fecha original (bypass de auto_now_add)
                    fecha = self._parse_fecha(p["fecha"])
                    if fecha:
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
                    creados_t += 1
        finally:
            # Reconexión del Observer (re-registra el receptor de apps.py ready();
            # dispatch_uid garantiza que no se duplique)
            from django.apps import apps as django_apps  # noqa: PLC0415
            django_apps.get_app_config("tickets").ready()

        self.stdout.write(self.style.SUCCESS(
            f"Importación completa: {creados_u} usuarios creados, "
            f"{creados_t} tickets creados, {omitidos} ya existían (omitidos)."
        ))

    @staticmethod
    def _parse_fecha(raw: str | None):
        if not raw:
            return None
        try:
            dt = datetime.strptime(raw.strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None
        return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
