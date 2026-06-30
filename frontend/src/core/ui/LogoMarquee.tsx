import { useState } from 'react'

export interface Brand {
  /** Nombre visible de la marca/empresa. */
  name: string
  /** Dominio para resolver el logo (ej. "hikvision.com"). */
  domain: string
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
function BrandLogo({ domain, name }: { domain: string; name: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={`Logo ${name}`}
      loading="lazy"
      onError={() => setOk(false)}
      className="h-8 w-8 shrink-0 object-contain opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
    />
  )
}

function Logos({ brands, ariaHidden }: { brands: Brand[]; ariaHidden?: boolean }) {
  return (
    <ul className="animate-marquee flex items-center gap-6 pr-6" aria-hidden={ariaHidden}>
      {brands.map((b, i) => (
        <li key={`${b.name}-${i}`} className="shrink-0">
          <div className="group flex h-20 w-52 items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-cyan/40 hover:shadow-lg">
            <BrandLogo domain={b.domain} name={b.name} />
            <span className="text-base font-semibold tracking-wide text-gray-500 transition-colors group-hover:text-brand-navy">
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
export function LogoMarquee({ brands, durationSec = 36 }: LogoMarqueeProps) {
  return (
    <div
      className="marquee-track marquee-mask relative w-full overflow-hidden"
      style={{ ['--marquee-duration' as string]: `${durationSec}s` }}
    >
      <div className="flex w-max">
        <Logos brands={brands} />
        {/* Copia para el bucle continuo */}
        <Logos brands={brands} ariaHidden />
      </div>
    </div>
  )
}
