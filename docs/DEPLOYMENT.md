# Despliegue, operación y recuperación

## Topología canónica

La entrega vigente usa:

- **Frontend:** Vercel, construido desde `frontend/` mediante el `vercel.json` raíz.
- **API/ASGI:** Render en `https://sassblum.onrender.com`.
- **Datos:** Supabase PostgreSQL.
- **Archivos:** Supabase Storage cuando las credenciales están configuradas.
- **Correo:** Brevo por HTTPS en Render o SMTP en entornos que lo permitan.
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
| `EMAIL_BACKEND` | Sí | backend Django/Anymail elegido |
| `BREVO_API_KEY` | Condicional | requerido con backend Brevo |
| `DEFAULT_FROM_EMAIL` | Sí | remitente verificado |
| `EMAIL_CC` | No | destinatarios internos separados por coma |
| `SUPABASE_URL` | Condicional | proyecto de Storage |
| `SUPABASE_SERVICE_KEY` | Condicional | solo backend; nunca frontend |
| `SUPABASE_STORAGE_BUCKET` | Condicional | bucket público/privado según política |

Los archivos `.env.example` son plantillas. Los secretos viven en los paneles de Vercel, Render y
Supabase o en un gestor de secretos, nunca en Git.

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
