import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '../../../../core/ui/alert'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { apiError } from '../../../../infrastructure/http/apiError'
import { useAuth } from '../../hooks/useAuth'
import { AuthValidatorFactory } from '../../validators/AuthValidatorFactory'

type PasswordField = 'current' | 'new' | 'confirm'

interface FormError {
  message: string
  field?: PasswordField
}

function inferServiceErrorField(message: string): PasswordField | undefined {
  const normalized = message.toLocaleLowerCase('es')
  if (normalized.includes('diferente de la actual')) return 'new'
  if (normalized.includes('contraseña actual')) return 'current'
  if (normalized.includes('no coinciden')) return 'confirm'
  if (normalized.includes('al menos') || normalized.includes('letra y un número')) return 'new'
  return undefined
}

/** Formulario aislado de B11; la mutación y el cierre de sesión viven en useAuth. */
export function ChangePasswordForm() {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<FormError | null>(null)
  const [saving, setSaving] = useState(false)
  const [validator] = useState(() => AuthValidatorFactory.buildPasswordChain())

  const update = (setter: (value: string) => void) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setter(event.target.value)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!currentPassword) {
      setError({ message: 'Ingresa tu contraseña actual.', field: 'current' })
      return
    }
    const policy = validator.run({ password: newPassword })
    if (!policy.isValid) {
      setError({ message: policy.errors[0], field: 'new' })
      return
    }
    if (newPassword === currentPassword) {
      setError({
        message: 'La nueva contraseña debe ser diferente de la actual.',
        field: 'new',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setError({ message: 'Las contraseñas no coinciden.', field: 'confirm' })
      return
    }

    setError(null)
    setSaving(true)
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      toast.success(result.message)
    } catch (err: unknown) {
      const message = apiError(err, 'No se pudo cambiar la contraseña.')
      setError({ message, field: inferServiceErrorField(message) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={update(setCurrentPassword)}
          aria-invalid={error?.field === 'current' || undefined}
          aria-describedby={error?.field === 'current' ? 'current-password-error' : undefined}
        />
        {error?.field === 'current' && (
          <p id="current-password-error" role="alert" className="text-sm text-destructive break-words">
            {error.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-new-password">Nueva contraseña</Label>
        <Input
          id="profile-new-password"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={update(setNewPassword)}
          aria-describedby={error?.field === 'new'
            ? 'password-policy profile-new-password-error'
            : 'password-policy'}
          aria-invalid={error?.field === 'new' || undefined}
        />
        <p id="password-policy" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con al menos una letra y un número.
        </p>
        {error?.field === 'new' && (
          <p id="profile-new-password-error" role="alert" className="text-sm text-destructive break-words">
            {error.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-confirm-password">Confirmar nueva contraseña</Label>
        <Input
          id="profile-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={update(setConfirmPassword)}
          aria-invalid={error?.field === 'confirm' || undefined}
          aria-describedby={error?.field === 'confirm'
            ? 'profile-confirm-password-error'
            : undefined}
        />
        {error?.field === 'confirm' && (
          <p id="profile-confirm-password-error" role="alert" className="text-sm text-destructive break-words">
            {error.message}
          </p>
        )}
      </div>

      {error && !error.field && (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertDescription className="break-words">{error.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" variant="brand" size="lg" disabled={saving} className="w-full">
        {saving ? 'Actualizando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  )
}
