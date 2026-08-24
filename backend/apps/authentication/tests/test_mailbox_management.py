"""B15: alta/reintento de buzón y rotación segura de ocupante."""

from __future__ import annotations

from collections.abc import Iterator
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.interfaces import MailboxProviderUnavailable
from apps.authentication.models import User, UserMailboxEvent, UserOccupantChange
from apps.authentication.services.user_admin_service import (
    MailboxOperationFailed,
    UserAdminService,
)
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent
from core.exceptions.domain_exceptions import DomainException
from core.testing import random_credential

pytestmark = pytest.mark.django_db


class FakeMailboxProvider:
    def __init__(self, existing: set[str] | None = None) -> None:
        self.existing = {email.lower() for email in (existing or set())}
        self.created: list[tuple[str, str]] = []
        self.rotated: list[tuple[str, str]] = []
        self.fail_exists = False
        self.fail_create = False
        self.fail_rotate = False

    def mailbox_exists(self, email: str) -> bool:
        if self.fail_exists:
            raise MailboxProviderUnavailable("unavailable")
        return email.lower() in self.existing

    def create_mailbox(self, email: str, credential: str) -> None:
        if self.fail_create:
            raise MailboxProviderUnavailable("unavailable")
        self.created.append((email, credential))
        self.existing.add(email.lower())

    def rotate_credential(self, email: str, credential: str) -> None:
        if self.fail_rotate:
            raise MailboxProviderUnavailable("unavailable")
        self.rotated.append((email, credential))


def credential_sequence(*values: str) -> Iterator[str]:
    yield from values


def worker_payload() -> dict[str, str]:
    return {
        "email": "tecnico1@sassblum.com",
        "nombre": "Ana",
        "apellido": "Anterior",
        "password": random_credential(),
        "role": User.Role.WORKER,
    }


def make_worker(**overrides: object) -> User:
    data: dict[str, object] = {
        "email": "tecnico1@sassblum.com",
        "password": random_credential(),
        "first_name": "Ana",
        "last_name": "Anterior",
        "role": User.Role.WORKER,
        "estado": User.Estado.ACTIVE,
        "email_verificado": True,
        "buzon_estado": User.BuzonEstado.PENDING,
    }
    data.update(overrides)
    return User.objects.create_user(**data)


def test_worker_creation_creates_mailbox_and_returns_secret_once() -> None:
    mailbox_credential = random_credential()
    provider = FakeMailboxProvider()
    service = UserAdminService(
        mailbox_provider=provider,
        credential_generator=lambda: mailbox_credential,
    )

    result = service.create_user(worker_payload())

    user = User.objects.get(email="tecnico1@sassblum.com")
    assert user.buzon_estado == User.BuzonEstado.CREATED
    assert result["buzon_estado"] == User.BuzonEstado.CREATED
    assert result["buzon_password"] == mailbox_credential
    assert provider.created == [(user.email, mailbox_credential)]
    assert "buzon_password" not in service.list_users()[0]


def test_worker_creation_survives_provider_outage_as_pending() -> None:
    provider = FakeMailboxProvider()
    provider.fail_exists = True
    service = UserAdminService(mailbox_provider=provider)

    result = service.create_user(worker_payload())

    assert User.objects.filter(email="tecnico1@sassblum.com").exists()
    assert result["buzon_estado"] == User.BuzonEstado.PENDING
    assert result["buzon_gestion"] == User.BuzonGestion.UAPI
    assert "buzon_password" not in result


def test_worker_creation_without_provider_records_manual_mailbox_in_same_request() -> None:
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
    )

    result = UserAdminService(mailbox_provider=None).create_user(
        worker_payload(),
        admin,
    )

    assert result["buzon_estado"] == User.BuzonEstado.CREATED
    assert result["buzon_gestion"] == User.BuzonGestion.MANUAL
    assert UserMailboxEvent.objects.filter(
        usuario__email="tecnico1@sassblum.com",
        actor=admin,
        action=UserMailboxEvent.Action.MANUAL_CONFIRMED,
    ).count() == 1


