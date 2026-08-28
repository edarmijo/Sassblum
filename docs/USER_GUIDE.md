# Guía de Usuario - SassBlum

**Sistema de Gestión de Tickets**

---

## 1. Acceso al Sistema

La aplicación está disponible en: **sassblum.vercel.app**

Cada persona debe usar una cuenta propia con su correo electrónico y contraseña. Las cuentas de demostración son solo para entornos controlados de prueba.

---

## 2. Roles del Sistema

| Rol | Responsabilidades |
|-----|-------------------|
| **Cliente** | Crear tickets, dar seguimiento a sus solicitudes, recibir notificaciones |
| **Trabajador** | Atender tickets asignados, actualizar estados, agregar comentarios |
| **Administrador** | Asignar tickets, gestionar usuarios, configurar servicios, generar reportes |

---

## 3. Cliente

### 3.1 Registro de Cuenta

**Requisitos importantes:**
- La **identificación** (RUC o cédula) es **obligatoria** para registrarse
- El **nombre de la empresa** es obligatorio
- La contraseña debe tener al menos **8 caracteres**

**Pasos para registrarse:**
1. Ir a la página de inicio
2. Hacer clic en "Registrarse"
3. Completar todos los campos del formulario:
   - Nombre y apellido
   - Tipo de identificación (RUC o Cédula)
   - Número de identificación (obligatorio)
   - Nombre de la empresa (obligatorio)
   - Correo electrónico
   - Contraseña y confirmación
4. Hacer clic en "Registrar"

**Verificación:**
- El sistema valida el formato de la identificación según el tipo elegido
- Si falta la identificación o la empresa, se muestra un mensaje de error
- Si las contraseñas no coinciden, el registro se rechaza
- Recibirás un **correo de verificación**: debes abrir su enlace antes de poder
  iniciar sesión. Hasta entonces el acceso se rechaza con el mensaje
  "Debes verificar tu correo antes de iniciar sesión"

---

### 3.2 Inicio de Sesión

**Pasos:**
1. Ir a la página de inicio
2. Ingresar correo electrónico y contraseña
3. Hacer clic en "Iniciar Sesión"

**Restricciones de acceso:**
- Como **Cliente**, solo puedes ver tus propios tickets
- No puedes ver tickets de otros clientes
- No puedes asignar trabajadores ni cambiar estados operativos

---

### 3.3 Crear un Ticket

**Pasos:**
1. Iniciar sesión como **Cliente**
2. Hacer clic en "Crear Ticket"
3. Completar el formulario:
   - **Título/Asunto:** Específico y descriptivo
   - **Servicio:** Seleccionar del catálogo disponible
   - **Prioridad:** Alta, Media o Baja
   - **Descripción:** Explicar el problema detalladamente
   - **Evidencias:** Adjuntar archivos (capturas de pantalla, documentos)
4. Hacer clic en "Enviar"

**El ticket nace en estado: Nuevo**

---

### 3.4 Información Recomendada al Crear un Ticket

Para facilitar la resolución, incluye en la descripción:

- ¿Qué equipo o servicio está afectado?
- ¿Desde cuándo ocurre el problema?
- ¿Cuál es el impacto en la operación?
- Mensaje de error exacto (si aplica)
- Pasos que ya intentaste para resolverlo

**Importante:** No incluyas contraseñas, documentos privados ni datos de terceros en las evidencias.

---

### 3.5 Consultar Tickets

**Pasos:**
1. Iniciar sesión como **Cliente**
2. Ir al panel principal
3. Verás todos tus tickets en una lista
4. Cada ticket muestra:
   - Número de ticket
   - Título
   - Estado actual
   - Fecha de creación
   - Trabajador asignado (si aplica)

**Ver detalles de un ticket:**
1. Hacer clic en el ticket deseado
2. Podrás ver:
   - Toda la información del ticket
   - Historial completo de cambios
   - Comentarios del trabajador
   - Notificaciones recibidas

---

### 3.6 Notificaciones por Correo (Cliente)

Recibirás correos automáticos cuando:

| Evento | Contenido del Correo |
|--------|---------------------|
| **Creación de ticket** | Número de ticket, resumen, pasos a seguir, datos de contacto |
| **Asignación** | Te notifican que tu ticket ha sido asignado a un trabajador |
| **Actualización de estado** | Te informan cuando el estado de tu ticket cambia (EnProceso, Resuelto, Cerrado) |
| **Comentario** | Recibes notificación cuando el trabajador agrega un comentario |

---

### 3.7 Seguimiento y Cierre

**El cliente puede:**
- Consultar el detalle de sus tickets
- Ver el historial completo de su ticket
- Recibir notificaciones de cambios
- Verificar que su ticket ha sido resuelto

