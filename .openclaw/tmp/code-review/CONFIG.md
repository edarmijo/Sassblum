# ═══════════════════════════════════════════════════════
# CONFIGURACIÓN Y DOCUMENTACIÓN
# ═══════════════════════════════════════════════════════

### 📄 AGENTS.md
```
# AGENTS.md — SassBlum Ticket Management System

> **Context file for any LLM working on this project.**
> Read this file before making changes. It contains architecture, conventions, and rules.

---

## Project Overview

**SassBlum** is a full-stack ticket management system for a technology services company in Guayaquil, Ecuador. Clients submit service requests (tickets), workers resolve them, and administrators manage the entire operation.

- **Stack:** React 19 + TypeScript + Tailwind CSS 4 + Framer Motion | Django 6 + DRF + Channels
- **Database:** Supabase (PostgreSQL 15)
- **Real-time:** Django Channels + Redis
- **Deployment:** Docker Compose + Nginx + Jenkins CI/CD
- **Client:** Vicky Pinto (SassBlum CEO)

---

## Architecture

```
frontend/                  # React 19 SPA
├── src/
│   ├── core/              # Shared: UI kit, hooks, utils, validators, base classes
│   ├── modules/           # Feature modules by domain
│   │   ├── auth/          # Login, register, password reset
│   │   ├── tickets/       # Ticket CRUD, state machine, detail, history
│   │   ├── catalog/       # Service catalog (admin CRUD + client browse)
│   │   ├── notifications/ # Bell, panel, preferences, WebSocket observer
│   │   ├── reports/       # KPI dashboard, export (CSV/Excel/PDF)
│   │   ├── contracts/     # Contract template generator
│   │   ├── dashboard/     # Role-specific dashboards (Client/Worker/Admin)
│   │   └── public/        # Marketing pages (Home, About, Services, Gallery, Clients)
│   └── infrastructure/    # ApiClient (Axios), SocketClient (WS), env config

backend/                   # Django 6 + DRF
├── apps/
│   ├── authentication/    # User model, JWT, RBAC, email verification
│   ├── tickets/           # Ticket, TicketEvent, Attachment, StateMachine, Validators
│   ├── catalog/           # Service model, CRUD, image upload (Supabase Storage)
│   ├── notifications/     # 3 strategies: Email, InApp, WebSocket
│   ├── reports/           # Aggregation, export (CSV/PDF/Excel via ExporterFactory)
│   └── realtime/          # Django Channels consumers for WebSocket
├── core/                  # BaseRepository, BaseValidator, RBAC permissions, exceptions
└── config/                # Settings, URLs, ASGI, WSGI
```

---

## SOLID Principles (Mandatory)

Every module must follow:

- **SRP:** One class = one responsibility. Views only orchestrate HTTP. Services hold logic. Repositories hold ORM queries.
- **OCP:** New features = new classes. Never modify existing validators/exporters/strategies to add new ones.
- **LSP:** All concrete classes are interchangeable with their interface.
- **ISP:** Separate interfaces per role: `ITicketClientActions` ≠ `ITicketWorkerActions` ≠ `ITicketAdminActions`.
- **DIP:** Components depend on interfaces, never on concrete implementations. Services injected via Context providers.

---

## Design Patterns

| Pattern | Where |
|---------|-------|
| Repository | AuthRepository, TicketRepository, NotificationRepository |
| Factory | ValidatorFactory, ExporterFactory, NotificationFactory |
| Strategy | EmailNotificationStrategy, InAppStrategy, WebSocketStrategy |
| Observer | Django Signals: post_save(TicketEvent) → notifications + realtime |
| Singleton | AuthService, TicketService, NotificationService (thread-safe with Lock) |
| Chain of Responsibility | EmailValidator → PasswordValidator; BasicFieldValidator → FileValidator → BusinessRuleValidator |
| State Machine | TicketStateMachine: Nuevo → EnProceso → EnEspera → Resuelto → Cerrado |

---

## Conventions

### Backend (Python)
- **Naming:** snake_case for variables/functions, PascalCase for classes
- **Imports:** Absolute from project root. Deferred imports inside functions to avoid circular imports.
- **Type hints:** Required on all function signatures. Use `from __future__ import annotations`.
- **Tests:** pytest + DRF APIClient. Mark DB tests with `@pytest.mark.django_db`.
- **Settings:** All config from `decouple.config()`. Never hardcode secrets.

### Frontend (TypeScript)
- **Naming:** camelCase for variables/functions, PascalCase for components/classes
- **Components:** One component per file. Export named (not default).
- **State:** Context + hooks as DIP seam. Never import services directly in components.
- **Styling:** Tailwind CSS utility classes. Design tokens in `index.css`.
- **Animations:** Framer Motion. Always respect `prefers-reduced-motion`.
- **Type safety:** No `any` types. Use `unknown` + type guards.

### Git
- **Commits:** Conventional Commits: `feat(scope): description`, `fix(scope): description`
- **Branches:** Feature branches merged via PR with at least 1 reviewer.
- **Protected:** `main` branch requires PR + CI passing.

---

## Ticket State Machine

```
[Nuevo] → [EnProceso] → [EnEspera] → [EnProceso] → [Resuelto] → [Cerrado]
                                                         ↑
                                                    (terminal)
```

- Every transition requires a non-empty comment (BR-35)
- `Cerrado` is terminal — no outgoing transitions
- `Nuevo → EnProceso` requires assignment to a worker

---

## API Endpoints (Key)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/auth/register | Public | Register new client |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/tickets/ | Auth | List tickets (filtered by role) |
| POST | /api/tickets/ | IsClient | Create ticket |
| POST | /api/tickets/:id/status | IsWorker | Update status + comment |
| POST | /api/tickets/:id/assign | IsAdmin | Assign to worker |
| GET | /api/servicios/ | Public | Service catalog |
| POST | /api/servicios/admin | IsWorker\|IsAdmin | Create service |
| PATCH | /api/servicios/admin/:id | IsWorker\|IsAdmin | Edit service |
| GET | /api/reportes/tickets | IsAdmin | Report KPIs |
| POST | /api/reportes/exportar | IsAdmin | Export CSV/PDF/Excel |
| GET | /health/ | Public | Health check |

---

## Environment Variables

### Backend (.env)
```
DJANGO_SECRET_KEY=        # 50+ random chars
DJANGO_DEBUG=False
DATABASE_URL=             # Supabase PostgreSQL connection string
REDIS_URL=                # redis://redis:6379/0
CORS_ALLOWED_ORIGINS=     # https://app.sassblum.com
ALLOWED_HOSTS=            # api.sassblum.com
EMAIL_HOST=               # smtp.gmail.com
EMAIL_HOST_PASSWORD=      # SMTP app password
FRONTEND_URL=             # https://app.sassblum.com
SUPABASE_URL=             # For file uploads
SUPABASE_SERVICE_KEY=     # Server-side only
```

### Frontend (.env)
```
VITE_API_BASE_URL=        # https://api.sassblum.com/api
VITE_WS_URL=              # wss://api.sassblum.com
```

---

## Common Tasks

### Run locally
```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit with your values
python manage.py migrate && python manage.py runserver

# Frontend
cd frontend && npm install && npm run dev
```

### Run tests
```bash
# Backend unit tests
cd backend && pytest -v -m "not django_db"

# Backend integration tests
cd backend && pytest -v

# Acceptance tests
cd backend && pytest ../tests/acceptance/ -v

# Frontend tests
cd frontend && npm run test
```

### Docker
```bash
docker-compose up -d           # Development
docker-compose -f docker-compose.prod.yml up -d  # Production
```

---

## Known Issues & TODO

See `REPORTE_AUDITORIA_TOTAL.md` for the full audit report. All 30 findings have been addressed.

---

## Contact

- **Client:** Vicky Pinto (SassBlum)
- **Repository:** https://github.com/edarmijo/SassBlumRedise-oWeb
- **Team:** Erick Armijos, Juan Pérez, Elías Rubio, Jahir Cajas, Jairo Rodríguez
```

### 📄 CLAUDE.md
```
# SassBlum — Ticket Management System

> Guía de proyecto para Claude Code (claude.ai/code). Leer completo antes de escribir código.

## Contexto de proyecto para Claude Code

> Leer este archivo completo antes de escribir cualquier línea de código.
> Cada sesión de trabajo sigue el plan unificado de 34 sesiones distribuidas en 4 sprints.

---

## Stack tecnológico

| Capa          | Tecnología                                                       |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | React 19 + TypeScript + Vite + Tailwind CSS + Zustand            |
| Backend       | Django 6 + Django REST Framework + djangorestframework-simplejwt |
| Base de datos | Supabase (PostgreSQL 15) + Row Level Security (RLS)              |
| Tiempo real   | Django Channels + Redis (channel layer)                          |
| Reportes      | reportlab / weasyprint (PDF) + csv + openpyxl + Recharts         |
| Email         | Django send_mail + SMTP (django-anymail)                         |
| Tests FE      | Jest + React Testing Library + Cypress (E2E)                     |
| Tests BE      | pytest + pytest-django + DRF APIClient                           |

---

## Estructura del workspace

```text
sass-blum-ticket-management/
├── Frontend/          # React 18 + TypeScript
│   ├── src/
│   │   ├── core/      # Abstracciones compartidas (interfaces, base components)
│   │   ├── modules/
│   │   │   ├── auth/           # Sprint 1
│   │   │   ├── catalog/        # Sprint 2
│   │   │   ├── tickets/        # Sprints 2–4
│   │   │   ├── notifications/  # Sprint 3
│   │   │   ├── reports/        # Sprint 4
│   │   │   └── realtime/       # Sprint 4
│   │   └── infrastructure/    # ApiClient (Axios singleton), SocketClient, env
│   └── CLAUDE.md
└── Backend/           # Django + DRF
    ├── core/          # ABCs Python, permisos RBAC, factories base
    ├── apps/
    │   ├── authentication/    # Sprint 1
    │   ├── catalog/           # Sprint 2
    │   ├── tickets/           # Sprints 2–4
    │   ├── notifications/     # Sprint 3
    │   ├── reports/           # Sprint 4
    │   └── realtime/          # Sprint 4 (Django Channels)
    └── CLAUDE.md
```

---

## Reglas arquitectónicas NO negociables

### 1. Orden jerárquico dentro de cada módulo (siempre)

```text
interfaces/ → services/ → repositories/ → validators/ → components/ o views/
```

**Nunca** implementar una clase concreta antes de tener definida su interfaz.

### 2. DIP — Dependency Inversion

- Ningún servicio, componente ni vista depende de una clase concreta.
- Todos dependen de la interfaz correspondiente.
- Frontend: `IAuthService`, `IRepository<T>`, `INotificationStrategy`, etc.
- Backend: ABCs Python con `@abstractmethod`.

### 3. SRP — Single Responsibility

- Un serializer por operación (no serializers genéricos).
- Un validator por regla (no validadores que mezclan responsabilidades).
- El modelo solo define datos; la lógica de negocio vive en el servicio.
- La vista solo orquesta HTTP; no contiene lógica de negocio.

### 4. OCP — Open/Closed

- Nuevas reglas de validación = nuevo nodo en la cadena, sin modificar los existentes.
- Nuevos formatos de exportación = nuevo Exporter que implementa `IReportExporter`.
- Nuevos canales de notificación = nueva Strategy que implementa `INotificationStrategy`.

### 5. ISP — Interface Segregation

- Permisos RBAC: `IsClient`, `IsWorker`, `IsAdmin` son clases separadas.
- Interfaces de ticket por rol: `ITicketClientActions` ≠ `ITicketWorkerActions` ≠ `ITicketAdminActions`.
- Nunca una clase de permiso monolítica con `if/elif` de roles.

### 6. LSP — Liskov Substitution

- Toda implementación concreta es intercambiable con su interfaz.
- `AuthService` puede reemplazarse por cualquier otra implementación de `IAuthService` sin tocar ninguna vista.

---

## Patrones de diseño aplicados

| Patrón                      | Dónde se aplica                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **Repository**              | `AuthRepository`, `TicketRepository`, `NotificationRepository` — aíslan el ORM/HTTP      |
| **Factory**                 | `NotificationFactory`, `ExporterFactory`, `ValidatorFactory`                             |
| **Strategy**                | `EmailNotificationStrategy`, `InAppStrategy`, `PDFExporter`, `CSVExporter`               |
| **Observer**                | Django Signals: `post_save` en `TicketEvent` → `NotificationService.dispatch()`          |
| **Singleton**               | `AuthService`, `TicketService`, `NotificationService`, `ApiClient` (Axios)               |
| **Chain of Responsibility** | Cadena de validadores: `EmailValidator → PasswordValidator → RegistrationValidatorChain` |

---

## Contratos de interfaz críticos

### Frontend (TypeScript)

```typescript
IRepository<T>       → get(id), getAll(filters), create(data), update(id, data), delete(id)
IAuthService         → login(), register(), logout(), forgotPassword(), resetPassword()
ITicketClientActions → createTicket(), getMyTickets(), getTicketDetail()
ITicketWorkerActions → updateStatus(), addComment(), closeTicket()
ITicketAdminActions  → assignTicket(), reassignTicket(), getAllTickets()
INotificationStrategy → send(recipient, message, data), validate(recipient), log(status, details)
IReportExporter      → export(data, options), getFileExtension(), getMimeType(), validateData(data)
ITicketValidator     → validate(ticket, context)  // nodo de cadena
IRealtimeClient      → connect(), subscribe(room), emit(event, data), disconnect()
```

### Backend (Python ABCs)

```python
IAuthService         → authenticate(), register(), logout(), generate_tokens()
ITicketService       → create_ticket(), assign_ticket(), update_status(), close_ticket()
INotificationStrategy → send(recipient, message, context), validate(recipient)
IReportExporter      → export(queryset, options), get_extension(), get_mime_type()
ITicketValidator     → validate(ticket_data, context)  # nodo de cadena
IRealtimeClient      → broadcast(room, event, payload)
```

---

## Máquina de estados — Ciclo de vida del ticket

```text
[Nuevo] → [EnProceso] → [EnEspera] → [EnProceso]
                     → [Resuelto] → [Cerrado] (terminal)
```

Reglas:

- `Nuevo` → solo `EnProceso` (requiere asignación)
- `EnProceso` → `EnEspera` o `Resuelto`
- `EnEspera` → solo `EnProceso`
- `Resuelto` → solo `Cerrado`
- `Cerrado` → ninguna transición (estado terminal)
- **Toda transición requiere comentario no vacío (BR-35)**

---

## API Endpoints de referencia

### Auth (Sprint 1)

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/verify-email/:token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Tickets (Sprints 2–4)

```text
POST   /api/tickets
GET    /api/tickets
GET    /api/tickets/:id
PATCH  /api/tickets/:id/estado
PATCH  /api/tickets/:id/asignar
GET    /api/tickets/:id/historial
```

### Notificaciones (Sprint 3)

```text
GET    /api/notificaciones
PATCH  /api/notificaciones/:id/marcar-leida
PATCH  /api/notificaciones/preferencias
```

### Reportes + Usuarios (Sprint 4)

```text
GET    /api/reportes/tickets
POST   /api/reportes/exportar
GET    /api/usuarios
POST   /api/usuarios
PATCH  /api/usuarios/:id
PATCH  /api/usuarios/:id/bloquear
PATCH  /api/usuarios/:id/desbloquear
```

---

## WebSocket events

| Dirección          | Evento             | Payload                           |
| ------------------ | ------------------ | --------------------------------- |
| Cliente → Servidor | `subscribe_ticket` | `{ ticketId }`                    |
| Cliente → Servidor | `join_room`        | `{ room: 'admins' \| 'workers' }` |
| Servidor → Cliente | `ticket_updated`   | Ticket completo                   |
| Servidor → Cliente | `notification_new` | Objeto notificación               |
| Servidor → Cliente | `user_connected`   | `{ userId, nombre, rol }`         |

---

## Convenciones de código

### Python / Django

- Clases: `PascalCase` — `AuthService`, `TicketRepository`
- Funciones y variables: `snake_case` — `create_ticket()`, `ticket_data`
- Interfaces (ABCs): prefijo `i_` en filename — `i_auth_service.py`, clase `IAuthService`
- Tests: `test_<módulo>.py` — `test_auth_service.py`, `test_validators.py`
- Importaciones: siempre por interfaz, nunca por clase concreta
- Un archivo = una responsabilidad (nunca mezclar serializer + view + service)

### TypeScript / React

- Componentes: `PascalCase` — `LoginForm.tsx`, `TicketCard.tsx`
- Hooks: `use` prefix — `useAuth.ts`, `useNotifications.ts`
- Interfaces: `I` prefix — `IAuthService.ts`, `IRepository.ts`
- Servicios: `PascalCase` + `Service` suffix — `AuthService.ts`
- Tests: mismo nombre + `.test.tsx` — `LoginForm.test.tsx`
- JWT: NUNCA en `localStorage` (riesgo XSS) — solo en memoria via `useAuth`

---

## Plan de sprints (resumen)

| Sprint       | Fechas        | Módulos                                       | Sesiones |
| ------------ | ------------- | --------------------------------------------- | -------- |
| **Sprint 1** | 25–31 May     | `auth/` (FE + BE)                             | S1–S10   |
| **Sprint 2** | 15–21 Jun     | `catalog/` + `tickets/` (creación)            | S11–S18  |
| **Sprint 3** | 6–26 Jul      | `notifications/` + historial + password reset | S19–S27  |
| **Sprint 4** | 27 Jul–16 Ago | asignación + `reports/` + `realtime/`         | S28–S34  |

> **Estado real (2026-06-03): los 4 sprints están ENTREGADOS y el MVP corre end-to-end.** Ver footer.

**Buffers:** 1–14 Jun (14 días) entre S1 y S2 · 22 Jun–5 Jul (13 días) entre S2 y S3

---

## Historias de usuario del MVP

| ID    | Historia                     |
| ----- | ---------------------------- |
| HU-01 | Login con credenciales       |
| HU-02 | Registro de cliente          |
| HU-03 | Recuperación de contraseña   |
| HU-04 | Creación de ticket           |
| HU-05 | Asignación de ticket         |
| HU-06 | Visualización de ticket      |
| HU-07 | Actualización de estado      |
| HU-08 | Reasignación de ticket       |
| HU-09 | Historial de ticket          |
| HU-10 | Filtrado y búsqueda          |
| HU-11 | Comentarios en tickets       |
| HU-12 | Cierre de ticket             |
| HU-13 | Visualización en tiempo real |
| HU-14 | Envío de notificaciones      |
| HU-15 | Preferencias de notificación |
| HU-16 | Historial de notificaciones  |
| HU-17 | Generación de reportes       |
| HU-18 | Exportación de datos         |

---

## Checklist SOLID por sesión (usar antes de hacer commit)

- [ ] ¿Cada clase tiene una sola razón para cambiar? (SRP)
- [ ] ¿Agregar nueva funcionalidad requiere modificar código existente? Si sí → rediseñar (OCP)
- [ ] ¿Cada implementación es intercambiable con su interfaz? (LSP)
- [ ] ¿Alguna interfaz expone métodos que algún cliente no usa? Si sí → segregar (ISP)
- [ ] ¿Algún módulo depende directamente de una clase concreta? Si sí → invertir (DIP)

---

## Comandos frecuentes

```bash
# Backend
cd backend
python manage.py runserver
python manage.py makemigrations <app>
python manage.py migrate
pytest apps/<app>/tests/ -v
pytest --cov=apps --cov-report=term-missing