def test_manual_mailbox_confirmation_requires_exact_email_and_is_audited() -> None:
    worker = make_worker(buzon_gestion=User.BuzonGestion.MANUAL)
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
    )
    service = UserAdminService(mailbox_provider=None)

    with pytest.raises(DomainException, match="no coincide"):
        service.confirm_manual_mailbox(worker.pk, "otro@sassblum.com", admin)

    result = service.confirm_manual_mailbox(worker.pk, worker.email, admin)
    repeated = service.confirm_manual_mailbox(worker.pk, worker.email.upper(), admin)

    worker.refresh_from_db()
    assert result["buzon_estado"] == User.BuzonEstado.CREATED
    assert result["buzon_gestion"] == User.BuzonGestion.MANUAL
    assert repeated["buzon_estado"] == User.BuzonEstado.CREATED
    events = UserMailboxEvent.objects.filter(usuario=worker)
    assert events.count() == 1
    assert events.get().actor == admin
    assert events.get().action == UserMailboxEvent.Action.MANUAL_CONFIRMED


def test_existing_mailbox_is_linked_without_rotation_or_secret() -> None:
    provider = FakeMailboxProvider({"tecnico1@sassblum.com"})
    service = UserAdminService(mailbox_provider=provider)

    result = service.create_user(worker_payload())

    assert result["buzon_estado"] == User.BuzonEstado.CREATED
    assert "buzon_password" not in result
    assert provider.created == []
    assert provider.rotated == []


def test_client_creation_never_calls_mailbox_provider() -> None:
    provider = FakeMailboxProvider()
    provider.fail_exists = True
    payload = worker_payload()
    payload.update({"email": "cliente@example.com", "role": User.Role.CLIENT})

    result = UserAdminService(mailbox_provider=provider).create_user(payload)

    assert result["buzon_estado"] == User.BuzonEstado.NOT_APPLICABLE


def test_retry_creates_missing_mailbox_idempotently() -> None:
    worker = make_worker()
    mailbox_credential = random_credential()
    provider = FakeMailboxProvider()
    service = UserAdminService(
        mailbox_provider=provider,
        credential_generator=lambda: mailbox_credential,
    )

    first = service.retry_mailbox(worker.pk)
    second = service.retry_mailbox(worker.pk)

    assert first["buzon_password"] == mailbox_credential
    assert first["buzon_estado"] == User.BuzonEstado.CREATED
    assert "buzon_password" not in second
    assert len(provider.created) == 1


def test_successful_rotation_preserves_position_and_revokes_sessions() -> None:
    old_application_credential = random_credential()
    worker = make_worker(
        password=old_application_credential,
        buzon_estado=User.BuzonEstado.CREATED,
    )
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
    )
    RefreshToken.for_user(worker)
    new_application_credential = random_credential()
    new_mailbox_credential = random_credential()
    credentials = credential_sequence(
        new_application_credential,
        new_mailbox_credential,
    )
    provider = FakeMailboxProvider({worker.email})
    service = UserAdminService(
        mailbox_provider=provider,
        credential_generator=lambda: next(credentials),
    )

    result = service.rotate_occupant(
        worker.pk,
        {"nombre": "Carlos", "apellido": "Nuevo"},
        admin,
    )

    worker.refresh_from_db()
    assert worker.email == "tecnico1@sassblum.com"
    assert worker.role == User.Role.WORKER
    assert (worker.first_name, worker.last_name) == ("Carlos", "Nuevo")
    assert not worker.check_password(old_application_credential)
    assert worker.check_password(new_application_credential)
    assert result["app_password"] == new_application_credential
    assert result["buzon_password"] == new_mailbox_credential
    assert provider.rotated == [(worker.email, new_mailbox_credential)]
    assert BlacklistedToken.objects.filter(token__user=worker).exists()

    audit = UserOccupantChange.objects.get(usuario=worker)
    assert audit.actor == admin
    assert audit.correo_puesto == worker.email
    assert (audit.nombre_anterior, audit.apellido_anterior) == ("Ana", "Anterior")
    assert (audit.nombre_nuevo, audit.apellido_nuevo) == ("Carlos", "Nuevo")
    assert new_application_credential not in str(audit.__dict__)
    assert new_mailbox_credential not in str(audit.__dict__)


