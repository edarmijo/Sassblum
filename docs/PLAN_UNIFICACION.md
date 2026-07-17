# Plan de Implementación — Lógica de negocio del cPanel dentro de SassBlum Nuevo

> Regla absoluta: **el cPanel NO se toca. Nada. Nunca en este plan.**
> Todo se implementa en el proyecto actual, ya desplegado (frontend en Vercel, backend en Render, BD Supabase), usando solo la copia local del backup (`legacy_cpanel/`).
> Requerimiento nuevo: **iniciar sesión es obligatorio para crear un ticket.**

---

## 1. Lógica de negocio del sistema legado (verificada en el código del backup)

Fuente: `legacy_cpanel/extracted/.../homedir/public_html/admin/` y `mysql/sassblum_tickets.sql`. Nada de esta sección es supuesto; todo fue leído del código.

### LN-1. Creación de ticket (`ticketscontroller.php`, caso `ingresar`)

- Datos que captura: **usuario (nombre), email, ruc, empresa, asunto, mensaje**.
- El sistema pone automáticamente: `fecha = now()`, `estado = 'Abierto'`.
- Tras insertar, obtiene el código autoincremental y se lo muestra al cliente ("Se le ha asignado el ticket #N").
- Envía email al cliente (LN-3).

### LN-2. Gestión del ticket (caso `actualizar`)

- El admin edita: `solucion` (texto de respuesta) y `estado`.
- Al guardar, envía email de modificación al cliente (LN-4).
- Consultas del panel: todas ordenadas por fecha (`consultatodo`), filtro por estado con límite (`consultafiltro`), detalle por código (`consultaxcodigo`).

### LN-3. Email de ticket creado (`mailcontroller.php` → `enviarEmail`)

- De: notificaciones@sassblum.com · Para: el cliente · **CC: notificaciones@sassblum.com** · Reply-To: notificaciones@.
- Asunto: "Ticket de servicio creado".
- Cuerpo (estructura exacta): saludo con nombre → transcripción de la consulta → "Se le ha asignado el ticket de servicio #N" → datos de contacto proporcionados (RUC, correo, empresa) → **"Por favor para agilizar el proceso, conteste este mensaje con el detalle o capturas de su problema y facilítenos el ID de Anydesk"** → firma "Soporte al usuario / SASSBLUM".

### LN-4. Email de actualización (`enviarEmailModificacion`)

- Mismo remitente/CC. Notifica al cliente el cambio, incluyendo la `solucion` escrita por el admin y el estado.

### LN-5. Datos históricos

- Tabla `tickets`: ~1.458 registros (AUTO_INCREMENT=1459), campos: codigo, fecha, usuario, email, ruc, empresa, asunto, mensaje, solucion, estado. Charset latin1.
- Tabla `usuario`: 1 solo admin (login del panel). No contiene clientes.
- En el legado los clientes NO tienen cuenta: cada ticket lleva sus datos repetidos.

---

## 2. Mapeo: lógica legada → implementación en el proyecto actual

