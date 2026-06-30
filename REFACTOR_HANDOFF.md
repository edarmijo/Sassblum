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
