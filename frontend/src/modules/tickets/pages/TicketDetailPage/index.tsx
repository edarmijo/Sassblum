import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Reveal, FocusReveal } from '../../../../core/ui/motion'
import { TicketDetail } from '../../components/TicketDetail'
import { StatusChangeForm } from '../../components/StatusChangeForm'
import { useAuth } from '../../../auth/hooks/useAuth'
import { ticketService } from '../../services/TicketService'
import { useTicketDetail } from '../../hooks/useTickets'
import type { TicketEstado } from '../../interfaces/ITicketService'

interface TicketDetailPageProps {
  ticketId: string
  onBack?: () => void
}

/**
 * SRP: page wrapper around the TicketDetail component (S17), which already loads
 * the ticket + event timeline via useTicketDetail (DIP). This page only adds
 * page-level chrome (back navigation).
 *
 * H#3 (cliente): Includes StatusChangeForm for workers/admins to change
 * ticket status with mandatory observations for audit trail.
 */
export function TicketDetailPage({ ticketId, onBack }: Readonly<TicketDetailPageProps>) {
  const { user } = useAuth()
  const { ticket } = useTicketDetail(ticketId)
  const [refreshKey, setRefreshKey] = useState(0)
  const isStaff = user?.rol === 'TRABAJADOR' || user?.rol === 'ADMINISTRADOR'

  const handleStatusChange = async (newStatus: TicketEstado, comment: string) => {
    await ticketService.updateStatus(ticketId, newStatus, comment)
    setRefreshKey((k) => k + 1) // Trigger re-render to show new event
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {onBack && (
        <Reveal y={10}>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[#5c7a94] hover:text-[#00c4e0] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al historial
          </button>
        </Reveal>
      )}
      <FocusReveal>
        <div className="rounded-xl p-6" style={{ background: 'rgba(8,22,36,0.82)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <TicketDetail key={refreshKey} ticketId={ticketId} />
        </div>
      </FocusReveal>

      {/* H#3 (cliente): Status change with observations for staff */}
      {isStaff && ticket && (
        <FocusReveal delay={0.1}>
          <StatusChangeForm
            currentStatus={ticket.estado}
            onSubmit={handleStatusChange}
          />
        </FocusReveal>
      )}
    </section>
  )
}
