import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SLOW_RESTORE_NOTICE_MS = 4_000

/**
 * Estado local de restauración: conserva el layout y la atmósfera visual sin
 * montar contenido autenticado antes de que exista un Bearer válido.
 */
export function SessionRestoreFallback() {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setIsSlow(true), SLOW_RESTORE_NOTICE_MS)
    return () => globalThis.clearTimeout(timeoutId)
  }, [])

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-md rounded-2xl border border-brand-cyan/20 bg-[#081624]/90 px-6 py-8 text-center shadow-2xl backdrop-blur-md"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          aria-hidden="true"
          className="mx-auto h-9 w-9 rounded-full border-2 border-brand-cyan border-t-transparent motion-safe:animate-spin"
        />
        <h1 className="mt-5 text-lg font-semibold text-[#eef4f8]">Restaurando tu sesión</h1>
        <p className="mt-2 text-sm leading-6 text-[#8fb4c7]">
          {isSlow
            ? 'La conexión está tardando más de lo habitual. Puedes esperar o volver al inicio sin bloquear el resto del sitio.'
            : 'Estamos comprobando tu acceso de forma segura.'}
        </p>
        {isSlow ? (
          <Link
            to="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-cyan/30 px-5 py-2 text-sm font-medium text-brand-cyan transition-colors hover:bg-brand-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          >
            Volver al inicio
          </Link>
        ) : null}
      </div>
    </section>
  )
}
