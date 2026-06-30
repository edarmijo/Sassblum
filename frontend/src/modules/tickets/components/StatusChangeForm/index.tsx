import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, MessageSquare } from 'lucide-react'
import { Button } from '../../../../core/ui/button'
import { Label } from '../../../../core/ui/label'
import { Textarea } from '../../../../core/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import type { TicketEstado } from '../../interfaces/ITicketService'

const AVAILABLE_STATES: { value: TicketEstado; label: string }[] = [
  { value: 'EnProceso', label: 'En Proceso' },
  { value: 'EnEspera', label: 'En Espera' },
  { value: 'Resuelto', label: 'Resuelto' },
  { value: 'Cerrado', label: 'Cerrado' },
]

interface StatusChangeFormProps {
  currentStatus: TicketEstado
  onSubmit: (newStatus: TicketEstado, comment: string) => Promise<void>
  onCancel?: () => void
}

/**
 * H#3 (cliente): Formulario para cambiar estado de ticket CON observación obligatoria.
 * La cliente Vicky Pinto requiere que cada cambio de estado tenga una justificación.
 * "Yo le pongo cerrado en el estatus, pero tengo que ponerle un comentario al lado"
 *
 * SRP: only renders form UI, delegates API call to parent via onSubmit.
 */
export function StatusChangeForm({ currentStatus, onSubmit, onCancel }: StatusChangeFormProps) {
  const [newStatus, setNewStatus] = useState<TicketEstado | ''>('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus) {
      toast.error('Selecciona un nuevo estado')
      return
    }
    if (!comment.trim()) {
      toast.error('La observación es obligatoria para auditoría')
      return
    }
    setBusy(true)
    try {
      await onSubmit(newStatus, comment.trim())
      toast.success(`Estado cambiado a ${newStatus}`)
      setNewStatus('')
      setComment('')
    } catch {
      toast.error('No se pudo cambiar el estado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg p-4" style={{ background: 'rgba(8,22,36,0.82)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-4 w-4 text-brand-cyan" />
        <h4 className="text-sm font-semibold text-[#eef4f8]">Cambiar estado del ticket</h4>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-status">Nuevo estado</Label>
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TicketEstado)}>
          <SelectTrigger id="new-status">
            <SelectValue placeholder="Selecciona un estado…" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_STATES.filter((s) => s.value !== currentStatus).map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observation">
          Observación <span className="text-destructive">*</span>
          <span className="text-xs font-normal text-muted-foreground ml-1">(obligatorio para auditoría)</span>
        </Label>
        <Textarea
          id="observation"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ej: Usuario no entendió las directrices, se cerró el caso…"
          className="resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={busy || !newStatus || !comment.trim()} className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Confirmar cambio
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        )}
      </div>
    </form>
  )
}
