# SassBlum Frontend — React 19 + TypeScript

## Contexto específico del Frontend para Claude Code

> Leer primero el CLAUDE.md raíz del workspace. Este archivo agrega contexto específico del frontend.

---

## Estructura de carpetas

```
Frontend/src/
├── core/
│   ├── interfaces/
│   │   ├── IRepository.ts           # Contrato CRUD genérico (OCP + DIP)
│   │   ├── INotificationStrategy.ts
│   │   ├── IReportExporter.ts
│   │   └── ITicketValidator.ts
│   ├── base/
│   │   ├── BaseService.ts           # Abstract con error handling
│   │   ├── BaseRepository.ts        # HTTP CRUD default implementation
│   │   └── BaseValidator.ts         # Nodo base Chain of Responsibility
│   ├── factories/
│   │   ├── NotificationFactory.ts
│   │   ├── ExporterFactory.ts
│   │   └── ValidatorFactory.ts
│   ├── hooks/
│   │   ├── useAuth.ts               # JWT en memoria (NUNCA localStorage)
│   │   ├── useNotifications.ts
│   │   └── useRealtime.ts
│   └── ui/                          # Componentes base reutilizables
│       ├── Button/
│       ├── Modal/
│       ├── Table/
│       └── Badge/
│
├── modules/
│   ├── auth/                        # Sprint 1
│   │   ├── interfaces/IAuthService.ts
│   │   ├── services/AuthService.ts
│   │   ├── repositories/AuthRepository.ts
│   │   ├── validators/
│   │   │   ├── EmailValidator.ts
│   │   │   ├── PasswordValidator.ts
│   │   │   └── RegistrationValidator.ts
│   │   ├── components/
│   │   │   ├── LoginForm/
│   │   │   └── RegisterForm/
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       └── RecoverPasswordPage.tsx
│   ├── catalog/                     # Sprint 2
│   ├── tickets/                     # Sprints 2–4
│   ├── notifications/               # Sprint 3
│   ├── reports/                     # Sprint 4
│   └── realtime/                    # Sprint 4
│
└── infrastructure/
    ├── http/ApiClient.ts            # Singleton Axios + interceptores JWT
    ├── websocket/SocketClient.ts    # Singleton WebSocket
    └── config/env.ts                # Variables de entorno tipadas
```

---

## Reglas específicas del frontend

### JWT — Seguridad obligatoria

- **NUNCA** guardar JWT en `localStorage` ni `sessionStorage` (riesgo XSS).
- El token vive **solo en memoria** dentro del hook `useAuth` (React Context).
- El refresh token se maneja vía interceptor en `ApiClient.ts`.
- Si el usuario recarga la página, debe volver a autenticarse (comportamiento esperado).

### ApiClient (Singleton Axios)

- Un solo archivo: `infrastructure/http/ApiClient.ts`.
- Interceptor de request: inyecta el header `Authorization: Bearer <token>`.
- Interceptor de response: detecta 401 → intenta refresh → si falla → logout.
- Ningún módulo importa `axios` directamente; todos usan `ApiClient`.

### Componentes React

- Props tipadas con interfaces TypeScript (nunca `any`).
- Un componente = una responsabilidad (SRP).
- Los componentes no llaman a servicios directamente: usan el hook correspondiente.
- Los hooks son el único punto de contacto con los servicios.

### Chain of Responsibility en FE (validators)

```typescript
// Nodo base
interface ITicketValidator {
  setNext(validator: ITicketValidator): ITicketValidator;
  validate(data: FormData, context: Context): ValidationResult;
}

// Cadena de registro
const chain = new EmailValidator();
chain.setNext(new PasswordValidator());
// Agregar PhoneValidator = nuevo archivo, sin modificar EmailValidator (OCP)
```

### Estructura de cada módulo (orden jerárquico obligatorio)

```
modules/<nombre>/
├── interfaces/     # 1. Primero siempre
├── services/       # 2. Singleton, implementa la interfaz
├── repositories/   # 3. Extiende BaseRepository, llama al API
├── validators/     # 4. Nodos de la cadena
├── components/     # 5. UI — dependen de la interfaz vía hook
└── pages/          # 6. Solo layout y routing
```

### Estado global (Zustand)

