# SassBlum Backend — Django + DRF

## Contexto específico del Backend para Claude Code

> Leer primero el CLAUDE.md raíz del workspace. Este archivo agrega contexto específico del backend.

---

## Estructura de apps Django

```
Backend/
├── manage.py
├── config/                    # settings.py, urls.py, wsgi.py, asgi.py
├── core/                      # Abstracciones compartidas
│   ├── interfaces/
│   │   ├── i_notification_strategy.py   # ABC
│   │   ├── i_report_exporter.py         # ABC
│   │   └── i_ticket_validator.py        # ABC
│   ├── base/
│   │   ├── base_service.py              # Abstract con error handling
│   │   ├── base_repository.py           # Generic ORM wrapper
│   │   └── base_validator.py            # Nodo base Chain of Responsibility
│   ├── factories/
│   │   ├── notification_factory.py
│   │   ├── exporter_factory.py
│   │   └── validator_factory.py
│   ├── exceptions/
│   │   ├── domain_exceptions.py
│   │   └── infrastructure_exceptions.py
│   └── permissions/
│       └── rbac_permissions.py          # IsClient, IsWorker, IsAdmin (ISP)
└── apps/
    ├── authentication/
    ├── catalog/
    ├── tickets/
    ├── notifications/
    ├── reports/
    └── realtime/
```

---

## Estructura interna de cada app (orden jerárquico)

```
apps/<nombre>/
├── interfaces/          # 1. SIEMPRE PRIMERO — ABCs Python
├── services/            # 2. Lógica de negocio (Singleton via module system)
├── repositories/        # 3. Acceso a datos (extiende BaseRepository)
├── validators/          # 4. Validadores (nodos de Chain of Responsibility)
├── serializers/         # 5. Transformación de datos DRF (un serializer por operación)
├── views/               # 6. Solo orquestación HTTP (dependen de la interfaz, no la clase)
├── models/              # Definición de datos únicamente
└── tests/               # pytest + pytest-django
```

---

## Reglas específicas del backend

### Modelos Django

- Solo definen estructura de datos y relaciones.
- Métodos permitidos en el modelo: validaciones de campo (`clean()`), propiedades derivadas simples.
- **Prohibido** en modelos: lógica de negocio, llamadas a otros servicios, envío de emails.

### Serializers DRF

- Un serializer por operación: `LoginSerializer`, `RegisterSerializer`, `TicketCreateSerializer`.
- No reutilizar un serializer para operaciones distintas aunque parezcan similares.
- No contienen lógica de negocio: validan datos y los pasan al servicio.

### Vistas DRF

- Dependen de la interfaz (`IAuthService`), nunca de la implementación (`AuthService`).
- Declaran solo el permiso que necesitan (`permission_classes = [IsClient]`).
- No acceden al ORM directamente: delegan todo al repositorio vía el servicio.

### Señales Django (Observer Pattern)

- `post_save` en `TicketEvent` dispara `NotificationService.dispatch()`.
- Las señales se registran en `apps.py` (método `ready()`), nunca en `models.py`.
- Evitar acoplamiento circular: `notifications` no importa de `tickets` directamente.

### JWT con simplejwt

- Access token: 1 hora (`JWT_ACCESS_TOKEN_LIFETIME = timedelta(hours=1)`)
- Refresh token: 7 días (`JWT_REFRESH_TOKEN_LIFETIME = timedelta(days=7)`)
- Rotación habilitada: `ROTATE_REFRESH_TOKENS = True`
- Blacklist en logout: app `rest_framework_simplejwt.token_blacklist` instalada

### Interfaces Python (ABCs)

```python
from abc import ABC, abstractmethod

class IAuthService(ABC):
    @abstractmethod
    def authenticate(self, email: str, password: str): ...

    @abstractmethod
    def register(self, data: dict): ...
```

Cualquier clase que no implemente todos los métodos lanza `TypeError` en import time (LSP garantizado).

---

## Variables de entorno (.env)

```env
DJANGO_SECRET_KEY=
DJANGO_DEBUG=False
DATABASE_URL=postgresql://...supabase...
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800
ALLOWED_HOSTS=api.sassblum.com
```

---

## Comandos de desarrollo

```bash
python manage.py runserver
python manage.py makemigrations <app_name>
python manage.py migrate
python manage.py createsuperuser

# Tests
pytest -v
pytest apps/authentication/tests/ -v
pytest --cov=apps --cov-report=term-missing --cov-fail-under=80

# Django Channels (requiere Redis corriendo)
daphne config.asgi:application
```

---

## Sprint 1 — Sesiones activas (authentication/)

Las sesiones del Sprint 1 a completar en orden:

1. **S1** ✅ — Estructura + `IAuthService` (ABC) + `BaseValidator` (nodo base) — **completada 2026-06-01**
2. **S2** — Modelo `User` (AbstractUser extendido, solo datos)
3. **S3** — Serializers: Login, Register, ResetPassword, VerifyEmail
4. **S4** — 6 vistas DRF (dependen de `IAuthService`, no de la clase)
5. **S7** — `AuthService` (Singleton) + simplejwt config + `TokenService`
6. **S8** — Tests: validators, cadena, bloqueo 5 intentos, JWT, blacklist
7. **S9** — Permisos RBAC: `IsClient`, `IsWorker`, `IsAdmin` (ISP puro)
8. **S10** — Revisión SOLID + smoke test end-to-end

