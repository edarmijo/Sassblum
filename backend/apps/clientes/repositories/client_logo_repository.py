"""ORM gateway for customer logos (Repository pattern)."""

from __future__ import annotations

from typing import Optional

from apps.clientes.models import ClientLogo
from core.base.base_repository import BaseRepository


class ClientLogoRepository(BaseRepository[ClientLogo]):
    """Only this class accesses the ClientLogo ORM model (DIP/SRP)."""

    def get_by_id(self, entity_id: int) -> Optional[ClientLogo]:
        return ClientLogo.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[ClientLogo]:
        queryset = ClientLogo.objects.all()
        if filters:
            queryset = queryset.filter(**filters)
        return list(queryset)

    def create(self, data: dict) -> ClientLogo:
        return ClientLogo.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> ClientLogo:
        ClientLogo.objects.filter(pk=entity_id).update(**data)
        return ClientLogo.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        ClientLogo.objects.filter(pk=entity_id).delete()

    def get_active(self) -> list[ClientLogo]:
        return list(ClientLogo.objects.filter(activo=True))
