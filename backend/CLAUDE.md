# SassBlum backend

Read the root `AGENTS.md` first. It is the canonical source for architecture, conventions, routes,
ticket transitions, and validation commands.

Backend-specific rules:

- Use Django 6, Django REST Framework, Channels, PostgreSQL, and Redis as pinned in the requirements
  files. Never hardcode configuration or credentials.
- Keep HTTP views thin. Business rules belong in services and ORM access belongs in repositories.
- Add type hints to function signatures and mark database tests with `@pytest.mark.django_db`.
- The refresh token is accepted only from the `HttpOnly` cookie; responses expose only the short-lived
  access token to JavaScript.
- Ticket status and assignment use `PATCH /api/tickets/:id/estado` and
  `PATCH /api/tickets/:id/asignar`. Closed tickets can be reopened by authorized staff.
- Report export supports PDF and Excel only.
- `seed_demo` requires `--confirm-demo` and must never run in production.
- Migrations are an explicit release step, not part of container startup.

Use `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, and `docs/TESTING.md` for maintained operational
documentation. Historical sprint notes are not current contracts.