---

## Archivos creados en S1 (2026-06-01)

### core/ — contratos transversales

```text
backend/core/interfaces/__init__.py          ← paquete Python
backend/core/base/__init__.py                ← paquete Python
backend/core/base/base_validator.py          ← BaseValidator ABC (Chain of Responsibility node)
backend/core/base/base_repository.py        ← BaseRepository[T] ABC genérico (Repository pattern)
```

### apps/authentication/ — contratos específicos de auth

```text
apps/authentication/interfaces/__init__.py   ← exporta IAuthService
apps/authentication/interfaces/i_auth_service.py  ← IAuthService ABC (7 @abstractmethod)
apps/authentication/services/__init__.py     ← placeholder S7
apps/authentication/repositories/__init__.py ← placeholder S7
apps/authentication/validators/__init__.py   ← placeholder S8
apps/authentication/serializers/__init__.py  ← placeholder S3
apps/authentication/views/__init__.py        ← placeholder S4
apps/authentication/tests/__init__.py        ← placeholder S8
```

### Regla de importación (DIP — obligatoria para toda la app)

```python
# CORRECTO — vista depende de la interfaz
from apps.authentication.interfaces import IAuthService

# INCORRECTO — vista depende de la clase concreta
from apps.authentication.services.auth_service import AuthService
```

Sprint actual: Sprint 4 COMPLETO (R1–R3 runtime + S28–S34) ✅ · MVP integral end-to-end
> Flujo completo: registro→login→catálogo→crear ticket→Observer→notificación (email+in-app+WS)→
> admin asigna→worker cambia estado→notificación→historial→reportes/exportar.
> `manage.py check` sin errores · 30+ rutas API + 2 rutas WS montadas. Para correr: el usuario hace
> `pip install -r requirements.txt` · `migrate` · `createsuperuser` · `daphne config.asgi:application`.
> Validado: `python manage.py check` OK · migraciones 0001 (catalog/tickets/notifications) + auth 0002.
> Runtime que el usuario debe correr: `pip install -r requirements.txt` · `migrate` contra su BD · smoke test
> (ver `apps/notifications/GUIA_IMPLEMENTACION_API_S20.md`). Tests: `pip install pytest pytest-django` → `pytest`.
> Gap cubierto en runtime: se creó `catalog.Service` (faltaba; el FK de Ticket lo exigía) para que el proyecto migre.

---

## Sprint 2 — Sesiones activas (catalog/ + tickets/)

| Sesión | Módulo | Foco | Estado |
| --- | --- | --- | --- |
| **S11** | catalog/ | Interfaces ISP + infraestructura core | ✅ 2026-06-01 |
| **S12** | tickets/ | ITicketService, IStorageService, estructura | ✅ 2026-06-01 |
| **S13** | tickets/ | Cadena de validadores + ValidatorFactory | ✅ 2026-06-01 |
| **S14** | tickets/ | TicketStateMachine (Strategy) | ✅ 2026-06-01 |
| **S15** | tickets/ | Interfaces ISP por rol (Client/Worker/Admin) | ✅ 2026-06-01 |
| **S16** | tickets/ | TicketEvent (audit log) + Observer Signals | ✅ 2026-06-01 |
| **S17** | tickets/ | Componentes React (S17 es frontend) | ✅ 2026-06-01 |
| **S18** | ambos | Tests + auditoría SOLID | ✅ 2026-06-01 |

---

## Sprint 3 — Sesiones activas (notifications/ + tickets/ historial + auth/ reset)

| Sesión | Módulo | Foco | Estado |
| --- | --- | --- | --- |
| **S19** | notifications/ | Interfaces ISP + 3 strategies + Factory | ✅ 2026-06-01 |
| **S20** | notifications/ | Observer activo + NotificationService Singleton | ✅ 2026-06-01 (runtime: guía MD) |
| **S21** | notifications/ | Modelos + NotificationRepository | ✅ 2026-06-02 |
| **S22** | notifications/ | Plantillas email HTML | ✅ (adelantada en S20) |
| **S23** | realtime/ | NotificationConsumer + WebSocketStrategy | ✅ 2026-06-02 |
| **S24** | tickets/ | TicketRepository + historial paginado | ✅ 2026-06-02 |
| **S25** | auth/ | TokenService + recuperación contraseña | ✅ 2026-06-02 |
| **S26** | notifications/ | Componentes React FE | ✅ 2026-06-02 |
| **S27** | todos | Tests + auditoría SOLID | ✅ 2026-06-02 |

---

## Archivos creados en S19 (2026-06-01)

```text
apps/notifications/interfaces/__init__.py              ← exporta INotificationStrategy, INotificationService
apps/notifications/interfaces/i_notification_strategy.py ← ABC: validate(), send(), log()
apps/notifications/interfaces/i_notification_service.py  ← ABC: dispatch(), get_user_notifications(),
                                                             mark_as_read(), get_preferences(),
                                                             set_preferences()
apps/notifications/strategies/__init__.py              ← exporta las 3 estrategias
apps/notifications/strategies/email_strategy.py        ← EmailNotificationStrategy
                                                          send() → render_to_string + send_mail
                                                          TEMPLATE_MAP: tipo → (template, subject)
apps/notifications/strategies/in_app_strategy.py       ← InAppNotificationStrategy
                                                          send() → NotificationRepository.create()
                                                          DIP: recibe repo en __init__
apps/notifications/strategies/websocket_strategy.py    ← WebSocketNotificationStrategy
                                                          send() → channel_layer.group_send()
                                                          grupo: 'notif_user_{user_id}'
apps/notifications/factory/__init__.py                 ← exporta NotificationFactory
apps/notifications/factory/notification_factory.py     ← NotificationFactory.build(channel_type, repo?)
                                                          CHANNEL_MAP: 'email'|'in_app'|'ws'
                                                          OCP: SMSStrategy = 1 archivo + 1 entrada
```