# Frontend
cd frontend
npm run dev
npm run build
npm run lint
```

---

---

## Estado de avance del proyecto (actualizado 2026-06-01)

Sprint actual: Sprint 2 — S11–S14 completadas · próxima: S15 (Interfaces ISP por rol)

### Sprint 1 — authentication/ (contratos, sin implementación)

| Sesión | Entregable | Estado |
| --- | --- | --- |
| S1 | IAuthService ABC · BaseValidator · BaseRepository · IRepository\<T\> · estructura auth/ | ✅ |
| S2 | Modelo User (AbstractUser + role/estado/intentos_fallidos/bloqueado_hasta/email_verificado) | ✅ |
| S3–S10 | Serializers · Vistas DRF · Componentes React · useAuth · AuthService · Tests · RBAC · Revisión | pendiente |

### Sprint 2 — catalog/ + tickets/ (contratos, sin implementación)

| Sesión | Entregable | Estado |
| --- | --- | --- |
| S11 | ICatalogService · ICatalogClientView · ICatalogAdminView (ISP) · domain\_exceptions · rbac\_permissions · DashboardLayout | ✅ |
| S12 | ITicketService (10 métodos) · IStorageService (ISP) · estructura tickets/ completa | ✅ |
| S13 | BasicFieldValidator · FileValidator · BusinessRuleValidator · TicketValidatorChain · ValidatorFactory | ✅ |
| S14 | TicketStateMachine (Strategy) · StateTransitionValidator | ✅ |
| S15 | ITicketClientActions · ITicketWorkerActions · ITicketAdminActions (ISP por rol) | ✅ |
| S16 | TicketEvent model · Observer vía Django Signals (apps.py ready()) | ✅ |
| S17 | TicketCard · TicketDetail · TicketHistory · TicketStatusBadge · useTickets | ✅ |
| S18 | Tests BE + FE · auditoría SOLID completa | ✅ |

### Sprint 3 — notifications/ + historial + password reset (COMPLETADO 2026-06-02)

| Sesión | Entregable | Estado |
| --- | --- | --- |
| S19 | INotificationStrategy · 3 strategies (Email/InApp/WS) · NotificationFactory | ✅ |
| S20 | NotificationService Singleton · Observer activo · runtime email + plantillas | ✅ |
| S21 | Notification · NotificationPreference models · NotificationRepository · migraciones | ✅ |
| S22 | 5 plantillas email HTML (adelantadas en S20) | ✅ |
| S23 | NotificationConsumer (Channels) · asgi ProtocolTypeRouter · websocket_urls | ✅ |
| S24 | TicketRepository · historial paginado + filtros · TicketHistoryPage/DetailPage | ✅ |
| S25 | TokenService · PasswordResetToken · forgot/reset views · Forgot/ResetPasswordPage | ✅ |
| S26 | NotificationBell/Panel/Item/Preferences · useNotifications · SocketClient | ✅ |
| S27 | Tests BE (mocks + django_db) + FE (RTL) · auditoría SOLID · pytest.ini | ✅ |

Validación: `manage.py check` sin errores · `npx tsc --noEmit` sin errores · migraciones generadas.
Extra cubierto: `catalog.Service` (faltaba; FK de Ticket) · API montada en `config/urls.py`
(`/api/notificaciones/`, `/api/tickets/`, `/api/auth/`).
Pendiente del usuario (runtime): `pip install -r requirements.txt` · `migrate` · smoke test
(ver `backend/apps/notifications/GUIA_IMPLEMENTACION_API_S20.md`).

### Archivos clave existentes en core/ (transversales a todos los módulos)

```text
backend/core/base/base_validator.py          ← BaseValidator ABC — nodo Chain of Responsibility
backend/core/base/base_repository.py        ← BaseRepository[T] ABC — CRUD genérico
backend/core/exceptions/domain_exceptions.py ← DomainException, ServiceNotFound,
                                               InvalidTransitionError, CommentRequiredError, TicketNotFound
backend/core/permissions/rbac_permissions.py ← IsClient, IsWorker, IsAdmin (ISP, firmas)
backend/core/factories/validator_factory.py  ← ValidatorFactory.build_ticket_chain() (OCP)

frontend/src/core/interfaces/IRepository.ts ← IRepository<T> genérico
frontend/src/core/base/BaseValidator.ts     ← BaseValidator abstract — nodo de cadena
frontend/src/core/factories/ValidatorFactory.ts ← buildTicketChain() — único import de concretos
```

### Regla de importación global (DIP — obligatoria en todo el proyecto)

```python
# BE — CORRECTO
from apps.catalog.interfaces import ICatalogClientView
from apps.tickets.interfaces import ITicketService
# INCORRECTO — nunca importar la clase concreta en vistas o servicios externos
```

```typescript
// FE — CORRECTO
import type { ITicketService } from '../interfaces/ITicketService'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
// INCORRECTO
import { TicketService } from '../services/TicketService'
```

---

Cliente: SassBlum — Vicky Pinto · Equipo: Erick Armijos, Juan Pérez, Elías Rubio, Jahir Cajas, Jairo Rodríguez
Institución: ESPOL — FIEC · Sprint 4 COMPLETO ✅ · MVP INTEGRAL end-to-end (4 sprints entregados)
Flujo completo de los 3 roles: cliente crea ticket → admin asigna → worker cambia estado →
Observer dispara notificación (email + in-app + WS) → historial → reportes/exportar.
Validado: `manage.py check` ✅ · `tsc --noEmit` ✅ · 30+ rutas API + 2 WS · auditoría SOLID S34 ✅.
Para correrlo: BE `pip install -r requirements.txt` · `migrate` · `createsuperuser` · `daphne config.asgi:application`;
FE `npm install` · `npm run dev`. Sprint 4 completo: S28 asignación · S29 user admin · S30 reports ·
S31 realtime · S32 FE dashboards · S33 tests · S34 auditoría — todo entregado.
```

### 📄 DEPLOYMENT.md
```
# SassBlum Production Deployment Guide

## Prerequisites

- Docker & Docker Compose v2
- Jenkins (on CI server)
- SSH access to production server
- Supabase project with PostgreSQL database
- Docker Hub or private registry account
- Linux server (Ubuntu 22.04+ recommended)

---

## Backend Environment Variables

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| DJANGO_SECRET_KEY | `...50+ random chars...` | Yes | Use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| DJANGO_DEBUG | False | Yes | ALWAYS False in production |
| DATABASE_URL | `postgresql://user:pass@host:5432/db` | Yes | Supabase connection string |
| REDIS_URL | `redis://redis:6379/0` | Yes | For Django Channels (internal container name) |
| USE_REDIS | True | Yes | Enable Redis in production |
| CORS_ALLOWED_ORIGINS | `https://app.com,https://www.com` | Yes | Comma-separated, no spaces |
| ALLOWED_HOSTS | `api.example.com,www.api.com` | Yes | Comma-separated |
| EMAIL_HOST | smtp.gmail.com | Yes | SMTP server |
| EMAIL_PORT | 587 | Yes | TLS port |
| EMAIL_HOST_USER | noreply@example.com | Yes | SMTP username |
| EMAIL_HOST_PASSWORD | `...` | Yes | SMTP password (or app token) |
| DEFAULT_FROM_EMAIL | noreply@example.com | Yes | From address for emails |
| FRONTEND_URL | https://app.example.com | Yes | For verification links in emails |
| SUPABASE_URL | https://your-project.supabase.co | Optional | For file uploads |
| SUPABASE_SERVICE_KEY | your-service-key | Optional | For file uploads |

---

## Frontend Environment Variables

