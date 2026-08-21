import { useMemo, useState, type FormEvent } from 'react'
import { SERVICES } from '../data'
import { notifyOwnerOfReview } from '../lib/notifications'
import { submitReview } from '../lib/reviews'
import { StarPicker } from './StarRating'

const styleOptions = SERVICES.filter((s) => s.category !== 'care').map((s) => s.name)

type ReviewFormProps = {
  /** Compact layout for embedding in Home */
  compact?: boolean
  onSubmitted?: () => void
}

export function ReviewForm({ compact, onSubmitted }: ReviewFormProps) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [style, setStyle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const sortedStyles = useMemo(
    () => [...styleOptions].sort((a, b) => a.localeCompare(b)),
    [],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const review = await submitReview({
        name,
        rating,
        text,
        style: style || undefined,
      })
      void notifyOwnerOfReview(review)
      setDone(true)
      setName('')
      setRating(5)
      setText('')
      setStyle('')
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className={`card-soft ${compact ? 'p-5' : 'p-6 sm:p-8'} text-center`}>
        <p className="font-display text-2xl font-semibold text-brand">Thanks!</p>
        <p className="mt-2 text-sm leading-relaxed text-brand/65">
          Your review will appear once approved.
        </p>
        <button
          type="button"
          className="btn-secondary mt-5 !px-4 !py-2 text-sm"
          onClick={() => setDone(false)}
        >
          Write another
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={`card-soft space-y-4 ${compact ? 'p-5' : 'p-6 sm:p-8'}`}
    >
      {!compact && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-brand">Leave a review</h2>
          <p className="mt-1 text-sm text-brand/60">
            Share how your appointment went — reviews help other clients feel confident booking.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand/70" htmlFor="review-name">
          Your name
        </label>
        <input
          id="review-name"
          className="input-field"
          required
          maxLength={80}
          placeholder="First name is fine"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-brand/70">Rating</p>
        <StarPicker value={rating} onChange={setRating} disabled={submitting} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand/70" htmlFor="review-style">
          Style you got <span className="font-normal text-brand/40">(optional)</span>
        </label>
        <select
          id="review-style"
          className="input-field"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={submitting}
        >
          <option value="">Select a style</option>
          {sortedStyles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand/70" htmlFor="review-text">
          Your review
        </label>
        <textarea
          id="review-text"
          className="input-field min-h-[120px] resize-y"
          required
          maxLength={1200}
          placeholder="What did you love about your appointment?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitting}
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
        {submitting ? 'Sending…' : 'Submit review'}
      </button>
    </form>
  )
}
