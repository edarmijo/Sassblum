# ═══════════════════════════════════════════════════════
# FRONTEND COMPLETO
# Generado: 2026-06-28 17:37 UTC
# ═══════════════════════════════════════════════════════

---
## 📁 frontend
---

### 📄 frontend/eslint.config.js
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])

```

### 📄 frontend/index.html
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#06060a" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
    <title>SassBlum — Innovación Tecnológica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

### 📄 frontend/src/App.css
```css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}

```

### 📄 frontend/src/App.tsx
```typescript
/**
 * App — composition root + router.
 *
 * The ONE place where concrete services are wired into their interface providers
 * (DIP boundary). Everything below depends only on interfaces.
 *
 * Layout: public marketing site + auth + role dashboards share <SiteLayout/>
 * (Navbar + Footer + Toaster). Authenticated areas additionally receive the
 * Notification/Ticket providers (mounted only when a session exists).
 */

import { BrowserRouter, Routes, Route, Outlet, Navigate, Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense, type ReactNode } from 'react'
import { ThreeBackground } from './core/ui/ThreeBackground'
import CustomCursor from './core/ui/CustomCursor'
import { PageLoader } from './core/ui/PageLoader'
import { MouseGradient } from './core/ui/MouseGradient'

// Concrete services (injected here only)
import { authService } from './modules/auth/services/AuthService'
import { catalogService } from './modules/catalog/services/CatalogService'
import { ticketService } from './modules/tickets/services/TicketService'
import { notificationService } from './modules/notifications/services/NotificationService'

// Providers (DIP seams)
import { AuthProvider, useAuth } from './modules/auth/hooks/useAuth'
import { AuthServiceProvider } from './modules/auth/hooks/useAuthService'
import { CatalogProvider } from './modules/catalog/hooks/useCatalog'
import { TicketClientProvider } from './modules/tickets/hooks/useTickets'
import { NotificationProvider } from './modules/notifications/hooks/useNotifications'

// Layout
import { Navbar } from './core/ui/layout/Navbar'
import { Footer } from './core/ui/layout/Footer'
import { Toaster } from './core/ui/sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './core/ui/card'

// Auth (eager: pequeños y compartidos por los wrappers de AuthCard)
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute'
import { LoginForm } from './modules/auth/components/LoginForm'
import { RegisterForm } from './modules/auth/components/RegisterForm'

// Páginas cargadas bajo demanda (code-splitting → chunk por ruta)
const Home = lazy(() => import('./modules/public/pages/Home').then(m => ({ default: m.Home })))
const About = lazy(() => import('./modules/public/pages/About').then(m => ({ default: m.About })))
const Services = lazy(() => import('./modules/public/pages/Services').then(m => ({ default: m.Services })))
const Gallery = lazy(() => import('./modules/public/pages/Gallery').then(m => ({ default: m.Gallery })))
const Clients = lazy(() => import('./modules/public/pages/Clients').then(m => ({ default: m.Clients })))

const ForgotPasswordPage = lazy(() => import('./modules/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./modules/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import('./modules/auth/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })))

const ClientDashboard = lazy(() => import('./modules/dashboard/ClientDashboard').then(m => ({ default: m.ClientDashboard })))
const WorkerDashboard = lazy(() => import('./modules/dashboard/WorkerDashboard').then(m => ({ default: m.WorkerDashboard })))
const AdminDashboard = lazy(() => import('./modules/dashboard/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const TicketDetailPage = lazy(() => import('./modules/tickets/pages/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })))
const NotificationsPage = lazy(() => import('./modules/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

// ── Shared layout ─────────────────────────────────────────────────────────────

/** Al cambiar de ruta, vuelve al tope de la página (evita quedar abajo). */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" aria-label="Cargando" />
    </div>
  )
}

function SiteLayout() {
  const { user } = useAuth()

  const tree = (
    <>
      <CustomCursor />
      {/* Dark base + particle engine — fixed, persists across all routes */}
      <div aria-hidden className="fixed inset-0 z-0" style={{ background: '#04090f' }} />
      <ThreeBackground />
      <MouseGradient />
      <div className="min-h-screen flex flex-col text-[#eeeef5]">
        <Navbar />
        <main className="grow relative z-10">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <div className="relative z-10">
          <Footer />
        </div>
        <Toaster position="top-right" />
      </div>
    </>
  )
  // Authenticated areas (incl. the Navbar bell) need the notification + ticket providers.
  return user ? (
    <NotificationProvider service={notificationService}>
      <TicketClientProvider service={ticketService}>{tree}</TicketClientProvider>
    </NotificationProvider>
  ) : tree
}

function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <AuthServiceProvider service={authService}>
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
        {/* teal radial glow behind the card */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-3xl" style={{ background: 'rgba(0,196,224,0.08)' }} />
        <div className="relative w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Link to="/" className="inline-flex items-center rounded-full px-5 py-1.5" style={{ border: '1px solid rgba(0,196,224,0.3)', background: 'rgba(0,196,224,0.06)' }}>
              <span className="tracking-wider font-semibold" style={{ color: '#00c4e0' }}>SASS BLUM</span>
            </Link>
          </div>
          <Card className="w-full" style={{ background: 'rgba(8,22,36,0.82)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold" style={{ color: '#eef4f8' }}>{title}</CardTitle>
              <CardDescription style={{ color: '#5c7a94' }}>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {children}
              {footer && <div className="mt-6 pt-6 text-center text-sm" style={{ borderTop: '1px solid rgba(0,196,224,0.1)', color: '#5c7a94' }}>{footer}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthServiceProvider>
  )
}

// ── Auth routes ───────────────────────────────────────────────────────────────

function LoginRoute() {
  const navigate = useNavigate()
  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de SassBlum"
      footer={<>¿No tienes cuenta? <Link to="/register" className="text-brand-cyan-dark font-medium hover:underline">Regístrate</Link>{' · '}<Link to="/forgot-password" className="text-brand-cyan-dark font-medium hover:underline">Olvidé mi contraseña</Link></>}
    >
      <LoginForm onSuccess={() => navigate('/app')} />
    </AuthCard>
  )
}

function RegisterRoute() {
  const navigate = useNavigate()
  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Regístrate como cliente de SassBlum"
      footer={<>¿Ya tienes cuenta? <Link to="/login" className="text-brand-cyan-dark font-medium hover:underline">Inicia sesión</Link></>}
    >
      <RegisterForm onSuccess={() => navigate('/login')} />
    </AuthCard>
  )
}

function ForgotRoute() {
  return <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo"><ForgotPasswordPage /></AuthCard>
}

function ResetRoute() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  return (
    <AuthCard title="Nueva contraseña" subtitle="Define una contraseña nueva para tu cuenta">
      <ResetPasswordPage token={params.get('token') ?? ''} onSuccess={() => navigate('/login')} />
    </AuthCard>
  )
}

function VerifyRoute() {
  const [params] = useSearchParams()
  return <AuthCard title="Verificación de correo" subtitle="Confirmando tu dirección de correo"><VerifyEmailPage token={params.get('token') ?? ''} /></AuthCard>
}

// ── Authenticated helpers ─────────────────────────────────────────────────────

function AppRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.rol === 'ADMINISTRADOR') return <Navigate to="/admin" replace />
  if (user.rol === 'TRABAJADOR') return <Navigate to="/panel" replace />
  return <Navigate to="/mis-tickets" replace />
}

function DetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  return <TicketDetailPage ticketId={id ?? ''} onBack={() => navigate('/app')} />
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [loading, setLoading] = useState(true)
  return (
    <>
      {loading && <PageLoader onComplete={() => setLoading(false)} />}
      <BrowserRouter>
      <ScrollToTop />
      <AuthProvider service={authService}>
        <CatalogProvider service={catalogService}>
          <Routes>
            <Route element={<SiteLayout />}>
              {/* Public marketing site */}
              <Route path="/" element={<Home />} />
              <Route path="/nosotros" element={<About />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/clientes" element={<Clients />} />

              {/* Auth */}
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/register" element={<RegisterRoute />} />
              <Route path="/forgot-password" element={<ForgotRoute />} />
              <Route path="/reset-password" element={<ResetRoute />} />
              <Route path="/verify-email" element={<VerifyRoute />} />

              {/* Authenticated app */}
              <Route path="/app" element={<ProtectedRoute><AppRedirect /></ProtectedRoute>} />
              <Route path="/mis-tickets" element={<ProtectedRoute roles={['CLIENTE']}><ClientDashboard /></ProtectedRoute>} />
              <Route path="/panel" element={<ProtectedRoute roles={['TRABAJADOR']}><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['ADMINISTRADOR']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/tickets/:id" element={<ProtectedRoute><DetailRoute /></ProtectedRoute>} />
              <Route path="/notificaciones" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
    </>
  )
}

```

### 📄 frontend/src/core/base/BaseValidator.ts
```typescript
/**
 * Abstract base node for the Chain of Responsibility pattern used across all
 * validation layers: auth forms (Sprint 1), ticket creation (Sprint 2),
 * report filters (Sprint 4).
 *
 * Responsibility (SRP): define the node structure and chain traversal.
 *   Each concrete subclass implements exactly ONE validation rule in validate().
 * Depends on: nothing — this is a pure structural abstraction.
 * Pattern: Chain of Responsibility
 * SOLID: OCP · SRP (one rule per node) · LSP (every node is substitutable)
 *
 * How to extend (OCP):
 *   1. Create PhoneValidator extends BaseValidator
 *   2. Implement validate() with only the phone rule
 *   3. Add to chain: email.addValidator(password).addValidator(phone)
 *   → EmailValidator and PasswordValidator are NEVER modified.
 */

export interface ValidationResult {
  /** Whether this node's rule passed */
  isValid: boolean
  /** User-facing error messages suitable for inline form display */
  errors: string[]
  /** The form field that failed (e.g. 'email', 'password', 'phone') */
  field: string
}

export abstract class BaseValidator {
  private _next: BaseValidator | null = null

  /**
   * Appends a validator node at the end of this chain.
   * Returns the added node to allow fluent chaining:
   *   email.addValidator(password).addValidator(phone)
   */
  addValidator(validator: BaseValidator): BaseValidator {
    this._next = validator
    return validator
  }

  /**
   * Implement exactly ONE validation rule here.
   * Must NOT reference this._next — chain traversal is the responsibility of run().
   * Violation of this rule breaks SRP and makes the chain unpredictable.
   *
   * @param data - The raw form data object to inspect
   */
  abstract validate(data: unknown): ValidationResult

  /**
   * Runs the full chain starting at this node.
   * Stops and returns immediately on the first failure without running subsequent nodes.
   * Do NOT override this in concrete subclasses (LSP).
   */
  run(data: unknown): ValidationResult {
    const result = this.validate(data)
    if (!result.isValid || !this._next) return result
    return this._next.run(data)
  }
}

```

### 📄 frontend/src/core/factories/ValidatorFactory.ts
```typescript
/**
 * Factory for assembling validator chains — centralises node wiring (OCP).
 *
 * Responsibility (SRP): know which validator nodes exist and in what order.
 *     Does not validate anything; does not contain business rules.
 * Depends on: concrete validator classes in modules/tickets/validators/.
 *     This is the ONE place in the FE that imports concrete validator classes (DIP inversion point).
 * Pattern: Factory — decouples chain creation from consumption.
 * SOLID: OCP · SRP · DIP
 *
 * OCP extension (Sprint 4 — CriticalPriorityValidator):
 *   1. Create modules/tickets/validators/CriticalPriorityValidator.ts
 *   2. Add one line in buildTicketChain():
 *        businessRuleV.addValidator(new CriticalPriorityValidator())
 *   3. Nothing else changes.
 */

import { BasicFieldValidator } from '../../modules/tickets/validators/BasicFieldValidator'
import { FileValidator } from '../../modules/tickets/validators/FileValidator'
import { BusinessRuleValidator } from '../../modules/tickets/validators/BusinessRuleValidator'
import type { BaseValidator } from '../base/BaseValidator'

export class ValidatorFactory {
  /**
   * Assemble the ticket-creation validation chain.
   *
   * Chain order (fail-fast left to right):
   *   BasicFieldValidator → FileValidator → BusinessRuleValidator
   *
   * @returns Root node. Caller invokes root.run(data).
   *
   * OCP note: add CriticalPriorityValidator in Sprint 4 by appending one addValidator() call.
   */
  static buildTicketChain(): BaseValidator {
    const basicFieldV      = new BasicFieldValidator()
    const fileV            = new FileValidator()
    const businessRuleV    = new BusinessRuleValidator()

    basicFieldV.addValidator(fileV).addValidator(businessRuleV)

    return basicFieldV
  }
}

```

### 📄 frontend/src/core/factories/index.ts
```typescript
// Sprint 2 · Session 13 — ValidatorFactory:
//   ValidatorFactory.ts  → buildTicketChain() → BaseValidator (BasicField→File→BusinessRule)
// Sprint 3            — NotificationFactory:
//   NotificationFactory.ts → build(channel) → INotificationStrategy
// Sprint 4            — ExporterFactory:
//   ExporterFactory.ts → build(format) → IReportExporter (PDF | CSV | Excel)

```

### 📄 frontend/src/core/hooks/useMousePosition.ts
```typescript
import { useState, useEffect } from 'react'

interface MousePosition {
  x: number
  y: number
  normalizedX: number // -1 a 1
  normalizedY: number // -1 a 1
}

/**
 * Hook que rastrea la posición del cursor en tiempo real.
 * Respeta prefers-reduced-motion.
 * Usa passive listener para no bloquear el compositor.
 */
export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  })

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const handler = (e: MouseEvent) => {
      setPosition({
        x: e.clientX,
        y: e.clientY,
        normalizedX: (e.clientX / window.innerWidth) * 2 - 1,
        normalizedY: (e.clientY / window.innerHeight) * 2 - 1,
      })
    }

    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return position
}

```

### 📄 frontend/src/core/hooks/useScrollReveal.ts
```typescript
import { useRef, useState, useEffect } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

/**
 * Hook que detecta cuando un elemento entra en el viewport.
 * Alternativa ligera a useInView de framer-motion para componentes que
 * no necesitan animaciones complejas.
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.3, rootMargin = '-100px 0px', once = true } = options
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsInView(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.unobserve(el)
  }, [threshold, rootMargin, once])

  return { ref, isInView }
}

```

### 📄 frontend/src/core/hooks/useTilt.ts
```typescript
import { useRef, useCallback, type MouseEvent } from 'react'

interface TiltOptions {
  maxTilt?: number // Máxima rotación en grados
  perspective?: number // Perspectiva CSS
  scale?: number // Escala al hover
  speed?: number // Velocidad de la transición (ms)
}

/**
 * Hook que aplica efecto tilt 3D a un elemento al mover el cursor.
 * Solo usa transform (GPU-accelerated).
 * Respeta prefers-reduced-motion via el componente padre.
 */
export function useTilt(options: TiltOptions = {}) {
  const { maxTilt = 15, perspective = 1000, scale = 1.02, speed = 400 } = options
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt

      ref.current.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
    },
    [maxTilt, perspective, scale],
  )

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  }, [perspective])

  return {
    ref,
    style: {
      transformStyle: 'preserve-3d' as const,
      transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
      willChange: 'transform' as const,
    },
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  }
}

```

### 📄 frontend/src/core/interfaces/IRepository.ts
```typescript
/**
 * Generic repository contract used by every data-access layer in the system.
 * No service, component, or hook imports Axios directly — they all depend on
 * this interface (DIP). Concrete implementations live in each module's repositories/.
 *
 * Responsibility (SRP): declare the CRUD contract for any domain entity.
 * Depends on: nothing — this is the abstraction root.
 * Pattern: Repository
 * SOLID: DIP · OCP (new entity = new repo, no changes here) · LSP (every repo is substitutable)
 */

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type FilterOptions = Record<string, string | number | boolean | null | undefined>

/**
 * @template T - The domain entity this repository manages (User, Ticket, Notification…)
 *
 * Sprint usage:
 *   Sprint 1 → AuthRepository implements IRepository<User>
 *   Sprint 2 → TicketRepository implements IRepository<Ticket>
 *   Sprint 3 → NotificationRepository implements IRepository<Notification>
 */
export interface IRepository<T> {
  /** Return a single entity by primary key. Rejects with NotFoundError if absent. */
  getById(id: string): Promise<T>

  /** Return a paginated list, optionally filtered by domain-specific keys. */
  getAll(filters?: FilterOptions): Promise<PaginatedResult<T>>

  /** Persist a new entity and return the created record from the server. */
  create(data: Partial<T>): Promise<T>

  /** Patch specific fields of an existing entity and return the updated record. */
  update(id: string, data: Partial<T>): Promise<T>

  /** Permanently remove an entity. Rejects if the entity does not exist. */
  delete(id: string): Promise<void>
}

```

### 📄 frontend/src/core/ui/CursorFollower.tsx
```typescript
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * CursorFollower — cursor personalizado de tres capas (estilo Antigravity):
 *   · punto sólido (rápido)
 *   · anillo seguidor (lento, lerp)
 *   · estela tenue (más lento)
 * Crece y cambia a cyan sobre elementos interactivos (a, button, [data-cursor]).
 *
 * Solo desktop. No se monta en mobile ni con prefers-reduced-motion.
 * Posiciona vía requestAnimationFrame + lerp (sin re-render de React).
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || window.innerWidth < 768) return
    const dot = dotRef.current
    const ring = ringRef.current
    const trail = trailRef.current
    if (!dot || !ring || !trail) return

    const m = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    let cx = m.x, cy = m.y, fx = m.x, fy = m.y, tx = m.x, ty = m.y
    let raf = 0

    const onMove = (e: MouseEvent) => {
      m.x = e.clientX
      m.y = e.clientY
    }
    document.addEventListener('mousemove', onMove, { passive: true })

    const loop = () => {
      cx += (m.x - cx) * 0.2
      cy += (m.y - cy) * 0.2
      fx += (m.x - fx) * 0.08
      fy += (m.y - fy) * 0.08
      tx += (m.x - tx) * 0.04
      ty += (m.y - ty) * 0.04
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`
      ring.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`
      trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Estado hover sobre elementos interactivos.
    const enter = () => {
      ring.style.width = ring.style.height = '64px'
      ring.style.borderColor = '#00d4ff'
      ring.style.background = 'rgba(0,212,255,0.08)'
      dot.style.width = dot.style.height = '12px'
    }
    const leave = () => {
      ring.style.width = ring.style.height = '40px'
      ring.style.borderColor = 'rgba(255,255,255,0.35)'
      ring.style.background = 'transparent'
      dot.style.width = dot.style.height = '8px'
    }
    const targets = document.querySelectorAll('a, button, [role="button"], [data-cursor]')
    targets.forEach((el) => {
      el.addEventListener('mouseenter', enter)
      el.addEventListener('mouseleave', leave)
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      targets.forEach((el) => {
        el.removeEventListener('mouseenter', enter)
        el.removeEventListener('mouseleave', leave)
      })
    }
  }, [reduce])

  if (reduce || (typeof window !== 'undefined' && window.innerWidth < 768)) return null

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-10000 rounded-full bg-white mix-blend-difference"
        style={{ width: 8, height: 8, transition: 'width .3s, height .3s' }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-10000 rounded-full border"
        style={{ width: 40, height: 40, borderColor: 'rgba(255,255,255,0.35)', transition: 'width .4s, height .4s, border-color .3s, background .3s' }}
      />
      <div
        ref={trailRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-10000 rounded-full"
        style={{ width: 5, height: 5, background: '#00d4ff', opacity: 0.5 }}
      />
    </>
  )
}

```

### 📄 frontend/src/core/ui/CustomCursor.tsx
```typescript
import { useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

const INTERACTIVE_SELECTORS = 'a, button, .card-interactive';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef<Position>({ x: -100, y: -100 });
  const dotPos = useRef<Position>({ x: -100, y: -100 });
  const followerPos = useRef<Position>({ x: -100, y: -100 });
  const trailPos = useRef<Position>({ x: -100, y: -100 });
  const isHovering = useRef(false);
  const rafId = useRef<number>(0);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) return;

    function animate() {
      dotPos.current.x = lerp(dotPos.current.x, mousePos.current.x, 0.2);
      dotPos.current.y = lerp(dotPos.current.y, mousePos.current.y, 0.2);
      followerPos.current.x = lerp(followerPos.current.x, mousePos.current.x, 0.08);
      followerPos.current.y = lerp(followerPos.current.y, mousePos.current.y, 0.08);
      trailPos.current.x = lerp(trailPos.current.x, mousePos.current.x, 0.04);
      trailPos.current.y = lerp(trailPos.current.y, mousePos.current.y, 0.04);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotPos.current.x}px, ${dotPos.current.y}px)`;
      }
      if (followerRef.current) {
        followerRef.current.style.transform = `translate(${followerPos.current.x}px, ${followerPos.current.y}px)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${trailPos.current.x}px, ${trailPos.current.y}px)`;
      }
      rafId.current = requestAnimationFrame(animate);
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(INTERACTIVE_SELECTORS)) {
        isHovering.current = true;
        if (dotRef.current) {
          dotRef.current.style.width = '50px';
          dotRef.current.style.height = '50px';
          dotRef.current.style.marginLeft = '-25px';
          dotRef.current.style.marginTop = '-25px';
          dotRef.current.style.background = '#7c5cfc';
        }
        if (followerRef.current) {
          followerRef.current.style.width = '70px';
          followerRef.current.style.height = '70px';
          followerRef.current.style.marginLeft = '-35px';
          followerRef.current.style.marginTop = '-35px';
          followerRef.current.style.borderColor = '#7c5cfc';
        }
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      if ((e.target as Element).closest(INTERACTIVE_SELECTORS)) {
        isHovering.current = false;
        if (dotRef.current) {
          dotRef.current.style.width = '8px';
          dotRef.current.style.height = '8px';
          dotRef.current.style.marginLeft = '-4px';
          dotRef.current.style.marginTop = '-4px';
          dotRef.current.style.background = '#fff';
        }
        if (followerRef.current) {
          followerRef.current.style.width = '40px';
          followerRef.current.style.height = '40px';
          followerRef.current.style.marginLeft = '-20px';
          followerRef.current.style.marginTop = '-20px';
          followerRef.current.style.borderColor = 'rgba(124,92,252,0.5)';
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(rafId.current);
    };
  }, [isMobile]);

  if (isMobile) return null;

  const transition = 'width 0.3s cubic-bezier(0.22,1,0.36,1), height 0.3s cubic-bezier(0.22,1,0.36,1), margin 0.3s cubic-bezier(0.22,1,0.36,1), background 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s cubic-bezier(0.22,1,0.36,1)';

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 8, height: 8,
          marginLeft: -4, marginTop: -4, borderRadius: '50%', background: '#fff',
          mixBlendMode: 'difference', zIndex: 10000, pointerEvents: 'none',
          transition, willChange: 'transform',
        }}
      />
      <div
        ref={followerRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 40, height: 40,
          marginLeft: -20, marginTop: -20, borderRadius: '50%',
          border: '1.5px solid rgba(124,92,252,0.5)', background: 'transparent',
          zIndex: 10000, pointerEvents: 'none', transition, willChange: 'transform',
        }}
      />
      <div
        ref={trailRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 4, height: 4,
          marginLeft: -2, marginTop: -2, borderRadius: '50%',
          background: '#7c5cfc', opacity: 0.6, zIndex: 10000,
          pointerEvents: 'none', willChange: 'transform',
        }}
      />
    </>
  );
}
```

### 📄 frontend/src/core/ui/ErrorBoundary.tsx
```typescript
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary global que captura errores de render y muestra un fallback UI.
 * Previene que un error en un componente rompa toda la aplicación.
 * Implementa getDerivedStateFromError + componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Algo salió mal</h2>
            <p className="text-muted-foreground mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center px-6 py-2.5 bg-brand-cyan text-brand-navy font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

```

### 📄 frontend/src/core/ui/GlowCard.tsx
```typescript
import { useRef, useCallback, type ReactNode, type MouseEvent } from 'react'
import { cn } from './utils'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  maxTilt?: number
}

/**
 * Card con efecto glow que sigue al cursor + tilt 3D sutil.
 * El "glare" (brillo) se posiciona con JS para seguir el puntero.
 * Solo usa transform + opacity (compositor-friendly).
 */
export function GlowCard({
  children,
  className,
  glowColor = 'rgba(0, 212, 255, 0.15)',
  maxTilt = 12,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !glareRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Rotación 3D
      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`

      // Glare effect (brillo que sigue al cursor)
      const glareX = (x / rect.width) * 100
      const glareY = (y / rect.height) * 100
      glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, ${glowColor}, transparent 60%)`
      glareRef.current.style.opacity = '1'
    },
    [maxTilt, glowColor],
  )

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || !glareRef.current) return
    cardRef.current.style.transform =
      'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
    glareRef.current.style.opacity = '0'
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-xl transition-transform duration-500 ease-out will-change-transform',
        className,
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Glare overlay */}
      <div
        ref={glareRef}
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 transition-opacity duration-300 z-10"
        aria-hidden
      />
      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  )
}

```

### 📄 frontend/src/core/ui/GridBackground.tsx
```typescript
import { memo } from 'react'

interface GridBackgroundProps {
  color?: string
  cellSize?: number
  opacity?: number
  animated?: boolean
}

/**
 * Grilla animada de fondo estilo futurista/tech.
 * Renderiza una cuadrícula CSS que puede hacer scroll infinito.
 * Componente puramente decorativo — aria-hidden.
 * Usa solo background-image + animation (GPU-friendly).
 */
export const GridBackground = memo(function GridBackground({
  color = '#00d4ff',
  cellSize = 60,
  opacity = 0.08,
  animated = true,
}: GridBackgroundProps) {
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(${color}${alphaHex} 1px, transparent 1px),
          linear-gradient(90deg, ${color}${alphaHex} 1px, transparent 1px)
        `,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        animation: animated ? 'grid-scroll 8s linear infinite' : 'none',
        willChange: animated ? 'background-position' : 'auto',
      }}
    />
  )
})

```

### 📄 frontend/src/core/ui/ImageWithFallback.tsx
```typescript
import { useState } from 'react'

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%230a1628"/><text x="50%25" y="50%25" fill="%2300d4ff" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">SASS BLUM</text></svg>'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  fallbackSrc?: string
}

/** <img> that swaps to a branded placeholder if the source fails to load. */
export function ImageWithFallback({ src, fallbackSrc = FALLBACK, alt = '', ...props }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false)
  return (
    <img
      src={errored || !src ? fallbackSrc : src}
      alt={alt}
      onError={() => setErrored(true)}
      {...props}
    />
  )
}

```

### 📄 frontend/src/core/ui/InteractiveGlow.tsx
```typescript
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface InteractiveGlowProps {
  /** Color del resplandor (hex). */
  color?: string
  /** Diámetro del resplandor en px. */
  size?: number
}

/**
 * Resplandor que sigue al cursor sobre la sección padre (estilo Antigravity).
 *
 * Rendimiento: solo se anima `transform` sobre una capa `will-change:transform`,
 * por lo que el desenfoque se rasteriza una vez y cada frame solo se *compone*
 * (no se repinta). El listener se adjunta al elemento padre (que debe ser
 * `relative` + `overflow-hidden`) y se actualiza con requestAnimationFrame.
 * Respeta `prefers-reduced-motion`.
 */
export function InteractiveGlow({ color = '#00d4ff', size = 520 }: InteractiveGlowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent || reduce) return

    let raf = 0
    const half = size / 2

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect()
        const x = e.clientX - rect.left - half
        const y = e.clientY - rect.top - half
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.style.opacity = '1'
      })
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }

    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
    }
  }, [reduce, size])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 rounded-full blur-3xl opacity-0 mix-blend-screen transition-opacity duration-500"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}59 0%, transparent 70%)`,
        willChange: 'transform, opacity',
      }}
    />
  )
}

```

### 📄 frontend/src/core/ui/Loader.tsx
```typescript
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const CIRC = 283 // 2π·45
const SESSION_KEY = 'sassblum:loaded'

/**
 * Loader inicial inmersivo (estilo referencia): overlay navy con anillo SVG de
 * progreso, wordmark y porcentaje. Se muestra una vez por sesión y luego se
 * desvanece. Con prefers-reduced-motion no se muestra (salto inmediato).
 */
export function Loader() {
  const reduce = useReducedMotion()
  const alreadyLoaded = typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1'
  const [visible, setVisible] = useState(!alreadyLoaded && !reduce)
  const [hidden, setHidden] = useState(false)
  const [pct, setPct] = useState(0)
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!visible) return
    if (reduce) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setVisible(false)
      return
    }
    let raf = 0
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = Math.round(eased * 100)
      setPct(value)
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRC - (value / 100) * CIRC)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        sessionStorage.setItem(SESSION_KEY, '1')
        setHidden(true) // dispara fade-out
        window.setTimeout(() => setVisible(false), 700)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, reduce])

  if (!visible) return null

  return (
    <div
      aria-hidden={hidden}
      role="status"
      aria-label="Cargando SassBlum"
      className="fixed inset-0 z-10001 flex items-center justify-center bg-brand-navy-deep transition-opacity duration-700"
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }}
    >
      <div className="relative text-center">
        <div className="relative mx-auto mb-8 h-30 w-30">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <circle
              ref={ringRef}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold tracking-[0.15em] text-white">
            SASS<span className="text-brand-cyan">BLUM</span>
          </span>
        </div>
        <p className="font-display text-sm tracking-widest text-gray-500 tabular-nums">{pct}%</p>
      </div>
    </div>
  )
}

```

### 📄 frontend/src/core/ui/LogoMarquee.tsx
```typescript
import { useState } from 'react'

export interface Brand {
  /** Nombre visible de la marca/empresa. */
  name: string
  /** Dominio para resolver el logo (ej. "hikvision.com"). */
  domain: string
}

interface LogoMarqueeProps {
  brands: Brand[]
  /** Duración de un ciclo completo en segundos (mayor = más lento). */
  durationSec?: number
}

/**
 * Marca de imagen del logo vía el servicio de favicons de Google (fiable y con
 * CORS para <img>). Si falla, se oculta y queda el wordmark de texto — el chip
 * nunca se ve roto.
 */
function BrandLogo({ domain, name }: { domain: string; name: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={`Logo ${name}`}
      loading="lazy"
      onError={() => setOk(false)}
      className="h-8 w-8 shrink-0 object-contain opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
    />
  )
}

