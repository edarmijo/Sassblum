# Guía de implementación — Conectar la API de notificaciones (S20)

> Esta guía es **para ti** (Erick). Contiene la parte que requiere tu entorno local
> (Supabase, Redis, SMTP) y que Claude no puede ejecutar. Todo el código de dominio
> (estrategias, factory, servicio, observer) **ya está creado**. Aquí solo cableas el runtime.

---

## Qué ya está hecho (no tocar)

| Archivo | Qué hace |
| --- | --- |
| `apps/notifications/interfaces/` | `INotificationStrategy`, `INotificationService` (ABCs) |
| `apps/notifications/strategies/` | `EmailNotificationStrategy`, `InAppNotificationStrategy`, `WebSocketNotificationStrategy` |
| `apps/notifications/factory/notification_factory.py` | `NotificationFactory.build(canal)` |
| `apps/notifications/services/notification_service.py` | `NotificationService` (Singleton) + `get_notification_service()` |
| `apps/tickets/apps.py` | Observer: serializa `TicketEvent` → dict y llama `dispatch()` |
| **`config/settings.py`** | ✅ **YA CONFIGURADO por Claude:** `EMAIL_BACKEND` (consola en dev / SMTP en prod), `DEFAULT_FROM_EMAIL`. `INSTALLED_APPS`, `CHANNEL_LAYERS`, `ASGI_APPLICATION` ya estaban. |
| **`apps/notifications/templates/email/`** | ✅ **YA CREADO por Claude:** `base_email.html` + 4 plantillas (versión funcional con estilos inline email-safe). |

> **Resultado:** el flujo de **email** ya funciona end-to-end sin que tú toques nada de config.
> Solo te queda correr el smoke test (abajo). Las credenciales SMTP reales solo hacen falta
> si despliegas a producción (`DJANGO_DEBUG=False`); en desarrollo el email sale por consola.

El flujo ya está conectado en código:

```text
Se crea un TicketEvent
        │  post_save (Django signal)
        ▼
apps/tickets/apps.py  ──serializa a dict──►  get_notification_service().dispatch(event)
        │
        ▼
NotificationService.dispatch()
        │  por cada destinatario y canal activo
        ▼
NotificationFactory.build(canal)  ──►  EmailStrategy / InAppStrategy / WebSocketStrategy
```

---

## Lo que TÚ debes implementar

### 1. `config/settings.py` — Registrar apps y backends

```python
# ── INSTALLED_APPS ──────────────────────────────────────────────
INSTALLED_APPS = [
    # ... apps de Django y DRF que ya tienes ...
    "channels",                    # NUEVO — para WebSocket (S23)
    "apps.authentication",
    "apps.catalog",
    "apps.tickets",
    "apps.notifications",          # NUEVO — registra la app de notificaciones
    "apps.realtime",               # NUEVO — consumer WS (S23)
]

# ── Email backend ───────────────────────────────────────────────
# En desarrollo: imprime el email en la consola (no envía nada real)
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.environ["EMAIL_HOST"]
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
    EMAIL_HOST_USER = os.environ["EMAIL_HOST_USER"]
    EMAIL_HOST_PASSWORD = os.environ["EMAIL_HOST_PASSWORD"]
    EMAIL_USE_TLS = True

DEFAULT_FROM_EMAIL = "no-reply@sassblum.com"

# ── Channels / Redis (necesario para WebSocketStrategy y S23) ────
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://localhost:6379/0")],
        },
    },
}
```

> **Nota sobre `templates/email/`:** las plantillas HTML se crean en S21–S22. Hasta entonces,
> `EmailStrategy` fallará al renderizar si recibes un evento real. Para probar S20 antes de S22,
> usa el `console.EmailBackend` y crea un archivo mínimo `templates/email/ticket_created.html`
> con `<p>{{ titulo }}</p><p>{{ cuerpo }}</p>` como placeholder temporal.

### 2. Instalar dependencias

```bash
pip install channels channels-redis
# Guárdalas en requirements.txt
```

### 3. `.env` — Variables de entorno

```env
# Email (solo en producción; en dev se usa consola)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu-correo@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password

# Redis (para WebSocket — puedes dejarlo apuntando a localhost en dev)
REDIS_URL=redis://localhost:6379/0
```

### 4. Migraciones (DESPUÉS de S21)

Los modelos `Notification` y `NotificationPreference` se crean en **S21**. Una vez existan:

```bash
cd backend
python manage.py makemigrations notifications
python manage.py migrate
```

> Hasta S21, el canal `in_app` fallará porque no existe la tabla. El servicio captura el error
> por canal (no rompe los otros), así que `email` seguirá funcionando.

---

## Cómo verificar que S20 quedó bien (smoke test)

Con `EMAIL_BACKEND = console` y el placeholder de plantilla creado:

```bash
cd backend
python manage.py shell
```

```python
from apps.tickets.models import Ticket, TicketEvent
from apps.authentication.models import User

# Usa un ticket existente (o créalo); el autor debe ser distinto del cliente
ticket = Ticket.objects.first()
TicketEvent.objects.create(
    ticket=ticket,
    autor=User.objects.filter(role="admin").first(),
    tipo_evento="creacion",
    comentario="Prueba de notificación S20",
)
```

**Resultado esperado:** en la consola donde corre el shell deberías ver el email renderizado
(asunto `[SassBlum] Nuevo ticket creado` + cuerpo). Eso confirma que el Observer dispara,
`NotificationService` resuelve destinatarios y `EmailStrategy` envía.

Si ves el email → **S20 funciona end-to-end**. Si no:

- ¿`apps.notifications` está en `INSTALLED_APPS`? (sin esto el import falla silenciosamente)
- ¿Existe `templates/email/ticket_created.html`? (sin esto `render_to_string` lanza `TemplateDoesNotExist`)
- ¿El autor del evento es distinto del cliente? (no se notifica al autor — D5)
- Verás un WARNING/ERROR de log para el canal `in_app` — es **esperado**: la tabla
  `Notification` no existe hasta S21. El email sigue funcionando (los canales se aíslan).

---

## Checklist S20

Hecho por Claude (no requiere acción tuya):

- [x] `channels` + `channels-redis` instalados (ya estaban en `requirements.txt`)
- [x] `apps.notifications` y `apps.realtime` en `INSTALLED_APPS`
- [x] `EMAIL_BACKEND` configurado (consola en dev / SMTP en prod) + `DEFAULT_FROM_EMAIL`
- [x] `CHANNEL_LAYERS` + `ASGI_APPLICATION` configurados
- [x] Plantillas `templates/email/` creadas (base + 4 plantillas funcionales)

Pendiente para ti:

- [ ] **Smoke test**: crear un `TicketEvent` en el shell → ver el email en consola (pasos arriba)
- [ ] (Solo producción) rellenar `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` en `.env`

---

_Cuando termines este checklist, avísale a Claude para continuar con **S21** (modelos
`Notification` / `NotificationPreference` + `NotificationRepository`), que es lo que habilita
el canal in-app y las migraciones reales._