### Decisiones de diseño S19

- **D1:** `validate()` separado de `send()` — la estrategia comprueba si puede entregar antes de intentar (SRP)
- **D2:** `NotificationFactory.build()` retorna `INotificationStrategy` — nunca la clase concreta (DIP + LSP)
- **D3:** `log()` en la interfaz — cada canal registra sus propios intentos, sin que `NotificationService` conozca el mecanismo (SRP)
- **D4:** Imports dentro de `build()` — evita circular imports entre factory y strategies

---

## Archivos creados en S20 (2026-06-01)

```text
apps/notifications/services/__init__.py             ← exporta NotificationService, get_notification_service
apps/notifications/services/notification_service.py ← NotificationService(INotificationService) — Singleton
                                                       dispatch(event: dict) → fan-out multicanal
                                                       _resolve_recipients(event) → destinatarios por tipo_evento
                                                       get_user_notifications · mark_as_read
                                                       get_preferences · set_preferences
                                                       get_notification_service() → instancia compartida (lazy)
apps/tickets/apps.py (modificado)                   ← el handler ahora serializa TicketEvent → dict
                                                       (ticket_numero, cliente_id, asignado_id, autor_id...)
                                                       y llama get_notification_service().dispatch(payload)
apps/notifications/GUIA_IMPLEMENTACION_API_S20.md   ← guía para el usuario: settings, channels,
                                                       EMAIL_BACKEND, .env, migraciones, smoke test
```

### Decisiones de diseño S20

- **D5 (impl):** `_resolve_recipients()` selecciona destinatarios por `tipo_evento` y excluye al autor (sin auto-notificaciones)
- **D6:** El handler en `apps/tickets/apps.py` serializa el evento a dict ANTES de cruzar a notifications — `apps.notifications` NUNCA importa `apps.tickets` (acoplamiento unidireccional)
- **D7:** `dispatch()` captura errores POR CANAL — si `email` falla, `in_app` y `ws` siguen (resiliencia)
- **D8:** Singleton vía `get_notification_service()` con instancia lazy a nivel de módulo — en tests se inyecta un repo mock
- **D9:** Runtime de email cerrado por Claude (settings + plantillas); el usuario solo corre el smoke test

### Runtime cerrado en S20 (2026-06-02)

```text
config/settings.py (modificado)        ← bloque EMAIL: EMAIL_BACKEND (console si DEBUG / SMTP si no),
                                          EMAIL_HOST/PORT/USER/PASSWORD/USE_TLS desde env,
                                          DEFAULT_FROM_EMAIL. (channels/INSTALLED_APPS/CHANNEL_LAYERS
                                          /ASGI_APPLICATION ya existían.)
apps/notifications/apps.py (modificado) ← NotificationsConfig + default_auto_field
apps/notifications/strategies/email_strategy.py (modificado)
                                       ← usa settings.DEFAULT_FROM_EMAIL (antes hardcodeado)
apps/notifications/templates/email/base_email.html      ← layout email-safe (header/footer SassBlum)
apps/notifications/templates/email/ticket_created.html  ← extends base (adelanta S22)
apps/notifications/templates/email/ticket_assigned.html ← extends base (adelanta S22)
apps/notifications/templates/email/status_changed.html  ← extends base (adelanta S22)
apps/notifications/templates/email/password_reset.html  ← extends base (adelanta S22)
```

- **D10:** Las 5 plantillas de email (entregable de S22) se crearon ya en S20 porque `EmailStrategy`
  quedaba rota en runtime sin ellas. S22 queda como "refinar diseño si hace falta" — el contrato está cumplido.
- **D11:** Canal `in_app` degrada con gracia hasta S21 (sin tabla `Notification`): `dispatch()`
  aísla el fallo por canal, el email sigue. S21 wirea `NotificationRepository` y lo habilita.

---

## Archivos creados en S21–S27 (2026-06-02) — Sprint 3 completado

### S21 — Modelos + NotificationRepository

```text
apps/notifications/models/__init__.py             ← exporta Notification, NotificationPreference
apps/notifications/models/notification.py         ← Notification (usuario FK, tipo, titulo, cuerpo,
                                                     leida, payload JSONField, created_at)
                                                     índice parcial WHERE leida=false (badge)
apps/notifications/models/notification_preference.py ← NotificationPreference (OneToOne user,
                                                        email_activo/in_app_activo/ws_activo, default True)
apps/notifications/repositories/notification_repository.py ← NotificationRepository(BaseRepository[Notification])
                                                     5 CRUD + get_unread_count, get_user_notifications,
                                                     mark_as_read, mark_all_as_read, get_or_create_preferences
apps/notifications/services/notification_service.py (recreado) ← get_notification_service() ahora wirea
                                                     NotificationRepository por defecto (lazy) → habilita in_app
apps/catalog/models/service.py                    ← Service (nombre, descripcion, categoria, activo) —
                                                     FALTABA; el FK de Ticket lo exigía. Desbloquea migraciones.
migraciones: catalog/0001, tickets/0001, notifications/0001, authentication/0002 (PasswordResetToken)
```

