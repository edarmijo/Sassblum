# Frontend de SassBlum

SPA React/TypeScript para el sitio público y los paneles de Cliente, Trabajador y Administrador.
La documentación general está en el [README raíz](../README.md) y la arquitectura completa en
[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Desarrollo

```bash
npm ci
cp .env.example .env
npm run dev
```

Variables locales recomendadas:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
VITE_ENV=development
```

## Verificación

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Estructura

```text
src/
├── core/              UI compartida, hooks y utilidades
├── infrastructure/    HTTP, WebSocket, health y configuración
└── modules/           dominios de auth, tickets, catálogo, reportes, etc.
```

Los componentes dependen de interfaces inyectadas mediante Context/hooks. El access token solo
vive en memoria y la sesión se rehidrata mediante una cookie de refresh `HttpOnly`.
