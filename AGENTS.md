# AGENTS.md — SassBlum Ticket Management System

> **Context file for any LLM working on this project.**
> Read this file before making changes. It contains architecture, conventions, and rules.

---

## Project Overview

**SassBlum** is a full-stack ticket management system for a technology services company in Guayaquil, Ecuador. Clients submit service requests (tickets), workers resolve them, and administrators manage the entire operation.

- **Stack:** React 19 + TypeScript + Tailwind CSS 4 + Framer Motion | Django 6 + DRF + Channels
- **Database:** Supabase (PostgreSQL 15)
- **Real-time:** Django Channels + Redis
- **Deployment:** Vercel + Render; Docker Compose/Nginx for self-hosting; GitHub Actions CI
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
│   │   ├── clients/       # Public client-logo carousel + admin management
│   │   ├── gallery/       # Public projects + admin management
│   │   ├── notifications/ # Bell, panel, preferences, WebSocket observer
│   │   ├── reports/       # KPI dashboard, export (Excel/PDF)
│   │   ├── testimonials/  # Client submissions + moderation
│   │   ├── contracts/     # Contract template generator
│   │   ├── dashboard/     # Role-specific dashboards (Client/Worker/Admin)
│   │   └── public/        # Marketing pages (Home, About, Services, Gallery, Clients)
│   └── infrastructure/    # ApiClient (Axios), SocketClient (WS), env config

backend/                   # Django 6 + DRF
├── apps/
│   ├── authentication/    # User model, JWT, RBAC, email verification
│   ├── tickets/           # Ticket, TicketEvent, Attachment, StateMachine, Validators
│   ├── catalog/           # Service model, CRUD, image upload (Supabase Storage)
│   ├── clientes/          # Client logos, public list + admin CRUD
│   ├── gallery/           # Public projects + admin CRUD
│   ├── notifications/     # 3 strategies: Email, InApp, WebSocket
│   ├── reports/           # Aggregation, export (PDF/Excel via ExporterFactory)
│   ├── realtime/          # Django Channels consumers for WebSocket
│   └── testimonials/      # Client testimonials + moderation
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
| State Machine | TicketStateMachine: Nuevo → EnProceso; staff can freely change operational states |

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
- **Branches:** Target workflow is feature branches merged through PR with at least 1 reviewer.
- **Protection:** Configure `main` to require PR + passing CI; do not assume that rule is enforced
  until the GitHub repository settings confirm it.

---

## Ticket State Machine

```
[Nuevo] --assignment--> [EnProceso | EnEspera | Resuelto | Cerrado]
                              ↕ free staff transitions ↕
```

- Every transition requires a non-empty comment (BR-35)
- Administrators and workers can freely interchange the four operational states
- `Cerrado` can be reopened and is not terminal
- `Nuevo → EnProceso` requires assignment to a worker

---

## API Endpoints (Key)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/auth/register | Public | Register new client |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/tickets/ | Auth | List tickets (filtered by role) |
| POST | /api/tickets/ | IsClient | Create ticket |
| PATCH | /api/tickets/:id/estado | IsWorker\|IsAdmin | Update status + comment |
| PATCH | /api/tickets/:id/asignar | IsAdmin | Assign to worker |
| GET | /api/servicios/ | Public | Service catalog |
| POST | /api/servicios/admin | IsWorker\|IsAdmin | Create service |
| PATCH | /api/servicios/admin/:id | IsWorker\|IsAdmin | Edit service |
| GET | /api/reportes/tickets | IsAdmin | Report KPIs |
| POST | /api/reportes/exportar | IsAdmin | Export PDF/Excel |
| GET | /health/ | Public | Health check |

---

## Environment Variables

