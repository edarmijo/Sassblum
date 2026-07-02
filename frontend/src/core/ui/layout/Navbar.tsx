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
              logout().catch(() => {})
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

/* ─── MobileMenu ────────────────────────────────────────────────────── */

function MobileMenu({ mobileOpen, closeMobile, items, isActive, user, logout, navigate }: {
  mobileOpen: boolean;
  closeMobile: () => void;
  items: NavItem[];
  isActive: (to: string) => boolean;
  user: any;
  logout: () => Promise<void>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
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
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontWeight: 400, minWidth: 24 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: isActive(item.to) ? '#00c4e0' : '#fff', transition: `color 200ms ${EASE_OUT}` }}>
                  {item.label}
                </span>
              </Link>
            ))}

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
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontWeight: 400, minWidth: 24 }}>
                  {String(items.length + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
                  NOTIFICACIONES
                </span>
              </Link>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: mobileOpen ? 1 : 0, transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)', transition: `opacity 500ms ${EASE_OUT} 400ms, transform 500ms ${EASE_OUT} 400ms` }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contacto</span>
            <a href="mailto:info@sassblum.com" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.875rem', transition: `color 200ms ${EASE_OUT}` }} onMouseEnter={(e) => { e.currentTarget.style.color = '#00c4e0' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>info@sassblum.com</a>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Ciudad de México, México</span>
            <a href="tel:+525512345678" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.875rem', transition: `color 200ms ${EASE_OUT}` }} onMouseEnter={(e) => { e.currentTarget.style.color = '#00c4e0' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>+52 55 1234 5678</a>

            {user && (
              <button
                onClick={() => { closeMobile(); setTimeout(() => { logout().catch(console.error); navigate('/') }, 300) }}
                style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: `border-color 200ms ${EASE_OUT}, color 200ms ${EASE_OUT}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            )}
          </div>
        </div>
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
      <MobileMenu
        mobileOpen={mobileOpen}
        closeMobile={closeMobile}
        items={items}
        isActive={isActive}
        user={user}
        logout={logout}
        navigate={navigate}
      />

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
