# SassBlum frontend

Read the root `AGENTS.md` first. It is the canonical source for architecture, conventions, routes,
and validation commands.

Frontend-specific rules:

- Use React 19, TypeScript, Vite, and Tailwind versions pinned in `package.json`.
- Never persist access or refresh tokens in web storage. The access token lives in memory; the refresh
  token is an `HttpOnly` cookie managed by the backend.
- On reload, the application may restore a valid session by exchanging that cookie for a new access
  token. The local session hint contains no credential and expires automatically.
- Components depend on typed hooks and interfaces. Avoid `any`; use `unknown` plus type guards.
- Use the shared `ApiClient` and `SocketClient` instead of creating ad hoc Axios or WebSocket clients.
- Respect `prefers-reduced-motion` and preserve keyboard and screen-reader behavior.
- Report export supports PDF and Excel only.

Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm audit --audit-level=high`, and
`npm run build` before release. Use `docs/ARCHITECTURE.md`, `docs/USER_GUIDE.md`, and
`docs/TESTING.md` for maintained behavior and verification details.