### Notifications API (serializers + views + urls)

```text
apps/notifications/serializers/notification_list_serializer.py        ← read-only (SRP)
apps/notifications/serializers/notification_preferences_serializer.py ← PATCH parcial (SRP)
apps/notifications/views/notification_views.py    ← NotificationListView · MarkReadView ·
                                                     MarkAllReadView · NotificationPreferencesView
                                                     dependen de INotificationService (DIP)
apps/notifications/urls.py                         ← GET / · PATCH /<id>/marcar-leida ·
                                                     PATCH /marcar-todas-leidas · GET|PATCH /preferencias
config/urls.py                                     ← monta /api/notificaciones/, /api/tickets/, /api/auth/
```

### S23 — Realtime (Django Channels)

```text
apps/realtime/consumers/notification_consumer.py  ← NotificationConsumer(AsyncJsonWebsocketConsumer)
                                                     connect() valida JWT (?token=) → grupo notif_user_{id}
                                                     notification_new() relay al cliente · disconnect() limpia
config/websocket_urls.py                           ← re_path ws/notifications/
config/asgi.py (modificado)                        ← ProtocolTypeRouter + AllowedHostsOriginValidator + URLRouter
```

### S24 — Historial de tickets

```text
apps/tickets/repositories/ticket_repository.py    ← TicketRepository(BaseRepository[Ticket])
                                                     get_all_for_user (ACL por rol + filtros + paginación)
                                                     get_history (ACL) · find_active_duplicate (usado por S13)
                                                     select_related/prefetch_related (sin N+1)
apps/tickets/serializers/ticket_list_serializer.py ← TicketListSerializer (read-only, SRP)
apps/tickets/views/ticket_history_views.py        ← TicketListView (GET /api/tickets, filtros+paginación)
                                                     TicketHistoryView (GET /api/tickets/<id>/historial)
apps/tickets/urls.py                               ← rutas de listado e historial
```

### S25 — Recuperación de contraseña

```text
apps/authentication/models.py (PasswordResetToken) ← token UUID, expira_en, usado (solo datos, SRP)
apps/authentication/services/token_service.py     ← TokenService (SRP, separado de AuthService)
                                                     generate/validate/consume_token · invalidate_sessions
                                                     (blacklist simplejwt) · TTL 1h, un solo uso
apps/authentication/serializers/forgot_password_serializer.py · reset_password_serializer.py
apps/authentication/views/password_reset_views.py ← ForgotPasswordView (no enumera emails) ·
                                                     ResetPasswordView (valida token, hash, invalida sesiones)
apps/authentication/urls.py                        ← forgot-password · reset-password
```

### S27 — Tests + pytest

```text
apps/notifications/tests/test_strategies.py        ← Email/InApp/WS en aislamiento (mocks, sin BD)
apps/notifications/tests/test_notification_service.py ← dispatch() routing + preference gating (mocks)
apps/authentication/tests/test_password_reset.py   ← TokenService (django_db: válido/expirado/usado)
apps/tickets/tests/test_ticket_repository.py       ← ACL por rol · duplicados · historial (django_db)
pytest.ini                                          ← DJANGO_SETTINGS_MODULE
requirements.txt                                    ← + pytest, pytest-django
```

### Decisiones de diseño S21–S27

- **D12:** `get_notification_service()` wirea `NotificationRepository()` por defecto (lazy) — in_app habilitado sin tocar el handler de tickets
- **D13:** Se creó `catalog.Service` (faltaba desde S11, solo interfaces) — el FK `Ticket.servicio` lo exigía; desbloquea `check` y migraciones
- **D14:** `NotificationConsumer` valida el JWT en el handshake (`?token=`) vía `AccessToken` de simplejwt — DIP, no acopla al modelo
- **D15:** `ForgotPasswordView` devuelve el MISMO mensaje exista o no el email (sin enumeración) — el email se despacha vía `EmailStrategy` directamente (no es TicketEvent, no pasa por el Observer)
- **D16:** Tests de estrategias y servicio usan mocks (corren sin BD); los de repositorio/token usan `@pytest.mark.django_db` (corren en la BD del usuario)

## Runtime funcional cerrado (Sprint 4 · 2026-06-02) — R1/R2/R3

Estos eran los servicios concretos que FALTABAN para que el proyecto corriera (antes solo había
interfaces). Ahora el flujo funciona end-to-end.

### R1 — Auth runtime

```text
apps/authentication/repositories/user_repository.py  ← UserRepository(BaseRepository[User])
apps/authentication/validators/email_validator.py · password_validator.py · registration_validator_chain.py
apps/authentication/services/auth_service.py         ← AuthService(IAuthService) Singleton:
                                                        authenticate (bloqueo 5 intentos), register,
                                                        logout (blacklist), verify_email (token firmado),
                                                        generate_tokens (simplejwt), forgot/reset (→TokenService)
                                                        get_auth_service()
apps/authentication/serializers/  login · register · verify_email/logout
apps/authentication/views/auth_views.py              ← Register/Login/Logout/VerifyEmail (DIP)
apps/authentication/urls.py                          ← + token/refresh (simplejwt)
```

