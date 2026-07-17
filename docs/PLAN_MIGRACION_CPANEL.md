# Plan de migración — Ticketera cPanel → SassBlum (nuevo sistema)

> Principio rector: **el cPanel nunca se modifica**. Todas las operaciones sobre él son de **solo lectura** (exportar, copiar, descargar). El sitio actual sigue funcionando al 100% hasta el corte final, y aun después queda intacto como respaldo.

---

## Fase 0 — Inventario (sin riesgo, solo lectura)

Objetivo: saber exactamente qué existe en el cPanel antes de mover nada.

1. Listar desde el panel de cPanel (sin editar nada):
   - Base(s) de datos MySQL: nombres, tamaño, tablas (usar phpMyAdmin solo en modo lectura).
   - Cuentas de correo y forwarders vinculados a la ticketera (ej. soporte@…).
   - Cron jobs activos (anotarlos, no tocarlos).
   - Carpetas de `public_html` relevantes: formularios, uploads/adjuntos, scripts PHP.
2. Documentar el flujo actual: qué pasa cuando alguien llena el formulario "Ticket de Servicio" (¿a qué tabla escribe?, ¿envía email?, ¿a quién?).
3. Identificar los campos reales que guarda el formulario actual: **nombre, email, empresa, RUC** (+ los que aparezcan en la tabla).

Entregable: `docs/INVENTARIO_CPANEL.md` con tablas, campos y flujos.

## Fase 1 — Exportación de datos (solo lectura)

1. phpMyAdmin → Exportar → SQL completo de la base de la ticketera (estructura + datos). Guardar con fecha: `backup_ticketera_YYYY-MM-DD.sql`.
2. Descargar la carpeta de adjuntos/uploads vía el Administrador de archivos o FTP (descarga, nunca mover/borrar).
3. Exportar además a CSV las tablas clave (clientes, tickets) para facilitar la importación.
4. Guardar dos copias: una local y una en la nube (Drive/OneDrive).

Verificación: abrir el .sql y los CSV y confirmar conteos de filas contra phpMyAdmin.

## Fase 1b — Copia del código del cPanel (solo descarga)

Objetivo: tener TODO el código fuente de la ticketera actual dentro de este proyecto para estudiar su lógica y replicarla, sin conectarnos nunca más al cPanel.

1. Desde el Administrador de archivos de cPanel (o FTP): **descargar** (nunca mover) todo `public_html/` — formularios PHP, scripts de procesamiento, plantillas de email, `.htaccess`, configuración.
2. Colocar la copia en este repo bajo `legacy_cpanel/` (agregada a `.gitignore` si contiene credenciales; extraer las credenciales a un archivo aparte que NO se sube a GitHub).
3. Auditar el código copiado: identificar cada endpoint/formulario, qué valida, a qué tabla escribe, qué emails envía y con qué formato.
4. Comparar función por función contra el sistema nuevo y producir una tabla de paridad:
   - ✅ ya cubierto por SassBlum (y mejorado)
   - 🔧 falta replicar → se implementa aquí con la arquitectura SOLID del proyecto (no se copia PHP tal cual: se replica la LÓGICA)
   - ➕ mejora extra del sistema nuevo que el original no tiene (se documenta como valor agregado)
5. Implementar los faltantes y probarlos end-to-end en Render/Supabase, en paralelo, sin que el sitio original se vea afectado.

Regla: el DNS y la página principal no se tocan hasta que la tabla de paridad esté 100% en ✅/➕ y validada.

## Fase 2 — Mapeo de datos al modelo nuevo

| cPanel (origen) | SassBlum (destino) |
| --- | --- |
| nombre | `User.first_name` (+ `last_name` si viene separado) |
| email | `User.email` (único — detectar duplicados antes) |
| empresa | `User.empresa` ✅ (campo ya agregado en esta sesión) |
| RUC | `User.ruc` |
| tickets históricos | `Ticket` (asunto, descripción, fecha, estado mapeado a la máquina de estados) |

