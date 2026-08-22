import { BackLink } from '../BackLink'
import { cn } from '../utils'

interface BackBarProps {
  to: string
  label: string
  className?: string
}

/**
 * Franja de retorno para las pantallas que no usan `PageHero`.
 *
 * El Navbar es `position: fixed` y ocupa los primeros 64px del viewport, así
 * que captura los eventos de puntero de toda esa banda aunque se vea
 * transparente. Cualquier control colocado ahí se dibuja pero NO se puede
 * pulsar. Este contenedor concentra esa separación en un único sitio para que
 * ninguna pantalla vuelva a caer en la zona muerta, y la alinea a la misma
 * altura que el retorno de las pantallas de acceso (`pt-24`).
 */
export function BackBar({ to, label, className }: Readonly<BackBarProps>) {
  return (
    <div className={cn('pt-24 pb-3', className)}>
      <BackLink to={to} label={label} />
    </div>
  )
}