| Lógica legada | En SassBlum nuevo | Estado |
| --- | --- | --- |
| Captura nombre/email/ruc/empresa por ticket | Se capturan **una vez en el registro** (User.nombre/apellido/email/ruc/empresa) y se autocompletan en el formulario (H#7) | ✅ Hecho (empresa agregada 2026-07-17) |
| Ticket anónimo | **Cambia por requerimiento: login obligatorio** | 🔧 T1 |
| `estado='Abierto'` inicial | `Nuevo` en la máquina de estados | ✅ Ya diseñado |
| Mostrar "#N asignado" al crear | Devolver y mostrar el ID del ticket creado en la confirmación del FE | 🔧 T2 (verificar UX actual) |
| Email creación con formato LN-3 (Anydesk, transcripción, datos) | Plantilla `ticket_creado` debe replicar ese contenido | 🔧 T3 |
| CC a notificaciones@ en todos los correos | EmailNotificationStrategy con CC configurable | 🔧 T4 |
| Email de actualización con `solucion` | Ya existe notificación por transición; el comentario obligatorio (BR-35) cumple el rol de `solucion` | ✅ Cubierto |
| Panel admin: lista + filtro por estado + gestionar | Dashboards, historial paginado y filtros ya implementados (S24, S32) | ✅ Cubierto |
| Numeración histórica #1–#1458 | Campo `legacy_codigo` en Ticket + importación | 🔧 T5–T6 |
| Clientes históricos | Alta como User pendiente + flujo "establecer contraseña" (reutiliza reset ya implementado) | 🔧 T6 |

---

## 3. Tareas de implementación (todas dentro del repo actual)

### T1 — Login obligatorio para crear ticket

1. BE: test que confirme `POST /api/tickets` → 401 sin JWT y 403 para roles no-cliente (la vista ya usa IsClient; el test lo garantiza contra regresiones).
2. FE: la ruta del formulario de ticket ya está bajo ProtectedRoute — verificar y testear.
3. FE: soportar `?next=` en el login para que un visitante que quiera crear ticket termine en el formulario tras autenticarse.

### T2 — Confirmación con número de ticket

Al crear, el FE muestra "Se te asignó el ticket #ID" (paridad con LN-1). Revisar si `onSuccess(ticketId)` ya lo hace visible; si no, añadirlo.

### T3 — Plantilla de email de creación (paridad LN-3)

Editar la plantilla HTML de ticket creado para incluir: transcripción del mensaje, datos de contacto (RUC, empresa, email), número de ticket, la instrucción de Anydesk/capturas, y la firma. (El botón WhatsApp que ya existe en el FE se mantiene como mejora.)

### T4 — CC a notificaciones@ (paridad LN-3/LN-4)

`EMAIL_CC` en settings (env var) → EmailNotificationStrategy agrega CC si está definida. Sin tocar las otras strategies (OCP).

### T5 — Campo `legacy_codigo` en Ticket

`IntegerField(null=True, unique=True)` + migración. Permite que clientes citen su número histórico.

### T6 — Comando de importación `import_legacy`

`manage.py import_legacy --file legacy_cpanel/.../mysql/sassblum_tickets.sql [--dry-run]`

1. Parsear el dump local (latin1 → UTF-8).
2. Usuarios: uno por email único (nombre, ruc, empresa del ticket más reciente; estado pendiente; sin password).
3. Tickets: con `legacy_codigo`, fecha original, asunto, mensaje→descripcion, estado mapeado (`Abierto`→`Nuevo`; el dry-run cataloga los demás valores reales antes de decidir el mapa completo), `solucion` no vacía → comentario de resolución.
4. Idempotente (email / legacy_codigo), log de resultados.
5. Orden de ejecución: dry-run local → revisión del catálogo de estados → corrida real contra Supabase.
   **Estado (2026-07-17): comando implementado y dry-run validado (458 tickets, 84 clientes). La corrida REAL está EN PAUSA por decisión del equipo — no se cargan datos confidenciales de clientes hasta completar el testing. Ver F0 de `PLAN_FUTURO_DOMINIO.md`.**
6. Los clientes migrados activan su cuenta con el flujo "olvidé mi contraseña" existente (se les comunica cuando tú decidas; no es parte de este plan técnico).

### T7 — Decisión de producto (tuya)

El formulario público "Ticket de Servicio" de la landing vieja desaparece como tal. En tu landing nueva el CTA lleva a login/registro. ¿Quieres además un formulario de contacto simple (sin ticket, solo mensaje) en la landing? Si sí, se define en qué se convierte (email, o ticket pre-llenado tras registro).

---

## 4. Qué se hace con cada parte del backup (solo lectura, ya en `legacy_cpanel/`)

| Parte | Uso en este plan |
| --- | --- |
| `admin/` (código PHP ticketera) | Fuente de la lógica LN-1…LN-4. No se porta código; ya está replicado arriba |
| `mysql/sassblum_tickets.sql` | Insumo de T6 (importación) |
| `index.html`, `img/`, `SASS_BLUM PRESENTACION.pdf` | Cantera de contenido (textos/imágenes/logos) para tu landing React si los quieres reutilizar — opcional, a tu pedido |
| `landingpage/`, `plugins/`, `mail/contact.php` | Nada. Solo referencia |
| Correo, DNS, SSL, logs, config del hosting | **Nada. No forman parte de este plan.** El cPanel sigue exactamente como está |

Nota de seguridad (solo informativa, sin acción sobre cPanel): el backup contiene credenciales en texto plano (MySQL, notificaciones@, un Gmail personal en `landingpage/send.php`). Por eso `legacy_cpanel/` está en `.gitignore`. Cuándo y si rotarlas es decisión tuya, fuera de este plan.

---

## 5. Orden de ejecución propuesto

| Paso | Tareas | Resultado verificable |
| --- | --- | --- |
| 1 | T1 + T2 | Tests de auth verdes; crear ticket exige login y muestra #ID |
| 2 | T3 + T4 | Email de prueba con formato legado + CC |
| 3 | T5 | Migración de esquema aplicada en Supabase |
| 4 | T6 dry-run | Catálogo de estados reales + conteo 1.458 confirmado |
| 5 | T6 real | Tickets históricos visibles en el panel admin |
| 6 | T7 (tu decisión) | Landing con CTA definitivo |

Cada paso termina con `manage.py check`, `pytest`, `tsc --noEmit` y deploy automático (push → Render/Vercel).
