# Guía de usuario

## Acceso

La aplicación pública está en [sassblum.vercel.app](https://sassblum.vercel.app/). Cada persona
debe usar una cuenta propia; las cuentas de demostración son solo para entornos controlados.

## Cliente

### Crear una solicitud

1. Inicia sesión y abre **Crear ticket**.
2. Selecciona el servicio y la prioridad.
3. Escribe un asunto específico y una descripción que permita diagnosticar el problema.
4. Adjunta evidencia permitida si aplica.
5. Envía la solicitud y conserva el número generado.

El ticket nace en `Nuevo`. El cliente puede consultar su detalle, historial y notificaciones, pero
no asignar trabajadores ni alterar estados operativos.

### Información recomendada

- Qué equipo o servicio está afectado.
- Desde cuándo ocurre.
- Impacto en la operación.
- Mensaje de error exacto y pasos ya intentados.
- Evidencia sin contraseñas, documentos privados ni datos de terceros.

## Trabajador

1. Revisa el panel de tickets asignados.
2. Abre el detalle y lee todo el historial antes de actuar.
3. Añade un comentario con diagnóstico, actividad o dependencia.
4. Cambia el estado y explica el motivo; el sistema no acepta comentarios vacíos.
5. Usa `EnEspera` solo cuando exista una dependencia concreta e identifícala en el comentario.
6. Marca `Resuelto` cuando la solución esté aplicada y documentada.

`Cerrado` puede reabrirse. La reapertura debe indicar por qué el caso volvió a operación.

## Administrador

### Triage y asignación

1. Revisa tickets `Nuevo` y valida servicio, prioridad e impacto.
2. Asigna un trabajador; la asignación inicial inicia `EnProceso`.
3. Reasigna cuando cambie el responsable y deja trazabilidad del motivo.
4. Supervisa tickets en espera y casos reabiertos.

### Usuarios y contenido

El administrador puede crear usuarios internos, bloquear o desbloquear cuentas y gestionar
servicios, galería, logos y testimonios. Un bloqueo debe tener una justificación operativa y no
reemplaza la baja formal de una cuenta.

### Reportes

El panel de reportes permite filtrar KPIs y exportar PDF o Excel. Antes de compartir una
exportación, revisa que el destinatario esté autorizado y que el archivo no contenga datos que no
necesita.

## Significado de los estados

| Estado | Uso esperado |
|---|---|
| `Nuevo` | Registrado, todavía sin asignación |
| `EnProceso` | Existe un responsable y trabajo activo |
| `EnEspera` | Bloqueado por cliente, proveedor, acceso o insumo identificado |
| `Resuelto` | Solución aplicada y documentada |
| `Cerrado` | Cierre administrativo; se puede reabrir si el problema continúa |

## Soporte y privacidad

- No envíes contraseñas ni tokens dentro de un ticket.
- Usa el historial del ticket para información operativa; evita datos personales innecesarios.
- Ante una posible vulnerabilidad, sigue [SECURITY.md](../SECURITY.md) y no la publiques como ticket.
