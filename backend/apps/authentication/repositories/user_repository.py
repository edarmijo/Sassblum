"""
UserRepository — encapsulates all ORM access for the User model (Repository).

Responsibility (SRP): every User query lives here. AuthService never touches the
    ORM directly (DIP).
Depends on: BaseRepository[User], User model.
Pattern: Repository.
SOLID: DIP · SRP · LSP
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.authentication.models import User, UserMailboxEvent, UserOccupantChange


class UserRepository(BaseRepository[User]):

    def get_by_id(self, entity_id: int) -> Optional[User]:
        return User.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[User]:
        qs = User.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> User:
        password = data.pop("password", None)
        user = User(**data)
        if password:
            user.set_password(password)
        user.save()
        return user

    # Fields that are safe to update via this repository.
    # Prevents accidental modification of role, email, or password through bulk updates.
    ALLOWED_UPDATE_FIELDS = {
        'first_name', 'last_name', 'estado', 'intentos_fallidos',
        'bloqueado_hasta', 'email_verificado', 'buzon_estado', 'buzon_gestion',
    }

    def update(self, entity_id: int, data: dict) -> User:
        safe_data = {k: v for k, v in data.items() if k in self.ALLOWED_UPDATE_FIELDS}
        User.objects.filter(pk=entity_id).update(**safe_data)
        return self.get_by_id(entity_id)  # Returns None instead of DoesNotExist

    def delete(self, entity_id: int) -> None:
        User.objects.filter(pk=entity_id).delete()

    # ── Auth-specific ──────────────────────────────────────────────────────────

    def get_by_email(self, email: str) -> Optional[User]:
        return User.objects.filter(email__iexact=email).first()

    def email_exists(self, email: str) -> bool:
        return User.objects.filter(email__iexact=email).exists()

    def get_by_id_for_update(self, entity_id: int) -> Optional[User]:
        """Bloquea la cuenta durante la escritura final de una rotación."""
        return User.objects.select_for_update().filter(pk=entity_id).first()

    @staticmethod
    def save_rotated_occupant(
        user: User,
        first_name: str,
        last_name: str,
        credential: str,
    ) -> User:
        user.first_name = first_name
        user.last_name = last_name
        user.set_password(credential)
        user.estado = User.Estado.ACTIVE
        user.intentos_fallidos = 0
        user.buzon_estado = User.BuzonEstado.CREATED
        user.save(update_fields=[
            'first_name',
            'last_name',
            'password',
            'estado',
            'intentos_fallidos',
            'buzon_estado',
        ])
        return user

    @staticmethod
    def record_occupant_change(
        user: User,
        actor: User,
        previous_first_name: str,
        previous_last_name: str,
        new_first_name: str,
        new_last_name: str,
    ) -> UserOccupantChange:
        return UserOccupantChange.objects.create(
            usuario=user,
            actor=actor,
            correo_puesto=user.email,
            nombre_anterior=previous_first_name,
            apellido_anterior=previous_last_name,
            nombre_nuevo=new_first_name,
            apellido_nuevo=new_last_name,
        )

    @staticmethod
    def save_mailbox_state(
        user: User,
        state: str,
        management: str,
    ) -> User:
        user.buzon_estado = state
        user.buzon_gestion = management
        user.save(update_fields=['buzon_estado', 'buzon_gestion'])
        return user

    @staticmethod
    def record_mailbox_event(
        user: User,
        actor: User | None,
        action: str,
    ) -> UserMailboxEvent:
        return UserMailboxEvent.objects.create(
            usuario=user,
            actor=actor,
            correo_puesto=user.email,
            action=action,
        )
