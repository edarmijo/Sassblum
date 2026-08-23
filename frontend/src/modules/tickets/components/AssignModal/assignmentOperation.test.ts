import { describe, expect, it, vi } from 'vitest'
import type { TicketDetail } from '../../interfaces/ITicketService'
import { executeAssignment, getAssignmentMode } from './assignmentOperation'

const ticket = { id: '10' } as TicketDetail

function makeService() {
  return {
    assignTicket: vi.fn().mockResolvedValue(ticket),
    reassignTicket: vi.fn().mockResolvedValue(ticket),
  }
}

describe('executeAssignment', () => {
  it('uses initial assignment whenever the ticket has no worker', () => {
    expect(getAssignmentMode(null)).toBe('assign')
  })

  it('uses reassignment whenever the ticket already has a worker', () => {
    expect(getAssignmentMode('Trabajadora Activa')).toBe('reassign')
  })

  it('uses the initial assignment operation for assign mode', async () => {
    const service = makeService()

    await executeAssignment(service, 'assign', '10', '3')

    expect(service.assignTicket).toHaveBeenCalledWith('10', '3')
    expect(service.reassignTicket).not.toHaveBeenCalled()
  })

  it('uses the reassignment operation for reassign mode', async () => {
    const service = makeService()

    await executeAssignment(service, 'reassign', '10', '7')

    expect(service.reassignTicket).toHaveBeenCalledWith('10', '7')
    expect(service.assignTicket).not.toHaveBeenCalled()
  })
})
