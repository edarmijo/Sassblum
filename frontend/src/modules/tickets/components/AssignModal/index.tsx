import { useState, useEffect } from 'react'
import { ticketAdminService } from '../../services/TicketAdminService'
import { userAdminService } from '../../../auth/services/UserAdminService'
import type { AdminUser } from '../../../auth/interfaces/IUserAdminActions'
import type { TicketDetail } from '../../interfaces/ITicketService'
import { Button } from '../../../../core/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '../../../../core/ui/dialog'
import { executeAssignment, type AssignmentMode } from './assignmentOperation'

interface AssignModalProps {
  ticketId: string
  mode: AssignmentMode
  onClose: () => void
  onAssigned?: (ticket: TicketDetail) => void
}

/**
 * SRP: lets an admin pick an active worker and assign a ticket.
 * DIP: ITicketAdminActions (assign) + IUserAdminActions (worker list).
 * H#8 (audit): Uses Radix Dialog for automatic focus trap + keyboard handling.
 */
export function AssignModal({ ticketId, mode, onClose, onAssigned }: Readonly<AssignModalProps>) {
  const [workers, setWorkers] = useState<AdminUser[]>([])
  const [workerId, setWorkerId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isReassignment = mode === 'reassign'
  const actionLabel = isReassignment ? 'Reasignar' : 'Asignar'
  const busyActionLabel = isReassignment ? 'Reasignando…' : 'Asignando…'
  const submitLabel = busy ? busyActionLabel : actionLabel

  useEffect(() => {
    void userAdminService.listUsers({ role: 'worker', estado: 'activo' }).then(setWorkers)
  }, [])

  const assign = async () => {
    if (!workerId) return
    setBusy(true)
    setError(null)
    try {
      const updatedTicket = await executeAssignment(
        ticketAdminService,
        mode,
        ticketId,
        workerId,
      )
      onAssigned?.(updatedTicket)
      onClose()
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(d ?? `No se pudo ${actionLabel.toLocaleLowerCase('es-EC')}.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>{isReassignment ? 'Reasignar ticket' : 'Asignar ticket'}</DialogTitle>
        <DialogDescription>
          Selecciona el trabajador activo que se hará cargo de este ticket.
        </DialogDescription>

        <div className="space-y-4 py-2">
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un trabajador…" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.email}</SelectItem>)}
            </SelectContent>
          </Select>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="button" variant="brand" disabled={!workerId || busy} onClick={() => void assign()}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
