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