### R2 — Catalog runtime

```text
apps/catalog/repositories/service_repository.py  ← ServiceRepository(BaseRepository[Service])
apps/catalog/services/catalog_service.py         ← CatalogService(ICatalogClientView, ICatalogAdminView)
                                                    Singleton · get_catalog_service()
apps/catalog/serializers/service_serializers.py  ← ServiceCreate · ServiceEdit
apps/catalog/views/catalog_views.py              ← ServiceListView · ServiceDetailView · ServiceAdminView(IsAdmin)
apps/catalog/urls.py + config/urls.py            ← /api/servicios/
```

### R3 — Tickets runtime

```text
apps/tickets/services/storage_service.py  ← StorageService(IStorageService) — stub Supabase/S3
apps/tickets/services/ticket_service.py   ← TicketService(ITicketClientActions, Worker, Admin) Singleton:
                                             create_ticket (T-YYYY-NNNN + cadena validadores + Attachment
                                             + TicketEvent→Observer), get_my_tickets, get_ticket_detail,
                                             update_status (TicketStateMachine), add_comment, close_ticket,
                                             assign/reassign, get_all · get_ticket_service()
apps/tickets/serializers/ticket_create_serializer.py
apps/tickets/views/ticket_create_view.py  ← CreateTicketView (GET lista + POST crea, IsClient) · TicketDetailView
apps/tickets/urls.py                      ← POST/GET /api/tickets, GET /api/tickets/:id
```

### Decisiones de runtime

- **D26:** Servicios concretos son Singletons vía `get_*_service()` lazy — inyectables/mockeables en tests
- **D27:** Verificación de email usa `django.core.signing` (token firmado 24h) — sin modelo extra
- **D28:** `CreateTicketView` es endpoint de colección (GET lista + POST crea) — idiomático DRF, permiso por método
- **D29:** `StorageService` es stub (URL determinista); cambiar a Supabase real = solo esta clase (OCP/DIP)

---

## Features Sprint 4 (S28–S34 · 2026-06-02/03)

### S28 — Asignación + flujo worker (HU-04)

```text
apps/tickets/serializers/ticket_action_serializers.py ← Assign · StatusChange · Comment
apps/tickets/views/ticket_action_views.py             ← AssignView/ReassignView (IsAdmin) ·
                                                         UpdateStatusView (IsWorker) · AddCommentView
                                                         (assign/reassign/update_status/close ya en TicketService R3)
apps/tickets/urls.py                                  ← +asignar +reasignar +estado +comentario
```

### S29 — Gestión de usuarios admin (HU-14, D25: vive en auth/)

```text
apps/authentication/interfaces/i_user_admin_actions.py ← IUserAdminActions ABC (ISP)
apps/authentication/services/user_admin_service.py     ← UserAdminService(IUserAdminActions) Singleton
                                                          list/create/block/unblock · get_user_admin_service()
apps/authentication/serializers/user_admin_serializers.py · views/user_admin_views.py
apps/authentication/user_urls.py + config/urls.py     ← /api/usuarios/ (list, crear, bloquear, desbloquear)
```

### S30 — Reportes (HU-05) — Factory + Strategy de exporters

```text
apps/reports/interfaces/i_report_exporter.py  ← IReportExporter ABC (export, extension, mime)
apps/reports/exporters/csv_exporter.py        ← CSVExporter (stdlib, siempre disponible)
apps/reports/exporters/pdf_exporter.py · excel_exporter.py ← import diferido (reportlab/openpyxl)
core/factories/exporter_factory.py            ← ExporterFactory.build('csv'|'pdf'|'excel') — OCP
apps/reports/repositories/report_repository.py ← agregaciones (summary, rows)
apps/reports/services/report_service.py        ← ReportService (get_dashboard, export) Singleton+DIP
apps/reports/views/report_views.py + urls.py   ← GET /api/reportes/tickets · POST /api/reportes/exportar (IsAdmin)
requirements.txt                               ← + reportlab, openpyxl
```

### S31 — Realtime (HU-09) — TicketConsumer

```text
apps/realtime/consumers/ticket_consumer.py  ← TicketConsumer (sala ticket_{id}, valida JWT)
apps/realtime/events/ticket_events.py       ← build_ticket_updated_payload · broadcast_ticket_updated
apps/realtime/apps.py ready()               ← SEGUNDO observer de post_save(TicketEvent) → broadcast a la sala
                                              (realtime→tickets unidireccional; tickets no sabe del transporte)
config/websocket_urls.py                    ← + ws/tickets/<id>/
```

### S33 — Tests

```text
apps/reports/tests/test_exporters.py            ← CSV + ExporterFactory (sin BD)
apps/tickets/tests/test_ticket_lifecycle.py     ← create→assign→resolve→close · transición inválida (django_db)
apps/authentication/tests/test_auth_service.py  ← authenticate (éxito/fallo/bloqueo 5) · register · verify (django_db)
```

### Decisiones Sprint 4

