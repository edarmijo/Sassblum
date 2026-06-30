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
