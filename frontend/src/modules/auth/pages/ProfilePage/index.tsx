import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { apiError } from '../../../../infrastructure/http/apiError'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Button } from '../../../../core/ui/button'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import { PageHero } from '../../../../core/ui/layout/PageHero'
import { dashboardRoute } from '../../../../core/utils/dashboardRoute'
import {
  DashboardCard, DashboardCardHeader, DashboardCardTitle,
  DashboardCardDescription, DashboardCardContent,
} from '../../../../core/ui/DashboardCard'

/**
 * ProfilePage — edición del perfil propio (nombre, apellido, RUC, empresa).
 * SRP: solo captura y envía; la mutación vive en useAuth.updateProfile (DIP).
 * El email se muestra pero no se edita (identidad de la cuenta).
 */
export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const back = dashboardRoute(user?.rol)
  const [form, setForm] = useState({
    nombre: user?.nombre ?? '',
    apellido: user?.apellido ?? '',
    ruc: user?.ruc ?? '',
    empresa: user?.empresa ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido no pueden quedar vacíos.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await updateProfile({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        ruc: form.ruc.trim(),
        empresa: form.empresa.trim(),
      })
      toast.success('Perfil actualizado correctamente')
    } catch (err: unknown) {
      setError(apiError(err, 'No se pudo actualizar el perfil.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Tu cuenta"
        title="Mi perfil"
        subtitle="Actualiza tus datos de contacto"
        accent="cyan"
        orbPosition="top-right"
        backTo={back.to}
        backLabel={back.backLabel}
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 -mt-12 pb-16">
        <DashboardCard>
          <DashboardCardHeader>
            <DashboardCardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-cyan" /> Datos personales
            </DashboardCardTitle>
            <DashboardCardDescription>
              Estos datos se autocompletan al crear tus tickets.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perfil-email">Correo electrónico</Label>
                <Input id="perfil-email" value={user.email} disabled aria-readonly />
                <p className="text-xs text-muted-foreground">
                  El correo es la identidad de tu cuenta y no puede modificarse.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="perfil-nombre">Nombre</Label>
                  <Input id="perfil-nombre" required value={form.nombre} onChange={set('nombre')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil-apellido">Apellido</Label>
                  <Input id="perfil-apellido" required value={form.apellido} onChange={set('apellido')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil-empresa">Empresa</Label>
                <Input id="perfil-empresa" value={form.empresa} onChange={set('empresa')} placeholder="Nombre de tu empresa" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil-ruc">RUC</Label>
                <Input id="perfil-ruc" inputMode="numeric" maxLength={13} value={form.ruc} onChange={set('ruc')} placeholder="Ej: 0991234567001" />
              </div>

              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" variant="brand" size="lg" disabled={saving} className="w-full">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </form>
          </DashboardCardContent>
        </DashboardCard>
      </div>
    </div>
  )
}
