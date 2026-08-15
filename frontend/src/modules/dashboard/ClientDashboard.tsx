import { TicketsPanel } from './TicketsPanel'
import { MessageSquareText } from 'lucide-react'
import { Button } from '../../core/ui/button'
import { SmoothLink } from '../../core/ui/SmoothLink'

export function ClientDashboard() {
  return (
    <>
      <TicketsPanel title="Mis Tickets" subtitle="Gestiona tus solicitudes de servicio" showCreate />
      <aside className="relative z-10 mx-auto -mt-5 mb-14 flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-[#eef4f8]"><MessageSquareText className="size-5 text-brand-cyan" aria-hidden="true" />¿Cómo fue tu experiencia?</p>
          <p className="mt-1 text-sm text-[#7aa3b8]">Comparte una opinión verificada y ayuda a otros clientes.</p>
        </div>
        <Button asChild variant="outline">
          <SmoothLink to="/clientes#compartir-opinion">Escribir testimonio</SmoothLink>
        </Button>
      </aside>
    </>
  )
}
