# Changelog

Los cambios relevantes se documentan aquí siguiendo
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y versionado semántico cuando exista la
primera release contractual.

## [Unreleased]

### Added

- Centro de documentación, arquitectura, guía de usuario, plan de pruebas y manual de entrega.
- Política de seguridad, guía de contribución y plantillas de colaboración.
- Pruebas de exportación PDF, interfaz de reportes y barreras de seguridad para la siembra demo.
- Manual integral del cliente con fuente LaTeX modular y PDF verificable.

### Changed

- README convertido en portada profesional y alineado con el comportamiento real.
- Exportación de reportes limitada a PDF y Excel.
- Configuración de seguridad, CI y Docker preparada para un cierre verificable.
- CI ampliado con PostgreSQL, pruebas de integración y aceptación API; fixtures de aceptación
  deterministas con rutas y efectos exactos.
- Migraciones Docker separadas del arranque de la aplicación como paso controlado de release.

### Removed

- Credenciales demo, correo personal y afirmaciones no verificadas de la documentación pública.
- Exportador CSV y referencias asociadas; los formatos soportados son PDF y Excel.

## Política de publicación

Antes de convertir `Unreleased` en una versión:

1. aprobar toda la suite y smoke de producción;
2. confirmar licencia/propiedad intelectual y aceptación del cliente;
3. registrar SHA, fecha y notas de migración/rollback;
4. crear tag firmado o protegido y una release en GitHub.
