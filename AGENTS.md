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

The full audit (30 findings) was completed and all findings addressed; the one-off report files were removed from the repo (see git history if needed).

---

## Contact

- **Client:** Vicky Pinto (SassBlum)
- **Repository:** https://github.com/edarmijo/SassBlumRedise-oWeb
- **Team:** Erick Armijos, Juan Pérez, Elías Rubio, Jahir Cajas, Jairo Rodríguez
