"""
Tests de las reglas de negocio de cuentas — administrador único y roles cerrados.

Reglas cubiertas:
    R1: el registro público SIEMPRE crea rol cliente (nadie se autonombra worker/admin).
    R2: el panel admin NO puede crear administradores (serializer + servicio).
    R3: createsuperuser rechaza un segundo administrador (admin único).
    R4: los trabajadores solo se crean con el dominio corporativo configurado (B10).
        Las cuentas cliente conservan cualquier correo válido.
Run: pytest apps/authentication/tests/test_user_rules.py -v
"""

import secrets

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.authentication.serializers.user_admin_serializers import (
    UserCreateSerializer,
    UserUpdateSerializer,
)
from apps.authentication.services.auth_service import AuthService
from apps.authentication.services.user_admin_service import UserAdminService
from core.exceptions.domain_exceptions import DomainException

# Clave de prueba generada en runtime (nunca un literal — cumple política y Sonar)
# y con los requisitos de la cadena de validación: mayúscula, minúscula y número.
RUNTIME_SECRET = f"Aa1.{secrets.token_urlsafe(12)}"


@pytest.mark.django_db
class TestPublicRegistrationRole:

    def test_register_forces_client_role_even_if_role_injected(self):
        """R1: aunque el payload traiga role, el registro público lo ignora."""
        AuthService().register({
            'email': 'intruso@test.com',
            'nombre': 'X', 'apellido': 'Y',
            'password': RUNTIME_SECRET,
            'ruc': '0991234567001', 'empresa': 'Empresa',
            'role': 'admin',  # intento de inyección — debe ignorarse
        })
        assert User.objects.get(email='intruso@test.com').role == User.Role.CLIENT


@pytest.mark.django_db
class TestSingleAdminRule:

    def test_create_superuser_rejected_when_admin_exists(self):
        """R3: el sistema permite UN solo administrador."""
        # Arrange: el admin preexistente se crea por la vía sin guardia
        # (así el bloque raises contiene UNA sola invocación que puede lanzar).
        User.objects.create_user(
            'admin1@test.com', RUNTIME_SECRET, role=User.Role.ADMIN,
        )
        with pytest.raises(ValueError, match='un solo admin'):
            User.objects.create_superuser('admin2@test.com', RUNTIME_SECRET)

    def test_admin_panel_service_cannot_create_admin(self):
        """R2 (servicio): defensa en profundidad ante un serializer comprometido."""
        payload = {
            'email': 'otro-admin@sassblum.com',
            'password': RUNTIME_SECRET,
            'role': User.Role.ADMIN,
        }
        # El servicio se construye FUERA del bloque raises: así la única
        # invocación que puede lanzar es create_user (regla pytest de Sonar).
        service = UserAdminService()
        with pytest.raises(DomainException, match='administradores'):
            service.create_user(payload)


class TestAdminPanelSerializerRules:

    def test_serializer_rejects_admin_role(self):
        """R2 (serializer): 'admin' no es una opción válida."""
        s = UserCreateSerializer(data={
            'nombre': 'A', 'apellido': 'B',
            'email': 'x@sassblum.com', 'password': RUNTIME_SECRET,
            'role': 'admin',
        })
        assert not s.is_valid()
        assert 'role' in s.errors

    def test_worker_accepts_configured_domain_case_insensitively(self):
        """R4: la comparación del dominio corporativo no distingue mayúsculas."""
        serializer = UserCreateSerializer(data={
            'nombre': 'A', 'apellido': 'B',
            'email': 'tecnico@SASSBLUM.COM', 'password': RUNTIME_SECRET,
            'role': 'worker',
        })
        assert serializer.is_valid(), serializer.errors

    @override_settings(WORKER_EMAIL_DOMAIN='empresa.ec')
    def test_worker_domain_is_configurable_without_hardcoding_frontend(self):
        """R4: el backend usa el valor de entorno como única autoridad."""
        configured = UserCreateSerializer(data={
            'nombre': 'A', 'apellido': 'B',
            'email': 'tecnico@empresa.ec', 'password': RUNTIME_SECRET,
            'role': 'worker',
        })
        previous = UserCreateSerializer(data={
            'nombre': 'A', 'apellido': 'B',
            'email': 'tecnico@sassblum.com', 'password': RUNTIME_SECRET,
            'role': 'worker',
        })

        assert configured.is_valid(), configured.errors
        assert not previous.is_valid()
        assert 'email' in previous.errors

    @pytest.mark.parametrize('email', [
        'tecnico.externo@gmail.com',
        'tecnico@soporte.sassblum.com',
        'tecnico@sassblum.com.ejemplo.net',
    ])
    def test_worker_rejects_non_exact_corporate_domain(self, email):
        """R4: dominio externo, subdominio y sufijo engañoso se rechazan."""
        serializer = UserCreateSerializer(data={
            'nombre': 'A', 'apellido': 'B',
            'email': email, 'password': RUNTIME_SECRET,
            'role': 'worker',
        })
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_client_keeps_valid_external_email(self):
        """R4 no restringe las cuentas cliente administradas."""
        serializer = UserCreateSerializer(data={
            'nombre': 'A', 'apellido': 'B',
            'email': 'cliente@gmail.com', 'password': RUNTIME_SECRET,
            'role': 'client',
        })
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestWorkerDomainServiceDefense:

    @pytest.mark.parametrize('email', [
        'externo@gmail.com',
        'tecnico@externo@sassblum.com',
        'tecnico @sassblum.com',
    ])
    def test_service_rejects_invalid_worker_if_serializer_is_bypassed(self, email):
        """R4: dominio y formato no se evaden saltando la capa HTTP."""
        service = UserAdminService()
        payload = {
            'email': email,
            'password': RUNTIME_SECRET,
            'role': User.Role.WORKER,
        }
        with pytest.raises(DomainException, match='dominio corporativo'):
            service.create_user(payload)

        assert not User.objects.filter(email=email).exists()


