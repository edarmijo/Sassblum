import { useCatalog } from '../../../catalog/hooks/useCatalog'
import { CreateTicketForm } from '../../components/CreateTicketForm'
import { useSearchParams } from 'react-router-dom'

interface CreateTicketPageProps {
  onCreated?: (ticketId: string, numero: string) => void
}

/**
 * SRP: page wrapper that supplies the service options to CreateTicketForm.
 * DIP: services loaded via useCatalog (ICatalogClientView); creation via the form's
 * useTicketsList (ITicketClientActions). Must render inside both providers.
 */
export function CreateTicketPage({ onCreated }: Readonly<CreateTicketPageProps>) {
  const { services, isLoading } = useCatalog()
  const [params] = useSearchParams()
  const requestedServiceId = params.get('servicio')

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Cargando servicios…</p>
  }

  const initialServiceId = requestedServiceId !== null
    && services.some((service) => service.id === requestedServiceId)
    ? requestedServiceId
    : undefined
  const hasInvalidRequestedService = requestedServiceId !== null && initialServiceId === undefined

  return (
    <section className="max-w-xl mx-auto">
      <header className="mb-5">
        <h2 className="text-xl font-bold text-foreground">Crear ticket</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Describe tu solicitud de soporte.</p>
      </header>
      {hasInvalidRequestedService && (
        <p role="status" className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          El servicio solicitado ya no está disponible. Selecciona otro para continuar.
        </p>
      )}
      <CreateTicketForm
        services={services.map((s) => ({ id: s.id, nombre: s.nombre }))}
        initialServiceId={initialServiceId}
        onSuccess={onCreated}
      />
    </section>
  )
}