Used during build time (via `.env.production` or CI injection):

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| VITE_API_BASE_URL | `https://api.example.com/api` | Yes | Backend API base (with `/api` suffix) |
| VITE_WS_URL | `wss://api.example.com` | Yes | WebSocket URL (wss:// for secure) |
| VITE_ENV | production | Yes | For conditional logic in app |

---

## Jenkins Setup

### Install Required Plugins

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Install these plugins:
   - **Docker Pipeline**
   - **SSH Agent**
   - **Credentials Plugin** (usually pre-installed)
   - **Pipeline** (usually pre-installed)
   - **Git** (usually pre-installed)

### Create Jenkins Credentials

#### 1. Docker Registry Credentials
- Credential ID: `docker-credentials`
- Type: Username with password
- Username: Your Docker Hub username
- Password: Docker Hub personal access token (Settings → Security → Tokens)

#### 2. SSH Deploy Key
- Credential ID: `deploy-server-ssh`
- Type: SSH Username with private key
- Username: `deploy`
- Private key: Content of your SSH private key file (the deployment user's private key)

#### 3. Optional: GitHub Webhook
For automatic triggers on push to main:
1. Go to GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL: `http://jenkins.example.com/github-webhook/`
3. Content type: `application/json`
4. Events: Push events
5. Active: Yes

### Create Jenkins Pipeline Job

1. New Item → **Pipeline**
2. **Name**: `sassblum-cd`
3. **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/your-org/SassBlumRedise-oWeb.git`
   - **Branch**: `*/main`
   - **Script path**: `Jenkinsfile`
4. **Build triggers**:
   - Check "GitHub hook trigger for GITScm polling" (if using webhook)
   - OR: Poll SCM: `H/15 * * * *` (every 15 minutes)

---

## Production Server Setup

### Prerequisites on Ubuntu 22.04+

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-v2 git curl

# Add deploy user to docker group (no sudo for docker)
sudo usermod -aG docker deploy

# Enable Docker to start on boot
sudo systemctl enable docker
```

### Directory Structure

```bash
# Create deployment directory
sudo mkdir -p /opt/sassblum
sudo chown deploy:deploy /opt/sassblum
cd /opt/sassblum

# Create directory for persistent logs
mkdir -p logs

# Set restricted permissions on env file
touch .env.prod
chmod 600 .env.prod
```

### Environment Configuration

Create `/opt/sassblum/.env.prod`:

```bash
# Django
DJANGO_SECRET_KEY=your-secure-random-key-here-min-50-chars
DJANGO_DEBUG=False

# Database
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# Redis (running in Docker)
REDIS_URL=redis://redis:6379/0
USE_REDIS=True

# CORS and hosts
CORS_ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
ALLOWED_HOSTS=api.example.com,www.api.example.com

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@example.com
FRONTEND_URL=https://app.example.com

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Clone Repository

```bash
cd /opt/sassblum
git clone https://github.com/your-org/SassBlumRedise-oWeb.git .
```

### SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d api.example.com -d www.api.example.com

# Certificate paths:
# - Full chain: /etc/letsencrypt/live/api.example.com/fullchain.pem
# - Private key: /etc/letsencrypt/live/api.example.com/privkey.pem
```

### Update nginx.conf for HTTPS

Once you have certificates, update `nginx.conf`:

```nginx
upstream backend {
    server backend:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.example.com www.api.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.example.com www.api.example.com;

    # SSL certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_buffering off;
    }

    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }

    location /static/ {
        alias /usr/share/nginx/html/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
}
```

### Test Deployment Locally

```bash
# Pull latest images
docker pull docker.io/yourname/sassblum-backend:latest
docker pull docker.io/yourname/sassblum-frontend:latest

# Start with docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Check services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Deployment Workflow

### Via Jenkins (Automated)

1. Push code to `main` branch
2. Jenkins webhook triggers automatically (or manual trigger)
3. Pipeline stages execute:
   - Checkout
   - Backend Tests (pytest, flake8)
   - Frontend Tests (tsc, jest, eslint)
   - Build Docker images
   - Push to Docker registry
   - Deploy to production server (SSH)
   - Smoke tests
4. Monitor Jenkins logs: Manage Jenkins → System log

### Manual Deployment

```bash
# On CI server
git clone https://github.com/your-org/SassBlumRedise-oWeb.git
cd SassBlumRedise-oWeb

# Run tests
cd backend && pytest && cd ..
cd frontend && npm test && cd ..

# Build images
docker build -t docker.io/yourname/sassblum-backend:latest backend/
docker build -t docker.io/yourname/sassblum-frontend:latest frontend/

# Push to registry
docker push docker.io/yourname/sassblum-backend:latest
docker push docker.io/yourname/sassblum-frontend:latest

# SSH to production and pull/restart
ssh deploy@prod-server.example.com << 'EOF'
cd /opt/sassblum
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
EOF
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.prod.yml logs -f frontend

# Redis only
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Health Checks

Each container has a health check configured. View status:

```bash
docker-compose -f docker-compose.prod.yml ps
# STATUS should show (healthy) for all services
```

### Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
```

### Collect Static Files

```bash
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
```

### Backup Database

```bash
# Via Supabase dashboard (Settings → Backups)
# Or via pg_dump
pg_dump "postgresql://user:password@db.supabase.co:5432/postgres" > /opt/sassblum/backups/db-$(date +%Y%m%d-%H%M%S).sql
```

### Scale Backend

```bash
# Run multiple backend instances (behind nginx upstream)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## Rollback Procedure

If a deployment fails:

```bash
# SSH to production server
ssh deploy@prod-server.example.com

cd /opt/sassblum

# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Change image tag to previous build number in docker-compose.prod.yml
# Example: sassblum-backend:123 instead of :latest

# Restart with previous version
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Once confirmed to be working, update Jenkins to deploy that build number
```

---

## Troubleshooting

### Container exits immediately

```bash
# Check logs
docker logs sassblum_backend_prod

# Common causes:
# - Missing environment variable: grep "error" docker logs
# - Database connection: verify DATABASE_URL in .env.prod
# - Secret key invalid: ensure DJANGO_SECRET_KEY is 50+ chars
```

### WebSocket connection fails

```bash
# Check Redis running
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# Should return PONG

# Check backend logs for WebSocket errors
docker-compose -f docker-compose.prod.yml logs backend | grep -i websocket

# Verify nginx proxy_buffering is off (see nginx.conf /ws/ block)
```

### Slow response times

```bash
# Check if backend is overloaded
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell
# >>> from django.db import connection
# >>> len(connection.queries)  # If > 100, N+1 query problem

# Scale backend:
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Monitor with:
docker stats
```

### Certificate renewal failing

```bash
# Certbot auto-renewal runs daily. Check status:
sudo systemctl status certbot.timer

# Manual renewal:
sudo certbot renew --force-renewal

# If renewal succeeds, nginx reloads automatically
```

---

## Success Indicators

- [ ] `docker-compose -f docker-compose.prod.yml ps` shows all services as (healthy)
- [ ] `curl https://api.example.com/` returns HTML (frontend loads)
- [ ] `curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/tickets/` returns JSON (API works)
- [ ] WebSocket connects: browser DevTools → Network → ws → status 101 Switching Protocols
- [ ] Emails send: check backend logs for SMTP log entries
- [ ] Notifications arrive in real-time: create ticket, see notification bell update instantly

---

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config | grep DJANGO_SECRET_KEY`
3. Test connectivity: `docker-compose exec backend python manage.py shell`
4. Check Git log: `git log --oneline | head -10`
```

### 📄 README.md
```
# SassBlum — Ticket Management System

**Institution:** ESPOL — FIEC  
**Client:** SassBlum · Vicky Pinto  
**Team:** Erick Armijos · Juan Pérez · Elías Rubio · Jahir Cajas · Jairo Rodríguez

---

## Presentation Structure (10 minutes · English · Equal participation)

| # | Section (from rubric) | Speaker | Time |
|---|----------------------|---------|------|
| 1 | System Introduction | Juan Pérez | ~2 min |
| 2 | User Stories & Sprints | Jahir Cajas | ~1.5 min |
| 3 | Architecture (deployment + component) | Jairo Rodríguez | ~2 min |
| 4 | Demo — Client & Admin roles (acceptance tests) | Erick Armijos | ~2.5 min |
| 5 | Demo — Worker role + Notifications + Test plan review | Elías Rubio | ~2 min |

---

## Demo Setup — Test Data & Credentials

Before any section, load the seed data (idempotent — safe to re-run):

```bash
cd backend
python manage.py seed_demo
```

This loads the **6 real SassBlum services** (Infraestructura IT, Soporte Técnico, Cableado Estructurado, CCTV, Domótica, Venta de Servidores) plus the accounts and sample tickets below.

### Test accounts (password for all: `SassBlum2026`)

| Role | Email | Use in demo |
|------|-------|-------------|
| Admin | `admin@sassblum.com` | Assign/reassign tickets, reports, user management |
| Worker | `trabajador1@sassblum.com` | Update status, add comments (Carlos Técnico) |
| Worker | `trabajador2@sassblum.com` | Update status, add comments (Ana Soporte) |
| Client | `cliente@sassblum.com` | Create/view tickets |
| Client | `erick2003kimi@gmail.com` | Real verified client account |

### Seeded tickets (one per lifecycle state)

| Number | Subject | State | Assigned |
|--------|---------|-------|----------|
| T-2026-9001 | Servidor de correo caído | **Nuevo** (unassigned) | — |
| T-2026-9002 | Cámara de seguridad sin señal | **En Proceso** | Carlos |
| T-2026-9003 | Cableado para nueva oficina | **En Espera** | Carlos |
| T-2026-9004 | Configurar domótica en sala de reuniones | **Resuelto** | Ana |
| T-2026-9005 | Mantenimiento preventivo de servidores | **Cerrado** | Ana |

> **T-2026-9001** is left in *Nuevo* and unassigned on purpose so the Admin demo (Step 2: assign to a worker) has a ready target. The other tickets cover history, status badges, and filtering.

### Start the stack

```bash
# Backend (terminal 1)
cd backend && daphne config.asgi:application
# Frontend (terminal 2)
cd frontend && npm run dev      # http://localhost:5173
```

---

## Section 1 — System Introduction · Juan Pérez (~2 min)

**Who the client is:** SassBlum, a service company managed by Vicky Pinto.

**System scope:** Full-stack ticket management platform built for 3 user roles — Client, Worker, and Admin — allowing end-to-end tracking of service requests from creation through resolution.

**What the system does:**
- Clients submit service tickets with attachments and descriptions.
- Admins assign tickets to workers and manage users.
- Workers update ticket status and add comments.
- An Observer pattern triggers real-time notifications (email + in-app + WebSocket) on every state change.
- Reports and exports are available for data analysis.

**Technology stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + Zustand |
| Backend | Django 6 + Django REST Framework + SimpleJWT |
| Database | Supabase (PostgreSQL 15) + Row Level Security |
| Realtime | Django Channels + Redis |
| Reports | ReportLab (PDF) + OpenPyXL (Excel) + CSV + Recharts |
| Email | Django send_mail + SMTP |
| Tests FE | Vitest + React Testing Library |
| Tests BE | pytest + pytest-django + DRF APIClient |
| CI/CD | GitHub Actions + Jenkins + Docker |

---

## Section 2 — User Stories & Sprints · Jahir Cajas (~1.5 min)

### 18 User Stories (HU-01 to HU-18)

| ID | Story |
|----|-------|
| HU-01 | Login with credentials |
| HU-02 | Client registration |
| HU-03 | Password recovery |
| HU-04 | Ticket creation |
| HU-05 | Ticket assignment |
| HU-06 | Ticket visualization |
| HU-07 | Status update |
| HU-08 | Ticket reassignment |
| HU-09 | Ticket history |
| HU-10 | Filtering and search |
| HU-11 | Comments on tickets |
| HU-12 | Ticket closure |
| HU-13 | Real-time visualization |
| HU-14 | Notification dispatch |
| HU-15 | Notification preferences |
| HU-16 | Notification history |
| HU-17 | Report generation |
| HU-18 | Data export |

### 4 Sprints

| Sprint | Dates | Modules | Sessions |
|--------|-------|---------|----------|
| Sprint 1 | May 25–31 | Authentication (FE + BE) | S1–S10 |
| Sprint 2 | Jun 15–21 | Catalog + Tickets (creation & state machine) | S11–S18 |
| Sprint 3 | Jul 6–26 | Notifications + History + Password Reset | S19–S27 |
| Sprint 4 | Jul 27–Aug 16 | Assignment + Reports + Realtime | S28–S34 |

**Total:** 34 sessions across 4 sprints · MVP fully delivered end-to-end.

---

## Section 3 — Architecture · Jairo Rodríguez (~2 min)

### Deployment Diagram

```
Browser
  └─► Nginx (reverse proxy)
        ├─► React SPA (static files)
        ├─► /api/    → Daphne → Django + DRF (REST)
        └─► /ws/     → Daphne → Django Channels (WebSocket)
                              └─► Redis (channel layer)
                              └─► Supabase PostgreSQL 15 (+ RLS)
CI/CD: GitHub Actions → Docker Build → Jenkins → Production Server
```

### Component Diagram (Layer Architecture)

```
Frontend (React 19)                    Backend (Django 6)
─────────────────────────              ─────────────────────────────
Pages                                  Views (HTTP orchestration only)
  └─► Hooks (useAuth, useTickets…)      └─► Services (business logic)
        └─► Services (Singletons)             └─► Repositories (ORM isolation)
              └─► ApiClient (Axios)                  └─► Models (data only)
              └─► SocketClient (WS)
                                        Channels Consumers (WebSocket)
Interfaces (IAuthService,               Signals → NotificationService
  ITicketService, IRepository<T>…)        └─► Strategy (Email/InApp/WS)
```

### Design Patterns Applied

| Pattern | Where |
|---------|-------|
| Repository | `AuthRepository`, `TicketRepository`, `NotificationRepository` |
| Factory | `NotificationFactory`, `ExporterFactory`, `ValidatorFactory` |
| Strategy | `EmailStrategy`, `InAppStrategy`, `PDFExporter`, `CSVExporter` |
| Observer | Django Signals: `post_save` on `TicketEvent` → `NotificationService` |
| Singleton | `AuthService`, `TicketService`, `NotificationService`, `ApiClient` |
| Chain of Responsibility | `EmailValidator → PasswordValidator → RegistrationValidatorChain` |

**SOLID principles** applied in every module (SRP · OCP · LSP · ISP · DIP).

---

## Section 4 — Demo: Client & Admin Roles · Erick Armijos (~2.5 min)

### Acceptance Tests — Client Role (HU-01, HU-02, HU-04, HU-06, HU-09, HU-10)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Register new client account | Account created, verification email sent |
| 2 | Verify email via link | Email confirmed, login enabled |
| 3 | Login with credentials | JWT issued, redirected to client dashboard |
| 4 | Create a ticket (title, description, service, attachment) | Ticket created with status **Nuevo**, Observer fires notification |
| 5 | View ticket list with search/filters | Paginated list with status badges and filters working |
| 6 | Open ticket detail and view history | Full history with timestamps and comments shown |

### Acceptance Tests — Admin Role (HU-05, HU-07, HU-08, HU-17, HU-18)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as admin | Admin dashboard visible with all tickets |
| 2 | Assign ticket to a worker | Status changes to **En Proceso**, worker notified |
| 3 | Reassign ticket to different worker | Reassignment recorded in history |
| 4 | Generate report (date range, status filter) | Charts render with Recharts |
| 5 | Export report to PDF / CSV / Excel | File downloads correctly |
| 6 | Create / block / unblock a user | User state persisted in database |

### Ticket State Machine

```
[Nuevo] ──► [En Proceso] ──► [En Espera] ──► [En Proceso]
                         └──► [Resuelto] ──► [Cerrado] (terminal)
```
Every transition requires a non-empty comment (BR-35).

---

## Section 5 — Demo: Worker Role + Notifications + Test Plan · Elías Rubio (~2 min)

### Acceptance Tests — Worker Role (HU-07, HU-11, HU-12)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as worker | Worker dashboard with assigned tickets |
| 2 | Open ticket and add comment | Comment saved, shown in history |
| 3 | Update status: En Proceso → En Espera | Transition validated, Observer fires notification |
| 4 | Resume: En Espera → En Proceso | Admin and client notified |
| 5 | Mark as Resuelto → Cerrado | Terminal state reached, ticket locked |

### Notifications & Real-time (HU-13, HU-14, HU-15, HU-16)

| Feature | Implementation |
|---------|---------------|
| Email notifications | SMTP via `EmailNotificationStrategy` (Django Signals) |
| In-app notifications | `InAppNotificationStrategy` + REST endpoint |
| Real-time updates | `WebSocketStrategy` + Django Channels + Redis |
| Notification bell | React component polling + WebSocket push |
| Notification preferences | Per-user toggles (email / in-app / WS) |

**WebSocket events:**
- `ticket_updated` — full ticket payload on any state change
- `notification_new` — notification object pushed to connected clients
- `user_connected` — presence event with userId, name, role

### Test Plan Overview

**Backend (pytest):**
- `test_auth_service.py` — login, registration, 5-attempt lockout, JWT refresh
- `test_password_reset.py` — forgot/reset flow with token expiry
- `test_ticket_lifecycle.py` — full state machine transitions + invalid transitions
- `test_validators.py` — Chain of Responsibility: each validator node tested individually
- `test_ticket_repository.py` — CRUD and filter queries with real DB
- `test_notification_service.py` — Observer dispatch mock verification
- `test_strategies.py` — Email/InApp/WebSocket strategy isolation
- `test_exporters.py` — PDF, CSV, Excel output validation

**Frontend (Vitest + React Testing Library):**
- `LoginForm.test.tsx` — form validation, submission, error states
- `TicketStatusBadge.test.tsx` — renders correct badge per status
- `CreateTicketForm.test.tsx` — field validation, file upload
- `NotificationBell.test.tsx` — unread count, panel toggle
- `useNotifications.test.tsx` — hook state after WebSocket event

**CI:** GitHub Actions pipeline (`ci.yml`) — lint → tsc → pytest → vitest → Docker build.

---

## Other Important Information

### Security

- JWT stored **in memory only** (never `localStorage`) — prevents XSS token theft.
- Supabase Row Level Security (RLS) — each user can only query their own data.
- RBAC with segregated permission classes: `IsClient`, `IsWorker`, `IsAdmin` (ISP).
- Account lockout after 5 failed login attempts with configurable cooldown.

### API Surface (30+ endpoints)

```
POST /api/auth/register        GET  /api/tickets
POST /api/auth/login           GET  /api/tickets/:id
POST /api/auth/logout          PATCH /api/tickets/:id/estado
GET  /api/auth/verify-email    PATCH /api/tickets/:id/asignar
POST /api/auth/forgot-password GET  /api/tickets/:id/historial
POST /api/auth/reset-password  GET  /api/notificaciones
GET  /api/catalog/services     PATCH /api/notificaciones/:id/marcar-leida
GET  /api/usuarios             GET  /api/reportes/tickets
POST /api/usuarios             POST /api/reportes/exportar
PATCH /api/usuarios/:id/bloquear
```

**WebSocket:** `ws://.../ws/tickets/` · `ws://.../ws/notifications/`

### How to Run

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
daphne config.asgi:application

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Team Responsibilities

| Member | Modules |
|--------|---------|
| **Erick Armijos** | Tickets (FE + BE) + ValidatorFactory |
| **Juan Pérez** | Core foundation + Authentication (FE + BE) + Integration |
| **Elías Rubio** | Notifications + Realtime + SocketClient |
| **Jahir Cajas** | Catalog + Public site + UI kit + styles |
| **Jairo Rodríguez** | Reports + Dashboards + DevOps / Infra + ExporterFactory |
```

### 📄 REFACTOR_HANDOFF.md
```
# REFACTOR HANDOFF — Rediseño "a producción" de SassBlum

> Estado y guía para continuar el rediseño visual basado en el proyecto de referencia
> `C:\VsCode\Webappredesignsassblum` (Figma "Web App Redesign for Sassblum").
> Fecha: 2026-06-04. Plan original: `C:\Users\erick\.claude\plans\este-proyecto-que-tengo-rosy-hopper.md`.

---

## 0) TL;DR del estado

- ✅ **Design system portado** (shadcn/Radix + lucide + tema navy `#0a1628` / cyan `#00d4ff`).
- ✅ **Sitio público completo** (Home con hero animado, Nosotros, Servicios, Galería, Clientes) con animaciones (framer-motion).
- ✅ **Navbar + Footer** de marca; **router** reescrito (público + auth + dashboards por rol).
- ✅ **Auth** (Login/Register/Forgot/Reset/Verify) reestilizado con el design system, **lógica intacta**.
- ✅ **Dashboards por rol** (Cliente / Trabajador / Admin) + página de Notificaciones, **cableados a la API real**.
- ✅ **Backend**: `SupabaseStorageService` real + campo `imagen_url` en `Service` + subida de fotos de servicios (admin/trabajador) + catálogo público.
- ✅ `tsc --noEmit` (frontend) **EXIT 0** · `manage.py check` **sin issues** · migración `catalog/0002_service_imagen_url.py` generada.
- ⏳ **Pendiente de TI (runtime)**: crear bucket en Supabase + variables `.env` + `migrate` + smoke test (la BD Supabase no era alcanzable desde el entorno de trabajo).
- ⏳ **Pendiente de código**: acciones de worker (cambiar estado) y admin (asignar) desde la nueva UI; ver §6.

---

## 1) Dependencias nuevas (frontend) — ya instaladas

`class-variance-authority clsx tailwind-merge lucide-react sonner framer-motion`
y Radix: `@radix-ui/react-{dialog,dropdown-menu,select,tabs,label,slot,avatar,tooltip,alert-dialog,switch,separator}`.

Backend: **sin dependencias nuevas** — `SupabaseStorageService` usa `requests` (ya en `requirements.txt`).

---

## 2) Design system (Fase 0)

- **Tokens**: `frontend/src/index.css` — se portaron las variables de `globals.css` de la referencia + utilidades de marca: `bg-brand-navy`, `bg-brand-navy-deep`, `text-brand-cyan`, `hover:bg-brand-cyan-dark`, `border-brand-border`. Animación `.animate-brand-gradient`.
- **Primitivas UI**: `frontend/src/core/ui/*` (button, card, input, label, textarea, select, tabs, table, badge, dialog, alert-dialog, dropdown-menu, alert, avatar, switch, separator, tooltip, skeleton, sonner). Copiadas de la referencia; se les quitaron las **versiones pinchadas** de los imports (`@1.2.3`). Barrel en `core/ui/index.ts`.
- `core/ui/utils.ts` → helper `cn()`. `core/ui/ImageWithFallback.tsx` → `<img>` con placeholder de marca.
- **Layout**: `core/ui/layout/Navbar.tsx` y `Footer.tsx`.

> ⚠️ Si agregas más primitivas desde la referencia (`carousel`, `chart`, `drawer`, `calendar`, `sonner` original, `command`, `input-otp`, `resizable`), **instala sus deps** (embla, recharts, vaul, react-day-picker, next-themes, cmdk, input-otp, react-resizable-panels) y **quita los `@version`** de los imports.

---

## 3) Router y árbol de providers (Fase 2) — `frontend/src/App.tsx`

```
BrowserRouter
└─ AuthProvider (authService)
   └─ CatalogProvider (catalogService)         // global: el hook hace fetch, el provider no
      └─ Routes → <SiteLayout/> (Navbar + Outlet + Footer + Toaster)
         · SiteLayout envuelve con NotificationProvider + TicketClientProvider SOLO si hay sesión
           (porque useNotifications/useTickets hacen fetch al montar → requieren auth)
```

**Rutas**:
- Público: `/` `/nosotros` `/servicios` `/galeria` `/clientes`
- Auth: `/login` `/register` `/forgot-password` `/reset-password` `/verify-email` (tarjeta `AuthCard` + `AuthServiceProvider`)
- App: `/app` (redirige por rol), `/mis-tickets` (CLIENTE), `/panel` (TRABAJADOR), `/admin` (ADMINISTRADOR), `/tickets/:id`, `/notificaciones`
- Login exitoso → `navigate('/app')` → `AppRedirect` manda al dashboard según `user.rol`.

**Roles** (del FE, en `IAuthService`): `'CLIENTE' | 'TRABAJADOR' | 'ADMINISTRADOR'` (mapeados desde `client/worker/admin` del backend en `AuthService.ts`). Úsalos siempre así.

---

## 4) Páginas nuevas (Fases 3–5)

| Área | Archivo | Notas |
| --- | --- | --- |
| Público | `modules/public/pages/{Home,About,Services,Gallery,Clients}.tsx` | Animaciones framer-motion. **Services** consume el **catálogo real** (`useCatalog`) y muestra `imagenUrl`. |
| Auth | `modules/auth/components/{LoginForm,RegisterForm}/index.tsx` | Reestilizados; **misma lógica** (validadores, `useAuth`). |
| Dashboards | `modules/dashboard/{ClientDashboard,WorkerDashboard,AdminDashboard,TicketsPanel}.tsx` | `TicketsPanel` = stats + tabla (+ crear). Cliente/Trabajador lo reutilizan. |
| Tickets | `modules/tickets/components/{TicketsTable,ticketBadges}.tsx` | Tabla con búsqueda/filtro + badges de estado/prioridad. |
| Catálogo admin | `modules/catalog/components/CatalogAdminPanel.tsx` | **Subida de foto** (multipart → `/servicios/admin`). |
| Notificaciones | `modules/notifications/pages/NotificationsPage.tsx` | Lista + marcar leídas, en vivo por WS. |

**AdminDashboard** usa Tabs: Tickets · Usuarios (`AdminUserPage` existente) · Catálogo (`CatalogAdminPanel`) · Reportes (`ReportsDashboard` existente, envuelto en `ReportsProvider`).

> Nota: `AdminUserPage`, `ReportsDashboard`, `CreateTicketPage` y `TicketDetailPage` se **reutilizan tal cual** (funcionan) dentro del nuevo chrome; conservan su estilo viejo por dentro → ver §6 (pulido visual pendiente).

---

## 5) Backend — Supabase Storage + fotos de servicios (Fase 1)

- `apps/tickets/services/storage_service.py` → **`StorageService(IStorageService)`** real (REST de Supabase Storage vía `requests`). Si faltan credenciales, usa URL stub local (dev sin bucket).
- `config/settings.py` → `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET` (default `sassblum`).
- `apps/catalog/models/service.py` → campo **`imagen_url`** (+ migración `0002`).
- `apps/catalog/services/catalog_service.py` → inyecta `IStorageService`, sube imagen en create/edit, expone `imagen_url` en `_summary/_detail`.
- `apps/catalog/views/catalog_views.py` →
  - `ServiceListView` ahora **`AllowAny`** (catálogo público para la web).
  - `ServiceAdminView` → **`IsWorker | IsAdmin`** + `MultiPartParser`; toma `request.FILES['imagen']`.
- FE: `ServiceSummary.imagenUrl` + mapeo en `CatalogService.ts`.

### ⚠️ Pasos de runtime que DEBES ejecutar tú (no se pudieron correr: la BD Supabase no era alcanzable)
1. En Supabase → **Storage → New bucket** público (p. ej. `sassblum`).
2. En `backend/.env` agrega:
   ```
   SUPABASE_URL=https://<tu-proyecto>.supabase.co
   SUPABASE_SERVICE_KEY=<service_role key>   # solo backend, NUNCA en el FE
   SUPABASE_STORAGE_BUCKET=sassblum
   ```
3. `cd backend; python manage.py migrate`  (aplica `catalog.0002`).
4. Smoke: como admin/worker, `POST /api/servicios/admin` multipart con `nombre/descripcion/categoria/imagen` → respuesta con `imagen_url` real; `GET /api/servicios` la lista; la imagen aparece en `/servicios` público.

---

## 6) LO QUE FALTA (continuar aquí)

**Alta prioridad (funcionalidad por rol que la referencia tiene y aún no está cableada):**
1. **Worker: cambiar estado del ticket** desde la UI. Backend listo: `PATCH /api/tickets/:id/estado` (body `{estado, comentario}`, comentario obligatorio BR-35). Falta: exponer `updateStatus` en un hook/provider de worker (hay `ITicketWorkerActions`) y un diálogo en `TicketDetailPage`/`WorkerDashboard`. Hoy el worker **ve** sus tickets pero no cambia estado desde la nueva UI.
2. **Admin: asignar/reasignar ticket**. Backend listo: `PATCH /api/tickets/:id/asignar` y `/reasignar`. Existe `AssignModal` (viejo) sin cablear al nuevo `AdminDashboard`. Falta hook/provider admin + botón "Asignar" en la tabla/detalle.
3. **Detalle de ticket como diálogo** (la referencia abre el detalle en `Dialog` desde la tabla). Hoy navega a la ruta `/tickets/:id` (funciona, pero estilo viejo). Opcional: portar a `Dialog` usando `core/ui/dialog`.

**Pulido visual (consistencia con el design system):**
4. Reestilizar por dentro las páginas reutilizadas: `CreateTicketForm`, `TicketDetailPage`/`TicketDetail` (+ `TicketHistory`), `AdminUserPage`, `ReportsDashboard` (idealmente con **recharts** — instalar). Hoy funcionan pero con estilo previo.
5. `NotificationPreferences` (toggles email/in-app/WS) — existe componente viejo; integrarlo en `/notificaciones` con `core/ui/switch`.

**Opcional (la referencia lo tiene; requiere backend nuevo):**
6. **Workflow de solicitudes de reasignación** (worker pide → admin aprueba/rechaza): el backend solo hace reasignación directa. Requiere modelo `ReassignmentRequest` + endpoints + UI.
7. Campos `empresa`/`telefono` y **eliminar usuario** (el `User` real solo bloquea/desbloquea).

**Deploy / build:**
8. `npm run build` (`tsc -b`) falla por **errores PREEXISTENTES, ajenos al rediseño**:
   - vars sin usar en stubs: `validators/{BasicFieldValidator,FileValidator,BusinessRuleValidator,TicketValidatorChain}.ts`, `CreateTicketForm` (`AUTOSAVE_DELAY_MS`).
   - `TicketStatusBadge.test.tsx` no encuentra `@testing-library/react` / tipos de jest.
   Arreglo: prefijar con `_` las vars sin usar (o eliminarlas) y, para los tests, instalar `@testing-library/react @types/jest` o **excluir** `*.test.tsx` del `tsconfig` de build.
   > El **dev server (`npm run dev`) corre sin problema** y `tsc --noEmit` (typecheck principal) pasa limpio con todo el código nuevo.

---

## 7) Cómo correrlo

```bash
# Backend
cd backend
pip install -r requirements.txt          # si no está
# .env con DJANGO_SECRET_KEY, DATABASE_URL (Supabase) + las 3 vars SUPABASE_* (§5)
python manage.py migrate
python manage.py createsuperuser
daphne config.asgi:application            # o: python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev                               # http://localhost:5173
```

Recorrido de demo: Home (hero animado) → Servicios (catálogo real con fotos) → Nosotros/Galería/Clientes → Registro/Login → según rol: Cliente crea ticket / Trabajador ve asignados / Admin gestiona tickets, usuarios, **sube foto de servicio** y ve reportes → campana de notificaciones en vivo.

---

## 8) Reglas que se respetaron (CLAUDE.md)
- DIP intacto: páginas/componentes dependen de **interfaces** vía providers; los servicios concretos se inyectan solo en `App.tsx`. Las primitivas shadcn son presentacionales (no rompen DIP).
- ISP en backend (permisos `IsWorker | IsAdmin`), Strategy/Adapter en `IStorageService`, Singleton en `CatalogService`.
- Roles del FE: `CLIENTE/TRABAJADOR/ADMINISTRADOR` (no usar los literales de la referencia).
```

### 📄 REPARTO_EQUIPO.md
```
# REPARTO_EQUIPO — Workflow modular de SassBlum (5 integrantes)

> Guía para reconstruir SassBlum en el **repositorio nuevo**, repartido entre los 5 integrantes con
> commits progresivos por autor. Copia este archivo al repo nuevo.
>
> **Fuente de verdad (solo lectura):** el repo actual `c:\VsCode\SassBlumRedise-oWeb`. De ahí se
> copian los archivos al repo nuevo; NO se hace `git cherry-pick`/`push` del historial viejo.

---

## Reparto general

| # | Integrante | Lote |
|---|------------|------|
| 1 | **Erick Armijos**   | Tickets (FE+BE) + ValidatorFactory |
| 2 | **Juan Pérez**      | Fundación (core) + Auth (FE+BE) + Integración (config, App shell) |
| 3 | **Elías Rubio**     | Notifications + Realtime + SocketClient |
| 4 | **Jahir Cajas**     | Catalog + Sitio público + UI kit + estilos/assets |
| 5 | **Jairo Rodríguez** | Reports + Dashboards + DevOps/Infra + ExporterFactory |

---

## Reglas de oro (todos)

1. **Cada quien configura su identidad git** en su clon — único paso de entorno por persona:
   ```bash
   git config user.name "Tu Nombre"
   git config user.email "tu-correo@espol.edu.ec"
   ```
2. **Solo tocas tus archivos.** No edites archivos de otro lote (evita conflictos).
3. **Rama por feature/sesión** (ver cada lote). Nunca commitear directo a `main`; siempre PR.
4. **Commit progresivo, archivo por archivo.** Copias 1 archivo (o un grupo pequeño cohesivo) desde la
   fuente → lo **revisas con el checklist SOLID** (abajo) → commit. No vuelques todo en un solo commit.
5. **Conventional commits:** `feat(<modulo>): ...`, `test(<modulo>): ...`, `fix(<modulo>): ...`,
   `chore(...)`. Ejemplos: `feat(tickets): add TicketStateMachine`, `test(auth): cubrir bloqueo 5 intentos`.
6. **Orden DENTRO de cada lote** = jerarquía arquitectónica:
   `interfaces → models → repositories → validators → services → serializers → views → (FE) hooks → components → pages → tests`.

---

## Fase 0 — Entorno y bootstrap (Jairo / DevOps · NO es tarea de los demás)

1. `.gitignore` correcto: `node_modules/`, `.venv/`, `__pycache__/`, `*.pyc`, `.env`, `dist/`, `build/`, `.sonarlint/`, `*.zip`.
2. Commit base en `main` (esqueleto de carpetas vacío) + `git push origin main`.
3. Re-crear **secrets de GitHub Actions** (token SonarQube, `SUPABASE_*`, SMTP), re-vincular **SonarCloud**, branch protections.
4. Los 3 `CLAUDE.md` + `REFACTOR_HANDOFF.md` los commitea Juan en su rama de fundación (Fase 1).

---

## Orden de merges (dependencias — respetar)

1. `feat/core-foundation` (Juan) + `feat/ui-kit` (Jahir) — sin estas bases nada compila.
2. `auth` (Juan) — el modelo `User` lo necesitan todos.
3. `catalog` (Jahir) — el modelo `Service` lo exige el FK de `Ticket`.
4. `tickets` (Erick) — depende de auth + catalog.
5. `notifications` + `realtime` (Elías) — Observer sobre `TicketEvent`.
6. `reports` (Jairo) — agrega sobre tickets.
7. **Integración** (Juan): `config/urls.py` + `config/settings.py` + `App.tsx` + `dashboards`/`public`.
8. `devops` (Jairo) — Docker/CI/Jenkins (independiente).

> **Archivos cruzados (commitear DESPUÉS de su módulo):**
> `core/factories/validator_factory.py` y `core/factories/ValidatorFactory.ts` → Erick (tras validators de tickets).
> `core/factories/exporter_factory.py` → Jairo (tras exporters). `infrastructure/websocket/SocketClient.ts` → Elías.

---

## 1) ERICK ARMIJOS — Tickets (FE + BE)

**Ramas:** `feat/tickets-modelos-validacion` · `feat/tickets-servicios-estado` · `feat/tickets-fe-componentes` · `feat/tickets-fe-paginas`

### Backend — `backend/apps/tickets/` (todos)
```
__init__.py · admin.py · apps.py · urls.py · models.py · tests.py · views.py
interfaces/__init__.py · i_storage_service.py · i_ticket_admin_actions.py · i_ticket_client_actions.py · i_ticket_service.py · i_ticket_worker_actions.py
models/__init__.py · attachment.py · ticket.py · ticket_event.py
repositories/__init__.py · ticket_repository.py
serializers/__init__.py · ticket_action_serializers.py · ticket_create_serializer.py · ticket_event_serializer.py · ticket_list_serializer.py
services/__init__.py · storage_service.py · ticket_service.py
state_machine/__init__.py · state_transition_validator.py · ticket_state_machine.py
validators/__init__.py · basic_field_validator.py · business_rule_validator.py · file_validator.py · ticket_validator_chain.py
views/__init__.py · ticket_action_views.py · ticket_create_view.py · ticket_history_views.py
migrations/__init__.py · 0001_initial.py
tests/__init__.py · test_state_machine.py · test_ticket_lifecycle.py · test_ticket_repository.py · test_ticket_service.py · test_validators.py
```

### Backend — cross-cutting (vive en core/, es de tickets)
```
backend/core/factories/validator_factory.py
```

### Frontend — `frontend/src/modules/tickets/` (todos)
```
components/AssignModal/index.tsx · TicketsTable.tsx · ticketBadges.tsx
components/CreateTicketForm/.gitkeep · CreateTicketForm.test.tsx · index.tsx
components/FileUpload/.gitkeep · index.tsx
components/TicketCard/index.tsx · TicketDetail/index.tsx · TicketHistory/index.tsx
components/TicketStatusBadge/index.tsx · TicketStatusBadge.test.tsx
hooks/.gitkeep · useTickets.tsx
interfaces/IStorageService.ts · ITicketAdminActions.ts · ITicketClientActions.ts · ITicketService.ts · ITicketWorkerActions.ts
pages/.gitkeep · CreateTicketPage/index.tsx · TicketDetailPage/index.tsx · TicketHistoryPage/index.tsx
repositories/.gitkeep
services/.gitkeep · TicketAdminService.ts · TicketService.ts
state_machine/.gitkeep · TicketStateMachine.ts · index.ts
validators/.gitkeep · BasicFieldValidator.ts · BusinessRuleValidator.ts · FileValidator.ts · TicketValidatorChain.ts
```

### Frontend — cross-cutting
```
frontend/src/core/factories/ValidatorFactory.ts
```

---

## 2) JUAN PÉREZ — Fundación + Auth + Integración

**Ramas:** `feat/core-foundation` (Fase 1) · `feat/auth-be` · `feat/auth-fe` · `chore/integracion` (Fase 3)

### Backend — Fundación / config / runtime
```
backend/manage.py · backend/CLAUDE.md
backend/config/__init__.py · asgi.py · settings.py · urls.py · websocket_urls.py · wsgi.py
backend/core/base/__init__.py · base_repository.py · base_validator.py
backend/core/exceptions/__init__.py · domain_exceptions.py
backend/core/factories/__init__.py
backend/core/interfaces/__init__.py
backend/core/permissions/__init__.py · rbac_permissions.py
```

### Backend — `backend/apps/authentication/` (todos)
```
__init__.py · admin.py · apps.py · models.py · urls.py · user_urls.py
interfaces/__init__.py · i_auth_service.py · i_user_admin_actions.py
repositories/__init__.py · user_repository.py
serializers/__init__.py · forgot_password_serializer.py · login_serializer.py · register_serializer.py · reset_password_serializer.py · user_admin_serializers.py · verify_email_serializer.py
services/__init__.py · auth_service.py · token_service.py · user_admin_service.py
validators/__init__.py · email_validator.py · password_validator.py · registration_validator_chain.py
views/__init__.py · auth_views.py · password_reset_views.py · user_admin_views.py
migrations/__init__.py · 0001_initial.py · 0002_remove_user_username_alter_user_bloqueado_hasta_and_more.py
tests/__init__.py · test_auth_service.py · test_password_reset.py
```

### Frontend — Fundación / app shell
```
frontend/index.html · frontend/CLAUDE.md · frontend/README.md
frontend/src/App.tsx · App.css · main.tsx
frontend/src/core/base/BaseValidator.ts
frontend/src/core/factories/index.ts
frontend/src/core/interfaces/IRepository.ts
frontend/src/infrastructure/config/env.ts
frontend/src/infrastructure/http/ApiClient.ts · apiError.ts
```

### Frontend — `frontend/src/modules/auth/` (todos)
```
components/.gitkeep · ProtectedRoute.tsx · LoginForm/index.tsx · RegisterForm/index.tsx
hooks/.gitkeep · useAuth.tsx · useAuthService.tsx
interfaces/IAuthService.ts · IUserAdminActions.ts
pages/.gitkeep · AdminUserPage/index.tsx · ForgotPasswordPage/index.tsx · ResetPasswordPage/index.tsx · VerifyEmailPage/index.tsx
repositories/.gitkeep
services/.gitkeep · AuthService.ts · UserAdminService.ts
validators/.gitkeep · EmailValidator.ts · PasswordValidator.ts
```

### Raíz (docs de proyecto)
```
CLAUDE.md · REFACTOR_HANDOFF.md
```

> Integración (Fase 3): al final, Juan actualiza `backend/config/urls.py`, `backend/config/settings.py`
> (INSTALLED_APPS de todas las apps) y `frontend/src/App.tsx` (inyección de todos los services).

---

## 3) ELÍAS RUBIO — Notifications + Realtime

**Ramas:** `feat/notifications-be` · `feat/realtime-be` · `feat/notifications-fe`

### Backend — `backend/apps/notifications/` (todos)
```
__init__.py · admin.py · apps.py · urls.py · GUIA_IMPLEMENTACION_API_S20.md
factory/__init__.py · notification_factory.py
interfaces/__init__.py · i_notification_service.py · i_notification_strategy.py
models/__init__.py · notification.py · notification_preference.py
repositories/__init__.py · notification_repository.py
serializers/__init__.py · notification_list_serializer.py · notification_preferences_serializer.py
services/__init__.py · notification_service.py
strategies/__init__.py · email_strategy.py · in_app_strategy.py · websocket_strategy.py
templates/email/base_email.html · password_reset.html · status_changed.html · ticket_assigned.html · ticket_created.html
views/__init__.py · notification_views.py
migrations/__init__.py · 0001_initial.py
tests/__init__.py · test_notification_service.py · test_strategies.py
```

### Backend — `backend/apps/realtime/` (todos)
```
__init__.py · admin.py · apps.py · models.py · tests.py · views.py
consumers/__init__.py · notification_consumer.py · ticket_consumer.py
events/__init__.py · ticket_events.py
migrations/__init__.py
```

### Frontend — `frontend/src/modules/notifications/` (todos) + WS client
```
components/NotificationBell/index.tsx · NotificationBell.test.tsx
components/NotificationItem/index.tsx · NotificationPanel/index.tsx · NotificationPreferences/index.tsx
hooks/useNotifications.tsx · useNotifications.test.tsx
interfaces/INotificationService.ts · INotificationStrategy.ts · types.ts
pages/NotificationsPage.tsx
services/NotificationService.ts
frontend/src/infrastructure/websocket/SocketClient.ts
```

---

## 4) JAHIR CAJAS — Catalog + Sitio público + UI kit

**Ramas:** `feat/ui-kit` (Fase 1) · `feat/catalog` · `feat/public-site`

### Backend — `backend/apps/catalog/` (todos)
```
__init__.py · admin.py · apps.py · urls.py
interfaces/__init__.py · i_catalog_admin_view.py · i_catalog_client_view.py · i_catalog_service.py
models/__init__.py · service.py
repositories/__init__.py · service_repository.py
serializers/__init__.py · service_serializers.py
services/__init__.py · catalog_service.py
views/__init__.py · catalog_views.py
migrations/__init__.py · 0001_initial.py · 0002_service_imagen_url.py
tests/__init__.py
```

### Frontend — `frontend/src/modules/catalog/` (todos)
```
components/CatalogAdminPanel.tsx
components/CatalogPage/.gitkeep · index.tsx
components/ServiceCard/.gitkeep · index.tsx
components/ServiceFilter/.gitkeep · index.tsx
hooks/.gitkeep · useCatalog.tsx
interfaces/ICatalogAdminView.ts · ICatalogClientView.ts · ICatalogService.ts
repositories/.gitkeep
services/.gitkeep · CatalogService.ts
```

### Frontend — `frontend/src/modules/public/` (todos)
```
pages/About.tsx · Clients.tsx · Gallery.tsx · Home.tsx · Services.tsx
```

### Frontend — UI kit (`frontend/src/core/ui/`) + estilos + assets
```
core/ui/index.ts · utils.ts · ImageWithFallback.tsx
core/ui/alert-dialog.tsx · alert.tsx · avatar.tsx · badge.tsx · button.tsx · card.tsx · dialog.tsx · dropdown-menu.tsx · input.tsx · label.tsx · select.tsx · separator.tsx · skeleton.tsx · sonner.tsx · switch.tsx · table.tsx · tabs.tsx · textarea.tsx · tooltip.tsx
core/ui/layout/Footer.tsx · Navbar.tsx
core/ui/Badge/.gitkeep · Button/.gitkeep · DashboardLayout/.gitkeep · Modal/.gitkeep
frontend/src/index.css
frontend/public/favicon.svg · icons.svg
frontend/src/assets/hero.png · react.svg · vite.svg
```

---

## 5) JAIRO RODRÍGUEZ — Reports + Dashboards + DevOps

**Ramas:** `feat/reports` · `feat/dashboards` · `feat/devops` (+ Fase 0 bootstrap)

### Backend — `backend/apps/reports/` (todos) + ExporterFactory
```
__init__.py · admin.py · apps.py · urls.py · models.py · tests.py · views.py
exporters/__init__.py · csv_exporter.py · excel_exporter.py · pdf_exporter.py
interfaces/__init__.py · i_report_exporter.py
repositories/__init__.py · report_repository.py
services/__init__.py · report_service.py
views/__init__.py · report_views.py
migrations/__init__.py
tests/__init__.py · test_exporters.py
backend/core/factories/exporter_factory.py
```

### Frontend — `frontend/src/modules/reports/` + `dashboard/` (todos)
```
reports/components/ExportButton/index.tsx · ReportsDashboard/index.tsx
reports/hooks/useReports.tsx · interfaces/IReportsService.ts · services/ReportsService.ts
dashboard/AdminDashboard.tsx · ClientDashboard.tsx · TicketsPanel.tsx · WorkerDashboard.tsx
```

### DevOps / Infra (incluye bootstrap del repo y configuración del entorno)
```
.gitignore · .github/workflows/ci.yml · Jenkinsfile · DEPLOYMENT.md · nginx.conf
docker-compose.yml · docker-compose.prod.yml · sassblum.code-workspace · sonar-project.properties
.vscode/c_cpp_properties.json · .vscode/launch.json
backend/.dockerignore · .env.example · .flake8 · Dockerfile · pytest.ini · requirements.txt · requirements-dev.txt
frontend/.dockerignore · .env.example · .env.production · .gitignore · Dockerfile · eslint.config.js · nginx.conf · package.json · package-lock.json · tsconfig.json · tsconfig.app.json · tsconfig.node.json · vite.config.ts · vitest.config.ts
frontend/src/test/setup.ts
```

---

## Checklist SOLID por archivo (correr ANTES de cada commit)

- [ ] **SRP** — ¿el archivo tiene una sola responsabilidad? (model≠service≠serializer≠view; 1 serializer/operación; 1 validador/regla).
- [ ] **OCP** — ¿agregar una variante (estrategia/exporter/validador/estado) requeriría modificar este archivo? Si sí, rediseñar.
- [ ] **LSP** — ¿la clase concreta es intercambiable con su interfaz?
- [ ] **ISP** — ¿la interfaz expone métodos que algún cliente no usa? Si sí, segregar.
- [ ] **DIP** — vistas/servicios importan **interfaces**, nunca clases concretas. (BE: `from apps.x.interfaces import IX`; FE: `import type { IX }`).
- [ ] **FE extra** — interfaces con prefijo `I`; JWT **nunca** en `localStorage` (solo en memoria vía `useAuth`).

---

## Verificación

**Por lote, antes de cada PR (el dueño corre solo lo suyo):**

```bash
# Backend
cd backend && python manage.py check && pytest apps/<modulo>/tests/ -v
# Frontend
cd frontend && npx tsc --noEmit && npm run lint
```

**Integración final (Juan, tras todos los merges):**

```bash
cd backend && python manage.py check && pytest
cd frontend && npx tsc --noEmit && npm run build
```

- `npm run build` puede fallar por errores PREEXISTENTES (REFACTOR_HANDOFF §6.8): vars sin usar en
  stubs de validators + tests sin `@testing-library/react`. Arreglo: prefijar `_` o excluir `*.test.tsx`
  del tsconfig de build. `tsc --noEmit` y `npm run dev` pasan limpio.
- **Smoke E2E** (REFACTOR_HANDOFF §7): registro → login → catálogo → crear ticket → Observer
  (email+in-app+WS) → admin asigna → worker cambia estado → historial → reportes/exportar.
- **CI:** confirmar `.github/workflows/ci.yml` en verde en el repo nuevo (con secrets re-creados).
```

### 📄 REPORTE_AUDITORIA.md
```
# 🔍 Reporte de Auditoría — SassBlum Ticket Management

**Fecha:** 2026-06-28 · **Auditor:** Code Review Master (Claude)
**Stack:** Django 6 + DRF + Channels (backend) · React 19 + TS + Vite + Tailwind (frontend) · Supabase/PostgreSQL
**Alcance:** `backend/apps/*`, `backend/core/*`, `backend/config/*`, `frontend/src/*`
**Herramientas:** revisión manual + `flake8 7.3.0` + `pylint 4.0.6` + `tsc --noEmit`

> ⚠️ **Limitación de verificación:** el `venv` del backend **no tiene Django instalado**, por lo que
> `manage.py check`, las migraciones y `pytest` **no se pudieron ejecutar**. Los hallazgos que dependen
> del runtime (settings de producción, headers, cobertura de tests) se marcan **"No verificable"**.

---

## 1. Resumen ejecutivo

| # | Estándar | Puntuación | Estado |
|---|----------|-----------:|--------|
| 1 | ISO/IEC 25010 — Calidad | **84/100** | ✅ Cumple |
| 2 | OWASP Top 10 2025 — Seguridad | **77/100** | ⚠️ Parcial |
| 3 | WCAG 2.1 AA — Accesibilidad | **76/100** | ⚠️ Parcial |
| 4 | SOLID + Clean Architecture | **93/100** | ✅ Cumple (sobresaliente) |
| 5 | REST API Standards | **70/100** | ⚠️ Parcial |
| 6 | 12-Factor App — Operabilidad | **75/100** | ⚠️ Parcial |
| 7 | CWE/SANS Top 25 — Debilidades | **80/100** | ✅ Cumple |
| | **TOTAL** | **555/700** | **Calificación: C** |

**¿Listo para producción?** → **CON CONDICIONES.**
La **arquitectura es excelente** (clase A en SOLID/patrones). Lo que falta para producción no es
de diseño sino de **endurecimiento operacional y verificación**: confirmar settings de producción
(`DEBUG=False`, CORS, headers), rate-limiting de auth, almacenamiento real de archivos con validación,
versionado de API y ejecutar la suite de tests + `migrate` en un entorno con dependencias instaladas.

### Top 5 brechas críticas
1. **No verificable: settings de producción** (`DEBUG`, `ALLOWED_HOSTS`, CORS, headers de seguridad) — riesgo de exposición de info (CWE-200) si `DEBUG=True`.
2. **Sin rate-limiting** en `/api/auth/login` y `/api/auth/forgot-password` — fuerza bruta / timing de enumeración (OWASP A07).
3. **Carga de imágenes (catálogo/galería) sin validación de tipo/tamaño en servidor** cuando se conecte almacenamiento real — CWE-434 (hoy `StorageService` es stub).
4. **API sin versionado** (`/api/...` en vez de `/api/v1/...`) ni documentación OpenAPI/Swagger.
5. **Observabilidad mínima** — logging básico, sin métricas ni logs estructurados (12-Factor XI).

---

## 2. Evaluación por estándar

### 1) ISO/IEC 25010 — 84/100
| Subcriterio | Pts | Notas |
|---|---:|---|
| Funcionalidad | 18/20 | MVP end-to-end (auth→catálogo→ticket→asignación→notificaciones→reportes). |
| Fiabilidad | 15/20 | Bloqueo tras 5 intentos; `dispatch()` aísla fallo por canal. Falta retries/colas; `StorageService` es stub. |
| Eficiencia | 16/20 | `select_related/prefetch` en `ticket_repository.py`, paginación, code-splitting (`lazy` en App.tsx), animaciones por RAF/transform. `ThreeBackground` (canvas) es pesado en equipos modestos. |
| Usabilidad | 17/20 | Autocompletado de RUC, toasts, foco visible, contraste corregido. |
| Mantenibilidad | 18/20 | SOLID estricto; flake8 limpio (salvo E402 intencional); pylint ~7–8/10. |

### 2) OWASP Top 10 2025 — 77/100
| Subcriterio | Pts | Notas |
|---|---:|---|
| Control de acceso | 17/20 | RBAC ISP (`core/permissions/rbac_permissions.py`), `ProtectedRoute` por rol, reportes `IsAdmin`, ACL por rol en `ticket_repository.py`. |
| Cripto/secretos | 15/20 | **JWT solo en memoria** (no localStorage) ✅; tokens firmados (`django.core.signing`); secretos por env. *No verificable:* que `.env` no esté commiteado y HTTPS/HSTS en prod. |
| Validación/inyección | 16/20 | Serializers DRF + ORM parametrizado (sin SQL crudo). Validación de archivos débil del lado servidor (ver brecha #3). |
| Config de seguridad | 13/20 | CORS/ALLOWED_HOSTS por env. **No verificable:** headers (HSTS, X-Frame-Options, CSP), `SECURE_*`. Sin rate-limiting. |
| Auth/sesión | 16/20 | Lockout, blacklist de refresh, sin enumeración en forgot-password, **restricción de dominio `@sassblum.com`** para staff. Sin rate-limit ni 2FA. |

### 3) WCAG 2.1 AA — 76/100
| Subcriterio | Pts | Notas |
|---|---:|---|
| Perceptible | 15/20 | `alt` vía `ImageWithFallback`; contraste de cuerpo corregido en Home (#7aa3b8 ≥4.5:1). Falta auditar contraste en todas las páginas. |
| Operable | 14/20 | Foco visible añadido en Home; navegación por teclado (Radix). **Desviación consciente:** `prefers-reduced-motion` deshabilitado por decisión del usuario (WCAG 2.3.3) y `cursor:none` global — documentar/ofrecer opt-out. |
| Comprensible | 16/20 | Labels asociados, mensajes de error claros, flujo predecible. |
| Robusto | 15/20 | `aria-label` en botones de ícono, HTML semántico, diálogos accesibles (Radix). |
| Responsive | 16/20 | Grids responsive (catálogo 2/3/4 col, dashboards). |

### 4) SOLID + Clean Architecture — 93/100 ⭐
| Subcriterio | Pts | Notas |
|---|---:|---|
| SRP | 19/20 | model ≠ repository ≠ service ≠ serializer ≠ view en todas las apps; 1 serializer por operación. |
| OCP + LSP | 18/20 | `ValidatorFactory`, `ExporterFactory`, `NotificationFactory`, `TRANSITIONS`, strategies — extensibles sin modificar. |
| ISP + DIP | 19/20 | `ITicketClient/Worker/Admin`, `ICatalogClient/Admin`, `IUserAdminActions`; vistas dependen de interfaces vía `get_*_service()`; FE vía Context. |
| Separación de capas | 18/20 | `apps.notifications`/`apps.realtime` nunca importan `apps.tickets` (payload por señal). |
| Patrones | 19/20 | Repository, Factory, Strategy, Observer (signals), Singleton, Chain of Responsibility, State Machine — todos correctamente aplicados. |

*Mejora menor:* la app `gallery` (nueva) usa una clase concreta `GalleryService` sin ABC de interfaz como sí hace `catalog`. Aceptable; para consistencia podría añadirse `IGalleryService`.

### 5) REST API Standards — 70/100
| Subcriterio | Pts | Notas |
|---|---:|---|
| Métodos HTTP | 16/20 | GET/POST/PATCH correctos. `toggle` vía `?action=toggle` en PATCH — funciona, pero un sub-recurso sería más idiomático. |
| Códigos de estado | 16/20 | 201/200/404/400 usados; `raise_exception=True` da 400 con detalle. |
| Versionado/negociación | 10/20 | **Sin `/v1/`**; sin negociación de contenido. |
| Paginación/filtrado | 16/20 | Historial paginado + filtros; reportes con filtros múltiples. |
| Documentación/contratos | 12/20 | Sin OpenAPI/Swagger (`drf-spectacular`). Contratos documentados solo en código. |

*Nota (D21):* endpoints de colección con slash final y de detalle sin slash — frágil; documentar o normalizar con `APPEND_SLASH`.

### 6) 12-Factor App — 75/100
| Subcriterio | Pts | Notas |
|---|---:|---|
| Config en env | 17/20 | Settings desde env (`DATABASE_URL`, `REDIS_URL`, EMAIL_*, JWT_*). |
| Dependencias | 16/20 | `requirements.txt`; sin lockfile con hashes (`pip-tools`/`poetry`). |
| Backing services | 15/20 | DB/Redis/SMTP como recursos; almacenamiento (Supabase) aún stub. |
| Procesos stateless | 16/20 | JWT stateless; Channels para WS. |
| Observabilidad | 11/20 | Logging básico (`logger` en `auth_service.py`), `/health`. Sin métricas, sin logs estructurados, sin tracing. |

### 7) CWE/SANS Top 25 — 80/100
| Subcriterio | Pts | Notas |
|---|---:|---|
| Sin inyección | 17/20 | ORM + serializers; sin `raw()`/`eval`. |
| Broken access control | 16/20 | RBAC + ACL por rol en repos; verificar object-level en todos los detalle. |
| Memory/safety | 18/20 | Mayormente N/A (Python gestionado). |
| Cryptographic failures | 15/20 | Hashing Django, tokens firmados. *No verificable:* TLS/HSTS en prod. |
| Information exposure | 14/20 | Sin enumeración de usuarios. **Riesgo si `DEBUG=True`** (CWE-200/-209): stack traces. Revisar que logs no filtren secretos. |

---

## 3. Resultados de linters

### flake8 (config del proyecto: `max-line-length=100`)
Tras correcciones aplicadas en esta auditoría, **solo quedan 4 avisos `E402`** (intencionales):
```
apps/authentication/services/auth_service.py:219  E402  import threading (antes del singleton)
apps/authentication/services/user_admin_service.py:71  E402
apps/catalog/services/catalog_service.py:108  E402
apps/reports/services/report_service.py:37  E402
```
Patrón deliberado (import junto al accesor Singleton). **Fix opcional:** mover `import threading` al tope del archivo (ya aplicado en `apps/gallery/services/gallery_service.py`, que queda **flake8-limpio**).

**Corregido en esta auditoría:**
- `apps/tickets/validators/business_rule_validator.py:13` — `F401` import `datetime` sin uso → **eliminado**.
- `apps/authentication/admin.py:10` — `W292` sin newline final → **corregido**.

### pylint (4.0.6)
- **Errores reales (`--errors-only`, excluyendo `import-error` por deps no instaladas): 0** en código nuevo/editado.
- `apps/gallery` puntúa **7.18/10** — solo convenciones (`missing-docstring`, `unused-argument 'request'` propio de DRF), consistente con el resto del repo.
- *Nota:* sin Django instalado, pylint reporta `E0401 import-error` masivos (falsos positivos); se ejecutó con `--disable=E0401,E0611`.

### tsc --noEmit (frontend)
- **0 errores.** Verificado tras todos los cambios de esta sesión.

---

## 4. Top 10 mejoras prioritarias

| # | Prioridad | Mejora | Esfuerzo |
|---|---|---|---|
| 1 | 🔴 Alta | Confirmar/forzar `DEBUG=False` + `SECURE_*` headers (HSTS, SSL redirect, secure cookies) en `config/settings.py` para prod. | S |
| 2 | 🔴 Alta | Rate-limiting en auth (DRF throttling `ScopedRateThrottle` en login/forgot/register). | S |
| 3 | 🔴 Alta | Validación servidor de imágenes (MIME real + tamaño) en `ServiceAdminView`/`ProjectAdminView` antes de subir. | M |
| 4 | 🟠 Media | Ejecutar `pip install -r requirements.txt` + `migrate` (auth `0003_user_ruc`, gallery `0001`) + `manage.py check` + `pytest`. | S |
| 5 | 🟠 Media | Versionar API (`/api/v1/`) + `drf-spectacular` para OpenAPI/Swagger. | M |
| 6 | 🟠 Media | Tests para lo nuevo: app `gallery`, campo RUC, restricción de dominio. | M |
| 7 | 🟡 Baja | Observabilidad: logging estructurado (JSON) + Sentry/métricas. | M |
| 8 | 🟡 Baja | Reemplazar `StorageService` stub por Supabase Storage real (solo esa clase, D29). | M |
| 9 | 🟡 Baja | Accesibilidad: opt-out de animaciones (respetar `prefers-reduced-motion` con toggle) y revisar contraste en todas las páginas. | M |
| 10 | 🟡 Baja | Mover `import threading` al tope en los 4 servicios restantes (flake8 100% limpio). | S |

---

## 5. Plan de corrección priorizado

**Sprint de endurecimiento (estimado ~3–5 días):**
1. **Día 1 — Runtime + seguridad base:** instalar deps, `migrate`, `check`, `pytest`; settings de producción + throttling. (#1, #2, #4)
2. **Día 2 — Uploads + API:** validación de imágenes; versionado + OpenAPI. (#3, #5)
3. **Día 3 — Tests + observabilidad:** tests de gallery/RUC/dominio; logging estructurado. (#6, #7)
4. **Buffer — Storage real + a11y + limpieza linters.** (#8, #9, #10)

---

## 6. Certificación de aptitud para producción

> **VEREDICTO: APTO CON CONDICIONES.**
>
> El proyecto tiene una **base arquitectónica de calidad A** (SOLID 93/100), seguridad de sesión
> sólida (JWT en memoria, lockout, sin enumeración, dominio de staff restringido) y código limpio
> (flake8/pylint/tsc sin errores reales). **No debe ir a producción** hasta cerrar las condiciones
> rojas: (1) settings de producción endurecidos, (2) rate-limiting de auth, (3) validación de uploads,
> y (4) ejecutar migraciones + `check` + tests en un entorno con dependencias instaladas
> (hoy **no verificable** porque el `venv` carece de Django).
>
> Cerradas esas 4 condiciones, el proyecto sube a banda **B (≈600/700)** y es apto para producción.
```

### 📄 REPORTE_AUDITORIA_TOTAL.md
```
# 📋 REPORTE DE AUDITORÍA TOTAL — SassBlum

> **Fecha:** 2026-06-25
> **Alcance:** 396 archivos · 16,451 líneas · Backend Django 6 + Frontend React 19
> **Metodología:** Semi-formal Reasoning (Meta Research, arXiv:2603.01896)
> **Auditores:** Equipo de auditoría de software senior (automatizado)

---

## 1. RESUMEN EJECUTIVO

### Puntuación Global: **387 / 500** (77.4%)

| Fase | Puntuación | Porcentaje |
|------|-----------|------------|
| **FASE 1 — Arquitectura** | 82 / 100 | 82% |
| **FASE 2 — Frontend** | 75 / 100 | 75% |
| **FASE 3 — Backend** | 84 / 100 | 84% |
| **FASE 4 — Integración** | 146 / 200 | 73% |
| **TOTAL** | **387 / 500** | **77.4%** |

### Diagnóstico General

SassBlum es un proyecto **bien diseñado arquitectónicamente** con aplicación consistente de SOLID, patrones Repository/Factory/Strategy/Observer/Chain of Responsibility, y separación clara Backend ↔ Frontend. El código es legible, documentado y sigue convenciones. Las principales áreas de mejora son: **tests de cobertura insuficiente**, **ausencia de rate limiting**, **falta de paginación real en listados**, y **accesibilidad WCAG incompleta**.

### Fortalezas Principales
- ✅ Arquitectura SOLID aplicada consistentemente en 100% de los módulos
- ✅ DIP implementado correctamente: interfaces como contratos, inyección en App.tsx
- ✅ ISP puro: 3 interfaces por rol (Client/Worker/Admin) en tickets y catálogo
- ✅ Observer pattern bien implementado: post_save → 2 suscriptores independientes
- ✅ JWT en memoria (nunca localStorage) — seguridad XSS correcta
- ✅ Design system coherente con tokens CSS + shadcn/Radix

### Debilidades Principales
- ❌ Tests de integración y E2E ausentes
- ❌ Rate limiting no implementado en endpoints públicos
- ❌ Sin paginación real (offset/limit) en la mayoría de listados
- ❌ Accesibilidad WCAG 2.1 AA incompleta (focus management, ARIA)
- ❌ Business hours validator en FE puede frustrar usuarios (UX)

---

## 2. PUNTUACIÓN DETALLADA POR MÓDULO

### FASE 1 — Arquitectura (/100)

| Criterio | Puntuación | Detalle |
|----------|-----------|---------|
| SOLID compliance (/20) | **18** | SRP, OCP, LSP, ISP, DIP aplicados consistentemente. Deducción: algunos servicios mezclan orquestación con serialización. |
| Clean Architecture (/20) | **17** | Interfaces → Services → Repositories → Views bien estratificado. Deducción: models.py vacíos en reports/realtime (stubs innecesarios). |
| Patrones de diseño (/20) | **19** | Repository, Factory, Strategy, Observer, Chain of Responsibility, Singleton correctamente implementados. |
| Consistencia de convenciones (/20) | **15** | Convenciones documentadas y seguidas. Deducción: inconsistencias menores (naming mixto en algunos archivos). |
| Documentación (/20) | **13** | CLAUDE.md exhaustivo, docstrings en ABCs. Deducción: falta JSDoc en componentes FE, guías de contribución. |

### FASE 2 — Frontend (/100)

| Criterio | Puntuación | Detalle |
|----------|-----------|---------|
| Performance y optimización (/20) | **14** | Sin React.memo, useMemo, useCallback selectivo. Bundle no analizado. Deducción: re-renders innecesarios probables. |
| Accesibilidad WCAG 2.1 AA (/20) | **12** | aria-label en badges, role="dialog" en paneles. Deducción: focus trap ausente, skip links faltantes, contraste no verificado. |
| Responsive design (/20) | **16** | Tailwind responsive breakpoints usados correctamente. Mobile nav implementado. Deducción: tablas sin scroll horizontal óptimo. |
| Calidad de animaciones (/20) | **17** | Framer Motion bien usado (fadeUp, whileInView). prefers-reduced-motion respetado. Deducción: algunas animaciones podrían ser más sutiles. |
| Calidad TypeScript (/20) | **16** | Interfaces bien tipadas, sin `any` explícito. Deducción: algunos `as` casts inseguros en mappers. |

### FASE 3 — Backend (/100)

| Criterio | Puntuación | Detalle |
|----------|-----------|---------|
| Seguridad OWASP (/20) | **15** | JWT seguro, CORS configurado, HTTPS enforcement. Deducción: sin rate limiting, sin Content-Security-Policy, logging de errores sensible. |
| API design RESTful (/20) | **16** | Endpoints bien estructurados, verbos HTTP correctos. Deducción: inconsistencias en trailing slashes, falta versioning. |
| Lógica de negocio (/20) | **19** | State machine robusta, validator chain limpia, observer desacoplado. Deducción: race condition potencial en generate_ticket_number. |
| Calidad de tests (/20) | **17** | Tests unitarios para state machine, validators, services con mocks. Deducción: sin tests de integración, cobertura no medida. |
| Performance (/20) | **17** | select_related/prefetch_related usado. Índices en modelos. Deducción: sin caching, queries N+1 posibles en serializers. |

### FASE 4 — Integración (/200)

| Criterio | Puntuación | Detalle |
|----------|-----------|---------|
| Frontend-Backend contract (/40) | **32** | Contratos de interfaz alineados (camelCase↔snake_case mapping). Deducción: sin contrato formal (OpenAPI). |
| WebSocket integration (/40) | **35** | WS autenticado via JWT, reconexión con backoff, Observer FE completo. Deducción: sin heartbeat/keepalive. |
| State management (/40) | **30** | Context + hooks como DIP seam. Deducción: sin Zustand stores (mencionado en CLAUDE.md pero no implementado), estado duplicado posible. |
| Error handling end-to-end (/40) | **28** | apiError() extrae mensajes, domain exceptions mapean a HTTP. Deducción: errores silenciados en Observer, sin retry en estrategias. |
| CI/CD y DevOps (/40) | **21** | Jenkinsfile + Docker + docker-compose + nginx configurado. Deducción: CI solo corre tests no-DB, sin staging environment, deploy manual. |

---

## 3. HALLAZGOS CON FORMATO SEMI-FORMAL

### HALLAZGO #1 — Race Condition en generate_ticket_number

- **PREMISA:** `generate_ticket_number` usa `count()` + 1 para generar el siguiente número de ticket.
- **EVIDENCIA:** `backend/apps/tickets/services/ticket_service.py` línea ~180:
  ```python
  def generate_ticket_number(self, year: int) -> str:
      count = Ticket.objects.filter(numero__startswith=f"T-{year}-").count()
      return f"T-{year}-{count + 1:04d}"
  ```
- **ANÁLISIS:** En concurrencia (dos requests simultáneos), ambos pueden obtener el mismo `count` y generar el mismo número. La restricción `unique=True` en el modelo causará un `IntegrityError`. No hay `select_for_update()` ni uso de una secuencia atómica.
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:**
  ```python
  from django.db import transaction, connection

  def generate_ticket_number(self, year: int) -> str:
      with transaction.atomic():
          # Lock the table row for this year's sequence
          with connection.cursor() as cursor:
              cursor.execute(
                  "SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 8) AS INTEGER)), 0) "
                  "FROM tickets_ticket WHERE numero LIKE %s FOR UPDATE",
                  [f"T-{year}-%"]
              )
              max_num = cursor.fetchone()[0]
          return f"T-{year}-{max_num + 1:04d}"
  ```

### HALLAZGO #2 — Rate Limiting Ausente en Endpoints Públicos

- **PREMISA:** Los endpoints `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` son `AllowAny` sin limitación de tasa.
- **EVIDENCIA:** `backend/apps/authentication/views/auth_views.py` — `RegisterView.permission_classes = [AllowAny]`, `LoginView.permission_classes = [AllowAny]`
- **ANÁLISIS:** Un atacante puede realizar fuerza bruta contra login (aunque hay bloqueo por intentos), flooding de registros, y abuso de forgot-password para spam de emails. OWASP A07:2021 (Identification and Authentication Failures).
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:**
  ```python
  # backend/config/settings.py
  INSTALLED_APPS += ['django_ratelimit']
  
  # En cada vista pública:
  from django_ratelimit.decorators import ratelimit
  
  class LoginView(APIView):
      @ratelimit(key='ip', rate='5/m', method='POST', block=True)
      def post(self, request):
          ...
  ```
  Alternativa más simple: usar DRF throttling:
  ```python
  REST_FRAMEWORK = {
      'DEFAULT_THROTTLE_CLASSES': [
          'rest_framework.throttling.AnonRateThrottle',
          'rest_framework.throttling.UserRateThrottle',
      ],
      'DEFAULT_THROTTLE_RATES': {
          'anon': '20/minute',
          'user': '100/minute',
      },
  }
  ```

### HALLAZGO #3 — Sin Paginación Real en Listados

- **PREMISA:** Los endpoints de listado devuelven todos los registros o usan paginación manual inconsistente.
- **EVIDENCIA:** `backend/apps/catalog/views/catalog_views.py` — `ServiceListView` devuelve `{"items": services, "total": len(services)}` sin paginación. `TicketRepository.get_all_for_user` pagina internamente pero `get_all` no.
- **ANÁLYSIS:** Con miles de tickets/servicios, las respuestas HTTP serán enormes. No hay cursor-based pagination ni limit/offset estándar DRF.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  from rest_framework.pagination import PageNumberPagination
  
  class StandardPagination(PageNumberPagination):
      page_size = 20
      page_size_query_param = 'page_size'
      max_page_size = 100
  
  # En settings.py:
  REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS'] = 'path.to.StandardPagination'
  ```

### HALLAZGO #4 — JWT Refresh Token Rotation sin Verificación de Usuario

- **PREMISA:** El interceptor de refresh en ApiClient.ts envía el refresh token sin verificar que pertenezca al usuario actual.
- **EVIDENCIA:** `frontend/src/infrastructure/http/ApiClient.ts` — `tryRefresh()` envía `{ refresh: this.refreshToken }` sin validar.
- **ANÁLISIS:** Si el refresh token es robado (XSS a pesar de no estar en localStorage, o acceso al objeto en memoria), puede usarse desde otra sesión. La rotación de simplejwt mitiga parcialmente, pero no hay binding al device/fingerprint.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Considerar refresh token rotation con device fingerprinting o usar httpOnly cookies para el refresh token (más seguro que en memoria).

### HALLAZGO #5 — Errores Silenciados en Observer Pattern

- **PREMISA:** Los handlers de señales capturan excepciones genéricas y las ignoran.
- **EVIDENCIA:** `backend/apps/tickets/apps.py` línea ~60:
  ```python
  try:
      get_notification_service().dispatch(event_payload)
  except ImportError:
      pass
  ```
  Y `backend/apps/realtime/apps.py`:
  ```python
  try:
      broadcast_ticket_updated(payload)
  except Exception:  # noqa: BLE001
      pass
  ```
- **ANÁLISIS:** Si `dispatch()` falla por un error de BD o de red, la excepción se traga silenciosamente. No hay logging, no hay retry, no hay dead-letter queue. En producción esto significa notificaciones perdidas sin trazabilidad.
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:**
  ```python
  import logging
  logger = logging.getLogger(__name__)
  
  @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_notify")
  def on_ticket_event_saved(sender, instance, created, **kwargs):
      if not created:
          return
      # ... serialización ...
      try:
          get_notification_service().dispatch(event_payload)
      except Exception:
          logger.exception(
              "Failed to dispatch notification for TicketEvent %s",
              instance.id,
          )
          # Opcional: enviar a Celery retry queue
  ```

### HALLAZGO #6 — Business Hours Validator Frustra Usuarios (UX)

- **PREMISA:** El `BusinessRuleValidator` en FE y BE rechaza tickets fuera de horario laboral (Lun-Vie 07:00-20:00).
- **EVIDENCIA:** `frontend/src/modules/tickets/validators/BusinessRuleValidator.ts`:
  ```typescript
  if (day === 0 || day === 6 || hour < 7 || hour >= 20)
    return { isValid: false, field: 'horario', errors: ['Solo puedes crear tickets en horario laboral...'] }
  ```
- **ANÁLISIS:** Esto es una regla de negocio cuestionable para un sistema de soporte. Los clientes necesitan reportar problemas 24/7. La regla debería permitir creación en cualquier momento y solo afectar tiempos de respuesta SLA.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Permitir creación 24/7 pero mostrar "Tu ticket será atendido en el próximo horario laboral" como informativo, no como bloqueo.

### HALLAZGO #7 — Sin Content-Security-Policy Header

- **PREMISA:** El backend no configura CSP headers.
- **EVIDENCIA:** `backend/config/settings.py` — No hay `CSP_*` settings ni middleware de CSP.
- **ANÁLISIS:** Sin CSP, un XSS podría cargar scripts arbitrarios. OWASP A03:2021 (Injection). Aunque el frontend es SPA y el riesgo es menor, CSP es defensa en profundidad.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  # settings.py
  MIDDLEWARE += ['csp.middleware.CSPMiddleware']
  CSP_DEFAULT_SRC = ("'self'",)
  CSP_SCRIPT_SRC = ("'self'",)
  CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
  CSP_IMG_SRC = ("'self'", "data:", "https://images.unsplash.com")
  ```

### HALLAZGO #8 — Focus Trap Ausente en Modales

- **PREMISA:** Los diálogos (AssignModal, NotificationPanel) no implementan focus trap.
- **EVIDENCIA:** `frontend/src/modules/tickets/components/AssignModal/index.tsx` — usa `role="dialog"` pero sin `aria-modal="true"` efectivo ni trap de foco. `NotificationPanel` — similar.
- **ANÁLISIS:** WCAG 2.1.2 (Keyboard) requiere que el foco quede contenido dentro del modal. Sin focus trap, usuarios de teclado pueden navegar fuera del diálogo mientras está abierto.
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:** Usar Radix UI Dialog (ya instalado) que maneja focus trap automáticamente:
  ```tsx
  import { Dialog, DialogContent, DialogTitle } from '../../../../core/ui/dialog'
  
  export function AssignModal({ ticketId, onClose, onAssigned }: AssignModalProps) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogTitle>Asignar ticket</DialogTitle>
          {/* contenido */}
        </DialogContent>
      </Dialog>
    )
  }
  ```

### HALLAZGO #9 — Sin Tests de Integración

- **PREMISA:** Solo existen tests unitarios (mock-based) para el backend.
- **EVIDENCIA:** `backend/apps/tickets/tests/test_ticket_lifecycle.py` — es el único test que usa `@pytest.mark.django_db` y prueba el flujo completo, pero mockea el BusinessRuleValidator. No hay tests de integración HTTP (DRF APIClient). No hay tests E2E (Cypress/Playwright).
- **ANÁLISIS:** Los tests unitarios con mocks no detectan problemas de integración (serialización incorrecta, permisos mal configurados en URLs, errores de middleware).
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:** Agregar tests de integración con DRF APIClient:
  ```python
  from rest_framework.test import APIClient
  
  @pytest.mark.django_db
  class TestTicketAPI:
      def test_create_ticket_as_client(self, client_user, service):
          api_client = APIClient()
          api_client.force_authenticate(user=client_user)
          response = api_client.post('/api/tickets/', {
              'asunto': 'Test', 'descripcion': 'Descripción larga',
              'servicio_id': service.id, 'prioridad': 'Media',
          })
          assert response.status_code == 201
          assert response.data['numero'].startswith('T-')
  ```

### HALLAZGO #10 — Singleton Services no Thread-Safe

- **PREMISA:** Los servicios singleton usan `global _instance` sin protección de concurrencia.
- **EVIDENCIA:** `backend/apps/tickets/services/ticket_service.py`:
  ```python
  _instance: TicketService | None = None
  
  def get_ticket_service() -> TicketService:
      global _instance
      if _instance is None:
          _instance = TicketService()
      return _instance
  ```
- **ANÁLISIS:** En un entorno ASGI (Daphne) con múltiples workers, dos hilos podrían crear instancias simultáneamente. Aunque el resultado es funcionalmente idéntico (no hay estado mutable compartido), es una violación del patrón Singleton.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Usar `threading.Lock` o el módulo `singleton-pattern`:
  ```python
  import threading
  
  _lock = threading.Lock()
  _instance: TicketService | None = None
  
  def get_ticket_service() -> TicketService:
      global _instance
      if _instance is None:
          with _lock:
              if _instance is None:
                  _instance = TicketService()
      return _instance
  ```

### HALLAZGO #11 — API Client no Maneja Timeout

- **PREMISA:** El ApiClient de Axios no configura timeout.
- **EVIDENCIA:** `frontend/src/infrastructure/http/ApiClient.ts`:
  ```typescript
  this.http = axios.create({
    baseURL: env.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    // sin timeout
  })
  ```
- **ANÁLISIS:** Si el backend no resuelve (cuelgue de BD, red), la petición quedará pendiente indefinidamente. El usuario verá un spinner infinito.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```typescript
  this.http = axios.create({
    baseURL: env.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000, // 15 segundos
  })
  ```

### HALLAZGO #12 — Duplicación de Tipos entre INotificationService.ts y types.ts

- **PREMISA:** Los tipos `Notification`, `NotificationPreferences`, `PaginatedNotifications` están definidos dos veces.
- **EVIDENCIA:** `frontend/src/modules/notifications/interfaces/INotificationService.ts` define `NotificationTipo`, `Notification`, `NotificationPreferences`, `PaginatedNotifications`. `frontend/src/modules/notifications/interfaces/types.ts` define los mismos tipos idénticamente.
- **ANÁLISIS:** Violación de DRY. Si se agrega un campo a `Notification`, debe actualizarse en dos archivos. Esto es propenso a bugs.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Mantener los tipos solo en `types.ts` y re-exportar desde `INotificationService.ts`:
  ```typescript
  // INotificationService.ts
  export type { Notification, NotificationPreferences, PaginatedNotifications, NotificationTipo } from './types'
  ```

### HALLAZGO #13 — Logging Insuficiente en Producción

- **PREMISA:** No hay configuración de logging en settings.py más allá del default de Django.
- **EVIDENCIA:** `backend/config/settings.py` — No hay `LOGGING = {...}` configuration.
- **ANÁLISIS:** En producción, los errores se perderán en stdout sin estructura. No hay forma de rastrear problemas de notificaciones fallidas, intentos de acceso no autorizados, o errores de BD.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  LOGGING = {
      'version': 1,
      'disable_existing_loggers': False,
      'formatters': {
          'verbose': {
              'format': '{levelname} {asctime} {module} {message}',
              'style': '{',
          },
      },
      'handlers': {
          'console': {
              'class': 'logging.StreamHandler',
              'formatter': 'verbose',
          },
      },
      'root': {
          'handlers': ['console'],
          'level': 'INFO',
      },
      'loggers': {
          'django': {'level': 'WARNING'},
          'apps': {'level': 'INFO'},
      },
  }
  ```

### HALLAZGO #14 — Frontend Build Falla por Errores Preexistentes

- **PREMISA:** `npm run build` falla por variables sin usar en stubs de validators y tests sin dependencias.
- **EVIDENCIA:** Documentado en `REFACTOR_HANDOFF.md` §6: "vars sin usar en stubs: validators/{BasicFieldValidator,FileValidator,BusinessRuleValidator,TicketValidatorChain}.ts"
- **ANÁLISIS:** El `tsc --noEmit` pasa limpio pero el build de producción (`tsc -b`) es más estricto. Esto bloquea el pipeline de CI/CD.
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:**
  ```typescript
  // En validators, prefijar vars no usadas:
  validate(_data: unknown): ValidationResult {
    // ...
  }
  // O en tsconfig.app.json agregar:
  // "noUnusedLocals": false (temporal hasta limpiar)
  ```

### HALLAZGO #15 — Sin CORS Preflight Cache

- **PREMISA:** CORS está configurado pero sin `CORS_PREFLIGHT_MAX_AGE`.
- **EVIDENCIA:** `backend/config/settings.py` — Solo `CORS_ALLOWED_ORIGINS`, sin `CORS_PREFLIGHT_MAX_AGE`.
- **ANÁLISIS:** Cada petición compleja (POST con JSON, multipart) genera un preflight OPTIONS. Sin cache, el navegador repite el preflight en cada request.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  CORS_PREFLIGHT_MAX_AGE = 86400  # 24 horas
  ```

### HALLAZGO #16 — User.update() no Usa update_fields

- **PREMISA:** `UserRepository.update()` llama a `objects.filter().update()` que actualiza todos los campos proporcionados.
- **EVIDENCIA:** `backend/apps/authentication/repositories/user_repository.py`:
  ```python
  def update(self, entity_id: int, data: dict) -> User:
      User.objects.filter(pk=entity_id).update(**data)
      return User.objects.get(pk=entity_id)
  ```
- **ANÁLISIS:** Si `data` contiene campos que no deberían modificarse (como `role` o `email`), se actualizan sin validación. Además, `User.objects.get()` puede lanzar `DoesNotExist` si el usuario fue borrado entre el `update` y el `get`.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  def update(self, entity_id: int, data: dict) -> User:
      ALLOWED_UPDATE_FIELDS = {'first_name', 'last_name', 'estado', 'intentos_fallidos', 
                                'bloqueado_hasta', 'email_verificado', 'role'}
      safe_data = {k: v for k, v in data.items() if k in ALLOWED_UPDATE_FIELDS}
      User.objects.filter(pk=entity_id).update(**safe_data)
      return self.get_by_id(entity_id)  # Usa el método que retorna None en vez de DoesNotExist
  ```

### HALLAZGO #17 — StorageService no Valida Tipo de Archivo en Backend

- **PREMISA:** La validación de MIME type ocurre solo en el FE (FileValidator) y no se repite en el BE al recibir el archivo.
- **EVIDENCIA:** `backend/apps/tickets/services/storage_service.py` — `upload()` acepta cualquier archivo sin validar MIME. `backend/apps/tickets/validators/file_validator.py` — valida en la cadena, pero `StorageService.upload()` se llama después de la validación.
- **ANÁLISIS:** Un atacante puede saltar la validación FE enviando directamente a la API. El FileValidator en BE sí valida, pero solo para tickets (no para catálogo).
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Agregar validación de MIME en `StorageService.upload()` o en el view que procesa el archivo.

### HALLAZGO #18 — get_catalog_service() Crea StorageService Siempre

- **PREMISA:** El singleton de `CatalogService` crea un `StorageService` en cada reinicio.
- **EVIDENCIA:** `backend/apps/catalog/services/catalog_service.py`:
  ```python
  def get_catalog_service() -> CatalogService:
      global _instance
      if _instance is None:
          from apps.tickets.services.storage_service import StorageService
          _instance = CatalogService(storage=StorageService())
      return _instance
  ```
- **ANÁLISIS:** `StorageService` lee settings en `__init__`. Si las settings cambian después del primer acceso, el servicio de storage no se actualiza. Aceptable para producción pero puede causar confusión en desarrollo.
- **CONCLUSIÓN:** ✅ Correcto (con nota)
- **RECOMENDACIÓN:** Documentar que el singleton se crea una vez y que cambios de env requieren restart.

### HALLAZGO #19 — TicketHistoryView Retorna Eventos de Otro Usuario

- **PREMISA:** `TicketRepository.get_history()` filtra por `_user_can_see` pero la vista no filtra los eventos por permisos adicionales.
- **EVIDENCIA:** `backend/apps/tickets/repositories/ticket_repository.py`:
  ```python
  def get_history(self, ticket_id, user):
      ticket = self.get_by_id(ticket_id)
      if ticket is None or not self._user_can_see(ticket, user):
          return None
      return list(TicketEvent.objects.select_related("autor").filter(ticket_id=ticket_id)...)
  ```
- **ANÁLISIS:** Un worker asignado puede ver eventos de otros workers que estuvieron asignados previamente. Esto es comportamiento esperado para historial de auditoría, pero podría exponer nombres de otros trabajadores.
- **CONCLUSIÓN:** ✅ Correcto (comportamiento de auditoría aceptable)

### HALLAZGO #20 — NotificationBell No Cierra al Hacer Click Fuera

- **PREMISA:** El panel de notificaciones se abre con un toggle pero no se cierra al hacer click fuera.
- **EVIDENCIA:** `frontend/src/modules/notifications/components/NotificationBell/index.tsx`:
  ```tsx
  <button onClick={() => setOpen((o) => !o)}>
  {open && <NotificationPanel onClose={() => setOpen(false)} />}
  ```
- **ANÁLISIS:** No hay `useEffect` con listener de `mousedown` para detectar clicks fuera del panel. El usuario debe hacer click en el botón "Cerrar" o en la campana nuevamente.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```tsx
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-notification-panel]'))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  ```

### HALLAZGO #21 — useNotifications Carga Todos los Datos en Mount

- **PREMISA:** El hook `useNotifications` hace fetch de todas las notificaciones al montarse.
- **EVIDENCIA:** `frontend/src/modules/notifications/hooks/useNotifications.tsx`:
  ```tsx
  useEffect(() => { void refresh() }, [refresh])
  ```
- **ANÁLISIS:** Cada vez que el usuario navega a una página con `NotificationProvider`, se dispara una petición HTTP. Con múltiples navegaciones, esto genera tráfico innecesario.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Usar stale-while-revalidate o cachear las notificaciones en un store global (Zustand).

### HALLAZGO #22 — Email Templates No Sanitizan Input del Usuario

- **PREMISA:** Las plantillas de email usan variables del contexto directamente en el HTML.
- **EVIDENCIA:** `backend/apps/notifications/templates/email/status_changed.html`:
  ```html
  <td>{{ ticket_asunto }}</td>
  <p>{{ comentario }}</p>
  ```
- **ANÁLISIS:** Django templates escapan HTML por defecto (`autoescape on`), así que esto es seguro contra XSS. Sin embargo, si algún template usa `|safe`, habría vulnerabilidad.
- **CONCLUSIÓN:** ✅ Correcto (Django autoescape protege)

### HALLAZGO #23 — Jenkinsfile Usa `bat` (Windows-Only)

- **PREMISA:** El Jenkinsfile usa comandos `bat` que solo funcionan en Windows.
- **EVIDENCIA:** `Jenkinsfile` — Todos los stages usan `bat '...'` en vez de `sh '...'`.
- **ANÁLISIS:** Si el Jenkins agent corre en Linux (común en CI/CD), el pipeline fallará. Los comandos `bat` son para Windows batch files.
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:** Usar `sh` para Linux o detectar el OS:
  ```groovy
  stage('Backend Tests') {
      steps {
          dir('backend') {
              sh '''
                  python -m venv .venv-ci
                  source .venv-ci/bin/activate
                  pip install -r requirements-dev.txt
                  python manage.py check
                  pytest -v -m "not django_db"
              '''
          }
      }
  }
  ```

### HALLAZGO #24 — Sin Backup Automatizado de BD

- **PREMISA:** El deployment guide menciona `pg_dump` manual pero no hay automatización.
- **EVIDENCIA:** `DEPLOYMENT.md` — "Backup Database" sección con comando manual.
- **ANÁLISIS:** Sin backups automatizados, un error humano o ataque puede causar pérdida de datos permanente.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Configurar cron job o Supabase automated backups + alertas.

### HALLAZGO #25 — Sin Health Check Endpoint en la API

- **PREMISA:** Los health checks de Docker usan `socket.create_connection` pero no hay endpoint HTTP.
- **EVIDENCIA:** `backend/Dockerfile`:
  ```dockerfile
  HEALTHCHECK CMD python -c "import socket, os; socket.create_connection(('localhost', int(os.environ.get('PORT', 8000))), timeout=5)"
  ```
- **ANÁLISIS:** Un health check de socket verifica que el puerto está abierto pero no que la app responde correctamente (BD conectada, Redis disponible, etc.).
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  # backend/apps/authentication/views/health_views.py
  from django.http import JsonResponse
  
  def health_check(request):
      checks = {}
      try:
          from django.db import connection
          with connection.cursor() as c:
              c.execute("SELECT 1")
          checks['database'] = 'ok'
      except Exception:
          checks['database'] = 'error'
      status = 200 if all(v == 'ok' for v in checks.values()) else 503
      return JsonResponse({'status': 'healthy' if status == 200 else 'unhealthy', **checks}, status=status)
  ```

### HALLAZGO #26 — TicketStatusBadge Test Usa Clases CSS que Pueden Cambiar

- **PREMISA:** Los tests del badge verifican clases CSS específicas.
- **EVIDENCIA:** `frontend/src/modules/tickets/components/TicketStatusBadge/TicketStatusBadge.test.tsx`:
  ```typescript
  expect(badge).toHaveClass('bg-blue-100')
  expect(badge).toHaveClass('text-blue-800')
  ```
  Pero el componente actual usa `bg-blue-50` y `text-blue-700`.
- **ANÁLISIS:** Los tests están desactualizados respecto al componente. Esto indica que los tests no se corren regularmente (o el build falla antes).
- **CONCLUSIÓN:** ❌ Problemático
- **RECOMENDACIÓN:** Actualizar los tests para coincidir con las clases actuales o usar `data-testid` en vez de clases CSS para selección.

### HALLAZGO #27 — CatalogAdminPanel No Usa Interfaces DIP

- **PREMISA:** `CatalogAdminPanel` importa `apiClient` directamente en vez de usar un hook con interfaz.
- **EVIDENCIA:** `frontend/src/modules/catalog/components/CatalogAdminPanel.tsx`:
  ```typescript
  import { apiClient } from '../../../infrastructure/http/ApiClient'
  // ...
  const data = await apiClient.get<{ items: BeService[] }>('/servicios/')
  ```
- **ANÁLISIS:** Viola DIP — el componente depende directamente del cliente HTTP concreto en vez de una interfaz `ICatalogAdminView`. Esto dificulta el testing y el cambio de infraestructura.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:** Crear un hook `useCatalogAdmin()` que use `ICatalogAdminView` via Context, igual que `useCatalog` usa `ICatalogClientView`.

### HALLAZGO #28 — admin.py Vacíos en Todos los Módulos

- **PREMISA:** Todos los archivos `admin.py` están vacíos (solo el comment "Register your models here").
- **EVIDENCIA:** `backend/apps/authentication/admin.py`, `backend/apps/catalog/admin.py`, `backend/apps/tickets/admin.py`, etc.
- **ANÁLISIS:** Sin registro de modelos en Django Admin, el equipo no puede usar el panel de administración para debugging o gestión manual. Esto reduce la operabilidad en producción.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```python
  # backend/apps/tickets/admin.py
  from django.contrib import admin
  from .models import Ticket, TicketEvent, Attachment
  
  @admin.register(Ticket)
  class TicketAdmin(admin.ModelAdmin):
      list_display = ('numero', 'asunto', 'estado', 'prioridad', 'cliente', 'asignado', 'created_at')
      list_filter = ('estado', 'prioridad')
      search_fields = ('numero', 'asunto')
  ```

### HALLAZGO #29 — Sin Índices en Tablas de Auditoría

- **PREMISA:** `Notification` tiene un partial index pero `TicketEvent` podría beneficiarse de más índices.
- **EVIDENCIA:** `backend/apps/tickets/models/ticket_event.py` — índices: `(ticket, created_at)` y `(ticket, tipo_evento)`.
- **ANÁLISIS:** Los índices actuales son adecuados para las queries existentes. Sin embargo, no hay índice para queries por `autor` (útil para auditoría de actividad de un usuario).
- **CONCLUSIÓN:** ✅ Correcto (índices suficientes para el uso actual)

### HALLAZGO #30 — Frontend No Tiene Error Boundary

- **PREMISA:** No hay React Error Boundaries en la aplicación.
- **EVIDENCIA:** `frontend/src/App.tsx` — No hay `<ErrorBoundary>` wrapping las rutas.
- **ANÁLISIS:** Si un componente lanza un error de render, toda la app se rompe (página blanca). Un Error Boundary captura el error y muestra un fallback UI.
- **CONCLUSIÓN:** ⚠️ Mejorable
- **RECOMENDACIÓN:**
  ```tsx
  // frontend/src/core/ui/ErrorBoundary.tsx
  import { Component, type ReactNode } from 'react'
  
  export class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
    state = { hasError: false }
    static getDerivedStateFromError() { return { hasError: true } }
    render() {
      if (this.state.hasError) return <div className="p-8 text-center"><h2>Algo salió mal</h2><button onClick={() => this.setState({hasError: false})}>Reintentar</button></div>
      return this.props.children
    }
  }
  
  // En App.tsx:
  <ErrorBoundary><SiteLayout /></ErrorBoundary>
  ```

---

## 4. TOP 10 MEJORAS PRIORITARIAS CON CÓDIGO

### 1. 🔴 Rate Limiting en Endpoints Públicos
```python
# backend/config/settings.py
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
    'rest_framework.throttling.AnonRateThrottle',
]
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '30/minute',
}
```

### 2. 🔴 Fix Race Condition en generate_ticket_number
```python
# backend/apps/tickets/services/ticket_service.py
from django.db import connection, transaction

def generate_ticket_number(self, year: int) -> str:
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 8) AS INTEGER)), 0) "
                "FROM tickets_ticket WHERE numero LIKE %s FOR UPDATE",
                [f"T-{year}-%"]
            )
            max_num = cursor.fetchone()[0]
        return f"T-{year}-{max_num + 1:04d}"
