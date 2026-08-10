import type { TicketEstado } from '../../interfaces/ITicketService'
import { TicketStateMachine } from '../../state_machine'

export interface StatusOption {
  value: TicketEstado
  label: string
}

const STATUS_LABELS: Record<TicketEstado, string> = {
  Nuevo: 'Nuevo',
  EnProceso: 'En Proceso',
  EnEspera: 'En Espera',
  Resuelto: 'Resuelto',
  Cerrado: 'Cerrado',
}

const stateMachine = new TicketStateMachine()

/** Build the selector options from the same transition policy used by the domain. */
export function getStatusOptions(currentStatus: TicketEstado): StatusOption[] {
  return stateMachine.nextStates(currentStatus).map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }))
}
