import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuthService } from '../../hooks/useAuthService'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import { AuthValidatorFactory } from '../../validators/AuthValidatorFactory'

interface ResetPasswordPageProps {
  /** Token from the email link (?token=...). The app router extracts and passes it. */
  token: string
  onSuccess?: () => void
}

/**
 * SRP: collects + validates a new password and submits the reset.
 * DIP: calls IAuthService.resetPassword via useAuthService.
 * Validation: shared PasswordValidator chain + confirmation.
 */
export function ResetPasswordPage({ token, onSuccess }: Readonly<ResetPasswordPageProps>) {
  const auth = useAuthService()
  const { logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [validator] = useState(() => AuthValidatorFactory.buildPasswordChain())

  const validate = (): string | null => {
    const policy = validator.run({ password })
    if (!policy.isValid) return policy.errors[0]
    if (password !== confirm) return 'Las contraseñas no coinciden.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLoading(true)
    try {
      await auth.resetPassword(token, password, confirm)
      await logout()
      setDone(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Contraseña actualizada</h2>
        <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          placeholder="Mínimo 8 caracteres, letra y número"
          aria-describedby="reset-password-policy"
        />
        <p id="reset-password-policy" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con al menos una letra y un número.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setError(null)
          }}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" variant="brand" size="lg" disabled={loading} className="w-full">
        {loading ? 'Guardando…' : 'Restablecer contraseña'}
      </Button>
    </form>
  )
}