- Un store por dominio: `authStore`, `ticketStore`, `notificationStore`.
- Los stores no contienen lógica de negocio: solo estado y setters simples.
- La lógica vive en los servicios; el store solo persiste el resultado.

---

## Variables de entorno (.env)

```env
VITE_API_BASE_URL=https://api.sassblum.com/v1
VITE_WS_URL=wss://api.sassblum.com
VITE_ENV=development
```

---

## Comandos de desarrollo

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Build de producción
npm run lint     # ESLint
npm run preview  # Preview del build de producción
```

---

## Sprint 1 — Sesiones activas (modules/auth/)

Las sesiones del Sprint 1 a completar en orden:

1. **S1** ✅ — Estructura + `IAuthService.ts` + `IRepository<User>` + `BaseValidator.ts` — **completada 2026-06-01**
2. **S5** — `LoginForm`, `RegisterForm`, `RecoverPasswordForm` (props tipadas, Chain of Responsibility)
3. **S6** — `useAuth.ts` (JWT en memoria) + `ApiClient.ts` (singleton) + `ProtectedRoute.tsx`
4. **S8** — Tests: `LoginForm.test.tsx`, `RegisterForm.test.tsx`, `useAuth` (Jest + RTL)
5. **S10** — Revisión SOLID + smoke test end-to-end del flujo completo

---

## Archivos creados en S1 (2026-06-01)

### core/ — contratos transversales

```text
src/core/interfaces/IRepository.ts   ← IRepository<T> genérico (Repository pattern, DIP)
src/core/base/BaseValidator.ts       ← BaseValidator abstract (Chain of Responsibility node)
```

### modules/auth/ — estructura completa del módulo

```text
src/modules/auth/interfaces/IAuthService.ts  ← contrato raíz (7 métodos, DIP anchor)
src/modules/auth/services/               ← AuthService.ts vendrá en S6
src/modules/auth/repositories/           ← AuthRepository.ts vendrá en S6
src/modules/auth/validators/             ← EmailValidator, PasswordValidator vendrán en S5
src/modules/auth/components/             ← LoginForm, RegisterForm vendrán en S5
src/modules/auth/hooks/                  ← useAuth.ts vendrá en S6
src/modules/auth/pages/                  ← LoginPage, RegisterPage vendrán en S5
```

### Regla de uso (DIP — obligatoria para todo el módulo)

```typescript
// CORRECTO — hook y componentes dependen de la interfaz
import type { IAuthService } from '../interfaces/IAuthService'

// INCORRECTO — dependencia de la clase concreta
import { AuthService } from '../services/AuthService'
```

Sprint actual: Sprint 4 COMPLETO ✅ · MVP navegable completo (cliente + worker + admin) · Sprint 3 ✅
> Flujo: login/registro → catálogo → crear ticket → historial/detalle → notificaciones live (WS) →
> admin: reportes (KPIs + exportar CSV/PDF/Excel) + gestión de usuarios + asignación.
> `npx tsc --noEmit` exit 0. App.tsx = composición DIP. Falta: `npm install` · `npm run dev`.
> FE de Sprint 3: S24 (TicketHistoryPage/TicketDetailPage), S25 (Forgot/ResetPasswordPage),
> S26 (NotificationBell/Panel/Item/Preferences + useNotifications + SocketClient), S27 (tests RTL).
> Nota: hooks con JSX (useTickets, useNotifications) se renombraron a `.tsx` (eran `.ts` con JSX → error de build).

---

## Sprint 2 — Sesiones activas (catalog/ + tickets/)

| Sesión | Módulo | Foco | Estado |
| --- | --- | --- | --- |
| **S11** | catalog/ | Interfaces ISP + core/ui + core/factories | ✅ 2026-06-01 |
| **S12** | tickets/ | ITicketService, IStorageService, estructura | ✅ 2026-06-01 |
| **S13** | tickets/ | ValidatorFactory + nodos de cadena | ✅ 2026-06-01 |
| **S14** | tickets/ | TicketStateMachine (Strategy) | ✅ 2026-06-01 |
| **S15** | tickets/ | ITicketClientActions, ITicketWorkerActions, ITicketAdminActions | ✅ 2026-06-01 |
| **S16** | tickets/ | TicketEvent (solo BE) | ✅ 2026-06-01 |
| **S17** | tickets/ | TicketCard, TicketDetail, TicketHistory, TicketStatusBadge, useTickets | ✅ 2026-06-01 |
| **S18** | ambos | Tests Jest + RTL + auditoría SOLID | ✅ 2026-06-01 |

---

## Sprint 3 — Sesiones activas (notifications/ + tickets/ historial + auth/ reset)

| Sesión | Módulo | Foco FE | Estado |
| --- | --- | --- | --- |
| **S19** | notifications/ | INotificationStrategy.ts · INotificationService.ts + tipos | ✅ 2026-06-01 |
| **S20–S23** | notifications/realtime | Solo backend — sin archivos FE | — |
| **S24** | tickets/ | TicketHistoryPage · TicketDetailPage | ✅ 2026-06-02 |
| **S25** | auth/ | ForgotPasswordPage · ResetPasswordPage | ✅ 2026-06-02 |
| **S26** | notifications/ | NotificationBell · Panel · Item · useNotifications · SocketClient | ✅ 2026-06-02 |
| **S27** | todos | Tests Jest + RTL · auditoría SOLID | ✅ 2026-06-02 |

---

## Archivos creados en S19 (2026-06-01)

```text
src/modules/notifications/interfaces/INotificationStrategy.ts ← validate(), send(), log()
src/modules/notifications/interfaces/INotificationService.ts  ← getUserNotifications(), markAsRead(),
                                                                  getPreferences(), setPreferences()
                                                                  Tipos: Notification, NotificationPreferences,
                                                                         NotificationTipo, PaginatedNotifications