function Logos({ brands, ariaHidden }: { brands: Brand[]; ariaHidden?: boolean }) {
  return (
    <ul className="animate-marquee flex items-center gap-6 pr-6" aria-hidden={ariaHidden}>
      {brands.map((b, i) => (
        <li key={`${b.name}-${i}`} className="shrink-0">
          <div className="group flex h-20 w-52 items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-lg">
            <BrandLogo domain={b.domain} name={b.name} />
            <span className="text-base font-semibold tracking-wide text-gray-500 transition-colors group-hover:text-brand-navy">
              {b.name}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Carrusel infinito de logos en bucle continuo (auto-scroll), estilo "muro de
 * marcas". Duplica la lista para un loop sin costuras; se pausa al pasar el cursor.
 * Respeta prefers-reduced-motion vía la regla global de index.css.
 */
export function LogoMarquee({ brands, durationSec = 36 }: LogoMarqueeProps) {
  return (
    <div
      className="marquee-track marquee-mask relative w-full overflow-hidden"
      style={{ ['--marquee-duration' as string]: `${durationSec}s` }}
    >
      <div className="flex w-max">
        <Logos brands={brands} />
        {/* Copia para el bucle continuo */}
        <Logos brands={brands} ariaHidden />
      </div>
    </div>
  )
}

```

### 📄 frontend/src/core/ui/MagneticButton.tsx
```typescript
import { useRef, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'framer-motion'
import type { MouseEvent } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
}

/**
 * Envuelve cualquier hijo con un efecto magnético: el elemento sigue ligeramente
 * al cursor cuando está dentro del bounding box y regresa con un spring suave.
 * Solo activo en desktop; se desactiva con prefers-reduced-motion.
 */
export function MagneticButton({ children, className, strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const reduce = useReducedMotion()

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (reduce || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      x.set((e.clientX - rect.left - rect.width / 2) * strength)
      y.set((e.clientY - rect.top - rect.height / 2) * strength)
    },
    [strength, reduce, x, y],
  )

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

```

### 📄 frontend/src/core/ui/MouseGradient.tsx
```typescript
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * MouseGradient — resplandor radial cyan que sigue al cursor (estilo Mimo/Xiaomi).
 * Capa fija con mix-blend screen. Se actualiza vía CSS custom properties
 * (sin re-render de React). No se monta en reduced-motion ni en móvil.
 */
export function MouseGradient() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || window.innerWidth < 768) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${e.clientX}px`)
        el.style.setProperty('--my', `${e.clientY}px`)
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [reduce])

  if (reduce || (typeof window !== 'undefined' && window.innerWidth < 768)) return null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-1 hidden md:block"
      style={{
        opacity: 0.1,
        mixBlendMode: 'screen',
        background:
          'radial-gradient(700px circle at var(--mx, 50%) var(--my, 50%), #00c4e0 0%, transparent 60%)',
      }}
    />
  )
}

```

### 📄 frontend/src/core/ui/PageLoader.tsx
```typescript
import { useState, useEffect, useRef } from 'react';

interface PageLoaderProps {
  onComplete: () => void;
}

export function PageLoader({ onComplete }: PageLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const tick = () => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Small delay before fade-out
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => onCompleteRef.current(), 500);
          }, 200);
          return 100;
        }
        // Random increment between 2 and 8
        const inc = Math.floor(Math.random() * 7) + 2;
        return Math.min(prev + inc, 100);
      });
    };

    // ~2s total: 100 ticks at ~20ms each ≈ 2s (with random increments it finishes around that)
    intervalRef.current = setInterval(tick, 20);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Stroke-dashoffset: 283 is full circumference. offset 283 = 0%, offset 0 = 100%
  const dashOffset = 283 - (283 * progress) / 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#06060a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? 'hidden' : 'visible',
        transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), visibility 0.5s',
      }}
    >
      {/* SVG Ring */}
      <svg
        viewBox="0 0 100 100"
        width={120}
        height={120}
        style={{ marginBottom: 24 }}
      >
        {/* Background track */}
        <circle
          cx={50}
          cy={50}
          r={45}
          fill="none"
          stroke="rgba(124,92,252,0.1)"
          strokeWidth={3}
        />
        {/* Progress ring */}
        <circle
          cx={50}
          cy={50}
          r={45}
          fill="none"
          stroke="#7c5cfc"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={283}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>

      {/* Logo */}
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.1em',
          marginBottom: 12,
        }}
      >
        SASS <span style={{ color: '#7c5cfc' }}>BLUM</span>
      </div>

      {/* Percentage */}
      <div
        style={{
          fontFamily: "'Space Grotesk', monospace",
          fontSize: '0.875rem',
          color: 'rgba(124,92,252,0.8)',
          letterSpacing: '0.05em',
        }}
      >
        {progress}%
      </div>
    </div>
  );
}

```

### 📄 frontend/src/core/ui/PageTransition.tsx
```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { pageTransition } from '../utils/animation'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Wrapper que aplica transiciones de página fluidas (blur + fade + slide).
 * Usa AnimatePresence de framer-motion para detectar cambios de ruta.
 * Respeta prefers-reduced-motion (framer-motion lo maneja automáticamente).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

```

### 📄 frontend/src/core/ui/ProjectGalleryCarousel.tsx
```typescript
import { useRef, useEffect, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../../modules/gallery/hooks/useProjects';

/* ─── brand palette ─── */
const C = {
  accent: '#00c4e0',
  text: '#eef4f8',
  muted: '#5c7a94',
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── gallery data ─── */
const GALLERY = [
  { tag: 'Servidores', title: 'Data Center Enterprise', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80' },
  { tag: 'Cableado', title: 'Red Corporativa', img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80' },
  { tag: 'Infraestructura', title: 'Instalación Industrial', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80' },
  { tag: 'CCTV', title: 'Sistema de Vigilancia', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&q=80' },
  { tag: 'Domótica', title: 'Smart Office', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80' },
];

/* ─── gallery card hover CSS (info reveal + image zoom) ─── */
const galleryCss = `
  .pgc__info { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:1.5rem; background:linear-gradient(to top,rgba(4,9,15,0.92) 0%,transparent 55%); opacity:0; transition:opacity 0.5s cubic-bezier(0.22,1,0.36,1); }
  .pgc__card:hover .pgc__info { opacity:1; }
  .pgc__shine { position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity 0.3s ease; }
  .pgc__card:hover .pgc__img { transform:scale(1.1); }
`;

/**
 * Carrusel infinito de proyectos.
 * El desplazamiento se conduce por RAF escribiendo `transform` directamente sobre
 * el track — inmune a `@media (prefers-reduced-motion)` (siempre anima, por decisión
 * del usuario). Pausa al pasar el cursor por encima.
 */
export function ProjectGalleryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  /* Proyectos desde la API; si no hay ninguno (o falla), usa los de ejemplo. */
  const { projects } = useProjects();
  const items = projects.length > 0
    ? projects.map((p) => ({ tag: p.tag, title: p.titulo, img: p.imagenUrl }))
    : GALLERY;

  /* ── infinite scroll RAF — transform directo (inmune a reduced-motion) ── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let x = 0;
    let half = 0;
    let rafId = 0;
    const step = () => {
      if (!half) half = track.scrollWidth / 2;        // se mide cuando ya hay layout
      if (!pausedRef.current && half) {
        x -= 0.6;
        if (x <= -half) x += half;                     // loop sin salto
        track.style.transform = `translateX(${x}px)`;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [items.length]); // re-mide el ancho cuando cambian los proyectos

  /* ── 3D tilt + dynamic shine on each card ── */
  const onCardMove = (e: MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * 12;
    const rotY = (x - 0.5) * -12;
    e.currentTarget.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    const shine = e.currentTarget.querySelector<HTMLDivElement>('[data-shine]');
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.1), transparent 60%)`;
      shine.style.opacity = '1';
    }
  };
  const onCardLeave = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 600);
    const shine = el.querySelector<HTMLDivElement>('[data-shine]');
    if (shine) shine.style.opacity = '0';
  };

  return (
    <section className="relative z-10" style={{ padding: 'clamp(6rem,12vw,10rem) 0' }}>
      <style>{galleryCss}</style>

      {/* header */}
      <div className="mx-auto mb-[clamp(2.5rem,4vw,4rem)]" style={{ maxWidth: 1400, padding: '0 clamp(1.5rem,4vw,4rem)' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="inline-flex items-center gap-3 mb-4" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent }}>
          <span style={{ width: 32, height: 1, background: C.accent }} />
          Proyectos
        </motion.div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', color: C.text }}
          >
            Galería de<br />proyectos
          </motion.h2>
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            style={{ color: C.muted, fontSize: '0.85rem', maxWidth: 260 }}
          >
            Pasa el cursor sobre una tarjeta para pausar
          </motion.p>
        </div>
      </div>

      {/* infinite carousel — RAF writes transform on the track */}
      <div style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)', maskImage: 'linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)' }}>
        <div
          ref={trackRef}
          className="flex"
          style={{ width: 'max-content', willChange: 'transform' }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {/* Two identical sets for a seamless loop */}
          {([0, 1] as const).map((copy) => (
            <div key={copy} className="flex" style={{ gap: 20, paddingRight: 20 }} aria-hidden={copy === 1}>
              {items.map((g, i) => (
                <div
                  key={`${copy}-${i}`}
                  style={{ width: 'clamp(280px,28vw,380px)', height: 460, flexShrink: 0 }}
                >
                  <div
                    className="pgc__card relative w-full h-full rounded-2xl overflow-hidden cursor-pointer"
                    style={{ borderRadius: 16 }}
                    onMouseMove={onCardMove}
                    onMouseLeave={onCardLeave}
                  >
                    <div
                      style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url('${g.img}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                        transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)',
                      }}
                      className="pgc__img"
                    />
                    <div className="pgc__info">
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.4rem' }}>{g.tag}</span>
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: C.text }}>{g.title}</h3>
                    </div>
                    <div data-shine="true" className="pgc__shine" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

```

### 📄 frontend/src/core/ui/RippleButton.tsx
```typescript
import { useState, useCallback, type MouseEvent, type ReactNode } from 'react'
import { Button } from './button'
import type { ButtonProps } from './button'

interface RippleButtonProps extends ButtonProps {
  children: ReactNode
}

/**
 * Botón con efecto ripple (onda expansiva) al hacer click.
 * Cada ripple se auto-destruye después de 600ms.
 * Usa solo CSS animation para el efecto (GPU-friendly).
 */
export function RippleButton({ children, className, ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600)

    // Call original onClick if provided
    if (props.onClick) {
      props.onClick(e as MouseEvent<HTMLButtonElement> & { nativeEvent: MouseEvent })
    }
  }, [props.onClick])

  return (
    <Button className={`relative overflow-hidden ${className ?? ''}`} onClick={handleClick} {...props}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
            animation: 'ripple 0.6s ease-out forwards',
          }}
        />
      ))}
    </Button>
  )
}

```

### 📄 frontend/src/core/ui/ScrollReveal.tsx
```typescript
import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { EASE_APPLE } from './motion/ease'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

/**
 * Componente que anima sus hijos cuando entran en el viewport.
 * Wrapper semántico sobre framer-motion + IntersectionObserver.
 * Solo anima transform/opacity (compositor-friendly).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 30,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px 0px', amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, ease: EASE_APPLE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

```

### 📄 frontend/src/core/ui/ThreeBackground.tsx
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';

/**
 * ThreeBackground — Full-screen fixed Three.js canvas.
 * Matches scripts.js reference exactly:
 *  • CPU velocity-based particle drift (same as initThreeBackground)
 *  • Shader float + mouse repulsion
 *  • Camera follows mouse
 *  • Two orbiting torus rings
 *  • Central glowing orb (Fresnel)
 *  • Connecting line network (throttled every 3rd frame)
 *
 * Relies on THREE loaded via CDN in index.html.
 * NOTE: No prefers-reduced-motion gate — always animates (same as reference).
 */

/* ───────── constants ───────── */
const PARTICLE_COUNT_DESKTOP = 1500;
const PARTICLE_COUNT_MOBILE  = 600;
const MOUSE_LERP       = 0.05;
const CAMERA_LERP      = 0.02;
const ORB_LERP         = 0.03;

/* ───────── vertex shader ───────── */
const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  attribute float aScale;
  attribute float aRandom;
  varying float vDist;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // anti-gravity float (oscillation on top of CPU drift)
    pos.y += sin(uTime * 0.4 + aRandom * 6.2831) * 0.5;
    pos.x += cos(uTime * 0.3 + aRandom * 6.2831) * 0.35;
    pos.z += sin(uTime * 0.2 + aRandom * 3.1416) * 0.25;

    // mouse repulsion in XZ plane
    vec2 diff = pos.xz - uMouse;
    float dist  = length(diff);
    float force = smoothstep(3.0, 0.0, dist) * 1.5;
    pos.xz += normalize(diff + 0.0001) * force;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mvPos;
    gl_PointSize = aScale * (200.0 / -mvPos.z);

    vDist  = dist;
    vAlpha = 0.3 + 0.7 * aScale;
  }
`;

/* ───────── fragment shader — teal/cyan brand colors ───────── */
const particleFragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vDist;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = pow(1.0 - smoothstep(0.0, 0.5, d), 1.5);

    // SassBlum teal palette
    vec3 teal  = vec3(0.0, 0.769, 0.878);   // #00c4e0
    vec3 cyan  = vec3(0.220, 0.851, 0.961);  // #38d9f5
    float mix_t = sin(uTime * 0.5 + vDist * 0.3) * 0.5 + 0.5;
    vec3 color  = mix(teal, cyan, mix_t);

    gl_FragColor = vec4(color, glow * vAlpha * 0.55);
  }
`;

/* ───────── orb shaders ───────── */
const orbVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float breathe = 1.0 + sin(uTime * 0.8 + position.y * 3.0) * 0.05;
    vec3 pos = position * breathe;
    vNormal  = normalize(normalMatrix * normal);
    vec4 mv  = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const orbFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
    vec3 core  = vec3(0.0, 0.769, 0.878);   // teal core
    vec3 rim   = vec3(0.220, 0.851, 0.961);  // cyan rim
    vec3 color = mix(core, rim, fresnel);
    float alpha = (fresnel * 0.4 + 0.05) + sin(uTime * 1.5) * 0.02;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ───────── component ───────── */
export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const THREE = (window as Record<string, any>).THREE;
    if (!THREE) {
      console.warn('[ThreeBackground] THREE not on window — CDN not loaded yet?');
      return;
    }

    const isMobile      = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

    /* ── renderer ── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    Object.assign(renderer.domElement.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0',
    });
    containerRef.current?.appendChild(renderer.domElement);

    /* ── scene & camera ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    /* ── smooth mouse state ── */
    const mouseTarget = { x: 0, y: 0 };
    const mouseSmooth = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth)  * 2 - 1;
      mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    /* ── particles ── */
    const geo       = new THREE.BufferGeometry();
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);   // CPU drift
    const scales     = new Float32Array(PARTICLE_COUNT);
    const randoms    = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
      // same velocity range as reference scripts.js
      velocities[i3]     = (Math.random() - 0.5) * 0.005;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
      scales[i]  = Math.random() * 3 + 0.5;
      randoms[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale',   new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 1));

    const particleUniforms = {
      uTime:  { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const particleMat = new THREE.ShaderMaterial({
      vertexShader:   particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms:       particleUniforms,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geo, particleMat);
    scene.add(particles);

    /* ── connecting lines ── */
    const lineCount = Math.floor(PARTICLE_COUNT * 0.06);
    const lineGeo   = new THREE.BufferGeometry();
    const linePos   = new Float32Array(lineCount * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat   = new THREE.LineBasicMaterial({
      color: 0x38d9f5, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* ── torus rings ── */
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.02, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x00c4e0, transparent: true, opacity: 0.09 }),
    );
    ring1.rotation.x = Math.PI * 0.3;
    scene.add(ring1);

    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x38d9f5, transparent: true, opacity: 0.06 });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.015, 16, 100), ring2Mat);
    ring2.rotation.x = Math.PI * 0.6;
    ring2.rotation.y = Math.PI * 0.3;
    scene.add(ring2);

    /* ── central orb ── */
    const orbMat = new THREE.ShaderMaterial({
      vertexShader:   orbVertexShader,
      fragmentShader: orbFragmentShader,
      uniforms:       { uTime: { value: 0 } },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.8, 64, 64), orbMat);
    scene.add(orb);

    /* ── connecting-line update ── */
    function updateLines() {
      const pos = geo.attributes.position.array as Float32Array;
      const lp  = lineGeo.attributes.position.array as Float32Array;
      const maxDist = 1.8;
      let idx = 0;
      outer: for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          if (idx >= lineCount * 6) break outer;
          const j3 = j * 3;
          const dx = pos[i3] - pos[j3], dy = pos[i3+1] - pos[j3+1], dz = pos[i3+2] - pos[j3+2];
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < maxDist) {
            lp[idx++] = pos[i3];   lp[idx++] = pos[i3+1]; lp[idx++] = pos[i3+2];
            lp[idx++] = pos[j3];   lp[idx++] = pos[j3+1]; lp[idx++] = pos[j3+2];
          }
        }
      }
      for (let k = idx; k < lineCount * 6; k++) lp[k] = 0;
      lineGeo.attributes.position.needsUpdate = true;
    }

    /* ── animation loop (always runs — no prefers-reduced-motion gate) ── */
    let rafId = 0;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // smooth mouse (same as reference)
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * MOUSE_LERP;
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * MOUSE_LERP;

      // uniforms
      particleUniforms.uTime.value  = elapsed;
      particleUniforms.uMouse.value.set(mouseSmooth.x * 5, mouseSmooth.y * 4);
      orbMat.uniforms.uTime.value   = elapsed;

      // orb follows mouse
      orb.position.x += (mouseSmooth.x * 0.8 - orb.position.x) * ORB_LERP;
      orb.position.y += (mouseSmooth.y * 0.5 - orb.position.y) * ORB_LERP;

      // ring orbits
      ring1.rotation.z = elapsed * 0.05;
      ring2.rotation.z = -elapsed * 0.03;

      // camera follows mouse (same as reference)
      camera.position.x += (mouseSmooth.x * 0.3 - camera.position.x) * CAMERA_LERP;
      camera.position.y += (mouseSmooth.y * 0.2 - camera.position.y) * CAMERA_LERP;
      camera.lookAt(0, 0, 0);

      // CPU particle drift (same as reference — velocities + wrap-around)
      const posArr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        posArr[i3]     += velocities[i3];
        posArr[i3 + 1] += velocities[i3 + 1];
        posArr[i3 + 2] += velocities[i3 + 2];
        if (posArr[i3]     >  10) posArr[i3]     = -10;
        if (posArr[i3]     < -10) posArr[i3]     =  10;
        if (posArr[i3 + 1] >  10) posArr[i3 + 1] = -10;
        if (posArr[i3 + 1] < -10) posArr[i3 + 1] =  10;
      }
      geo.attributes.position.needsUpdate = true;

      // slow whole-particle-cloud rotation
      particles.rotation.y = elapsed * 0.02;

      // connecting lines (every 3rd frame)
      if (Math.floor(elapsed * 60) % 3 === 0) updateLines();

      renderer.render(scene, camera);
    }

    animate();   // ← always starts (no prefers-reduced-motion gate)

    /* ── resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    /* ── cleanup ── */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize',    onResize);
      geo.dispose();       particleMat.dispose();
      lineGeo.dispose();   lineMat.dispose();
      ring1.geometry.dispose(); ring1.material.dispose();
      ring2.geometry.dispose(); ring2Mat.dispose();
      orb.geometry.dispose();   orbMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

```

### 📄 frontend/src/core/ui/alert-dialog.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

```

### 📄 frontend/src/core/ui/alert.tsx
```typescript
﻿import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };

```

### 📄 frontend/src/core/ui/avatar.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "./utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };

```

### 📄 frontend/src/core/ui/badge.tsx
```typescript
﻿import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

```

### 📄 frontend/src/core/ui/button.tsx
```typescript
﻿import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        brand:
          "bg-brand-cyan text-brand-navy font-semibold shadow-sm hover:brightness-95 focus-visible:ring-brand-cyan/50",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

```

### 📄 frontend/src/core/ui/card.tsx
```typescript
import * as React from "react";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

```

### 📄 frontend/src/core/ui/dialog.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

```

### 📄 frontend/src/core/ui/dropdown-menu.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};

```

### 📄 frontend/src/core/ui/index.ts
```typescript
/** Barrel for the shared UI design system (shadcn/Radix primitives). */
export * from './button'
export * from './card'
export * from './input'
export * from './label'
export * from './textarea'
export * from './select'
export * from './tabs'
export * from './table'
export * from './badge'
export * from './dialog'
export * from './alert-dialog'
export * from './dropdown-menu'
export * from './alert'
export * from './avatar'
export * from './switch'
export * from './separator'
export * from './tooltip'
export * from './skeleton'
export * from './sonner'
export { cn } from './utils'

```

### 📄 frontend/src/core/ui/input.tsx
```typescript
import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

```

### 📄 frontend/src/core/ui/label.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "./utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };

```

### 📄 frontend/src/core/ui/layout/Footer.tsx
```typescript
import { Mail, Phone, ArrowUpRight } from 'lucide-react'

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#00c4e0',
  marginBottom: '1rem',
  fontWeight: 600,
  fontFamily: "'Space Grotesk', sans-serif",
}

const linkBaseStyle: React.CSSProperties = {
  display: 'block',
  color: '#a0a0b8',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontFamily: "'Space Grotesk', sans-serif",
  transition: 'color 0.25s ease, transform 0.25s ease',
  marginBottom: '0.6rem',
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: 'transparent', color: '#ffffff', position: 'relative', zIndex: 10 }}>
      {/* transparent footer — el fondo de partículas se ve a través (estética de
          la sección "El nexo perfecto"); solo una hairline superior para separar */}
      <div style={{
        margin: '0 clamp(1rem,3vw,3rem)',
        borderRadius: '24px 24px 0 0',
        background: 'transparent',
        borderTop: '1px solid rgba(0,196,224,0.12)',
      }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '3.5rem 1.5rem 0',
        }}
      >
        {/* Top section: brand (2fr) + link columns (3fr) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: '3rem',
            paddingBottom: '3rem',
          }}
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.6rem',
                fontWeight: 700,
                marginBottom: '1rem',
                letterSpacing: '-0.02em',
              }}
            >
              SASS<span style={{ color: '#00c4e0' }}>BLUM</span>
            </div>
            <p
              style={{
                color: '#6b6b85',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                maxWidth: '320px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Innovación tecnológica para tu negocio. 20+ años de experiencia.
            </p>
          </div>

          {/* Link columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
            }}
          >
            {/* Servicios */}
            <div>
              <h4 style={sectionHeaderStyle}>Servicios</h4>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Infraestructura IT
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Soporte Técnico
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Cableado Estructurado
              </a>
            </div>

            {/* Más */}
            <div>
              <h4 style={sectionHeaderStyle}>Más</h4>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Sistema CCTV
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Domótica
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Servidores
              </a>
            </div>

            {/* Contacto */}
            <div>
              <h4 style={sectionHeaderStyle}>Contacto</h4>
              <a
                href="mailto:info@sassblum.com"
                style={{ ...linkBaseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <Mail size={14} />
                info@sassblum.com
              </a>
              <a
                href="tel:+593969990990"
                style={{ ...linkBaseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <Phone size={14} />
                +593-9-6999-0990
              </a>
              <a
                href="https://www.instagram.com/sassblum/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...linkBaseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <ArrowUpRight size={14} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid rgba(107, 107, 133, 0.2)',
            paddingTop: '1.5rem',
            paddingBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <p
              style={{
                color: '#6b6b85',
                fontSize: '0.82rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              © {year} sassblum.com — Todos los derechos reservados
            </p>
            <p
              style={{
                color: '#6b6b85',
                fontSize: '0.82rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Diseñado con{' '}
              <span style={{ color: '#00c4e0' }}>♥</span>
            </p>
          </div>
        </div>
      </div>
      </div>{/* close glass card */}
    </footer>
  )
}

```

### 📄 frontend/src/core/ui/layout/Navbar.tsx
```typescript
import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, User, LogOut } from 'lucide-react'
import { Button } from '../button'
import { Badge } from '../badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { useAuth } from '../../../modules/auth/hooks/useAuth'
import { useNotifications } from '../../../modules/notifications/hooks/useNotifications'
import type { UserRole } from '../../../modules/auth/interfaces/IAuthService'

/* ─── constants ─────────────────────────────────────────────────────── */

const EASE_OUT = 'cubic-bezier(0.22,1,0.36,1)'
const SCROLL_THRESHOLD = 8

interface NavItem {
  to: string
  label: string
}

const PUBLIC_ITEMS: NavItem[] = [
  { to: '/', label: 'INICIO' },
  { to: '/nosotros', label: 'NOSOTROS' },
  { to: '/servicios', label: 'SERVICIOS' },
  { to: '/galeria', label: 'GALERÍA' },
  { to: '/clientes', label: 'CLIENTES' },
]

const DASHBOARD_BY_ROLE: Record<UserRole, NavItem> = {
  CLIENTE: { to: '/mis-tickets', label: 'MIS TICKETS' },
  TRABAJADOR: { to: '/panel', label: 'PANEL' },
  ADMINISTRADOR: { to: '/admin', label: 'ADMIN' },
}

/* ─── AuthedActions (desktop) ───────────────────────────────────────── */

function AuthedActions() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      {/* Notification bell */}
      <Link
        to="/notificaciones"
        className="relative text-white/60 hover:text-white transition-colors"
        style={{ transitionDuration: '200ms' }}
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1.5 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] font-semibold rounded-full"
            style={{ backgroundColor: '#00c4e0', color: '#fff' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Link>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white/60 hover:text-white hover:bg-white/6"
          >
            <User className="h-[18px] w-[18px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          style={{
            backgroundColor: '#111118',
            borderColor: 'rgba(255,255,255,0.06)',
            color: '#fff',
          }}
        >
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>
                {user.nombre} {user.apellido}
              </span>
              <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {user.rol.toLowerCase()}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <DropdownMenuItem
            onClick={() => {
              void logout()
              navigate('/')
            }}
            className="text-white/70 focus:text-white focus:bg-white/6"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ─── Navbar ────────────────────────────────────────────────────────── */

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  /* scroll listener */
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /* close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  /* build nav items */
  const items: NavItem[] = [...PUBLIC_ITEMS]
  if (!user) items.push({ to: '/login', label: 'INGRESAR' })
  else items.push(DASHBOARD_BY_ROLE[user.rol])

  const isActive = (to: string) => location.pathname === to

  /* ─── inline styles (Tailwind can't reach all values) ──────────── */

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: scrolled ? 'rgba(6,6,10,0.8)' : 'transparent',
    backdropFilter: scrolled ? 'blur(24px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
    transition: `background-color 400ms ${EASE_OUT}, backdrop-filter 400ms ${EASE_OUT}, border-color 400ms ${EASE_OUT}`,
  }

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '0.8rem',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: active ? '#00c4e0' : 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    position: 'relative',
    paddingBottom: '2px',
    transition: `color 200ms ${EASE_OUT}, transform 200ms ${EASE_OUT}`,
  })

  /* ─── render ───────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Desktop / top bar ─────────────────────────────────────── */}
      <nav style={navStyle}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '1.25rem',
                letterSpacing: '0.12em',
                color: '#fff',
              }}
            >
              SASS
              <span style={{ color: '#00c4e0' }}>.</span>
            </span>
          </Link>

          {/* Center links — desktop only */}
          <div
            className="hidden md:flex items-center"
            style={{ gap: 28 }}
          >
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={linkStyle(isActive(item.to))}
                onMouseEnter={(e) => {
                  if (!isActive(item.to)) {
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.to)) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {item.label}
                {/* underline — always present, animated via width */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: '#00c4e0',
                    width: isActive(item.to) ? '100%' : '0%',
                    transition: `width 300ms ${EASE_OUT}`,
                  }}
                  className="nav-underline"
                />
              </Link>
            ))}
          </div>

          {/* Right side: auth + hamburger */}
          <div className="flex items-center" style={{ gap: 16 }}>
            {/* Auth actions — desktop only */}
            {user && <div className="hidden md:block"><AuthedActions /></div>}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col justify-center items-center"
              style={{
                width: 32,
                height: 32,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                position: 'relative',
                zIndex: 1001,
              }}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}
            >
              <span
                style={{
                  display: 'block',
                  width: 20,
                  height: 2,
                  backgroundColor: '#fff',
                  borderRadius: 1,
                  transition: `transform 300ms ${EASE_OUT}, opacity 200ms ${EASE_OUT}`,
                  transform: mobileOpen
                    ? 'translateY(0) rotate(45deg)'
                    : 'translateY(-4px) rotate(0deg)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: 20,
                  height: 2,
                  backgroundColor: '#fff',
                  borderRadius: 1,
                  transition: `transform 300ms ${EASE_OUT}, opacity 200ms ${EASE_OUT}`,
                  transform: mobileOpen
                    ? 'translateY(0) rotate(-45deg)'
                    : 'translateY(4px) rotate(0deg)',
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: '#06060a',
          pointerEvents: mobileOpen ? 'auto' : 'none',
          opacity: mobileOpen ? 1 : 0,
          transition: `opacity 400ms ${EASE_OUT}`,
        }}
        aria-hidden={!mobileOpen}
      >
        {/* Background slide-in panel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#06060a',
            transformOrigin: 'right center',
            transform: mobileOpen ? 'scaleX(1)' : 'scaleX(0)',
            transition: `transform 500ms ${EASE_OUT}`,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '100px 32px 48px',
          }}
        >
          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 16,
                  padding: '12px 0',
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 500ms ${EASE_OUT} ${i * 80}ms, transform 500ms ${EASE_OUT} ${i * 80}ms`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.25)',
                    fontWeight: 400,
                    minWidth: 24,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '2rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isActive(item.to) ? '#00c4e0' : '#fff',
                    transition: `color 200ms ${EASE_OUT}`,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Auth links inside mobile menu */}
            {user && (
              <Link
                to="/notificaciones"
                onClick={closeMobile}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 16,
                  padding: '12px 0',
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 500ms ${EASE_OUT} ${items.length * 80}ms, transform 500ms ${EASE_OUT} ${items.length * 80}ms`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.25)',
                    fontWeight: 400,
                    minWidth: 24,
                  }}
                >
                  {String(items.length + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '2rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#fff',
                  }}
                >
                  NOTIFICACIONES
                </span>
              </Link>
            )}
          </div>

          {/* Bottom info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 500ms ${EASE_OUT} 400ms, transform 500ms ${EASE_OUT} 400ms`,
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Contacto
            </span>
            <a
              href="mailto:info@sassblum.com"
              style={{
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: `color 200ms ${EASE_OUT}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00c4e0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            >
              info@sassblum.com
            </a>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              Ciudad de México, México
            </span>
            <a
              href="tel:+525512345678"
              style={{
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: `color 200ms ${EASE_OUT}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00c4e0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            >
              +52 55 1234 5678
            </a>

            {/* Mobile auth actions */}
            {user && (
              <button
                onClick={() => {
                  closeMobile()
                  setTimeout(() => {
                    void logout()
                    navigate('/')
                  }, 300)
                }}
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '10px 16px',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: `border-color 200ms ${EASE_OUT}, color 200ms ${EASE_OUT}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                }}
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hover underline animation (CSS-only enhancement for desktop links) */}
      <style>{`
        nav a:not([aria-label]) .nav-underline {
          width: 0%;
          transition: width 300ms ${EASE_OUT};
        }
        nav a:not([aria-label]):hover .nav-underline {
          width: 100%;
        }
      `}</style>
    </>
  )
}

```

### 📄 frontend/src/core/ui/layout/PageHero.tsx
```typescript
import { motion } from 'framer-motion'
import { EASE_APPLE } from '../motion/ease'
import { InteractiveGlow } from '../InteractiveGlow'

const ORB_COLOR = {
  cyan: '#00d4ff',
  indigo: '#6366f1',
} as const

const ORB_POSITION = {
  'top-right': { primary: '-top-24 -right-16', secondary: '-bottom-20 -left-16' },
  'bottom-left': { primary: '-bottom-24 -left-16', secondary: '-top-20 -right-16' },
  'bottom-right': { primary: '-bottom-24 right-0', secondary: '-top-20 -left-16' },
} as const

interface PageHeroProps {
  eyebrow: string
  title: string
  subtitle: string
  accent?: keyof typeof ORB_COLOR
  orbPosition?: keyof typeof ORB_POSITION
}

/**
 * Hero estándar de las páginas públicas con grid animada, glow interactivo,
 * orbes flotantes y entrada escalonada.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  accent = 'cyan',
  orbPosition = 'top-right',
}: PageHeroProps) {
  const { primary, secondary } = ORB_POSITION[orbPosition]
  const orbColor = ORB_COLOR[accent]
  const secondaryColor = accent === 'cyan' ? '#6366f1' : '#00d4ff'

  return (
    <div className="relative text-white py-28 md:py-36 overflow-hidden" style={{ background: 'rgba(4,9,20,0.88)' }}>
      {/* Resplandor interactivo que sigue al cursor */}
      <InteractiveGlow color={orbColor} size={480} />

      {/* Orbe primario — flota suavemente */}
      <motion.div
        className={`absolute ${primary} h-96 w-96 rounded-full blur-2xl pointer-events-none`}
        style={{ background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Orbe secundario — movimiento contrario para profundidad */}
      <motion.div
        className={`absolute ${secondary} h-72 w-72 rounded-full blur-2xl pointer-events-none`}
        style={{ background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)` }}
        animate={{ x: [0, -16, 0], y: [0, 20, 0], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-brand-cyan mb-4 uppercase tracking-[0.4em] text-sm"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_APPLE, delay: 0.1 }}
          className="text-5xl md:text-7xl mb-5 font-semibold tracking-tight"
        >
          <span className="text-gradient-brand">{title}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_APPLE, delay: 0.22 }}
          className="text-xl text-gray-300 font-light max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      </div>
    </div>
  )
}

```

### 📄 frontend/src/core/ui/motion/ease.ts
```typescript
/** Curva de easing "expo-out" — el ease premium que usa Apple en sus reveals. */
export const EASE_APPLE: [number, number, number, number] = [0.22, 1, 0.36, 1]

```

### 📄 frontend/src/core/ui/motion/index.tsx
```typescript
/**
 * Motion primitives — animaciones cinematográficas reutilizables (estilo Apple).
 * Construidas sobre framer-motion. Todas respetan `prefers-reduced-motion`.
 *
 * - <Reveal>      : entrada con fade + desplazamiento al entrar en viewport.
 * - <FocusReveal> : el hijo "entra en foco" (escala + fade + desplazamiento).
 *
 * Solo animan transform/opacity (compositor-friendly) y son one-shot al entrar
 * en viewport — no hacen trabajo en cada frame de scroll.
 */
import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_APPLE } from './ease'

interface RevealProps {
  children: ReactNode
  /** Desplazamiento vertical inicial en px (default 28). */
  y?: number
  /** Retraso en segundos para escalonar (stagger). */
  delay?: number
  /** Duración en segundos (default 0.7). */
  duration?: number
  once?: boolean
  className?: string
}

export function Reveal({
  children,
  y = 28,
  delay = 0,
  duration = 0.7,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, ease: EASE_APPLE, delay }}
    >
      {children}
    </motion.div>
  )
}

