# Plan Secundario (FUTURO) — Dominio, correo y retiro del sitio legado

> **Estado: NO EJECUTAR.** Este plan se activa solo cuando tú lo decidas, después de que el plan principal (`PLAN_UNIFICACION.md`) esté completo y validado en producción con usuarios reales.
> Es la única parte de todo el proyecto que algún día tocaría el cPanel, y aun entonces con cambios mínimos y reversibles.

## Prerrequisitos para activar este plan

1. Plan principal 100% completo: login obligatorio, emails con formato legado, 1.458 tickets importados y verificados.
2. Semanas de operación estable en las URLs actuales (Vercel + Render) sin incidentes.
3. Decisión de negocio tomada (tuya y de Vicky): el sitio nuevo pasa a ser el oficial en sassblum.com.

## F0 — Importación real de datos de clientes (EN PAUSA — decisión 2026-07-17)

> El comando `import_legacy` está **implementado, testeado y validado** (dry-run OK:
> 458 tickets válidos, 84 clientes, 1 fila de prueba descartada). La corrida REAL
> queda diferida deliberadamente: **no se cargan datos confidenciales de clientes
> reales hasta que la aplicación complete su fase de testing.**

Cuándo ejecutarla (prerrequisitos):

1. Testing funcional completo de la app con datos de prueba (los 3 roles, flujo entero).
2. `DJANGO_DEBUG=False` en Render (mientras esté en True, cualquier error expone información — inaceptable con datos reales en la base).
3. Decisión tuya explícita de pasar a datos reales.

Cómo ejecutarla llegado el momento:

```
python manage.py import_legacy --file "../legacy_cpanel/extracted/backup-7.17.2026_15-43-11_sassblum/mysql/sassblum_tickets.sql" --dry-run   # re-verificar
python manage.py import_legacy --file "../legacy_cpanel/extracted/backup-7.17.2026_15-43-11_sassblum/mysql/sassblum_tickets.sql"             # importar
```

Resultado esperado: 84 usuarios (estado pendiente, sin contraseña, sin emails enviados) + 458 tickets `T-LEG-1000`…`T-LEG-1458` con fechas originales. Reversible: los registros migrados son identificables (`legacy_codigo` no nulo) y pueden eliminarse en bloque si hiciera falta.

## F1 — Preparación (sin tocar cPanel)

1. Render sin sleep: plan pago o keep-alive (UptimeRobot al `/health` cada 10 min) — un sitio oficial no puede tardar 40s en despertar.
2. `DJANGO_DEBUG=False` en Render (pendiente detectado el 2026-07-17).
3. Variables listas para el dominio: `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL` aceptando `sassblum.com` además de las URLs actuales.
4. Dominio agregado en Vercel (Settings → Domains) — Vercel indicará los valores DNS exactos que se necesitarán.
5. Mapa de redirecciones 301 en `vercel.json` (rutas del sitio Muse → rutas nuevas), usando `legacy_cpanel/.../logs/` para saber qué rutas reciben tráfico.

## F2 — Prueba con subdominio (primer cambio en cPanel: 1 registro DNS nuevo)

1. Zone Editor → **agregar** (no modificar nada existente) `app.sassblum.com` CNAME → Vercel.
2. Validar todo con dominio real: login, cookies, CORS, WebSockets, emails.
3. Esto no afecta en nada al sitio actual: es un registro nuevo, borrable en un clic.

## F3 — Correo transaccional con identidad propia

Hoy los emails salen con la configuración SMTP que tenga Render. Opciones (elegir una):

- **a)** SMTP del propio hosting (`mail.sassblum.com:465`, cuenta notificaciones@): hereda el SPF/DKIM ya configurados (verificados en la zona DNS del backup). No requiere cambios DNS.
- **b)** Proveedor externo (SendGrid/Mailgun/Resend): mejor entregabilidad y métricas, pero requiere agregar registros SPF/DKIM en Zone Editor.

## F4 — Corte del dominio principal (cambio reversible de 2 registros)

1. Guardar los valores actuales (ya respaldados en el backup): `A @ → 116.202.218.251`, `www CNAME → sassblum.com`.
2. Zone Editor → cambiar `A @` y `www` a los valores que indique Vercel.
3. **Intocables:** MX, registro `mail`, SPF, DKIM, `ftp`, `_acme-challenge*` — el correo corporativo sigue en cPanel exactamente igual.
4. Rollback: restaurar los 2 valores originales (minutos).

## F5 — Post-corte

1. Rotar credenciales que viajaron en el backup y en el código legado: MySQL `sassblum_root`, correo `notificaciones@`, Gmail personal de `landingpage/send.php`.
2. Monitoreo 2 semanas: logs de Render + sección Errors del cPanel (404 → completar redirecciones).
3. Campaña "activa tu cuenta" a los clientes históricos migrados.
4. A 30–60 días: backup final; el hosting queda solo como servidor de correo y DNS.

## Qué NUNCA hace este plan

Borrar archivos del cPanel · tocar buzones de correo · cambiar nameservers · desinstalar nada · modificar la ticketera PHP. El sitio legado queda congelado como respaldo histórico.
