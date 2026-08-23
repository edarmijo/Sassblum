import { useEffect, useState } from 'react'
import { Loader2, UserRoundPen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { apiError } from '../../../../infrastructure/http/apiError'
import type {
  TicketContactUpdate,
  TicketDetail,
} from '../../interfaces/ITicketService'

interface ContactEditFormProps {
  ticket: TicketDetail
  onSubmit: (contact: TicketContactUpdate) => Promise<void>
}

/** Admin-only form. The parent controls RBAC and owns the mutation service. */
export function ContactEditForm({ ticket, onSubmit }: Readonly<ContactEditFormProps>) {
  const [nombre, setNombre] = useState(ticket.clienteNombre)
  const [email, setEmail] = useState(ticket.clienteEmail)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setNombre(ticket.clienteNombre)
    setEmail(ticket.clienteEmail)
  }, [ticket.clienteEmail, ticket.clienteNombre])

  const trimmedName = nombre.trim()
  const trimmedEmail = email.trim()
  const unchanged = (
    trimmedName === ticket.clienteNombre
    && trimmedEmail === ticket.clienteEmail
  )

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedName || !trimmedEmail || unchanged) return
    setBusy(true)
    try {
      await onSubmit({ nombre: trimmedName, email: trimmedEmail })
      toast.success('Contacto del ticket actualizado')
    } catch (error: unknown) {
      toast.error(apiError(error, 'No se pudo actualizar el contacto del ticket.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-brand-cyan/15 bg-[#081624]/95 p-5"
    >
      <div className="flex items-start gap-3">
        <UserRoundPen className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
        <div>
          <h3 className="font-semibold text-[#eef4f8]">Corregir contacto del ticket</h3>
          <p className="mt-1 text-sm text-[#7aa3b8]">
            Este cambio queda en el historial y no modifica el correo de acceso del cliente.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ticket-contact-name">Nombre del contacto</Label>
          <Input
            id="ticket-contact-name"
            required
            maxLength={301}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-contact-email">Correo del contacto</Label>
          <Input
            id="ticket-contact-email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-contact-company">Empresa</Label>
          <Input
            id="ticket-contact-company"
            value={ticket.clienteEmpresa}
            readOnly
            aria-readonly="true"
            className="text-[#9bb4c2]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-contact-ruc">RUC / identificación</Label>
          <Input
            id="ticket-contact-ruc"
            value={ticket.clienteRuc}
            readOnly
            aria-readonly="true"
            className="text-[#9bb4c2]"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="brand"
          disabled={busy || !trimmedName || !trimmedEmail || unchanged}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar corrección
        </Button>
      </div>
    </form>
  )
}
