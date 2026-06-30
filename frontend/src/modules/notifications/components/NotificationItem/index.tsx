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