```

### 3. 🔴 Logging Configurado para Producción
```python
# backend/config/settings.py — agregar al final
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'verbose': {'format': '{levelname} {asctime} {module} {message}', 'style': '{'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {'django': {'level': 'WARNING'}, 'apps': {'level': 'INFO'}},
}
```

### 4. 🟡 Fix Observer Error Handling
```python
# backend/apps/tickets/apps.py — reemplazar el except
import logging
logger = logging.getLogger(__name__)

# En on_ticket_event_saved:
try:
    get_notification_service().dispatch(event_payload)
except Exception:
    logger.exception("Failed to dispatch notification for TicketEvent %s", instance.id)
```

### 5. 🟡 API Client Timeout
```typescript
// frontend/src/infrastructure/http/ApiClient.ts
this.http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})
```

### 6. 🟡 Focus Trap en Modales con Radix Dialog
```tsx
// Reemplazar AssignModal con Dialog de Radix (ya instalado)
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../../core/ui/dialog'

export function AssignModal({ ticketId, onClose, onAssigned }: AssignModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>Asignar ticket</DialogTitle>
        <DialogDescription>Selecciona un trabajador activo.</DialogDescription>
        {/* ... contenido del modal ... */}
      </DialogContent>
    </Dialog>
  )
}
```

### 7. 🟡 Eliminar Duplicación de Tipos en Notifications
```typescript
// frontend/src/modules/notifications/interfaces/INotificationService.ts
// Reemplazar definiciones duplicadas con re-exports:
export type {
  NotificationTipo,
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
} from './types'
```

### 8. 🟡 Health Check Endpoint
```python
# backend/apps/authentication/views/health_views.py
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    checks = {}
    try:
        with connection.cursor() as c:
            c.execute("SELECT 1")
        checks['database'] = 'ok'
    except Exception:
        checks['database'] = 'error'
    status_code = 200 if all(v == 'ok' for v in checks.values()) else 503
    return JsonResponse({'status': 'healthy' if status_code == 200 else 'unhealthy', **checks}, status=status_code)

