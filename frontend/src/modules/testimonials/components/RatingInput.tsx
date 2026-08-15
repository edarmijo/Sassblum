import { Star } from 'lucide-react'

const RATINGS = [1, 2, 3, 4, 5] as const

export function RatingInput({
  value,
  disabled,
  onChange,
}: Readonly<{ value: number; disabled?: boolean; onChange: (rating: number) => void }>) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-[#d9e7ed]">Tu calificación</legend>
      <div className="flex w-fit gap-1" role="radiogroup" aria-label="Calificación del servicio">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`}
            className="rounded-lg p-2 text-[#365364] transition-colors hover:text-brand-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/70 disabled:cursor-not-allowed"
            onClick={() => onChange(rating)}
          >
            <Star
              aria-hidden="true"
              className={`size-6 ${rating <= value ? 'fill-brand-cyan text-brand-cyan' : ''}`}
            />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
