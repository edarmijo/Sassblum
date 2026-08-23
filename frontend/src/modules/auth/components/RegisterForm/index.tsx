import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AxiosError } from 'axios'
import { useAuth } from '../../hooks/useAuth'
import { NameValidator } from '../../validators/NameValidator'
import { EmpresaValidator } from '../../validators/EmpresaValidator'
import { RucValidator } from '../../validators/RucValidator'
import { EmailValidator } from '../../validators/EmailValidator'
import { PasswordValidator } from '../../validators/PasswordValidator'
import { apiError } from '../../../../infrastructure/http/apiError'
import { RippleButton } from '../../../../core/ui/RippleButton'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import { SmoothLink as Link } from '../../../../core/ui/SmoothLink'

interface RegisterFormProps {
  /** Recibe el mensaje del backend y el email registrado (para la pantalla de verificación). */
  onSuccess?: (result: { message: string; email: string }) => void
}

/**
 * SRP: captures registration input, runs the FE validator chain, submits via useAuth.
 * Chain of Responsibility: NameValidator → EmpresaValidator → RucValidator → EmailValidator → PasswordValidator before the API call.
 */
export function RegisterForm({ onSuccess }: Readonly<RegisterFormProps>) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', empresa: '', ruc: '', password: '', confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [emailConflict, setEmailConflict] = useState(false)
  const [loading, setLoading] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = (): string | null => {
    const name = new NameValidator()
    const empresa = new EmpresaValidator()
    const ruc = new RucValidator()
    const email = new EmailValidator()
    const password = new PasswordValidator()

    name.addValidator(empresa).addValidator(ruc).addValidator(email).addValidator(password)

    const result = name.run(form)
    if (!result.isValid) return result.errors[0]
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (v) { setError(v); return }
    setError(null)
    setEmailConflict(false)
    setLoading(true)
    try {
      const res = await register(form)
      onSuccess?.({ message: res.message, email: form.email })
    } catch (err: unknown) {
      const is409 = err instanceof AxiosError && err.response?.status === 409
      setEmailConflict(is409)
      setError(
        is409
          ? `Ya existe una cuenta registrada con ${form.email}.`
          : apiError(err, 'No se pudo crear la cuenta.'),
      )
      // Ensure the user sees the error even on small screens
      requestAnimationFrame(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        alertRef.current?.focus()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">
            Nombre <span aria-hidden className="text-destructive">*</span>
          </Label>
          <Input id="nombre" required value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" value={form.apellido} onChange={set('apellido')} placeholder="Tu apellido" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">
          Correo electrónico <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Input id="reg-email" type="email" required value={form.email} onChange={set('email')} placeholder="ejemplo@correo.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-empresa">
          Empresa <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Input id="reg-empresa" required value={form.empresa} onChange={set('empresa')} placeholder="Nombre de tu empresa" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-ruc">
          RUC <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Input
          id="reg-ruc"
          inputMode="numeric"
          maxLength={13}
          required
          value={form.ruc}
          onChange={set('ruc')}
          placeholder="13 dígitos (ej: 0991234567001)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Contraseña</Label>
        <Input id="reg-password" type="password" required value={form.password} onChange={set('password')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
        <Input id="reg-confirm" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
      </div>

      {error && (
        <Alert ref={alertRef} tabIndex={-1} variant="destructive" role="alert" aria-live="assertive">
          <AlertDescription>
            {error}
            {emailConflict && (
              <>
                {' '}Puedes{' '}
                <Link to="/login" className="font-medium underline">iniciar sesión</Link>
                {' '}o{' '}
                <Link to="/forgot-password" className="font-medium underline">recuperar tu contraseña</Link>.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <RippleButton type="submit" variant="brand" size="lg" disabled={loading} className="w-full">
        {loading ? 'Creando…' : 'Crear cuenta'}
      </RippleButton>
    </form>
  )
}