**El cliente NO puede:**
- Asignar trabajadores
- Cambiar estados de tickets
- Ver tickets de otros clientes

---

## 4. Trabajador

### 4.1 Panel de Trabajador

**Pasos para iniciar:**
1. Iniciar sesión como **Trabajador**
2. Verás el panel con:
   - Tickets asignados a ti
   - Tickets pendientes
   - Notificaciones de nuevas asignaciones
   - Indicadores de carga de trabajo

---

### 4.2 Revisar y Atender un Ticket

**Pasos:**
1. Abrir el ticket desde el panel
2. Leer todo el historial antes de actuar
3. Revisar:
   - Descripción del problema
   - Evidencias adjuntas
   - Comunicación previa
   - Estado actual

---

### 4.3 Agregar Comentarios

**Pasos:**
1. Abrir el ticket
2. Escribir comentario con:
   - Diagnóstico del problema
   - Actividad realizada
   - Dependencias identificadas
   - Próximos pasos
3. El comentario queda registrado en el historial

---

### 4.4 Cambiar Estado del Ticket

**Estados disponibles:**

| Estado | Cuándo Usarlo |
|--------|---------------|
| **Nuevo** | Ticket registrado, sin asignación. El trabajador no puede cambiarlo: sale de `Nuevo` solo con la primera asignación |
| **EnProceso** | Trabajo activo. Lo fija la asignación del administrador; el trabajador vuelve a él al retomar un ticket |
| **EnEspera** | Cuando hay dependencia externa (cliente, proveedor, acceso, insumo) |
| **Resuelto** | Cuando la solución está aplicada y documentada |
| **Cerrado** | Cuando el ticket se cierra administrativamente |

**Reglas importantes:**
- **EnEspera** solo cuando existe una dependencia concreta e identificada en el comentario
- **Resuelto** requiere explicar qué se hizo
- **Cerrado** se puede reabrir si el problema continúa

**Pasos para cambiar estado:**
1. Abrir el ticket
2. Seleccionar nuevo estado
3. **Agregar comentario obligatorio** explicando el motivo
4. Hacer clic en "Actualizar"

---

### 4.5 Notificaciones por Correo (Trabajador)

Recibirás correos automáticos cuando:

| Evento | Contenido del Correo |
|--------|---------------------|
| **Asignación** | Te asignan un nuevo ticket |
| **Reasignación** | Te transfieren un ticket de otro trabajador |
| **Comentario** | El cliente u otro trabajador agrega un comentario |

---

### 4.6 Reapertura de Tickets

**Los tickets cerrados pueden reabrirse si:**
- El problema persiste después de la solución
- El cliente reporta que la solución no funcionó
- Se identifica una causa adicional

**Requisito:** Debes indicar por qué el caso volvió a operación en el comentario.

---

## 5. Administrador

### 5.1 Panel de Administrador

**Pasos para iniciar:**
1. Iniciar sesión como **Administrador**
2. Verás el panel con:
   - Todos los tickets del sistema
   - Tickets Nuevos (para asignar)
   - Tickets en Espera (para supervisar)
   - Tickets Reabiertos
   - Gestión de usuarios
   - Gestión de servicios
   - Reportes

---

### 5.2 Triage y Asignación de Tickets

**Pasos para asignar:**
1. Revisar tickets en estado **NUEVO**
2. Validar:
   - Servicio seleccionado
   - Prioridad
   - Impacto en la operación
   - Información proporcionada
3. Seleccionar el ticket
4. Hacer clic en "Asignar"
5. Seleccionar el trabajador disponible
6. Confirmar asignación

**La asignación cambia el estado a: EnProceso**

---

### 5.3 Reasignación de Tickets

**Cuándo reasignar:**
- Cambio de responsabilidad
- Rotación de personal
- Especialización técnica
- Carga de trabajo

**Pasos:**
1. Abrir el ticket asignado
2. Hacer clic en "Reasignar"
3. Seleccionar nuevo trabajador
4. **Agregar comentario** con el motivo de la reasignación
5. Confirmar

**Requisito:** Dejar trazabilidad del motivo de reasignación.

---

### 5.4 Supervisión y Control

**El administrador supervisa:**
- Tickets en estado **EnEspera**
- Tickets que han sido **Reabiertos**
- Tickets con tiempo prolongado sin actualización
- Carga de trabajo de los trabajadores
- Indicadores de desempeño

---

### 5.5 Gestión de Usuarios

**El administrador puede:**
- Crear usuarios internos (Trabajadores y Administradores)
- Bloquear o desbloquear cuentas
- Revisar actividad de usuarios