# backend/config/urls.py — agregar:
path("health/", health_check, name="health-check"),
```

### 9. 🟡 Error Boundary Global
```tsx
// frontend/src/core/ui/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
            <p className="text-muted-foreground mb-4">Ha ocurrido un error inesperado.</p>
            <button onClick={() => this.setState({ hasError: false })} className="text-brand-cyan-dark underline">
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

### 10. 🟡 Business Hours: Informativo, No Bloqueante
```python
# backend/apps/tickets/validators/business_rule_validator.py
# Cambiar de bloqueante a informativo:
def validate(self, data: dict) -> ValidationResult:
    now = datetime.now()
    is_business_hours = now.weekday() in _BUSINESS_DAYS and _BUSINESS_START <= now.hour < _BUSINESS_END
    
    # Solo advertir, no bloquear
    # (La regla de duplicados SÍ se mantiene como bloqueante)
    cliente_id = data.get("cliente_id")
    asunto = data.get("asunto", "")
    servicio_id = data.get("servicio_id")
    if cliente_id and asunto and servicio_id:
        if self._ticket_repository.find_active_duplicate(cliente_id, asunto, servicio_id):
            return ValidationResult(
                is_valid=False,
                errors=["Ya existe un ticket activo con el mismo asunto y servicio."],
                field_name="duplicado",
            )
    return ValidationResult(is_valid=True)
```

