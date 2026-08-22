import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Reveal, FocusReveal } from '../../../../core/ui/motion'
import { BackLink } from '../../../../core/ui/BackLink'
import { dashboardRoute } from '../../../../core/utils/dashboardRoute'
import { Button } from '../../../../core/ui/button'
import { TicketDetail } from '../../components/TicketDetail'
import { StatusChangeForm } from '../../components/StatusChangeForm'
import { AssignModal } from '../../components/AssignModal'
import { getAssignmentMode } from '../../components/AssignModal/assignmentOperation'
import { useAuth } from '../../../auth/hooks/useAuth'
import { ticketService } from '../../services/TicketService'
import { useTicketDetail } from '../../hooks/useTickets'
import type { TicketEstado } from '../../interfaces/ITicketService'
import { TicketStateMachine } from '../../state_machine'

interface TicketDetailPageProps {
  ticketId: string
}

/**
 * SRP: page wrapper around the TicketDetail component (S17), which already loads
 * the ticket + event timeline via useTicketDetail (DIP). This page only adds
 * page-level chrome (back navigation).
 *
 * El retorno apunta al panel del rol y, cuando se llegó desde un listado, a la
 * vista exacta de origen (pestaña + filtros) vía el state sembrado por quien
 * navegó. Un ticket abierto desde un correo también tiene salida válida.
 *
 * H#3 (cliente): Includes StatusChangeForm for workers/admins to change
 * ticket status with mandatory observations for audit trail.
 */
export function TicketDetailPage({ ticketId }: Readonly<TicketDetailPageProps>) {
  const { user } = useAuth()
  const { ticket, isLoading, error, replaceTicket } = useTicketDetail(ticketId)
  const [showAssign, setShowAssign] = useState(false)
  const isStaff = user?.rol === 'TRABAJADOR' || user?.rol === 'ADMINISTRADOR'
  const isAdmin = user?.rol === 'ADMINISTRADOR'
  const stateMachine = new TicketStateMachine()
  const back = dashboardRoute(user?.rol)

  const handleStatusChange = async (newStatus: TicketEstado, comment: string) => {
    replaceTicket(await ticketService.updateStatus(ticketId, newStatus, comment))
  }

  const canChangeStatus = Boolean(
    isStaff
    && ticket
    // Nuevo advances through assignment, which also selects the required worker.
    && ticket.estado !== 'Nuevo'
    && stateMachine.nextStates(ticket.estado).length > 0,
  )

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <Reveal y={10}>
        <BackLink to={back.to} label={back.backLabel} />
      </Reveal>
      <FocusReveal>
        <div className="rounded-xl p-6" style={{ background: 'rgba(8,22,36,0.94)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <TicketDetail ticket={ticket} isLoading={isLoading} error={error} />
        </div>
      </FocusReveal>

      {/* HU-05/HU-08: asignación y reasignación — solo administradores */}
      {isAdmin && ticket && (
        <FocusReveal delay={0.05}>
          <div className="flex justify-end">
            <Button type="button" variant="brand" onClick={() => setShowAssign(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {ticket.asignadoNombre ? 'Reasignar técnico' : 'Asignar técnico'}
            </Button>
          </div>
        </FocusReveal>
      )}
      {showAssign && ticket && (
        <AssignModal
          ticketId={ticketId}
          mode={getAssignmentMode(ticket.estado)}
          onClose={() => setShowAssign(false)}
          onAssigned={replaceTicket}
        />
      )}

      {/* H#3 (cliente): Status change with observations for staff */}
      {canChangeStatus && ticket && (
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
