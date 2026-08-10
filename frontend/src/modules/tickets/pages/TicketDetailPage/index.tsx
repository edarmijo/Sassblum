import { useEffect, useState } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { Reveal, FocusReveal } from '../../../../core/ui/motion'
import { Button } from '../../../../core/ui/button'
import { TicketDetail } from '../../components/TicketDetail'
import { StatusChangeForm } from '../../components/StatusChangeForm'
import { AssignModal } from '../../components/AssignModal'
import { getAssignmentMode } from '../../components/AssignModal/assignmentOperation'
import { useAuth } from '../../../auth/hooks/useAuth'
import { ticketService } from '../../services/TicketService'
import { useTicketDetail } from '../../hooks/useTickets'
import type { TicketDetail as TicketDetailData, TicketEstado } from '../../interfaces/ITicketService'
import { TicketStateMachine } from '../../state_machine'

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
  const [currentTicket, setCurrentTicket] = useState<TicketDetailData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAssign, setShowAssign] = useState(false)
  const isStaff = user?.rol === 'TRABAJADOR' || user?.rol === 'ADMINISTRADOR'
  const isAdmin = user?.rol === 'ADMINISTRADOR'
  const stateMachine = new TicketStateMachine()

  useEffect(() => {
    setCurrentTicket(ticket)
  }, [ticket])

  const handleStatusChange = async (newStatus: TicketEstado, comment: string) => {
    const updatedTicket = await ticketService.updateStatus(ticketId, newStatus, comment)
    setCurrentTicket(updatedTicket)
    setRefreshKey((k) => k + 1) // Trigger re-render to show new event
  }

  const canChangeStatus = Boolean(
    isStaff
    && currentTicket
    // Nuevo advances through assignment, which also selects the required worker.
    && currentTicket.estado !== 'Nuevo'
    && stateMachine.nextStates(currentTicket.estado).length > 0,
  )

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

      {/* HU-05/HU-08: asignación y reasignación — solo administradores */}
      {isAdmin && currentTicket && (
        <FocusReveal delay={0.05}>
          <div className="flex justify-end">
            <Button type="button" variant="brand" onClick={() => setShowAssign(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {currentTicket.asignadoNombre ? 'Reasignar técnico' : 'Asignar técnico'}
            </Button>
          </div>
        </FocusReveal>
      )}
      {showAssign && currentTicket && (
        <AssignModal
          ticketId={ticketId}
          mode={getAssignmentMode(currentTicket.estado)}
          onClose={() => setShowAssign(false)}
          onAssigned={(updatedTicket) => {
            setCurrentTicket(updatedTicket)
            setRefreshKey((k) => k + 1)
          }}
        />
      )}

      {/* H#3 (cliente): Status change with observations for staff */}
      {canChangeStatus && currentTicket && (
        <FocusReveal delay={0.1}>
          <StatusChangeForm
            currentStatus={currentTicket.estado}
            onSubmit={handleStatusChange}
          />
        </FocusReveal>
      )}
    </section>
  )
}
