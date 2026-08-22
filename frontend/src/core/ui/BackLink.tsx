import type { MouseEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useBackTarget } from '../hooks/useBackTarget'
import { SmoothLink } from './SmoothLink'
import { cn } from './utils'

interface BackLinkProps {
  /** Destino semántico de retorno; se usa cuando no hay historial interno. */
  to: string
  /** Texto visible, p. ej. "Volver al panel". */
  label: string
  className?: string
}

/** Un click sin modificadores es navegación; con ellos el navegador manda. */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0
    && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/**
 * Enlace de retorno del sistema de diseño.
 *
 * Es un `<a>` real (no un `<button>`): mantiene el menú contextual, "abrir en
 * pestaña nueva" y la semántica de enlace para lectores de pantalla. El click
 * simple se intercepta para volver por historial cuando eso preserva el estado
 * de la pantalla anterior — ver `useBackTarget`.
 */
export function BackLink({ to, label, className }: Readonly<BackLinkProps>) {
  const back = useBackTarget(to)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || !isPlainClick(event)) return
    event.preventDefault()
    back.go()
  }

  return (
    <SmoothLink
      to={back.to}
      onClick={handleClick}
      className={cn(
        // Altura táctil de 44px en móvil sin alterar la métrica en escritorio.
        'inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm text-[#7aa3b8] no-underline',
        'transition-colors hover:text-[#00c4e0] focus-visible:text-[#00c4e0]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan md:min-h-0',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </SmoothLink>
  )
}