interface FocusRevealProps {
  children: ReactNode
  className?: string
  /** Escala inicial mientras está "fuera de foco" (default 0.92). */
  fromScale?: number
  /** Retraso en segundos para escalonar (stagger). */
  delay?: number
}

/**
 * El contenido "entra en foco" al aparecer: escala + fade + desplazamiento.
 * Animación one-shot vía whileInView (solo transform/opacity, compositor-friendly)
 * — no recalcula nada en cada frame de scroll.
 */
export function FocusReveal({
  children,
  className,
  fromScale = 0.92,
  delay = 0,
}: FocusRevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 48, scale: fromScale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: EASE_APPLE, delay }}
    >
      {children}
    </motion.div>
  )
}

```

### 📄 frontend/src/core/ui/select.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";

import { cn } from "./utils";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-32 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

```

### 📄 frontend/src/core/ui/separator.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "./utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };

```

### 📄 frontend/src/core/ui/skeleton.tsx
```typescript
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };

```

### 📄 frontend/src/core/ui/sonner.tsx
```typescript
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

```

### 📄 frontend/src/core/ui/switch.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

```

### 📄 frontend/src/core/ui/table.tsx
```typescript
"use client";

import * as React from "react";

import { cn } from "./utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

```

### 📄 frontend/src/core/ui/tabs.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

```

### 📄 frontend/src/core/ui/textarea.tsx
```typescript
import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

```

### 📄 frontend/src/core/ui/tooltip.tsx
```typescript
﻿"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "./utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

```

### 📄 frontend/src/core/ui/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```

### 📄 frontend/src/core/utils/animation.ts
```typescript
import type { Variants, Transition } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════
// ANIMATION VARIANTS — Reutilizables en todo el proyecto
// SassBlum Futurista Design System
// ═══════════════════════════════════════════════════════════════

// Easing curves
export const easing = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outBack: [0.34, 1.56, 0.64, 1] as const,
  spring: [0.175, 0.885, 0.32, 1.275] as const,
  apple: [0.22, 1, 0.36, 1] as const,
}

// Durations
export const duration = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.6,
  glacial: 1.2,
}

// Fade up (aparece subiendo)
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: easing.outExpo },
  },
}

// Fade in (aparece con opacidad)
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.slow, ease: easing.outExpo },
  },
}

// Scale in (aparece escalando)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.slow, ease: easing.outBack },
  },
}

// Stagger container (anima hijos en secuencia)
export const staggerContainer = (staggerChildren = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren: 0.1,
    },
  },
})

// Stagger item (hijo individual)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: easing.outExpo },
  },
}

// Hover lift (se eleva al hover)
export const hoverLift = {
  whileHover: {
    y: -8,
    transition: { duration: duration.normal, ease: easing.outExpo },
  },
  whileTap: { scale: 0.98 },
}

// Magnetic hover (sigue el cursor ligeramente)
export const magneticHover = (strength = 0.3) => ({
  whileHover: { scale: 1.02 },
  transition: { type: 'spring', stiffness: 300, damping: 20 },
})

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.slow, ease: easing.outExpo },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(10px)',
    transition: { duration: duration.normal, ease: easing.outExpo },
  },
}

// Scroll-triggered animation config
export const scrollConfig = {
  once: true,
  margin: '-100px 0px',
  amount: 0.3,
} as const

```

### 📄 frontend/src/index.css
```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

/* ════════════════════════════════════════════════════════════════════
   SassBlum v2 — 3D Immersive Redesign
   Dark futuristic theme with purple/violet accents
   ════════════════════════════════════════════════════════════════════ */
:root {
  --font-size: 16px;

  /* Superficies + texto */
  --background: #06060a;
  --foreground: #eeeef5;
  --card: #0c0c14;
  --card-foreground: #eeeef5;
  --popover: #0c0c14;
  --popover-foreground: #eeeef5;

  /* Primary = accent violet */
  --primary: #7c5cfc;
  --primary-foreground: #ffffff;

  /* Secundarios / muted / accent */
  --secondary: #1a1a2e;
  --secondary-foreground: #eeeef5;
  --muted: #6b6b85;
  --muted-foreground: #6b6b85;
  --accent: #7c5cfc;
  --accent-foreground: #ffffff;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --success: #22d87a;
  --warning: #f59e0b;

  --border: rgba(255, 255, 255, 0.06);
  --input: rgba(255, 255, 255, 0.08);
  --input-background: #0c0c14;
  --switch-background: #1a1a2e;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --ring: #7c5cfc;

  /* ── Marca SassBlum ───────────────────────────── */
  --brand-bg: #06060a;
  --brand-bg2: #0c0c14;
  --brand-accent: #7c5cfc;
  --brand-accent2: #a78bfa;
  --brand-accent3: #c4b5fd;
  --brand-glow: rgba(124, 92, 252, 0.35);
  --brand-green: #22d87a;
  --brand-muted: #6b6b85;
  --brand-border: rgba(255, 255, 255, 0.06);

  /* Legacy aliases for existing components */
  --brand-navy: #06060a;
  --brand-navy-deep: #040408;
  --brand-cyan: #7c5cfc;
  --brand-cyan-dark: #a78bfa;

  /* Tipografía */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
    Roboto, Helvetica, Arial, sans-serif;
  --font-heading: 'Space Grotesk', sans-serif;

  --chart-1: #7c5cfc;
  --chart-2: #a78bfa;
  --chart-3: #c4b5fd;
  --chart-4: #22d87a;
  --chart-5: #f59e0b;
  --radius: 16px;

  /* Sidebar */
  --sidebar: #0c0c14;
  --sidebar-foreground: #eeeef5;
  --sidebar-primary: #7c5cfc;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1a1a2e;
  --sidebar-accent-foreground: #eeeef5;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: #7c5cfc;
}

.dark {
  --background: #06060a;
  --foreground: #eeeef5;
  --card: #0c0c14;
  --card-foreground: #eeeef5;
  --popover: #0c0c14;
  --popover-foreground: #eeeef5;
  --primary: #7c5cfc;
  --primary-foreground: #ffffff;
  --secondary: #1a1a2e;
  --secondary-foreground: #eeeef5;
  --muted: #6b6b85;
  --muted-foreground: #6b6b85;
  --accent: #7c5cfc;
  --accent-foreground: #ffffff;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --success: #22d87a;
  --warning: #f59e0b;
  --border: rgba(255, 255, 255, 0.06);
  --input: rgba(255, 255, 255, 0.08);
  --input-background: #0c0c14;
  --switch-background: #1a1a2e;
  --ring: #7c5cfc;
  --chart-1: #7c5cfc;
  --chart-2: #a78bfa;
  --chart-3: #c4b5fd;
  --chart-4: #22d87a;
  --chart-5: #f59e0b;
  --sidebar: #0c0c14;
  --sidebar-foreground: #eeeef5;
  --sidebar-primary: #7c5cfc;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1a1a2e;
  --sidebar-accent-foreground: #eeeef5;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: #7c5cfc;
}

@theme inline {
  --font-sans: var(--font-sans);
  --font-heading: var(--font-heading);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);

  --color-brand-bg: var(--brand-bg);
  --color-brand-bg2: var(--brand-bg2);
  --color-brand-accent: var(--brand-accent);
  --color-brand-accent2: var(--brand-accent2);
  --color-brand-accent3: var(--brand-accent3);
  --color-brand-glow: var(--brand-glow);
  --color-brand-green: var(--brand-green);
  --color-brand-muted: var(--brand-muted);
  --color-brand-border: var(--brand-border);

  /* Legacy aliases */
  --color-brand-navy: var(--brand-navy);
  --color-brand-navy-deep: var(--brand-navy-deep);
  --color-brand-cyan: var(--brand-cyan);
  --color-brand-cyan-dark: var(--brand-cyan-dark);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    letter-spacing: -0.011em;
    font-family: var(--font-heading);
  }

  ::selection {
    background: var(--brand-accent);
    color: #fff;
  }
}

@layer base {
  :where(:not(:has([class*=' text-']), :not(:has([class^='text-'])))) {
    h1 { font-size: var(--text-2xl); font-weight: var(--font-weight-semibold); line-height: 1.4; }
    h2 { font-size: var(--text-xl); font-weight: var(--font-weight-semibold); line-height: 1.4; }
    h3 { font-size: var(--text-lg); font-weight: var(--font-weight-medium); line-height: 1.5; }
    h4 { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: 1.5; }
    p { font-size: var(--text-base); font-weight: var(--font-weight-normal); line-height: 1.6; }
    label { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: 1.5; }
    button { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: 1.5; }
    input { font-size: var(--text-base); font-weight: var(--font-weight-normal); line-height: 1.5; }
  }
}

html {
  font-size: var(--font-size);
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--brand-accent) var(--brand-bg);
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--brand-bg); }
::-webkit-scrollbar-thumb { background: var(--brand-accent); border-radius: 3px; }

/* Oculta el cursor nativo solo en equipos con mouse real (donde se muestra el
   cursor personalizado de CustomCursor); en táctil no afecta. */
@media (hover: hover) and (pointer: fine) {
  *, *::before, *::after { cursor: none !important; }
}

/* ════════════════════════════════════════════════════════════════════
   Cinematic kit — animaciones premium
   ════════════════════════════════════════════════════════════════════ */

@keyframes galleryInfinite {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Texto con gradiente de marca animado */
.text-gradient-brand {
  background-image: linear-gradient(115deg, #7c5cfc 0%, #a78bfa 45%, #c4b5fd 100%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: brand-gradient 9s ease infinite;
}

@keyframes brand-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Orbes de luz flotantes */
@keyframes float-orb {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, -36px, 0) scale(1.06); }
}
.animate-float-orb { animation: float-orb 11s ease-in-out infinite; }

/* Pulso de brillo suave */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}
.animate-glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

/* Indicador de scroll del hero */
@keyframes scroll-cue {
  0% { transform: translateY(0); opacity: 0; }
  35% { opacity: 1; }
  70% { transform: translateY(10px); opacity: 0; }
  100% { opacity: 0; }
}
.animate-scroll-cue { animation: scroll-cue 1.8s ease-in-out infinite; }

/* Carrusel infinito (marquee) */
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee var(--marquee-duration, 40s) linear infinite;
  width: max-content;
  will-change: transform;
}
.marquee-track:hover .animate-marquee {
  animation-play-state: paused;
}
.marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

/* Pulse animation for badge */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.6); }
}
.animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

/* Float animations for hero cards */
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-15px, 25px) rotate(3deg); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, -20px) rotate(-4deg); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-10px, -15px) rotate(2deg); }
}

/* Scroll fill for hero indicator */
@keyframes scrollFill {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(400%); }
}

/* Noise overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

```

### 📄 frontend/src/infrastructure/http/ApiClient.ts
```typescript
/**
 * ApiClient — Axios singleton with JWT interceptors.
 *
 * Responsibility (SRP): one configured HTTP client for the whole app.
 *   - Request interceptor injects `Authorization: Bearer <access>`.
 *   - Response interceptor on 401 tries a refresh once, then retries; on failure
 *     it clears the session and notifies the logout handler.
 * Security: the access token lives ONLY in memory here (never localStorage — XSS).
 * Pattern: Singleton. SOLID: SRP · DIP (modules depend on this, not on axios).
 *
 * useAuth wires the tokens and the onForcedLogout callback.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { env } from '../config/env'

class ApiClient {
  private readonly http: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private onForcedLogout: (() => void) | null = null
  private isRefreshing = false

  constructor() {
    this.http = axios.create({
      baseURL: env.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000, // 15 seconds — prevents infinite spinner on backend hang
    })

    this.http.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`
      }
      return config
    })

    this.http.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config as AxiosRequestConfig & { _retry?: boolean }
        if (
          error.response?.status === 401 &&
          this.refreshToken &&
          !original._retry &&
          !this.isRefreshing
        ) {
          original._retry = true
          const refreshed = await this.tryRefresh()
          if (refreshed) {
            original.headers = original.headers ?? {}
            ;(original.headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`
            return this.http(original)
          }
          this.forceLogout()
        }
        return Promise.reject(error)
      },
    )
  }

  // ── Token / session wiring (called by useAuth) ──────────────────────────────

  setTokens(access: string | null, refresh: string | null): void {
    this.accessToken = access
    this.refreshToken = refresh
  }

  setForcedLogoutHandler(handler: () => void): void {
    this.onForcedLogout = handler
  }

  private forceLogout(): void {
    this.setTokens(null, null)
    this.onForcedLogout?.()
  }

  private async tryRefresh(): Promise<boolean> {
    this.isRefreshing = true
    try {
      // H#4 (audit): Send device fingerprint with refresh token for binding.
      // simplejwt rotation + blacklist mitigates token theft.
      const fingerprint = this._getDeviceFingerprint()
      const { data } = await axios.post(`${env.apiBaseUrl}/auth/token/refresh`, {
        refresh: this.refreshToken,
      }, {
        headers: fingerprint ? { 'X-Device-Id': fingerprint } : {},
      })
      this.accessToken = data.access
      return true
    } catch {
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  /** H#4: Generate a simple device fingerprint for token binding. */
  private _getDeviceFingerprint(): string {
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : null
      const screen = typeof window !== 'undefined' ? window.screen : null
      const parts = [
        nav?.userAgent ?? '',
        nav?.language ?? '',
        screen?.width ?? 0,
        screen?.height ?? 0,
        new Date().getTimezoneOffset(),
      ]
      // Simple hash — not cryptographic, just a binding signal
      let hash = 0
      const str = parts.join('|')
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
      }
      return `fp-${Math.abs(hash).toString(36)}`
    } catch {
      return ''
    }
  }

  // ── Verb helpers ────────────────────────────────────────────────────────────

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.get<T>(url, config)).data
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.post<T>(url, body, config)).data
  }

  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.patch<T>(url, body, config)).data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.delete<T>(url, config)).data
  }
}

// Single shared instance (Singleton)
export const apiClient = new ApiClient()

```

### 📄 frontend/src/infrastructure/http/apiError.ts
```typescript
/**
 * apiError — extract a human-readable message from an Axios error.
 *
 * Handles the three shapes the backend can return:
 *   - DRF domain error:      { detail: "..." }
 *   - DRF serializer error:  { campo: ["msg", ...], ... }
 *   - No response (network/CORS/server down): a connection message.
 */

import { AxiosError } from 'axios'

export function apiError(err: unknown, fallback = 'Ocurrió un error.'): string {
  if (err instanceof AxiosError) {
    // No response → network error, CORS block, or server not running
    if (!err.response) {
      return 'No se pudo conectar con el servidor. ¿Está el backend corriendo en http://localhost:8000?'
    }
    const data = err.response.data as unknown
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (typeof obj.detail === 'string') return obj.detail
      // Serializer field errors: take the first field's first message
      for (const value of Object.values(obj)) {
        if (Array.isArray(value) && value.length && typeof value[0] === 'string') {
          return value[0]
        }
        if (typeof value === 'string') return value
      }
    }
    return `Error ${err.response.status}: ${fallback}`
  }
  return err instanceof Error ? err.message : fallback
}

```

### 📄 frontend/src/infrastructure/websocket/SocketClient.ts
```typescript
/**
 * SocketClient — singleton WebSocket client for live notifications.
 *
 * Responsibility (SRP): manage one WS connection and fan out events to subscribers.
 *     No business logic, no DOM — pure transport + pub/sub.
 * Pattern: Singleton + Observer subject (the FE side of the Observer pattern).
 * SOLID: SRP · DIP (hooks depend on this abstraction, not on raw WebSocket)
 *
 * Reconnect: exponential backoff (1s → 2s → 4s … capped at 30s) on unexpected close.
 *
 * Usage:
 *   import { socketClient } from '@/infrastructure/websocket/SocketClient'
 *   socketClient.connect(accessToken)
 *   const off = socketClient.subscribe('notification_new', (payload) => { ... })
 *   off() // unsubscribe
 */

type EventHandler = (payload: unknown) => void

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'
const MAX_BACKOFF_MS = 30_000

class SocketClient {
  private socket: WebSocket | null = null
  private token: string | null = null
  private handlers = new Map<string, Set<EventHandler>>()
  private backoff = 1_000
  private shouldReconnect = false

  /** Open the connection with the user's access token. Idempotent. */
  connect(token: string): void {
    this.token = token
    this.shouldReconnect = true
    this.open()
  }

  private open(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return

    const url = `${WS_BASE}/ws/notifications/?token=${encodeURIComponent(this.token ?? '')}`
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.backoff = 1_000 // reset backoff on a successful connection
    }

    this.socket.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { event?: string; payload?: unknown }
        if (data.event) this.emit(data.event, data.payload)
      } catch {
        // ignore malformed frames
      }
    }

    this.socket.onclose = () => {
      this.socket = null
      if (this.shouldReconnect) {
        setTimeout(() => this.open(), this.backoff)
        this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS)
      }
    }

    this.socket.onerror = () => {
      this.socket?.close()
    }
  }

  /** Close the connection and stop reconnecting. */
  disconnect(): void {
    this.shouldReconnect = false
    this.socket?.close()
    this.socket = null
  }

  /** Subscribe to a server event. Returns an unsubscribe function. */
  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, payload: unknown): void {
    this.handlers.get(event)?.forEach((h) => h(payload))
  }
}

// Single shared instance (Singleton)
export const socketClient = new SocketClient()
export type { EventHandler }

```

### 📄 frontend/src/main.tsx
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

### 📄 frontend/src/modules/auth/components/LoginForm/index.tsx
```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiError } from '../../../../infrastructure/http/apiError'
import { RippleButton } from '../../../../core/ui/RippleButton'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'

interface LoginFormProps {
  readonly onSuccess?: () => void
}

/**
 * SRP: captures credentials and submits via useAuth (DIP — never AuthService directly).
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password })
      onSuccess?.()
    } catch (err: unknown) {
      setError(apiError(err, 'No se pudo iniciar sesión.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" required placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <RippleButton type="submit" variant="brand" size="lg" disabled={isLoading} className="w-full">
        {isLoading ? 'Entrando…' : 'Ingresar'}
      </RippleButton>
    </form>
  )
}

```

### 📄 frontend/src/modules/auth/components/ProtectedRoute.tsx
```typescript
/**
 * ProtectedRoute — redirects to /login when there is no in-memory session.
 * Optionally restricts by role. SRP: route guarding only.
 */

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../interfaces/IAuthService'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

```

### 📄 frontend/src/modules/auth/components/RegisterForm/index.tsx
```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { EmailValidator } from '../../validators/EmailValidator'
import { PasswordValidator } from '../../validators/PasswordValidator'
import { apiError } from '../../../../infrastructure/http/apiError'
import { RippleButton } from '../../../../core/ui/RippleButton'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'

interface RegisterFormProps {
  onSuccess?: (message: string) => void
}

/**
 * SRP: captures registration input, runs the FE validator chain, submits via useAuth.
 * Chain of Responsibility: EmailValidator → PasswordValidator before the API call.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', ruc: '', password: '', confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = (): string | null => {
    const email = new EmailValidator()
    email.addValidator(new PasswordValidator())
    const result = email.run(form)
    if (!result.isValid) return result.errors[0]
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) { setError(v); return }
    setError(null)
    setLoading(true)
    try {
      const res = await register(form)
      onSuccess?.(res.message)
    } catch (err: unknown) {
      setError(apiError(err, 'No se pudo crear la cuenta.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" required value={form.nombre} onChange={set('nombre')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" required value={form.apellido} onChange={set('apellido')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">Correo electrónico</Label>
        <Input id="reg-email" type="email" required value={form.email} onChange={set('email')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-ruc">RUC <span className="text-muted-foreground text-xs font-normal">(opcional — se autocompleta al crear tickets)</span></Label>
        <Input id="reg-ruc" inputMode="numeric" maxLength={13} value={form.ruc} onChange={set('ruc')} placeholder="Ej: 0991234567001" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Contraseña</Label>
        <Input id="reg-password" type="password" required value={form.password} onChange={set('password')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
        <Input id="reg-confirm" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <RippleButton type="submit" variant="brand" size="lg" disabled={loading} className="w-full">
        {loading ? 'Creando…' : 'Crear cuenta'}
      </RippleButton>
    </form>
  )
}

```

### 📄 frontend/src/modules/auth/hooks/useAuth.tsx
```typescript
/**
 * useAuth — auth Context + hook. JWT lives ONLY in memory here (never localStorage).
 *
 * SRP: holds the session state and exposes login/register/logout.
 * DIP: depends on IAuthService (injected, defaults to the concrete authService).
 * Pattern: Singleton (Context) + Observer (reactive state).
 * Security: on mount there is no session (page reload requires re-login — expected).
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import type {
  IAuthService,
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '../interfaces/IAuthService'
import { authService as defaultAuthService } from '../services/AuthService'
import { apiClient } from '../../../infrastructure/http/ApiClient'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<{ message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
  service?: IAuthService
}

export function AuthProvider({ children, service = defaultAuthService }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Wire ApiClient's forced-logout (refresh failure) to clear our state.
  useEffect(() => {
    apiClient.setForcedLogoutHandler(() => {
      setUser(null)
      setRefreshToken(null)
    })
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const { user: u, tokens } = await service.login(credentials)
      apiClient.setTokens(tokens.accessToken, tokens.refreshToken)
      socketClient.connect(tokens.accessToken)  // live notifications (Observer FE)
      setRefreshToken(tokens.refreshToken)
      setUser(u)
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const register = useCallback((data: RegisterData) => service.register(data), [service])

  const logout = useCallback(async () => {
    try {
      if (refreshToken) await service.logout(refreshToken)
    } finally {
      apiClient.setTokens(null, null)
      socketClient.disconnect()
      setUser(null)
      setRefreshToken(null)
    }
  }, [service, refreshToken])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.')
  return ctx
}

```

### 📄 frontend/src/modules/auth/hooks/useAuthService.tsx
```typescript
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { IAuthService } from '../interfaces/IAuthService'

/**
 * AuthServiceContext — DIP seam for auth pages.
 *
 * Until the full useAuth hook (Sprint 1 · S6) lands, the password-reset pages
 * consume IAuthService through this context. The app root injects a concrete
 * AuthService (or a mock in tests) — pages never import the concrete class.
 * SOLID: DIP.
 */
export const AuthServiceContext = createContext<IAuthService | null>(null)

interface AuthServiceProviderProps {
  service: IAuthService
  children: ReactNode
}

export function AuthServiceProvider({ service, children }: AuthServiceProviderProps) {
  return (
    <AuthServiceContext.Provider value={service}>
      {children}
    </AuthServiceContext.Provider>
  )
}

export function useAuthService(): IAuthService {
  const service = useContext(AuthServiceContext)
  if (!service) {
    throw new Error('Auth pages must be wrapped in <AuthServiceProvider>.')
  }
  return service
}

```

### 📄 frontend/src/modules/auth/interfaces/IAuthService.ts
```typescript
/**
 * Root contract for all authentication operations in the frontend.
 * Every component, hook, and page that needs auth depends on THIS interface,
 * never on the concrete AuthService class (DIP).
 *
 * Responsibility (SRP): declare the auth operation contract. No HTTP logic here.
 * Depends on: nothing — this is the abstraction root for the auth module.
 * Pattern: DIP anchor · Singleton target (AuthService will implement this)
 * SOLID: DIP · OCP · LSP (AuthService is fully replaceable in tests without touching views)
 *
 * Sprint coverage:
 *   S1  → this file (contracts only)
 *   S6  → AuthService implements IAuthService
 *   S6  → useAuth hook exposes IAuthService methods to components
 */

// ─── Input types ─────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  nombre: string
  apellido: string
  email: string
  ruc?: string
  password: string
  confirmPassword: string
}

// ─── Output / domain types ────────────────────────────────────────────────────

export interface AuthTokens {
  /**
   * Short-lived JWT (1 h). Lives ONLY in memory via useAuth Context.
   * NEVER stored in localStorage or sessionStorage (XSS risk).
   */
  accessToken: string
  /** Long-lived JWT (7 d). Used by ApiClient interceptor to refresh accessToken. */
  refreshToken: string
}

export type UserRole = 'CLIENTE' | 'TRABAJADOR' | 'ADMINISTRADOR'
export type UserStatus = 'ACTIVO' | 'BLOQUEADO' | 'PENDIENTE'

export interface AuthUser {
  id: string
  email: string
  nombre: string
  apellido: string
  ruc: string
  rol: UserRole
  estado: UserStatus
  emailVerificado: boolean
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface IAuthService {
  /**
   * HU-01: Authenticate user and return tokens + profile.
   * Throws: InvalidCredentials | AccountLocked | EmailNotVerified
   */
  login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }>

  /**
   * HU-02: Register a new CLIENTE account (status = PENDIENTE until email verified).
   * Triggers the verification email via backend.
   * Throws: EmailAlreadyExists | PasswordPolicyViolation
   */
  register(data: RegisterData): Promise<{ message: string }>

  /**
   * Invalidate the session by adding the refresh token to the backend blacklist.
   * Throws: InvalidToken | TokenAlreadyBlacklisted
   */
  logout(refreshToken: string): Promise<void>

  /**
   * HU-03 step 1: Request a password-reset email.
   * Does NOT reveal whether the email is registered (security: no user enumeration).
   * Throws: RateLimitExceeded
   */
  forgotPassword(email: string): Promise<{ message: string }>

  /**
   * HU-03 step 2: Apply the new password using the one-time token from email.
   * Invalidates all active sessions for the user after success.
   * Throws: InvalidToken | TokenExpired | PasswordPolicyViolation
   */
  resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }>

  /**
   * Confirm email address using the token sent after registration.
   * Transitions user status from PENDIENTE → ACTIVO.
   * Throws: InvalidToken | TokenExpired | AlreadyVerified
   */
  verifyEmail(token: string): Promise<{ message: string }>

  /**
   * Exchange a valid refresh token for a new token pair.
   * Called automatically by the ApiClient interceptor on 401 responses.
   * Throws: InvalidToken | TokenExpired
   */
  refreshTokens(refreshToken: string): Promise<AuthTokens>
}

```

### 📄 frontend/src/modules/auth/interfaces/IUserAdminActions.ts
```typescript
/**
 * IUserAdminActions — FE contract for admin user management (HU-14, ISP).
 * Separate from IAuthService (session) — ISP. SOLID: ISP · DIP.
 */

export interface AdminUser {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  estado: string
  emailVerificado: boolean
}

export interface CreateUserData {
  nombre: string
  apellido: string
  email: string
  password: string
  role: 'worker' | 'admin'
}

export interface IUserAdminActions {
  listUsers(filters?: { role?: string; estado?: string }): Promise<AdminUser[]>
  createUser(data: CreateUserData): Promise<AdminUser>
  blockUser(id: string): Promise<AdminUser>
  unblockUser(id: string): Promise<AdminUser>
}

```

### 📄 frontend/src/modules/auth/pages/AdminUserPage/index.tsx
```typescript
import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { userAdminService } from '../../services/UserAdminService'
import type { AdminUser } from '../../interfaces/IUserAdminActions'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'

/**
 * SRP: admin page to list/create/block users. DIP: uses IUserAdminActions (userAdminService).
 * Admin-only (route guarded by ProtectedRoute roles).
 */
export function AdminUserPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', role: 'worker' as 'worker' | 'admin' })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setUsers(await userAdminService.listUsers())
  }, [])

  useEffect(() => { void load() }, [load])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await userAdminService.createUser(form)
      setForm({ nombre: '', apellido: '', email: '', password: '', role: 'worker' })
      await load()
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(d ?? 'No se pudo crear el usuario.')
    }
  }

  const toggleBlock = async (u: AdminUser) => {
    if (u.estado === 'bloqueado') await userAdminService.unblockUser(u.id)
    else await userAdminService.blockUser(u.id)
    await load()
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-foreground">Gestión de usuarios</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Crea trabajadores/administradores y gestiona su acceso.</p>
      </header>

      <form onSubmit={create} className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <Input placeholder="Apellido" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
        <Input type="email" placeholder="Correo" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input type="password" placeholder="Contraseña" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as 'worker' | 'admin' })}
          className="h-9 rounded-md border border-input bg-input-background text-foreground px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="worker">Trabajador</option>
          <option value="admin">Administrador</option>
        </select>
        <Button type="submit" variant="brand">Crear usuario</Button>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-destructive">{error}</p>}
      </form>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/50 border-b border-border">
              <th className="py-2.5 px-4 font-semibold">Email</th>
              <th className="font-semibold">Rol</th>
              <th className="font-semibold">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-4 text-foreground">{u.email}</td>
                <td className="capitalize text-muted-foreground">{u.rol.toLowerCase()}</td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    u.estado === 'bloqueado'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
                    {u.estado}
                  </span>
                </td>
                <td className="text-right pr-4">
                  <button
                    type="button"
                    onClick={() => void toggleBlock(u)}
                    className="text-xs text-brand-cyan-dark font-medium hover:underline cursor-pointer"
                  >
                    {u.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

```

### 📄 frontend/src/modules/auth/pages/ForgotPasswordPage/index.tsx
```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { useAuthService } from '../../hooks/useAuthService'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'

/**
 * SRP: collects the email and requests a reset link.
 * DIP: calls IAuthService.forgotPassword via useAuthService — never the concrete class.
 * Security: shows the same generic confirmation regardless of whether the email exists.
 */
export function ForgotPasswordPage() {
  const auth = useAuthService()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await auth.forgotPassword(email)
      setMessage(res.message)
    } catch {
      // Generic message even on error — no enumeration / no leakage
      setMessage('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.')
    } finally {
      setStatus('done')
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan-dark">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Revisa tu correo</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />
      </div>

      <Button type="submit" variant="brand" size="lg" disabled={status === 'loading'} className="w-full">
        {status === 'loading' ? 'Enviando…' : 'Enviar enlace'}
      </Button>
    </form>
  )
}

```

### 📄 frontend/src/modules/auth/pages/ResetPasswordPage/index.tsx
```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuthService } from '../../hooks/useAuthService'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'

interface ResetPasswordPageProps {
  /** Token from the email link (?token=...). The app router extracts and passes it. */
  token: string
  onSuccess?: () => void
}

/**
 * SRP: collects + validates a new password and submits the reset.
 * DIP: calls IAuthService.resetPassword via useAuthService.
 * Validation: minimum length + match (the S5 PasswordValidator chain plugs in here later).
 */
export function ResetPasswordPage({ token, onSuccess }: ResetPasswordPageProps) {
  const auth = useAuthService()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = (): string | null => {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    if (password !== confirm) return 'Las contraseñas no coinciden.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLoading(true)
    try {
      await auth.resetPassword(token, password, confirm)
      setDone(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Contraseña actualizada</h2>
        <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" variant="brand" size="lg" disabled={loading} className="w-full">
        {loading ? 'Guardando…' : 'Restablecer contraseña'}
      </Button>
    </form>
  )
}

```

### 📄 frontend/src/modules/auth/pages/VerifyEmailPage/index.tsx
```typescript
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuthService } from '../../hooks/useAuthService'
import { apiError } from '../../../../infrastructure/http/apiError'
import { Button } from '../../../../core/ui/button'

interface VerifyEmailPageProps {
  token: string
}

/**
 * SRP: confirms an email using the token from the verification link (?token=...).
 * DIP: calls IAuthService.verifyEmail via useAuthService. Runs once on mount.
 */
export function VerifyEmailPage({ token }: VerifyEmailPageProps) {
  const auth = useAuthService()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!token) {
      setStatus('error')
      setMessage('Falta el token de verificación en el enlace.')
      return
    }
    void auth
      .verifyEmail(token)
      .then((res) => { setStatus('ok'); setMessage(res.message) })
      .catch((err) => { setStatus('error'); setMessage(apiError(err, 'No se pudo verificar el correo.')) })
  }, [auth, token])

  return (
    <div className="text-center space-y-4 py-4">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan-dark" />
          <p className="text-sm">Verificando tu correo…</p>
        </div>
      )}

      {status === 'ok' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Correo verificado</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="brand" className="w-full">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No se pudo verificar</h2>
          <p className="text-sm text-destructive">{message}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
        </>
      )}
    </div>
  )
}

```

### 📄 frontend/src/modules/auth/services/AuthService.ts
```typescript
/**
 * AuthService — concrete IAuthService using ApiClient.
 *
 * SRP: auth HTTP operations + BE↔FE shape mapping. DIP: components depend on
 * IAuthService, never on this class. Pattern: Singleton (exported instance).
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  IAuthService,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  AuthUser,
  UserRole,
  UserStatus,
} from '../interfaces/IAuthService'

const ROLE_MAP: Record<string, UserRole> = {
  client: 'CLIENTE',
  worker: 'TRABAJADOR',
  admin: 'ADMINISTRADOR',
}
const STATUS_MAP: Record<string, UserStatus> = {
  activo: 'ACTIVO',
  bloqueado: 'BLOQUEADO',
  pendiente: 'PENDIENTE',
}

interface BackendUser {
  id: number
  email: string
  nombre: string
  apellido: string
  ruc?: string
  rol: string
  estado: string
  email_verificado: boolean
}

function mapUser(u: BackendUser): AuthUser {
  return {
    id: String(u.id),
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    ruc: u.ruc ?? '',
    rol: ROLE_MAP[u.rol] ?? 'CLIENTE',
    estado: STATUS_MAP[u.estado] ?? 'PENDIENTE',
    emailVerificado: u.email_verificado,
  }
}

function mapTokens(t: { access: string; refresh: string }): AuthTokens {
  return { accessToken: t.access, refreshToken: t.refresh }
}

class AuthService implements IAuthService {
  async login(credentials: LoginCredentials) {
    const data = await apiClient.post<{ user: BackendUser; tokens: { access: string; refresh: string } }>(
      '/auth/login',
      credentials,
    )
    return { user: mapUser(data.user), tokens: mapTokens(data.tokens) }
  }

  async register(data: RegisterData) {
    return apiClient.post<{ message: string }>('/auth/register', {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      ruc: data.ruc ?? '',
      password: data.password,
      confirm_password: data.confirmPassword,
    })
  }

  async logout(refreshToken: string) {
    await apiClient.post('/auth/logout', { refresh: refreshToken })
  }

  async forgotPassword(email: string) {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    })
  }

  async verifyEmail(token: string) {
    return apiClient.post<{ message: string }>('/auth/verify-email', { token })
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const data = await apiClient.post<{ access: string; refresh?: string }>(
      '/auth/token/refresh',
      { refresh: refreshToken },
    )
    return { accessToken: data.access, refreshToken: data.refresh ?? refreshToken }
  }
}

export const authService = new AuthService()

```

### 📄 frontend/src/modules/auth/services/UserAdminService.ts
```typescript
/**
 * UserAdminService — concrete IUserAdminActions using ApiClient.
 * SRP: user-admin HTTP + mapping. DIP: hooks depend on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  IUserAdminActions,
  AdminUser,
  CreateUserData,
} from '../interfaces/IUserAdminActions'

interface BeUser {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: string
  estado: string
  email_verificado: boolean
}

function mapUser(u: BeUser): AdminUser {
  return {
    id: String(u.id),
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    rol: u.rol,
    estado: u.estado,
    emailVerificado: u.email_verificado,
  }
}

class UserAdminService implements IUserAdminActions {
  async listUsers(filters?: { role?: string; estado?: string }): Promise<AdminUser[]> {
    const params = new URLSearchParams()
    if (filters?.role) params.set('role', filters.role)
    if (filters?.estado) params.set('estado', filters.estado)
    const qs = params.toString()
    const data = await apiClient.get<{ items: BeUser[] }>(`/usuarios/${qs ? `?${qs}` : ''}`)
    return data.items.map(mapUser)
  }

  async createUser(data: CreateUserData): Promise<AdminUser> {
    return mapUser(await apiClient.post<BeUser>('/usuarios/', data))
  }

  async blockUser(id: string): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}/bloquear`))
  }

  async unblockUser(id: string): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}/desbloquear`))
  }
}

export const userAdminService = new UserAdminService()

```

