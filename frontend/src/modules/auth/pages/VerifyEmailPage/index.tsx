import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuthService } from '../../hooks/useAuthService'
import { apiError } from '../../../../infrastructure/http/apiError'
import { Button } from '../../../../core/ui/button'

interface VerifyEmailPageProps {
  token: string
}

/**
 * SRP: confirms an email using the token from the verification link (?token=...).
 * DIP: calls IAuthService.verifyEmail via useAuthService. Runs once on mount.
 */
export function VerifyEmailPage({ token }: VerifyEmailPageProps) {
  const auth = useAuthService()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!token) {
      setStatus('error')
      setMessage('Falta el token de verificación en el enlace.')
      return
    }
    void auth
      .verifyEmail(token)
      .then((res) => { setStatus('ok'); setMessage(res.message) })
      .catch((err) => { setStatus('error'); setMessage(apiError(err, 'No se pudo verificar el correo.')) })
  }, [auth, token])

  return (
    <div className="text-center space-y-4 py-4">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan-dark" />
          <p className="text-sm">Verificando tu correo…</p>
        </div>
      )}

      {status === 'ok' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Correo verificado</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="brand" className="w-full">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No se pudo verificar</h2>
          <p className="text-sm text-destructive">{message}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
        </>
      )}
    </div>
  )
}