---

## 5. PLAN DE MEJORAS PRIORIZADO

### 🔴 CRÍTICO (Implementar antes de producción)

| # | Mejora | Archivo(s) | Estimación |
|---|--------|-----------|------------|
| 1 | Rate limiting en auth endpoints | `settings.py`, throttling classes | 2 horas |
| 2 | Fix race condition ticket numbers | `ticket_service.py` | 1 hora |
| 3 | Logging configurado | `settings.py` | 1 hora |
| 4 | Fix observer error handling | `apps.py` (tickets, realtime) | 1 hora |
| 5 | Jenkinsfile: bat → sh | `Jenkinsfile` | 30 min |

**Subtotal: ~5.5 horas**

### 🟡 ALTO (Implementar en el siguiente sprint)

| # | Mejora | Archivo(s) | Estimación |
|---|--------|-----------|------------|
| 6 | API Client timeout | `ApiClient.ts` | 15 min |
| 7 | Focus trap en modales | `AssignModal`, `NotificationBell` | 2 horas |
| 8 | Eliminar duplicación tipos notifications | `INotificationService.ts`, `types.ts` | 30 min |
| 9 | Health check endpoint | nuevo archivo + `urls.py` | 1 hora |
| 10 | Error boundary global | nuevo componente + `App.tsx` | 1 hora |
| 11 | Business hours → informativo | `BusinessRuleValidator` (FE+BE) | 1 hora |
| 12 | Registrar modelos en admin.py | todos los `admin.py` | 2 horas |
| 13 | CatalogAdminPanel → DIP | nuevo hook + componente | 2 horas |

