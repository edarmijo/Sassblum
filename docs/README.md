# Centro de documentación

Este índice separa la documentación por audiencia. Los documentos listados como canónicos deben
mantenerse sincronizados con el código; los históricos solo sirven como evidencia del proceso.

## Documentación canónica

| Documento | Audiencia | Propósito |
|---|---|---|
| [README principal](../README.md) | Todas | Visión, capacidades, inicio rápido y estado |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Desarrollo | Componentes, límites, datos, API y tiempo real |
| [USER_GUIDE.md](USER_GUIDE.md) | Cliente y usuarios | Flujos por rol y reglas operativas |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Operaciones | Vercel, Render, variables, respaldo y rollback |
| [TESTING.md](TESTING.md) | Equipo y cliente | Plan basado en riesgo, ejecución y criterios de salida |
| [client-manual-latex/](client-manual-latex/README.md) | Cliente y operaciones | Fuente versionada del manual integral de entrega |
| [REPOSITORY_BENCHMARK.md](REPOSITORY_BENCHMARK.md) | Mantenedores | Referentes y decisiones de profesionalización |
| [SECURITY.md](../SECURITY.md) | Todas | Reporte responsable y controles |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Desarrollo | Flujo de cambios y Definition of Done |

## Evidencia de proyecto e historial

- [REPARTO_EQUIPO.md](REPARTO_EQUIPO.md): reparto histórico del equipo; no es un mapa canónico del
  árbol actual.
- [FRONTEND_QUALITY_PERFORMANCE_BUDGET.md](FRONTEND_QUALITY_PERFORMANCE_BUDGET.md): presupuesto de
  calidad de la interfaz.
- [CONEXIONES.md](CONEXIONES.md): fotografía histórica de integración; los comandos y estados
  actuales están en el README y en DEPLOYMENT.
- `backend/apps/notifications/GUIA_IMPLEMENTACION_API_S20.md`: guía histórica de Sprint 20.

## Reglas editoriales

1. No publicar contraseñas, tokens, correos personales ni capturas con datos reales.
2. No afirmar cobertura, disponibilidad, RLS, CI/CD o aceptación sin evidencia verificable.
3. Registrar fecha, commit SHA y entorno cuando se publique un resultado de pruebas.
4. Mantener una sola fuente de verdad por tema y enlazarla desde los demás documentos.
5. Los ejemplos deben usar dominios reservados (`example.com`) y secretos claramente ficticios.