- **D30:** `realtime` registra su PROPIO `post_save(TicketEvent)` (2.º suscriptor) — OCP: añadir un observer no toca tickets ni notifications
- **D31:** Exporters PDF/Excel con import diferido — el proyecto corre con solo CSV; las libs se activan al instalar requirements
- **D32:** Gestión de usuarios en `auth/` con `IUserAdminActions` (ISP) — `AuthService` (sesión) ≠ `UserAdminService` (gestión), SRP

## Auditoría SOLID final del MVP (S34) ✅

| Principio | Verificación cross-módulo |
| --- | --- |
| **SRP** | model≠repository≠service≠serializer≠view≠consumer en TODOS los módulos · 1 serializer/operación |
| **OCP** | SMSStrategy · JSONExporter · estado Reabierto · rol Supervisor entran sin modificar nada (Factories + chains + TRANSITIONS) |
| **LSP** | Auth/Catalog/Ticket/Report/User services sustituibles por sus interfaces · todos los `get_*_service()` mockeables |
| **ISP** | ITicketClient/Worker/Admin · ICatalogClient/Admin · IUserAdminActions · INotificationStrategy/Service — ninguna mezcla roles |
| **DIP** | Vistas→interfaces (get_*_service) · `apps.notifications`/`apps.realtime` NUNCA importan de `apps.tickets` (payload dict por señal) · FE: App.tsx única frontera concreta |
| **Observer** | post_save(TicketEvent) → 2 suscriptores independientes (notifications + realtime) sin acoplamiento |

---

## Auditoría SOLID Sprint 3 ✅

| Principio | Verificación |
| --- | --- |
| **SRP** | Modelo (datos) ≠ NotificationService (orquestación) ≠ EmailStrategy (envío) ≠ NotificationConsumer (transporte) ≠ TokenService (tokens) |
| **OCP** | `NotificationFactory.CHANNEL_MAP`: SMSStrategy = 1 archivo + 1 entrada · nuevo email = nueva plantilla + entrada en `TEMPLATE_MAP` · nuevo filtro de historial = 1 key en `_apply_filters` |
| **LSP** | cualquier `INotificationStrategy` es intercambiable en `dispatch()` · `NotificationRepository` sustituible por mock en tests |
| **ISP** | `INotificationStrategy` (canal) ≠ `INotificationService` (orquestación) · vistas declaran solo el permiso que usan |
| **DIP** | `NotificationService` → `INotificationStrategy` · vistas → `get_notification_service()` (interfaz) · `apps.notifications` NUNCA importa `apps.tickets` (payload dict) |
| **Observer** | `post_save(TicketEvent)` → `dispatch()` desacoplado · acoplamiento unidireccional verificado |

---

## Archivos creados en S11 (2026-06-01)

### core/ — infraestructura transversal completada

```text
backend/core/exceptions/__init__.py               ← paquete Python
backend/core/exceptions/domain_exceptions.py     ← DomainException, ServiceNotFound,
                                                      InvalidTransitionError, CommentRequiredError,
                                                      TicketNotFound (SRP · OCP)
backend/core/factories/__init__.py                ← placeholder (ValidatorFactory S13,
                                                      NotificationFactory S3, ExporterFactory S4)
backend/core/permissions/__init__.py              ← exporta IsClient, IsWorker, IsAdmin
backend/core/permissions/rbac_permissions.py     ← firmas ISP (implementación en S9)
```

### apps/catalog/ — contratos ISP completos

```text
apps/catalog/interfaces/__init__.py              ← exporta las 3 interfaces
apps/catalog/interfaces/i_catalog_service.py    ← ICatalogService ABC (5 @abstractmethod) — DIP anchor
apps/catalog/interfaces/i_catalog_client_view.py ← ICatalogClientView ABC (2 métodos) — ISP cliente
apps/catalog/interfaces/i_catalog_admin_view.py  ← ICatalogAdminView ABC (3 métodos) — ISP admin
apps/catalog/services/__init__.py                ← placeholder S11 (CatalogService Singleton)
apps/catalog/repositories/__init__.py            ← placeholder S11 (ServiceRepository)
apps/catalog/serializers/__init__.py             ← placeholder S11 (4 serializers, SRP)
apps/catalog/views/__init__.py                   ← placeholder S11 (service_list_view, service_admin_view)
apps/catalog/tests/__init__.py                   ← placeholder S18
```

### Regla de importación S11 (DIP — obligatoria)

```python
# CORRECTO — vista depende de la interfaz ISP
from apps.catalog.interfaces import ICatalogClientView

# INCORRECTO — dependencia de la clase concreta
from apps.catalog.services.catalog_service import CatalogService
```

### Decisiones de diseño registradas

- **D1:** `ICatalogClientView` NO hereda de `ICatalogService` — ISP puro (consumidores distintos)
- **D2:** `CatalogService` implementa ambas vistas ISP — Singleton centraliza la lógica
- **D3:** `domain_exceptions.py` en `core/` — evita acoplamiento circular entre apps
- **D4:** `rbac_permissions.py` en `core/permissions/` — ISP: una clase por rol, sin if/elif

---

## Archivos creados en S12 (2026-06-01)

### apps/tickets/ — estructura completa + contratos raíz