```

---

## Archivos creados en S24–S27 (2026-06-02) — Sprint 3 FE completado

### S26 — Notificaciones (infraestructura + hook + componentes)

```text
src/infrastructure/websocket/SocketClient.ts   ← Singleton WS (connect/disconnect/subscribe)
                                                  reconexión con backoff exponencial (Observer FE)
src/modules/notifications/interfaces/types.ts  ← Notification, NotificationPreferences,
                                                  PaginatedNotifications, NotificationTipo
src/modules/notifications/hooks/useNotifications.tsx ← NotificationProvider + useNotifications
                                                  suscribe a socketClient 'notification_new' (Observer)
                                                  markAsRead/markAllAsRead optimistas · DIP via Context
src/modules/notifications/components/NotificationBell/index.tsx     ← campana + badge contador
src/modules/notifications/components/NotificationPanel/index.tsx    ← dropdown con lista
src/modules/notifications/components/NotificationItem/index.tsx     ← fila (tiempo relativo, marcar leída)
src/modules/notifications/components/NotificationPreferences/index.tsx ← toggles email/in-app/ws
```

### S24 — Páginas de historial (reutilizan componentes de S17)

```text
src/modules/tickets/pages/TicketHistoryPage/index.tsx ← tabla con filtros (estado, prioridad)
                                                         reutiliza TicketCard · DIP via useTicketsList
src/modules/tickets/pages/TicketDetailPage/index.tsx  ← wrapper de TicketDetail (carga historial)
src/modules/tickets/hooks/useTickets.tsx (renombrado de .ts) ← TicketClientProvider + hooks
```

### S25 — Recuperación de contraseña

```text
src/modules/auth/hooks/useAuthService.tsx           ← AuthServiceProvider + useAuthService (seam DIP)
src/modules/auth/pages/ForgotPasswordPage/index.tsx ← email → IAuthService.forgotPassword (sin enumerar)
src/modules/auth/pages/ResetPasswordPage/index.tsx  ← nueva contraseña + validación → resetPassword
```

### S27 — Tests FE (Jest + RTL)

```text
src/modules/notifications/components/NotificationBell/NotificationBell.test.tsx ← badge + apertura panel
src/modules/notifications/hooks/useNotifications.test.tsx ← carga, markAsRead, llegada de frame WS
```

### Decisiones de diseño FE S24–S27

- **D9:** `SocketClient` es Singleton con Observer FE — `useNotifications` se suscribe a él, no al DOM
- **D10:** Hooks con JSX (`useTickets`, `useNotifications`) DEBEN ser `.tsx` — se corrigió de `.ts` (eran error de build latente desde S17)
- **D11:** `useAuthService` (Context) es el seam DIP de auth hasta que `useAuth` (S6) aterrice — las páginas nunca importan `AuthService`
- **D12:** `markAllAsRead` es optimista: marca local primero, luego sincroniza con el servidor

---

## Runtime funcional FE cerrado (Sprint 4 · 2026-06-02)

Faltaba TODO el glue concreto (antes solo había interfaces). Ahora la app es navegable.

```text
src/infrastructure/config/env.ts        ← config tipada (VITE_API_BASE_URL, VITE_WS_URL)
src/infrastructure/http/ApiClient.ts     ← Axios Singleton + interceptores JWT
                                            (request: Bearer · response: 401→refresh→retry→logout)
                                            access token SOLO en memoria (nunca localStorage)