@pytest.mark.django_db
class TestAdminUserNameUpdate:
    def test_admin_updates_only_name_and_last_name(self) -> None:
        admin = User.objects.create_user(
            email="admin-update@sassblum.com",
            password=RUNTIME_SECRET,
            role=User.Role.ADMIN,
            estado=User.Estado.ACTIVE,
        )
        worker = User.objects.create_user(
            email="worker-update@sassblum.com",
            password=RUNTIME_SECRET,
            first_name="Nombre",
            last_name="Anterior",
            role=User.Role.WORKER,
            estado=User.Estado.ACTIVE,
        )
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/usuarios/{worker.id}",
            {"nombre": "María José", "apellido": "Pérez Ñáñez"},
            format="json",
        )

        assert response.status_code == 200
        worker.refresh_from_db()
        assert worker.first_name == "María José"
        assert worker.last_name == "Pérez Ñáñez"
        assert worker.email == "worker-update@sassblum.com"
        assert worker.role == User.Role.WORKER
        assert worker.check_password(RUNTIME_SECRET)

    def test_update_rejects_email_role_and_password(self) -> None:
        serializer = UserUpdateSerializer(data={
            "nombre": "Intento",
            "email": "otro@sassblum.com",
            "role": User.Role.ADMIN,
            "password": RUNTIME_SECRET,
        })

        assert not serializer.is_valid()
        assert set(serializer.errors) == {"email", "password", "role"}

    def test_service_defense_ignores_fields_outside_name_contract(self) -> None:
        worker = User.objects.create_user(
            email="worker-defense@sassblum.com",
            password=RUNTIME_SECRET,
            role=User.Role.WORKER,
            estado=User.Estado.ACTIVE,
        )

        UserAdminService().update_user(worker.id, {
            "nombre": "Nombre Seguro",
            "email": "changed@sassblum.com",
            "role": User.Role.ADMIN,
            "password": "changed",
        })

        worker.refresh_from_db()
        assert worker.first_name == "Nombre Seguro"
        assert worker.email == "worker-defense@sassblum.com"
        assert worker.role == User.Role.WORKER
        assert worker.check_password(RUNTIME_SECRET)

    def test_non_admin_cannot_update_another_user(self) -> None:
        worker = User.objects.create_user(
            email="worker-actor@sassblum.com",
            role=User.Role.WORKER,
            estado=User.Estado.ACTIVE,
        )
        target = User.objects.create_user(
            email="worker-target@sassblum.com",
            role=User.Role.WORKER,
            estado=User.Estado.ACTIVE,
        )
        client = APIClient()
        client.force_authenticate(user=worker)

        response = client.patch(
            f"/api/usuarios/{target.id}",
            {"nombre": "No autorizado"},
            format="json",
        )

        assert response.status_code == 403

    def test_update_returns_404_for_unknown_user(self) -> None:
        admin = User.objects.create_user(
            email="admin-missing@sassblum.com",
            role=User.Role.ADMIN,
            estado=User.Estado.ACTIVE,
        )
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            "/api/usuarios/999999",
            {"apellido": "No existe"},
            format="json",
        )

        assert response.status_code == 404