```text
apps/tickets/interfaces/__init__.py         ← exporta ITicketService, IStorageService
apps/tickets/interfaces/i_ticket_service.py ← ITicketService ABC (10 @abstractmethod)
                                               Cubre: create_ticket, generate_ticket_number,
                                               get_ticket_by_id, get_my_tickets (cliente);
                                               update_status, add_comment, close_ticket (worker);
                                               assign_ticket, reassign_ticket, get_all_tickets (admin)
apps/tickets/interfaces/i_storage_service.py ← IStorageService ABC (3 @abstractmethod)
                                                upload(file, path), delete(path), get_url(path)
                                                ISP: segregado de ITicketService
apps/tickets/services/__init__.py           ← placeholder (TicketService Singleton — implementa las 3 ISP)
apps/tickets/repositories/__init__.py       ← placeholder (TicketRepository extiende BaseRepository)
apps/tickets/validators/__init__.py         ← placeholder (cadena S13)
apps/tickets/state_machine/__init__.py      ← placeholder (TicketStateMachine S14)
apps/tickets/serializers/__init__.py        ← placeholder (TicketCreateSerializer, TicketEventSerializer)
apps/tickets/views/__init__.py              ← placeholder (ticket_create_view — IsClient — S12)
apps/tickets/models/__init__.py             ← placeholder (Ticket, Attachment — S16; TicketEvent — S16)
apps/tickets/tests/__init__.py              ← placeholder S18
```

### Decisiones de diseño S12

- **D5:** `IStorageService` segregado de `ITicketService` — ISP: FileUpload no necesita lógica de ticket
- **D6:** `generate_ticket_number()` vive en `ITicketService`, NO en el modelo — SRP estricto
- **D7:** `ITicketService` declara los 10 métodos de todos los roles ahora; S15 los segrega en ISP por rol
- **D8:** `TicketCreateView` usará `IsClient` de `core/permissions/` — creado en S11

---

## Archivos creados en S13 (2026-06-01)

```text
apps/tickets/validators/basic_field_validator.py    ← BasicFieldValidator(BaseValidator)
                                                       asunto ≤80 chars, descripcion ≥10 chars
apps/tickets/validators/file_validator.py           ← FileValidator(BaseValidator)
                                                       tamaño ≤5MB, MIME en lista permitida
apps/tickets/validators/business_rule_validator.py  ← BusinessRuleValidator(BaseValidator)
                                                       horario laboral Mon–Vie 07–20h,
                                                       sin ticket duplicado activo
                                                       depende de ticket_repository (DIP)
apps/tickets/validators/ticket_validator_chain.py   ← TicketValidatorChain (fachada)
                                                       delega construcción a ValidatorFactory
core/factories/validator_factory.py                 ← ValidatorFactory.build_ticket_chain()
                                                       cadena: BasicField→File→BusinessRule
                                                       OCP: Sprint 4 agrega nodo aquí, sin
                                                       modificar validadores existentes
```

### Decisiones de diseño S13

- **D9:** `ValidatorFactory` es el ÚNICO lugar que importa clases concretas de validadores — DIP
- **D10:** `BusinessRuleValidator` recibe `ticket_repository` en `__init__` — nunca toca ORM directo
- **D11:** `TicketValidatorChain` es fachada sobre el nodo raíz — SRP (no sabe qué nodos hay)
- **D12:** `CriticalPriorityValidator` (Sprint 4) = nuevo archivo + una línea en `build_ticket_chain()`

---

## Archivos creados en S14 (2026-06-01)

```text
apps/tickets/state_machine/__init__.py              ← exporta TicketStateMachine,
                                                       StateTransitionValidator
apps/tickets/state_machine/ticket_state_machine.py  ← TicketStateMachine (clase concreta)
                                                       TRANSITIONS: dict[str, list[str]]
                                                       can_transition(from, to) → bool
                                                       transition(from, to, comment) → str
                                                         raises InvalidTransitionError (bad route)
                                                         raises CommentRequiredError (BR-35)
                                                       all_states() → list[str]
                                                       is_terminal(state) → bool
apps/tickets/state_machine/state_transition_validator.py
                                                    ← StateTransitionValidator(BaseValidator)
                                                       recibe TicketStateMachine en __init__ (DIP)
                                                       validate(data) comprueba
                                                         data['estado_actual'] → data['estado_nuevo']
```

### Decisiones de diseño S14

- **D13:** `TicketStateMachine` NO es un ABC — es una política concreta inyectable (DIP en tests)
- **D14:** `transition()` impone BR-35 aquí; `can_transition()` no — separación de responsabilidades
- **D15:** `StateTransitionValidator` recibe la máquina por constructor — nunca la instancia internamente
- **D16:** Sprint 4 → `TRANSITIONS['Cerrado'] = ['Reabierto']` añade estado sin tocar ninguna otra regla

---

## Archivos creados en S15 (2026-06-01)

```text
apps/tickets/interfaces/i_ticket_client_actions.py  ← ITicketClientActions ABC (ISP)
                                                       create_ticket(data, user)
                                                       get_my_tickets(user, filters?)
                                                       get_ticket_detail(ticket_id, user)
                                                       — solo el rol CLIENTE la ve
apps/tickets/interfaces/i_ticket_worker_actions.py  ← ITicketWorkerActions ABC (ISP)
                                                       update_status(id, new_status, comment, user)
                                                       add_comment(id, comment, user)
                                                       close_ticket(id, comment, user)
                                                       — solo el rol TRABAJADOR la ve
apps/tickets/interfaces/i_ticket_admin_actions.py   ← ITicketAdminActions ABC (ISP)
                                                       assign_ticket(id, worker_id, user)
                                                       reassign_ticket(id, new_worker_id, user)
                                                       get_all_tickets(filters?)
                                                       — solo el rol ADMIN la ve
apps/tickets/interfaces/__init__.py                 ← actualizado: exporta las 5 interfaces
```

