# Plan de pruebas basado en riesgo

Este documento adapta la estructura simplificada de IEEE 829 solicitada por la rúbrica. Distingue
resultados ejecutados de objetivos futuros y evita presentar inventarios como pruebas aprobadas.

## Objetivo y alcance

Validar los flujos de autenticación, autorización por rol, ciclo de tickets, notificaciones,
catálogo, reportes e interfaz. Quedan fuera de la suite automatizada actual la disponibilidad del
proveedor, la entrega real de correo, pruebas de carga y un E2E completo en navegador.

## Selección por riesgo

| Área | Riesgo | Motivo | Evidencia principal |
|---|---|---|---|
| Sesión, cookies y JWT | Alto | Compromiso de cuentas | tests de autenticación y cookie session |
| RBAC y aislamiento de tickets | Alto | Exposición o modificación de datos ajenos | tests API/servicio y aceptación |
| Máquina de estados | Alto | Pérdida de trazabilidad operativa | `test_state_machine.py` y lifecycle |
| Asignación y reasignación | Alto | Trabajo enviado al responsable incorrecto | tests API y aceptación admin |
| Adjuntos y almacenamiento | Alto | Archivos inseguros o perdidos | validators y storage tests |
| Exportación de reportes | Medio | Información incompleta o ilegible | tests PDF/Excel y frontend |
| Contenido público | Medio | Riesgo reputacional | catalog/gallery/testimonials tests |
| Animaciones y presentación | Bajo | No bloquea el proceso principal | build, lint y revisión visual |

## Niveles y herramientas

| Nivel | Herramienta | Qué demuestra |
|---|---|---|
| Estático | Flake8, ESLint, TypeScript | reglas, errores de tipos y consistencia |
| Unitario | pytest, Vitest | reglas y componentes aislados |
| Integración | pytest-django, DRF APIClient | ORM, permisos, señales y endpoints |
| Aceptación API | pytest en `tests/acceptance` | flujos por Cliente, Trabajador y Admin |
| Build | Vite | empaquetado de producción |
| Smoke | health check + recorrido manual | despliegue y dependencias externas |

## Comandos reproducibles

```bash
cd backend
python manage.py check
flake8 apps config core --max-line-length=120 --exclude=migrations
pytest -q
pytest -q --cov --cov-config=.coveragerc --cov-report=term-missing --cov-report=xml
pytest ../tests/acceptance -q

cd ../frontend
npm run lint
npm run build
npm run test
npm run test:coverage:critical
```

## Resultado de cierre local

| Ejecución | Resultado | Fecha | Entorno |
|---|---:|---|---|
| Django system check | 0 issues | 2026-08-15 | Windows, Python 3.14.6 |
| Backend | 190 passed | 2026-08-15 | PostgreSQL configurado localmente |
| Aceptación API | 51 passed | 2026-08-15 | mismo entorno |
| Frontend | 104 passed | 2026-08-15 | Vite/Vitest |
| Backend crítico: líneas/statements | 74.0% | 2026-08-15 | `pytest-cov`, 190/190 tests |
| Backend crítico: cobertura combinada con ramas | 71.1% | 2026-08-15 | `branch = True` en `.coveragerc` |
| Frontend crítico: líneas | 29.35% | 2026-08-15 | Vitest V8, 104/104 tests |
| Frontend crítico: statements | 29.07% | 2026-08-15 | Vitest V8, 104/104 tests |
| Frontend crítico: ramas | 19.96% | 2026-08-15 | Vitest V8, 104/104 tests |
| ESLint | sin errores | 2026-08-15 | `npm run lint` |
| Build | completado | 2026-08-15 | `npm run build` |

Los conteos deben actualizarse tras cualquier cambio. Para evidencia académica, captura la salida
completa junto con `git rev-parse HEAD`, fecha, rama/tag y URL del job de CI.

## Métricas

- Pass rate por suite: aprobadas / ejecutadas.
- Número de fallos y skips; un skip de riesgo alto necesita justificación.
- Defectos P0/P1 abiertos.
- Resultado de lint, typecheck y build.
- Estado del health check y del recorrido manual por rol.

La cobertura crítica del backend comprende `authentication`, `tickets`, `notifications` y
`reports`; la del frontend comprende `auth`, `tickets`, `notifications` y `reports`. Los porcentajes
anteriores son una línea base reproducible, no la cobertura de todo el repositorio. La meta académica
es 70%, pero todavía no existe un umbral bloqueante en CI. El backend supera esa referencia tanto en
líneas/statements (74.0%) como en cobertura combinada con ramas (71.1%); el frontend no la alcanza.

Las pruebas de asignación, reasignación, estados, comentarios y bloqueo usan fixtures aislados y
exigen rutas, códigos y efectos exactos; no aceptan `404/405` como éxito. Aun así, el conteo de la
suite representa aserciones API, no 51 recorridos completos en navegador. La demo por rol sigue
siendo obligatoria.

## Criterios de entrada

- Dependencias instaladas desde lockfiles.
- Variables de prueba sin secretos productivos.
- Base de datos de prueba aislada y migrada.
- Datos semilla controlados.

## Criterios de salida

1. 100% de pruebas automatizadas de riesgo alto aprobadas.
2. Cero errores de Django check, Flake8, ESLint, TypeScript y build.
3. Cero defectos P0/P1 conocidos sin decisión documentada.
4. Smoke de producción: frontend 200, `/health/` 200 y recorrido Cliente → Admin → Trabajador.
5. Evidencia fechada y trazada a SHA/tag.
6. Aceptación del cliente registrada por el canal acordado.

## Evidencia que todavía debe obtener el equipo

- Evolución SonarCloud: baseline, fin de Sprint 3 y fin de Sprint 4.
- Capturas o enlaces de CI con fecha y SHA.
- Prueba de entrega real de correo y WebSocket en producción.
- Tendencia de cobertura por SHA y decisión explícita sobre el futuro umbral bloqueante.
- Formulario de aceptación firmado y comunicaciones sanitizadas.
