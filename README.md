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
