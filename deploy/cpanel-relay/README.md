# Relay de correo SassBlum para cPanel

Este paquete implementa el transporte de **Lote E / B14**: Django entrega por HTTPS un correo ya
renderizado y este receptor lo envía por el SMTP de cPanel. No define asuntos, saludos, cierres,
teléfono, WhatsApp ni plantillas; esos contenidos pertenecen a **B4**.

## Estado de activación

El código no habilita por sí solo el correo productivo. Antes de activarlo deben cumplirse todos
estos puntos:

1. B4 y B14 aceptados e integrados en la rama común de Lote E.
2. Configuración Django compartida reconciliada con B4.
3. Versión de PHP, extensiones, dominio, certificado TLS y credenciales SMTP comprobados en cPanel.
4. Secreto distinto para el relay almacenado en cPanel y Render, nunca en Git.
5. Prueba controlada extremo a extremo y plan de reversa aprobados.

No se importan correos históricos, plantillas ni datos del backup. El backup sólo sirve como fuente
de requisitos; el paquete no se instala dentro del sistema legado ni reutiliza su PHPMailer.

## Contrato y controles

El endpoint acepta únicamente `POST` por HTTPS con `Content-Type: application/json` y la cabecera
`X-SassBlum-Relay-Secret`. El JSON versión 1 contiene:

```json
{
  "version": 1,
  "message_id": "UUID-v4",
  "subject": "Asunto ya definido por Django",
  "to": ["destinatario@example.com"],
  "cc": [],
  "reply_to": [],
  "text_body": "Versión de texto",
  "html_body": "<p>Versión HTML</p>"
}
```

El contrato no admite remitente, BCC, adjuntos ni cabeceras libres. El remitente se toma siempre de
la configuración privada del servidor. Además aplica:

- comparación constante del secreto;
- validación estricta de campos, UUID, emails, asunto y tamaño;
- límite por minuto y por hora con estado bloqueado por archivo;
- idempotencia temporal por `message_id`;
- SMTP autenticado con TLS, validación de certificado y remitente fijo;
- respuestas y errores sin detalles internos;
- log rotado con identificador, hash de destinatarios y resultado, sin asunto, cuerpo, direcciones o
  secretos.

Respuestas normales: `200 sent`, `200 duplicate`, `401`, `413`, `415`, `422`, `429`, `502` o `500`.
Django sólo considera entregado un `200` JSON cuyo identificador coincida.

## Requisitos del hosting

- PHP 7.4 o posterior; confirmar la versión real antes del despliegue.
- Extensiones `ctype`, `filter`, `hash`, `json`, `mbstring` y `openssl`.
- Composer 2 durante la preparación del artefacto.
- Subdominio HTTPS dedicado; el `DocumentRoot` debe apuntar exactamente a `public/`.
- Cuenta SMTP cPanel autorizada, prevista como `notificaciones@sassblum.com` sólo después de
  verificar que exista y pueda enviar.

PHPMailer se instala desde `composer.lock`; no se copia la versión 6.8.1 encontrada en el backup.

## Preparación del artefacto

Desde una referencia Git aceptada e inmutable:

```bash
cd deploy/cpanel-relay
composer validate --strict --no-check-publish
composer install --no-dev --no-interaction --prefer-dist --no-plugins --classmap-authoritative
composer check-platform-reqs --no-dev
composer audit --locked --no-interaction
composer check
```

El directorio `vendor/` generado forma parte del artefacto que se sube a cPanel, pero permanece
ignorado por Git. No subir `tests/`, `config/relay.example.php` ni archivos de desarrollo si el
proceso de publicación construye un artefacto mínimo.

## Configuración privada en cPanel

1. Copiar `config/relay.example.php` como `config/relay.php`.
2. Generar un secreto aleatorio de 32 bytes o más y copiarlo por un canal seguro a Render:

   ```bash
   php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'
   ```

3. Completar buzón, contraseña, host y puerto SMTP reales.
4. Mantener SMTP implícito TLS en el puerto configurado; el adaptador usa `SMTPS` y no acepta
   certificados autofirmados.
5. Dejar `config/relay.php` con permiso `0600` y `runtime/` con `0700`, según lo permita cPanel.
6. Si la configuración vive fuera del paquete, definir `SASSBLUM_RELAY_CONFIG` con su ruta absoluta.

Nunca enviar el secreto en un ticket, captura, log o comando que quede en historial compartido. El
archivo real está ignorado y no debe entrar en commits ni artefactos públicos.

## Configuración futura en Render/Django

La activación debe reconciliar estas variables con los cambios de B4 en `backend/config/settings.py`
y `backend/.env.example`; B14 no modifica esos dos archivos mientras el trabajo paralelo siga abierto:

| Variable | Propósito |
|---|---|
| `EMAIL_BACKEND` | `apps.notifications.backends.cpanel_relay_backend.CpanelRelayBackend` |
| `DEFAULT_FROM_EMAIL` | mismo buzón fijo configurado en cPanel |
| `CPANEL_RELAY_URL` | URL HTTPS exacta del endpoint |
| `CPANEL_RELAY_ALLOWED_HOST` | host exacto permitido, sin esquema ni ruta |
| `CPANEL_RELAY_SECRET` | secreto compartido de 32 caracteres o más |
| `CPANEL_RELAY_TIMEOUT_SECONDS` | espera de conexión/lectura, entre 0 y 60 |
| `CPANEL_RELAY_MAX_PAYLOAD_BYTES` | mismo máximo configurado en PHP |

No deben coexistir SMTP directo, Brevo y relay como rutas ambiguas en producción: el valor efectivo
de `EMAIL_BACKEND` determina una sola ruta.

## Verificación y observabilidad

Antes del smoke test funcional:

1. comprobar resolución DNS y certificado del subdominio;
2. comprobar que HTTP sin TLS sea rechazado;
3. comprobar `405`, `415`, `401`, `422` y `413` sin usar destinatarios reales;
4. enviar un único correo controlado y confirmar `200 sent` con el mismo `message_id`;
5. repetir exactamente ese ID y confirmar `200 duplicate` sin segundo correo;
6. confirmar remitente, asunto, texto/HTML y llegada a bandeja o spam;
7. revisar que `runtime/relay.log` no contenga PII ni secretos;
8. observar logs de Django y cPanel sin copiar contenido sensible.

La prueba SMTP real no se ejecuta desde CI: requiere el hosting y credenciales de Vicky. CI sí valida
PHP 7.4, manifiesto, lock, plataforma, auditoría, sintaxis y pruebas aisladas.

## Rotación y reversa

- Para rotar el secreto, coordinar un corte breve: actualizar primero cPanel, después Render y hacer
  un smoke test. No mantener dos secretos indefinidamente.
- Para rotar la contraseña SMTP, cambiar sólo `config/relay.php` y probar el endpoint.
- Si la activación falla, restaurar en Render el `EMAIL_BACKEND` previamente documentado; conservar
  el relay sin tráfico para diagnóstico y no borrar logs o estado hasta cerrar el incidente.
- La reversa no implica tocar datos ni migraciones: B14 no agrega modelos, tablas ni endpoints DRF.
