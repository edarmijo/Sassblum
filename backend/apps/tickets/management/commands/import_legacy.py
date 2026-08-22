"""Import historical tickets from the cPanel MySQL dump.

The command parses the dump without executing SQL, produces a reconciliation
manifest, and imports users, tickets, and the one legacy solution event. A real
import requires explicit confirmation, the expected SHA-256, and a manifest path.
"""

from __future__ import annotations

import hashlib
import json
import re
from argparse import ArgumentParser
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Callable, TypedDict

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models.functions import Lower
from django.utils import timezone

ESTADO_MAP = {
    "abierto": "Nuevo",
    "en proceso": "EnProceso",
    "pendiente": "EnEspera",
    "resuelto": "Resuelto",
    "cerrado": "Cerrado",
    "atendido": "Cerrado",
}

LEGACY_SERVICE_NAME = "Soporte técnico (histórico)"
SPECIAL_DULCENAC_RUC = "09992338547001"
CORRECTED_DULCENAC_RUC = "0992338547001"
MAX_ORIGINAL_RUC_LENGTH = 32
MAX_LEGACY_SUBJECT_LENGTH = 120
SPAM_TERMS = (
    "banner",
    "google",
    "keyword",
    "pay per click",
    "ppc",
    "search engine",
    "seo",
    "traffic",
)

_ESCAPES = {"n": "\n", "r": "\r", "t": "\t", "0": "\0"}


class ParsedRow(TypedDict):
    codigo: int
    fecha: str
    usuario: str
    email: str
    ruc: str
    ruc_original: str
    ruc_reglas: list[str]
    empresa: str
    asunto: str
    mensaje: str
    solucion: str
    estado: str
    estado_original: str
    es_spam: bool


@dataclass(frozen=True)
class ImportIssue:
    codigo: int | None
    categoria: str
    detalle: str
    omitido: bool = False

    def as_dict(self) -> dict[str, int | str | bool | None]:
        return {
            "codigo": self.codigo,
            "categoria": self.categoria,
            "detalle": self.detalle,
            "omitido": self.omitido,
        }


@dataclass(frozen=True)
class LegacyAnalysis:
    rows: list[ParsedRow]
    estados: Counter[str]
    issues: list[ImportIssue]

    @property
    def omitted(self) -> list[ImportIssue]:
        return [issue for issue in self.issues if issue.omitido]


@dataclass(frozen=True)
class DatabasePlan:
    usuarios_crear: int
    usuarios_existentes: int
    tickets_crear: int
    tickets_existentes: int

    def as_dict(self) -> dict[str, int]:
        return {
            "usuarios_crear": self.usuarios_crear,
            "usuarios_existentes": self.usuarios_existentes,
            "tickets_crear": self.tickets_crear,
            "tickets_existentes": self.tickets_existentes,
        }


@dataclass(frozen=True)
class ImportResult:
    usuarios_creados: int
    tickets_creados: int
    tickets_existentes: int

    def as_dict(self) -> dict[str, int]:
        return {
            "usuarios_creados": self.usuarios_creados,
            "tickets_creados": self.tickets_creados,
            "tickets_existentes": self.tickets_existentes,
            "tickets_actualizados": 0,
        }


def _read_quoted(sql_text: str, index: int) -> tuple[str, int]:
    """Read a MySQL single-quoted literal starting after its opening quote."""
    buffer: list[str] = []
    while index < len(sql_text):
        character = sql_text[index]
        if character == "\\" and index + 1 < len(sql_text):
            buffer.append(_ESCAPES.get(sql_text[index + 1], sql_text[index + 1]))
            index += 2
        elif character == "'":
            if index + 1 < len(sql_text) and sql_text[index + 1] == "'":
                buffer.append("'")
                index += 2
            else:
                return "".join(buffer), index + 1
        else:
            buffer.append(character)
            index += 1
    return "".join(buffer), index


def _read_tuple(sql_text: str, index: int) -> tuple[list[str | None], int]:
    """Read a values tuple starting after its opening parenthesis."""
    row: list[str | None] = []
    buffer: list[str] = []
    quoted = False
    while index < len(sql_text):
        character = sql_text[index]
        if character == "'":
            value, index = _read_quoted(sql_text, index + 1)
            buffer.append(value)
            quoted = True
        elif character in ",)":
            raw = "".join(buffer).strip()
            value = None if not quoted and raw.upper() == "NULL" else raw
            row.append(value)
            buffer, quoted = [], False
            index += 1
            if character == ")":
                return row, index
        else:
            buffer.append(character)
            index += 1
    return row, index