### 📄 frontend/src/modules/auth/validators/EmailValidator.ts
```typescript
/**
 * EmailValidator — Chain of Responsibility node for email format (FE).
 * Extends BaseValidator (core). SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export class EmailValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const email = String((data as { email?: string })?.email ?? '').trim()
    if (!EMAIL_RE.test(email)) {
      return { isValid: false, errors: ['El correo no tiene un formato válido.'], field: 'email' }
    }
    return { isValid: true, errors: [], field: 'email' }
  }
}

```

### 📄 frontend/src/modules/auth/validators/PasswordValidator.ts
```typescript
/**
 * PasswordValidator — Chain of Responsibility node for password policy (FE).
 * Policy: ≥8 chars, at least one letter and one digit. SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class PasswordValidator extends BaseValidator {
  private static readonly MIN = 8

  validate(data: unknown): ValidationResult {
    const password = String((data as { password?: string })?.password ?? '')
    if (password.length < PasswordValidator.MIN) {
      return {
        isValid: false,
        errors: [`La contraseña debe tener al menos ${PasswordValidator.MIN} caracteres.`],
        field: 'password',
      }
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return {
        isValid: false,
        errors: ['La contraseña debe incluir al menos una letra y un número.'],
        field: 'password',
      }
    }
    return { isValid: true, errors: [], field: 'password' }
  }
}

```

### 📄 frontend/src/modules/catalog/components/CatalogAdminPanel.tsx
```typescript
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ImagePlus, Loader2, X, Power } from 'lucide-react'
import { useCatalogAdmin, type BeService } from '../hooks/useCatalogAdmin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { Badge } from '../../../core/ui/badge'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'

/**
 * Admin/worker catalog management with create + EDIT + toggle active.
 * DIP: depends on useCatalogAdmin hook (interface), not on apiClient directly.
 * SRP: only renders UI and delegates API calls to the hook.
 *
 * H#2 (cliente): Added edit functionality so admin can modify existing services.
 */
export function CatalogAdminPanel() {
  const { services, loading, load, createService, editService, toggleService } = useCatalogAdmin()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', categoria: '' })
  const [imagen, setImagen] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', categoria: '' })
    setImagen(null)
    setEditingId(null)
  }

  const startEdit = (service: BeService) => {
    setForm({ nombre: service.nombre, descripcion: service.descripcion, categoria: service.categoria })
    setImagen(null)
    setEditingId(service.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.descripcion || !form.categoria) {
      toast.error('Completa nombre, descripción y categoría')
      return
    }
    setSubmitting(true)
    try {
      if (editingId !== null) {
        await editService(editingId, form, imagen)
        toast.success('Servicio actualizado', { description: form.nombre })
      } else {
        await createService(form, imagen)
        toast.success('Servicio creado', { description: form.nombre })
      }
      resetForm()
      await load()
    } catch {
      toast.error(editingId ? 'No se pudo actualizar el servicio' : 'No se pudo crear el servicio')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleService(id)
      await load()
    } catch {
      toast.error('No se pudo cambiar el estado del servicio')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form — create or edit mode */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingId !== null ? 'Editar servicio' : 'Nuevo servicio'}</CardTitle>
              <CardDescription>
                {editingId !== null ? 'Modifica los datos del servicio' : 'Publica un servicio con su foto en el catálogo'}
              </CardDescription>
            </div>
            {editingId !== null && (
              <Button type="button" variant="ghost" size="icon" onClick={resetForm} aria-label="Cancelar edición">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-nombre">Nombre</Label>
              <Input id="s-nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-cat">Categoría</Label>
              <Input id="s-cat" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} placeholder="CCTV, Domótica, Soporte…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descripción</Label>
              <Textarea id="s-desc" rows={4} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-img">{editingId !== null ? 'Nueva foto (opcional)' : 'Foto del servicio'}</Label>
              <label htmlFor="s-img" className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-brand-cyan">
                <ImagePlus className="h-4 w-4 text-brand-cyan" />
                {imagen ? imagen.name : editingId !== null ? 'Cambiar imagen…' : 'Seleccionar imagen…'}
              </label>
              <input id="s-img" type="file" accept="image/*" className="hidden" onChange={(e) => setImagen(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1 bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId !== null ? <><Pencil className="h-4 w-4 mr-2" />Actualizar</> : <><Plus className="h-4 w-4 mr-2" />Crear servicio</>}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List with edit + toggle buttons */}
      <div className="lg:col-span-2">
        {loading ? (
          <p className="text-gray-500">Cargando catálogo…</p>
        ) : services.length === 0 ? (
          <p className="text-gray-500">Aún no hay servicios.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <Card key={s.id} className={`overflow-hidden transition-opacity ${editingId === s.id ? 'ring-2 ring-brand-cyan' : ''}`}>
                <div className="h-32 overflow-hidden bg-brand-navy/5">
                  <ImageWithFallback src={s.imagen_url} alt={s.nombre} className="w-full h-full object-cover" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{s.nombre}</CardTitle>
                    <Badge className={s.activo ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{s.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-brand-cyan">{s.categoria}</span>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => startEdit(s)}
                        aria-label={`Editar ${s.nombre}`}
                      >
                        <Pencil className="h-3 w-3 mr-1" />Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-7 px-2 text-xs ${s.activo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        onClick={() => void handleToggle(s.id)}
                        aria-label={s.activo ? `Desactivar ${s.nombre}` : `Activar ${s.nombre}`}
                      >
                        <Power className="h-3 w-3 mr-1" />{s.activo ? 'Off' : 'On'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

```

### 📄 frontend/src/modules/catalog/components/CatalogPage/index.tsx
```typescript
import { useCatalog } from '../../hooks/useCatalog'
import { ServiceCard } from '../ServiceCard'
import { ServiceFilter } from '../ServiceFilter'

interface CatalogPageProps {
  onSelectService?: (id: string) => void
}

/**
 * SRP: grid of active services + filters. DIP: data via useCatalog (ICatalogClientView).
 */
export function CatalogPage({ onSelectService }: CatalogPageProps) {
  const { services, isLoading, error, setFilters } = useCatalog()

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Catálogo de servicios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Elige un servicio para crear un ticket.</p>
      </header>

      <ServiceFilter onChange={setFilters} />

      {isLoading && <p className="text-sm text-gray-400">Cargando servicios…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {!isLoading && !error && services.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">No hay servicios disponibles.</p>
      )}
      {!isLoading && !error && services.length > 0 && (
        /* H#1 (cliente): Grid compacto 6-9 artículos por pantalla */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} onSelect={onSelectService} />
          ))}
        </div>
      )}
    </section>
  )
}

```

### 📄 frontend/src/modules/catalog/components/ServiceCard/index.tsx
```typescript
import { ArrowRight } from 'lucide-react'
import { GlowCard } from '../../../../core/ui/GlowCard'
import type { ServiceSummary } from '../../interfaces/ICatalogService'

interface ServiceCardProps {
  service: ServiceSummary
  onSelect?: (id: string) => void
}

/**
 * SRP: renders one service card.
 * DIP: depends on ServiceSummary type only.
 * Futurista: GlowCard 3D tilt + glow effect que sigue al cursor.
 */
export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <GlowCard className="bg-card border border-border shadow-sm hover:shadow-lg transition-shadow duration-500">
      <button
        type="button"
        onClick={() => onSelect?.(service.id)}
        className="group text-left w-full p-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-xs font-semibold text-foreground group-hover:text-brand-cyan-dark transition-colors duration-300 line-clamp-1">
            {service.nombre}
          </h3>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 shrink-0">
            {service.categoria}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{service.descripcion}</p>
        <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-brand-cyan-dark">
          Crear ticket
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    </GlowCard>
  )
}

```

### 📄 frontend/src/modules/catalog/components/ServiceFilter/index.tsx
```typescript
import { useState } from 'react'
import type { ServiceFilterOptions } from '../../interfaces/ICatalogService'
import { Input } from '../../../../core/ui/input'

interface ServiceFilterProps {
  onChange: (filters: ServiceFilterOptions) => void
}

/** SRP: a single responsibility — emit catalog filter changes (categoría + búsqueda). */
export function ServiceFilter({ onChange }: ServiceFilterProps) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')

  const emit = (next: Partial<{ busqueda: string; categoria: string }>) => {
    const merged = { busqueda, categoria, ...next }
    onChange({
      busqueda: merged.busqueda || undefined,
      categoria: merged.categoria || undefined,
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="Buscar servicio…"
        value={busqueda}
        onChange={(e) => { setBusqueda(e.target.value); emit({ busqueda: e.target.value }) }}
        className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Categoría"
        value={categoria}
        onChange={(e) => { setCategoria(e.target.value); emit({ categoria: e.target.value }) }}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

```

### 📄 frontend/src/modules/catalog/hooks/useCatalog.tsx
```typescript
/**
 * useCatalog — Context + hook for browsing the service catalog.
 * DIP: depends on ICatalogClientView via Context, never on the concrete class.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
import type { ServiceSummary, ServiceFilterOptions } from '../interfaces/ICatalogService'

export const CatalogServiceContext = createContext<ICatalogClientView | null>(null)

function useCatalogService(): ICatalogClientView {
  const service = useContext(CatalogServiceContext)
  if (!service) throw new Error('useCatalog must be used inside <CatalogProvider>.')
  return service
}

export function CatalogProvider({ service, children }: { service: ICatalogClientView; children: ReactNode }) {
  return <CatalogServiceContext.Provider value={service}>{children}</CatalogServiceContext.Provider>
}

interface UseCatalogResult {
  services: ServiceSummary[]
  isLoading: boolean
  error: string | null
  setFilters: (f: ServiceFilterOptions) => void
}

export function useCatalog(): UseCatalogResult {
  const service = useCatalogService()
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [filters, setFilters] = useState<ServiceFilterOptions>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setServices(await service.getActiveServices(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el catálogo')
    } finally {
      setIsLoading(false)
    }
  }, [service, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  return { services, isLoading, error, setFilters }
}

```

### 📄 frontend/src/modules/catalog/hooks/useCatalogAdmin.tsx
```typescript
import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'

export interface BeService {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagen_url?: string
}

/**
 * DIP seam for CatalogAdminPanel — encapsulates all API calls.
 * Components depend on this hook's return type, not on apiClient directly.
 * Makes CatalogAdminPanel testable (mock the hook, not axios).
 */
export function useCatalogAdmin() {
  const [services, setServices] = useState<BeService[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<{ items: BeService[] }>('/servicios/')
      setServices(data.items)
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createService = useCallback(async (form: { nombre: string; descripcion: string; categoria: string }, imagen?: File | null) => {
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('descripcion', form.descripcion)
    fd.append('categoria', form.categoria)
    if (imagen) fd.append('imagen', imagen)
    await apiClient.post('/servicios/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const editService = useCallback(async (id: number, form: { nombre: string; descripcion: string; categoria: string }, imagen?: File | null) => {
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('descripcion', form.descripcion)
    fd.append('categoria', form.categoria)
    if (imagen) fd.append('imagen', imagen)
    await apiClient.patch(`/servicios/admin/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const toggleService = useCallback(async (id: number) => {
    await apiClient.patch(`/servicios/admin/${id}?action=toggle`)
  }, [])

  useEffect(() => { void load() }, [load])

  return { services, loading, load, createService, editService, toggleService }
}

```

### 📄 frontend/src/modules/catalog/interfaces/ICatalogAdminView.ts
```typescript
/**
 * ISP interface exposing only what an ADMIN user needs to manage the catalog.
 *
 * Responsibility (SRP): write/management operations that an admin performs.
 *     An admin creates, edits, and toggles services — no client-browse semantics.
 * Depends on: ServiceCreatePayload, ServiceEditPayload, ServiceDetail from ICatalogService.
 * Pattern: ISP — admin components use this, never ICatalogClientView.
 * SOLID: ISP · DIP · OCP
 *
 * Why separate from ICatalogClientView:
 *     The admin interface does not need getActiveServices with client-browse semantics.
 *     Merging both would force admin components to depend on methods they never call
 *     (ISP violation).
 *
 * OCP: new admin operation (e.g. bulkToggle) = new method here. Client view unaffected.
 */

import type { ServiceCreatePayload, ServiceEditPayload, ServiceDetail } from './ICatalogService'

export interface ICatalogAdminView {
  /** Create a new service entry in the catalog. */
  createService(data: ServiceCreatePayload): Promise<ServiceDetail>

  /** Partially update fields of an existing service. */
  editService(id: string, data: ServiceEditPayload): Promise<ServiceDetail>

  /** Toggle the active/inactive state of a service. */
  toggleActive(id: string): Promise<ServiceDetail>
}

```

### 📄 frontend/src/modules/catalog/interfaces/ICatalogClientView.ts
```typescript
/**
 * ISP interface exposing only what a CLIENT user needs from the catalog.
 *
 * Responsibility (SRP): read-only browse operations that a client performs.
 *     A client browses active services and views one before creating a ticket.
 * Depends on: ServiceSummary, ServiceDetail, ServiceFilterOptions from ICatalogService.
 * Pattern: ISP — useCatalog hook uses this, never the full ICatalogService.
 * SOLID: ISP · DIP · OCP
 *
 * Why NOT a subset of ICatalogService:
 *     If ICatalogService grows with admin or internal methods, extending it would
 *     expose those method names to client hooks (ISP violation). This interface
 *     is intentionally isolated.
 *
 * OCP: new read-only client operation = new method here. ICatalogAdminView unaffected.
 */

import type { ServiceSummary, ServiceDetail, ServiceFilterOptions } from './ICatalogService'

export interface ICatalogClientView {
  /** Browse all active services. Optional filter by category or free-text search. */
  getActiveServices(filters?: ServiceFilterOptions): Promise<ServiceSummary[]>

  /** View full detail of one active service before creating a support ticket. */
  getServiceDetail(id: string): Promise<ServiceDetail>
}

```

### 📄 frontend/src/modules/catalog/interfaces/ICatalogService.ts
```typescript
/**
 * Root contract for all catalog operations in the frontend.
 *
 * Responsibility (SRP): declare the complete catalog operation contract.
 *     No HTTP calls, no state management — only method signatures and shared types.
 * Depends on: nothing — root abstraction.
 * Pattern: DIP anchor — CatalogService (Singleton) will implement this in S11.
 * SOLID: DIP · OCP · LSP
 *
 * OCP extension: new catalog operation = new method signature here + implementation
 *     in CatalogService. ICatalogClientView and ICatalogAdminView remain frozen.
 */

// ─── Shared data shapes ──────────────────────────────────────────────────────

export interface ServiceSummary {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagenUrl: string
}

export interface ServiceDetail extends ServiceSummary {
  creadoEn: string       // ISO 8601
  actualizadoEn: string  // ISO 8601
}

export interface ServiceFilterOptions {
  categoria?: string
  busqueda?: string
}

export interface ServiceCreatePayload {
  nombre: string
  descripcion: string
  categoria: string
}

export interface ServiceEditPayload {
  nombre?: string
  descripcion?: string
  categoria?: string
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface ICatalogService {
  /** Return all active services, optionally filtered by category or free-text. */
  getActiveServices(filters?: ServiceFilterOptions): Promise<ServiceSummary[]>

  /** Return full detail of one active service. Throws ServiceNotFound if missing. */
  getServiceDetail(id: string): Promise<ServiceDetail>

  /** Create a new service (admin only — enforced at API level). */
  createService(data: ServiceCreatePayload): Promise<ServiceDetail>

  /** Partially update an existing service. */
  editService(id: string, data: ServiceEditPayload): Promise<ServiceDetail>

  /** Flip the active/inactive state of a service. */
  toggleActive(id: string): Promise<ServiceDetail>
}

```

### 📄 frontend/src/modules/catalog/services/CatalogService.ts
```typescript
/**
 * CatalogService — concrete ICatalogClientView (+ admin) using ApiClient.
 * SRP: catalog HTTP + shape mapping. DIP: hooks depend on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  ICatalogClientView,
} from '../interfaces/ICatalogClientView'
import type {
  ServiceSummary,
  ServiceDetail,
  ServiceFilterOptions,
} from '../interfaces/ICatalogService'

interface BackendService {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagen_url?: string
  creado_en?: string
  actualizado_en?: string
}

function mapSummary(s: BackendService): ServiceSummary {
  return {
    id: String(s.id),
    nombre: s.nombre,
    descripcion: s.descripcion,
    categoria: s.categoria,
    activo: s.activo,
    imagenUrl: s.imagen_url ?? '',
  }
}

function mapDetail(s: BackendService): ServiceDetail {
  return {
    ...mapSummary(s),
    creadoEn: s.creado_en ?? '',
    actualizadoEn: s.actualizado_en ?? '',
  }
}

class CatalogService implements ICatalogClientView {
  async getActiveServices(filters?: ServiceFilterOptions): Promise<ServiceSummary[]> {
    const params = new URLSearchParams()
    if (filters?.categoria) params.set('categoria', filters.categoria)
    if (filters?.busqueda) params.set('busqueda', filters.busqueda)
    const qs = params.toString()
    const data = await apiClient.get<{ items: BackendService[]; total: number }>(
      `/servicios/${qs ? `?${qs}` : ''}`,
    )
    return data.items.map(mapSummary)
  }

  async getServiceDetail(id: string): Promise<ServiceDetail> {
    const data = await apiClient.get<BackendService>(`/servicios/${id}`)
    return mapDetail(data)
  }
}

export const catalogService = new CatalogService()

```

### 📄 frontend/src/modules/contracts/components/ContractTemplate/index.tsx
```typescript
import { useState } from 'react'
import { FileText, Download, Printer } from 'lucide-react'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Textarea } from '../../../../core/ui/textarea'

/**
 * H#9 (cliente): Plantilla base de contratos de servicios.
 * Vicky Pinto: "Si tengo el formato del contrato de servicios, ahí sí es más seguro
 * porque son cláusulas que solo se cambian ciertas cosas."
 *
 * SRP: renders contract template form + preview.
 * The admin fills in variable fields and can print/download the contract.
 */

const CONTRACT_TEMPLATE = `CONTRATO DE PRESTACIÓN DE SERVICIOS TECNOLÓGICOS

Entre: SASS BLUM, representada por su representante legal, en adelante "EL PROVEEDOR"
Y: {{CLIENTE_NOMBRE}}, con RUC {{CLIENTE_RUC}}, en adelante "EL CLIENTE"

PRIMERA - OBJETO DEL CONTRATO
EL PROVEEDOR se compromete a prestar los siguientes servicios tecnológicos al CLIENTE:
{{SERVICIOS_DESCRIPCION}}

SEGUNDA - VIGENCIA
El presente contrato tendrá una vigencia desde el {{FECHA_INICIO}} hasta el {{FECHA_FIN}}.

TERCERA - VALOR Y FORMA DE PAGO
El valor total del presente contrato asciende a ${{VALOR_TOTAL}} ({{VALOR_LETRAS}}).
Forma de pago: {{FORMA_PAGO}}

CUARTA - OBLIGACIONES DEL PROVEEDOR
• Prestar los servicios contratados con la mayor diligencia profesional.
• Mantener la confidencialidad de la información del CLIENTE.
• Proporcionar soporte técnico durante el horario laboral establecido.

QUINTA - OBLIGACIONES DEL CLIENTE
• Facilitar el acceso necesario para la prestación de los servicios.
• Realizar los pagos en los plazos acordados.
• Comunicar oportunamente cualquier incidencia o requerimiento.

SEXTA - CONFIDENCIALIDAD
Las partes se comprometen a mantener estricta confidencialidad sobre toda la información
recibida durante la vigencia del presente contrato.

SÉPTIMA - RESOLUCIÓN
El presente contrato podrá resolverse por mutuo acuerdo de las partes o por incumplimiento
de cualquiera de las obligaciones establecidas.

En la ciudad de Guayaquil, a los {{DIA}} días del mes de {{MES}} de {{AÑO}}.


_________________________                    _________________________
EL PROVEEDOR                                 EL CLIENTE
SASS BLUM                                    {{CLIENTE_NOMBRE}}`

interface ContractField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date'
  placeholder: string
}

const CONTRACT_FIELDS: ContractField[] = [
  { key: 'CLIENTE_NOMBRE', label: 'Nombre del cliente', type: 'text', placeholder: 'Empresa XYZ S.A.' },
  { key: 'CLIENTE_RUC', label: 'RUC del cliente', type: 'text', placeholder: '0991234567001' },
  { key: 'SERVICIOS_DESCRIPCION', label: 'Servicios contratados', type: 'textarea', placeholder: 'Instalación de CCTV, cableado estructurado...' },
  { key: 'FECHA_INICIO', label: 'Fecha de inicio', type: 'date', placeholder: '' },
  { key: 'FECHA_FIN', label: 'Fecha de fin', type: 'date', placeholder: '' },
  { key: 'VALOR_TOTAL', label: 'Valor total ($)', type: 'text', placeholder: '5,000.00' },
  { key: 'VALOR_LETRAS', label: 'Valor en letras', type: 'text', placeholder: 'Cinco mil dólares' },
  { key: 'FORMA_PAGO', label: 'Forma de pago', type: 'text', placeholder: 'Transferencia bancaria, 50% anticipo' },
  { key: 'DIA', label: 'Día de firma', type: 'text', placeholder: '25' },
  { key: 'MES', label: 'Mes de firma', type: 'text', placeholder: 'junio' },
  { key: 'AÑO', label: 'Año de firma', type: 'text', placeholder: '2026' },
]

