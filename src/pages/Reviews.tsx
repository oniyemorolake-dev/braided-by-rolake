import { ReviewsSection } from '../components/ReviewsSection'

export function Reviews() {
  return (
    <div>
      <section className="bg-brand-wash">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-10 text-center sm:px-6 sm:pt-14">
          <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Reviews</h1>
          <p className="mx-auto mt-3 max-w-md text-brand/65">
            Hear from clients, then share your own experience when you&apos;re ready.
          </p>
        </div>
      </section>
      <ReviewsSection showForm />
    </div>
  )
}
