# Despliegue, operación y recuperación

## Topología canónica

La entrega vigente usa:

- **Frontend:** Vercel, construido desde `frontend/` mediante el `vercel.json` raíz.
- **API/ASGI:** Render en `https://sassblum.onrender.com`.
- **Datos:** Supabase PostgreSQL.
- **Archivos:** Supabase Storage cuando las credenciales están configuradas.
- **Correo vigente:** relay HTTPS privado desde Render hacia SMTP cPanel, con remitente fijo
  `notificaciones@sassblum.com`. Brevo queda únicamente como reversa preparada.
- **Tiempo real:** Django Channels; Redis es obligatorio para múltiples procesos.

Docker Compose y Jenkins son una alternativa self-hosted. No forman una cadena automática con
Vercel/Render y no deben presentarse como el despliegue activo sin evidencia de ejecución.

## Variables del backend

| Variable | Requerida | Descripción |
|---|---:|---|
| `DJANGO_SECRET_KEY` | Sí | secreto aleatorio de 50+ caracteres |
| `DJANGO_DEBUG` | Sí | `False` en producción |
| `DATABASE_URL` | Sí | conexión PostgreSQL de Supabase |
| `ALLOWED_HOSTS` | Sí | hosts exactos separados por coma |
| `CORS_ALLOWED_ORIGINS` | Sí | orígenes exactos controlados |
| `WS_ALLOWED_ORIGINS` | No | se deriva de CORS en la implementación actual |
| `CSRF_TRUSTED_ORIGINS` | Recomendado | orígenes HTTPS exactos si se usa sesión/admin |
| `JWT_ACCESS_TOKEN_LIFETIME` | Sí | segundos; ejemplo `3600` |
| `JWT_REFRESH_TOKEN_LIFETIME` | Sí | segundos; ejemplo `604800` |
| `AUTH_COOKIE_SAMESITE` | Sí | `Lax` con el rewrite `/api` de Vercel |
| `AUTH_COOKIE_SECURE` | Sí | `True` en producción |
| `FRONTEND_URL` | Sí | base de enlaces de verificación/reset |
| `USE_REDIS` | Sí | `True` para más de un proceso |
| `REDIS_URL` | Condicional | requerido si `USE_REDIS=True` |
| `EMAIL_BACKEND` | Sí | un único backend: SMTP, Brevo o relay cPanel |
| `BREVO_API_KEY` | Condicional | requerido con backend Brevo |
| `CPANEL_RELAY_URL` | Condicional | endpoint HTTPS exacto del relay B14 |
| `CPANEL_RELAY_ALLOWED_HOST` | Condicional | host exacto autorizado para el relay |
| `CPANEL_RELAY_SECRET` | Condicional | secreto compartido de 32+ caracteres, sólo en paneles |
| `CPANEL_RELAY_TIMEOUT_SECONDS` | Condicional | timeout entre 0 y 60 segundos |
| `CPANEL_RELAY_MAX_PAYLOAD_BYTES` | Condicional | límite idéntico al configurado en cPanel |
| `DEFAULT_FROM_EMAIL` | Sí | remitente verificado |
| `EMAIL_REPLY_TO` | Sí | dirección de respuesta para eventos de tickets |
| `EMAIL_CC` | Sí | copia interna de los correos dirigidos al contacto del ticket |
| `EMAIL_SUPPORT_PHONE` | No | teléfono mostrado sólo si tiene valor confirmado |
| `EMAIL_SUPPORT_WHATSAPP` | No | WhatsApp mostrado sólo si tiene valor confirmado |
| `EMAIL_REQUEST_ANYDESK` | No | activa la instrucción condicional de AnyDesk |
| `SUPABASE_URL` | Condicional | proyecto de Storage |
| `SUPABASE_SERVICE_KEY` | Condicional | solo backend; nunca frontend |
| `SUPABASE_STORAGE_BUCKET` | Condicional | bucket público/privado según política |

Los archivos `.env.example` son plantillas. Los secretos viven en los paneles de Vercel, Render y
Supabase o en un gestor de secretos, nunca en Git.

La instalación y operación del relay se detalla en `deploy/cpanel-relay/README.md`. En producción
se selecciona exclusivamente
`apps.notifications.backends.cpanel_relay_backend.CpanelRelayBackend`; el secreto y las
credenciales SMTP permanecen sólo en cPanel y Render. La identidad fue comprobada el 23-08-2026:
Gmail mostró `notificaciones@sassblum.com`, enviado y firmado por `sassblum.com`, mediante TLS.

## Variables del frontend

| Variable | Producción actual |
|---|---|
| `VITE_API_BASE_URL` | `/api` |
| `VITE_WS_URL` | `wss://sassblum.onrender.com` |
| `VITE_ENV` | `production` |

`/api` mantiene la cookie first-party mediante el rewrite de Vercel. El WebSocket conecta directo
a Render.

## Despliegue del backend en Render

