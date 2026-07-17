# Auditoría del sistema legado (backup cPanel 2026-07-17)

## Qué es el sistema actual

**PHP a medida con patrón MVC casero** (no WordPress para la ticketera). PDO + MySQL + PHPMailer.

```text
public_html/
├── index.html            ← landing pública (el formulario "Ticket de Servicio" vive aquí)
├── admin/                ← panel interno
│   ├── modelo/           tickets.php, conexion.php/conexion1.php (PDO), publicaciones, galería
│   ├── controlador/      ticketscontroller.php (CRUD), mailcontroller.php (PHPMailer), login
│   └── vista/            login/, tickets/
└── mail/contact.php      ← formulario de contacto general
```

## Base de datos `sassblum_tickets` (2 tablas)

**`tickets`** — ~1.458 registros (AUTO_INCREMENT=1459):

| Campo | Tipo | Equivalente en SassBlum nuevo |
| --- | --- | --- |
| codigo | int PK AI | `Ticket.id` (guardar como `legacy_codigo` para trazabilidad) |
| fecha | datetime | `created_at` |
| usuario | varchar(100) | nombre del cliente → `User.first_name/last_name` |
| email | varchar(100) | `User.email` |
| ruc | varchar(25) | `User.ruc` ✅ |
| empresa | varchar(100) | `User.empresa` ✅ (agregado 2026-07-17) |
| asunto | varchar(250) | `Ticket.asunto` |
| mensaje | text | `Ticket.descripcion` |
| solucion | text | comentario de resolución / historial |
| estado | varchar(25) | mapear: `Abierto` → `Nuevo`; resto según valores reales del dump |

**`usuario`** — 1 solo registro: el login del admin del panel. No se migra (el sistema nuevo tiene RBAC completo).

## Flujo actual del ticket (ticketscontroller.php)

1. `opcion=ingresar`: guarda el ticket con `estado='Abierto'` + envía email al cliente vía PHPMailer (SMTP `mail.sassblum.com:465`, cuenta `notificaciones@sassblum.com`) con copia a notificaciones@. El email pide responder con capturas y el ID de Anydesk.
2. `opcion=actualizar`: el admin escribe `solucion` + cambia `estado` → email de modificación al cliente.
3. `consultatodo` / `consultafiltro`: tabla del panel admin con filtro por estado.

## Tabla de paridad — legado vs. SassBlum nuevo

| Función del legado | Estado en el sistema nuevo |
| --- | --- |
| Crear ticket (nombre, email, ruc, empresa, asunto, mensaje) | ✅ Cubierto y mejorado (registro + login, validadores en cadena, prioridad, servicio) |
| Email al crear ticket | ✅ Mejorado (Observer → email + in-app + WebSocket, plantillas HTML) |
| Email al actualizar/resolver | ✅ Mejorado (notificación por transición de estado con comentario obligatorio) |
| Estados (Abierto/…) | ✅ Mejorado (máquina de estados con 5 estados y transiciones validadas) |
| Panel admin con filtros | ✅ Mejorado (dashboards por rol, historial paginado, reportes, exportación) |
| Login admin único | ✅ Mejorado (RBAC: cliente/trabajador/admin, bloqueo por intentos, verificación email) |
| Mensaje "responda con ID de Anydesk" | 🔧 FALTA: incluir esa instrucción en la plantilla de email de ticket creado |
| Ticket sin registro previo (formulario público) | 🔧 DECIDIR: el nuevo exige cuenta. ¿Mantener creación pública de tickets o exigir registro? |
| CC a notificaciones@sassblum.com | 🔧 FALTA: agregar CC/BCC configurable en EmailNotificationStrategy |
| ➕ Extras del nuevo que el legado no tiene | Tiempo real, notificaciones in-app, preferencias, reportes PDF/CSV, historial auditado, recuperación de contraseña, WhatsApp para imágenes |

## Datos a migrar (Fase 3)

- Fuente: `legacy_cpanel/extracted/.../mysql/sassblum_tickets.sql`
- ~1.458 tickets → crear usuarios únicos por email (estado pendiente, sin contraseña → flujo "establecer contraseña") + tickets asociados con `legacy_codigo`.
- `solucion` no vacía → registrar como comentario de resolución en el historial.

## ⚠️ Seguridad — hallazgos en el código legado (razón de más para migrar)

- Credenciales de MySQL y del SMTP en texto plano dentro del código (`conexion1.php`, `mailcontroller.php`). Quedaron en la copia local — por eso `legacy_cpanel/` está en `.gitignore` y NUNCA se sube al repo.
- Sin protección visible contra SQL injection en algunos flujos ni CSRF en formularios.
- MyISAM + latin1 (sin transacciones; ojo con acentos al importar → convertir a UTF-8).
- **Acción post-migración (no ahora):** rotar la contraseña de `notificaciones@sassblum.com` y del usuario MySQL, ya que viajaron en un backup.

## Extras encontrados en el backup (contexto)

- `dnszones/sassblum.com.db` — zona DNS completa (lista para planear el corte de Fase 5).
- `cron/sassblum` — cron jobs del usuario.
- Módulos de landing: publicaciones, galería, productos (globos/decoración) — decidir si la landing nueva los reemplaza o se archivan.
