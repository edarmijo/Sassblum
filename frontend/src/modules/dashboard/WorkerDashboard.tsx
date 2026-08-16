import { TicketsPanel } from './TicketsPanel'
import { PublicTestimonialsSection } from '../testimonials/components/PublicTestimonialsSection'

export function WorkerDashboard() {
  return (
    <>
      <TicketsPanel
        title="Panel de Trabajador"
        subtitle="Gestiona los tickets que tienes asignados"
      />
      <PublicTestimonialsSection />
    </>
  )
}