1. Conecta el repositorio y configura `backend/` como raíz o usa los comandos equivalentes.
2. Instala `requirements.lock` con hashes en CI; en el runtime usa las dependencias fijadas del
   proyecto.
3. Ejecuta migraciones como paso de release controlado.
4. Arranca `daphne config.asgi:application` en el puerto entregado por Render.
5. Configura los orígenes exactos y todas las variables anteriores.
6. Verifica:

```bash
curl https://sassblum.onrender.com/health/
curl https://sassblum.onrender.com/api/health/
```

Respuesta esperada: HTTP 200 con `status=healthy` y `database=ok`.

## Despliegue del frontend en Vercel

1. Conecta el mismo repositorio.
2. Usa el `vercel.json` raíz: instala y construye dentro de `frontend/`.
3. Confirma el rewrite `/api/(.*)` hacia Render.
4. Configura `VITE_WS_URL` antes del build.
5. Verifica la ruta raíz y una ruta profunda tras recargar.

### Cutover controlado de `sassblum.com`

El dominio se cambia sólo después de la aceptación y autorización específicas:

1. añade `sassblum.com` y `www.sassblum.com` al proyecto Vercel y copia exactamente los registros
   que Vercel solicite, sin modificar MX, DKIM, SPF, DMARC, `cpanel` ni `webmail`;
2. prepara en Render `FRONTEND_URL=https://sassblum.com` e incluye `https://sassblum.com` y
   `https://www.sassblum.com` en CORS/CSRF/orígenes WebSocket antes del corte;
3. cambia únicamente los registros web raíz/`www` autorizados y espera configuración válida/TLS;
4. verifica raíz, deep-link, login, refresh cookie, reset de contraseña, API, WebSocket y correo;
5. registra DNS, hora, SHA desplegado y comparación con el baseline previo.

El cambio web no autoriza tocar la entrega de correo del dominio. Si falla, restaura A/CNAME del
baseline y las variables frontend/orígenes anteriores; no borres el proyecto ni el sitio heredado.

## Migraciones

Antes de migrar:

1. registra el SHA desplegado;
2. crea respaldo de Supabase;
3. revisa si la migración es reversible;
4. evita ejecutar dos releases concurrentes.

```bash
cd backend
python manage.py showmigrations
python manage.py migrate --plan
python manage.py migrate
python manage.py check --deploy
```

No uses `flush`, no borres migraciones aplicadas y no ejecutes `seed_demo` contra producción.

## Respaldo y restauración

### Respaldo

- Usa backups administrados/PITR de Supabase cuando estén disponibles.
- Para un respaldo manual, usa `pg_dump` desde un host autorizado y cifra el archivo.
- Exporta por separado el inventario de objetos de Storage si forma parte del alcance.
- Registra fecha, tamaño, checksum, retención y responsable.

`scripts/backup_db.sh` crea un dump de formato custom, valida que `pg_restore` pueda leerlo y genera
un sidecar SHA-256. El directorio de destino debe estar cifrado en reposo y con permisos
restringidos; el script no convierte por sí solo un dump en una restauración probada.

### Restauración

1. Restaura primero en una base aislada.
2. Ejecuta `python manage.py check` y migraciones pendientes.
3. Valida conteos, relaciones, autenticación y un ticket completo.
4. Comprueba que los objetos de Storage sigan accesibles.
5. Documenta RTO/RPO observado.

Un respaldo no se considera válido hasta probar una restauración.

## Smoke test posterior al despliegue

1. Frontend y ruta profunda responden 200.
2. `/health/` indica aplicación y base saludables.
3. Registro/verificación o login controlado.
4. Cliente crea ticket.
5. Admin asigna.
6. Trabajador comenta y cambia estado.
7. Cliente recibe la actualización.
8. Admin genera reporte y exporta PDF/Excel.
9. WebSocket devuelve `101 Switching Protocols`.
10. Correo llega desde el remitente esperado.

Usa datos de prueba y elimina cualquier evidencia con PII antes de compartirla.

### Evidencia de cierre del runtime validado

El runtime validado corresponde a
`a97bb2a773aff5b708d16cba46bf73244f7064e8`, merge de la PR #23 en
`erick-plan_de_cambios`:

- Render `srv-d93dndi8qa3s73ag4dj0`, deploy live `dep-da5r2erm8hqs73dkgq90`;
- Vercel Preview de integración `9iexesG9ZkrXXWZWSGD8pwmzEQ7J`;
- health de Render, frontend de Vercel y rutas profundas: HTTP 200;
- datos reconciliados tras limpiar el smoke: 86 usuarios, 459 tickets, 407 eventos y
  0 notificaciones;
- activos públicos comprobados: 6 servicios, 27 imágenes de servicios, 8 logos y 6 proyectos;
- flujo real validado: reset/login, creación, asignación, cambio de estado, comentario,
  reportes PDF/Excel y correos al buzón controlado.