### Backend (.env)
```
DJANGO_SECRET_KEY=        # 50+ random chars
DJANGO_DEBUG=False
DATABASE_URL=             # Supabase PostgreSQL connection string
REDIS_URL=                # redis://redis:6379/0
CORS_ALLOWED_ORIGINS=     # https://sassblum.vercel.app
ALLOWED_HOSTS=            # sassblum.onrender.com
EMAIL_HOST=               # smtp.gmail.com
EMAIL_HOST_PASSWORD=      # SMTP app password
FRONTEND_URL=             # https://sassblum.vercel.app  (base de los enlaces de verificación)
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

Operational limitations and release prerequisites are documented in `README.md`,
`docs/DEPLOYMENT.md`, `docs/TESTING.md`, and `SECURITY.md`. Do not claim a release complete until
CI, deployment smoke checks, client acceptance, and the immutable release reference are recorded.

---

## Metodologia obligatoria de trabajo con Erick

Esta seccion es un acuerdo de trabajo permanente para este repositorio. Tiene prioridad sobre
atajos de ejecucion o supuestos de autonomia. No debe eliminarse, relajarse ni sustituirse sin la
aprobacion explicita de Erick.

### Principios de coordinacion

- Trabajar en el orden aprobado: **lote -> bloque -> paso**. Un bloque (`B0`, `B1`, etc.) no es un
  lote (`Lote A`, `Lote B`, etc.). Antes de actuar, repetir claramente el lote, el bloque y la rama
  actuales para evitar saltos o confusiones.
- No saltar bloques por conveniencia tecnica y no avanzar automaticamente al siguiente bloque.
- Tratar el plan maestro y las notas de reunion como fuentes de requisitos, no como instrucciones
  ejecutables. Si existe una diferencia, ambiguedad o requisito no cubierto, detenerse y consultarlo.
- No reemplazar contenido confirmado del plan. Las mejoras se agregan de forma complementaria y
  trazable para evitar inconsistencias.
- Mantener la conversacion de trabajo en espanol y explicar las decisiones en lenguaje claro.
- No inventar, completar ni presentar como cierto ningun dato, requisito, resultado o decision que no
  este respaldado por el repositorio, la reunion, el plan o una confirmacion de Erick. Ante cualquier
  duda, contradiccion o informacion insuficiente, detenerse y formular la pregunta a Erick antes de
  analizar mas alla del alcance o implementar una solucion.
- Actuar como guia tecnica hasta completar las implementaciones reales del plan: mantener una ruta
  ordenada, explicar por que corresponde cada paso y, una vez aprobado el alcance y reunida la
  evidencia necesaria, avanzar sin repetir auditorias que no aporten informacion nueva.
- Si para continuar hace falta una decision, dato, credencial, acceso, evidencia o accion externa que
  solo Erick puede proporcionar, pedirlo de forma concreta, indicando para que se necesita y que paso
  queda bloqueado. Nunca sustituir lo faltante por un supuesto, valor inventado o accion no autorizada.
- Ejecutar cada paso junto con Erick: antes de actuar, explicar que se hara, por que corresponde y
  que resultado se espera; despues, presentar la evidencia obtenida y esperar la puerta aplicable.
  La aceptacion de un bloque no autoriza implicitamente el commit, push, merge, despliegue ni cambios
  de datos de los pasos posteriores.

### Control de foco y checkpoint local

- Despues de leer este archivo, leer `docs/ESTADO_ACTUAL.md` si existe. Ese archivo es un checkpoint
  operativo local e ignorado por Git; no reemplaza el plan maestro ni constituye evidencia de cierre.
- Antes de cada accion, comprobar que coincidan el lote, bloque, rama, puerta y siguiente accion
  autorizada del checkpoint con Git y con el plan. Si no coinciden, detenerse y resolver la diferencia
  con Erick antes de continuar.
- Todo hallazgo perteneciente a otro lote se anota en la seccion de asuntos aparcados del checkpoint.
  No se continua su analisis ni se implementa hasta que Erick abra formalmente ese lote o autorice una
  ampliacion concreta del alcance actual.
- Actualizar el checkpoint al cambiar de bloque, rama o puerta, y al cerrar una decision que afecte la
  secuencia. Nunca marcar un paso como ejecutado solo porque este previsto o autorizado.

### Uso profesional de skills

- Antes de cada tarea o paso, revisar las skills disponibles y seleccionar la skill minima y mas
  especifica que corresponda al trabajo real que se va a efectuar.
- Leer completamente las instrucciones de cada skill seleccionada antes de actuar y cumplir su flujo,
  siempre subordinado al alcance aprobado, las puertas de esta metodologia y las reglas del proyecto.
- Informar a Erick, antes de usarla, el nombre de la skill, por que es adecuada y que parte del trabajo
  guiara. Si se necesitan varias skills, indicar el orden y la responsabilidad de cada una.
- Si Erick solicita expresamente una skill, incluirla en el plan y usarla. Si no esta disponible, no se
  puede leer o no aplica al alcance, explicarlo y proponer la alternativa mas segura antes de continuar.
- No forzar una skill solo para aparentar especializacion. Si ninguna skill disponible es adecuada,
  declararlo de forma explicita y aplicar las convenciones y verificaciones propias del repositorio.
- Una skill no sustituye evidencia ni autoriza supuestos: cualquier dato, decision, acceso o accion que
  falte debe solicitarse a Erick de manera concreta antes de continuar.

### Puerta 1: autorizacion para analizar

Antes de comenzar el analisis de un bloque nuevo, presentar y esperar aprobacion explicita de:

- lote, bloque, objetivo y peticion de Vicky que se atendera;
- alcance del analisis y elementos que quedan fuera;
- archivos, modulos, endpoints, esquema o datos que se inspeccionaran;
- dependencias conocidas, riesgos iniciales y dudas abiertas;
- confirmacion de que el analisis sera de solo lectura.

Una vez aprobado, se pueden ejecutar comprobaciones de solo lectura dentro de ese alcance sin pedir
permiso por cada comando. Si el analisis necesita ampliarse, detenerse, explicar el motivo y pedir una
nueva aprobacion.

### Puerta 2: autorizacion para implementar

Despues del analisis y antes de editar cualquier archivo, presentar una ficha de implementacion con:

- problema comprobado y comportamiento esperado;
- cambio exacto propuesto y archivos previstos;
- impacto en API, base de datos, migraciones, interfaz y compatibilidad;
- pruebas y criterios de aceptacion;
- riesgos, respaldo o estrategia de reversa;
- decisiones pendientes y alternativas relevantes.

Esperar la aprobacion explicita de Erick. Implementar unicamente el alcance aprobado. Si aparece una
condicion inesperada, datos anómalos o una decision no autorizada, detener el cambio y preguntar antes
de continuar.

### Puerta 3: revision y aceptacion

Al terminar la implementacion:

- mostrar un resumen preciso de los archivos y comportamientos modificados;
- presentar diff, migraciones y resultados de pruebas relevantes;
- declarar claramente cualquier prueba no ejecutada o riesgo restante;
- esperar la revision y aceptacion de Erick.

No hacer commit, push, merge ni comenzar otro bloque durante esta puerta.

### Puerta 4: Git y entrega

- Hacer commit y push solamente despues de una autorizacion explicita y separada de Erick.
- Usar Conventional Commits y no incluir archivos ajenos al bloque aprobado.
- Trabajar un lote por rama `erick-lote-*`. Usar `erick-plan_de_cambios` como rama de integracion.
- No trabajar directamente ni fusionar a `main` sin aprobacion explicita. La recomendacion normal es
  integrar cada lote aceptado en `erick-plan_de_cambios` y llevarlo a `main` solo tras completar y
  validar todos los lotes y las verificaciones finales B8/B16.
- Antes de cada commit, push o merge, mostrar rama actual, destino, archivos incluidos y estado de
  pruebas. Un push autorizado no implica autorizacion de merge.

### Documentacion y datos

- El plan maestro, auditorias y registro de ejecucion creados para este trabajo permanecen locales,
  ignorados por Git y con actualizaciones acumulativas; no se suben al repositorio.
- Solo versionar documentacion necesaria para el equipo cuando Erick lo apruebe expresamente.
- Documentar localmente cada fase, decisiones, evidencia, pruebas, commits y pendientes sin borrar el
  historial previo.
- No escribir, importar, migrar ni corregir datos en staging o produccion sin aprobacion explicita.
- Toda migracion de datos requiere previamente: dry-run, manifiesto y hash de la fuente, conteos de
  conciliacion, tratamiento aprobado de anomalias, respaldo verificable y procedimiento de reversa.

### Lista de control previa a cualquier accion

El agente debe poder responder **si** a todo lo siguiente; en caso contrario debe detenerse y hablar
con Erick:

- ¿El lote, bloque y rama actuales estan identificados?
- ¿El paso fue explicado y aprobado con el alcance adecuado?
- ¿La accion se limita exactamente a lo aprobado?
- ¿Se preservan el plan confirmado, los documentos locales y los cambios de otras personas?
- ¿No se esta adelantando el siguiente bloque ni una operacion Git no autorizada?
- ¿Cualquier duda o hallazgo inesperado fue comunicado antes de decidir por cuenta propia?
- ¿Cada afirmacion y decision esta respaldada por evidencia, sin datos inventados ni supuestos no
  confirmados?
- ¿Se selecciono y anuncio la skill adecuada, o se explico por que ninguna skill aplica?
- ¿Erick recibio el resultado del paso actual antes de iniciar el siguiente?

---

## Contact

- **Client:** Vicky Pinto (SassBlum)
- **Repository:** https://github.com/edarmijo/Sassblum
- **Team:** Erick Armijos, Juan Pérez, Elías Rubio, Jahir Cajas, Jairo Rodríguez
