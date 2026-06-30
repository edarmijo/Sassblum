# 🔍 Skill: Auditoría Continua SassBlum

> Skill para evaluar la salud del código SassBlum de forma continua.
> Ejecutar después de cada sprint o antes de cada deploy a producción.

---

## Uso

```bash
# Ejecutar auditoría completa
openclaw skills run audit-sassblum

# Ejecutar solo una fase
openclaw skills run audit-sassblum --phase=security
openclaw skills run audit-sassblum --phase=performance
openclaw skills run audit-sassblum --phase=accessibility
```

---

## Fases de Auditoría

### FASE 1 — Seguridad (OWASP Top 10)

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | Rate limiting en endpoints públicos | 🔴 CRÍTICO | `grep -r "throttle" backend/config/settings.py` |
| 2 | JWT no en localStorage | 🔴 CRÍTICO | `grep -r "localStorage" frontend/src/infrastructure/` |
| 3 | CORS restrictivo | 🟡 ALTO | `grep "CORS_ALLOWED_ORIGINS" backend/config/settings.py` |
| 4 | CSP headers configurados | 🟡 ALTO | `grep "CSP_" backend/config/settings.py` |
| 5 | HTTPS enforcement | 🔴 CRÍTICO | `grep "SECURE_SSL_REDIRECT" backend/config/settings.py` |
| 6 | Password validation | 🟡 ALTO | Verificar AUTH_PASSWORD_VALIDATORS en settings.py |
| 7 | Input sanitization en templates | 🟡 ALTO | Verificar que no hay `|safe` en templates Django |
| 8 | File upload validation (BE) | 🟡 ALTO | Verificar MIME type validation en StorageService |
| 9 | SQL injection prevention | 🔴 CRÍTICO | No raw SQL sin parámetros |
| 10 | XSS prevention | 🟡 ALTO | React escapa por defecto, verificar dangerouslySetInnerHTML |

### FASE 2 — Performance

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | API timeout configurado | 🟡 ALTO | `grep "timeout" frontend/src/infrastructure/http/ApiClient.ts` |
| 2 | Paginación en listados | 🟡 ALTO | `grep "PageNumberPagination" backend/config/settings.py` |
| 3 | select_related/prefetch_related | 🟡 ALTO | Revisar queries en repositories |
| 4 | CORS preflight cache | 🟢 MEDIO | `grep "CORS_PREFLIGHT_MAX_AGE" backend/config/settings.py` |
| 5 | Lazy loading de componentes | 🟢 MEDIO | Verificar `lazy()` en App.tsx |
| 6 | will-change usage | 🟢 MEDIO | `grep -r "will-change" frontend/src/` |
| 7 | React.memo en componentes pesados | 🟢 MEDIO | Verificar componentes de lista |
| 8 | Bundle size analysis | ⚪ BAJO | `npm run build && ls -lh dist/assets/` |

### FASE 3 — Accesibilidad (WCAG 2.1 AA)

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | aria-label en elementos interactivos | 🟡 ALTO | `grep -r "aria-label" frontend/src/` |
| 2 | Focus trap en modales | 🟡 ALTO | Verificar Radix Dialog usage |
| 3 | prefers-reduced-motion respetado | 🟢 MEDIO | `grep -r "prefers-reduced-motion" frontend/src/` |
| 4 | Contraste de colores AA | 🟡 ALTO | Verificar con herramienta de contraste |
| 5 | Keyboard navigation | 🟡 ALTO | Verificar que todos los elementos son focusables |
| 6 | aria-hidden en elementos decorativos | 🟢 MEDIO | `grep -r "aria-hidden" frontend/src/` |
| 7 | Error Boundary global | 🟡 ALTO | Verificar en App.tsx |

