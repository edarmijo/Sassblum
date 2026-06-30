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
