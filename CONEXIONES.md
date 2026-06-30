# 🔌 Conexiones y puesta en marcha — SassBlum

**Fecha:** 2026-06-28
**Estado del código:** ✅ **0 errores de compilación / tests / build.** Lo único pendiente para
funcionalidad 100% es **conectar Supabase Storage** (subida real de imágenes); todo lo demás ya está
conectado y verificado.

---

## 1. ✅ Verificación actual (lo que YA funciona)

| Comprobación | Resultado |
|---|---|
| `python manage.py check` | **0 issues** |
| `python manage.py migrate` | **aplicadas** (incl. `authentication.0003_user_ruc`, `gallery.0001_initial`) |
| `pytest` (suite completa) | **105 passed, 0 failed** |
| `flake8 apps core config` | limpio (solo 4 `E402` intencionales del patrón Singleton) |
| `pylint` (código nuevo) | **0 errores** |
| `npm run build` (frontend) | **✅ build OK** (tsc -b + vite) |
| Base de datos (Supabase Postgres) | **conectada** (el `migrate` se aplicó correctamente) |
| Redis / Email / JWT | **configurados** en `backend/.env` |

> Es decir: **el programa ya corre de punta a punta.** La única pieza que queda en modo *stub* es el
> almacenamiento de archivos.

### Auditoría de recursos externos (probada con conexión real, 2026-06-28)

| Recurso | Estado | Detalle de la prueba |
|---|---|---|
| **PostgreSQL / Supabase (BD)** | ✅ Conectado | `SELECT 1` OK · `migrate` aplicado |
| **SMTP Email (Gmail)** | ✅ Conectado | login real OK en `smtp.gmail.com:587` (los correos se envían) |
| **Redis (Channels / tiempo real)** | ⚠️ No corriendo | `USE_REDIS=False` → usa `InMemoryChannelLayer` (correcto en dev de 1 proceso). El Redis configurado no responde; **solo se necesita en producción** con varios procesos/daphne. |
| **Supabase Storage (archivos)** | ❌ No conectado | `SUPABASE_URL` vacío → `StorageService` en modo **stub** (no guarda archivos). Ver §2. |
| **JWT (sesiones)** | ✅ Autocontenido | configurado en `.env` |

---

## 2. 🟠 ÚNICO pendiente: Supabase Storage (imágenes de catálogo y galería)

Hoy `StorageService` devuelve una **URL stub** (no guarda el archivo real). Las imágenes subidas
desde los paneles de **Catálogo** y **Galería** no se almacenan de verdad. Mientras tanto funciona
**pegando una URL de imagen** en el campo "URL de imagen". Para subir archivos reales:

### Pasos
1. Entra a tu proyecto en **https://supabase.com → Storage**.
2. **New bucket** → nombre `sassblum` → marca **Public bucket** → Create.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** (ej. `https://xxxx.supabase.co`)
   - **service_role key** (la secreta, *server-side*. **NUNCA** la pongas en el frontend).
