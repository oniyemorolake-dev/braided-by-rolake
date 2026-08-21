import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { averageRating, loadApprovedReviews, type Review } from '../lib/reviews'
import { StarRating } from './StarRating'
import { ReviewForm } from './ReviewForm'

type ReviewsSectionProps = {
  /** Show the leave-a-review form below the list */
  showForm?: boolean
  /** Limit how many approved reviews to show (Home teaser) */
  limit?: number
  /** Link to the full /reviews page */
  showSeeAll?: boolean
}

export function ReviewsSection({
  showForm = false,
  limit,
  showSeeAll = false,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void loadApprovedReviews()
      .then((list) => {
        if (!cancelled) setReviews(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load reviews.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const avg = averageRating(reviews)
  const visible = limit != null ? reviews.slice(0, limit) : reviews

  return (
    <section className="bg-lilac/50">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-brand sm:text-4xl">
            Client love
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-brand/65">
            Real words from clients who sat in my chair — warm, honest, and appreciated.
          </p>

          {!loading && avg != null && (
            <div className="mt-5 inline-flex flex-col items-center gap-1 rounded-2xl bg-white/80 px-5 py-3 shadow-sm ring-1 ring-accent/15">
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl font-semibold text-brand">{avg.toFixed(1)}</span>
                <StarRating rating={avg} size="lg" />
              </div>
              <p className="text-xs text-brand/50">
                Average from {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </div>

        {loading && (
          <p className="mt-10 text-center text-sm text-brand/50">Loading reviews…</p>
        )}

        {error && (
          <p className="mt-10 text-center text-sm text-rose-600">{error}</p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="mx-auto mt-10 max-w-md card-soft px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lilac text-2xl text-accent">
              ★
            </div>
            <p className="font-display text-2xl font-semibold text-brand">Be the first</p>
            <p className="mt-2 text-sm leading-relaxed text-brand/60">
              No public reviews yet — if you&apos;ve sat with me, I&apos;d love to hear how it went.
            </p>
            {!showForm && (
              <Link to="/reviews" className="btn-primary mt-5 inline-flex !px-5 !py-2.5 text-sm">
                Leave a review
              </Link>
            )}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {visible.map((r) => (
              <article key={r.id} className="card-soft flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold text-brand">{r.name}</p>
                    {r.style && (
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-accent/80">
                        {r.style}
                      </p>
                    )}
                  </div>
                  <StarRating rating={r.rating} size="sm" />
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-brand/75">&ldquo;{r.text}&rdquo;</p>
              </article>
            ))}
          </div>
        )}

        {showSeeAll && reviews.length > (limit ?? 0) && (
          <div className="mt-8 text-center">
            <Link to="/reviews" className="text-sm font-semibold text-accent hover:underline">
              Read all reviews →
            </Link>
          </div>
        )}

        {showForm && (
          <div className="mx-auto mt-12 max-w-lg">
            <h3 className="mb-4 text-center font-display text-2xl font-semibold text-brand">
              Leave a review
            </h3>
            <ReviewForm compact />
          </div>
        )}
      </div>
    </section>
  )
}
