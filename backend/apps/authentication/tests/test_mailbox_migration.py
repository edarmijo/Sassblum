"""Cobertura de la migración B15 para cuentas preexistentes."""

from __future__ import annotations

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

MIGRATE_FROM = ("authentication", "0007_user_tipo_identificacion")
MIGRATE_TO = ("authentication", "0008_user_mailbox_and_occupant_audit")


@pytest.mark.django_db(transaction=True)
def test_existing_workers_become_pending_and_other_roles_do_not_apply() -> None:
    executor = MigrationExecutor(connection)
    migrate_from_targets = [
        node
        for node in executor.loader.graph.leaf_nodes()
        if node[0] != "authentication"
    ] + [MIGRATE_FROM]
    executor.migrate(migrate_from_targets)

    try:
        old_apps = executor.loader.project_state(migrate_from_targets).apps
        old_user = old_apps.get_model("authentication", "User")
        worker = old_user.objects.create(
            email="existing-worker@sassblum.com",
            role="worker",
            estado="activo",
            password="!",
        )
        client = old_user.objects.create(
            email="existing-client@example.com",
            role="client",
            estado="activo",
            password="!",
        )

        executor = MigrationExecutor(connection)
        migrate_to_targets = [
            node
            for node in executor.loader.graph.leaf_nodes()
            if node[0] != "authentication"
        ] + [MIGRATE_TO]
        executor.migrate(migrate_to_targets)
        new_apps = executor.loader.project_state(migrate_to_targets).apps
        migrated_user = new_apps.get_model("authentication", "User")

        assert migrated_user.objects.get(pk=worker.pk).buzon_estado == "pendiente"
        assert migrated_user.objects.get(pk=worker.pk).buzon_gestion == "manual"
        assert migrated_user.objects.get(pk=client.pk).buzon_estado == "no_aplica"
        assert migrated_user.objects.get(pk=client.pk).buzon_gestion == "no_aplica"
    finally:
        restore_executor = MigrationExecutor(connection)
        restore_executor.migrate(restore_executor.loader.graph.leaf_nodes())
