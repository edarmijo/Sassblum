import { Bell, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOriginState } from '../../hooks/useBackTarget'
import { useAuth } from '../../../modules/auth/hooks/useAuth'
import { useNotifications } from '../../../modules/notifications/hooks/useNotifications'
import { Badge } from '../badge'
import { Button } from '../button'
import { SmoothLink as Link } from '../SmoothLink'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'

/** Auth-only actions, split so the public navigation does not load Radix Menu. */
export function AuthenticatedNavbarActions() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  // Sembrado para que el "volver" de /notificaciones y /perfil regrese a la
  // vista exacta desde la que se abrieron, no al panel genérico del rol.
  const origin = useOriginState()

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/notificaciones"
        state={origin}
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
              <span>{user.nombre} {user.apellido}</span>
              <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {user.rol.toLowerCase()}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <DropdownMenuItem
            onClick={() => navigate('/perfil', { state: origin })}
            className="text-white/70 focus:text-white focus:bg-white/6"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Mi perfil</span>
          </DropdownMenuItem>
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