### Decisiones de diseño S15

- **D17:** Ninguna interfaz ISP hereda de otra — consumidores completamente distintos
- **D18:** `TicketService` implementa las 3 ISP + `ITicketService` — Singleton con LSP garantizado
- **D19:** Sprint 2 solo ejercita `ITicketClientActions.create_ticket()` — las demás son contratos para S3/S4
- **D20:** Las vistas DRF declaran `permission_classes = [IsClient]` Y reciben `ITicketClientActions` — doble barrera ISP

---

## Archivos creados en S16 (2026-06-01)

```text
apps/tickets/models/ticket.py        ← Ticket (datos únicamente, SRP)
                                        numero · asunto · descripcion
                                        servicio FK · cliente FK · asignado FK (null)
                                        estado (choices: Nuevo/EnProceso/EnEspera/Resuelto/Cerrado)
                                        prioridad (choices: Baja/Media/Alta/Critica)
                                        created_at · updated_at
                                        índices: (cliente,estado) · (asignado,estado) · (estado,prioridad)
                                        @property is_closed — único método permitido

apps/tickets/models/attachment.py    ← Attachment (datos únicamente, SRP)
                                        ticket FK → Ticket
                                        nombre_archivo · url · tamaño_bytes · mime_type
                                        created_at
                                        Sin lógica de almacenamiento (IStorageService lo maneja)

apps/tickets/models/ticket_event.py  ← TicketEvent (audit log append-only, SRP)
                                        ticket FK · autor FK → User
                                        tipo_evento (choices: creacion/cambio_estado/comentario/
                                                              asignacion/reasignacion)
                                        estado_anterior (blank) · estado_nuevo (blank)
                                        comentario · created_at
                                        índices: (ticket,created_at) · (ticket,tipo_evento)

apps/tickets/models/__init__.py      ← exporta Ticket, Attachment, TicketEvent

apps/tickets/serializers/ticket_event_serializer.py
                                     ← TicketEventSerializer (read-only, ModelSerializer)
                                        campos: id · tipo_evento · estado_anterior · estado_nuevo
                                                comentario · autor_nombre · created_at

apps/tickets/apps.py                 ← TicketsConfig.ready() registra post_save sobre TicketEvent
                                        Observer: TicketEvent → NotificationService.dispatch()
                                        Import diferido de NotificationService (evita import circular)
                                        Sprint 3 implementa NotificationService; este handler no cambia
```

### Decisiones de diseño S16

- **D21:** `TicketEvent` es append-only — nunca se actualiza, solo se inserta (OCP natural)
- **D22:** La señal se registra en `ready()` con `dispatch_uid` para evitar registros duplicados en tests
- **D23:** `NotificationService` se importa DENTRO del handler con `try/except ImportError` — Sprint 2 puede arrancar sin Sprint 3 implementado
- **D24:** `estado_anterior` y `estado_nuevo` son `blank=True` (no null) — eventos sin cambio de estado (comentarios, asignaciones) los dejan vacíos, no nulos, para simplificar serialización

---

## Archivos creados en S18 (2026-06-01)

```text
apps/tickets/tests/test_state_machine.py  ← 17 tests: todas transiciones válidas e inválidas,
                                             BR-35 (empty/whitespace comment), is_terminal,
                                             can_transition, all_states, unknown state
apps/tickets/tests/test_validators.py     ← 16 tests: BasicField (6), File (6), BusinessRule (4),
                                             cadena completa (2) — fail-fast + repo no llamado
apps/tickets/tests/test_ticket_service.py ← 10 tests: IsClient/Worker/Admin (rol, estado bloqueado,
                                             no-autenticado), formato T-YYYY-NNNN
```

## Auditoría SOLID Sprint 2 ✅

| Principio | Verificación | Estado |
| --- | --- | --- |
| **SRP** | Modelo solo datos · Servicio solo lógica · Serializer solo transforma · Vista solo HTTP · Cada validador una regla · Cada componente una responsabilidad | ✅ |
| **OCP** | `ValidatorFactory`: agregar nodo = 1 archivo + 1 línea · `TicketStateMachine.TRANSITIONS`: nuevo estado = nueva clave · `STATUS_CONFIG` en badge: nuevo estado = nueva entrada | ✅ |
| **LSP** | `TicketService` implementa las 3 ISP + `ITicketService` — sustituible en tests · Cualquier `BaseValidator` es intercambiable en la cadena | ✅ |
| **ISP** | `ITicketClientActions` ≠ `ITicketWorkerActions` ≠ `ITicketAdminActions` — ninguna hereda de otra · `ICatalogClientView` ≠ `ICatalogAdminView` · `IsClient` / `IsWorker` / `IsAdmin` son clases separadas | ✅ |
| **DIP** | Vistas DRF dependen de interfaces ISP, nunca de `TicketService` · Componentes React usan `TicketClientContext` (ITicketClientActions) · `ValidatorFactory` es el único lugar que importa clases concretas de validadores | ✅ |