Decisiones a tomar en esta fase:
- Estados antiguos → estados nuevos (`Nuevo/EnProceso/EnEspera/Resuelto/Cerrado`).
- Usuarios migrados entran con `estado=pendiente` y sin contraseña: se les envía email de "establecer contraseña" (reutiliza el flujo de reset ya implementado).
- Tickets huérfanos (email sin usuario) → crear usuario placeholder o asignarlos a un cliente genérico.

## Fase 3 — Script de importación (Django management command)

Crear `backend/apps/tickets/management/commands/import_cpanel.py`:

1. Lee los CSV/SQL exportados (nunca se conecta al cPanel).
2. Es **idempotente**: puede correrse varias veces sin duplicar (clave: email + fecha de ticket).
3. Modo `--dry-run` que reporta qué haría sin escribir nada.
4. Registra un log de filas importadas/omitidas/con error.

Probar primero contra una base local, nunca directo a producción.

## Fase 4 — Validación en staging

1. Correr la importación en un entorno de prueba (o base Supabase separada).
2. Verificar: conteo de usuarios y tickets = conteo del cPanel; muestreo manual de 10–20 registros; login con un usuario migrado tras establecer contraseña.
3. Probar el flujo completo: cliente migrado crea ticket → admin asigna → notificaciones.

## Fase 5 — Corte (go-live) — reversible

1. Correr la importación final contra producción (Render/Supabase) con datos exportados ese mismo día.
2. Redirigir el tráfico: en el cPanel **solo** se cambia el DNS o se agrega una redirección 301 en `.htaccess` — cambio mínimo, documentado y reversible en minutos. (Si prefieres cero cambios en cPanel: apuntar el dominio nuevo desde el registrador de dominios, sin entrar al cPanel.)
3. Mantener el cPanel intacto y activo al menos 30–60 días como respaldo de solo lectura.
4. Configurar el correo de soporte para que apunte al sistema nuevo (forwarder nuevo, sin borrar el existente).

## Fase 6 — Post-migración

- Monitorear errores (logs de Render) la primera semana.
- Comunicar a los clientes el cambio y el enlace para establecer su contraseña.
- Recién cuando todo esté validado por semanas, decidir si se archiva el contenido del cPanel (nunca borrarlo sin un backup final).

---

## Reglas de seguridad de todo el plan

1. Ninguna fase escribe, edita ni borra nada en el cPanel (única excepción opcional y reversible: la redirección de la Fase 5).
2. Backup fechado antes de cada fase que toque datos del sistema nuevo.
3. Todo script de importación tiene `--dry-run` y log.
4. El corte es reversible: si algo falla, se quita la redirección y el cPanel sigue operando como siempre.

## Guía por sección del cPanel — qué sacar en cada fase

> Todo es **solo lectura o descarga**. Ninguna acción de esta guía modifica el sitio original.

### Fase 0 — Inventario

| Sección cPanel | Herramienta | Qué obtener |
| --- | --- | --- |
| Databases | **phpMyAdmin** | Captura de la lista de bases y de las tablas de cada una (si es WordPress verás tablas `wp_...`). Anotar cuál guarda los tickets/formularios. |
| Databases | **Manage My Databases** | Captura de nombres de bases y usuarios MySQL asociados. |
| Email | **Email Accounts** | Captura de todas las cuentas (ej. soporte@, info@) — se recrearán o redirigirán al final. |
| Email | **Forwarders** | Captura de los reenvíos existentes. |
| Email | **Email Routing / Default Address** | Captura de la configuración (para saber cómo llegan hoy los correos del formulario). |
| Advanced | **Cron Jobs** | Captura de la lista completa (comandos y frecuencia). |
| Domains | **Zone Editor** | Captura de TODOS los registros DNS (A, CNAME, MX, TXT). Crítico para el corte final y para no romper el correo. |
| Domains | **Domains / Redirects** | Captura de dominios, subdominios y redirecciones configuradas. |
| Software | **Select PHP Version** | Captura de la versión PHP y extensiones activas (contexto para leer el código). |
| Domains | **WordPress Management** | Captura: versión de WordPress, plugins instalados y activos (aquí aparecerá el plugin del formulario "Ticket de Servicio"). |
| Metrics | **Errors / Awstats** | Captura de errores recientes y páginas más visitadas (nos dice qué rutas importan y cuáles redirigir). |

