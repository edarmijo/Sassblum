import { useState, useRef } from 'react'
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

// Si el servidor (Render plan gratuito) está dormido, puede tardar cerca de 1 min en
// despertar. Tras este umbral le avisamos al usuario para que no piense que
// algo está roto.
const COLD_START_HINT_MS = 8_000

/**
 * SRP: captures credentials and submits via useAuth (DIP — never AuthService directly).
 */
export function LoginForm({ onSuccess }: Readonly<LoginFormProps>) {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSlowStart, setIsSlowStart] = useState(false)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSlowStart(false)

    // Si la respuesta tarda más de COLD_START_HINT_MS mostramos el aviso de
    // cold-start — luego lo limpiamos en el finally, haya o no error.
    slowTimerRef.current = setTimeout(() => setIsSlowStart(true), COLD_START_HINT_MS)

    try {
      await login({ email, password })
      onSuccess?.()
    } catch (err: unknown) {
      setError(apiError(err, 'No se pudo iniciar sesión.'))
    } finally {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current)
        slowTimerRef.current = null
      }
      setIsSlowStart(false)
    }
  }

  let buttonLabel = 'Ingresar'
  if (isLoading) buttonLabel = isSlowStart ? 'Despertando el servidor…' : 'Entrando…'

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

      {isSlowStart && (
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            El servidor está tardando en responder. En el plan gratuito puede demorar cerca de un minuto tras un periodo sin actividad.
          </AlertDescription>
        </Alert>
      )}

      <RippleButton type="submit" variant="brand" size="lg" disabled={isLoading} className="w-full">
        {buttonLabel}
      </RippleButton>
    </form>
  )
}
