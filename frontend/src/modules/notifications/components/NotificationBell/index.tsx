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

  const unreadSuffix = unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-accent text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
        aria-label={`Notificaciones${unreadSuffix}`}
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
