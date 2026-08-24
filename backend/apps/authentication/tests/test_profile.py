"""
Tests del endpoint de perfil propio — GET/PATCH /api/auth/perfil.

Cubre: autenticación requerida, actualización de campos editables,
inmutabilidad de email/rol por esta vía, y validación de cuerpo vacío.
Run: pytest apps/authentication/tests/test_profile.py -v
"""

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User

PERFIL_URL = '/api/auth/perfil'


def make_client_user(email='cliente@test.com', **extra):
    """Factory de usuario activo para tests (sin password: se usa force_authenticate)."""
    defaults = {
        'first_name': 'Ana',
        'last_name': 'Prueba',
        'ruc': '0912345678001',
        'empresa': 'ACME',
        'role': User.Role.CLIENT,
        'estado': User.Estado.ACTIVE,
        'email_verificado': True,
    }
    defaults.update(extra)
    return User.objects.create_user(email=email, **defaults)


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestProfileEndpoint:

    def test_get_requires_authentication(self):
        assert APIClient().get(PERFIL_URL).status_code == 401

    def test_patch_requires_authentication(self):
        assert APIClient().patch(PERFIL_URL, {'nombre': 'X'}).status_code == 401

    def test_get_returns_own_profile(self):
        user = make_client_user()
        response = auth_client(user).get(PERFIL_URL)
        assert response.status_code == 200
        assert response.data['email'] == user.email
        assert response.data['empresa'] == 'ACME'
        assert response.data['tipo_identificacion'] == User.TipoIdentificacion.RUC

    def test_patch_updates_editable_fields(self):
        user = make_client_user()
        response = auth_client(user).patch(PERFIL_URL, {
            'nombre': 'Vicky', 'apellido': 'Pinto',
            'empresa': 'CONTAIMP', 'ruc': '0919000000001',
        })
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.first_name == 'Vicky'
        assert user.last_name == 'Pinto'
        assert user.empresa == 'CONTAIMP'
        assert user.ruc == '0919000000001'

    def test_patch_can_select_cedula_and_updates_length_contract(self):
        user = make_client_user()
        response = auth_client(user).patch(PERFIL_URL, {
            'tipo_identificacion': User.TipoIdentificacion.CEDULA,
            'ruc': '0912345678',
        })
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.tipo_identificacion == User.TipoIdentificacion.CEDULA
        assert user.ruc == '0912345678'

    @pytest.mark.parametrize('invalid_value', [
        '091234567', '09123456789', '09123-4567', '09123 4567', '09123456A8',
    ])
    def test_patch_rejects_invalid_cedula_without_changing_profile(self, invalid_value):
        user = make_client_user()
        response = auth_client(user).patch(PERFIL_URL, {
            'tipo_identificacion': User.TipoIdentificacion.CEDULA,
            'ruc': invalid_value,
        })
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.tipo_identificacion == User.TipoIdentificacion.RUC
        assert user.ruc == '0912345678001'

    def test_patch_partial_update_keeps_other_fields(self):
        user = make_client_user()
        response = auth_client(user).patch(PERFIL_URL, {'empresa': 'Nueva SA'})
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.empresa == 'Nueva SA'
        assert user.first_name == 'Ana'  # intacto

    def test_patch_cannot_change_email_nor_role(self):
        user = make_client_user()
        response = auth_client(user).patch(PERFIL_URL, {
            'nombre': 'Ana', 'email': 'otro@test.com', 'rol': 'ADMINISTRADOR',
        })
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email == 'cliente@test.com'
        assert user.role == User.Role.CLIENT

    def test_patch_empty_body_returns_400(self):
        user = make_client_user()
        assert auth_client(user).patch(PERFIL_URL, {}).status_code == 400

    def test_worker_profile_does_not_inherit_client_identification_requirement(self):
        worker = make_client_user(
            email='worker@test.com',
            role=User.Role.WORKER,
            ruc='',
            empresa='',
        )
        response = auth_client(worker).patch(PERFIL_URL, {
            'nombre': 'Técnico',
            'ruc': '',
            'empresa': '',
        })
        assert response.status_code == 200
        worker.refresh_from_db()
        assert worker.first_name == 'Técnico'
