import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AxiosError } from 'axios'
import { useAuth } from '../../hooks/useAuth'
import type { IdentificationType } from '../../interfaces/IAuthService'
import type { IFormValidator } from '../../interfaces/IFormValidator'
import { AuthValidatorFactory } from '../../validators/AuthValidatorFactory'
import { IdentificationFields } from '../IdentificationFields'
import { apiError } from '../../../../infrastructure/http/apiError'
import { RippleButton } from '../../../../core/ui/RippleButton'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import { SmoothLink as Link } from '../../../../core/ui/SmoothLink'

interface RegisterFormProps {
  /** Recibe el mensaje del backend y el email registrado (para la pantalla de verificación). */
  onSuccess?: (result: { message: string; email: string }) => void
  validator?: IFormValidator
}

/**
 * SRP: captures registration input, runs the FE validator chain, submits via useAuth.
 * Chain of Responsibility: company → identification → email → password.
 */
export function RegisterForm({ onSuccess, validator }: Readonly<RegisterFormProps>) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', empresa: '', ruc: '',
    tipoIdentificacion: 'RUC' as IdentificationType, password: '', confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [emailConflict, setEmailConflict] = useState(false)
  const [loading, setLoading] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)
  const [validatorChain] = useState(
    () => validator ?? AuthValidatorFactory.buildRegistrationChain(),
  )
  const identificationError = error && (
    error.includes('identificación') || error.includes('RUC') || error.includes('cédula')
  ) ? error : null

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = (): string | null => {
    const result = validatorChain.run(form)
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
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" required value={form.nombre} onChange={set('nombre')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" required value={form.apellido} onChange={set('apellido')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">Correo electrónico</Label>
        <Input id="reg-email" type="email" required value={form.email} onChange={set('email')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-empresa">Empresa</Label>
        <Input id="reg-empresa" required value={form.empresa} onChange={set('empresa')} placeholder="Nombre de tu empresa" />
      </div>

      <IdentificationFields
        idPrefix="reg"
        type={form.tipoIdentificacion}
        value={form.ruc}
        error={identificationError}
        onTypeChange={(tipoIdentificacion) => {
          setForm((current) => ({ ...current, tipoIdentificacion }))
          setError(null)
        }}
        onValueChange={(ruc) => {
          setForm((current) => ({ ...current, ruc }))
          setError(null)
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="reg-password">Contraseña</Label>
        <Input id="reg-password" type="password" required value={form.password} onChange={set('password')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
        <Input id="reg-confirm" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
      </div>

      {error && !identificationError && (
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
