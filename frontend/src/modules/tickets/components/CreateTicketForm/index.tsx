import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { User } from 'lucide-react'
import { useCreateTicket } from '../../hooks/useTickets'
import { useAuth } from '../../../auth/hooks/useAuth'
import { hasCompleteIdentification } from '../../../auth/validators/IdentificationValidator'
import { TicketValidatorChain } from '../../validators/TicketValidatorChain'
import type { TicketPrioridad } from '../../interfaces/ITicketService'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Textarea } from '../../../../core/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { Alert, AlertDescription } from '../../../../core/ui/alert'
import { SmoothLink } from '../../../../core/ui/SmoothLink'
import { apiError } from '../../../../infrastructure/http/apiError'

interface ServiceOption {
  id: string
  nombre: string
}

interface CreateTicketFormProps {
  services: ServiceOption[]
  /** Servicio válido elegido previamente desde el catálogo público. */
  initialServiceId?: string
  /** Recibe el id (para navegar) y el número visible del ticket (paridad LN-1: "Se le asignó el ticket #N"). */
  onSuccess?: (ticketId: string, numero: string) => void
}

interface FormErrors {
  asunto?: string
  descripcion?: string
  servicioId?: string
  adjuntos?: string
  horario?: string
  general?: string
}

const PRIORIDADES: TicketPrioridad[] = ['Baja', 'Media', 'Alta', 'Critica']

/**
 * SRP: manages ticket creation form state and submission.
 * DIP: submits via useTicketsList (ITicketClientActions) — never calls TicketService directly.
 * OCP: new field → add to state + JSX; validation chain handles it automatically.
 */
export function CreateTicketForm({ services, initialServiceId, onSuccess }: Readonly<CreateTicketFormProps>) {
  const createTicket = useCreateTicket()
  const { user } = useAuth()
  const validatorChain = useRef(new TicketValidatorChain())

  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [servicioId, setServicioId] = useState(initialServiceId ?? '')
  const [prioridad, setPrioridad] = useState<TicketPrioridad>('Media')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // H#7 (cliente): Autocompletar datos del cliente
  const clientInfo = user ? {
    nombre: `${user.nombre} ${user.apellido}`.trim() || user.email,
    email: user.email,
    ruc: user.ruc ?? '',
  } : null
  const hasCompleteProfile = Boolean(
    user
      && user.empresa.trim()
      && hasCompleteIdentification({
        tipoIdentificacion: user.tipoIdentificacion,
        ruc: user.ruc,
      }),
  )

  const validate = (): boolean => {
    if (!hasCompleteProfile) return false
    const result = validatorChain.current.run({
      asunto,
      descripcion,
      adjuntos: [],
    })

    if (!result.isValid) {
      setErrors({ [result.field]: result.errors[0] })
      return false
    }

    if (!servicioId) {
      setErrors({ servicioId: 'Selecciona un servicio.' })
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const ticket = await createTicket({ asunto, descripcion, servicioId, prioridad, adjuntos: [] })
      onSuccess?.(ticket.id, ticket.numero)
      // Reset form on success
      setAsunto('')
      setDescripcion('')
      setServicioId('')
      setPrioridad('Media')
      setErrors({})
    } catch (err: unknown) {
      setErrors({
        general: apiError(err, 'Error al crear el ticket.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* H#7: Client info auto-filled */}
      {clientInfo && (
        <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-cyan/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-brand-cyan-dark" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{clientInfo.nombre}</p>
            <p className="text-xs text-muted-foreground">{clientInfo.email}{clientInfo.ruc ? ` · RUC: ${clientInfo.ruc}` : ''}</p>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-brand-cyan bg-brand-cyan/10 rounded-full px-2 py-0.5">Autocompletado</span>
        </div>
      )}

      {!hasCompleteProfile && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            Completa tu tipo y número de identificación y tu empresa antes de crear un ticket.{' '}
            <SmoothLink to="/perfil" className="font-semibold underline">
              Ir a mi perfil
            </SmoothLink>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Asunto */}
      <div className="space-y-2">
        <Label htmlFor="asunto">
          Asunto <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Input
          id="asunto"
          type="text"
          maxLength={80}
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          aria-describedby={errors.asunto ? 'asunto-error' : undefined}
          aria-invalid={!!errors.asunto}
          placeholder="Describe brevemente el problema"
        />
        <div className="flex justify-between">
          {errors.asunto && (
            <p id="asunto-error" role="alert" className="text-xs text-destructive">
              {errors.asunto}
            </p>
          )}
          <p className="text-xs text-muted-foreground ml-auto tabular-nums">{asunto.length}/80</p>
        </div>
      </div>

      {/* Servicio */}
      <div className="space-y-2">
        <Label htmlFor="servicio">
          Servicio <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Select value={servicioId} onValueChange={setServicioId}>
          <SelectTrigger
            id="servicio"
            aria-invalid={!!errors.servicioId}
            className="w-full aria-invalid:border-destructive"
          >
            <SelectValue placeholder="Selecciona un servicio…" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.servicioId && (
          <p role="alert" className="text-xs text-destructive">{errors.servicioId}</p>
        )}
      </div>

      {/* Prioridad */}
      <div className="space-y-2">
        <span className="block text-sm font-medium">Prioridad</span>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Prioridad del ticket">
          {PRIORIDADES.map((p) => (
            <label
              key={p}
              className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                prioridad === p
                  ? 'bg-brand-navy text-white border-brand-navy'
                  : 'bg-card text-muted-foreground border-border hover:border-brand-cyan-dark hover:text-foreground'
              }`}
            >
              <input
                type="radio"
                name="prioridad"
                value={p}
                checked={prioridad === p}
                onChange={() => setPrioridad(p)}
                className="sr-only"
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">
          Descripción <span aria-hidden className="text-destructive">*</span>
        </Label>
        <Textarea
          id="descripcion"
          rows={5}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          aria-describedby={errors.descripcion ? 'descripcion-error' : undefined}
          aria-invalid={!!errors.descripcion}
          className="resize-none"
          placeholder="Describe el problema con el mayor detalle posible (mínimo 10 caracteres)"
        />
        {errors.descripcion && (
          <p id="descripcion-error" role="alert" className="text-xs text-destructive">
            {errors.descripcion}
          </p>
        )}
      </div>

      {/* General error */}
      {errors.horario && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertDescription className="text-amber-800">{errors.horario}</AlertDescription>
        </Alert>
      )}
      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button type="submit" variant="brand" size="lg" disabled={isSubmitting || !hasCompleteProfile} className="w-full">
        {isSubmitting ? 'Creando ticket…' : 'Crear ticket'}
      </Button>
    </form>
  )
}
