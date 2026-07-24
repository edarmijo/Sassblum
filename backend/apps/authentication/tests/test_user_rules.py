"""
Tests de las reglas de negocio de cuentas — administrador único y roles cerrados.

Reglas cubiertas:
    R1: el registro público SIEMPRE crea rol cliente (nadie se autonombra worker/admin).
    R2: el panel admin NO puede crear administradores (serializer + servicio).
    R3: createsuperuser rechaza un segundo administrador (admin único).
    R4: los trabajadores se crean con cualquier correo válido (decisión 2026-07-17:
        el dominio corporativo es política operativa, no restricción técnica).
Run: pytest apps/authentication/tests/test_user_rules.py -v
"""

import secrets

import pytest

from apps.authentication.models import User
from apps.authentication.serializers.user_admin_serializers import UserCreateSerializer
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

    def test_worker_accepts_any_valid_email(self):
        """R4: el admin puede crear trabajadores con correo personal o corporativo."""
        for email in ('tecnico@sassblum.com', 'tecnico.externo@gmail.com'):
            s = UserCreateSerializer(data={
                'nombre': 'A', 'apellido': 'B',
                'email': email, 'password': RUNTIME_SECRET,
                'role': 'worker',
            })
            assert s.is_valid(), s.errors