src/modules/auth/services/AuthService.ts ← implementa IAuthService · mapea rol/estado BE→FE
src/modules/auth/hooks/useAuth.tsx       ← AuthProvider + useAuth (JWT en memoria, cablea ApiClient)
src/modules/auth/validators/EmailValidator.ts · PasswordValidator.ts (extienden BaseValidator)
src/modules/auth/components/LoginForm · RegisterForm · ProtectedRoute (guard por rol)
src/modules/catalog/services/CatalogService.ts ← implementa ICatalogClientView
src/modules/catalog/hooks/useCatalog.tsx       ← CatalogProvider + useCatalog
src/modules/catalog/components/CatalogPage · ServiceCard · ServiceFilter
src/modules/tickets/services/TicketService.ts  ← implementa ITicketClientActions (multipart upload)
src/modules/tickets/components/FileUpload · pages/CreateTicketPage
src/modules/notifications/services/NotificationService.ts ← implementa INotificationService
src/App.tsx                              ← composición raíz (DIP): router + providers inyectan
                                            los servicios concretos · rutas públicas/protegidas + shell
```

### Decisiones de runtime FE

- **D13:** `App.tsx` es la ÚNICA frontera DIP donde se importan clases concretas (los servicios);
  todo lo demás depende solo de interfaces vía Context
- **D14:** `ApiClient` guarda el access token en memoria; el refresh token vive en `useAuth` (no localStorage)
- **D15:** Todos los servicios mapean snake_case (BE) ↔ camelCase (FE) en su capa, aislando al resto de la app
- **D16:** El flujo navegable: `/login` → `/` (catálogo) → `/tickets/new` → `/tickets/:id` → `/tickets` (historial)

---

## Features Sprint 4 FE (S28/S29/S30/S32 · 2026-06-02/03)

```text
src/modules/reports/interfaces/IReportsService.ts · services/ReportsService.ts
src/modules/reports/hooks/useReports.tsx
src/modules/reports/components/ReportsDashboard · ExportButton  ← KPIs + exportar CSV/PDF/Excel (blob download)
src/modules/auth/interfaces/IUserAdminActions.ts · services/UserAdminService.ts
src/modules/auth/pages/AdminUserPage                            ← listar/crear/bloquear usuarios (HU-14)
src/modules/tickets/services/TicketAdminService.ts             ← implementa ITicketAdminActions (assign/reassign)
src/modules/tickets/components/AssignModal                      ← admin asigna ticket a trabajador activo
src/modules/auth/hooks/useAuth.tsx (modificado)                ← conecta socketClient en login / desconecta en logout
src/App.tsx (modificado)                                       ← rutas admin /reportes y /admin/usuarios
                                                                  (ProtectedRoute roles={['ADMINISTRADOR']}) + nav admin
