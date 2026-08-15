import { MailCheck, Clock, Inbox } from 'lucide-react'
import { Button } from '../../../../core/ui/button'
import { SmoothLink as Link } from '../../../../core/ui/SmoothLink'

interface VerifyPendingPageProps {
  /** Correo al que se envió el enlace. Vacío si la página se abrió directamente. */
  email?: string
  /** Mensaje devuelto por el backend en el registro. */
  message?: string
}

/**
 * SRP: pantalla informativa post-registro. No llama a ningún servicio.
 * Se muestra tras crear la cuenta para que el usuario sepa que debe confirmar
 * su correo antes de poder iniciar sesión (el backend crea la cuenta sin verificar
 * y envía el enlace de verificación a /verify-email?token=...).
 *
 * El email llega por router state (nunca por query string: no se exponen datos
 * personales en la URL); si falta (recarga o acceso directo) se muestra el texto
 * genérico sin la dirección.
 */
export function VerifyPendingPage({ email, message }: Readonly<VerifyPendingPageProps>) {
  return (
    <div className="space-y-5 py-2 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan-dark">
        <MailCheck className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold" style={{ color: '#eef4f8' }}>
          Confirma tu correo
        </h2>
        <p className="text-sm" style={{ color: '#8ea9bf' }}>
          {email ? (
            <>
              Enviamos un enlace de verificación a{' '}
              <span className="font-medium" style={{ color: '#eef4f8' }}>{email}</span>. Ábrelo para
              activar tu cuenta y poder iniciar sesión.
            </>
          ) : (
            <>
              Enviamos un enlace de verificación a tu correo. Ábrelo para activar tu cuenta y poder
              iniciar sesión.
            </>
          )}
        </p>
        {message && (
          <p className="break-all text-xs" style={{ color: '#7aa3b8' }}>{message}</p>
        )}
      </div>

      <ul className="space-y-2 rounded-lg px-4 py-3 text-left text-xs" style={{ background: 'rgba(0,196,224,0.05)', border: '1px solid rgba(0,196,224,0.12)', color: '#8ea9bf' }}>
        <li className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan-dark" />
          <span>El enlace caduca en 24 horas.</span>
        </li>
        <li className="flex items-start gap-2">
          <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan-dark" />
          <span>Si no lo ves, revisa la carpeta de spam o correo no deseado.</span>
        </li>
      </ul>

      <div className="space-y-2">
        <Button asChild variant="brand" className="w-full">
          <Link to="/login">Ir a iniciar sesión</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
