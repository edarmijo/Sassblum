import { useState } from 'react'
import { Check, Star, X } from 'lucide-react'
import { Button } from '../../../core/ui/button'
import { Textarea } from '../../../core/ui/textarea'
import type { Testimonial, TestimonialModerationPayload } from '../interfaces/ITestimonialService'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Publicado',
  rejected: 'Requiere cambios',
} as const

export function TestimonialModerationCard({
  testimonial,
  busy,
  onModerate,
}: Readonly<{
  testimonial: Testimonial
  busy: boolean
  onModerate: (payload: TestimonialModerationPayload) => Promise<void>
}>) {
  const [showRejection, setShowRejection] = useState(false)
  const [note, setNote] = useState(testimonial.moderationNote ?? '')

  return (
    <article className="min-w-0 rounded-2xl border border-brand-cyan/15 bg-[#081624]/90 p-5 sm:p-6">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#eef4f8]" title={testimonial.author}>{testimonial.author}</p>
          <p className="truncate text-sm text-[#7aa3b8]" title={testimonial.clientEmail}>{testimonial.company} · {testimonial.clientEmail}</p>
        </div>
        <span className="rounded-full border border-brand-cyan/15 bg-brand-cyan/8 px-3 py-1 text-xs font-medium text-brand-cyan">
          {STATUS_LABELS[testimonial.status ?? 'pending']}
        </span>
      </header>
      <div className="mt-4 flex gap-1" aria-label={`${testimonial.rating} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} aria-hidden="true" className={`size-4 ${star <= testimonial.rating ? 'fill-brand-cyan text-brand-cyan' : 'text-[#365364]'}`} />
        ))}
      </div>
      <p className="mt-4 break-words leading-7 text-[#b8cfda]">“{testimonial.comment}”</p>

      {showRejection ? (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4">
          <label htmlFor={`moderation-note-${testimonial.id}`} className="mb-2 block text-sm font-medium text-rose-100">Observación para el cliente</label>
          <Textarea
            id={`moderation-note-${testimonial.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            placeholder="Indica qué debe ajustar antes de volver a enviarlo…"
            className="border-rose-300/20 bg-[#040d16]/70 text-[#eef4f8]"
          />
          <p className="mt-1 text-right text-xs text-[#7aa3b8]">{note.length}/300</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy || note.trim().length === 0}
              onClick={() => void onModerate({ status: 'rejected', moderationNote: note }).then(() => setShowRejection(false))}
            >
              Confirmar observación
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setShowRejection(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-cyan/10 pt-4">
          <Button type="button" variant="brand" size="sm" disabled={busy || testimonial.status === 'approved'} onClick={() => void onModerate({ status: 'approved' })}>
            <Check aria-hidden="true" /> Aprobar
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setShowRejection(true)} className="text-rose-100">
            <X aria-hidden="true" /> Solicitar cambios
          </Button>
        </div>
      )}
    </article>
  )
}