```

### Decisiones FE Sprint 4

- **D17:** `useAuth` conecta `socketClient` al hacer login (las notificaciones in-app llegan en vivo por WS) y lo desconecta al salir
- **D18:** `ReportsService.exportReport` descarga el archivo vía blob (`responseType: 'blob'` + `<a download>`) — sin recargar
- **D19:** Rutas admin protegidas por `ProtectedRoute roles={['ADMINISTRADOR']}` — ISP/RBAC en el cliente además del backend
- **D20:** `AssignModal` lista trabajadores vía `IUserAdminActions` y asigna vía `ITicketAdminActions` — dos interfaces ISP, ninguna mezcla
- **D21 (revisión final):** Los endpoints de COLECCIÓN del backend llevan slash final (`/api/servicios/`,
  `/api/tickets/`, `/api/notificaciones/`, `/api/usuarios/`) porque se montan con `path("")` bajo `api/<app>/`.
  Los servicios FE DEBEN llamarlos CON slash final (un POST sin slash NO se redirige y falla). Detalle/acciones
  (`/tickets/<id>`, `/tickets/<id>/asignar`) van SIN slash. Verificado con smoke test del stack HTTP completo.
- **Config local:** `frontend/.env` (raíz, lo lee Vite) → `VITE_API_BASE_URL=http://localhost:8000/api`,
  `VITE_WS_URL=ws://localhost:8000`. CORS backend permite `http://localhost:5173`. WS requiere `daphne` (no `runserver`).

### Regla de uso S19 (DIP — obligatoria)

```typescript
// CORRECTO — hook depende de la interfaz
import type { INotificationService } from '../interfaces/INotificationService'

// INCORRECTO — nunca importar la clase concreta
import { NotificationService } from '../services/NotificationService'
```

---

## Archivos creados en S11 (2026-06-01)

### core/ — infraestructura transversal completada

```text
src/core/ui/DashboardLayout/    ← sidebar + nav, solo layout (sin lógica de negocio)
src/core/ui/Button/             ← componente base reutilizable
src/core/ui/Modal/              ← componente base reutilizable
src/core/ui/Badge/              ← componente base reutilizable
src/core/factories/index.ts    ← placeholder (ValidatorFactory S13, NotificationFactory S3)
```

### modules/catalog/ — contratos ISP completos

```text
src/modules/catalog/interfaces/ICatalogService.ts    ← contrato raíz + tipos compartidos
                                                         (ServiceSummary, ServiceDetail,
                                                          ServiceCreatePayload, ServiceEditPayload)
src/modules/catalog/interfaces/ICatalogClientView.ts ← ISP: 2 métodos de browse (cliente)
src/modules/catalog/interfaces/ICatalogAdminView.ts  ← ISP: 3 métodos de gestión (admin)
src/modules/catalog/services/                        ← CatalogService.ts vendrá al implementar
src/modules/catalog/repositories/                   ← ServiceRepository.ts vendrá al implementar
src/modules/catalog/components/CatalogPage/         ← grid de servicios activos
src/modules/catalog/components/ServiceCard/         ← tarjeta individual de servicio
src/modules/catalog/components/ServiceFilter/       ← filtro categoría + búsqueda
src/modules/catalog/hooks/                          ← useCatalog.ts (usa ICatalogClientView vía DIP)
```

### Regla de uso S11 (DIP — obligatoria)

```typescript
// CORRECTO — hook usa la interfaz ISP del rol correspondiente
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'

// INCORRECTO — dependencia directa de la clase concreta
import { CatalogService } from '../services/CatalogService'
```

### Decisiones de diseño registradas

- **D1:** `ICatalogClientView` no extiende `ICatalogService` — ISP puro, consumidores distintos
- **D2:** `CatalogService` implementa ambas vistas ISP — Singleton + LSP garantizado
- **D3:** `DashboardLayout` sin lógica de routing — SRP (el routing vive en ProtectedRoute S6)
- **D4:** `ServiceSummary` y `ServiceDetail` definidos en `ICatalogService.ts` — fuente única de verdad

---

## Archivos creados en S12 (2026-06-01)

### modules/tickets/ — estructura completa + contratos raíz

```text
src/modules/tickets/interfaces/ITicketService.ts   ← contrato raíz + TODOS los tipos compartidos:
                                                      TicketEstado ('Nuevo'|'EnProceso'|'EnEspera'|
                                                                    'Resuelto'|'Cerrado')
                                                      TicketPrioridad ('Baja'|'Media'|'Alta'|'Critica')
                                                      AttachmentMeta, TicketSummary, TicketDetail,
                                                      TicketEvent, TicketCreatePayload, TicketFilterOptions
                                                      9 métodos que S15 segmentará en 3 ISP por rol
src/modules/tickets/interfaces/IStorageService.ts  ← ISP segregado: upload, delete, getUrl
src/modules/tickets/services/                      ← TicketService.ts vendrá al implementar
src/modules/tickets/repositories/                  ← TicketRepository.ts vendrá al implementar
src/modules/tickets/validators/                    ← BasicFieldValidator, FileValidator (S13)
src/modules/tickets/state_machine/                 ← TicketStateMachine.ts (S14)
src/modules/tickets/components/CreateTicketForm/   ← formulario de creación (S17)
src/modules/tickets/components/FileUpload/         ← adjuntos, delega a IStorageService (S17)
src/modules/tickets/hooks/                         ← useTickets.ts — usa ITicketClientActions (S17)
src/modules/tickets/pages/                         ← CreateTicketPage.tsx (S17)
```

