import { useMemo, useState } from 'react'
import { MessageSquareQuote, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../core/ui/button'
import { Skeleton } from '../../../core/ui/skeleton'
import { apiError } from '../../../infrastructure/http/apiError'
import type { TestimonialModerationPayload, TestimonialStatus } from '../interfaces/ITestimonialService'
import { useTestimonialModeration } from '../hooks/useTestimonials'
import { TestimonialModerationCard } from './TestimonialModerationCard'

type Filter = 'all' | TestimonialStatus

const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Publicados' },
  { value: 'rejected', label: 'Con cambios' },
]

export function TestimonialAdminPanel() {
  const { testimonials, loading, error, reload, moderate } = useTestimonialModeration()
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<number | null>(null)

  const visible = useMemo(
    () => filter === 'all' ? testimonials : testimonials.filter((item) => item.status === filter),
    [filter, testimonials],
  )
  const pendingCount = testimonials.filter((item) => item.status === 'pending').length

  const handleModeration = async (id: number, payload: TestimonialModerationPayload) => {
    setBusyId(id)
    try {
      await moderate(id, payload)
      toast.success(payload.status === 'approved' ? 'Testimonio publicado' : 'Observación enviada al cliente')
    } catch (cause) {
      toast.error(apiError(cause, 'No se pudo actualizar la moderación.'))
      throw cause
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">Confianza pública</p>
          <h2 className="mt-2 text-xl font-bold text-[#eef4f8]">Moderación de testimonios</h2>
          <p className="mt-1 text-sm text-[#7aa3b8]">Revisa contenido real antes de publicarlo. {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
          <RefreshCw aria-hidden="true" /> Actualizar
        </Button>
      </header>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Filtrar testimonios">
        {FILTERS.map((item) => (
          <Button key={item.value} type="button" size="sm" variant={filter === item.value ? 'brand' : 'ghost'} onClick={() => setFilter(item.value)}>
            {item.label}
          </Button>
        ))}
      </div>

      {loading ? <Skeleton className="h-64 rounded-2xl bg-[#081624]/90" /> : null}
      {!loading && error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-6" role="alert">
          <p className="text-rose-100">{error}</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void reload()}>Reintentar</Button>
        </div>
      ) : null}
      {!loading && !error && visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-cyan/20 p-10 text-center">
          <MessageSquareQuote className="mx-auto mb-3 size-8 text-brand-cyan" aria-hidden="true" />
          <p className="font-medium text-[#eef4f8]">No hay testimonios en esta bandeja.</p>
          <p className="mt-1 text-sm text-[#7aa3b8]">Los nuevos envíos aparecerán aquí automáticamente.</p>
        </div>
      ) : null}
      {!loading && !error && visible.length > 0 ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {visible.map((testimonial) => (
            <TestimonialModerationCard
              key={testimonial.id}
              testimonial={testimonial}
              busy={busyId === testimonial.id}
              onModerate={(payload) => handleModeration(testimonial.id, payload)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
