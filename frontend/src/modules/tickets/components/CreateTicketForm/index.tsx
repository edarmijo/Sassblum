import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { User } from 'lucide-react'
import { useTicketsList } from '../../hooks/useTickets'
import { useAuth } from '../../../auth/hooks/useAuth'
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

interface ServiceOption {
  id: string
  nombre: string
}

interface CreateTicketFormProps {
  services: ServiceOption[]
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
export function CreateTicketForm({ services, onSuccess }: Readonly<CreateTicketFormProps>) {
  const { createTicket, isLoading } = useTicketsList()
  const { user } = useAuth()
  const validatorChain = useRef(new TicketValidatorChain())

  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [servicioId, setServicioId] = useState('')
  const [prioridad, setPrioridad] = useState<TicketPrioridad>('Media')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // H#7 (cliente): Autocompletar datos del cliente
  const clientInfo = user ? {
    nombre: `${user.nombre} ${user.apellido}`.trim() || user.email,
    email: user.email,
    ruc: user.ruc ?? '',
  } : null

  const validate = (): boolean => {
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
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Error al crear el ticket.',
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

      {/* H#8 (cliente): imágenes por WhatsApp (sin subida de archivos al sistema) */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm font-medium text-green-800 mb-1">📸 ¿Tienes imágenes del problema?</p>
        <p className="text-xs text-green-700 mb-2">Envíalas por WhatsApp. Las imágenes se gestionan directamente por WhatsApp y no se acumulan en el sistema.</p>
        <a
          href="https://wa.me/59396999090?text=Hola,%20tengo%20imágenes%20del%20problema%20para%20el%20ticket"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Enviar imágenes por WhatsApp
        </a>
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
      <Button type="submit" variant="brand" size="lg" disabled={is