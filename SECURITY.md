# Política de seguridad

## Reporte responsable

No abras un issue público para una vulnerabilidad. Usa **Security → Advisories → Report a
vulnerability** en GitHub o contacta de forma privada al propietario del repositorio y al
responsable designado por SassBlum.

Incluye:

- componente y versión/commit afectado;
- pasos mínimos para reproducir sin datos reales;
- impacto observado;
- mitigación sugerida, si existe;
- un canal seguro de respuesta.

No adjuntes credenciales, exportaciones de clientes ni copias de bases de datos.

## Alcance

Se aceptan reportes sobre autenticación, autorización, exposición de datos, adjuntos, API,
WebSocket, configuración de despliegue y dependencias. Los problemas del sistema PHP legado deben
reportarse por separado y no probarse contra producción sin autorización escrita.

## Controles relevantes

- JWT con access token en memoria y refresh en cookie `HttpOnly`.
- CORS y orígenes WebSocket limitados a dominios configurados.
- Permisos por rol en backend y consultas filtradas por usuario.
- Validación de archivos, rate limiting y encabezados HTTPS en producción.
- Secretos fuera de Git mediante variables de entorno.

## Operación ante incidente

1. Preservar logs y registrar hora, entorno y commit.
2. Revocar sesiones y rotar el secreto afectado.
3. Contener el acceso sin destruir evidencia.
4. Corregir y añadir una prueba de regresión.
5. Validar en staging y desplegar con rollback preparado.
6. Notificar al cliente según el procedimiento acordado.

## Versiones soportadas

La versión soportada es la referencia inmutable indicada en `docs/ENTREGA_CLIENTE.md`. Hasta que
se autoricen el commit documental, el cutover y la fusión final, el runtime validado es
`a97bb2a773aff5b708d16cba46bf73244f7064e8` y `main` permanece sin cambios. Las correcciones se
preparan en ramas `erick-lote-*`, pasan CI y revisión, y se integran mediante PR; no se corrige
producción desde un workspace sin una referencia Git trazable.
