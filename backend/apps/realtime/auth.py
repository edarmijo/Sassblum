"""
WS handshake authentication — compartida por todos los consumers de realtime.

Responsibility (SRP): extraer y validar el JWT del handshake WebSocket.
    Antes cada consumer duplicaba su propio `_authenticate`; ahora hay una sola
    implementación (DRY) y agregar un consumer nuevo no copia nada.

Seguridad — por qué el token viaja en el subprotocolo y no en la URL:
    Las query strings quedan registradas en logs de servidor/proxy y en la
    consola del navegador (fuga de credencial). El cliente envía
    Sec-WebSocket-Protocol: sassblum.jwt, <access_token> y el servidor confirma
    `sassblum.jwt` al aceptar (el navegador cierra la conexión si el servidor
    no confirma uno de los subprotocolos ofrecidos).

Fallback temporal: se sigue aceptando `?token=` para clientes servidos antes de
este cambio (Vercel y Render no despliegan a la vez). Retirar cuando el frontend
en producción ya use el subprotocolo.
"""

from urllib.parse import parse_qs

#: Nombre del subprotocolo que precede al token en Sec-WebSocket-Protocol.
JWT_SUBPROTOCOL = "sassblum.jwt"


def _extract_token(scope) -> str | None:
    """Token del subprotocolo (preferido) o de la query string (deprecado)."""
    subprotocols = scope.get("subprotocols") or []
    if JWT_SUBPROTOCOL in subprotocols:
        idx = subprotocols.index(JWT_SUBPROTOCOL)
        if idx + 1 < len(subprotocols):
            return subprotocols[idx + 1]
        return None

    # DEPRECATED: ?token= — retirar cuando todos los clientes usen subprotocolo.
    query = parse_qs(scope.get("query_string", b"").decode())
    tokens = query.get("token", [])
    return tokens[0] if tokens else None


def negotiated_subprotocol(scope) -> str | None:
    """Subprotocolo a confirmar en accept(); None si el cliente no ofreció uno."""
    subprotocols = scope.get("subprotocols") or []
    return JWT_SUBPROTOCOL if JWT_SUBPROTOCOL in subprotocols else None


async def resolve_user(scope):
    """
    Valida el JWT del handshake y devuelve el User, o None si no autentica.
    Usa AccessToken de simplejwt (verifica firma y expiración).
    """
    from channels.db import database_sync_to_async  # noqa: PLC0415

    raw_token = _extract_token(scope)
    if not raw_token:
        return None

    @database_sync_to_async
    def _resolve(raw):
        try:
            from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
            from apps.authentication.models import User  # noqa: PLC0415
            return User.objects.filter(id=AccessToken(raw)["user_id"]).first()
        except Exception:  # noqa: BLE001
            return None

    return await _resolve(raw_token)
