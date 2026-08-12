import { useState } from 'react'
import { ImageWithFallback } from './ImageWithFallback'

export interface Brand {
  /** Nombre visible de la marca/empresa. */
  name: string
  /** URL publicada y autorizada del logotipo. Tiene prioridad sobre domain. */
  logoUrl?: string
  /** Dominio para resolver un favicon cuando no se ha cargado un logo propio. */
  domain?: string
}

interface LogoMarqueeProps {
  brands: Brand[]
  /** Duración de un ciclo completo en segundos (mayor = más lento). */
  durationSec?: number
}

/**
 * Marca de imagen del logo vía el servicio de favicons de Google (fiable y con
 * CORS para <img>). Si falla, se oculta y queda el wordmark de texto — el chip
 * nunca se ve roto.
 */
function BrandLogo({ domain, logoUrl, name }: Readonly<{ domain?: string; logoUrl?: string; name: string }>) {
  const [ok, setOk] = useState(true)
  const source = logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '')
  if (!ok || !source) {
    return <span className="text-center text-sm font-semibold tracking-wide text-slate-200">{name}</span>
  }
  return (
    <ImageWithFallback
      src={source}
      sizes={logoUrl ? '160px' : '36px'}
      alt={`Logo ${name}`}
      onError={() => setOk(false)}
      className={logoUrl
        ? 'h-14 max-w-40 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105'
        : 'h-9 w-9 shrink-0 object-contain opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0'}
    />
  )
}

function Logos({ brands, ariaHidden }: Readonly<{ brands: Brand[]; ariaHidden?: boolean }>) {
  return (
    <ul className="flex items-center gap-6 pr-6" aria-hidden={ariaHidden}>
      {brands.map((b, i) => (
        <li key={`${b.name}-${i}`} className="shrink-0">
          <div className="group flex h-28 w-56 flex-col items-center justify-center gap-2 rounded-2xl border border-cyan-300/15 bg-[#0b2134] px-6 shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-cyan/60 hover:shadow-[0_16px_36px_rgba(0,196,224,0.14)]">
            <BrandLogo domain={b.domain} logoUrl={b.logoUrl} name={b.name} />
            <span className="max-w-full truncate text-center text-[11px] font-medium tracking-[0.08em] text-slate-400 transition-colors group-hover:text-cyan-100">
              {b.name}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Carrusel infinito de logos en bucle continuo (auto-scroll), estilo "muro de
 * marcas". Duplica la lista para un loop sin costuras; se pausa al pasar el cursor.
 * Respeta prefers-reduced-motion vía la regla global de index.css.
 */
export function LogoMarquee({ brands, durationSec = 36 }: Readonly<LogoMarqueeProps>) {
  return (
    <div
      className="marquee-track marquee-mask relative w-full overflow-hidden"
      style={{ ['--marquee-duration' as string]: `${durationSec}s` }}
    >
      <div className="animate-marquee flex w-max">
        <Logos brands={brands} />
        {/* Copia para el bucle continuo */}
        <Logos brands={brands} ariaHidden />
      </div>
    </div>
  )
}
