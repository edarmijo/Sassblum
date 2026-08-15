import { memo } from 'react'
import { Quote, Star } from 'lucide-react'
import type { Testimonial } from '../interfaces/ITestimonialService'

const STAR_KEYS = Array.from({ length: 5 }, (_, index) => index + 1)

export const TestimonialCard = memo(function TestimonialCard({
  testimonial,
}: Readonly<{ testimonial: Testimonial }>) {
  return (
    <article className="group relative h-full overflow-hidden rounded-[1.75rem] border border-brand-cyan/15 bg-[#081624]/90 p-7 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-32 rounded-full bg-brand-cyan/8 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
      />
      <Quote className="mb-8 size-8 text-brand-cyan/35" aria-hidden="true" />
      <p className="mb-8 line-clamp-6 break-words text-base leading-7 text-[#b8cfda]">
        “{testimonial.comment}”
      </p>
      <footer className="mt-auto border-t border-brand-cyan/10 pt-5">
        <div
          className="mb-3 flex gap-1"
          aria-label={`${testimonial.rating} de 5 estrellas`}
        >
          {STAR_KEYS.map((star) => (
            <Star
              key={star}
              aria-hidden="true"
              className={`size-4 ${star <= testimonial.rating ? 'fill-brand-cyan text-brand-cyan' : 'text-[#365364]'}`}
            />
          ))}
        </div>
        <p className="truncate font-semibold text-[#eef4f8]" title={testimonial.author}>
          {testimonial.author}
        </p>
        <p className="truncate text-sm text-[#7aa3b8]" title={testimonial.company}>
          {testimonial.company}
        </p>
      </footer>
    </article>
  )
})