### Decisiones de diseño S12

- **D5:** `IStorageService` segregado de `ITicketService` — ISP: `FileUpload` no necesita lógica de ticket
- **D6:** `TicketEstado` y todos los tipos centralizados en `ITicketService.ts` — fuente única de verdad
- **D7:** S15 creará `ITicketClientActions`, `ITicketWorkerActions`, `ITicketAdminActions` como subconjuntos ISP
- **D8:** `useTickets` dependerá de `ITicketClientActions`, nunca de `ITicketService` directamente (DIP + ISP)

---

## Archivos creados en S13 (2026-06-01)

```text
src/modules/tickets/validators/BasicFieldValidator.ts    ← extiende BaseValidator
                                                            asunto ≤80, descripcion ≥10
src/modules/tickets/validators/FileValidator.ts          ← extiende BaseValidator
                                                            tamaño ≤5MB, MIME permitido
src/modules/tickets/validators/BusinessRuleValidator.ts  ← extiende BaseValidator
                                                            horario laboral (UX pre-submit)
src/modules/tickets/validators/TicketValidatorChain.ts   ← fachada, llama ValidatorFactory
src/core/factories/ValidatorFactory.ts                   ← buildTicketChain() retorna raíz
                                                            BasicField→File→BusinessRule
                                                            OCP: Sprint 4 agrega nodo aquí
```

### Decisiones de diseño S13

- **D9:** `ValidatorFactory.ts` es el ÚNICO archivo FE que importa clases concretas de validadores
- **D10:** `BusinessRuleValidator` FE solo verifica horario (UX); la regla de duplicados vive solo en BE
- **D11:** `ValidatorFactory.buildTicketChain()` retorna `BaseValidator` — tipado genérico, no concreto

---

## Archivos creados en S14 (2026-06-01)

```text
src/modules/tickets/state_machine/TicketStateMachine.ts
    ← TicketStateMachine (clase concreta, no interfaz)
      static TRANSITIONS: Record<TicketEstado, TicketEstado[]>
        Nuevo→[EnProceso] · EnProceso→[EnEspera,Resuelto]
        EnEspera→[EnProceso] · Resuelto→[Cerrado] · Cerrado→[]
      canTransition(from, to): boolean
      transition(from, to, comment): TicketEstado
        throws 'INVALID_TRANSITION' | 'COMMENT_REQUIRED' (BR-35)
      nextStates(from): TicketEstado[]   ← usado por TicketStatusBadge (S17)
      isTerminal(state): boolean

src/modules/tickets/state_machine/index.ts
    ← re-exporta TicketStateMachine
```

### Decisiones de diseño S14

- **D13:** `TicketStateMachine` es una clase concreta inyectable — NO una interfaz ni ABC
- **D14:** `transition()` impone BR-35; `canTransition()` no — separación de responsabilidades
- **D15:** `TicketStatusBadge` (S17) usa `TicketStateMachine.TRANSITIONS` para derivar colores y botones válidos (DIP: badge no hardcodea estados)
- **D16:** Sprint 4 → `TRANSITIONS.Cerrado = ['Reabierto']` añade estado sin tocar ninguna regla existente

---

## Archivos creados en S15 (2026-06-01)

```text
src/modules/tickets/interfaces/ITicketClientActions.ts  ← ISP: createTicket, getMyTickets,
                                                            getTicketDetail
                                                            useTickets (cliente) depende de esta
src/modules/tickets/interfaces/ITicketWorkerActions.ts  ← ISP: updateStatus, addComment,
                                                            closeTicket
                                                            useTickets (worker) depende de esta
src/modules/tickets/interfaces/ITicketAdminActions.ts   ← ISP: assignTicket, reassignTicket,
                                                            getAllTickets
                                                            useTickets (admin) depende de esta
```

