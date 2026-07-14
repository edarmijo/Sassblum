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
