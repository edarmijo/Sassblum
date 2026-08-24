# Entrega operativa a SassBlum

## Alcance

Este documento acompaña el cierre productivo de SassBlum. No contiene contraseñas, tokens,
respaldos ni datos personales. Esos elementos se entregan por un canal seguro separado.

## Referencias verificadas

| Elemento | Referencia |
|---|---|
| Runtime validado | `a97bb2a773aff5b708d16cba46bf73244f7064e8` |
| Rama de integración | `erick-plan_de_cambios` |
| PR de integración | #23 |
| API | `https://sassblum.onrender.com` |
| Frontend previo al dominio | `https://sassblum.vercel.app` |
| Fecha de validación | 23-08-2026 |

El commit documental final y su CI se añaden al manifiesto local después de las autorizaciones de
Git. `main`, el dominio corporativo y el sitio heredado no se consideran modificados por este
documento.

## Inventario de entrega

- repositorio limpio con README, `.env.example`, despliegue, pruebas y política de seguridad;
- respaldo completo de cPanel con hash y validación de archivo;
- dump pre-cutover de Supabase con hash y restauración aislada comprobada;
- inventario de Supabase Storage y activos públicos;
- manifiesto SHA-256 local sin secretos;
- credenciales operativas en archivo separado, protegido y entregado sólo a Erick/Vicky;
- rollback de frontend, backend, correo, base de datos y dominio;
- baseline del sitio heredado antes del cutover.

`legacy_cpanel/` permanece fuera de Git. El sitio heredado no debe eliminarse: es la reversa del
dominio hasta que SassBlum acepte formalmente la nueva aplicación.

## Cuentas y buzones

Las cuentas operativas de la aplicación son la administradora Vicky y los trabajadores PJ y VJ.
Las claves iniciales se entregan por separado y deben rotarse tras la aceptación.

Para un trabajador nuevo, la administradora crea primero el buzón en cPanel y después registra la
cuenta con el mismo correo. Esa única alta deja el buzón manual activo; no existe una tercera
confirmación inicial en la aplicación. Las contraseñas del buzón y de la aplicación son diferentes.

`info@sassblum.com`, `soporte@sassblum.com` y `notificaciones@sassblum.com` son buzones
corporativos; no son usuarios de la aplicación. `notificaciones@` es el remitente fijo del sistema.

## Checklist de aceptación de Vicky Pinto

- [ ] Iniciar sesión como administradora.
- [ ] Confirmar que PJ y VJ aparecen con rol de trabajador.
- [ ] Crear, asignar, comentar y resolver un ticket controlado.
- [ ] Confirmar la recepción de los correos con identidad SassBlum.
- [ ] Abrir reportes y exportar PDF y Excel.
- [ ] Revisar servicios, galería, logos e imágenes.
- [ ] Confirmar la presentación visual en escritorio y móvil.
- [ ] Confirmar que las cuentas, datos y responsables corresponden a SassBlum.
- [ ] Autorizar el cambio de `sassblum.com` y `www`.
- [ ] Registrar aceptación, fecha y observaciones por el canal acordado.

## Secuencia final controlada

1. Aprobar el diff documental y sus verificaciones.
2. Autorizar por separado commit, push y PR.
3. Confirmar CI y deployments del SHA final.
4. Ejecutar la demostración con Vicky y registrar su aceptación.
5. Autorizar el cambio de dominio manteniendo el baseline heredado.
6. Verificar DNS, TLS, raíz, deep-link, API, correo y roles.
7. Autorizar por separado la fusión a `main`.

## Reversa

Ante un fallo, no se elimina contenido. Se restaura el DNS heredado registrado en
`docs/DEPLOYMENT.md`, se redepliega el SHA estable anterior en Vercel/Render y, si el fallo es del
correo, se activa temporalmente Brevo con un único mensaje controlado. Una restauración de base de
datos sólo procede con autorización explícita y conciliación posterior.
