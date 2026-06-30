import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiError } from '../../../../infrastructure/http/apiError'
import { RippleButton } from '../../../../core/ui/RippleButton'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'

interface LoginFormProps {
  readonly onSuccess?: () => void
}

/**
 * SRP: captures credentials and submits via useAuth (DIP — never AuthService directly).
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password })
      onSuccess?.()
    } catch (err: unknown) {
      setError(apiError(err, 'No se pudo iniciar sesión.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" required placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <RippleButton type="submit" variant="brand" size="lg" disabled={isLoading} className="w-full">
        {isLoading ? 'Entrando…' : 'Ingresar'}
      </RippleButton>
    </form>
  )
}