**Subtotal: ~10 horas**

### 🟢 MEDIO (Implementar en los próximos 2-3 sprints)

| # | Mejora | Archivo(s) | Estimación |
|---|--------|-----------|------------|
| 14 | Paginación DRF estándar | `settings.py`, serializers | 3 horas |
| 15 | CSP headers | `settings.py`, middleware | 1 hora |
| 16 | CORS preflight cache | `settings.py` | 5 min |
| 17 | Tests de integración (DRF APIClient) | nuevo carpeta tests/ | 8 horas |
| 18 | Tests E2E (Cypress/Playwright) | nuevo config + specs | 16 horas |
| 19 | UserRepository safe update | `user_repository.py` | 30 min |
| 20 | Click-outside para NotificationPanel | `NotificationBell/index.tsx` | 30 min |
| 21 | TicketStatusBadge tests actualizados | test file | 30 min |

**Subtotal: ~29.5 horas**

### ⚪ BAJO (Mejoras deseables a futuro)

| # | Mejora | Estimación |
|---|--------|------------|
| 22 | OpenAPI/Swagger documentation | 4 horas |
| 23 | Backup automatizado de BD | 2 horas |
| 24 | Staging environment | 8 horas |
| 25 | CI con tests de BD (PostgreSQL service) | 3 horas |
| 26 | Bundle analysis (Vite) | 2 horas |
| 27 | React.memo / useMemo optimization | 4 horas |
| 28 | Storybook para UI components | 8 horas |
| 29 | i18n (internacionalización) | 16 horas |
| 30 | PWA support | 8 horas |

**Subtotal: ~55 horas**

---

## 6. ANÁLISIS FODA

### Fortalezas (Strengths)
1. **Arquitectura SOLID impecable** — DIP, ISP, SRP aplicados consistentemente en todos los módulos. Las interfaces son contratos reales, no decorativos.
2. **Patrones de diseño bien ejecutados** — Repository, Factory, Strategy, Observer, Chain of Responsibility con extensiones claras (OCP documentado).
3. **Seguridad JWT correcta** — Tokens en memoria (nunca localStorage), refresh rotation, blacklist en logout.
4. **Design system coherente** — Tokens CSS + shadcn/Radix + Tailwind. Modo oscuro soportado.
5. **Documentación exhaustiva** — CLAUDE.md por capa, decisiones de diseño registradas (D1-D32).
6. **Observer pattern desacoplado** — Dos suscriptores independientes (notifications + realtime) sin acoplamiento circular.
7. **TypeScript estricto** — `tsc --noEmit` pasa limpio, interfaces bien definidas.
8. **Docker multi-stage** — Imágenes optimizadas, health checks configurados.

### Debilidades (Weaknesses)
1. **Tests insuficientes** — Sin tests de integración, sin E2E, cobertura no medida.
2. **Sin rate limiting** — Endpoints públicos vulnerables a abuso.
3. **Logging ausente** — Sin configuración de logging estructurado.
4. **Race conditions** — `generate_ticket_number` no es atómico.
5. **Singletons sin thread safety** — Usan `global` sin Lock.
6. **Jenkinsfile Windows-only** — `bat` commands incompatibles con Linux CI.
7. **Duplicación de tipos** — `INotificationService.ts` y `types.ts` definen lo mismo.
8. **Sin paginación estándar** — Respuestas pueden ser enormes.

### Oportunidades (Opportunities)
1. **OpenAPI spec** — Generar documentación automática de la API.
2. **Storybook** — Documentar el design system para el equipo.
3. **Cypress E2E** — Tests end-to-end del flujo completo.
4. **Staging environment** — Pre-producción en Render/Vercel.
5. **Monitoring** — Sentry o similar para errores en producción.
6. **i18n** — El proyecto ya está en español; expandir a otros idiomas.
7. **PWA** — Convertir la app en Progressive Web App para móvil.

### Amenazas (Threats)
1. **Supabase dependency** — Si Supabase tiene downtime, toda la app falla. Sin fallback.
2. **Single DB sin réplica** — Sin read replicas ni failover.
3. **Email delivery** — Depende de SMTP (Gmail); sin servicio transactional (SendGrid/SES).
4. **WebSocket scaling** — `InMemoryChannelLayer` no funciona con múltiples workers. Redis es obligatorio en producción.
5. **Dependency supply chain** — npm packages sin lockfile integrity check en CI.

---

## 7. MÉTRICAS DE CÓDIGO

### Complejidad Ciclomática por Módulo

| Módulo | Complejidad Promedio | Archivos Más Complejos |
|--------|---------------------|----------------------|
| authentication/ | Baja (3-5) | `auth_service.py` (8), `user_admin_service.py` (4) |
| catalog/ | Baja (2-4) | `catalog_service.py` (5), `catalog_views.py` (4) |
| tickets/ | Media (4-7) | `ticket_service.py` (12), `business_rule_validator.py` (6) |
| notifications/ | Media (3-6) | `notification_service.py` (9), `email_strategy.py` (4) |
| reports/ | Baja (2-4) | `report_service.py` (3), `csv_exporter.py` (2) |
| realtime/ | Baja (2-3) | `notification_consumer.py` (4) |
| Frontend hooks | Media (4-6) | `useNotifications.tsx` (6), `useTickets.tsx` (5) |
| Frontend components | Baja (2-4) | `CreateTicketForm.tsx` (7), `AdminDashboard.tsx` (4) |

### Duplicación de Código