**Reglas importantes:**
- Un bloqueo debe tener una **justificación operativa**
- El bloqueo no reemplaza la baja formal de una cuenta

---

### 5.6 Gestión de Servicios y Catálogo

**Pasos para gestionar servicios:**
1. Ir a la sección "Servicios"
2. Podrás:
   - **Crear** nuevo servicio con:
     - Nombre
     - Categoría
     - Descripción corta
     - Descripción detallada
     - Imagen (por URL o archivo)
   - **Editar** servicios existentes
   - **Ocultar/Mostrar** servicios
   - **Eliminar** servicios

---

### 5.7 Gestión de Galería y Contenido

**El administrador puede gestionar:**
- **Galería de imágenes:** Agregar, editar, ocultar/mostrar y eliminar elementos
- **Carrusel de logos/clientes:** Agregar y mostrar logos de clientes
- **Testimonios:** Revisar, aprobar y publicar testimonios de clientes

---

### 5.8 Generación de Reportes

**Acceso:**
1. Ir a la sección "Reportes"
2. Aplicar filtros deseados

**Filtros disponibles:**
- Por estado del ticket
- Por fecha (rango)
- Por servicio
- Por cliente
- Por RUC
- Por nombre de empresa
- Por trabajador asignado

**Columnas del reporte:**

| Columna | Descripción |
|---------|-------------|
| ID | Número único del ticket |
| Cliente | Nombre del cliente |
| RUC | RUC de la empresa cliente |
| Empresa | Nombre de la empresa |
| Servicio | Servicio solicitado |
| Técnico | Trabajador asignado |
| Estado | Estado actual del ticket |
| Fecha Creación | Fecha de creación |
| Fecha Resolución | Fecha de resolución |
| Comentarios | Observaciones del proceso |

**Exportación:**
- **PDF** para presentación formal
- **Excel/CSV** para análisis de datos

---

### 5.9 Notificaciones por Correo (Administrador)

Recibirás correos cuando:
- Un nuevo ticket es creado (para asignación)
- Un ticket es reabierto
- Hay tickets en espera con dependencias

---

## 6. Significado de los Estados

| Estado | Uso Esperado | Quién Puede Cambiarlo |
|--------|--------------|-----------------------|
| **Nuevo** | Ticket registrado, todavía sin asignación | Estado inicial; sale de aquí solo con la primera asignación del administrador |
| **EnProceso** | Existe un responsable y trabajo activo | Administrador, Trabajador |
| **EnEspera** | Bloqueado por cliente, proveedor, acceso o insumo identificado | Trabajador |
| **Resuelto** | Solución aplicada y documentada | Trabajador |
| **Cerrado** | Cierre administrativo (se puede reabrir si el problema continúa) | Trabajador, Administrador |

---

## 7. Notificaciones por Correo

### 7.1 Tipos de Notificaciones

| Evento | Destinatario | Contenido |
|--------|--------------|-----------|
| Creación de ticket | Cliente | Número de ticket, resumen, pasos a seguir, datos de contacto |
| Asignación de ticket | Trabajador y Cliente | Ticket asignado, responsable |
| Actualización de estado | Cliente | Cambio de estado y motivo |
| Comentario agregado | Todas las partes involucradas | Nuevo comentario en el ticket |
| Reasignación | Trabajador anterior y nuevo | Cambio de responsable y motivo |
| Ticket resuelto | Cliente | Solución aplicada y documentación |

### 7.2 Recomendaciones

**Para clientes:**
- Revisa tu correo después de crear un ticket
- Confirma que recibes las notificaciones de actualización
- Si no recibes correos, verifica tu carpeta de spam

**Para trabajadores:**
- Revisa tu correo al inicio de tu jornada
- Atiende las asignaciones nuevas oportunamente

**Para administradores:**
- Supervisa que los correos estén llegando correctamente
- Verifica la configuración del correo si hay problemas

---

## 8. Soporte y Privacidad

### 8.1 Buenas Prácticas

- **No envíes contraseñas ni tokens** dentro de un ticket
- Usa el historial del ticket solo para información operativa
- Evita datos personales innecesarios (cédulas, direcciones completas, etc.)
- Las evidencias adjuntas no deben contener información confidencial

### 8.2 Seguridad

- Si encuentras una vulnerabilidad, sigue **SECURITY.md**
- No publiques vulnerabilidades como tickets
- Reporta incidentes de seguridad al administrador directamente

### 8.3 Consideraciones de Privacidad

- Los tickets pueden ser vistos por el equipo asignado
- El historial queda registrado para auditoría
- Los datos personales se manejan según políticas de privacidad
- Los reportes exportados deben compartirse solo con personal autorizado

---
