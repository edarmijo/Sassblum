"""Remove retired duplicate services without losing historical tickets.

Usage (from backend):
    python scripts/cleanup_legacy_services.py
    python scripts/cleanup_legacy_services.py --execute
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from apps.catalog.models import Service  # noqa: E402
from apps.tickets.models import Ticket  # noqa: E402
from django.db import transaction  # noqa: E402


TARGET_SERVICE_ID = 3
TARGET_SERVICE_NAME = "Cableado Estructurado"
LEGACY_SERVICES = {
    7: "Soporte Tecnico Especializado",
    8: "Cableado y Redes",
    9: "Administracion de Servidores",
    10: "Seguridad y CCTV",
    11: "Domotica e IoT",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true", help="Reassign tickets and permanently delete verified legacy services.")
    return parser.parse_args()


def verified_legacy_services() -> list[Service]:
    services = list(Service.objects.filter(pk__in=LEGACY_SERVICES).order_by("id"))
    found = {service.id: service.nombre for service in services}
    if found != LEGACY_SERVICES:
        raise RuntimeError(f"Legacy-service verification failed: expected {LEGACY_SERVICES}, found {found}")
    return services


def main() -> int:
    args = parse_args()
    target = Service.objects.get(pk=TARGET_SERVICE_ID, nombre=TARGET_SERVICE_NAME)
    legacy_services = verified_legacy_services()
    affected_tickets = Ticket.objects.filter(servicio_id=8)

    print(f"Target service: {target.id} — {target.nombre}")
    print(f"Legacy services: {[(service.id, service.nombre) for service in legacy_services]}")
    print(f"Tickets to reassign from service 8: {list(affected_tickets.values_list('numero', flat=True))}")
    if not args.execute:
        return 0

    with transaction.atomic():
        reassigned = affected_tickets.update(servicio=target)
        deleted, _ = Service.objects.filter(pk__in=LEGACY_SERVICES).delete()
    print(f"Reassigned tickets: {reassigned}; deleted service records: {deleted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
