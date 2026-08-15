import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2, LogIn, MessageSquareText, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../core/ui/button'
import { SmoothLink } from '../../../core/ui/SmoothLink'
import { Skeleton } from '../../../core/ui/skeleton'
import { Textarea } from '../../../core/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../core/ui/alert-dialog'
import { apiError } from '../../../infrastructure/http/apiError'
import { useAuth } from '../../auth/hooks/useAuth'
import type { TestimonialStatus } from '../interfaces/ITestimonialService'
import { useMyTestimonial } from '../hooks/useTestimonials'
import { RatingInput } from './RatingInput'

const MIN_COMMENT_LENGTH = 20
const MAX_COMMENT_LENGTH = 500

const STATUS_COPY: Record<TestimonialStatus, { title: string; detail: string; className: string }> = {
  pending: {
    title: 'En revisión',
    detail: 'Tu experiencia está en la bandeja de moderación. Te avisaremos aquí cuando se publique.',
    className: 'border-amber-300/20 bg-amber-300/8 text-amber-100',
  },
  approved: {
    title: 'Publicado',
    detail: 'Tu experiencia ya ayuda a otras empresas a tomar una decisión informada.',
    className: 'border-emerald-300/20 bg-emerald-300/8 text-emerald-100',
  },
  rejected: {
    title: 'Necesita cambios',
    detail: 'Revisa la observación del equipo, edita tu texto y vuelve a enviarlo.',
    className: 'border-rose-300/20 bg-rose-300/8 text-rose-100',
  },
}