Las cuentas `info@`, `soporte@` y `notificaciones@` son buzones corporativos, no usuarios de la
aplicación. Las cuentas operativas se entregan por un canal seguro separado de Git.

El dominio público corporativo no forma parte de esta evidencia todavía: el corte se ejecuta sólo
después de la aceptación y autorización específicas.

## Observabilidad y diagnóstico

- **Render:** logs de aplicación, arranque, migración y errores 5xx.
- **Vercel:** estado del build, deployment y rewrite.
- **Supabase:** conexiones, almacenamiento, backups y límites.
- **Navegador:** consola y Network para CORS, cookies y WebSocket.

Orden de diagnóstico: health → DNS/TLS → API → base de datos → autenticación → WebSocket → correo.

## Rollback

1. Detén el rollout y registra el incidente.
2. Revierte frontend/backend al último deployment conocido.
3. Si hubo migración incompatible, aplica el plan específico; no reviertas datos a ciegas.
4. Verifica health y el flujo mínimo por rol.
5. Revoca secretos o sesiones si el incidente fue de seguridad.

Para revertir específicamente el relay de correo:

1. restaura en Render el `EMAIL_BACKEND` de Brevo previamente comprobado y su configuración;
2. ejecuta un único correo controlado y confirma recepción antes de declarar recuperado el servicio;
3. deja el relay sin tráfico y conserva temporalmente logs/estado sanitizados para diagnóstico;
4. sólo después de cerrar el incidente y con autorización, elimina paquete, subdominio y secreto.

El rollback del relay no requiere migraciones ni cambios de datos.

### Baseline previo al cambio de dominio

El 23-08-2026, antes del cutover:

- `sassblum.com` y `www.sassblum.com` respondían HTTP 200 con título `SASS BLUM` y el mismo
  SHA-256 de contenido
  `BB408A6A81533AEB26DB0996FED0609FFCD60C32FF40F1E9FE961C47844548CA`;
- `sassblum.com` resolvía a `116.202.218.251` y `www` era CNAME de `sassblum.com`;
- `cpanel.sassblum.com` y `webmail.sassblum.com` resolvían a `116.202.218.251`;
- el sitio heredado y su raíz permanecían intactos.

Si el frontend nuevo falla después del cutover, restaura esos registros, confirma el hash/título
del sitio heredado y verifica que cPanel, webmail y MX no hayan cambiado. En Render existen
deployments previos del mismo runtime con acción de rollback; en Vercel la reversa debe apoyarse
en el SHA inmutable y un redeploy, porque la retención puede eliminar previews antiguas.

### Respaldos de entrega B16

| Respaldo | Fecha | Tamaño | SHA-256 | Validación |
|---|---|---:|---|---|
| cPanel completo | 23-08-2026 | 451,634,926 bytes | `665C42C6D0775971606AF9A28E80489257D3AF6D3040C0A0F5478501578A2759` | recorrido completo del archivo `tar.gz` sin extracción |
| Supabase pre-cutover | 23-08-2026 | 191,373 bytes | `6C399C521E0C8D0C94403522A6577218C724D7106241BC7A4FE3B6CC6794B129` | restaurado previamente en base aislada y rol temporal revocado |

Los respaldos contienen información sensible, no se versionan ni se adjuntan a una release
pública. Su ubicación y responsable se registran en el manifiesto local de entrega.

## Alternativa Docker Compose

```bash
docker compose build
docker compose run --rm backend python manage.py migrate --noinput
docker compose up -d
docker compose ps
```

Para producción self-hosted:

```bash
cp docker-compose.prod.env.example /ruta/segura/sassblum-prod.env
# Completa secretos e imágenes con tag/digest inmutable; nunca confirmes ese archivo.
docker compose --env-file /ruta/segura/sassblum-prod.env -f docker-compose.prod.yml \
  run --rm backend python manage.py migrate --noinput
docker compose --env-file /ruta/segura/sassblum-prod.env -f docker-compose.prod.yml up -d
```

Ejecuta la migración una sola vez como paso de release, después del respaldo y de revisar
`migrate --plan`. El contenedor de aplicación no migra al reiniciarse.

El frontend interno escucha en `8080`; el Compose publica `80:8080`. TLS debe terminar en un proxy
externo o una configuración explícita, no en el contenedor actual.

## Transferencia al cliente

Antes del handoff, registra propietario y segundo administrador de GitHub, Vercel, Render,
Supabase, Redis, correo y dominio. Entrega runbook, backups, variables (por canal seguro), política
de soporte, licencia/cesión y contactos de emergencia. No entregues una copia comprimida del
workspace: usa un clon limpio, `git archive` o una release para excluir backups y cachés locales.

La lista de aceptación y el inventario sin secretos están en `docs/ENTREGA_CLIENTE.md`. Ningún
commit, tag o paquete sustituye la aceptación explícita de Vicky Pinto.
