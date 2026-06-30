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
