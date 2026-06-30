import { useCatalog } from '../../hooks/useCatalog'
import { ServiceCard } from '../ServiceCard'
import { ServiceFilter } from '../ServiceFilter'

interface CatalogPageProps {
  onSelectService?: (id: string) => void
}

/**
 * SRP: grid of active services + filters. DIP: data via useCatalog (ICatalogClientView).
 */
export function CatalogPage({ onSelectService }: CatalogPageProps) {
  const { services, isLoading, error, setFilters } = useCatalog()

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Catálogo de servicios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Elige un servicio para crear un ticket.</p>
      </header>

      <ServiceFilter onChange={setFilters} />

      {isLoading && <p className="text-sm text-gray-400">Cargando servicios…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {!isLoading && !error && services.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">No hay servicios disponibles.</p>
      )}
      {!isLoading && !error && services.length > 0 && (
        /* H#1 (cliente): Grid compacto 6-9 artículos por pantalla */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} onSelect={onSelectService} />
          ))}
        </div>
      )}
    </section>
  )
}