### Fase 1 — Exportación de datos

| Sección cPanel | Herramienta | Qué obtener |
| --- | --- | --- |
| Databases | **phpMyAdmin** | Seleccionar cada base → pestaña **Exportar** → método rápido, formato SQL → descargar como `backup_<base>_YYYY-MM-DD.sql`. |
| Databases | **phpMyAdmin** | De las tablas de tickets/clientes: pestaña Exportar → formato CSV (facilita la importación). |

### Fase 1b — Copia del código

| Sección cPanel | Herramienta | Qué obtener |
| --- | --- | --- |
| Files | **File Manager** | Entrar a `public_html` → clic derecho → **Compress** → ZIP → descargar. (Compress crea una copia, no altera nada.) |
| Files | **Backup** | Alternativa completa: "Download a Home Directory Backup" — incluye `public_html`, correos y configuración en un solo archivo. |
| Files | **FTP Accounts** | Solo si File Manager falla con archivos grandes: crear/usar una cuenta FTP para DESCARGAR (nunca subir/borrar). |

### Fases 2–4 — Mapeo, importación y staging

No requieren nada del cPanel: se trabaja solo con lo ya descargado (SQL, CSV, ZIP). Si durante la auditoría falta algo, se vuelve a las herramientas anteriores en modo lectura.

### Fase 5 — Corte (único momento con cambios, mínimos y reversibles)

| Sección cPanel | Herramienta | Acción (solo cuando TODO esté validado) |
| --- | --- | --- |
| Domains | **Zone Editor** | Apuntar el registro A/CNAME del dominio al frontend nuevo (Vercel). **No tocar los registros MX** para no romper el correo. Reversible en minutos. |
| Domains | **Redirects** | Alternativa aún más suave: redirección 301 del sitio viejo al nuevo, sin tocar DNS. |
| Email | **Forwarders** | Si se decide: agregar (no borrar) un forwarder de soporte@ hacia el flujo nuevo. |

### Fase 6 — Post-migración

| Sección cPanel | Herramienta | Qué hacer |
| --- | --- | --- |
| Metrics | **Visitors / Errors** | Revisar semanalmente que el tráfico al sitio viejo cayó y no hay errores 404 masivos por rutas sin redirigir. |
| Files | **Backup** | Backup final completo antes de cualquier decisión de archivado (que no será antes de 30–60 días). |

### Secciones que NO se tocan nunca

**IP Blocker, SSL/TLS, Imunify360, MagicSpam, Softaculous, WordPress Manager, Site Quality Monitoring, Directory Privacy, Hotlink/Leech Protection, PHP PEAR, Perl Modules, Setup Node.js App**: no forman parte de la migración. Dejarlas exactamente como están mantiene el sitio original protegido y funcionando.

---

## Qué necesito de ti para arrancar (Fases 0–1b)

- Descarga desde cPanel el contenido de `public_html/` (comprimir en .zip desde el Administrador de archivos y descargar) y colócalo en la carpeta del proyecto, p. ej. `legacy_cpanel/`.
- Exporta la base de datos desde phpMyAdmin (SQL completo) y ponla en la misma carpeta.
- Confirmar qué motor usa la ticketera actual (¿PHP + MySQL?, ¿algún plugin/CMS?).
- El dominio actual y dónde está registrado el DNS (solo para planear el corte final, no se toca aún).
