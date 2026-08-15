import { MessageSquareQuote, RefreshCw } from 'lucide-react'
import { Button } from '../../../core/ui/button'
import { Skeleton } from '../../../core/ui/skeleton'
import { Reveal, RevealGroup, RevealItem } from '../../../core/ui/motion'
import { usePublicTestimonials } from '../hooks/useTestimonials'
import { TestimonialCard } from './TestimonialCard'
import { TestimonialComposer } from './TestimonialComposer'

export function PublicTestimonialsSection() {
  const { testimonials, loading, error, reload } = usePublicTestimonials()

  let content
  if (loading) {
    content = (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Cargando testimonios">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-80 rounded-[1.75rem] bg-[#081624]/90" />)}
      </div>
    )
  } else if (error) {
    content = (
      <div className="rounded-[1.75rem] border border-dashed border-rose-300/25 bg-rose-300/5 px-6 py-10 text-center" role="alert">
        <p className="text-[#d9e7ed]">{error}</p>
        <Button type="button" variant="outline" className="mt-5" onClick={() => void reload()}>
          <RefreshCw aria-hidden="true" /> Intentar de nuevo
        </Button>
      </div>
    )
  } else if (testimonials.length === 0) {
    content = (
      <div className="rounded-[1.75rem] border border-dashed border-brand-cyan/20 bg-brand-cyan/5 px-6 py-12 text-center">
        <MessageSquareQuote className="mx-auto mb-4 size-9 text-brand-cyan" aria-hidden="true" />
        <p className="font-semibold text-[#eef4f8]">Las primeras historias verificadas están por llegar.</p>
        <p className="mt-2 text-sm text-[#8eb0c0]">Si ya eres cliente, puedes inaugurar esta sección desde el formulario inferior.</p>
      </div>
    )
  } else {
    content = (
      <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <RevealItem key={testimonial.id} focus>
            <TestimonialCard testimonial={testimonial} />
          </RevealItem>
        ))}
      </RevealGroup>
    )
  }

  return (
    <section
      className="relative z-10 py-24 md:py-32"
      style={{
        background: 'rgba(255,255,255,0.025)',
        contentVisibility: 'auto',
        containIntrinsicSize: '900px',
      }}
      aria-labelledby="testimonials-title"
      aria-busy={loading}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 max-w-3xl md:mb-16">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-brand-cyan">Testimonios verificados</p>
          <h2 id="testimonials-title" className="text-3xl font-semibold tracking-tight text-[#eef4f8] md:text-5xl">
            La confianza se construye en cada proyecto.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#8eb0c0] md:text-lg">
            Experiencias escritas por clientes con cuenta activa y publicadas después de una revisión humana.
          </p>
        </Reveal>

        {content}

        <div className="mt-16 md:mt-20">
          <TestimonialComposer />
        </div>
      </div>
    </section>
  )
}