4. Agrega estas 3 líneas a **`backend/.env`**:
   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...tu_service_role_key...
   SUPABASE_STORAGE_BUCKET=sassblum
   ```
5. Implementa la subida real en **`backend/apps/tickets/services/storage_service.py`** (hoy es stub,
   marcado D29). Usa el endpoint REST de Storage de Supabase:
   ```python
   # POST {SUPABASE_URL}/storage/v1/object/{bucket}/{path}
   # Headers: Authorization: Bearer {SUPABASE_SERVICE_KEY}, Content-Type: <mime>
   # URL pública: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
   ```
   > Gracias al patrón DIP (D29), **solo se toca esa clase**; el resto del sistema no cambia.

> Si NO quieres subir archivos y prefieres URLs (o WhatsApp, como pidió el cliente), **puedes dejar
> esto sin tocar**: el sistema ya es funcional sin Storage.

---

## 3. ▶️ Cómo levantar todo (local)

### Backend
```bash
cd backend
.venv\Scripts\activate                      # Windows
python manage.py migrate                    # ya aplicado, idempotente
python manage.py createsuperuser            # crea tu admin (usa correo @sassblum.com)
daphne config.asgi:application              # NECESARIO para WebSockets (no uses runserver para WS)
# (o, sin tiempo real: python manage.py runserver)
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # desarrollo (http://localhost:5173)
# o
npm run build && npm run preview   # build de producción
```

`frontend/.env` ya existe con:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

---

## 4. 🟡 Notas de producción (opcionales, no bloquean)

| Tema | Estado | Para producción |
|---|---|---|
| **WebSockets en tiempo real** | `USE_REDIS` controla el backend de Channels. En local `false` usa memoria (un solo proceso). | En prod con varios procesos: `USE_REDIS=true` + `REDIS_URL` + servir con `daphne`. |
| **Emails reales** | `EMAIL_*` configurados. En `DEBUG=True` los correos van a consola salvo que definas `EMAIL_BACKEND` SMTP. | Verifica `EMAIL_HOST_USER/PASSWORD` (App Password de Gmail de 16 chars) y `DEFAULT_FROM_EMAIL`. |
| **Headers de seguridad** | Ya activos en `settings.py` dentro de `if not DEBUG` (HSTS, SSL redirect, cookies seguras). | Asegura `DJANGO_DEBUG=False` y `ALLOWED_HOSTS` con tu dominio real. |
| **CSP (Content-Security-Policy)** | Las variables `CSP_*` existen en `settings.py` pero **no se aplican** (no hay middleware de CSP). | Si quieres CSP real: `pip install django-csp` + añadir `csp.middleware.CSPMiddleware` y migrar a su formato `CONTENT_SECURITY_POLICY`. |

---

## 5. ⚠️ Deuda de ESLint (frontend) — NO bloquea el build

`npm run build` (lo que importa para que la app funcione) **pasa sin errores**. Sin embargo,
`npm run lint` reporta ~32 avisos de **reglas de estilo muy estrictas**, **preexistentes y en todo el
proyecto** (no introducidos en los últimos cambios):

- `react-hooks/set-state-in-effect` — en **todos** los hooks de datos (`useAuth`, `useCatalog`,
  `useTickets`, `useReports`, `useNotifications`, `useCatalogAdmin`, `useGalleryAdmin`). Es el patrón
  establecido de carga de datos del proyecto.
- `react-refresh/only-export-components` — en cada archivo de Provider que exporta Provider + hook.

**No son errores de compilación** (la app construye y corre). Opciones:
1. **Recomendado:** dejarlos para un refactor dedicado (separar cada Provider en archivo aparte y mover
   las cargas a un patrón sin `setState` en efecto). Es un cambio grande y transversal.
2. **Rápido:** bajar esas 2 reglas a `warn` en `eslint.config.js` (decisión de equipo, ya que los
   patrones son intencionales).

---

## 5.1 🟢 "Errores" del IDE en archivos Python (ticket_event.py, etc.) — RESUELTO

Los subrayados rojos que veías en el editor (`E501 line too long`, `E221 multiple spaces`,
`reportUnknownVariableType` sobre `ForeignKey`) **NO eran errores reales del proyecto**:

- El IDE corría **flake8 desde la raíz** y no encontraba `backend/.flake8` (que permite 100 columnas
  e ignora `E221`). Por eso usaba la regla por defecto de 79 columnas.
- **Pylance** estaba en modo *strict* sin los *type stubs* de Django, así que marcaba los campos de
  modelo (`ForeignKey`, etc.) como "tipo desconocido" — falsos positivos.

**Solución aplicada:** se creó **`.vscode/settings.json`** que:
- Apunta flake8 a `backend/.flake8` (100 cols, ignora E221/W503) → desaparecen los E501/E221.
- Selecciona el intérprete del venv del backend.
- Pone Pylance en modo `basic` y silencia los reportes de tipos de Django → desaparecen los falsos positivos.

> **Importante:** reinicia/recarga VS Code (o "Developer: Reload Window") tras esto para que tome la
> nueva configuración. Verificación de la verdad: `cd backend && .venv\Scripts\python -m flake8 apps core config`
> sale limpio (solo 4 `E402` intencionales del patrón Singleton).

---

## 6. ✅ Checklist final "0 errores"

- [x] Backend `manage.py check` → 0
- [x] Migraciones aplicadas
- [x] `pytest` → 105/105
- [x] `flake8` limpio
- [x] `pylint` sin errores
- [x] Frontend `tsc -b` + `npm run build` → OK
- [ ] **Supabase Storage** (solo si quieres subida real de imágenes — ver §2)
- [ ] `DJANGO_DEBUG=False` + dominio en `ALLOWED_HOSTS` al desplegar a producción
