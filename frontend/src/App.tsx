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

import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate, useNavigationType, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense, useState, type ReactNode } from 'react'
import { DeferredVisualEffects } from './core/ui/DeferredVisualEffects'
import { PageLoader } from './core/ui/PageLoader'
import { PageTransition } from './core/ui/PageTransition'
import { SmoothLink as Link } from './core/ui/SmoothLink'
import { BackLink } from './core/ui/BackLink'
import { dashboardRoute } from './core/utils/dashboardRoute'
import { RouteMetadata } from './core/seo/RouteMetadata'

// Concrete services (injected here only)
import { authService } from './modules/auth/services/AuthService'
import { catalogService } from './modules/catalog/services/CatalogService'
import { ticketService } from './modules/tickets/services/TicketService'
import { notificationService } from './modules/notifications/services/NotificationService'
import { testimonialService } from './modules/testimonials/services/TestimonialService'

// Providers (DIP seams)
import { AuthProvider } from './modules/auth/hooks/AuthProvider'
import { useAuth } from './modules/auth/hooks/useAuth'
import { AuthServiceProvider } from './modules/auth/hooks/AuthServiceProvider'
import { CatalogProvider } from './modules/catalog/hooks/CatalogProvider'
import { TicketClientProvider } from './modules/tickets/hooks/TicketClientProvider'
import { NotificationProvider } from './modules/notifications/hooks/NotificationProvider'
import { TestimonialProvider } from './modules/testimonials/hooks/TestimonialProvider'

// Layout
import { Navbar } from './core/ui/layout/Navbar'
import { Footer } from './core/ui/layout/Footer'
import { Toaster } from './core/ui/sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './core/ui/card'

// Auth (eager: pequeños y compartidos por los wrappers de AuthCard)
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute'
import { PublicRoute } from './modules/auth/components/PublicRoute'
import { LoginForm } from './modules/auth/components/LoginForm'
import { RegisterForm } from './modules/auth/components/RegisterForm'

/**
 * lazyRetry — import dinámico resiliente a deploys.
 * Tras un deploy, los chunks viejos dejan de existir (hash nuevo); si un usuario
 * con el index anterior navega a una ruta lazy, el import falla y la página queda
 * en negro. Este wrapper recarga la página UNA vez para obtener el index nuevo.
 */
function lazyRetry<T>(factory: () => Promise<T>): () => Promise<T> {
  return () =>
    factory().catch((err: unknown) => {
      const KEY = 'sassblum:chunk-reloaded'
      if (sessionStorage.getItem(KEY) !== '1') {
        sessionStorage.setItem(KEY, '1')
        window.location.reload()
        return new Promise<T>(() => {}) // la recarga interrumpe; promesa pendiente
      }
      throw err // segunda falla real → dejar que ErrorBoundary la muestre
    })
}

// Páginas cargadas bajo demanda (code-splitting → chunk por ruta)
const Home = lazy(lazyRetry(() => import('./modules/public/pages/Home').then(m => ({ default: m.Home }))))
const About = lazy(lazyRetry(() => import('./modules/public/pages/About').then(m => ({ default: m.About }))))
const Services = lazy(lazyRetry(() => import('./modules/public/pages/Services').then(m => ({ default: m.Services }))))
const Gallery = lazy(lazyRetry(() => import('./modules/public/pages/Gallery').then(m => ({ default: m.Gallery }))))
const Clients = lazy(lazyRetry(() => import('./modules/public/pages/Clients').then(m => ({ default: m.Clients }))))