export function ContractTemplate() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const updateField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const generateContract = (): string => {
    let contract = CONTRACT_TEMPLATE
    for (const [key, value] of Object.entries(values)) {
      contract = contract.replaceAll(`{{${key}}}`, value || `[${key}]`)
    }
    return contract
  }

  const handlePrint = () => {
    setShowPreview(true)
    setTimeout(() => window.print(), 300)
  }

  const handleDownload = () => {
    const contract = generateContract()
    const blob = new Blob([contract], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrato_${values.CLIENTE_NOMBRE || 'borrador'}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-cyan" />
          Plantilla de Contratos
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Completa los campos para generar un borrador de contrato de servicios.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          {CONTRACT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`contract-${field.key}`}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={`contract-${field.key}`}
                  value={values[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={`contract-${field.key}`}
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={() => setShowPreview(true)} className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
              <FileText className="h-4 w-4 mr-2" />Vista previa
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />Descargar
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Vista previa del contrato</h3>
            <pre className="whitespace-pre-wrap text-xs text-foreground/90 leading-relaxed font-mono bg-slate-50 p-4 rounded-lg max-h-[600px] overflow-y-auto">
              {generateContract()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

```

### 📄 frontend/src/modules/dashboard/AdminDashboard.tsx
```typescript
import { useNavigate } from 'react-router-dom'
import { Ticket as TicketIcon, Users, BarChart3, Package, FileText, Images } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../core/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../core/ui/card'
import { Skeleton } from '../../core/ui/skeleton'
import { Reveal, FocusReveal } from '../../core/ui/motion'
import { useTicketsList } from '../tickets/hooks/useTickets'
import { TicketsTable } from '../tickets/components/TicketsTable'
import { AdminUserPage } from '../auth/pages/AdminUserPage'
import { ReportsDashboard } from '../reports/components/ReportsDashboard'
import { ReportsProvider } from '../reports/hooks/useReports'
import { reportsService } from '../reports/services/ReportsService'
import { CatalogAdminPanel } from '../catalog/components/CatalogAdminPanel'
import { GalleryAdminPanel } from '../gallery/components/GalleryAdminPanel'
import { ContractTemplate } from '../contracts/components/ContractTemplate'

export function AdminDashboard() {
  const { tickets, isLoading, error } = useTicketsList()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Reveal y={20} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tickets, usuarios, catálogo y reportes del sistema</p>
        </Reveal>

        <FocusReveal>
          <Tabs defaultValue="tickets" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tickets"><TicketIcon className="h-4 w-4 mr-2" />Tickets</TabsTrigger>
              <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Usuarios</TabsTrigger>
              <TabsTrigger value="catalog"><Package className="h-4 w-4 mr-2" />Catálogo</TabsTrigger>
              <TabsTrigger value="gallery"><Images className="h-4 w-4 mr-2" />Galería</TabsTrigger>
              <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-2" />Reportes</TabsTrigger>
              <TabsTrigger value="contracts"><FileText className="h-4 w-4 mr-2" />Contratos</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Tickets</CardTitle>
                  <CardDescription>Todos los tickets del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && <p className="text-destructive mb-4">{error}</p>}
                  {isLoading ? <Skeleton className="h-48 w-full rounded-lg" /> : <TicketsTable tickets={tickets} onView={(id) => navigate(`/tickets/${id}`)} />}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users"><AdminUserPage /></TabsContent>

            <TabsContent value="catalog"><CatalogAdminPanel /></TabsContent>

            <TabsContent value="gallery"><GalleryAdminPanel /></TabsContent>

            <TabsContent value="reports">
              <ReportsProvider service={reportsService}>
                <ReportsDashboard />
              </ReportsProvider>
            </TabsContent>

            <TabsContent value="contracts">
              <Card>
                <CardContent className="pt-6">
                  <ContractTemplate />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FocusReveal>
      </div>
    </div>
  )
}

```

### 📄 frontend/src/modules/dashboard/ClientDashboard.tsx
```typescript
import { TicketsPanel } from './TicketsPanel'

export function ClientDashboard() {
  return <TicketsPanel title="Mis Tickets" subtitle="Gestiona tus solicitudes de servicio" showCreate />
}

```

### 📄 frontend/src/modules/dashboard/TicketsPanel.tsx
```typescript
import { useNavigate } from 'react-router-dom'
import { Plus, Ticket as TicketIcon, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../core/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../core/ui/card'
import { Skeleton } from '../../core/ui/skeleton'
import { GlowCard } from '../../core/ui/GlowCard'
import { Reveal, FocusReveal } from '../../core/ui/motion'
import { EASE_APPLE } from '../../core/ui/motion/ease'
import { useTicketsList } from '../tickets/hooks/useTickets'
import { TicketsTable } from '../tickets/components/TicketsTable'
import { CreateTicketPage } from '../tickets/pages/CreateTicketPage'
import type { TicketSummary } from '../tickets/interfaces/ITicketService'

function StatCard({ label, value, icon: Icon, chip }: { label: string; value: number; icon: LucideIcon; chip: string }) {
  return (
    <GlowCard className="bg-white ring-1 ring-black/5 shadow-sm shadow-brand-navy/5">
      <div className="flex items-center gap-4 p-5">
        <motion.div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}
          whileHover={{ scale: 1.1, rotate: -6 }}
          transition={{ duration: 0.25, ease: EASE_APPLE }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        </div>
      </div>
    </GlowCard>
  )
}

function computeStats(tickets: TicketSummary[]) {
  const cerrados = (e: TicketSummary['estado']) => e === 'Resuelto' || e === 'Cerrado'
  return {
    total: tickets.length,
    activos: tickets.filter((t) => !cerrados(t.estado)).length,
    resueltos: tickets.filter((t) => cerrados(t.estado)).length,
    enProceso: tickets.filter((t) => t.estado === 'EnProceso').length,
  }
}

interface TicketsPanelProps {
  title: string
  subtitle: string
  showCreate?: boolean
}

export function TicketsPanel({ title, subtitle, showCreate = false }: TicketsPanelProps) {
  const { tickets, isLoading, error } = useTicketsList()
  const navigate = useNavigate()
  const stats = computeStats(tickets)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Reveal y={20} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-21 rounded-xl" />)
          ) : (
            <>
              <FocusReveal delay={0}><StatCard label="Total de Tickets" value={stats.total} icon={TicketIcon} chip="bg-brand-navy/8 text-brand-navy" /></FocusReveal>
              <FocusReveal delay={0.07}><StatCard label="Activos" value={stats.activos} icon={Clock} chip="bg-warning/10 text-warning" /></FocusReveal>
              <FocusReveal delay={0.14}><StatCard label="Resueltos" value={stats.resueltos} icon={CheckCircle2} chip="bg-success/10 text-success" /></FocusReveal>
              <FocusReveal delay={0.21}><StatCard label="En Proceso" value={stats.enProceso} icon={Loader2} chip="bg-brand-cyan/10 text-brand-cyan-dark" /></FocusReveal>
            </>
          )}
        </div>

        <Reveal y={16}>
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list"><TicketIcon className="h-4 w-4 mr-2" />Tickets</TabsTrigger>
              {showCreate && <TabsTrigger value="create"><Plus className="h-4 w-4 mr-2" />Crear Ticket</TabsTrigger>}
            </TabsList>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>Listado de Tickets</CardTitle>
                  <CardDescription>Historial completo de solicitudes</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && <p className="text-destructive mb-4">{error}</p>}
                  {isLoading ? (
                    <Skeleton className="h-48 w-full rounded-lg" />
                  ) : (
                    <TicketsTable tickets={tickets} onView={(id) => navigate(`/tickets/${id}`)} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {showCreate && (
              <TabsContent value="create">
                <Card>
                  <CardHeader>
                    <CardTitle>Crear Nuevo Ticket</CardTitle>
                    <CardDescription>Completa el formulario para solicitar un servicio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CreateTicketPage onCreated={(id) => navigate(`/tickets/${id}`)} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </Reveal>
      </div>
    </div>
  )
}

```

### 📄 frontend/src/modules/dashboard/WorkerDashboard.tsx
```typescript
import { TicketsPanel } from './TicketsPanel'

export function WorkerDashboard() {
  return (
    <TicketsPanel
      title="Panel de Trabajador"
      subtitle="Gestiona los tickets que tienes asignados"
    />
  )
}

```

### 📄 frontend/src/modules/gallery/components/GalleryAdminPanel.tsx
```typescript
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ImagePlus, Loader2, X, Power } from 'lucide-react'
import { useGalleryAdmin, type BeProject, type ProjectForm } from '../hooks/useGalleryAdmin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { Badge } from '../../../core/ui/badge'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'

const EMPTY: ProjectForm = { titulo: '', descripcion: '', tag: '', imagen_url: '' }

/**
 * Gestión de la galería de proyectos para admin/trabajador (crear + editar + activar).
 * Mirror de CatalogAdminPanel — para que el admin agregue cards sin tocar código.
 * DIP: depende de useGalleryAdmin (no de apiClient directamente).
 */
export function GalleryAdminPanel() {
  const { projects, loading, load, createProject, editProject, toggleProject } = useGalleryAdmin()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<ProjectForm>(EMPTY)
  const [imagen, setImagen] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const resetForm = () => {
    setForm(EMPTY)
    setImagen(null)
    setEditingId(null)
  }

  const startEdit = (p: BeProject) => {
    setForm({ titulo: p.titulo, descripcion: p.descripcion, tag: p.tag, imagen_url: p.imagen_url ?? '' })
    setImagen(null)
    setEditingId(p.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo) {
      toast.error('El título es obligatorio')
      return
    }
    setSubmitting(true)
    try {
      if (editingId !== null) {
        await editProject(editingId, form, imagen)
        toast.success('Proyecto actualizado', { description: form.titulo })
      } else {
        await createProject(form, imagen)
        toast.success('Proyecto creado', { description: form.titulo })
      }
      resetForm()
      await load()
    } catch {
      toast.error(editingId ? 'No se pudo actualizar el proyecto' : 'No se pudo crear el proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleProject(id)
      await load()
    } catch {
      toast.error('No se pudo cambiar el estado del proyecto')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form — create or edit mode */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingId !== null ? 'Editar proyecto' : 'Nuevo proyecto'}</CardTitle>
              <CardDescription>
                {editingId !== null ? 'Modifica los datos del proyecto' : 'Publica un proyecto en la galería'}
              </CardDescription>
            </div>
            {editingId !== null && (
              <Button type="button" variant="ghost" size="icon" onClick={resetForm} aria-label="Cancelar edición">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-titulo">Título</Label>
              <Input id="p-titulo" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-tag">Etiqueta</Label>
              <Input id="p-tag" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="Servidores, CCTV, Domótica…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Descripción</Label>
              <Textarea id="p-desc" rows={3} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-url">URL de imagen</Label>
              <Input id="p-url" value={form.imagen_url} onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-img">…o sube una imagen</Label>
              <label htmlFor="p-img" className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-brand-cyan">
                <ImagePlus className="h-4 w-4 text-brand-cyan" />
                {imagen ? imagen.name : 'Seleccionar imagen…'}
              </label>
              <input id="p-img" type="file" accept="image/*" className="hidden" onChange={(e) => setImagen(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1 bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId !== null ? <><Pencil className="h-4 w-4 mr-2" />Actualizar</> : <><Plus className="h-4 w-4 mr-2" />Crear proyecto</>}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List with edit + toggle buttons */}
      <div className="lg:col-span-2">
        {loading ? (
          <p className="text-gray-500">Cargando galería…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">Aún no hay proyectos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Card key={p.id} className={`overflow-hidden transition-opacity ${editingId === p.id ? 'ring-2 ring-brand-cyan' : ''}`}>
                <div className="h-32 overflow-hidden bg-brand-navy/5">
                  <ImageWithFallback src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{p.titulo}</CardTitle>
                    <Badge className={p.activo ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{p.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-brand-cyan">{p.tag}</span>
                    <div className="flex gap-1.5">
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => startEdit(p)} aria-label={`Editar ${p.titulo}`}>
                        <Pencil className="h-3 w-3 mr-1" />Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-7 px-2 text-xs ${p.activo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        onClick={() => void handleToggle(p.id)}
                        aria-label={p.activo ? `Desactivar ${p.titulo}` : `Activar ${p.titulo}`}
                      >
                        <Power className="h-3 w-3 mr-1" />{p.activo ? 'Off' : 'On'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

```

### 📄 frontend/src/modules/gallery/hooks/useGalleryAdmin.tsx
```typescript
import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'

export interface BeProject {
  id: number
  titulo: string
  descripcion: string
  tag: string
  imagen_url?: string
  activo: boolean
  orden: number
}

export interface ProjectForm {
  titulo: string
  descripcion: string
  tag: string
  imagen_url: string
}

/**
 * DIP seam for GalleryAdminPanel — encapsula las llamadas a la API de proyectos.
 * Mirror de useCatalogAdmin (catálogo) para gestión de la galería.
 */
export function useGalleryAdmin() {
  const [projects, setProjects] = useState<BeProject[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<BeProject[]>('/proyectos/admin')
      setProjects(data)
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  const buildForm = (form: ProjectForm, imagen?: File | null) => {
    const fd = new FormData()
    fd.append('titulo', form.titulo)
    fd.append('descripcion', form.descripcion)
    fd.append('tag', form.tag)
    if (form.imagen_url) fd.append('imagen_url', form.imagen_url)
    if (imagen) fd.append('imagen', imagen)
    return fd
  }

  const createProject = useCallback(async (form: ProjectForm, imagen?: File | null) => {
    await apiClient.post('/proyectos/admin', buildForm(form, imagen), { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const editProject = useCallback(async (id: number, form: ProjectForm, imagen?: File | null) => {
    await apiClient.patch(`/proyectos/admin/${id}`, buildForm(form, imagen), { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const toggleProject = useCallback(async (id: number) => {
    await apiClient.patch(`/proyectos/admin/${id}?action=toggle`)
  }, [])

  useEffect(() => { void load() }, [load])

  return { projects, loading, load, createProject, editProject, toggleProject }
}

```

### 📄 frontend/src/modules/gallery/hooks/useProjects.tsx
```typescript
import { useState, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'

export interface PublicProject {
  id: string
  titulo: string
  descripcion: string
  tag: string
  imagenUrl: string
}

interface BeProject {
  id: number
  titulo: string
  descripcion: string
  tag: string
  imagen_url?: string
}

/**
 * Carga los proyectos activos de la galería desde la API pública.
 * DIP: depende de apiClient; los componentes públicos dependen de este hook.
 */
export function useProjects() {
  const [projects, setProjects] = useState<PublicProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    apiClient
      .get<{ items: BeProject[] }>('/proyectos/')
      .then((d) => {
        if (!alive) return
        setProjects(
          d.items.map((p) => ({
            id: String(p.id),
            titulo: p.titulo,
            descripcion: p.descripcion,
            tag: p.tag,
            imagenUrl: p.imagen_url ?? '',
          })),
        )
      })
      .catch(() => { if (alive) setProjects([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return { projects, loading }
}

```

### 📄 frontend/src/modules/notifications/components/NotificationBell/NotificationBell.test.tsx
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { NotificationBell } from './index'
import { NotificationServiceContext } from '../../hooks/useNotifications'
import type { INotificationService } from '../../interfaces/INotificationService'
import type { PaginatedNotifications } from '../../interfaces/types'

// Mock the socket singleton so subscribe is a no-op returning an unsubscribe fn.
vi.mock('../../../../infrastructure/websocket/SocketClient', () => ({
  socketClient: { subscribe: vi.fn(() => () => {}) },
}))

function makeService(unread: number): INotificationService {
  const page: PaginatedNotifications = {
    items: [
      {
        id: '1', tipo: 'creacion', titulo: 'Nuevo ticket', cuerpo: 'cuerpo',
        leida: unread === 0, payload: {}, creadoEn: new Date().toISOString(),
      },
    ],
    total: 1,
    unreadCount: unread,
    page: 1,
  }
  return {
    getUserNotifications: vi.fn().mockResolvedValue(page),
    markAsRead: vi.fn().mockResolvedValue(page.items[0]),
    getPreferences: vi.fn().mockResolvedValue({ emailActivo: true, inAppActivo: true, wsActivo: true }),
    setPreferences: vi.fn(),
  }
}

function renderBell(service: INotificationService) {
  return render(
    <NotificationServiceContext.Provider value={service}>
      <NotificationBell />
    </NotificationServiceContext.Provider>
  )
}

describe('NotificationBell', () => {
  it('renders the bell button', () => {
    renderBell(makeService(0))
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
  })

  it('shows the unread badge with the count', async () => {
    renderBell(makeService(3))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /3 sin leer/i })).toBeInTheDocument()
    })
  })

  it('does not show a badge when there are no unread', async () => {
    renderBell(makeService(0))
    await waitFor(() => {
      expect(screen.queryByText(/sin leer/i)).not.toBeInTheDocument()
    })
  })

  it('opens the panel on click', async () => {
    renderBell(makeService(1))
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    expect(await screen.findByRole('dialog', { name: /notificaciones/i })).toBeInTheDocument()
  })
})

```

### 📄 frontend/src/modules/notifications/components/NotificationBell/index.tsx
```typescript
import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationPanel } from '../NotificationPanel'

/**
 * SRP: renders the bell icon + unread badge and toggles the panel.
 * DIP: reads unreadCount from useNotifications (INotificationService via Context).
 * Observer (FE): the badge updates live because useNotifications subscribes to SocketClient.
 * Click-outside: closes the panel when the user clicks outside it.
 */
export function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close panel on click outside (H#20)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-accent text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-destructive rounded-full"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  )
}

```

### 📄 frontend/src/modules/notifications/components/NotificationItem/index.tsx
```typescript
import { Ticket, UserPlus, RefreshCw, MessageSquare, CornerUpRight, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Notification } from '../../interfaces/types'

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
}

const TIPO_META: Record<string, { icon: LucideIcon; chip: string }> = {
  creacion:      { icon: Ticket,        chip: 'bg-cyan-50 text-cyan-700' },
  asignacion:    { icon: UserPlus,      chip: 'bg-blue-50 text-blue-700' },
  cambio_estado: { icon: RefreshCw,     chip: 'bg-amber-50 text-amber-700' },
  comentario:    { icon: MessageSquare, chip: 'bg-slate-100 text-slate-600' },
  reasignacion:  { icon: CornerUpRight, chip: 'bg-indigo-50 text-indigo-700' },
  informacion:   { icon: Info,          chip: 'bg-slate-100 text-slate-600' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

/**
 * SRP: renders one notification row. No data fetching.
 * OCP: new tipo → add an entry in TIPO_META; component logic unchanged.
 */
export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const meta = TIPO_META[notification.tipo] ?? TIPO_META.informacion
  const Icon = meta.icon

  return (
    <li
      className={`flex gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
        notification.leida ? 'bg-card' : 'bg-brand-cyan/5'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.chip}`} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{notification.titulo}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.cuerpo}</p>
        <time className="text-[11px] text-muted-foreground mt-1 block">
          {relativeTime(notification.creadoEn)}
        </time>
      </div>

      {!notification.leida && (
        <button
          type="button"
          onClick={() => onMarkRead?.(notification.id)}
          className="self-start text-[11px] text-brand-cyan-dark font-medium hover:underline whitespace-nowrap cursor-pointer"
          aria-label={`Marcar "${notification.titulo}" como leída`}
        >
          Marcar leída
        </button>
      )}
    </li>
  )
}

```

### 📄 frontend/src/modules/notifications/components/NotificationPanel/index.tsx
```typescript
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationItem } from '../NotificationItem'

interface NotificationPanelProps {
  onClose?: () => void
}

/**
 * SRP: renders the dropdown list of notifications.
 * DIP: consumes useNotifications (INotificationService via Context) — no service import.
 */
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } =
    useNotifications()

  return (
    <div
      className="absolute right-0 mt-2 w-80 max-h-[28rem] bg-popover rounded-xl shadow-xl border border-border overflow-hidden z-50 flex flex-col"
      role="dialog"
      aria-label="Notificaciones"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Notificaciones
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({unreadCount} sin leer)
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="text-xs text-brand-cyan-dark font-medium hover:underline cursor-pointer"
          >
            Marcar todas
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {isLoading && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Cargando…</p>
        )}
        {error && (
          <p className="px-4 py-6 text-sm text-destructive text-center">{error}</p>
        )}
        {!isLoading && !error && notifications.length === 0 && (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">
            No tienes notificaciones.
          </p>
        )}
        {!isLoading && !error && notifications.length > 0 && (
          <ul>
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={(id) => void markAsRead(id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs text-muted-foreground hover:bg-accent border-t border-border cursor-pointer transition-colors"
        >
          Cerrar
        </button>
      )}
    </div>
  )
}

```

### 📄 frontend/src/modules/notifications/components/NotificationPreferences/index.tsx
```typescript
import { useState, useEffect } from 'react'
import { useContext } from 'react'
import { NotificationServiceContext } from '../../hooks/useNotifications'
import type { NotificationPreferences as Prefs } from '../../interfaces/types'
import { Switch } from '../../../../core/ui/switch'

const CHANNELS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: 'emailActivo', label: 'Email', desc: 'Recibe un correo por cada actualización.' },
  { key: 'inAppActivo', label: 'En la app', desc: 'Muestra notificaciones dentro de la plataforma.' },
  { key: 'wsActivo', label: 'Tiempo real', desc: 'Avisos instantáneos mientras usas la app.' },
]

/**
 * SRP: renders the preference toggles and persists changes.
 * DIP: uses INotificationService via Context (getPreferences / setPreferences).
 */
export function NotificationPreferences() {
  const service = useContext(NotificationServiceContext)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!service) return
    let cancelled = false
    void service.getPreferences().then((p) => {
      if (!cancelled) setPrefs(p)
    })
    return () => { cancelled = true }
  }, [service])

  const toggle = async (key: keyof Prefs) => {
    if (!service || !prefs) return
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSaving(true)
    try {
      await service.setPreferences({ [key]: next[key] })
    } finally {
      setSaving(false)
    }
  }

  if (!prefs) {
    return <p className="text-sm text-muted-foreground">Cargando preferencias…</p>
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Preferencias de notificación</h3>
      {CHANNELS.map(({ key, label, desc }) => (
        <label
          key={key}
          className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border cursor-pointer hover:border-slate-300 transition-colors"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">{label}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>
          </span>
          <Switch
            checked={prefs[key]}
            disabled={saving}
            onCheckedChange={() => void toggle(key)}
            aria-label={label}
          />
        </label>
      ))}
    </div>
  )
}

```

### 📄 frontend/src/modules/notifications/hooks/useNotifications.test.tsx
```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { vi } from 'vitest'
import { useNotifications, NotificationProvider } from './useNotifications'
import type { INotificationService } from '../interfaces/INotificationService'
import type { PaginatedNotifications } from '../interfaces/types'

// Capture the subscribe handler so we can simulate an incoming WS frame.
let wsHandler: ((payload: unknown) => void) | null = null
vi.mock('../../../infrastructure/websocket/SocketClient', () => ({
  socketClient: {
    subscribe: (_event: string, handler: (p: unknown) => void) => {
      wsHandler = handler
      return () => { wsHandler = null }
    },
  },
}))

function makeService(): INotificationService {
  const page: PaginatedNotifications = {
    items: [
      { id: '1', tipo: 'creacion', titulo: 'A', cuerpo: 'b', leida: false, payload: {}, creadoEn: new Date().toISOString() },
    ],
    total: 1,
    unreadCount: 1,
    page: 1,
  }
  return {
    getUserNotifications: vi.fn().mockResolvedValue(page),
    markAsRead: vi.fn().mockResolvedValue(page.items[0]),
    getPreferences: vi.fn(),
    setPreferences: vi.fn(),
  }
}

function wrapper(service: INotificationService) {
  return ({ children }: { children: ReactNode }) => (
    <NotificationProvider service={service}>{children}</NotificationProvider>
  )
}

describe('useNotifications', () => {
  it('loads notifications and unread count on mount', async () => {
    const service = makeService()
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper(service) })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.unreadCount).toBe(1)
  })

  it('markAsRead calls the service and decrements the count', async () => {
    const service = makeService()
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper(service) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.markAsRead('1') })

    expect(service.markAsRead).toHaveBeenCalledWith('1')
    expect(result.current.unreadCount).toBe(0)
  })

  it('an incoming WS notification is prepended and bumps the count', async () => {
    const service = makeService()
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper(service) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      wsHandler?.({
        id: '2', tipo: 'comentario', titulo: 'Nuevo', cuerpo: 'c',
        leida: false, payload: {}, creadoEn: new Date().toISOString(),
      })
    })

    expect(result.current.notifications[0].id).toBe('2')
    expect(result.current.unreadCount).toBe(2)
  })
})

```

### 📄 frontend/src/modules/notifications/hooks/useNotifications.tsx
```typescript
import {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from 'react'
import type { ReactNode } from 'react'
import type { INotificationService } from '../interfaces/INotificationService'
import type { Notification } from '../interfaces/types'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'

// ── DIP: service delivered via Context, never imported directly ───────────────

export const NotificationServiceContext = createContext<INotificationService | null>(null)

function useNotificationService(): INotificationService {
  const service = useContext(NotificationServiceContext)
  if (!service) {
    throw new Error(
      'useNotifications must be used inside <NotificationProvider>. ' +
      'Wrap the tree with the provider and inject an INotificationService instance.'
    )
  }
  return service
}

interface NotificationProviderProps {
  service: INotificationService
  children: ReactNode
}

export function NotificationProvider({ service, children }: NotificationProviderProps) {
  return (
    <NotificationServiceContext.Provider value={service}>
      {children}
    </NotificationServiceContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => void
}

// H#21 (audit): Cache timestamp to avoid re-fetching on every mount.
// Stale-while-revalidate: show cached data immediately, refresh in background.
let _lastFetchMs = 0
let _cachedNotifications: Notification[] = []
let _cachedUnreadCount = 0
const STALE_MS = 30_000 // 30 seconds — data is fresh enough to skip re-fetch

export function useNotifications(): UseNotificationsResult {
  const service = useNotificationService()
  const [notifications, setNotifications] = useState<Notification[]>(_cachedNotifications)
  const [unreadCount, setUnreadCount] = useState(_cachedUnreadCount)
  const [isLoading, setIsLoading] = useState(_cachedNotifications.length === 0)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (force = false) => {
    // Skip re-fetch if data is still fresh (unless forced)
    const now = Date.now()
    if (!force && _cachedNotifications.length > 0 && now - _lastFetchMs < STALE_MS) {
      return
    }
    if (_cachedNotifications.length === 0) setIsLoading(true)
    setError(null)
    try {
      const data = await service.getUserNotifications(1)
      _cachedNotifications = data.items
      _cachedUnreadCount = data.unreadCount
      _lastFetchMs = Date.now()
      setNotifications(data.items)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [service])

  useEffect(() => { void refresh() }, [refresh])

  // Observer (FE): react to live 'notification_new' frames from the WS singleton.
  useEffect(() => {
    const off = socketClient.subscribe('notification_new', (payload) => {
      const incoming = payload as Notification
      setNotifications((prev) => [incoming, ...prev])
      setUnreadCount((c) => c + 1)
    })
    return off
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await service.markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [service])

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.leida)
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
    setUnreadCount(0)
    await Promise.all(unread.map((n) => service.markAsRead(n.id)))
  }, [service, notifications])

  return { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead, refresh }
}

```

### 📄 frontend/src/modules/notifications/interfaces/INotificationService.ts
```typescript
/**
 * Root contract for the notification service on the frontend.
 *
 * Responsibility (SRP): declare how components and hooks interact with notifications.
 *     No channel logic, no WebSocket management — only application-level operations.
 * Depends on: Notification and NotificationPreferences types defined below.
 * Pattern: DIP anchor — useNotifications hook depends on this, never on a concrete service.
 * SOLID: DIP · OCP · SRP
 *
 * Sprint coverage:
 *   S19 → this file (contract + types)
 *   S26 → NotificationClientContext + useNotifications hook implement/consume this
 */

// ── Shared types (single source of truth: ./types.ts) ────────────────────────
import type {
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
} from './types'

export type {
  NotificationTipo,
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
} from './types'

// ── Service contract ──────────────────────────────────────────────────────────

export interface INotificationService {
  /**
   * Load paginated notifications for the current user.
   * Called on mount and after marking notifications as read.
   */
  getUserNotifications(page?: number): Promise<PaginatedNotifications>

  /**
   * Mark a single notification as read.
   * Returns the updated notification.
   */
  markAsRead(notificationId: string): Promise<Notification>

  /** Load the current user's channel preferences. */
  getPreferences(): Promise<NotificationPreferences>

  /** Partially update the current user's channel preferences. */
  setPreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences>
}

```

### 📄 frontend/src/modules/notifications/interfaces/INotificationStrategy.ts
```typescript
/**
 * Root contract for a notification delivery channel (frontend side).
 *
 * Responsibility (SRP): declare how a single channel delivers a notification.
 * Depends on: nothing — root abstraction.
 * Pattern: Strategy — each channel implements this interface.
 * SOLID: DIP · OCP · LSP · SRP
 *
 * OCP: SMSStrategy / PushStrategy = new class + registration in NotificationFactory.
 *      Existing strategies unchanged.
 *
 * Note: the FE strategy layer is thin — most delivery logic lives in the BE.
 *       FE strategies are used only for client-side channel simulation in tests.
 */

export interface INotificationStrategy {
  /** Check the channel can reach this recipient (e.g. browser permission for Push). */
  validate(recipientId: string): Promise<boolean>

  /** Deliver the notification payload via this channel. */
  send(recipientId: string, message: string, context: Record<string, unknown>): Promise<void>

  /** Record the delivery attempt result for debugging/observability. */
  log(status: 'sent' | 'failed' | 'skipped', details: string): void
}

```

### 📄 frontend/src/modules/notifications/interfaces/types.ts
```typescript
/**
 * Shared notification types for the frontend notifications module.
 * Mirrors the backend Notification / NotificationPreference shapes.
 */

export type NotificationTipo =
  | 'creacion'
  | 'asignacion'
  | 'cambio_estado'
  | 'comentario'
  | 'reasignacion'
  | 'password_reset'
  | 'informacion'

export interface Notification {
  id: string
  tipo: NotificationTipo
  titulo: string
  cuerpo: string
  leida: boolean
  payload: Record<string, unknown>
  creadoEn: string // ISO 8601
}

export interface NotificationPreferences {
  emailActivo: boolean
  inAppActivo: boolean
  wsActivo: boolean
}

export interface PaginatedNotifications {
  items: Notification[]
  total: number
  unreadCount: number
  page: number
}

```

### 📄 frontend/src/modules/notifications/pages/NotificationsPage.tsx
```typescript
import { Bell, CheckCheck, Circle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Badge } from '../../../core/ui/badge'
import { Skeleton } from '../../../core/ui/skeleton'
import { Reveal, FocusReveal } from '../../../core/ui/motion'
import { useNotifications } from '../hooks/useNotifications'
import type { ReactNode } from 'react'


export function NotificationsPage() {
  const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4'] as const
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications()

  let content: ReactNode
  if (isLoading) {
    content = (
      <div className="space-y-3">{SKELETON_KEYS.map((key) => <Skeleton key={key} className="h-20 rounded-xl" />)}</div>
    )
  } else if (notifications.length === 0) {
    content = (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          No tienes notificaciones todavía.
        </CardContent>
      </Card>
    )
  } else {
    content = (
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={n.leida ? '' : 'border-brand-cyan/50 bg-brand-cyan/5'}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {!n.leida && <Circle className="h-2.5 w-2.5 mt-1.5 fill-brand-cyan text-brand-cyan shrink-0" />}
                  <div>
                    <CardTitle className="text-base">{n.titulo}</CardTitle>
                    <CardDescription>{new Date(n.creadoEn).toLocaleString()}</CardDescription>
                  </div>
                </div>
                {n.leida ? (
                  <Badge variant="secondary">Leída</Badge>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => void markAsRead(n.id)}>Marcar leída</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 pl-7 text-sm text-foreground/80">{n.cuerpo}</CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Reveal y={20}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5">
                <Bell className="h-7 w-7 text-brand-cyan-dark" /> Notificaciones
              </h1>
              <p className="text-muted-foreground mt-1">{unreadCount > 0 ? `Tienes ${unreadCount} sin leer` : 'Estás al día'}</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => void markAllAsRead()}>
                <CheckCheck className="h-4 w-4 mr-2" /> Marcar todas
              </Button>
            )}
          </div>
        </Reveal>

        {error && <p className="text-destructive mb-4">{error}</p>}

        <FocusReveal>{content}</FocusReveal>
      </div>
    </div>
  )
}

```

### 📄 frontend/src/modules/notifications/services/NotificationService.ts
```typescript
/**
 * NotificationService — concrete INotificationService using ApiClient.
 * SRP: notification HTTP + shape mapping. DIP: useNotifications depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { INotificationService } from '../interfaces/INotificationService'
import type {
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
  NotificationTipo,
} from '../interfaces/types'

interface BeNotification {
  id: number
  tipo: string
  titulo: string
  cuerpo: string
  leida: boolean
  payload: Record<string, unknown>
  creado_en: string
}

function mapNotification(n: BeNotification): Notification {
  return {
    id: String(n.id),
    tipo: n.tipo as NotificationTipo,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    leida: n.leida,
    payload: n.payload ?? {},
    creadoEn: n.creado_en,
  }
}

class NotificationService implements INotificationService {
  async getUserNotifications(page = 1): Promise<PaginatedNotifications> {
    const data = await apiClient.get<{
      items: BeNotification[]
      total: number
      unread_count: number
      page: number
    }>(`/notificaciones/?page=${page}`)
    return {
      items: data.items.map(mapNotification),
      total: data.total,
      unreadCount: data.unread_count,
      page: data.page,
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const data = await apiClient.patch<BeNotification>(
      `/notificaciones/${notificationId}/marcar-leida`,
    )
    return mapNotification(data)
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const data = await apiClient.get<{
      email_activo: boolean
      in_app_activo: boolean
      ws_activo: boolean
    }>('/notificaciones/preferencias')
    return {
      emailActivo: data.email_activo,
      inAppActivo: data.in_app_activo,
      wsActivo: data.ws_activo,
    }
  }

  async setPreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const body: Record<string, boolean> = {}
    if (data.emailActivo !== undefined) body.email_activo = data.emailActivo
    if (data.inAppActivo !== undefined) body.in_app_activo = data.inAppActivo
    if (data.wsActivo !== undefined) body.ws_activo = data.wsActivo
    const res = await apiClient.patch<{
      email_activo: boolean
      in_app_activo: boolean
      ws_activo: boolean
    }>('/notificaciones/preferencias', body)
    return {
      emailActivo: res.email_activo,
      inAppActivo: res.in_app_activo,
      wsActivo: res.ws_activo,
    }
  }
}

export const notificationService = new NotificationService()

```

### 📄 frontend/src/modules/public/pages/About.tsx
```typescript
import { useRef, type CSSProperties } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Target, Eye, Award, Users } from 'lucide-react'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { GlowCard } from '../../../core/ui/GlowCard'
import { InteractiveGlow } from '../../../core/ui/InteractiveGlow'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { Reveal, FocusReveal } from '../../../core/ui/motion'
import { EASE_APPLE } from '../../../core/ui/motion/ease'

const VALUES = [
  { icon: Target, title: 'Misión', text: 'Brindar soluciones tecnológicas integrales que impulsen la competitividad de nuestros clientes.' },
  { icon: Eye, title: 'Visión', text: 'Ser el aliado tecnológico líder en Ecuador, reconocido por su innovación y servicio.' },
  { icon: Award, title: 'Calidad', text: 'Más de 20 años entregando proyectos con los más altos estándares del mercado.' },
  { icon: Users, title: 'Equipo', text: 'Profesionales certificados comprometidos con el éxito de cada proyecto.' },
]

const STATS = [
  { value: '20+', label: 'Años de experiencia' },
  { value: '500+', label: 'Proyectos entregados' },
  { value: '100%', label: 'Compromiso total' },
]

function ParallaxImage() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1])

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl shadow-2xl h-96 md:h-120" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.55)', border: '1px solid rgba(0,196,224,0.12)' }}>
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y, scale }}>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1080&q=80"
          alt="Equipo SASS BLUM"
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  )
}

export function About() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Quiénes somos"
        title="Nosotros"
        subtitle="La conexión perfecta entre tu empresa y la tecnología"
        accent="indigo"
        orbPosition="bottom-left"
      />

      {/* ── Sobre nosotros — imagen con parallax + texto ─── */}
      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal y={24}>
            <ParallaxImage />
          </Reveal>
          <Reveal y={32} delay={0.1}>
            <p className="uppercase mb-3 tracking-[0.3em] text-sm" style={{ color: '#00c4e0' }}>Quiénes somos</p>
            <h2 className="text-3xl md:text-5xl mb-5 font-semibold tracking-tight leading-tight" style={{ color: '#eef4f8' }}>
              20+ años de experiencia en tecnología
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: '#7aa3b8' }}>
              SASS BLUM es una firma de soluciones y servicios tecnológicos ubicada en Guayaquil, Ecuador. Actuamos como
              integradores de tecnología, la conexión perfecta entre los ejecutivos y sus distintos proveedores.
            </p>
            <p className="leading-relaxed" style={{ color: '#7aa3b8' }}>
              Acompañamos a empresas e industrias en infraestructura IT, soporte técnico, cableado estructurado, CCTV,
              domótica y mucho más, con un enfoque personalizado y centrado en el cliente.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Banner de estadísticas ─── */}
      <section className="relative z-10 py-28 md:py-36 overflow-hidden" style={{ background: 'rgba(0,196,224,0.04)' }}>
        <InteractiveGlow color="#6366f1" size={560} />
        <motion.div
          className="absolute -top-20 -right-20 h-80 w-80 rounded-full blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl mx-auto leading-tight" style={{ color: '#eef4f8' }}>
              Tecnología que{' '}
              <span className="text-gradient-brand">transforma empresas</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mt-20">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.12} y={24}>
                <p className="text-6xl md:text-7xl font-semibold tracking-tight text-brand-cyan">
                  {s.value}
                </p>
                <p className="mt-3 uppercase tracking-widest text-sm" style={{ color: '#5c7a94' }}>{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Valores — tarjetas con GlowCard tilt ─── */}
      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(0,0,0,0.32)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="uppercase mb-3 tracking-[0.3em] text-sm" style={{ color: '#00c4e0' }}>Nuestros valores</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight" style={{ color: '#eef4f8' }}>
              Lo que nos define
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <FocusReveal key={v.title} delay={i * 0.08}>
                <GlowCard className="h-full" style={{ background: 'rgba(8,22,36,0.7)', border: '1px solid rgba(0,196,224,0.12)', backdropFilter: 'blur(12px)' } as CSSProperties}>
                  <div className="p-8 text-center">
                    <motion.div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 mx-auto"
                      style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.2)' }}
                      whileHover={{ scale: 1.1, rotate: -8 }}
                      transition={{ duration: 0.3, ease: EASE_APPLE }}
                    >
                      <v.icon className="h-7 w-7 text-brand-cyan" />
                    </motion.div>
                    <h3 className="text-lg mb-2 font-semibold" style={{ color: '#eef4f8' }}>{v.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c7a94' }}>{v.text}</p>
                  </div>
                </GlowCard>
              </FocusReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

```

### 📄 frontend/src/modules/public/pages/Clients.tsx
```typescript
import type { CSSProperties } from 'react'
import { Star, Quote } from 'lucide-react'
import { LogoMarquee, type Brand } from '../../../core/ui/LogoMarquee'
import { GlowCard } from '../../../core/ui/GlowCard'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { Reveal, FocusReveal } from '../../../core/ui/motion'

const TESTIMONIALS = [
  { name: 'María González', company: 'Distribuidora Andina', text: 'SASS BLUM transformó nuestra infraestructura de red. El soporte es excelente y siempre responden a tiempo.' },
  { name: 'Carlos Mendoza', company: 'Clínica San Rafael', text: 'Instalaron todo nuestro sistema de CCTV y domótica. Profesionalismo de principio a fin.' },
  { name: 'Ana Vélez', company: 'Corporación Litoral', text: 'El equipo de soporte técnico es de primera. Resolvieron problemas que otros proveedores no pudieron.' },
]

const PARTNERS: Brand[] = [
  { name: 'Hikvision', domain: 'hikvision.com' },
  { name: 'Ubiquiti', domain: 'ui.com' },
  { name: 'Grandstream', domain: 'grandstream.com' },
  { name: 'ZKTeco', domain: 'zkteco.com' },
]

const cardStyle: CSSProperties = {
  background: 'rgba(8,22,36,0.7)',
  border: '1px solid rgba(0,196,224,0.12)',
  backdropFilter: 'blur(12px)',
}

export function Clients() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Confianza"
        title="Clientes"
        subtitle="Empresas e industrias que confían en nosotros"
        accent="cyan"
        orbPosition="top-right"
      />

      {/* Testimonios */}
      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="uppercase mb-3 tracking-[0.3em] text-sm" style={{ color: '#00c4e0' }}>Testimonios</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight" style={{ color: '#eef4f8' }}>
              Lo que dicen nuestros clientes
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FocusReveal key={t.name} delay={i * 0.1}>
                <GlowCard className="h-full" style={cardStyle}>
                  <div className="p-8">
                    <Quote className="h-9 w-9 mb-4" style={{ color: 'rgba(0,196,224,0.3)' }} />
                    <p className="mb-6 leading-relaxed" style={{ color: '#7aa3b8' }}>{t.text}</p>
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-brand-cyan text-brand-cyan" />
                      ))}
                    </div>
                    <p className="font-medium" style={{ color: '#eef4f8' }}>{t.name}</p>
                    <p className="text-sm" style={{ color: '#5c7a94' }}>{t.company}</p>
                  </div>
                </GlowCard>
              </FocusReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Carrusel de marcas / aliados */}
      <section className="relative z-10 py-20 md:py-28 overflow-hidden" style={{ background: 'rgba(0,0,0,0.32)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] mb-3 text-sm" style={{ color: '#00c4e0' }}>Aliados tecnológicos</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: '#eef4f8' }}>
              Marcas que integramos
            </h2>
            <p className="mt-3 max-w-2xl mx-auto" style={{ color: '#5c7a94' }}>
              Somos integradores autorizados de las marcas líderes en seguridad, redes y control de acceso.
            </p>
          </Reveal>
        </div>
        <LogoMarquee brands={PARTNERS} durationSec={28} />
      </section>
    </div>
  )
}

```

### 📄 frontend/src/modules/public/pages/Gallery.tsx
```typescript
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { FocusReveal } from '../../../core/ui/motion'
import { useTilt } from '../../../core/hooks/useTilt'
import { ProjectGalleryCarousel } from '../../../core/ui/ProjectGalleryCarousel'
import { useProjects } from '../../gallery/hooks/useProjects'

const PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80', label: 'Infraestructura IT', desc: 'Diseño e implementación de soluciones tecnológicas robustas y escalables.' },
  { src: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&q=80', label: 'CCTV', desc: 'Sistemas de videovigilancia con integración Hikvision, Ubiquiti y ZKTeco.' },
  { src: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80', label: 'Domótica', desc: 'Control inteligente de oficinas y hogares desde tu computador o smartphone.' },
  { src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80', label: 'Soporte Técnico', desc: 'Servicio profesional que maximiza la inversión en tus equipos.' },
  { src: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=80', label: 'Cableado Estructurado', desc: 'Redes de voz y datos bajo estándares de calidad y conectividad.' },
  { src: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80', label: 'Servidores', desc: 'Importación directa de servidores escalables con virtualización y BCP.' },
]

function TiltCard({ src, label, desc }: (typeof PHOTOS)[number]) {
  const { ref, style, handlers } = useTilt({ maxTilt: 10, scale: 1.03 })

  return (
    <div ref={ref} style={style} {...handlers}>
      <div className="group relative overflow-hidden rounded-2xl h-72 shadow-lg" style={{ border: '1px solid rgba(0,196,224,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <ImageWithFallback
          src={src}
          alt={label}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-brand-navy/90 via-brand-navy/20 to-transparent" />
        {/* Shine on hover */}
        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Teal glow edge on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,196,224,0.3)' }} />
        {/* Title + description */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="text-white text-xl font-medium tracking-wide">{label}</h3>
          <p className="text-gray-200 text-sm mt-2 max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-out group-hover:max-h-24 group-hover:opacity-100">
            {desc}
          </p>
        </div>
      </div>
    </div>
  )
}

export function Gallery() {
  const { projects } = useProjects()
  // Si el admin ya cargó proyectos, se muestran esos; si no, los de ejemplo.
  const photos = projects.length > 0
    ? projects.map((p) => ({ src: p.imagenUrl, label: p.titulo, desc: p.descripcion }))
    : PHOTOS

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Portafolio"
        title="Galería"
        subtitle="Proyectos y soluciones que hemos implementado"
        accent="indigo"
        orbPosition="bottom-right"
      />

      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {photos.map((p, i) => (
            <FocusReveal key={`${p.label}-${i}`} delay={i * 0.07}>
              <TiltCard {...p} />
            </FocusReveal>
          ))}
        </div>
      </section>

      {/* Carrusel infinito de proyectos (movido desde Home) */}
      <ProjectGalleryCarousel />
    </div>
  )
}

```

### 📄 frontend/src/modules/public/pages/Home.tsx
```typescript
import { useRef, useEffect, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Server, Network, Cctv } from 'lucide-react';

/* ─── colour palette — SassBlum brand teal ─── */
const C = {
  bg:     '#04090f',          // deep navy-black
  bg2:    '#081624',          // dark navy layer
  accent: '#00c4e0',          // vivid teal (brand primary)
  accent2:'#38d9f5',          // light teal
  accent3:'#7ee8f9',          // pale teal highlight
  muted:  '#5c7a94',          // blue-muted text
  text:   '#eef4f8',          // cool white
  green:  '#22d87a',          // status green
  glow:   'rgba(0,196,224,0.32)', // teal glow
};

/* ─── reusable glow-on-hover handler (CSS var --card-x / --card-y) ─── */
function glowMouse(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--card-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--card-y', `${e.clientY - rect.top}px`);
}

/* ─── animated counter hook ─── */
function useCounter(target: number, inView: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setValue(start);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return value;
}

/* ─── tiny helpers ─── */
const stagger = (i: number) => ({ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] } } });
const fadeUp = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

/* ─── marquee items ─── */
const MARQUEE = ['INFRAESTRUCTURA IT', 'SOPORTE TÉCNICO', 'CABLEADO ESTRUCTURADO', 'SISTEMA CCTV', 'DOMÓTICA', 'VENTA DE SERVIDORES'];

/* ─── stat definitions ─── */
const STATS = [
  { target: 20, suffix: '+', label: 'Años de Experiencia', fill: '80%' },
  { target: 500, suffix: '+', label: 'Proyectos Completados', fill: '95%' },
  { target: 100, suffix: '%', label: 'Compromiso Total', fill: '100%' },
];

/* ────────────────────────────────────────────────────────────────────
   HOME COMPONENT
   ──────────────────────────────────────────────────────────────────── */
export function Home() {
  /* ── section in-view refs ── */
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutInView = useInView(aboutRef, { once: true, margin: '-100px' });

  /* ── counter values ── */
  const c20 = useCounter(20, aboutInView);
  const c500 = useCounter(500, aboutInView);
  const c100 = useCounter(100, aboutInView);
  const counters = [c20, c500, c100];

  /* ── marquee track ref (RAF-driven) ── */
  const marqueeTrackRef = useRef<HTMLDivElement>(null);

  /* ── hero card parallax refs (outer) + float refs (inner) ── */
  const heroRef = useRef<HTMLElement>(null);
  const cardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const floatRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  /* ── hero card mouse parallax effect ── */
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const hero = heroRef.current;
    if (!hero) return;
    const speeds = [0.03, 0.05, 0.04];
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mx = (e.clientX / window.innerWidth - 0.5) * 2;
        const my = (e.clientY / window.innerHeight - 0.5) * 2;
        cardRefs.forEach((ref, i) => {
          if (!ref.current) return;
          const s = speeds[i];
          const x = mx * s * 200;
          const y = my * s * 200;
          const rot = mx * s * 15;
          ref.current.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
        });
      });
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); hero.removeEventListener('pointermove', onMove); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── floating hero cards — RAF que escribe transform directo (inmune a
        prefers-reduced-motion; siempre flotan por decisión del usuario) ── */
  useEffect(() => {
    const els = floatRefs.map((r) => r.current);
    if (els.every((e) => !e)) return;
    const params = [
      { px: -15, py: 25, rot: 3, period: 12000 },
      { px: 20, py: -20, rot: -4, period: 10000 },
      { px: -10, py: -15, rot: 2, period: 14000 },
    ];
    let rafId = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = now - start;
      els.forEach((el, i) => {
        if (!el) return;
        const p = params[i];
        const f = (1 - Math.cos((t / p.period) * Math.PI * 2)) / 2; // 0 → 1 → 0
        el.style.transform = `translate(${p.px * f}px, ${p.py * f}px) rotate(${p.rot * f}deg)`;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── marquee infinito — RAF que escribe transform directo (inmune a
        prefers-reduced-motion; siempre anima por decisión del usuario) ── */
  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;
    let x = 0;
    let half = 0;
    let rafId = 0;
    const step = () => {
      if (!half) half = track.scrollWidth / 2;        // se mide cuando ya hay layout
      if (half) {
        x -= 0.5;
        if (x <= -half) x += half;                     // loop sin salto
        track.style.transform = `translateX(${x}px)`;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── CSS injected globally (keyframes + glow card + carousel) ── */
  const floatKeyframes = `
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.6)} }
    @keyframes scrollFill { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
    /* visible keyboard focus ring on hero/CTA links (a11y — WCAG 2.4.7) */
    .home-btn:focus-visible { outline: 2px solid ${C.accent2}; outline-offset: 3px; border-radius: 9999px; }
    /* spotlight hover on glass cards — teal */
    .glow-card { position:relative; overflow:hidden; }
    .glow-card::before {
      content:''; position:absolute; inset:0; z-index:2; pointer-events:none;
      opacity:0; transition:opacity 0.4s ease;
      background:radial-gradient(350px circle at var(--card-x,50%) var(--card-y,50%), rgba(0,196,224,0.16), rgba(56,217,245,0.06) 40%, transparent 65%);
    }
    .glow-card:hover::before { opacity:1; }
  `;

  /* ── magnetic button handlers ── */
  const onMagneticMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
  };
  const onMagneticLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth < 768) return;
    const el = e.currentTarget;
    el.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 400);
  };

  return (
    <>
      <style>{floatKeyframes}</style>

      {/* ─────────────── HERO ─────────────── */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center relative overflow-hidden z-10"
        style={{ padding: '8rem clamp(1.5rem,4vw,4rem) 4rem' }}
      >
        <div className="max-w-200 relative z-10">
          {/* badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', fontSize: '0.78rem', fontWeight: 500, color: C.muted, letterSpacing: '0.04em' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: 'pulse 2s ease-in-out infinite' }} />
            <span>20+ Años Transformando Empresas</span>
          </motion.div>

          {/* title */}
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(3rem,9vw,7rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
            {['Innovación', 'Tecnológica'].map((word, i) => (
              <div key={i} className="overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: '120%' }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>
              </div>
            ))}
            <div className="overflow-hidden">
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: '120%' }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ WebkitTextStroke: `1.5px ${C.text}`, color: 'transparent' }}
              >
                para tu negocio
              </motion.span>
            </div>
          </h1>

          {/* subtitle */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.4 }}
            className="max-w-120 mb-12" style={{ fontSize: 'clamp(1rem,1.8vw,1.15rem)', color: '#7aa3b8', lineHeight: 1.8 }}
          >
            Soluciones informáticas de vanguardia para empresas e industrias.<br />
            Servidores, cableado, CCTV, domótica y más.
          </motion.p>

          {/* buttons — magnetic */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.5 }} className="flex gap-4 flex-wrap">
            <Link
              to="/login"
              onMouseMove={onMagneticMove}
              onMouseLeave={onMagneticLeave}
              className="home-btn inline-flex items-center gap-2.5 rounded-full hover:shadow-[0_12px_40px_rgba(124,92,252,0.35)]"
              style={{ padding: '0.9rem 2rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', background: C.accent, color: '#fff', transition: 'box-shadow 0.3s' }}
            >
              <span>Enviar Ticket</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              to="/servicios"
              onMouseMove={onMagneticMove}
              onMouseLeave={onMagneticLeave}
              className="home-btn inline-flex items-center gap-2.5 rounded-full"
              style={{ padding: '0.9rem 2rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', background: 'transparent', color: C.text, border: '1px solid rgba(255,255,255,0.12)', transition: 'border-color 0.3s' }}
            >
              <span>Servicios</span>
            </Link>
          </motion.div>
        </div>

        {/* hero__cards — right half of hero */}
        <div
          className="absolute pointer-events-none hidden md:block"
          style={{ top: 0, right: 0, bottom: 0, width: '50%', zIndex: 2 }}
        >
          {([
            { Icon: Server,  label: 'Servidores', top: '15%',    right: '15%', bottom: undefined, iconColor: C.accent  },
            { Icon: Network, label: 'Cableado',   top: '50%',    right: '5%',  bottom: undefined, iconColor: C.accent2 },
            { Icon: Cctv,    label: 'CCTV',       top: undefined, right: '20%', bottom: '15%',    iconColor: C.accent  },
          ] as const).map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
              style={{ top: c.top, right: c.right, bottom: c.bottom }}
            >
              {/* outer: JS mouse parallax via cardRefs[i] */}
              <div ref={cardRefs[i]} style={{ width: 160, height: 160 }}>
                {/* inner: RAF float via floatRefs[i] (inmune a reduced-motion) */}
                <div
                  ref={floatRefs[i]}
                  className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-[20px]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <c.Icon size={32} color={c.iconColor} strokeWidth={1.5} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', color: C.muted }}>{c.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-12 right-[clamp(1.5rem,4vw,4rem)] hidden md:flex flex-col items-center gap-4 z-10">
          <span style={{ writingMode: 'vertical-rl', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted }}>Scroll</span>
          <div className="w-px h-15 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-full h-[30%]" style={{ background: C.accent, animation: 'scrollFill 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ─────────────── MARQUEE ─────────────── */}
      <section className="relative z-10 overflow-hidden py-6" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div ref={marqueeTrackRef} className="flex" style={{ width: 'max-content', willChange: 'transform' }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10 pr-10" aria-hidden={copy === 1}>
              {MARQUEE.map((item, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-10 whitespace-nowrap">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(0.8rem,1.5vw,1rem)', fontWeight: 600, letterSpacing: '0.12em', color: C.muted }}>{item}</span>
                  <span style={{ color: C.accent, fontSize: '0.6rem' }}>◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── ABOUT ─────────────── */}
      <section ref={aboutRef} className="relative z-10" style={{ padding: 'clamp(6rem,12vw,10rem) 0' }}>
        <div className="mx-auto" style={{ maxWidth: 1400, padding: '0 clamp(1.5rem,4vw,4rem)' }}>
          <div className="mb-[clamp(3rem,5vw,5rem)]">
            <motion.div variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} className="inline-flex items-center gap-3 mb-6" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent }}>
              <span style={{ width: 32, height: 1, background: C.accent }} />
              Sobre Nosotros
            </motion.div>
            <motion.h2
              variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              20+ años liderando<br />proyectos tecnológicos
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(3rem,6vw,6rem)] items-start">
            {/* text column */}
            <div>
              <motion.p variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} className="text-base leading-[1.9] mb-8" style={{ color: '#7aa3b8' }}>
                SASS BLUM ha dedicado más de 20 años a dar soluciones informáticas a empresas e industrias, liderando proyectos y siendo el nexo perfecto entre directivos y sus diferentes proveedores de tecnología.
              </motion.p>
              <motion.div variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} transition={{ delay: 0.15 }}>
                <Link
                  to="/nosotros"
                  onMouseMove={onMagneticMove}
                  onMouseLeave={onMagneticLeave}
                  className="home-btn inline-flex items-center gap-2.5 rounded-full"
                  style={{ padding: '0.9rem 2rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', background: 'transparent', color: C.text, border: '1px solid rgba(255,255,255,0.12)', transition: 'border-color 0.3s' }}
                >
                  <span>Conoce más</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </motion.div>
            </div>

            {/* stats column */}
            <div className="flex flex-col gap-8">
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  variants={stagger(i)}
                  initial="hidden"
                  animate={aboutInView ? 'visible' : 'hidden'}
                  onMouseMove={glowMouse}
                  className="glow-card rounded-2xl transition-all duration-300 hover:translate-x-1"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '2rem', borderRadius: 16, transition: 'border-color 0.3s, transform 0.3s' }}
                >
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,4vw,3.5rem)', fontWeight: 700, color: C.accent }}>
                    {counters[i]}{s.suffix}
                  </div>
                  <div className="mt-1" style={{ fontSize: '0.85rem', color: C.muted }}>{s.label}</div>
                  <div className="w-full h-0.75 mt-4 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-sm transition-all duration-[1.5s]" style={{ background: C.accent, width: aboutInView ? s.fill : '0%', transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── IMMERSIVE QUOTE ─────────────── */}
      <section className="relative z-10 flex items-center justify-center" style={{ height: '70vh', minHeight: 440 }}>
        {/* radial teal glow — no image */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(0,196,224,0.12) 0%, rgba(0,196,224,0.03) 50%, transparent 75%)' }} />
        {/* subtle crosshair lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:1, height:'100%', background:'linear-gradient(to bottom, transparent 0%, rgba(0,196,224,0.2) 40%, rgba(0,196,224,0.2) 60%, transparent 100%)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', height:1, background:'linear-gradient(to right, transparent 0%, rgba(0,196,224,0.2) 30%, rgba(0,196,224,0.2) 70%, transparent 100%)' }} />
        </div>
        {/* fades on edges so it blends with surrounding sections */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${C.bg} 0%, transparent 18%, transparent 82%, ${C.bg} 100%)` }} />

        <div className="relative z-10 text-center px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(2.4rem,5.5vw,5rem)',
              fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em',
              textShadow: '0 0 80px rgba(0,196,224,0.4), 0 2px 40px rgba(0,0,0,0.9)',
            }}
          >
            El nexo perfecto entre<br />
            <span style={{ color: C.accent2 }}>tu empresa</span> y la tecnología
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 mx-auto" style={{ fontSize: '1.1rem', color: C.muted, maxWidth: 520, textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}
          >
            Conectamos directivos con soluciones tecnológicas reales
          </motion.p>
        </div>
      </section>

      {/* La galería de proyectos se movió a la página /galeria (ProjectGalleryCarousel) */}

      {/* ─────────────── CTA ─────────────── */}
      <section className="relative z-10 text-center" style={{ padding: 'clamp(6rem,12vw,10rem) 0' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 800 }}>
          <motion.h2
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            ¿Listo para transformar<br />tu infraestructura?
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <Link
              to="/login"
              onMouseMove={onMagneticMove}
              onMouseLeave={onMagneticLeave}
              className="home-btn inline-flex items-center gap-2.5 rounded-full hover:shadow-[0_12px_40px_rgba(124,92,252,0.35)]"
              style={{ padding: '1rem 2.5rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.03em', background: C.accent, color: '#fff', transition: 'box-shadow 0.3s' }}
            >
              <span>Comenzar ahora</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

```

### 📄 frontend/src/modules/public/pages/Services.tsx
```typescript
import { createElement, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Headphones, Wifi, Printer, Server, Camera, Home as HomeIcon, Wrench, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Skeleton } from '../../../core/ui/skeleton'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { GlowCard } from '../../../core/ui/GlowCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../core/ui/dialog'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { EASE_APPLE } from '../../../core/ui/motion/ease'
import { useCatalog } from '../../catalog/hooks/useCatalog'
import { useAuth } from '../../auth/hooks/useAuth'

const CATEGORY_ICON: Record<string, typeof Wrench> = {
  soporte: Headphones,
  'wi-fi': Wifi,
  wifi: Wifi,
  redes: Wifi,
  impresoras: Printer,
  infraestructura: Server,
  servidores: Server,
  cctv: Camera,
  seguridad: Camera,
  domotica: HomeIcon,
  'domótica': HomeIcon,
}

function iconFor(categoria: string) {
  const key = categoria?.toLowerCase().trim()
  return CATEGORY_ICON[key] ?? Wrench
}

function CategoryIcon({ categoria, className }: { categoria: string; className?: string }) {
  return createElement(iconFor(categoria), { className })
}

export function Services() {
  const { services, isLoading, error } = useCatalog()
  const { user } = useAuth()
  const [selected, setSelected] = useState<(typeof services)[number] | null>(null)

  const ctaTo = user ? '/mis-tickets' : '/login'

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Catálogo"
        title="Servicios"
        subtitle="Soluciones tecnológicas integrales para tu empresa"
        accent="cyan"
        orbPosition="top-right"
      />

      {/* Services grid */}
      <div className="relative z-10 py-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && <p className="text-center text-red-400 mb-8">{error}</p>}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
            </div>
          ) : services.length === 0 ? (
            <p className="text-center" style={{ color: '#5c7a94' }}>Aún no hay servicios publicados en el catálogo.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {services.map((s, i) => {
                const img = s.imagenUrl
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, ease: EASE_APPLE, delay: (i % 4) * 0.08 }}
                    className="group"
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="block w-full text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
                      aria-label={`Ver detalles de ${s.nombre}`}
                    >
                      <GlowCard className="h-full">
                        <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full border-0 shadow-none" style={{ background: 'rgba(8,22,36,0.65)', backdropFilter: 'blur(12px)' }}>
                          {img ? (
                            <div className="h-32 overflow-hidden">
                              <ImageWithFallback src={img} alt={s.nombre} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                            </div>
                          ) : (
                            <div className="h-32 flex items-center justify-center" style={{ background: 'rgba(0,196,224,0.06)' }}>
                              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.2)' }}>
                                <CategoryIcon categoria={s.categoria} className="h-7 w-7 text-brand-cyan" />
                              </div>
                            </div>
                          )}
                          <CardHeader>
                            <p className="text-[10px] uppercase tracking-widest text-brand-cyan">{s.categoria}</p>
                            <CardTitle style={{ color: '#eef4f8' }}>{s.nombre}</CardTitle>
                            <CardDescription style={{ color: '#5c7a94' }} className="line-clamp-2">{s.descripcion}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan transition-all group-hover:gap-2">
                              Ver detalles <ArrowRight className="h-4 w-4" />
                            </span>
                          </CardContent>
                        </Card>
                      </GlowCard>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 py-16" style={{ background: 'rgba(0,196,224,0.04)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4 font-semibold" style={{ color: '#eef4f8' }}>¿Necesitas alguno de estos servicios?</h2>
          <p className="mb-8" style={{ color: '#5c7a94' }}>
            {user ? 'Crea un ticket y nuestro equipo te contactará pronto' : 'Regístrate para crear un ticket y nuestro equipo te contactará pronto'}
          </p>
          <Button asChild size="lg" className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
            <Link to={ctaTo}>{user ? 'Crear ticket' : 'Registrarse ahora'}</Link>
          </Button>
        </div>
      </div>

      {/* Modal de detalle del servicio */}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0" style={{ background: 'rgba(8,22,36,0.95)', border: '1px solid rgba(0,196,224,0.2)', backdropFilter: 'blur(24px)' }}>
          {selected && (
            <>
              {selected.imagenUrl ? (
                <div className="h-52 overflow-hidden">
                  <ImageWithFallback src={selected.imagenUrl} alt={selected.nombre} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center" style={{ background: 'rgba(0,196,224,0.06)' }}>
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.3)' }}>
                    <CategoryIcon categoria={selected.categoria} className="h-10 w-10 text-brand-cyan" />
                  </div>
                </div>
              )}
              <div className="p-6">
                <DialogHeader>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: '#00c4e0' }}>{selected.categoria}</p>
                  <DialogTitle className="text-2xl" style={{ color: '#eef4f8' }}>{selected.nombre}</DialogTitle>
                  <DialogDescription className="text-base leading-relaxed mt-2" style={{ color: '#5c7a94' }}>
                    {selected.descripcion}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6">
                  <Button asChild size="lg" className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
                    <Link to={ctaTo}>{user ? 'Solicitar servicio' : 'Inicia sesión para solicitar'}</Link>
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

```

### 📄 frontend/src/modules/reports/components/ExportButton/index.tsx
```typescript
import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { ReportFormat } from '../../interfaces/IReportsService'
import { Button } from '../../../../core/ui/button'

interface ExportButtonProps {
  onExport: (formato: ReportFormat) => Promise<void>
}

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
]

/** SRP: triggers a report export in the chosen format. */
export function ExportButton({ onExport }: ExportButtonProps) {
  const [busy, setBusy] = useState<ReportFormat | null>(null)

  const handle = async (fmt: ReportFormat) => {
    setBusy(fmt)
    try { await onExport(fmt) } finally { setBusy(null) }
  }

  return (
    <div className="flex gap-2">
      {FORMATS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => void handle(value)}
        >
          {busy === value
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
          {label}
        </Button>
      ))}
    </div>
  )
}

```

### 📄 frontend/src/modules/reports/components/ReportsDashboard/index.tsx
```typescript
import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { useReports } from '../../hooks/useReports'
import { ExportButton } from '../ExportButton'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { userAdminService } from '../../../auth/services/UserAdminService'
import type { AdminUser } from '../../../auth/interfaces/IUserAdminActions'
import type { ReportFilters, ReportFormat } from '../../interfaces/IReportsService'

const ESTADOS = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']

/**
 * H#6 (cliente): Reports dashboard with advanced filters.
 * Filters: RUC, cliente nombre, rango de fechas, estado, técnico asignado.
 * Export: PDF, Excel, CSV.
 *
 * Vicky Pinto: "Voy a filtrar por RUC y por mes, del 1 al 30 de junio,
 * y me va a presentar la pantalla de búsqueda y de ahí puedo descargar en PDF o Excel."
 */
export function ReportsDashboard() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [workers, setWorkers] = useState<AdminUser[]>([])
  const { summary, isLoading, error, exportReport, refresh } = useReports(filters)

  // Lista de técnicos activos para el filtro "Técnico asignado"
  useEffect(() => {
    void userAdminService.listUsers({ role: 'worker', estado: 'activo' })
      .then(setWorkers)
      .catch(() => setWorkers([]))
  }, [])

  const updateFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value || undefined }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasFilters = Object.values(filters).some(Boolean)

  if (isLoading) return <p className="text-sm text-muted-foreground py-8">Cargando reporte…</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!summary) return null

  const maxEstado = Math.max(1, ...Object.values(summary.porEstado))

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reportes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen de tickets del sistema{hasFilters ? ' (filtrado)' : ''}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            className={showFilters ? 'bg-brand-cyan/10' : ''}
          >
            <Filter className="h-4 w-4 mr-1" />Filtros
            {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-brand-cyan" />}
          </Button>
          <ExportButton onExport={(fmt: ReportFormat) => exportReport(fmt)} />
        </div>
      </header>

      {/* H#6: Advanced filters panel */}
      {showFilters && (
        <div className="bg-slate-50 border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Filtros avanzados</h3>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="f-ruc">RUC del cliente</Label>
              <Input
                id="f-ruc"
                value={filters.clienteRuc ?? ''}
                onChange={(e) => updateFilter('clienteRuc', e.target.value)}
                placeholder="Ej: 0991234567001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-cliente">Nombre / Email cliente</Label>
              <Input
                id="f-cliente"
                value={filters.clienteNombre ?? ''}
                onChange={(e) => updateFilter('clienteNombre', e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={filters.estado ?? ''} onValueChange={(v) => updateFilter('estado', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-desde">Fecha desde</Label>
              <Input
                id="f-desde"
                type="date"
                value={filters.fechaDesde ?? ''}
                onChange={(e) => updateFilter('fechaDesde', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-hasta">Fecha hasta</Label>
              <Input
                id="f-hasta"
                type="date"
                value={filters.fechaHasta ?? ''}
                onChange={(e) => updateFilter('fechaHasta', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Técnico asignado</Label>
              <Select value={filters.asignadoId ?? ''} onValueChange={(v) => updateFilter('asignadoId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los técnicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.nombre ? `${w.nombre} ${w.apellido}`.trim() : w.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => void refresh()} className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy">
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Kpi label="Total" value={summary.total} accent="text-foreground" />
        <Kpi label="Abiertos" value={summary.abiertos} accent="text-amber-600" />
        <Kpi label="Cerrados" value={summary.cerrados} accent="text-green-600" />
      </div>

      {/* By estado */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Por estado</h3>
        <div className="space-y-2.5">
          {Object.entries(summary.porEstado).map(([estado, n]) => (
            <div key={estado} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{estado}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-brand-cyan-dark h-full rounded-full transition-[width] duration-500" style={{ width: `${(n / maxEstado) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Kpi({ label, value, accent = 'text-foreground' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

```

### 📄 frontend/src/modules/reports/hooks/useReports.tsx
```typescript
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type {
  IReportsService,
  ReportSummary,
  ReportFilters,
  ReportFormat,
} from '../interfaces/IReportsService'

const ReportsServiceContext = createContext<IReportsService | null>(null)

function useReportsService(): IReportsService {
  const s = useContext(ReportsServiceContext)
  if (!s) throw new Error('useReports must be used inside <ReportsProvider>.')
  return s
}

export function ReportsProvider({ service, children }: { service: IReportsService; children: ReactNode }) {
  return <ReportsServiceContext.Provider value={service}>{children}</ReportsServiceContext.Provider>
}

export function useReports(filters?: ReportFilters) {
  const service = useReportsService()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setSummary(await service.getDashboard(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }, [service, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const exportReport = useCallback(
    (formato: ReportFormat) => service.exportReport(formato, filters),
    [service, filters],
  )

  return { summary, isLoading, error, exportReport, refresh: load }
}

```

### 📄 frontend/src/modules/reports/interfaces/IReportsService.ts
```typescript
/**
 * IReportsService — FE contract for the reports module (DIP anchor).
 * SOLID: DIP · OCP.
 */

export interface ReportSummary {
  total: number
  abiertos: number
  cerrados: number
  porEstado: Record<string, number>
  porPrioridad: Record<string, number>
}

export type ReportFormat = 'csv' | 'pdf' | 'excel'

export interface ReportFilters {
  estado?: string
  servicioId?: string
  fechaDesde?: string
  fechaHasta?: string
  clienteRuc?: string       // H#6 (cliente): filtrar por RUC
  clienteNombre?: string    // H#6 (cliente): filtrar por nombre/email
  asignadoId?: string       // H#6 (cliente): filtrar por técnico
}

export interface IReportsService {
  getDashboard(filters?: ReportFilters): Promise<ReportSummary>
  exportReport(formato: ReportFormat, filters?: ReportFilters): Promise<void>
}

```

### 📄 frontend/src/modules/reports/services/ReportsService.ts
```typescript
/**
 * ReportsService — concrete IReportsService using ApiClient.
 * SRP: reports HTTP + download handling. DIP: hook depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  IReportsService,
  ReportSummary,
  ReportFilters,
  ReportFormat,
} from '../interfaces/IReportsService'

function buildFilters(filters?: ReportFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters?.estado) out.estado = filters.estado
  if (filters?.servicioId) out.servicio_id = filters.servicioId
  if (filters?.fechaDesde) out.fecha_desde = filters.fechaDesde
  if (filters?.fechaHasta) out.fecha_hasta = filters.fechaHasta
  if (filters?.clienteRuc) out.cliente_ruc = filters.clienteRuc
  if (filters?.clienteNombre) out.cliente_nombre = filters.clienteNombre
  if (filters?.asignadoId) out.asignado_id = filters.asignadoId
  return out
}

class ReportsService implements IReportsService {
  async getDashboard(filters?: ReportFilters): Promise<ReportSummary> {
    const params = new URLSearchParams(buildFilters(filters)).toString()
    const data = await apiClient.get<{
      total: number
      abiertos: number
      cerrados: number
      por_estado: Record<string, number>
      por_prioridad: Record<string, number>
    }>(`/reportes/tickets${params ? `?${params}` : ''}`)
    return {
      total: data.total,
      abiertos: data.abiertos,
      cerrados: data.cerrados,
      porEstado: data.por_estado,
      porPrioridad: data.por_prioridad,
    }
  }

  async exportReport(formato: ReportFormat, filters?: ReportFilters): Promise<void> {
    const blob = await apiClient.post<Blob>(
      '/reportes/exportar',
      { formato, ...buildFilters(filters) },
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_tickets.${formato === 'excel' ? 'xlsx' : formato}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}

export const reportsService = new ReportsService()

```

### 📄 frontend/src/modules/tickets/components/AssignModal/index.tsx
```typescript
import { useState, useEffect } from 'react'
import { ticketAdminService } from '../../services/TicketAdminService'
import { userAdminService } from '../../../auth/services/UserAdminService'
import type { AdminUser } from '../../../auth/interfaces/IUserAdminActions'
import { Button } from '../../../../core/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '../../../../core/ui/dialog'

interface AssignModalProps {
  ticketId: string
  onClose: () => void
  onAssigned?: () => void
}

/**
 * SRP: lets an admin pick an active worker and assign a ticket.
 * DIP: ITicketAdminActions (assign) + IUserAdminActions (worker list).
 * H#8 (audit): Uses Radix Dialog for automatic focus trap + keyboard handling.
 */
export function AssignModal({ ticketId, onClose, onAssigned }: AssignModalProps) {
  const [workers, setWorkers] = useState<AdminUser[]>([])
  const [workerId, setWorkerId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void userAdminService.listUsers({ role: 'worker', estado: 'activo' }).then(setWorkers)
  }, [])

  const assign = async () => {
    if (!workerId) return
    setBusy(true)
    setError(null)
    try {
      await ticketAdminService.assignTicket(ticketId, workerId)
      onAssigned?.()
      onClose()
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(d ?? 'No se pudo asignar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>Asignar ticket</DialogTitle>
        <DialogDescription>Selecciona un trabajador activo para este ticket.</DialogDescription>

        <div className="space-y-4 py-2">
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un trabajador…" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.email}</SelectItem>)}
            </SelectContent>
          </Select>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="button" variant="brand" disabled={!workerId || busy} onClick={() => void assign()}>
              {busy ? 'Asignando…' : 'Asignar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

```

### 📄 frontend/src/modules/tickets/components/CreateTicketForm/CreateTicketForm.test.tsx
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CreateTicketForm } from './index'
import { TicketClientContext } from '../../hooks/useTickets'
import type { ITicketClientActions } from '../../interfaces/ITicketClientActions'
import type { TicketDetail } from '../../interfaces/ITicketService'

// Mock the validator chain so tests are time-independent (BusinessRuleValidator checks business hours)
vi.mock('../../validators/TicketValidatorChain', () => ({
  TicketValidatorChain: class {
    run(_data: unknown) {
      return { isValid: true, field: '', errors: [] as string[] }
    }
  },
}))

// ── Mock service ───────────────────────────────────────────────────────────────

const mockTicket: TicketDetail = {
  id: '1',
  numero: 'T-2026-0001',
  asunto: 'Test asunto',
  descripcion: 'Test descripcion que es suficientemente larga.',
  estado: 'Nuevo',
  prioridad: 'Media',
  servicioNombre: 'Soporte técnico',
  clienteNombre: 'Cliente Test',
  asignadoNombre: null,
  adjuntos: [],
  eventos: [],
  creadoEn: new Date().toISOString(),
  actualizadoEn: new Date().toISOString(),
}

function makeService(overrides: Partial<ITicketClientActions> = {}): ITicketClientActions {
  return {
    createTicket: vi.fn().mockResolvedValue(mockTicket),
    getMyTickets: vi.fn().mockResolvedValue([]),
    getTicketDetail: vi.fn().mockResolvedValue(mockTicket),
    ...overrides,
  }
}

const SERVICES = [{ id: '1', nombre: 'Soporte técnico' }]

function renderForm(service: ITicketClientActions, onSuccess = vi.fn()) {
  return render(
    <TicketClientContext.Provider value={service}>
      <CreateTicketForm services={SERVICES} onSuccess={onSuccess} />
    </TicketClientContext.Provider>
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CreateTicketForm', () => {
  describe('field rendering', () => {
    it('renders all required fields', () => {
      renderForm(makeService())
      expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear ticket/i })).toBeInTheDocument()
    })

    it('renders service options', () => {
      renderForm(makeService())
      expect(screen.getByRole('option', { name: /soporte técnico/i })).toBeInTheDocument()
    })

    it('renders all priority options', () => {
      renderForm(makeService())
      expect(screen.getByRole('radio', { name: 'Baja' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Media' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Alta' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Critica' })).toBeInTheDocument()
    })
  })

  describe('client-side validation', () => {
    it('shows error when no service is selected', async () => {
      renderForm(makeService())
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('shows asunto character count', async () => {
      renderForm(makeService())
      const asuntoInput = screen.getByLabelText(/asunto/i)
      await userEvent.type(asuntoInput, 'Hola')
      expect(screen.getByText('4/80')).toBeInTheDocument()
    })

    it('does not call createTicket when servicio is not selected', async () => {
      const service = makeService()
      renderForm(service)
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))
      expect(service.createTicket).not.toHaveBeenCalled()
    })
  })

  describe('successful submission', () => {
    it('calls createTicket with correct payload', async () => {
      const service = makeService()
      const onSuccess = vi.fn()
      renderForm(service, onSuccess)

      await userEvent.type(screen.getByLabelText(/asunto/i), 'Problema con factura')
      await userEvent.type(
        screen.getByLabelText(/descripción/i),
        'No puedo descargar la factura del mes de mayo.'
      )
      await userEvent.selectOptions(screen.getByLabelText(/servicio/i), '1')

      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))

      await waitFor(() => {
        expect(service.createTicket).toHaveBeenCalledWith(
          expect.objectContaining({
            asunto: 'Problema con factura',
            servicioId: '1',
          })
        )
      })
    })

    it('calls onSuccess with the new ticket id', async () => {
      const service = makeService()
      const onSuccess = vi.fn()
      renderForm(service, onSuccess)

      await userEvent.type(screen.getByLabelText(/asunto/i), 'Problema con factura')
      await userEvent.type(
        screen.getByLabelText(/descripción/i),
        'Descripción suficientemente larga para pasar validación.'
      )
      await userEvent.selectOptions(screen.getByLabelText(/servicio/i), '1')
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockTicket.id)
      })
    })
  })

  describe('error handling', () => {
    it('shows error message when createTicket rejects', async () => {
      const service = makeService({
        createTicket: vi.fn().mockRejectedValue(new Error('Error de servidor')),
      })
      renderForm(service)

      await userEvent.type(screen.getByLabelText(/asunto/i), 'Problema con factura')
      await userEvent.type(
        screen.getByLabelText(/descripción/i),
        'Descripción suficientemente larga.'
      )
      await userEvent.selectOptions(screen.getByLabelText(/servicio/i), '1')
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))

      await waitFor(() => {
        expect(screen.getByText(/error de servidor/i)).toBeInTheDocument()
      })
    })
  })
})

```

### 📄 frontend/src/modules/tickets/components/CreateTicketForm/index.tsx
```typescript
import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { User } from 'lucide-react'
import { useTicketsList } from '../../hooks/useTickets'
import { useAuth } from '../../../auth/hooks/useAuth'
import { TicketValidatorChain } from '../../validators/TicketValidatorChain'
import type { TicketPrioridad } from '../../interfaces/ITicketService'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Textarea } from '../../../../core/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { Alert, AlertDescription } from '../../../../core/ui/alert'

interface ServiceOption {
  id: string
  nombre: string
}

interface CreateTicketFormProps {
  services: ServiceOption[]
  onSuccess?: (ticketId: string) => void
}

interface FormErrors {
  asunto?: string
  descripcion?: string
  servicioId?: string
  adjuntos?: string
  horario?: string
  general?: string
}

const PRIORIDADES: TicketPrioridad[] = ['Baja', 'Media', 'Alta', 'Critica']

/**
 * SRP: manages ticket creation form state and submission.
 * DIP: submits via useTicketsList (ITicketClientActions) — never calls TicketService directly.
 * OCP: new field → add to state + JSX; validation chain handles it automatically.
 */
export function CreateTicketForm({ services, onSuccess }: CreateTicketFormProps) {
  const { createTicket, isLoading } = useTicketsList()
  const { user } = useAuth()
  const validatorChain = useRef(new TicketValidatorChain())

  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [servicioId, setServicioId] = useState('')
  const [prioridad, setPrioridad] = useState<TicketPrioridad>('Media')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // H#7 (cliente): Autocompletar datos del cliente
  const clientInfo = user ? {
    nombre: `${user.nombre} ${user.apellido}`.trim() || user.email,
    email: user.email,
    ruc: user.ruc ?? '',
  } : null

  const validate = (): boolean => {
    const result = validatorChain.current.run({
      asunto,
      descripcion,
      adjuntos: [],
    })

    if (!result.isValid) {
      setErrors({ [result.field]: result.errors[0] })
      return false
    }

    if (!servicioId) {
      setErrors({ servicioId: 'Selecciona un servicio.' })
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const ticket = await createTicket({ asunto, descripcion, servicioId, prioridad, adjuntos: [] })
      onSuccess?.(ticket.id)
      // Reset form on success
      setAsunto('')
      setDescripcion('')
      setServicioId('')
      setPrioridad('Media')
      setErrors({})
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Error al crear el ticket.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* H#7: Client info auto-filled */}
      {clientInfo && (
        <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-cyan/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-brand-cyan-dark" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{clientInfo.nombre}</p>
            <p className="text-xs text-muted-foreground">{clientInfo.email}{clientInfo.ruc ? ` · RUC: ${clientInfo.ruc}` : ''}</p>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-brand-cyan bg-brand-cyan/10 rounded-full px-2 py-0.5">Autocompletado</span>
        </div>
      )}

      {/* Asunto */}
      <div className="space-y-2">
        <Label htmlFor="asunto">
          Asunto <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Input
          id="asunto"
          type="text"
          maxLength={80}
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          aria-describedby={errors.asunto ? 'asunto-error' : undefined}
          aria-invalid={!!errors.asunto}
          placeholder="Describe brevemente el problema"
        />
        <div className="flex justify-between">
          {errors.asunto && (
            <p id="asunto-error" role="alert" className="text-xs text-destructive">
              {errors.asunto}
            </p>
          )}
          <p className="text-xs text-muted-foreground ml-auto tabular-nums">{asunto.length}/80</p>
        </div>
      </div>

      {/* Servicio */}
      <div className="space-y-2">
        <Label htmlFor="servicio">
          Servicio <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Select value={servicioId} onValueChange={setServicioId}>
          <SelectTrigger
            id="servicio"
            aria-invalid={!!errors.servicioId}
            className="w-full aria-invalid:border-destructive"
          >
            <SelectValue placeholder="Selecciona un servicio…" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.servicioId && (
          <p role="alert" className="text-xs text-destructive">{errors.servicioId}</p>
        )}
      </div>

      {/* Prioridad */}
      <div className="space-y-2">
        <span className="block text-sm font-medium">Prioridad</span>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Prioridad del ticket">
          {PRIORIDADES.map((p) => (
            <label
              key={p}
              className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                prioridad === p
                  ? 'bg-brand-navy text-white border-brand-navy'
                  : 'bg-card text-muted-foreground border-border hover:border-brand-cyan-dark hover:text-foreground'
              }`}
            >
              <input
                type="radio"
                name="prioridad"
                value={p}
                checked={prioridad === p}
                onChange={() => setPrioridad(p)}
                className="sr-only"
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">
          Descripción <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Textarea
          id="descripcion"
          rows={5}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          aria-describedby={errors.descripcion ? 'descripcion-error' : undefined}
          aria-invalid={!!errors.descripcion}
          className="resize-none"
          placeholder="Describe el problema con el mayor detalle posible (mínimo 10 caracteres)"
        />
        {errors.descripcion && (
          <p id="descripcion-error" role="alert" className="text-xs text-destructive">
            {errors.descripcion}
          </p>
        )}
      </div>

      {/* H#8 (cliente): imágenes por WhatsApp (sin subida de archivos al sistema) */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm font-medium text-green-800 mb-1">📸 ¿Tienes imágenes del problema?</p>
        <p className="text-xs text-green-700 mb-2">Envíalas por WhatsApp. Las imágenes se gestionan directamente por WhatsApp y no se acumulan en el sistema.</p>
        <a
          href="https://wa.me/59396999090?text=Hola,%20tengo%20imágenes%20del%20problema%20para%20el%20ticket"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Enviar imágenes por WhatsApp
        </a>
      </div>

      {/* General error */}
      {errors.horario && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertDescription className="text-amber-800">{errors.horario}</AlertDescription>
        </Alert>
      )}
      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button type="submit" variant="brand" size="lg" disabled={isSubmitting || isLoading} className="w-full">
        {isSubmitting ? 'Creando ticket…' : 'Crear ticket'}
      </Button>
    </form>
  )
}

```

### 📄 frontend/src/modules/tickets/components/FileUpload/index.tsx
```typescript
import { useRef } from 'react'

interface FileUploadProps {
  files: File[]
  onChange: (files: File[]) => void
  maxSizeMb?: number
}

/**
 * SRP: file selection UI only. Validation (size/MIME) is delegated to FileValidator (S13)
 * inside the form's validator chain; storage is handled by the backend StorageService.
 */
export function FileUpload({ files, onChange, maxSizeMb = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Array.from(e.target.files ?? []))
  }

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i))

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        onChange={handleChange}
        className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <p className="text-[11px] text-gray-400 mt-1">Máx. {maxSizeMb} MB por archivo.</p>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((file, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span>📎 {file.name}</span>
              <span className="text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
              <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-700 ml-auto">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

```

### 📄 frontend/src/modules/tickets/components/StatusChangeForm/index.tsx
```typescript
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, MessageSquare } from 'lucide-react'
import { Button } from '../../../../core/ui/button'
import { Label } from '../../../../core/ui/label'
import { Textarea } from '../../../../core/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import type { TicketEstado } from '../../interfaces/ITicketService'

const AVAILABLE_STATES: { value: TicketEstado; label: string }[] = [
  { value: 'EnProceso', label: 'En Proceso' },
  { value: 'EnEspera', label: 'En Espera' },
  { value: 'Resuelto', label: 'Resuelto' },
  { value: 'Cerrado', label: 'Cerrado' },
]

interface StatusChangeFormProps {
  currentStatus: TicketEstado
  onSubmit: (newStatus: TicketEstado, comment: string) => Promise<void>
  onCancel?: () => void
}

/**
 * H#3 (cliente): Formulario para cambiar estado de ticket CON observación obligatoria.
 * La cliente Vicky Pinto requiere que cada cambio de estado tenga una justificación.
 * "Yo le pongo cerrado en el estatus, pero tengo que ponerle un comentario al lado"
 *
 * SRP: only renders form UI, delegates API call to parent via onSubmit.
 */
export function StatusChangeForm({ currentStatus, onSubmit, onCancel }: StatusChangeFormProps) {
  const [newStatus, setNewStatus] = useState<TicketEstado | ''>('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus) {
      toast.error('Selecciona un nuevo estado')
      return
    }
    if (!comment.trim()) {
      toast.error('La observación es obligatoria para auditoría')
      return
    }
    setBusy(true)
    try {
      await onSubmit(newStatus, comment.trim())
      toast.success(`Estado cambiado a ${newStatus}`)
      setNewStatus('')
      setComment('')
    } catch {
      toast.error('No se pudo cambiar el estado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-4 w-4 text-brand-cyan" />
        <h4 className="text-sm font-semibold text-foreground">Cambiar estado del ticket</h4>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-status">Nuevo estado</Label>
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TicketEstado)}>
          <SelectTrigger id="new-status">
            <SelectValue placeholder="Selecciona un estado…" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_STATES.filter((s) => s.value !== currentStatus).map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observation">
          Observación <span className="text-destructive">*</span>
          <span className="text-xs font-normal text-muted-foreground ml-1">(obligatorio para auditoría)</span>
        </Label>
        <Textarea
          id="observation"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ej: Usuario no entendió las directrices, se cerró el caso…"
          className="resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={busy || !newStatus || !comment.trim()} className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Confirmar cambio
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        )}
      </div>
    </form>
  )
}

```

### 📄 frontend/src/modules/tickets/components/TicketCard/index.tsx
```typescript
import type { TicketSummary } from '../../interfaces/ITicketService'
import { TicketStatusBadge } from '../TicketStatusBadge'

const PRIORITY_DOT: Record<string, string> = {
  Critica: 'bg-red-500',
  Alta:    'bg-amber-500',
  Media:   'bg-blue-500',
  Baja:    'bg-slate-400',
}

interface TicketCardProps {
  ticket: TicketSummary
  onSelect?: (id: string) => void
}

/**
 * SRP: renders a summary card for one ticket. No data fetching.
 * DIP: depends on TicketSummary type (from ITicketService), not on any concrete service.
 * OCP: new display field → extend TicketSummary + update this template; no structural change.
 */
export function TicketCard({ ticket, onSelect }: TicketCardProps) {
  const handleClick = () => onSelect?.(ticket.id)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(ticket.id)
    }
  }

  return (
    <article
      className="group bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ticket ${ticket.numero}: ${ticket.asunto}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wide">
            {ticket.numero}
          </p>
          <h3 className="text-sm font-semibold text-foreground truncate mt-0.5 leading-snug group-hover:text-brand-cyan-dark transition-colors">
            {ticket.asunto}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 truncate">{ticket.servicioNombre}</p>
        </div>
        <TicketStatusBadge estado={ticket.estado} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <time className="text-xs text-muted-foreground">
          {new Date(ticket.creadoEn).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </time>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[ticket.prioridad] ?? 'bg-slate-400'}`} aria-hidden />
          {ticket.prioridad}
        </span>
      </div>
    </article>
  )
}

```

### 📄 frontend/src/modules/tickets/components/TicketDetail/index.tsx
```typescript
import { Paperclip } from 'lucide-react'
import { useTicketDetail } from '../../hooks/useTickets'
import { TicketStatusBadge } from '../TicketStatusBadge'
import { TicketHistory } from '../TicketHistory'

interface TicketDetailProps {
  ticketId: string
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="mt-0.5 text-foreground">{children}</p>
    </div>
  )
}

/**
 * SRP: renders full detail of one ticket including history.
 * DIP: loads data via useTicketDetail which depends on ITicketClientActions (Context).
 * OCP: new section (e.g. adjuntos list) → add below the grid without touching other sections.
 */
export function TicketDetail({ ticketId }: TicketDetailProps) {
  const { ticket, isLoading, error } = useTicketDetail(ticketId)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-20 bg-muted rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!ticket) return null

  return (
    <article className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-mono text-muted-foreground tracking-wide">{ticket.numero}</p>
          <h2 className="text-xl font-bold text-foreground mt-1 leading-snug">
            {ticket.asunto}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{ticket.servicioNombre}</p>
        </div>
        <TicketStatusBadge estado={ticket.estado} />
      </div>

      {/* Description */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Descripción
        </h3>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {ticket.descripcion}
        </p>
      </section>

      {/* Metadata grid */}
      <section className="grid grid-cols-2 gap-4 text-sm bg-slate-50 border border-border rounded-lg p-4">
        <MetaField label="Cliente">{ticket.clienteNombre}</MetaField>
        <MetaField label="Asignado a">
          {ticket.asignadoNombre ?? <span className="italic text-muted-foreground">Sin asignar</span>}
        </MetaField>
        <MetaField label="Prioridad">{ticket.prioridad}</MetaField>
        <MetaField label="Creado">
          {new Date(ticket.creadoEn).toLocaleDateString('es-EC', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </MetaField>
      </section>

      {/* Attachments */}
      {ticket.adjuntos.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Adjuntos ({ticket.adjuntos.length})
          </h3>
          <ul className="space-y-2">
            {ticket.adjuntos.map((att) => (
              <li key={att.id}>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-cyan-dark font-medium hover:underline"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span>{att.nombreArchivo}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({(att.tamañoBytes / 1024).toFixed(0)} KB)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* History */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Historial de eventos
        </h3>
        <TicketHistory events={ticket.eventos} />
      </section>
    </article>
  )
}

```

### 📄 frontend/src/modules/tickets/components/TicketHistory/index.tsx
```typescript
import { ArrowRight } from 'lucide-react'
import type { TicketEvent } from '../../interfaces/ITicketService'
import { TicketStatusBadge } from '../TicketStatusBadge'
import type { TicketEstado } from '../../interfaces/ITicketService'

interface TicketHistoryProps {
  events: TicketEvent[]
}

const EVENT_LABELS: Record<string, string> = {
  creacion:      'Ticket creado',
  cambio_estado: 'Cambio de estado',
  comentario:    'Comentario',
  asignacion:    'Asignación',
  reasignacion:  'Reasignación',
}

/**
 * SRP: renders a timeline of TicketEvent records. No data fetching.
 * Receives events as props — TicketDetail is responsible for loading them.
 */
export function TicketHistory({ events }: TicketHistoryProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">Sin historial de eventos.</p>
    )
  }

  return (
    <ol className="relative border-l-2 border-border space-y-6 ml-2">
      {events.map((event) => (
        <li key={event.id} className="ml-6">
          {/* Timeline dot */}
          <span className="absolute -left-1.75 mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-cyan ring-4 ring-card" />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {EVENT_LABELS[event.tipoEvento] ?? event.tipoEvento}
              </span>

              {event.estadoAnterior && event.estadoNuevo && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TicketStatusBadge estado={event.estadoAnterior as TicketEstado} />
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  <TicketStatusBadge estado={event.estadoNuevo as TicketEstado} />
                </span>
              )}
            </div>

            <time className="text-xs text-muted-foreground">
              {new Date(event.creadoEn).toLocaleString('es-EC', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' · '}
              <span className="font-medium text-foreground/70">{event.autorNombre}</span>
            </time>

            {event.comentario && (
              <p className="text-sm text-foreground/90 bg-slate-50 border border-border rounded-md px-3 py-2 mt-1">
                {event.comentario}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

```

### 📄 frontend/src/modules/tickets/components/TicketStatusBadge/TicketStatusBadge.test.tsx
```typescript
import { render, screen } from '@testing-library/react'
import { TicketStatusBadge } from './index'
import type { TicketEstado } from '../../interfaces/ITicketService'

const STATES: TicketEstado[] = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']

// Maps estado keys to the display labels used in aria-label ("Estado: {label}")
const LABEL_MAP: Record<TicketEstado, RegExp> = {
  Nuevo:     /nuevo/i,
  EnProceso: /en proceso/i,
  EnEspera:  /en espera/i,
  Resuelto:  /resuelto/i,
  Cerrado:   /cerrado/i,
}

describe('TicketStatusBadge', () => {
  it.each(STATES)('renders label for estado "%s"', (estado) => {
    render(<TicketStatusBadge estado={estado} />)
    const badge = screen.getByLabelText(LABEL_MAP[estado])
    expect(badge).toBeInTheDocument()
  })

  it('renders "Nuevo" with blue styling', () => {
    const { container } = render(<TicketStatusBadge estado="Nuevo" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-blue-50')
    expect(badge).toHaveClass('text-blue-700')
  })

  it('renders "Cerrado" with slate styling', () => {
    const { container } = render(<TicketStatusBadge estado="Cerrado" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-slate-100')
  })

  it('renders "EnProceso" with cyan styling', () => {
    const { container } = render(<TicketStatusBadge estado="EnProceso" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-cyan-50')
  })

  it('renders "Resuelto" with green styling', () => {
    const { container } = render(<TicketStatusBadge estado="Resuelto" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-green-50')
  })

  it('includes aria-label with estado', () => {
    render(<TicketStatusBadge estado="EnEspera" />)
    expect(screen.getByLabelText(/en espera/i)).toBeInTheDocument()
  })
})

```

### 📄 frontend/src/modules/tickets/components/TicketStatusBadge/index.tsx
```typescript
import type { TicketEstado } from '../../interfaces/ITicketService'

interface StatusConfig {
  label: string
  className: string
}

const STATUS_CONFIG: Record<TicketEstado, StatusConfig> = {
  Nuevo:     { label: 'Nuevo',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  EnProceso: { label: 'En Proceso', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  EnEspera:  { label: 'En Espera',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Resuelto:  { label: 'Resuelto',   className: 'bg-green-50 text-green-700 border-green-200' },
  Cerrado:   { label: 'Cerrado',    className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

interface TicketStatusBadgeProps {
  estado: TicketEstado
}

/**
 * SRP: renders a colored badge for a ticket state.
 * DIP: reads color config from STATUS_CONFIG — TicketStateMachine.TRANSITIONS
 *      can be cross-referenced here in Sprint 4 without modifying this component.
 * OCP: new state → new entry in STATUS_CONFIG; component unchanged.
 */
export function TicketStatusBadge({ estado }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[estado] ?? {
    label: estado,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      aria-label={`Estado: ${config.label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {config.label}
    </span>
  )
}

```

### 📄 frontend/src/modules/tickets/components/TicketsTable.tsx
```typescript
import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../core/ui/table'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../core/ui/select'
import { StatusBadge, PriorityBadge } from './ticketBadges'
import type { TicketSummary } from '../interfaces/ITicketService'

interface TicketsTableProps {
  tickets: TicketSummary[]
  onView: (id: string) => void
}

export function TicketsTable({ tickets, onView }: TicketsTableProps) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('all')

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase()
    const matchesSearch =
      t.numero.toLowerCase().includes(q) ||
      t.asunto.toLowerCase().includes(q) ||
      t.servicioNombre.toLowerCase().includes(q)
    const matchesEstado = estado === 'all' || t.estado === estado
    return matchesSearch && matchesEstado
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input className="flex-1" placeholder="Buscar por número, asunto o servicio…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Nuevo">Nuevo</SelectItem>
            <SelectItem value="EnProceso">En Proceso</SelectItem>
            <SelectItem value="EnEspera">En Espera</SelectItem>
            <SelectItem value="Resuelto">Resuelto</SelectItem>
            <SelectItem value="Cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:font-semibold">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Número</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No se encontraron tickets</TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => onView(t.id)}>
                    <TableCell className="font-mono font-medium text-foreground">{t.numero}</TableCell>
                    <TableCell>{t.servicioNombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{t.asunto}</TableCell>
                    <TableCell><StatusBadge estado={t.estado} /></TableCell>
                    <TableCell><PriorityBadge prioridad={t.prioridad} /></TableCell>
                    <TableCell>{new Date(t.creadoEn).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onView(t.id) }}
                        aria-label="Ver ticket"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Mostrando {filtered.length} de {tickets.length} tickets</p>
    </div>
  )
}

```

### 📄 frontend/src/modules/tickets/components/ticketBadges.tsx
```typescript
import { Badge } from '../../../core/ui/badge'
import type { TicketEstado, TicketPrioridad } from '../interfaces/ITicketService'

const SOFT = 'border font-medium'

const ESTADO: Record<TicketEstado, { label: string; cls: string }> = {
  Nuevo:     { label: 'Nuevo',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  EnProceso: { label: 'En Proceso', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  EnEspera:  { label: 'En Espera',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Resuelto:  { label: 'Resuelto',   cls: 'bg-green-50 text-green-700 border-green-200' },
  Cerrado:   { label: 'Cerrado',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const PRIORIDAD: Record<TicketPrioridad, { label: string; cls: string }> = {
  Baja:    { label: 'Baja',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  Media:   { label: 'Media',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  Alta:    { label: 'Alta',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Critica: { label: 'Crítica', cls: 'bg-red-50 text-red-700 border-red-200' },
}

export function StatusBadge({ estado }: { estado: TicketEstado }) {
  const c = ESTADO[estado] ?? { label: estado, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return <Badge className={`${SOFT} ${c.cls}`}>{c.label}</Badge>
}

export function PriorityBadge({ prioridad }: { prioridad: TicketPrioridad }) {
  const c = PRIORIDAD[prioridad] ?? { label: prioridad, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return <Badge className={`${SOFT} ${c.cls}`}>{c.label}</Badge>
}

```

### 📄 frontend/src/modules/tickets/hooks/useTickets.tsx
```typescript
import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import type { ReactNode } from 'react'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import type {
  TicketDetail,
  TicketSummary,
  TicketFilterOptions,
  TicketCreatePayload,
} from '../interfaces/ITicketService'

// ── DIP: service delivered via Context, never imported directly ───────────────

export const TicketClientContext = createContext<ITicketClientActions | null>(null)

function useTicketService(): ITicketClientActions {
  const service = useContext(TicketClientContext)
  if (!service) {
    throw new Error(
      'useTickets must be used inside <TicketClientProvider>. ' +
      'Wrap your route tree with the provider and inject an ITicketClientActions instance.'
    )
  }
  return service
}

interface TicketClientProviderProps {
  service: ITicketClientActions
  children: ReactNode
}

export function TicketClientProvider({ service, children }: TicketClientProviderProps) {
  return (
    <TicketClientContext.Provider value={service}>
      {children}
    </TicketClientContext.Provider>
  )
}

// ── Hook: list + create ───────────────────────────────────────────────────────

interface UseTicketsListResult {
  tickets: TicketSummary[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createTicket: (payload: TicketCreatePayload) => Promise<TicketDetail>
}

export function useTicketsList(filters?: TicketFilterOptions): UseTicketsListResult {
  const service = useTicketService()
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await service.getMyTickets(filters)
      setTickets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tickets')
    } finally {
      setIsLoading(false)
    }
  }, [service, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void fetchTickets() }, [fetchTickets])

  const createTicket = useCallback(
    async (payload: TicketCreatePayload): Promise<TicketDetail> => {
      const newTicket = await service.createTicket(payload)
      void fetchTickets()
      return newTicket
    },
    [service, fetchTickets],
  )

  return { tickets, isLoading, error, refresh: fetchTickets, createTicket }
}

// ── Hook: single ticket detail ────────────────────────────────────────────────

interface UseTicketDetailResult {
  ticket: TicketDetail | null
  isLoading: boolean
  error: string | null
}

export function useTicketDetail(ticketId: string): UseTicketDetailResult {
  const service = useTicketService()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await service.getTicketDetail(ticketId)
        if (!cancelled) setTicket(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el ticket')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [service, ticketId])

  return { ticket, isLoading, error }
}

```

### 📄 frontend/src/modules/tickets/interfaces/IStorageService.ts
```typescript
/**
 * ISP interface for file storage — segregated from ITicketService.
 *
 * Responsibility (SRP): declare the contract for uploading, retrieving, and deleting files.
 *     No ticket logic, no authentication — only storage I/O signatures.
 * Depends on: nothing — pure abstraction.
 * Pattern: ISP + DIP — useTickets hook receives IStorageService via the service layer;
 *     FileUpload component delegates to this contract without knowing the backend.
 * SOLID: ISP · DIP · LSP · OCP
 *
 * Why segregated from ITicketService:
 *     FileUpload needs storage but has no reason to know about ticket creation logic (ISP).
 *     Future modules (e.g. catalog image upload) can reuse IStorageService without
 *     coupling to ticket internals.
 *
 * OCP: new provider (GCS, Azure Blob) = new class implementing IStorageService.
 *     FileUpload and useTickets remain unchanged (DIP).
 */

export interface IStorageService {
  /**
   * Upload a file to the configured storage backend.
   * @param file - the File object selected by the user
   * @param path - destination path (e.g. 'tickets/T-2026-0001/factura.pdf')
   * @returns public or signed URL of the uploaded file
   */
  upload(file: File, path: string): Promise<string>

  /**
   * Permanently remove a file from the storage backend.
   * @param path - the same path used on upload
   */
  delete(path: string): Promise<void>

  /**
   * Return the (possibly signed) URL for an existing file.
   * @param path - storage path of the file
   * @returns accessible URL
   */
  getUrl(path: string): Promise<string>
}

```

### 📄 frontend/src/modules/tickets/interfaces/ITicketAdminActions.ts
```typescript
/**
 * ISP interface — ticket operations available to an ADMIN user.
 *
 * Responsibility (SRP): expose only what an ADMINISTRADOR needs from tickets.
 *     An admin assigns, reassigns, and has a global view. Nothing from client/worker scope.
 * Depends on: TicketSummary, TicketDetail, TicketFilterOptions from ITicketService.ts.
 * Pattern: ISP — admin components depend on this, never on ITicketService.
 * SOLID: ISP · DIP · OCP · LSP
 *
 * Why NOT extending ITicketWorkerActions or ITicketClientActions:
 *     An admin manages assignment — entirely different semantics from status updates or creation.
 *     Merging would expose irrelevant methods to admin views (ISP violation).
 *
 * OCP: new admin action (e.g. bulkAssign) = new method here. Client and Worker unchanged.
 *
 * Sprint usage:
 *   S15 → this file (contract — Sprint 4 exercises these methods)
 */

import type { TicketSummary, TicketDetail, TicketFilterOptions } from './ITicketService'

export interface ITicketAdminActions {
  /**
   * HU-05: Assign a Nuevo ticket to a worker (transitions it to EnProceso).
   * @param workerId - ID of the TRABAJADOR to assign
   */
  assignTicket(id: string, workerId: string): Promise<TicketDetail>

  /**
   * HU-08: Reassign an EnProceso ticket to a different worker.
   * @param newWorkerId - ID of the new TRABAJADOR
   */
  reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail>

  /**
   * HU-10 (admin): Global ticket list with extended filters.
   * Supports all TicketFilterOptions plus clienteId and asignadoId.
   */
  getAllTickets(
    filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string }
  ): Promise<TicketSummary[]>
}

```

### 📄 frontend/src/modules/tickets/interfaces/ITicketClientActions.ts
```typescript
/**
 * ISP interface — ticket operations available to a CLIENT user.
 *
 * Responsibility (SRP): expose only what a CLIENTE needs from tickets.
 *     A client creates tickets and reads their own. Nothing more.
 * Depends on: TicketCreatePayload, TicketSummary, TicketDetail, TicketFilterOptions
 *             from ITicketService.ts — shared types, no coupling to implementation.
 * Pattern: ISP — useTickets hook (client context) depends on this, never on ITicketService.
 * SOLID: ISP · DIP · OCP · LSP
 *
 * Why NOT a subset of ITicketService:
 *     If ITicketService grows with internal methods, this interface stays frozen.
 *     The client hook never sees admin or worker operations (ISP purity).
 *
 * OCP: new client action = new method here. Worker and Admin interfaces unchanged.
 *
 * Sprint usage:
 *   S15 → this file (contract)
 *   S17 → useTickets hook implements this context
 *   S17 → CreateTicketForm, TicketCard, TicketDetail consume via useTickets
 */

import type {
  TicketCreatePayload,
  TicketSummary,
  TicketDetail,
  TicketFilterOptions,
} from './ITicketService'

export interface ITicketClientActions {
  /** HU-06: Create a new support ticket (file upload handled by IStorageService). */
  createTicket(payload: TicketCreatePayload): Promise<TicketDetail>

  /** HU-10: List tickets belonging to the authenticated client. */
  getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]>

  /** HU-06: Full detail of one ticket. Throws if not owned by current user. */
  getTicketDetail(id: string): Promise<TicketDetail>
}

```

### 📄 frontend/src/modules/tickets/interfaces/ITicketService.ts
```typescript
/**
 * Root contract for all ticket operations in the frontend.
 *
 * Responsibility (SRP): declare the complete ticket operation contract + shared types.
 *     No HTTP calls, no state management — only method signatures and data shapes.
 * Depends on: nothing — root abstraction.
 * Pattern: DIP anchor — TicketService (Singleton) will implement this in S12.
 * SOLID: DIP · OCP · LSP
 *
 * ISP note (S15):
 *     Three role-specific interfaces will split this contract:
 *     ITicketClientActions, ITicketWorkerActions, ITicketAdminActions.
 *     Hooks and components will depend on the role-specific interface, never on ITicketService.
 *
 * OCP: new ticket operation = new method here + implementation in TicketService.
 *     Existing role interfaces are only extended, never modified.
 */

// ─── Shared enums ────────────────────────────────────────────────────────────

export type TicketEstado =
  | 'Nuevo'
  | 'EnProceso'
  | 'EnEspera'
  | 'Resuelto'
  | 'Cerrado'

export type TicketPrioridad = 'Baja' | 'Media' | 'Alta' | 'Critica'

// ─── Shared data shapes ──────────────────────────────────────────────────────

export interface AttachmentMeta {
  id: string
  nombreArchivo: string
  url: string
  tamañoBytes: number
  mimeType: string
}

export interface TicketSummary {
  id: string
  numero: string            // format: T-YYYY-NNNN
  asunto: string
  estado: TicketEstado
  prioridad: TicketPrioridad
  servicioNombre: string
  creadoEn: string          // ISO 8601
}

export interface TicketEvent {
  id: string
  tipoEvento: string
  estadoAnterior: TicketEstado | null
  estadoNuevo: TicketEstado | null
  comentario: string
  autorNombre: string
  creadoEn: string
}

export interface TicketDetail extends TicketSummary {
  descripcion: string
  clienteNombre: string
  asignadoNombre: string | null
  adjuntos: AttachmentMeta[]
  eventos: TicketEvent[]
  actualizadoEn: string
}

export interface TicketCreatePayload {
  asunto: string            // max 80 chars
  descripcion: string       // min 10 chars
  servicioId: string
  prioridad: TicketPrioridad
  adjuntos?: File[]         // validated by FileValidator (S13) before upload
}

export interface TicketFilterOptions {
  estado?: TicketEstado
  prioridad?: TicketPrioridad
  fechaDesde?: string
  fechaHasta?: string
  servicioId?: string
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface ITicketService {
  // ── HU-06: Creación (cliente) ──────────────────────────────────────────────

  /** Create a new ticket. Handles file upload via IStorageService internally. */
  createTicket(payload: TicketCreatePayload): Promise<TicketDetail>

  // ── Lectura (cliente) ──────────────────────────────────────────────────────

  /** Return all tickets belonging to the authenticated client. */
  getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]>

  /** Return full detail of one ticket. Throws TicketNotFound if no access. */
  getTicketDetail(id: string): Promise<TicketDetail>

  // ── Gestión de estado (worker) — contratos para Sprint 3 ──────────────────

  /** Transition ticket to a new state. Requires non-empty comment (BR-35). */
  updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail>

  /** Add a comment without changing state. */
  addComment(id: string, comment: string): Promise<TicketEvent>

  /** Transition Resuelto → Cerrado. Requires comment. */
  closeTicket(id: string, comment: string): Promise<TicketDetail>

  // ── Administración (admin) — contratos para Sprint 4 ──────────────────────

  /** Assign a Nuevo ticket to a worker (transitions to EnProceso). */
  assignTicket(id: string, workerId: string): Promise<TicketDetail>

  /** Reassign an EnProceso ticket to a different worker. */
  reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail>

  /** Return all tickets in the system (admin view). */
  getAllTickets(filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string }): Promise<TicketSummary[]>
}

```

### 📄 frontend/src/modules/tickets/interfaces/ITicketWorkerActions.ts
```typescript
/**
 * ISP interface — ticket operations available to a WORKER user.
 *
 * Responsibility (SRP): expose only what a TRABAJADOR needs from tickets.
 *     A worker updates status, comments, and closes assigned tickets. Nothing else.
 * Depends on: TicketEstado, TicketDetail, TicketEvent from ITicketService.ts.
 * Pattern: ISP — useTickets hook (worker context) depends on this, never on ITicketService.
 * SOLID: ISP · DIP · OCP · LSP
 *
 * Why NOT extending ITicketClientActions:
 *     A worker does not create tickets on behalf of clients via the same flow.
 *     Merging would expose createTicket() to worker components that never call it.
 *
 * OCP: new worker action (e.g. requestInfo) = new method here. Client and Admin unchanged.
 *
 * Sprint usage:
 *   S15 → this file (contract — Sprint 3 exercises these methods)
 */

import type { TicketEstado, TicketDetail, TicketEvent } from './ITicketService'

export interface ITicketWorkerActions {
  /**
   * HU-07: Transition ticket to a new state. Requires non-empty comment (BR-35).
   * Internally delegates to TicketStateMachine.
   */
  updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail>

  /** HU-11: Add a comment without changing state. Returns the new TicketEvent. */
  addComment(id: string, comment: string): Promise<TicketEvent>

  /** HU-12: Transition Resuelto → Cerrado (terminal). Requires comment (BR-35). */
  closeTicket(id: string, comment: string): Promise<TicketDetail>
}

```

### 📄 frontend/src/modules/tickets/pages/CreateTicketPage/index.tsx
```typescript
import { useCatalog } from '../../../catalog/hooks/useCatalog'
import { CreateTicketForm } from '../../components/CreateTicketForm'

interface CreateTicketPageProps {
  onCreated?: (ticketId: string) => void
}

/**
 * SRP: page wrapper that supplies the service options to CreateTicketForm.
 * DIP: services loaded via useCatalog (ICatalogClientView); creation via the form's
 * useTicketsList (ITicketClientActions). Must render inside both providers.
 */
export function CreateTicketPage({ onCreated }: CreateTicketPageProps) {
  const { services, isLoading } = useCatalog()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Cargando servicios…</p>
  }

  return (
    <section className="max-w-xl mx-auto">
      <header className="mb-5">
        <h2 className="text-xl font-bold text-foreground">Crear ticket</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Describe tu solicitud de soporte.</p>
      </header>
      <CreateTicketForm
        services={services.map((s) => ({ id: s.id, nombre: s.nombre }))}
        onSuccess={onCreated}
      />
    </section>
  )
}

```

### 📄 frontend/src/modules/tickets/pages/TicketDetailPage/index.tsx
```typescript
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Reveal, FocusReveal } from '../../../../core/ui/motion'
import { TicketDetail } from '../../components/TicketDetail'
import { StatusChangeForm } from '../../components/StatusChangeForm'
import { useAuth } from '../../../auth/hooks/useAuth'
import { ticketService } from '../../services/TicketService'
import { useTicketDetail } from '../../hooks/useTickets'
import type { TicketEstado } from '../../interfaces/ITicketService'

interface TicketDetailPageProps {
  ticketId: string
  onBack?: () => void
}

/**
 * SRP: page wrapper around the TicketDetail component (S17), which already loads
 * the ticket + event timeline via useTicketDetail (DIP). This page only adds
 * page-level chrome (back navigation).
 *
 * H#3 (cliente): Includes StatusChangeForm for workers/admins to change
 * ticket status with mandatory observations for audit trail.
 */
export function TicketDetailPage({ ticketId, onBack }: TicketDetailPageProps) {
  const { user } = useAuth()
  const { ticket } = useTicketDetail(ticketId)
  const [refreshKey, setRefreshKey] = useState(0)
  const isStaff = user?.rol === 'TRABAJADOR' || user?.rol === 'ADMINISTRADOR'

  const handleStatusChange = async (newStatus: TicketEstado, comment: string) => {
    await ticketService.updateStatus(ticketId, newStatus, comment)
    setRefreshKey((k) => k + 1) // Trigger re-render to show new event
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {onBack && (
        <Reveal y={10}>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-brand-cyan-dark transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al historial
          </button>
        </Reveal>
      )}
      <FocusReveal>
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <TicketDetail key={refreshKey} ticketId={ticketId} />
        </div>
      </FocusReveal>

      {/* H#3 (cliente): Status change with observations for staff */}
      {isStaff && ticket && (
        <FocusReveal delay={0.1}>
          <StatusChangeForm
            currentStatus={ticket.estado}
            onSubmit={handleStatusChange}
          />
        </FocusReveal>
      )}
    </section>
  )
}

```

### 📄 frontend/src/modules/tickets/pages/TicketHistoryPage/index.tsx
```typescript
import { useState } from 'react'
import { useTicketsList } from '../../hooks/useTickets'
import { TicketCard } from '../../components/TicketCard'
import { Reveal, FocusReveal } from '../../../../core/ui/motion'
import type { TicketEstado, TicketPrioridad, TicketFilterOptions } from '../../interfaces/ITicketService'

const ESTADOS: TicketEstado[] = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']
const PRIORIDADES: TicketPrioridad[] = ['Baja', 'Media', 'Alta', 'Critica']

interface TicketHistoryPageProps {
  onSelectTicket?: (id: string) => void
}

/**
 * SRP: lists the user's tickets with filters. Reuses TicketCard (S17).
 * DIP: data via useTicketsList (ITicketClientActions through Context).
 * OCP: new filter → add a control + a key in TicketFilterOptions; list logic unchanged.
 */
export function TicketHistoryPage({ onSelectTicket }: TicketHistoryPageProps) {
  const [filters, setFilters] = useState<TicketFilterOptions>({})
  const { tickets, isLoading, error } = useTicketsList(filters)

  const setFilter = (key: keyof TicketFilterOptions, value: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value) next[key] = value as never
      else delete next[key]
      return next
    })
  }

  return (
    <section className="space-y-5">
      <Reveal y={16}>
        <header>
          <h2 className="text-xl font-bold text-foreground">Historial de tickets</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Consulta y filtra tus solicitudes.</p>
        </header>
      </Reveal>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filtrar por estado"
          onChange={(e) => setFilter('estado', e.target.value)}
          className="rounded-lg border border-input bg-input-background text-foreground px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select
          aria-label="Filtrar por prioridad"
          onChange={(e) => setFilter('prioridad', e.target.value)}
          className="rounded-lg border border-input bg-input-background text-foreground px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading && <p className="text-sm text-muted-foreground">Cargando tickets…</p>}
      {error && (
        <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {!isLoading && !error && tickets.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay tickets que coincidan.</p>
      )}
      {!isLoading && !error && tickets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tickets.map((t, i) => (
            <FocusReveal key={t.id} delay={Math.min(i * 0.06, 0.36)}>
              <TicketCard ticket={t} onSelect={onSelectTicket} />
            </FocusReveal>
          ))}
        </div>
      )}
    </section>
  )
}

```

### 📄 frontend/src/modules/tickets/services/TicketAdminService.ts
```typescript
/**
 * TicketAdminService — concrete ITicketAdminActions using ApiClient.
 * SRP: admin ticket HTTP. DIP: admin UI depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { ITicketAdminActions } from '../interfaces/ITicketAdminActions'
import type { TicketSummary, TicketDetail, TicketFilterOptions } from '../interfaces/ITicketService'

class TicketAdminService implements ITicketAdminActions {
  async assignTicket(id: string, workerId: string): Promise<TicketDetail> {
    return apiClient.patch<TicketDetail>(`/tickets/${id}/asignar`, { worker_id: Number(workerId) })
  }

  async reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail> {
    return apiClient.patch<TicketDetail>(`/tickets/${id}/reasignar`, { worker_id: Number(newWorkerId) })
  }

  async getAllTickets(
    filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string },
  ): Promise<TicketSummary[]> {
    const params = new URLSearchParams()
    if (filters?.estado) params.set('estado', filters.estado)
    if (filters?.prioridad) params.set('prioridad', filters.prioridad)
    const qs = params.toString()
    const data = await apiClient.get<{ items: TicketSummary[] }>(`/tickets/${qs ? `?${qs}` : ''}`)
    return data.items
  }
}

export const ticketAdminService = new TicketAdminService()

```

### 📄 frontend/src/modules/tickets/services/TicketService.ts
```typescript
/**
 * TicketService — concrete ITicketClientActions using ApiClient.
 * SRP: ticket HTTP + shape mapping. DIP: useTickets depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import type {
  TicketCreatePayload,
  TicketSummary,
  TicketDetail,
  TicketEvent,
  TicketFilterOptions,
  TicketEstado,
  TicketPrioridad,
  AttachmentMeta,
} from '../interfaces/ITicketService'

interface BeSummary {
  id: number
  numero: string
  asunto: string
  estado: string
  prioridad: string
  servicio_nombre: string
  creado_en: string
}
interface BeEvent {
  id: number
  tipo_evento: string
  estado_anterior: string | null
  estado_nuevo: string | null
  comentario: string
  autor_nombre: string
  creado_en: string
}
interface BeAttachment {
  id: number
  nombre_archivo: string
  url: string
  tamaño_bytes: number
  mime_type: string
}
interface BeDetail extends BeSummary {
  descripcion: string
  cliente_nombre: string
  asignado_nombre: string | null
  adjuntos: BeAttachment[]
  eventos: BeEvent[]
  actualizado_en: string
}

function mapSummary(t: BeSummary): TicketSummary {
  return {
    id: String(t.id),
    numero: t.numero,
    asunto: t.asunto,
    estado: t.estado as TicketEstado,
    prioridad: t.prioridad as TicketPrioridad,
    servicioNombre: t.servicio_nombre,
    creadoEn: t.creado_en,
  }
}
function mapEvent(e: BeEvent): TicketEvent {
  return {
    id: String(e.id),
    tipoEvento: e.tipo_evento,
    estadoAnterior: (e.estado_anterior || null) as TicketEstado | null,
    estadoNuevo: (e.estado_nuevo || null) as TicketEstado | null,
    comentario: e.comentario,
    autorNombre: e.autor_nombre,
    creadoEn: e.creado_en,
  }
}
function mapAttachment(a: BeAttachment): AttachmentMeta {
  return {
    id: String(a.id),
    nombreArchivo: a.nombre_archivo,
    url: a.url,
    tamañoBytes: a.tamaño_bytes,
    mimeType: a.mime_type,
  }
}
function mapDetail(t: BeDetail): TicketDetail {
  return {
    ...mapSummary(t),
    descripcion: t.descripcion,
    clienteNombre: t.cliente_nombre,
    asignadoNombre: t.asignado_nombre,
    adjuntos: (t.adjuntos ?? []).map(mapAttachment),
    eventos: (t.eventos ?? []).map(mapEvent),
    actualizadoEn: t.actualizado_en,
  }
}

class TicketService implements ITicketClientActions {
  /** H#3 (cliente): Cambiar estado de ticket con observación (worker/admin). */
  async updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail> {
    const data = await apiClient.post<BeDetail>(`/tickets/${id}/status`, {
      estado: newStatus,
      comentario: comment,
    })
    return mapDetail(data)
  }

  /** Agregar comentario sin cambiar estado (worker/admin). */
  async addComment(id: string, comment: string): Promise<TicketEvent> {
    const data = await apiClient.post<BeEvent>(`/tickets/${id}/comments`, {
      comentario: comment,
    })
    return mapEvent(data)
  }

  async createTicket(payload: TicketCreatePayload): Promise<TicketDetail> {
    const form = new FormData()
    form.append('asunto', payload.asunto)
    form.append('descripcion', payload.descripcion)
    form.append('servicio_id', payload.servicioId)
    form.append('prioridad', payload.prioridad)
    for (const file of payload.adjuntos ?? []) form.append('adjuntos', file)

    const data = await apiClient.post<BeDetail>('/tickets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapDetail(data)
  }

  async getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]> {
    const params = new URLSearchParams()
    if (filters?.estado) params.set('estado', filters.estado)
    if (filters?.prioridad) params.set('prioridad', filters.prioridad)
    if (filters?.servicioId) params.set('servicio_id', filters.servicioId)
    if (filters?.fechaDesde) params.set('fecha_desde', filters.fechaDesde)
    if (filters?.fechaHasta) params.set('fecha_hasta', filters.fechaHasta)
    const qs = params.toString()
    const data = await apiClient.get<{ items: BeSummary[] }>(`/tickets/${qs ? `?${qs}` : ''}`)
    return data.items.map(mapSummary)
  }

  async getTicketDetail(id: string): Promise<TicketDetail> {
    const data = await apiClient.get<BeDetail>(`/tickets/${id}`)
    return mapDetail(data)
  }
}

export const ticketService = new TicketService()

```

### 📄 frontend/src/modules/tickets/state_machine/TicketStateMachine.ts
```typescript
/**
 * Ticket lifecycle state machine — encapsulates all valid transitions (Strategy pattern).
 *
 * Responsibility (SRP): know which transitions are valid and enforce BR-35 (comment required).
 *     No API calls, no state management, no notification logic — pure domain rules.
 * Depends on: TicketEstado type from ITicketService.ts — nothing else.
 * Pattern: Strategy — TRANSITIONS map is a named policy; the whole object is injectable.
 * SOLID: DIP · OCP · LSP · SRP
 *
 * OCP extension (Sprint 4 — state 'Reabierto'):
 *   TRANSITIONS['Cerrado'] = ['Reabierto']
 *   TRANSITIONS['Reabierto'] = ['EnProceso']
 *   → existing transitions are NEVER modified, only new keys are added.
 *
 * Usage:
 *   const machine = new TicketStateMachine()
 *   if (machine.canTransition('EnProceso', 'Resuelto')) { ... }
 *   const next = machine.transition('EnProceso', 'Resuelto', 'Issue resolved')
 *
 * TicketStatusBadge (S17) reads TRANSITIONS to derive valid next states per role.
 */

import type { TicketEstado } from '../interfaces/ITicketService'

export class TicketStateMachine {
  /**
   * Transition map.
   * Key   = current state
   * Value = array of reachable states (empty array = terminal state)
   */
  static readonly TRANSITIONS: Record<TicketEstado, TicketEstado[]> = {
    Nuevo:     ['EnProceso'],
    EnProceso: ['EnEspera', 'Resuelto'],
    EnEspera:  ['EnProceso'],
    Resuelto:  ['Cerrado'],
    Cerrado:   [],
  }

  /**
   * Return true if fromState → toState exists in TRANSITIONS.
   * Does NOT enforce BR-35 — call transition() for the full check.
   */
  canTransition(fromState: TicketEstado, toState: TicketEstado): boolean {
    return TicketStateMachine.TRANSITIONS[fromState]?.includes(toState) ?? false
  }

  /**
   * Validate and return the new state after a transition.
   *
   * @param fromState - current ticket state
   * @param toState   - desired target state
   * @param comment   - mandatory explanation (BR-35)
   * @returns toState if transition is valid
   * @throws Error('INVALID_TRANSITION') if transition not in TRANSITIONS
   * @throws Error('COMMENT_REQUIRED')   if comment is blank (BR-35)
   */
  transition(
    fromState: TicketEstado,
    toState: TicketEstado,
    comment: string,
  ): TicketEstado {
    if (!this.canTransition(fromState, toState)) {
      throw new Error(
        `INVALID_TRANSITION: '${fromState}' → '${toState}' is not allowed.`,
      )
    }

    if (!comment?.trim()) {
      throw new Error(
        'COMMENT_REQUIRED: A non-empty comment is required for every state transition (BR-35).',
      )
    }

    return toState
  }

  /** Return all states that can be reached from the given state. */
  nextStates(fromState: TicketEstado): TicketEstado[] {
    return TicketStateMachine.TRANSITIONS[fromState] ?? []
  }

  /** Return true if the state has no outgoing transitions (i.e. Cerrado). */
  isTerminal(state: TicketEstado): boolean {
    return TicketStateMachine.TRANSITIONS[state]?.length === 0
  }
}

```

### 📄 frontend/src/modules/tickets/state_machine/index.ts
```typescript
export { TicketStateMachine } from './TicketStateMachine'

```

### 📄 frontend/src/modules/tickets/validators/BasicFieldValidator.ts
```typescript
/**
 * Chain of Responsibility node — validates text fields on the ticket form.
 *
 * Responsibility (SRP): enforce only character-count rules on asunto and descripcion.
 *     No file checks, no API calls — just field length.
 * Depends on: BaseValidator (src/core/base/BaseValidator.ts).
 * Pattern: Chain of Responsibility node.
 * SOLID: SRP · OCP · LSP
 *
 * Rules enforced:
 *   - asunto:      required, max 80 characters
 *   - descripcion: required, min 10 characters
 *
 * OCP: new field rule = new validator node; this class unchanged.
 *
 * Usage (assembled by ValidatorFactory):
 *   const chain = ValidatorFactory.buildTicketChain()
 *   const result = chain.run(formData)
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class BasicFieldValidator extends BaseValidator {
  private static readonly ASUNTO_MAX = 80
  private static readonly DESCRIPCION_MIN = 10

  validate(data: unknown): ValidationResult {
    const { asunto = '', descripcion = '' } = data as { asunto?: string; descripcion?: string }
    if (!asunto.trim())
      return { isValid: false, field: 'asunto', errors: ['El asunto es requerido.'] }
    if (asunto.length > BasicFieldValidator.ASUNTO_MAX)
      return { isValid: false, field: 'asunto', errors: [`El asunto no puede superar ${BasicFieldValidator.ASUNTO_MAX} caracteres.`] }
    if (descripcion.trim().length < BasicFieldValidator.DESCRIPCION_MIN)
      return { isValid: false, field: 'descripcion', errors: [`La descripción debe tener al menos ${BasicFieldValidator.DESCRIPCION_MIN} caracteres.`] }
    return { isValid: true, field: '', errors: [] }
  }
}

```

### 📄 frontend/src/modules/tickets/validators/BusinessRuleValidator.ts
```typescript
/**
 * Chain of Responsibility node — validates client-side business rules.
 *
 * Responsibility (SRP): enforce only UI-level business rules before submitting.
 *     No text field checks, no file checks — only pre-submit domain constraints.
 * Depends on: BaseValidator (src/core/base/BaseValidator.ts).
 * Pattern: Chain of Responsibility node.
 * SOLID: SRP · OCP · LSP
 *
 * Rules enforced (client-side mirror of BE BusinessRuleValidator):
 *   - Submission only within business hours (Mon–Fri 07:00–20:00, local time)
 *     Note: the authoritative check lives in the BE; this is UX-only early feedback.
 *
 * OCP: new client-side rule = new node; this class unchanged.
 *
 * Note: duplicate-ticket check is NOT done here (requires API call) — it lives in BE only.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

/**
 * H#6 (audit fix): Business hours validator is now informational only.
 * Tickets can be created 24/7. If outside business hours, the form shows
 * a non-blocking warning: "Tu ticket será atendido en el próximo horario laboral."
 * This validator always returns isValid: true — the warning is handled by the UI.
 */
export class BusinessRuleValidator extends BaseValidator {
  static isBusinessHours(): boolean {
    const now = new Date()
    const day = now.getDay()   // 0=Sun, 6=Sat
    const hour = now.getHours()
    return day !== 0 && day !== 6 && hour >= 7 && hour < 20
  }

  validate(_data: unknown): ValidationResult {
    // Always valid — business hours are informational, not blocking
    return { isValid: true, field: '', errors: [] }
  }
}

```

### 📄 frontend/src/modules/tickets/validators/FileValidator.ts
```typescript
/**
 * Chain of Responsibility node — validates file attachments on the ticket form.
 *
 * Responsibility (SRP): enforce only file size and MIME type rules.
 *     No text field checks, no API calls — just file constraints.
 * Depends on: BaseValidator (src/core/base/BaseValidator.ts).
 * Pattern: Chain of Responsibility node.
 * SOLID: SRP · OCP · LSP
 *
 * Rules enforced:
 *   - Each file: size ≤ 5 MB (5_242_880 bytes)
 *   - Each file: MIME type in ALLOWED_MIME_TYPES
 *
 * OCP: new MIME type allowed = add to ALLOWED_MIME_TYPES set; no logic change.
 *      New size policy = new node; this class unchanged.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class FileValidator extends BaseValidator {
  private static readonly MAX_SIZE_BYTES = 5_242_880 // 5 MB

  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ])

  validate(data: unknown): ValidationResult {
    const { adjuntos = [] } = data as { adjuntos?: File[] }
    for (const file of adjuntos) {
      if (file.size > FileValidator.MAX_SIZE_BYTES)
        return { isValid: false, field: 'adjuntos', errors: [`"${file.name}" supera el tamaño máximo de 5 MB.`] }
      if (!FileValidator.ALLOWED_MIME_TYPES.has(file.type))
        return { isValid: false, field: 'adjuntos', errors: [`"${file.name}" tiene un formato no permitido.`] }
    }
    return { isValid: true, field: '', errors: [] }
  }
}

```

### 📄 frontend/src/modules/tickets/validators/TicketValidatorChain.ts
```typescript
/**
 * Façade over the ticket creation validator chain built by ValidatorFactory.
 *
 * Responsibility (SRP): expose a single run(data) entry point.
 *     Does not know which nodes exist or in what order — ValidatorFactory decides.
 * Depends on: ValidatorFactory (src/core/factories/ValidatorFactory.ts) — DIP.
 * Pattern: Chain of Responsibility (façade) + Factory (delegates construction).
 * SOLID: SRP · DIP · OCP
 *
 * OCP: adding nodes in Sprint 4 = one line in ValidatorFactory; this class unchanged.
 *
 * Usage in CreateTicketForm:
 *   const chain = new TicketValidatorChain()
 *   const result = chain.run(formData)
 *   if (!result.isValid) showError(result.errors)
 */

import { ValidatorFactory } from '../../../core/factories/ValidatorFactory'
import type { BaseValidator, ValidationResult } from '../../../core/base/BaseValidator'

export class TicketValidatorChain {
  private readonly root: BaseValidator

  constructor() {
    this.root = ValidatorFactory.buildTicketChain()
  }

  run(data: unknown): ValidationResult {
    return this.root.run(data)
  }
}

```

### 📄 frontend/src/test/setup.ts
```typescript
import '@testing-library/jest-dom'

```

### 📄 frontend/vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})

```

### 📄 frontend/vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})

```

---
**Total archivos incluidos:** 0
