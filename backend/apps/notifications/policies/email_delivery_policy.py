"""Email addressing policy for account, ticket-contact and staff identities."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Mapping

from django.conf import settings

from apps.notifications.interfaces import EmailAddressing, IEmailDeliveryPolicy

TICKET_NOTIFICATION_TYPES = frozenset({
    "creacion",
    "asignacion",
    "reasignacion",
    "cambio_estado",
    "comentario",
})


def _normalise_addresses(values: Iterable[object]) -> tuple[str, ...]:
    """Return non-empty, case-insensitively deduplicated addresses."""
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        address = str(value).strip()
        key = address.casefold()
        if not address or key in seen:
            continue
        seen.add(key)
        result.append(address)
    return tuple(result)


class EmailDeliveryPolicy(IEmailDeliveryPolicy):
    """Keep account identity internal while routing client email to its snapshot."""

    def resolve(
        self,
        recipient: object,
        context: Mapping[str, object],
    ) -> EmailAddressing | None:
        notification_type = str(context.get("tipo", ""))
        is_ticket_notification = notification_type in TICKET_NOTIFICATION_TYPES
        recipient_id = getattr(recipient, "id", None)
        client_id = context.get("cliente_id")
        is_ticket_client = (
            is_ticket_notification
            and recipient_id is not None
            and client_id is not None
            and recipient_id == client_id
        )

        if is_ticket_client:
            destination = str(context.get("cliente_email", "")).strip()
        else:
            destination = str(getattr(recipient, "email", "")).strip()
        if not destination:
            return None

        reply_to = (
            _normalise_addresses(getattr(settings, "EMAIL_REPLY_TO", []))
            if is_ticket_notification
            else ()
        )
        cc = (
            _normalise_addresses(getattr(settings, "EMAIL_CC", []))
            if is_ticket_client
            else ()
        )
        destination_key = destination.casefold()
        cc = tuple(address for address in cc if address.casefold() != destination_key)

        return EmailAddressing(
            to=(destination,),
            cc=cc,
            reply_to=reply_to,
            is_ticket_client=is_ticket_client,
        )
