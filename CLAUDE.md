# CLAUDE.md - SassBlum

`AGENTS.md` is the canonical project context for coding assistants. Read it before changing the
repository and treat the code, automated tests, and canonical documents under `docs/` as the source
of truth.

## Current documentation

- `README.md`: product entry point and local quickstart.
- `docs/README.md`: documentation map by audience.
- `docs/ARCHITECTURE.md`: components, roles, API and WebSocket boundaries.
- `docs/USER_GUIDE.md`: user workflows by role.
- `docs/DEPLOYMENT.md`: production, self-hosting, backup and rollback.
- `docs/TESTING.md`: risk-based verification and closing baseline.
- `docs/client-manual-latex/`: versioned source of the client handoff manual.
- `SECURITY.md` and `CONTRIBUTING.md`: security and change-management policies.

## Rules

1. Never copy credentials, personal data, production exports or private communications into Git.
2. Do not present historical planning notes as current architecture or current scope.
3. Keep routes, environment variables, commands and test counts synchronized with executable code.
4. New behavior requires tests and documentation proportional to its risk.
5. Production migrations are a controlled release step; application startup must not own them.
6. Demo data is forbidden in production.
7. A release is complete only after review, CI, deployment smoke checks and an immutable tag.

For architecture, conventions, state-machine rules and commands, use `AGENTS.md` rather than
duplicating them here.