def test_manual_rotation_revokes_sessions_and_never_returns_mailbox_secret() -> None:
    old_application_credential = random_credential()
    worker = make_worker(
        password=old_application_credential,
        buzon_estado=User.BuzonEstado.CREATED,
        buzon_gestion=User.BuzonGestion.MANUAL,
    )
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
    )
    RefreshToken.for_user(worker)
    new_application_credential = random_credential()
    service = UserAdminService(
        mailbox_provider=None,
        credential_generator=lambda: new_application_credential,
    )

    result = service.rotate_occupant_manually(
        worker.pk,
        {
            "nombre": "Carlos",
            "apellido": "Nuevo",
            "email_confirmacion": worker.email,
            "rotacion_buzon_confirmada": True,
        },
        admin,
    )

    worker.refresh_from_db()
    assert (worker.first_name, worker.last_name) == ("Carlos", "Nuevo")
    assert worker.check_password(new_application_credential)
    assert result["app_password"] == new_application_credential
    assert "buzon_password" not in result
    assert BlacklistedToken.objects.filter(token__user=worker).exists()
    assert UserOccupantChange.objects.filter(usuario=worker, actor=admin).exists()
    event = UserMailboxEvent.objects.get(
        usuario=worker,
        action=UserMailboxEvent.Action.MANUAL_ROTATED,
    )
    assert event.actor == admin
    assert new_application_credential not in str(event.__dict__)


def test_failed_rotation_does_not_change_local_identity_or_credential() -> None:
    old_application_credential = random_credential()
    worker = make_worker(
        password=old_application_credential,
        buzon_estado=User.BuzonEstado.CREATED,
    )
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
    )
    provider = FakeMailboxProvider({worker.email})
    provider.fail_rotate = True
    service = UserAdminService(mailbox_provider=provider)

    with pytest.raises(MailboxOperationFailed, match="no se cambió"):
        service.rotate_occupant(
            worker.pk,
            {"nombre": "Carlos", "apellido": "Nuevo"},
            admin,
        )

    worker.refresh_from_db()
    assert (worker.first_name, worker.last_name) == ("Ana", "Anterior")
    assert worker.check_password(old_application_credential)
    assert not UserOccupantChange.objects.filter(usuario=worker).exists()


def test_rotation_requires_an_existing_mailbox() -> None:
    worker = make_worker()
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
    )
    mailbox_provider = FakeMailboxProvider()
    service = UserAdminService(mailbox_provider=mailbox_provider)

    with pytest.raises(MailboxOperationFailed, match="no existe"):
        service.rotate_occupant(
            worker.pk,
            {"nombre": "Carlos", "apellido": "Nuevo"},
            admin,
        )


def test_rotation_keeps_previous_ticket_event_author_snapshot() -> None:
    worker = make_worker(buzon_estado=User.BuzonEstado.CREATED)
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
    )
    client_user = User.objects.create_user(
        email="client@example.com",
        password=random_credential(),
        role=User.Role.CLIENT,
    )
    catalog_service = Service.objects.create(
        nombre="Servicio para rotación",
        descripcion="Prueba de historial inmutable.",
        categoria="TI",
    )
    ticket = Ticket.objects.create(
        numero="T-2026-8815",
        asunto="Historial de ocupante",
        descripcion="El evento debe conservar su autor original.",
        servicio=catalog_service,
        cliente=client_user,
        asignado=worker,
        estado=Ticket.Estado.EN_PROCESO,
    )
    event = TicketEvent.objects.create(
        ticket=ticket,
        autor=worker,
        autor_nombre="Ana Anterior",
        tipo_evento=TicketEvent.TipoEvento.COMENTARIO,
        comentario="Comentario previo a la rotación.",
    )
    credentials = credential_sequence(random_credential(), random_credential())

    UserAdminService(
        mailbox_provider=FakeMailboxProvider({worker.email}),
        credential_generator=lambda: next(credentials),
    ).rotate_occupant(
        worker.pk,
        {"nombre": "Carlos", "apellido": "Nuevo"},
        admin,
    )

    event.refresh_from_db()
    ticket.refresh_from_db()
    assert event.autor_nombre == "Ana Anterior"
    assert ticket.asignado_id == worker.pk


