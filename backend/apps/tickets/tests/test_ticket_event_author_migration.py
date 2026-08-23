"""Data-migration coverage for the immutable TicketEvent author snapshot."""

from __future__ import annotations

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


MIGRATE_FROM = ("tickets", "0007_ticket_contact_email_and_audit_event")
MIGRATE_TO = ("tickets", "0008_ticket_event_author_snapshot")


@pytest.mark.django_db(transaction=True)
def test_migration_backfills_user_and_system_author_names() -> None:
    executor = MigrationExecutor(connection)
    leaf_nodes = executor.loader.graph.leaf_nodes()
    migrate_from_targets = [
        node for node in leaf_nodes if node[0] != "tickets"
    ] + [MIGRATE_FROM]
    executor.migrate(migrate_from_targets)

    try:
        old_apps = executor.loader.project_state(migrate_from_targets).apps
        user_model = old_apps.get_model("authentication", "User")
        service_model = old_apps.get_model("catalog", "Service")
        ticket_model = old_apps.get_model("tickets", "Ticket")
        event_model = old_apps.get_model("tickets", "TicketEvent")

        author = user_model.objects.create(
            email="historical-author@example.com",
            first_name="Autora",
            last_name="Histórica",
            password="!",
            role="admin",
            estado="activo",
        )
        client = user_model.objects.create(
            email="historical-client@example.com",
            password="!",
            role="client",
            estado="activo",
        )
        service = service_model.objects.create(
            nombre="Servicio de migración de autor",
            descripcion="Datos creados en el estado anterior de la migración.",
            categoria="Pruebas",
            imagen_url="",
            descripcion_detalle="",
        )
        ticket = ticket_model.objects.create(
            numero="T-2026-8888",
            asunto="Comprobar snapshot del autor",
            descripcion="La migración debe conservar la identidad visible.",
            servicio=service,
            cliente=client,
        )
        user_event = event_model.objects.create(
            ticket=ticket,
            autor=author,
            tipo_evento="comentario",
            comentario="Evento con una persona como autora.",
        )
        system_event = event_model.objects.create(
            ticket=ticket,
            autor=None,
            tipo_evento="comentario",
            comentario="Evento creado por la migración histórica.",
        )

        executor = MigrationExecutor(connection)
        migrate_to_targets = [
            node for node in executor.loader.graph.leaf_nodes()
            if node[0] != "tickets"
        ] + [MIGRATE_TO]
        executor.migrate(migrate_to_targets)
        new_apps = executor.loader.project_state(migrate_to_targets).apps
        migrated_event_model = new_apps.get_model("tickets", "TicketEvent")

        assert migrated_event_model.objects.get(pk=user_event.pk).autor_nombre == (
            "Autora Histórica"
        )
        assert migrated_event_model.objects.get(pk=system_event.pk).autor_nombre == (
            "Sistema (migración histórica)"
        )
    finally:
        restore_executor = MigrationExecutor(connection)
        restore_executor.migrate(restore_executor.loader.graph.leaf_nodes())