### Regla de uso S15 (DIP + ISP — obligatoria)

```typescript
// CORRECTO — hook usa solo la interfaz de su rol
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
// worker context
import type { ITicketWorkerActions } from '../interfaces/ITicketWorkerActions'

// INCORRECTO — el hook nunca depende del contrato raíz completo
import type { ITicketService } from '../interfaces/ITicketService'
```

### Decisiones de diseño S15

- **D17:** Ninguna interfaz ISP hereda de otra — consumidores completamente distintos
- **D18:** `TicketService` implementa las 3 ISP + `ITicketService` — Singleton con LSP garantizado
- **D19:** Sprint 2 solo ejercita `ITicketClientActions.createTicket()` — las demás son contratos S3/S4
- **D20:** `useTickets` recibirá la interfaz de su rol como parámetro — el hook cambia de contrato según el contexto del usuario

---

## Archivos creados/completados en S17 (2026-06-01)

```text
src/modules/tickets/components/TicketStatusBadge/index.tsx
    ← Badge coloreado por estado (STATUS_CONFIG record)
      OCP: nuevo estado = nueva entrada en STATUS_CONFIG

src/modules/tickets/components/TicketHistory/index.tsx
    ← Timeline de TicketEvent[] con etiquetas y estados visual
      Puramente presentacional: recibe events como prop

src/modules/tickets/components/TicketCard/index.tsx
    ← Tarjeta resumen con número, asunto, servicio, fecha, prioridad, estado
      onSelect callback (DIP: no conoce la navegación)

src/modules/tickets/components/TicketDetail/index.tsx
    ← Vista completa: header + descripción + metadatos + adjuntos + historial
      Carga datos vía useTicketDetail (DIP: depende de ITicketClientActions)

src/modules/tickets/hooks/useTickets.ts
    ← useTicketsList(filters?) → { tickets, isLoading, error, refresh, createTicket }
       useTicketDetail(ticketId) → { ticket, isLoading, error }
       TicketClientContext + TicketClientProvider (DIP: Context inyecta ITicketClientActions)
       cancelación de efectos con cleanup function (sin memory leaks)
```

### Stubs BE completados en esta sesión (nueva política: implementación completa)

```text
apps/tickets/validators/basic_field_validator.py   ← validate() implementado: asunto ≤80, descripcion ≥10
apps/tickets/validators/file_validator.py          ← validate() implementado: size + MIME check
apps/tickets/validators/business_rule_validator.py ← validate() implementado: horario laboral + duplicado
apps/tickets/validators/ticket_validator_chain.py  ← __init__ + run() implementados
core/factories/validator_factory.py               ← build_ticket_chain() implementado (imports diferidos)
core/permissions/rbac_permissions.py              ← has_permission() para IsClient, IsWorker, IsAdmin
```

### Decisiones de diseño S17

- **D21:** `TicketClientContext` + `TicketClientProvider` — DIP mediante React Context; los componentes nunca importan `TicketService` directamente
- **D22:** `useTicketsList` y `useTicketDetail` son hooks separados — SRP: uno gestiona listas, otro un detalle
- **D23:** Cleanup function en `useEffect` de `useTicketDetail` — evita setState después de unmount (sin memory leaks)
- **D24:** `ValidatorFactory.build_ticket_chain()` usa imports diferidos dentro del método — evita circular imports entre `core/` y `apps/`

---

## Archivos creados en S18 (2026-06-01)

```text
src/modules/tickets/components/CreateTicketForm/index.tsx
    ← Formulario completo: asunto · servicio · prioridad · descripción · adjuntos
      Validación con TicketValidatorChain (FE) · envía via useTicketsList.createTicket (DIP)

src/modules/tickets/components/TicketStatusBadge/TicketStatusBadge.test.tsx
    ← 6 tests: label por estado · clases CSS · aria-label

src/modules/tickets/components/CreateTicketForm/CreateTicketForm.test.tsx
    ← 10 tests: rendering · validación (campo vacío, sin servicio)
      submit exitoso (payload + onSuccess) · manejo error de servidor
      Mock de ITicketClientActions via TicketClientContext (DIP)
```
