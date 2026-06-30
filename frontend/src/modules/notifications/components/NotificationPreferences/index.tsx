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