export function TestimonialComposer() {
  const { user, isAuthenticated } = useAuth()
  const { hash } = useLocation()
  const isClient = user?.rol === 'CLIENTE'
  const { testimonial, loading, save, remove } = useMyTestimonial(isClient)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!testimonial) return
    setRating(testimonial.rating)
    setComment(testimonial.comment)
  }, [testimonial])

  useEffect(() => {
    if (hash !== '#compartir-opinion') return
    const frameId = globalThis.requestAnimationFrame(() => {
      const reduceMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById('compartir-opinion')?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center',
      })
    })
    return () => globalThis.cancelAnimationFrame(frameId)
  }, [hash])

  if (!isAuthenticated) {
    return (
      <aside id="compartir-opinion" className="rounded-[2rem] border border-brand-cyan/15 bg-[#071421]/90 p-7 sm:p-10">
        <MessageSquareText className="mb-6 size-9 text-brand-cyan" aria-hidden="true" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">Tu voz también cuenta</p>
        <h3 className="max-w-xl text-2xl font-semibold text-[#eef4f8] sm:text-3xl">¿Ya trabajaste con SassBlum?</h3>
        <p className="mt-3 max-w-2xl leading-7 text-[#8eb0c0]">Inicia sesión con tu cuenta de cliente para compartir una experiencia verificada.</p>
        <Button asChild variant="brand" className="mt-7">
          <SmoothLink to="/login?next=/clientes%23compartir-opinion">
            <LogIn aria-hidden="true" /> Iniciar sesión y opinar
          </SmoothLink>
        </Button>
      </aside>
    )
  }

  if (!isClient) {
    return (
      <aside id="compartir-opinion" className="rounded-[2rem] border border-brand-cyan/15 bg-[#071421]/90 p-7 sm:p-10">
        <ShieldCheck className="mb-5 size-9 text-brand-cyan" aria-hidden="true" />
        <h3 className="text-2xl font-semibold text-[#eef4f8]">Opiniones verificadas</h3>
        <p className="mt-3 max-w-2xl leading-7 text-[#8eb0c0]">Solo las cuentas con rol Cliente pueden enviar testimonios. El equipo administrativo conserva la moderación.</p>
      </aside>
    )
  }

  if (loading) {
    return <Skeleton className="h-80 rounded-[2rem] bg-[#071421]/90" aria-label="Cargando tu testimonio" />
  }

  const trimmedLength = comment.trim().length
  const isValid = rating >= 1 && rating <= 5
    && trimmedLength >= MIN_COMMENT_LENGTH
    && trimmedLength <= MAX_COMMENT_LENGTH
  const statusCopy = testimonial?.status ? STATUS_COPY[testimonial.status] : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await save({ rating, comment })
      toast.success(testimonial ? 'Testimonio actualizado' : 'Gracias por compartir tu experiencia', {
        description: 'Quedó pendiente de moderación antes de publicarse.',
      })
    } catch (cause) {
      toast.error(apiError(cause, 'No pudimos guardar tu testimonio.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await remove()
      setRating(5)
      setComment('')
      toast.success('Testimonio retirado')
    } catch (cause) {
      toast.error(apiError(cause, 'No pudimos retirar tu testimonio.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <aside id="compartir-opinion" className="overflow-hidden rounded-[2rem] border border-brand-cyan/15 bg-[#071421]/95">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-brand-cyan/10 bg-brand-cyan/5 p-7 sm:p-10 lg:border-b-0 lg:border-r">
          <MessageSquareText className="mb-7 size-10 text-brand-cyan" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">Experiencia verificada</p>
          <h3 className="mt-3 text-2xl font-semibold text-[#eef4f8] sm:text-3xl">
            {testimonial ? 'Actualiza tu historia' : 'Cuéntanos cómo te fue'}
          </h3>
          <p className="mt-4 leading-7 text-[#8eb0c0]">Una reseña honesta ayuda a mejorar el servicio y orienta a futuros clientes.</p>
          {statusCopy ? (
            <div className={`mt-7 rounded-xl border p-4 ${statusCopy.className}`} role="status">
              <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4" aria-hidden="true" />{statusCopy.title}</p>
              <p className="mt-1 text-sm leading-6 opacity-80">{statusCopy.detail}</p>
              {testimonial?.status === 'rejected' && testimonial.moderationNote ? (
                <p className="mt-3 break-words rounded-lg bg-black/15 p-3 text-sm">Observación: {testimonial.moderationNote}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <form className="space-y-6 p-7 sm:p-10" onSubmit={handleSubmit} noValidate>
          <RatingInput value={rating} onChange={setRating} disabled={submitting} />
          <div>
            <label htmlFor="testimonial-comment" className="mb-2 block text-sm font-medium text-[#d9e7ed]">Tu experiencia</label>
            <Textarea
              id="testimonial-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              minLength={MIN_COMMENT_LENGTH}
              maxLength={MAX_COMMENT_LENGTH}
              rows={6}
              required
              disabled={submitting}
              aria-describedby="testimonial-comment-hint testimonial-comment-count"
              aria-invalid={comment.length > 0 && trimmedLength < MIN_COMMENT_LENGTH}
              placeholder="Describe qué servicio recibiste y qué fue valioso para tu empresa…"
              className="min-h-36 resize-y border-brand-cyan/15 bg-[#040d16]/70 text-[#eef4f8] placeholder:text-[#597789]"
            />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#6f93a5]">
              <span id="testimonial-comment-hint">Mínimo {MIN_COMMENT_LENGTH} caracteres. No incluyas datos sensibles.</span>
              <span id="testimonial-comment-count" aria-live="polite">{comment.length}/{MAX_COMMENT_LENGTH}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="brand" disabled={!isValid || submitting}>
              {submitting ? 'Guardando…' : testimonial ? 'Enviar actualización' : 'Enviar a revisión'}
            </Button>
            {testimonial ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" disabled={deleting} className="text-rose-200 hover:text-rose-100">
                    <Trash2 aria-hidden="true" /> Retirar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-brand-cyan/15 bg-[#071421] text-[#eef4f8]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Retirar tu testimonio?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#8eb0c0]">Dejará de aparecer públicamente y esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Conservar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleDelete()} className="bg-rose-600 text-white hover:bg-rose-500">Sí, retirar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </form>
      </div>
    </aside>
  )
}