const ForgotPasswordPage = lazy(lazyRetry(() => import('./modules/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage }))))
const ResetPasswordPage = lazy(lazyRetry(() => import('./modules/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))))
const VerifyEmailPage = lazy(lazyRetry(() => import('./modules/auth/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage }))))
const VerifyPendingPage = lazy(lazyRetry(() => import('./modules/auth/pages/VerifyPendingPage').then(m => ({ default: m.VerifyPendingPage }))))

const ClientDashboard = lazy(lazyRetry(() => import('./modules/dashboard/ClientDashboard').then(m => ({ default: m.ClientDashboard }))))
const WorkerDashboard = lazy(lazyRetry(() => import('./modules/dashboard/WorkerDashboard').then(m => ({ default: m.WorkerDashboard }))))
const AdminDashboard = lazy(lazyRetry(() => import('./modules/dashboard/AdminDashboard').then(m => ({ default: m.AdminDashboard }))))
const TicketDetailPage = lazy(lazyRetry(() => import('./modules/tickets/pages/TicketDetailPage').then(m => ({ default: m.TicketDetailPage }))))
const NotificationsPage = lazy(lazyRetry(() => import('./modules/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage }))))
const ProfilePage = lazy(lazyRetry(() => import('./modules/auth/pages/ProfilePage').then(m => ({ default: m.ProfilePage }))))

// ── Shared layout ─────────────────────────────────────────────────────────────

/**
 * Al navegar hacia adelante, vuelve al tope de la página (evita quedar abajo).
 *
 * En POP (atrás/adelante) NO se toca el scroll: el navegador restaura la
 * posición previa y forzar el tope destruiría esa restauración, que es
 * justamente lo que hace útil el retorno desde una pantalla hoja.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, navigationType])
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
  const { pathname } = useLocation()

  const tree = (
    <>
      <div className="min-h-screen flex flex-col text-[#eeeef5]">
        <Navbar />
        <main className="grow relative z-10">
          <Suspense fallback={<PageFallback />}>
            <PageTransition pathname={pathname}>
              <Outlet />
            </PageTransition>
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

function AuthCard({ title, subtitle, children, footer, backTo, backLabel }: Readonly<{ title: string; subtitle: string; children: ReactNode; footer?: ReactNode; backTo?: string; backLabel?: string }>) {
  return (
    <AuthServiceProvider service={authService}>
      <div className="relative min-h-[calc(100dvh-4rem)] flex items-start justify-center overflow-hidden px-4 pb-12 pt-24 sm:items-center">
        {/* teal radial glow behind the card */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-3xl" style={{ background: 'rgba(0,196,224,0.08)' }} />
        <div className="relative w-full max-w-md">
          {backTo && backLabel && (
            <div className="mb-4">
              <BackLink to={backTo} label={backLabel} />
            </div>
          )}
          <div className="mb-6 flex justify-center">
            <Link to="/" className="inline-flex items-center rounded-full px-5 py-1.5" style={{ border: '1px solid rgba(0,196,224,0.3)', background: 'rgba(0,196,224,0.06)' }}>
              <span className="tracking-wider font-semibold" style={{ color: '#00c4e0' }}>SASS BLUM</span>
            </Link>
          </div>
          <Card className="w-full" style={{ background: 'rgba(8,22,36,0.94)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold" style={{ color: '#eef4f8' }}>{title}</CardTitle>
              <CardDescription style={{ color: '#7aa3b8' }}>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {children}
              {footer && <div className="mt-6 pt-6 text-center text-sm" style={{ borderTop: '1px solid rgba(0,196,224,0.1)', color: '#7aa3b8' }}>{footer}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthServiceProvider>
  )
}

// ── Auth routes ───────────────────────────────────────────────────────────────

/**
 * Sanitiza el parámetro ?next= — solo rutas internas (previene open redirect).
 */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/app'
}

function LoginRoute() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  return (
    <PublicRoute redirectTo={next}>
      <AuthCard
        title="Iniciar sesión"
        subtitle="Accede a tu cuenta de SassBlum"
        backTo="/"
        backLabel="Volver al inicio"
        footer={<>¿No tienes cuenta? <Link to="/register" className="text-brand-cyan-dark font-medium hover:underline">Regístrate</Link>{' · '}<Link to="/forgot-password" state={{ from: '/login' }} className="text-brand-cyan-dark font-medium hover:underline">Olvidé mi contraseña</Link></>}
      >
        <LoginForm onSuccess={() => navigate(next, { replace: true })} />
      </AuthCard>
    </PublicRoute>
  )
}

function RegisterRoute() {
  const navigate = useNavigate()
  return (
    <PublicRoute>
      <AuthCard
        title="Crear cuenta"
        subtitle="Regístrate como cliente de SassBlum"
        backTo="/"
        backLabel="Volver al inicio"
        footer={<>¿Ya tienes cuenta? <Link to="/login" className="text-brand-cyan-dark font-medium hover:underline">Inicia sesión</Link></>}
      >
        <RegisterForm
          onSuccess={({ message, email }) =>
            // El email viaja por router state (no por query string: sin datos
            // personales en la URL). Si el usuario recarga, la pantalla degrada
            // al texto genérico.
            navigate('/verificar-cuenta', { replace: true, state: { email, message } })
          }
        />
      </AuthCard>
    </PublicRoute>
  )
}

/** Pantalla post-registro: pide confirmar el correo antes de iniciar sesión. */
function VerifyPendingRoute() {
  const { state } = useLocation() as { state: { email?: string; message?: string } | null }
  return (
    <AuthCard title="Cuenta creada" subtitle="Falta un paso para activarla">
      <VerifyPendingPage email={state?.email} message={state?.message} />
    </AuthCard>
  )
}

function ForgotRoute() {
  return (
    <PublicRoute>
      <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo" backTo="/login" backLabel="Volver a iniciar sesión"><ForgotPasswordPage /></AuthCard>
    </PublicRoute>
  )
}

/**
 * NO lleva PublicRoute a propósito: el token del correo es intención explícita.
 * Un usuario con sesión viva que abre su enlace de reset debe poder completarlo
 * (el backend invalida sus sesiones al terminar), no ser redirigido a /app.
 */
function ResetRoute() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  return (
    <AuthCard title="Nueva contraseña" subtitle="Define una contraseña nueva para tu cuenta" backTo="/login" backLabel="Volver a iniciar sesión">
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
  return <Navigate to={dashboardRoute(user.rol).to} replace />
}

function DetailRoute() {
  const { id } = useParams()
  return <TicketDetailPage ticketId={id ?? ''} />
}

// ── Root ──────────────────────────────────────────────────────────────────────

const INTRO_KEY = 'sassblum:intro-shown'

function shouldShowIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) !== '1'
  } catch {
    return true
  }
}

function rememberIntro(): void {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // The intro still completes when storage is unavailable.
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(shouldShowIntro)

  const finishIntro = () => {
    rememberIntro()
    setShowIntro(false)
  }

  return (
    <>
      {showIntro ? <PageLoader onComplete={finishIntro} /> : null}
      <BrowserRouter>
      <RouteMetadata />
      {/* One persistent visual layer for public, auth and every authenticated role. */}
      <DeferredVisualEffects />
      <ScrollToTop />
      <AuthProvider service={authService}>
        <CatalogProvider service={catalogService}>
          <TestimonialProvider service={testimonialService}>
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
              <Route path="/verificar-cuenta" element={<VerifyPendingRoute />} />
              <Route path="/verify-email" element={<VerifyRoute />} />

              {/* Authenticated app */}
              <Route path="/app" element={<ProtectedRoute><AppRedirect /></ProtectedRoute>} />
              <Route path="/mis-tickets" element={<ProtectedRoute roles={['CLIENTE']}><ClientDashboard /></ProtectedRoute>} />
              <Route path="/panel" element={<ProtectedRoute roles={['TRABAJADOR']}><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['ADMINISTRADOR']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/tickets/:id" element={<ProtectedRoute><DetailRoute /></ProtectedRoute>} />
              <Route path="/notificaciones" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          </TestimonialProvider>
        </CatalogProvider>
      </AuthProvider>
      </BrowserRouter>
    </>
  )
}