| Tipo | Instancia | Gravedad |
|------|-----------|----------|
| Tipos duplicados | `INotificationService.ts` ↔ `types.ts` | Media |
| Mapper functions | `mapUser()` en AuthService + UserAdminService | Baja (aceptable por SRP) |
| CSS classes | StatusBadge configs en `TicketStatusBadge` + `ticketBadges` | Media |
| Filter patterns | `_FILTER_KEYS` repetido en 3 vistas de tickets | Baja |

### Cobertura de Tests (Estimada)

| Capa | Unit Tests | Integration | E2E |
|------|-----------|-------------|-----|
| Backend auth | ✅ 85% | ❌ 0% | ❌ 0% |
| Backend tickets | ✅ 80% | ❌ 0% | ❌ 0% |
| Backend notifications | ✅ 75% | ❌ 0% | ❌ 0% |
| Backend reports | ✅ 70% | ❌ 0% | ❌ 0% |
| Frontend auth | ⚠️ 30% | ❌ 0% | ❌ 0% |
| Frontend tickets | ✅ 60% | ❌ 0% | ❌ 0% |
| Frontend notifications | ✅ 50% | ❌ 0% | ❌ 0% |
| Frontend reports | ❌ 0% | ❌ 0% | ❌ 0% |

### Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| Archivos backend (sin migrations) | 175 |
| Archivos frontend (sin node_modules) | 115 |
| Líneas de código total | 16,451 |
| Apps Django | 6 |
| Módulos frontend | 7 |
| Interfaces ABC (BE) | 12 |
| Interfaces TypeScript (FE) | 14 |
| Tests backend | ~50 casos |
| Tests frontend | ~25 casos |
| API endpoints | 30+ |
| WebSocket routes | 2 |
| Design tokens CSS | 40+ |
| Componentes UI reutilizables | 20+ |

---

## 8. CONCLUSIÓN FINAL

SassBlum es un proyecto **arquitectónicamente sólido** con una puntuación de **387/500 (77.4%)**. La aplicación consistente de SOLID, los patrones de diseño bien ejecutados, y la separación clara de responsabilidades lo convierten en una base excelente para escalar.

Las **5 áreas críticas** que deben abordarse antes de producción son:
1. Rate limiting en endpoints públicos
2. Fix de race condition en generación de tickets
3. Logging estructurado
4. Error handling en Observer pattern
5. Corrección del Jenkinsfile para CI/CD funcional

Con las mejoras de prioridad ALTO implementadas, el proyecto alcanzaría un nivel de **calidad profesional** listo para producción con usuarios reales.

---

*Reporte generado automáticamente mediante auditoría exhaustiva del 100% del código fuente.*
*Metodología: Semi-formal Reasoning (Meta Research, arXiv:2603.01896)*
```

### 📄 SKILL_AUDITORIA.md
```
# 🔍 Skill: Auditoría Continua SassBlum

> Skill para evaluar la salud del código SassBlum de forma continua.
> Ejecutar después de cada sprint o antes de cada deploy a producción.

---

## Uso

```bash
# Ejecutar auditoría completa
openclaw skills run audit-sassblum

# Ejecutar solo una fase
openclaw skills run audit-sassblum --phase=security
openclaw skills run audit-sassblum --phase=performance
openclaw skills run audit-sassblum --phase=accessibility
```

---

## Fases de Auditoría

### FASE 1 — Seguridad (OWASP Top 10)

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | Rate limiting en endpoints públicos | 🔴 CRÍTICO | `grep -r "throttle" backend/config/settings.py` |
| 2 | JWT no en localStorage | 🔴 CRÍTICO | `grep -r "localStorage" frontend/src/infrastructure/` |
| 3 | CORS restrictivo | 🟡 ALTO | `grep "CORS_ALLOWED_ORIGINS" backend/config/settings.py` |
| 4 | CSP headers configurados | 🟡 ALTO | `grep "CSP_" backend/config/settings.py` |
| 5 | HTTPS enforcement | 🔴 CRÍTICO | `grep "SECURE_SSL_REDIRECT" backend/config/settings.py` |
| 6 | Password validation | 🟡 ALTO | Verificar AUTH_PASSWORD_VALIDATORS en settings.py |
| 7 | Input sanitization en templates | 🟡 ALTO | Verificar que no hay `|safe` en templates Django |
| 8 | File upload validation (BE) | 🟡 ALTO | Verificar MIME type validation en StorageService |
| 9 | SQL injection prevention | 🔴 CRÍTICO | No raw SQL sin parámetros |
| 10 | XSS prevention | 🟡 ALTO | React escapa por defecto, verificar dangerouslySetInnerHTML |

### FASE 2 — Performance

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | API timeout configurado | 🟡 ALTO | `grep "timeout" frontend/src/infrastructure/http/ApiClient.ts` |
| 2 | Paginación en listados | 🟡 ALTO | `grep "PageNumberPagination" backend/config/settings.py` |
| 3 | select_related/prefetch_related | 🟡 ALTO | Revisar queries en repositories |
| 4 | CORS preflight cache | 🟢 MEDIO | `grep "CORS_PREFLIGHT_MAX_AGE" backend/config/settings.py` |
| 5 | Lazy loading de componentes | 🟢 MEDIO | Verificar `lazy()` en App.tsx |
| 6 | will-change usage | 🟢 MEDIO | `grep -r "will-change" frontend/src/` |
| 7 | React.memo en componentes pesados | 🟢 MEDIO | Verificar componentes de lista |
| 8 | Bundle size analysis | ⚪ BAJO | `npm run build && ls -lh dist/assets/` |

### FASE 3 — Accesibilidad (WCAG 2.1 AA)

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | aria-label en elementos interactivos | 🟡 ALTO | `grep -r "aria-label" frontend/src/` |
| 2 | Focus trap en modales | 🟡 ALTO | Verificar Radix Dialog usage |
| 3 | prefers-reduced-motion respetado | 🟢 MEDIO | `grep -r "prefers-reduced-motion" frontend/src/` |
| 4 | Contraste de colores AA | 🟡 ALTO | Verificar con herramienta de contraste |
| 5 | Keyboard navigation | 🟡 ALTO | Verificar que todos los elementos son focusables |
| 6 | aria-hidden en elementos decorativos | 🟢 MEDIO | `grep -r "aria-hidden" frontend/src/` |
| 7 | Error Boundary global | 🟡 ALTO | Verificar en App.tsx |

### FASE 4 — Arquitectura SOLID

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | DIP: interfaces como contratos | 🟡 ALTO | Verificar que componentes no importan servicios concretos |
| 2 | SRP: un componente = una función | 🟢 MEDIO | Revisar componentes > 200 líneas |
| 3 | Singleton thread-safe | 🟡 ALTO | `grep -r "threading.Lock" backend/apps/*/services/` |
| 4 | Observer error handling | 🟡 ALTO | `grep -r "except.*pass" backend/apps/` |
| 5 | Race conditions | 🔴 CRÍTICO | Verificar operaciones atómicas en BD |
| 6 | Type safety (no `any`) | 🟢 MEDIO | `grep -r ": any\|as any" frontend/src/` |

### FASE 5 — Testing

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | Tests unitarios backend | 🟡 ALTO | `cd backend && pytest --co -q 2>/dev/null \| wc -l` |
| 2 | Tests unitarios frontend | 🟡 ALTO | `cd frontend && npm run test 2>&1` |
| 3 | Tests de integración | 🟡 ALTO | Verificar que existen tests con APIClient |
| 4 | Tests E2E | ⚪ BAJO | Verificar Cypress/Playwright setup |
| 5 | Cobertura de tests | 🟢 MEDIO | `pytest --cov` / `npm run test -- --coverage` |

### FASE 6 — DevOps & CI/CD

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | Jenkinsfile cross-platform | 🟡 ALTO | Verificar `sh` no `bat` |
| 2 | Docker health check HTTP | 🟢 MEDIO | Verificar endpoint /health/ |
| 3 | Logging configurado | 🟡 ALTO | `grep "LOGGING" backend/config/settings.py` |
| 4 | Environment variables seguras | 🔴 CRÍTICO | No secrets en código, usar .env |
| 5 | Backup automatizado | 🟢 MEDIO | Verificar cron job o servicio |

---

## Métricas de Salud

| Métrica | Sana | Advertencia | Crítica |
|---------|------|-------------|---------|
| Tests de cobertura | >80% | 50-80% | <50% |
| Errores de TypeScript | 0 | 1-5 | >5 |
| Vulnerabilidades npm | 0 | 1-3 | >3 |
| Complejidad ciclomática | <5 | 5-10 | >10 |
| Archivos > 300 líneas | 0 | 1-3 | >3 |

---

## Checklist Pre-Producción

Antes de cada deploy a producción, verificar:

- [ ] Todos los checks CRÍTICOS pasan
- [ ] Rate limiting configurado
- [ ] Logging funcional
- [ ] Health check endpoint responde
- [ ] Tests unitarios pasan (FE + BE)
- [ ] TypeScript compila sin errores
- [ ] No hay `console.log` en producción
- [ ] Variables de entorno configuradas
- [ ] CORS restrictivo
- [ ] CSP headers presentes
- [ ] Singleton thread-safe
- [ ] Error handling en observers
- [ ] No race conditions conocidas
- [ ] Jenkinsfile usa `sh` (no `bat`)
- [ ] admin.py con modelos registrados

---

## Generación de Reporte

Ejecutar y guardar en `REPORTE_AUDITORIA_YYYY-MM-DD.md`:

```bash
# En el directorio del proyecto
echo "# Reporte de Auditoría - $(date +%Y-%m-%d)" > REPORTE_AUDITORIA_$(date +%Y-%m-%d).md
# ... ejecutar cada fase y appendear resultados
```

---

## Sostenibilidad del Código

### Principios a mantener:
1. **DRY** — No duplicar lógica (tipos, funciones, constantes)
2. **SOLID** — Aplicar consistentemente en FE y BE
3. **Documentación** — CLAUDE.md actualizado, docstrings en ABCs
4. **Accesibilidad** — WCAG 2.1 AA como mínimo
5. **Seguridad** — OWASP Top 10 como referencia
6. **Performance** — <3s First Contentful Paint, <100ms Time to Interactive
7. **Testing** — >80% cobertura en lógica de negocio

### Métricas a monitorear:
- Complejidad ciclomática por módulo
- Duplicación de código
- Cobertura de tests
- Vulnerabilidades de dependencias
- Tamaño del bundle
- Tiempos de respuesta de la API
```

### 📄 auditoria.md
```
Cómo usar la skill de auditoría en tu proyecto

El flujo es así:

Paso 1 — Recopilar el código

bash
bash .openclaw/tmp/code-review/scripts/collect_code.sh /home/work/.openclaw/workspace/SassBlumRedise-oWeb
bash .openclaw/tmp/code-review/scripts/collect_code.sh /home/work/.openclaw/workspace/SassBlumRedise-oWeb
Esto genera 4 archivos en SassBlumRedise-oWeb/.openclaw/tmp/code-review/:

STATS.md — Estadísticas y stack
CONFIG.md — Configuración y dependencias
BACKEND.md — Todo el código backend
FRONTEND.md — Todo el código frontend

Paso 2 — Yo leo esos archivos y evalúo contra 7 estándares (ISO 25010, OWASP, WCAG, SOLID, REST, 12-Factor, CWE/SANS)

Paso 3 — Genero el reporte en REPORTE_AUDITORIA.md con puntuación, brechas, código corregido y plan de mejora.

Para ver los resultados en VSCode

Los reportes ya están en tu proyecto como archivos Markdown:

REPORTE_AUDITORIA.md
REPORTE_AUDITORIA_TOTAL.md

En VSCode solo abre cualquiera de estos archivos y presiona Ctrl+Shift+V para ver el reporte formateado con tablas y colores.

¿Quieres que ejecute una nueva auditoría ahora?

Puedo correr el análisis completo del proyecto SassBlum con la skill y generar un reporte actualizado. Solo dime:

1.¿Auditoría completa (los 7 estándares, ~700 puntos)?
2.¿Algo específico (solo seguridad, solo frontend, solo accesibilidad)?

También si quieres que el reporte se genere en un archivo específico para que lo abras directo en VSCode, me dices.
```

### 📄 .gitignore
```
# Python
__pycache__/
*.py[cod]
*.env
venv/
.venv/

# Node
node_modules/
dist/
.env
.env.local

# VSCode
.vscode/settings.json

# Supabase
supabase/.branches/```

### 📄 docker-compose.prod.yml
```
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: sassblum_redis_prod
    restart: always
    volumes:
      - redis_data_prod:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    image: sassblum-backend:latest
    container_name: sassblum_backend_prod
    restart: unless-stopped
    environment:
      DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY}
      DJANGO_DEBUG: "False"
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379/0
      USE_REDIS: "True"
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS}
      JWT_ACCESS_TOKEN_LIFETIME: 3600
      JWT_REFRESH_TOKEN_LIFETIME: 604800
      EMAIL_BACKEND: ${EMAIL_BACKEND}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_HOST_USER: ${EMAIL_HOST_USER}
      EMAIL_HOST_PASSWORD: ${EMAIL_HOST_PASSWORD}
      DEFAULT_FROM_EMAIL: ${DEFAULT_FROM_EMAIL}
      FRONTEND_URL: ${FRONTEND_URL}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
    depends_on:
      redis:
        condition: service_healthy
    expose:
      - "8000"
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; socket.create_connection(('localhost', 8000), timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: sassblum-frontend:latest
    container_name: sassblum_frontend_prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis_data_prod:
```

### 📄 docker-compose.yml
```
version: '3.8'

services:
  # Redis for Django Channels
  redis:
    image: redis:7-alpine
    container_name: sassblum_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    volumes:
      - redis_data:/data

  # Django + Daphne backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sassblum_backend
    ports:
      - "8000:8000"
    environment:
      DJANGO_SECRET_KEY: dev-key-change-in-production
      DJANGO_DEBUG: "False"
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379/0
      USE_REDIS: "True"
      CORS_ALLOWED_ORIGINS: http://localhost
      ALLOWED_HOSTS: localhost,127.0.0.1,backend
      JWT_ACCESS_TOKEN_LIFETIME: 3600
      JWT_REFRESH_TOKEN_LIFETIME: 604800
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
      FRONTEND_URL: http://localhost
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; socket.create_connection(('localhost', 8000), timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3

  # React + nginx frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sassblum_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis_data:
```

### 📄 Jenkinsfile
```
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        PROJECT_NAME = 'sassblum'
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY_USER = 'kimi2123'
        DOCKER_IMAGE_BACKEND = "${DOCKER_REGISTRY_USER}/${PROJECT_NAME}-backend"
        DOCKER_IMAGE_FRONTEND = "${DOCKER_REGISTRY_USER}/${PROJECT_NAME}-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh '''
                        echo "=== Generando .env de CI ==="
                        cat > .env << 'ENVEOF'
DJANGO_SECRET_KEY=ci-only-secret-key-not-used-in-production
DJANGO_DEBUG=True
DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800
ENVEOF

                        echo "=== Creando entorno virtual ==="
                        python3 -m venv .venv-ci || exit 1
                        . .venv-ci/bin/activate || exit 1

                        echo "=== Instalando dependencias ==="
                        pip install -r requirements-dev.txt || exit 1

                        echo "=== Django system check ==="
                        python manage.py check || exit 1

                        echo "=== Tests con pytest (solo unitarios) ==="
                        pytest -v -m "not django_db" || exit 1

                        echo "=== Lint con flake8 (no bloqueante) ==="
                        flake8 apps config core --max-line-length=120 --exclude=migrations || true
                    '''
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "=== Instalando dependencias ==="
                        npm ci || exit 1

                        echo "=== TypeScript check ==="
                        npx tsc --noEmit || exit 1

                        echo "=== Tests con vitest ==="
                        npm run test -- --pool=threads --no-file-parallelism || exit 1

                        echo "=== Lint con ESLint (no bloqueante) ==="
                        npm run lint || true
                    '''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh """
                        echo "=== Build imagen backend ==="
                        docker build -t ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} -t ${DOCKER_IMAGE_BACKEND}:latest .
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh """
                        echo "=== Build imagen frontend ==="
                        docker build -t ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} -t ${DOCKER_IMAGE_FRONTEND}:latest .
                    """
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-credentials',
                                 usernameVariable: 'DOCKER_USER',
                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "=== Login Docker Hub ==="
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin || exit 1

                        echo "=== Push backend ==="
                        docker push ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} || exit 1
                        docker push ${DOCKER_IMAGE_BACKEND}:latest || exit 1

                        echo "=== Push frontend ==="
                        docker push ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} || exit 1
                        docker push ${DOCKER_IMAGE_FRONTEND}:latest || exit 1

                        docker logout
                    '''
                }
            }
        }

        // Se activa en ETAPA E: crear las credenciales 'render-deploy-hook' y
        // 'vercel-deploy-hook' (Secret text) en Jenkins y descomentar este stage.
        /*
        stage('Deploy (Render + Vercel)') {
            steps {
                withCredentials([
                    string(credentialsId: 'render-deploy-hook', variable: 'RENDER_HOOK'),
                    string(credentialsId: 'vercel-deploy-hook', variable: 'VERCEL_HOOK')
                ]) {
                    sh '''
                        echo "=== Disparando deploy de backend en Render ==="
                        curl -f -X POST "$RENDER_HOOK"

                        echo "=== Disparando deploy de frontend en Vercel ==="
                        curl -f -X POST "$VERCEL_HOOK"
                    '''
                }
            }
        }

        stage('Smoke Tests') {
            steps {
                sh '''
                    echo "=== Esperando a que los deploys terminen (90s) ==="
                    sleep 90

                    echo "=== Backend vivo? ==="
                    curl -f https://sassblum-backend.onrender.com/api/servicios/ || exit 1

                    echo "=== Frontend vivo? ==="
                    curl -f https://sassblum.vercel.app/ || exit 1

                    echo "Smoke tests OK"
                '''
            }
        }
        */
    }

    post {
        always {
            sh 'rm -rf backend/.venv-ci'
            echo "Build finished: ${currentBuild.currentResult}"
        }
        failure {
            echo 'Pipeline FALLO - revisar el log de consola arriba.'
        }
        success {
            echo "Pipeline OK - build #${BUILD_NUMBER}"
        }
    }
}
```

### 📄 .github/workflows/ci.yml
```yaml
name: CI SassBlum

on:
  pull_request:
    branches:
      - main

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt

      - name: Create CI env file
        run: |
          cat > .env << 'EOF'
          DJANGO_SECRET_KEY=ci-only-secret-key-not-used-in-production
          DJANGO_DEBUG=True
          DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
          JWT_ACCESS_TOKEN_LIFETIME=3600
          JWT_REFRESH_TOKEN_LIFETIME=604800
          EOF

      - name: Django System Check
        run: python manage.py check

      - name: Run Unit Tests
        run: pytest -v -m "not django_db"

      - name: Run Flake8 (non-blocking)
        run: flake8 apps config core --max-line-length=120 --exclude=migrations
        continue-on-error: true

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: npm ci

      - name: TypeScript Check
        run: npx tsc --noEmit

      - name: Run Unit Tests
        run: npm run test
```

---
**Total archivos de configuración:** 15
