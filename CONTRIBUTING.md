# Contribuir a SassBlum

## Flujo

1. Crea una rama desde `main` con prefijo `feat/`, `fix/`, `docs/`, `test/` o `chore/`.
2. Mantén cada cambio enfocado y sigue las convenciones de `AGENTS.md`.
3. Añade o actualiza pruebas y documentación cuando cambie el comportamiento.
4. Ejecuta la verificación local.
5. Abre un PR con impacto, evidencia, riesgos y rollback.
6. Requiere al menos una revisión y CI verde antes de fusionar.

## Verificación mínima

```bash
cd backend
python manage.py check
flake8 apps config core --max-line-length=120 --exclude=migrations
pytest

cd ../frontend
npm run lint
npm run build
npm run test
```

Para cambios de permisos, tickets, asignación o reportes, ejecuta también:

```bash
cd backend
pytest ../tests/acceptance
```

## Convenciones

- Commits convencionales: `tipo(scope): descripción`.
- Python con type hints y responsabilidades separadas.
- TypeScript sin `any`; componentes con export nombrado.
- No importes servicios concretos directamente desde componentes.
- Respeta `prefers-reduced-motion` en animaciones.
- No añadas secretos, datos reales, evidencia privada ni cuentas demo con contraseña fija.

## Definition of Done

- Criterios de aceptación demostrables.
- Pruebas, linters y build aprobados.
- Sin regresiones P0/P1 conocidas.
- Documentación y `.env.example` actualizados.
- Migración y rollback definidos cuando aplica.
- Capturas y logs sanitizados.
- Revisión aprobada y CI verde.