### FASE 4 — Arquitectura SOLID

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | DIP: interfaces como contratos | 🟡 ALTO | Verificar que componentes no importan servicios concretos |
| 2 | SRP: un componente = una función | 🟢 MEDIO | Revisar componentes > 200 líneas |
| 3 | Singleton thread-safe | 🟡 ALTO | `grep -r "threading.Lock" backend/apps/*/services/` |
| 4 | Observer error handling | 🟡 ALTO | `grep -r "except.*pass" backend/apps/` |
| 5 | Race conditions | 🔴 CRÍTICO | Verificar operaciones atómicas en BD |
| 6 | Type safety (no `any`) | 🟢 MEDIO | `grep -r ": any\|as any" frontend/src/` |

### FASE 5 — Testing

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | Tests unitarios backend | 🟡 ALTO | `cd backend && pytest --co -q 2>/dev/null \| wc -l` |
| 2 | Tests unitarios frontend | 🟡 ALTO | `cd frontend && npm run test 2>&1` |
| 3 | Tests de integración | 🟡 ALTO | Verificar que existen tests con APIClient |
| 4 | Tests E2E | ⚪ BAJO | Verificar Cypress/Playwright setup |
| 5 | Cobertura de tests | 🟢 MEDIO | `pytest --cov` / `npm run test -- --coverage` |

### FASE 6 — DevOps & CI/CD

| # | Check | Severidad | Cómo verificar |
|---|-------|-----------|----------------|
| 1 | Jenkinsfile cross-platform | 🟡 ALTO | Verificar `sh` no `bat` |
| 2 | Docker health check HTTP | 🟢 MEDIO | Verificar endpoint /health/ |
| 3 | Logging configurado | 🟡 ALTO | `grep "LOGGING" backend/config/settings.py` |
| 4 | Environment variables seguras | 🔴 CRÍTICO | No secrets en código, usar .env |
| 5 | Backup automatizado | 🟢 MEDIO | Verificar cron job o servicio |

---

## Métricas de Salud

| Métrica | Sana | Advertencia | Crítica |
|---------|------|-------------|---------|
| Tests de cobertura | >80% | 50-80% | <50% |
| Errores de TypeScript | 0 | 1-5 | >5 |
| Vulnerabilidades npm | 0 | 1-3 | >3 |
| Complejidad ciclomática | <5 | 5-10 | >10 |
| Archivos > 300 líneas | 0 | 1-3 | >3 |

---

## Checklist Pre-Producción

Antes de cada deploy a producción, verificar:

- [ ] Todos los checks CRÍTICOS pasan
- [ ] Rate limiting configurado
- [ ] Logging funcional
- [ ] Health check endpoint responde
- [ ] Tests unitarios pasan (FE + BE)
- [ ] TypeScript compila sin errores
- [ ] No hay `console.log` en producción
- [ ] Variables de entorno configuradas
- [ ] CORS restrictivo
- [ ] CSP headers presentes
- [ ] Singleton thread-safe
- [ ] Error handling en observers
- [ ] No race conditions conocidas
- [ ] Jenkinsfile usa `sh` (no `bat`)
- [ ] admin.py con modelos registrados

---

## Generación de Reporte

Ejecutar y guardar en `REPORTE_AUDITORIA_YYYY-MM-DD.md`:

```bash
# En el directorio del proyecto
echo "# Reporte de Auditoría - $(date +%Y-%m-%d)" > REPORTE_AUDITORIA_$(date +%Y-%m-%d).md
# ... ejecutar cada fase y appendear resultados
```

---

## Sostenibilidad del Código

### Principios a mantener:
1. **DRY** — No duplicar lógica (tipos, funciones, constantes)
2. **SOLID** — Aplicar consistentemente en FE y BE
3. **Documentación** — CLAUDE.md actualizado, docstrings en ABCs
4. **Accesibilidad** — WCAG 2.1 AA como mínimo
5. **Seguridad** — OWASP Top 10 como referencia
6. **Performance** — <3s First Contentful Paint, <100ms Time to Interactive
7. **Testing** — >80% cobertura en lógica de negocio

### Métricas a monitorear:
- Complejidad ciclomática por módulo
- Duplicación de código
- Cobertura de tests
- Vulnerabilidades de dependencias
- Tamaño del bundle
- Tiempos de respuesta de la API
