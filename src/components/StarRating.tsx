type StarRatingProps = {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
} as const

/** Read-only star display */
export function StarRating({ rating, size = 'md', className = '' }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating))
  const full = Math.floor(clamped)
  const hasHalf = clamped - full >= 0.5

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-accent ${sizeClass[size]} ${className}`}
      aria-label={`${clamped} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && hasHalf)
        return (
          <span key={i} aria-hidden className={filled ? 'text-accent' : 'text-brand/20'}>
            ★
          </span>
        )
      })}
    </span>
  )
}

type StarPickerProps = {
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}

/** Interactive 1–5 star picker for the review form */
export function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = n <= value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`h-11 w-11 rounded-full text-2xl transition ${
              selected ? 'text-accent' : 'text-brand/20 hover:text-accent/60'
            } disabled:cursor-not-allowed`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