def test_admin_rotation_endpoint_returns_ephemeral_credentials() -> None:
    worker = make_worker(buzon_estado=User.BuzonEstado.CREATED)
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
    )
    application_credential = random_credential()
    mailbox_credential = random_credential()
    credentials = credential_sequence(application_credential, mailbox_credential)
    service = UserAdminService(
        mailbox_provider=FakeMailboxProvider({worker.email}),
        credential_generator=lambda: next(credentials),
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    with patch(
        "apps.authentication.views.user_admin_views.get_user_admin_service",
        return_value=service,
    ):
        response = client.post(
            f"/api/usuarios/{worker.pk}/rotar-ocupante",
            {"nombre": "Carlos", "apellido": "Nuevo"},
            format="json",
        )

    assert response.status_code == 200
    assert response["Cache-Control"] == "no-store"
    assert response["Pragma"] == "no-cache"
    assert response.data["app_password"] == application_credential
    assert response.data["buzon_password"] == mailbox_credential


def test_admin_can_confirm_manual_mailbox_through_explicit_endpoint() -> None:
    worker = make_worker(buzon_gestion=User.BuzonGestion.MANUAL)
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
    )
    service = UserAdminService(mailbox_provider=None)
    client = APIClient()
    client.force_authenticate(user=admin)

    with patch(
        "apps.authentication.views.user_admin_views.get_user_admin_service",
        return_value=service,
    ):
        response = client.post(
            f"/api/usuarios/{worker.pk}/buzon/confirmar-manual",
            {"email": worker.email},
            format="json",
        )

    assert response.status_code == 200
    assert response.data["buzon_estado"] == User.BuzonEstado.CREATED
    assert response.data["buzon_gestion"] == User.BuzonGestion.MANUAL
    assert "password" not in str(response.data).lower()
    assert UserMailboxEvent.objects.filter(
        usuario=worker,
        actor=admin,
        action=UserMailboxEvent.Action.MANUAL_CONFIRMED,
    ).exists()


def test_manual_rotation_endpoint_requires_cpanel_confirmation() -> None:
    worker = make_worker(
        buzon_estado=User.BuzonEstado.CREATED,
        buzon_gestion=User.BuzonGestion.MANUAL,
    )
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
    )
    service = UserAdminService(mailbox_provider=None)
    client = APIClient()
    client.force_authenticate(user=admin)

    with patch(
        "apps.authentication.views.user_admin_views.get_user_admin_service",
        return_value=service,
    ):
        response = client.post(
            f"/api/usuarios/{worker.pk}/rotar-ocupante-manual",
            {
                "nombre": "Carlos",
                "apellido": "Nuevo",
                "email_confirmacion": worker.email,
                "rotacion_buzon_confirmada": False,
            },
            format="json",
        )

    assert response.status_code == 400
    worker.refresh_from_db()
    assert (worker.first_name, worker.last_name) == ("Ana", "Anterior")
    assert not UserOccupantChange.objects.filter(usuario=worker).exists()


def test_manual_rotation_endpoint_returns_only_application_credential() -> None:
    worker = make_worker(
        buzon_estado=User.BuzonEstado.CREATED,
        buzon_gestion=User.BuzonGestion.MANUAL,
    )
    admin = User.objects.create_user(
        email="admin@sassblum.com",
        password=random_credential(),
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
    )
    application_credential = random_credential()
    service = UserAdminService(
        mailbox_provider=None,
        credential_generator=lambda: application_credential,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    with patch(
        "apps.authentication.views.user_admin_views.get_user_admin_service",
        return_value=service,
    ):
        response = client.post(
            f"/api/usuarios/{worker.pk}/rotar-ocupante-manual",
            {
                "nombre": "Carlos",
                "apellido": "Nuevo",
                "email_confirmacion": worker.email,
                "rotacion_buzon_confirmada": True,
            },
            format="json",
        )

    assert response.status_code == 200
    assert response["Cache-Control"] == "no-store"
    assert response.data["app_password"] == application_credential
    assert "buzon_password" not in response.data


def test_non_admin_cannot_retry_mailbox() -> None:
    actor = make_worker(email="actor@sassblum.com")
    target = make_worker(email="target@sassblum.com")
    client = APIClient()
    client.force_authenticate(user=actor)

    response = client.post(f"/api/usuarios/{target.pk}/buzon/reintentar")

    assert response.status_code == 403


def test_non_admin_cannot_confirm_manual_mailbox() -> None:
    actor = make_worker(email="actor@sassblum.com")
    target = make_worker(
        email="target@sassblum.com",
        buzon_gestion=User.BuzonGestion.MANUAL,
    )
    client = APIClient()
    client.force_authenticate(user=actor)

    response = client.post(
        f"/api/usuarios/{target.pk}/buzon/confirmar-manual",
        {"email": target.email},
        format="json",
    )

    assert response.status_code == 403