def parse_sql_rows(sql_text: str, table: str) -> list[list[str | None]]:
    """Extract values tuples for ``table`` without executing dump SQL."""
    rows: list[list[str | None]] = []
    pattern = rf"INSERT INTO `{re.escape(table)}`(?:\s*\([^)]*\))?\s*VALUES\s*"
    for match in re.finditer(pattern, sql_text):
        index = match.end()
        while index < len(sql_text):
            while index < len(sql_text) and sql_text[index] in ", \n\r\t":
                index += 1
            if index >= len(sql_text) or sql_text[index] != "(":
                break
            row, index = _read_tuple(sql_text, index + 1)
            rows.append(row)
    return rows


def split_nombre(full_name: str) -> tuple[str, str]:
    parts = (full_name or "").strip().split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def parse_fecha(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        parsed = datetime.strptime(raw.strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None
    return timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed


def normalize_ruc(raw: str) -> tuple[str, list[str]]:
    """Apply only the approved, traceable legacy normalization rules."""
    original = raw or ""
    normalized = re.sub(r"[ \t·]", "", original)
    rules: list[str] = []
    if normalized != original:
        rules.append("quitar_espacios_tabs_punto_medio")
    if normalized == SPECIAL_DULCENAC_RUC:
        normalized = CORRECTED_DULCENAC_RUC
        rules.append("corregir_9_sobrante_dulcenac")
    return normalized, rules


def is_legacy_spam(ruc_original: str, asunto: str, mensaje: str) -> bool:
    """Detect the two spam shapes present in the audited legacy dump."""
    if any(character.isdigit() for character in ruc_original):
        return False
    searchable = f"{asunto} {mensaje}".casefold()
    commercial_spam = any(term in searchable for term in SPAM_TERMS)
    generated_payload = len(ruc_original) >= 16 and ruc_original.isalpha()
    return commercial_spam or generated_payload


def _valid_email(email: str) -> bool:
    try:
        validate_email(email)
    except ValidationError:
        return False
    return True


def _clean_row(row: list[str | None]) -> tuple[ParsedRow, list[ImportIssue]]:
    codigo_raw, fecha, usuario, email, ruc, empresa, asunto, mensaje, solucion, estado = row
    codigo = int(codigo_raw or "")
    usuario_limpio = (usuario or "").strip()
    email_limpio = (email or "").strip().lower()
    ruc_original = ruc or ""
    ruc_normalizado, ruc_reglas = normalize_ruc(ruc_original)
    empresa_limpia = (empresa or "").strip()
    asunto_limpio = (asunto or "").strip() or "(sin asunto)"
    mensaje_limpio = (mensaje or "").strip() or "(sin mensaje)"
    estado_original = (estado or "").strip()
    es_spam = is_legacy_spam(ruc_original, asunto_limpio, mensaje_limpio)
    issues: list[ImportIssue] = []

    if es_spam:
        ruc_normalizado = ""
        ruc_reglas.append("ruc_no_numerico_de_spam_conservado_solo_como_original")
    elif len(ruc_normalizado) > 13:
        issues.append(ImportIssue(
            codigo,
            "ruc_no_normalizable",
            f"identificación de {len(ruc_normalizado)} caracteres conservada como original",
        ))
        ruc_normalizado = ""
        ruc_reglas.append("ruc_sin_normalizar_conservado_solo_como_original")
    elif ruc_normalizado and (
        not ruc_normalizado.isdigit() or len(ruc_normalizado) != 13
    ):
        issues.append(ImportIssue(
            codigo,
            "ruc_anomalo",
            "identificación conservada sin completar ni truncar",
        ))

    estado_normalizado = ESTADO_MAP.get(estado_original.casefold(), "Nuevo")
    if estado_original.casefold() not in ESTADO_MAP:
        issues.append(ImportIssue(
            codigo,
            "estado_no_mapeado",
            f"estado {estado_original!r} mapeado a 'Nuevo'",
        ))

    parsed: ParsedRow = {
        "codigo": codigo,
        "fecha": fecha or "",
        "usuario": usuario_limpio,
        "email": email_limpio,
        "ruc": ruc_normalizado,
        "ruc_original": ruc_original,
        "ruc_reglas": ruc_reglas,
        "empresa": empresa_limpia,
        "asunto": asunto_limpio,
        "mensaje": mensaje_limpio,
        "solucion": (solucion or "").strip(),
        "estado": estado_normalizado,
        "estado_original": estado_original,
        "es_spam": es_spam,
    }
    return parsed, issues


def _row_constraint_issue(row: ParsedRow) -> str | None:
    first_name, last_name = split_nombre(row["usuario"])
    constraints = (
        (len(row["ruc_original"]) <= MAX_ORIGINAL_RUC_LENGTH, "RUC original excede 32"),
        (len(row["empresa"]) <= 150, "empresa excede 150"),
        (len(row["asunto"]) <= MAX_LEGACY_SUBJECT_LENGTH, "asunto excede 120"),
        (len(row["usuario"]) <= 301, "nombre de contacto excede 301"),
        (len(first_name) <= 150, "nombre excede 150"),
        (len(last_name) <= 150, "apellido excede 150"),
    )
    return next((message for valid, message in constraints if not valid), None)


def clean_rows(raw_rows: list[list[str | None]]) -> LegacyAnalysis:
    """Validate rows without silently truncating or inventing source values."""
    estados: Counter[str] = Counter()
    issues: list[ImportIssue] = []
    parsed_rows: list[ParsedRow] = []
    seen_codes: set[int] = set()
    for raw_row in raw_rows:
        if len(raw_row) != 10:
            issues.append(ImportIssue(
                None,
                "columnas_invalidas",
                f"fila con {len(raw_row)} columnas; se esperaban 10",
                omitido=True,
            ))
            continue
        estados[(raw_row[9] or "").strip() or "(vacío)"] += 1
        try:
            parsed, row_issues = _clean_row(raw_row)
        except (TypeError, ValueError):
            issues.append(ImportIssue(
                None,
                "codigo_invalido",
                f"código no numérico: {raw_row[0]!r}",
                omitido=True,
            ))
            continue
        if parsed["codigo"] in seen_codes:
            issues.append(ImportIssue(
                parsed["codigo"],
                "codigo_duplicado",
                "código legado repetido; la fila posterior se omite",
                omitido=True,
            ))
            continue
        seen_codes.add(parsed["codigo"])
        if not _valid_email(parsed["email"]):
            issues.append(ImportIssue(
                parsed["codigo"],
                "email_invalido",
                f"email inválido {parsed['email']!r}",
                omitido=True,
            ))
            continue
        if not parse_fecha(parsed["fecha"]):
            issues.append(ImportIssue(
                parsed["codigo"],
                "fecha_invalida",
                f"fecha inválida {parsed['fecha']!r}",
                omitido=True,
            ))
            continue
        constraint_issue = _row_constraint_issue(parsed)
        if constraint_issue:
            issues.append(ImportIssue(
                parsed["codigo"],
                "longitud_incompatible",
                constraint_issue,
                omitido=True,
            ))
            continue
        issues.extend(row_issues)
        parsed_rows.append(parsed)
    return LegacyAnalysis(parsed_rows, estados, issues)


class Command(BaseCommand):
    help = "Importa tickets históricos del dump MySQL del sistema legado (cPanel)."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("--file", required=True, help="Ruta al sassblum_tickets.sql")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Analiza sin escribir en la base de datos",
        )
        parser.add_argument(
            "--compare-database",
            action="store_true",
            help="En dry-run, consulta la base de datos para calcular idempotencia",
        )
        parser.add_argument(
            "--manifest",
            help="Ruta de salida del manifiesto JSON de conciliación",
        )
        parser.add_argument(
            "--overwrite-manifest",
            action="store_true",
            help="Autoriza reemplazar únicamente el manifiesto indicado",
        )
        parser.add_argument(
            "--expected-sha256",
            help="Hash esperado obligatorio para una importación real",
        )
        parser.add_argument(
            "--confirm-import",
            action="store_true",
            help="Confirmación explícita obligatoria para escribir en la base",
        )
        parser.add_argument(
            "--confirm-backup",
            action="store_true",
            help="Confirma que existe un respaldo restaurable de la base destino",
        )
        parser.add_argument(
            "--confirm-omissions",
            action="store_true",
            help="Confirma que se revisaron las filas omitidas del dry-run",
        )

    def handle(self, *args: object, **options: object) -> None:
        self._configure_output_encoding()
        dry_run = bool(options["dry_run"])
        compare_database = bool(options["compare_database"])
        if compare_database and not dry_run:
            raise CommandError("--compare-database solo se admite junto con --dry-run.")
        if not dry_run:
            self._validate_real_import_options(options)

        source_path = Path(str(options["file"])).resolve()
        sql_text, source_size, source_hash = self._read_dump(source_path)
        expected_hash = str(options.get("expected_sha256") or "").lower()
        if expected_hash and expected_hash != source_hash:
            raise CommandError(
                f"SHA-256 inesperado: esperado {expected_hash}, obtenido {source_hash}."
            )

        raw_rows = parse_sql_rows(sql_text, "tickets")
        if not raw_rows:
            raise CommandError("No se encontraron INSERT INTO `tickets` en el dump.")
        analysis = clean_rows(raw_rows)
        if not analysis.rows:
            raise CommandError("El dump no contiene tickets importables.")
        database_plan = self._database_plan(analysis.rows) if compare_database else None
        self._report(len(raw_rows), analysis, source_hash, database_plan)

        if dry_run:
            manifest = self._build_manifest(
                source_path,
                source_size,
                source_hash,
                len(raw_rows),
                analysis,
                database_plan=database_plan,
            )
            self._write_manifest_if_requested(manifest, options)
            self.stdout.write(self.style.SUCCESS(
                "Dry-run completo: no se escribió en la base de datos."
            ))
            return

        def persist_manifest(result: ImportResult) -> None:
            manifest = self._build_manifest(
                source_path,
                source_size,
                source_hash,
                len(raw_rows),
                analysis,
                import_result=result,
            )
            self._write_manifest_if_requested(manifest, options)

        result = self._import(analysis.rows, on_success=persist_manifest)
        self.stdout.write(self.style.SUCCESS(
            "Importación completa: "
            f"{result.usuarios_creados} usuarios creados, "
            f"{result.tickets_creados} tickets creados, "
            f"{result.tickets_existentes} tickets existentes omitidos."
        ))

    def _configure_output_encoding(self) -> None:
        """Use UTF-8 on real console streams and leave test StringIO untouched."""
        for wrapper in (self.stdout, self.stderr):
            stream = getattr(wrapper, "_out", None)
            reconfigure = getattr(stream, "reconfigure", None)
            if callable(reconfigure):
                reconfigure(encoding="utf-8", errors="backslashreplace")

    @staticmethod
    def _validate_real_import_options(options: dict[str, object]) -> None:
        if not options.get("confirm_import"):
            raise CommandError(
                "La importación real requiere --confirm-import; ejecute antes --dry-run."
            )
        if not options.get("expected_sha256"):
            raise CommandError("La importación real requiere --expected-sha256.")
        if not options.get("manifest"):
            raise CommandError("La importación real requiere --manifest.")
        if not options.get("confirm_backup"):
            raise CommandError("La importación real requiere --confirm-backup.")
        if not options.get("confirm_omissions"):
            raise CommandError("La importación real requiere --confirm-omissions.")

    @staticmethod
    def _read_dump(path: Path) -> tuple[str, int, str]:
        try:
            source_bytes = path.read_bytes()
        except OSError as exc:
            raise CommandError(f"No se pudo leer el archivo: {exc}") from exc
        try:
            sql_text = source_bytes.decode("utf-8", errors="strict")
        except UnicodeDecodeError as exc:
            raise CommandError(
                f"El dump no es UTF-8 válido (byte {exc.start}); no se importó."
            ) from exc
        return sql_text, len(source_bytes), hashlib.sha256(source_bytes).hexdigest()

    def _report(
        self,
        total: int,
        analysis: LegacyAnalysis,
        source_hash: str,
        database_plan: DatabasePlan | None,
    ) -> None:
        spam_codes = [row["codigo"] for row in analysis.rows if row["es_spam"]]
        self.stdout.write(self.style.MIGRATE_HEADING("Resumen del dump"))
        self.stdout.write(f"  SHA-256:          {source_hash}")
        self.stdout.write(f"  Tuplas leídas:    {total}")
        self.stdout.write(f"  Importables:      {len(analysis.rows)}")
        self.stdout.write(f"  Omitidas:         {len(analysis.omitted)}")
        self.stdout.write(f"  Marcadas spam:    {len(spam_codes)}")
        self.stdout.write(
            f"  Clientes únicos:  {len({row['email'] for row in analysis.rows})}"
        )
        self.stdout.write(f"  Estados legados:  {dict(analysis.estados)}")
        if spam_codes:
            self.stdout.write(f"  Códigos spam:     {','.join(map(str, spam_codes))}")
        for issue in analysis.issues:
            code = f"ticket {issue.codigo}" if issue.codigo is not None else "fila"
            prefix = "OMITIDO" if issue.omitido else "AVISO"
            self.stdout.write(self.style.WARNING(
                f"  [{prefix}] {code}: {issue.categoria} - {issue.detalle}"
            ))
        if database_plan:
            self.stdout.write(f"  Comparación BD:   {database_plan.as_dict()}")

    @staticmethod
    def _database_plan(parsed: list[ParsedRow]) -> DatabasePlan:
        from apps.authentication.models import User  # noqa: PLC0415
        from apps.tickets.models import Ticket  # noqa: PLC0415

        emails = {row["email"] for row in parsed}
        codes = {row["codigo"] for row in parsed}
        existing_emails = set(
            User.objects.annotate(email_ci=Lower("email"))
            .filter(email_ci__in=emails)
            .values_list("email_ci", flat=True)
        )
        existing_codes = set(
            Ticket.objects.filter(legacy_codigo__in=codes)
            .values_list("legacy_codigo", flat=True)
        )
        return DatabasePlan(
            usuarios_crear=len(emails - existing_emails),
            usuarios_existentes=len(existing_emails),
            tickets_crear=len(codes - existing_codes),
            tickets_existentes=len(existing_codes),
        )

    @staticmethod
    def _build_manifest(
        source_path: Path,
        source_size: int,
        source_hash: str,
        total: int,
        analysis: LegacyAnalysis,
        *,
        database_plan: DatabasePlan | None = None,
        import_result: ImportResult | None = None,
    ) -> dict[str, object]:
        parsed = analysis.rows
        codes = [row["codigo"] for row in parsed]
        contacts_by_email: dict[str, set[str]] = defaultdict(set)
        tickets_by_email: Counter[str] = Counter()
        normalization_codes: dict[str, list[int]] = defaultdict(list)
        for row in parsed:
            # Preserve source spelling/case: these variations are part of the
            # inconsistency report and must not be silently merged.
            contacts_by_email[row["email"]].add(row["usuario"])
            tickets_by_email[row["email"]] += 1
            for rule in row["ruc_reglas"]:
                normalization_codes[rule].append(row["codigo"])

        shared_mailboxes = [
            {
                "email": email,
                "contactos": len(contacts),
                "tickets": tickets_by_email[email],
            }
            for email, contacts in sorted(contacts_by_email.items())
            if len(contacts) > 1
        ]
        dulcenac_rows = [
            row for row in parsed if "dulcenac" in row["empresa"].casefold()
        ]
        result: dict[str, object]
        if import_result:
            result = {"modo": "importación", **import_result.as_dict()}
        elif database_plan:
            result = {"modo": "dry-run con comparación BD", **database_plan.as_dict()}
        else:
            result = {
                "modo": "dry-run sin comparación BD",
                "usuarios_creados": None,
                "tickets_creados": None,
                "tickets_actualizados": 0,
            }

        return {
            "version_manifiesto": 1,
            "fuente": {
                "archivo": str(source_path),
                "bytes": source_size,
                "sha256": source_hash,
                "encoding": "utf-8",
            },
            "conciliacion": {
                "leidos": total,
                "importables": len(parsed),
                "omitidos": len(analysis.omitted),
                "marcados_spam": sum(row["es_spam"] for row in parsed),
                "clientes_unicos": len({row["email"] for row in parsed}),
                "codigo_minimo": min(codes) if codes else None,
                "codigo_maximo": max(codes) if codes else None,
                "estados_legados": dict(analysis.estados),
            },
            "resultado": result,
            "omitidos": [issue.as_dict() for issue in analysis.omitted],
            "avisos": [
                issue.as_dict() for issue in analysis.issues if not issue.omitido
            ],
            "spam": {
                "cantidad": sum(row["es_spam"] for row in parsed),
                "codigos": [row["codigo"] for row in parsed if row["es_spam"]],
            },
            "normalizaciones_ruc": dict(sorted(normalization_codes.items())),
            "inconsistencias_auditadas": {
                "buzones_compartidos": shared_mailboxes,
                "dulcenac": {
                    "grafias_empresa": sorted({row["empresa"] for row in dulcenac_rows}),
                    "ruc_originales": sorted({row["ruc_original"] for row in dulcenac_rows}),
                },
            },
        }

    @staticmethod
    def _write_manifest_if_requested(
        manifest: dict[str, object], options: dict[str, object]
    ) -> None:
        manifest_option = options.get("manifest")
        if not manifest_option:
            return
        manifest_path = Path(str(manifest_option)).resolve()
        if manifest_path.exists() and not options.get("overwrite_manifest"):
            raise CommandError(
                f"El manifiesto ya existe: {manifest_path}. "
                "Use --overwrite-manifest para reemplazar solo ese archivo."
            )
        if not manifest_path.parent.is_dir():
            raise CommandError(
                f"La carpeta del manifiesto no existe: {manifest_path.parent}"
            )
        try:
            manifest_path.write_text(
                json.dumps(manifest, ensure_ascii=True, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise CommandError(f"No se pudo escribir el manifiesto: {exc}") from exc

    def _import(
        self,
        parsed: list[ParsedRow],
        *,
        on_success: Callable[[ImportResult], None] | None = None,
    ) -> ImportResult:
        """Run one atomic import; legacy events use bulk_create to emit no signals."""
        with transaction.atomic():
            service = self._legacy_service()
            users, created_users = self._get_or_create_users(parsed)
            created_tickets, existing_tickets = self._create_tickets(
                parsed, users, service
            )
            result = ImportResult(
                created_users,
                created_tickets,
                existing_tickets,
            )
            if on_success:
                on_success(result)
        return result

    @staticmethod
    def _legacy_service() -> object:
        from apps.catalog.models import Service  # noqa: PLC0415

        service, _ = Service.objects.get_or_create(
            nombre=LEGACY_SERVICE_NAME,
            defaults={
                "descripcion": "Tickets migrados del sistema anterior (cPanel).",
                "categoria": "Soporte",
                "activo": False,
            },
        )
        return service

    @staticmethod
    def _get_or_create_users(
        parsed: list[ParsedRow],
    ) -> tuple[dict[str, object], int]:
        from apps.authentication.models import User  # noqa: PLC0415

        latest_by_email: dict[str, ParsedRow] = {}
        for row in sorted(
            parsed,
            key=lambda item: (item["fecha"], item["codigo"]),
            reverse=True,
        ):
            latest_by_email.setdefault(row["email"], row)

        users: dict[str, object] = {}
        created = 0
        for email, row in sorted(latest_by_email.items()):
            user = User.objects.filter(email__iexact=email).first()
            if user is None:
                first_name, last_name = split_nombre(row["usuario"])
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    ruc=row["ruc"],
                    ruc_original=row["ruc_original"],
                    empresa=row["empresa"],
                    role=User.Role.CLIENT,
                    estado=User.Estado.PENDING,
                    email_verificado=False,
                )
                created += 1
            users[email] = user
        return users, created

    @staticmethod
    def _create_tickets(
        parsed: list[ParsedRow], users: dict[str, object], service: object
    ) -> tuple[int, int]:
        from apps.tickets.models import Ticket, TicketEvent  # noqa: PLC0415

        created = existing = 0
        legacy_events: list[TicketEvent] = []
        for row in parsed:
            if Ticket.objects.filter(legacy_codigo=row["codigo"]).exists():
                existing += 1
                continue
            ticket = Ticket.objects.create(
                numero=f"T-LEG-{row['codigo']:04d}",
                legacy_codigo=row["codigo"],
                asunto=row["asunto"],
                descripcion=row["mensaje"],
                servicio=service,
                cliente=users[row["email"]],
                contacto_nombre=row["usuario"],
                contacto_ruc=row["ruc"],
                contacto_ruc_original=row["ruc_original"],
                contacto_empresa=row["empresa"],
                estado=row["estado"],
                prioridad=Ticket.Prioridad.MEDIA,
                legacy_es_spam=row["es_spam"],
            )
            original_date = parse_fecha(row["fecha"])
            if original_date:
                Ticket.objects.filter(pk=ticket.pk).update(
                    created_at=original_date,
                    updated_at=original_date,
                )
            if row["solucion"]:
                legacy_events.append(TicketEvent(
                    ticket=ticket,
                    autor=None,
                    tipo_evento=TicketEvent.TipoEvento.COMENTARIO,
                    comentario=(
                        "[Resolución del sistema anterior; fecha de solución no disponible] "
                        f"{row['solucion']}"
                    ),
                ))
            created += 1
        TicketEvent.objects.bulk_create(legacy_events)
        return created, existing
