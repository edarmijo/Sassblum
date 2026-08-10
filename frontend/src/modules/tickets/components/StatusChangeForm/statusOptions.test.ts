import { describe, expect, it } from 'vitest'
import type { TicketEstado } from '../../interfaces/ITicketService'
import { getStatusOptions } from './statusOptions'

describe('getStatusOptions', () => {
  const operationalStates: TicketEstado[] = ['EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']

  it.each<[TicketEstado, TicketEstado[]]>([
    ['Nuevo', ['EnProceso']],
    ['EnProceso', operationalStates],
    ['EnEspera', operationalStates],
    ['Resuelto', operationalStates],
    ['Cerrado', operationalStates],
  ])('only exposes valid transitions from %s', (currentStatus, expected) => {
    expect(getStatusOptions(currentStatus).map(({ value }) => value)).toEqual(expected)
  })
})
