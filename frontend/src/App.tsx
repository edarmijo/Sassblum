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

function AuthCard({ title, subtitle, children, footer }: Readonly<{ title: string; subtitle: string; children: ReactNode; footer?: ReactNode }>) {
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
  const { user } = useAuth()
  if (user) return <Navigate to="/app" replace />
  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de SassBlum"
      footer={<>¿No tienes cuenta? <Link to="/register" className="text-brand-cyan-dark font-medium hover:underline">Regístrate</Link>{' · '}<Link to="/forgot-password" className="text-brand-cyan-dark font-medium hover:underline">Olvidé mi contraseña</Link></>}
    >
      <LoginForm onSuccess={() => navigate('/app', { replace: true })} />
    </AuthCard>
  )
}

function RegisterRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  if (user) return <Navigate to="/app" replace />
  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Regístrate como cliente de SassBlum"
      footer={<>¿Ya tienes cuenta? <Link to="/login" className="text-brand-cyan-dark font-medium hover:underline">Inicia sesión</Link></>}
    >
      <RegisterForm onSuccess={() => navigate('/login', { replace: true })} />
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
