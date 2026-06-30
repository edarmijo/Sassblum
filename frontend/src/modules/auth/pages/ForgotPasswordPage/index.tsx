import { useState } from 'react'
import type { FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { useAuthService } from '../../hooks/useAuthService'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'

/**
 * SRP: collects the email and requests a reset link.
 * DIP: calls IAuthService.forgotPassword via useAuthService — never the concrete class.
 * Security: shows the same generic confirmation regardless of whether the email exists.
 */
export function ForgotPasswordPage() {
  const auth = useAuthService()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await auth.forgotPassword(email)
      setMessage(res.message)
    } catch {
      // Generic message even on error — no enumeration / no leakage
      setMessage('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.')
    } finally {
      setStatus('done')
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan-dark">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Revisa tu correo</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />
      </div>

      <Button type="submit" variant="brand" size="lg" disabled={status === 'loading'} className="w-full">
        {status === 'loading' ? 'Enviando…' : 'Enviar enlace'}
      </Button>
    </form>
  )
}
