import { Link } from 'react-router-dom'
import { CONFIG, SERVICES, getMenServices } from '../data'
import { ServiceCard } from '../components/ServiceCard'
import { ReviewsSection } from '../components/ReviewsSection'

const reasons = [
  {
    title: 'Gentle on your hairline',
    body: 'I prioritize tension-aware braiding so your edges stay healthy and your style lasts comfortably.',
  },
  {
    title: 'A calm home studio',
    body: 'Private, cozy appointments in Calgary — no salon rush. Full address is shared once you are booked.',
  },
  {
    title: 'Clear pricing & fair offers',
    body: 'Book at the listed price instantly, or send an offer. I will review and respond — no surprises.',
  },
]

export function Home() {
  const featured = SERVICES.filter(
    (s) => s.featured && s.category !== 'care' && s.category !== 'kids' && s.category !== 'men',
  ).slice(0, 6)
  const menStyles = getMenServices()

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-wash relative overflow-hidden">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-14 pt-10 text-center sm:px-6 sm:pb-20 sm:pt-14">
          <img
            src="/logo.png"
            alt="Braided by Rolake logo"
            className="animate-fade-up h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white sm:h-36 sm:w-36"
          />
          <h1 className="animate-fade-up animate-delay-1 mt-6 font-display text-4xl font-semibold text-brand sm:text-5xl md:text-6xl">
            Braided by Rolake
          </h1>
          <p className="animate-fade-up animate-delay-2 mt-3 max-w-md text-lg text-brand/75 sm:text-xl">
            {CONFIG.tagline}
          </p>
          <p className="animate-fade-up animate-delay-2 mt-4 max-w-lg text-sm leading-relaxed text-brand/60 sm:text-base">
            I&apos;m a home-based braider with a cozy studio in {CONFIG.city}. Protective styles in a
            calm space — the full address is shared once your booking is confirmed.
          </p>
          <div className="animate-fade-up animate-delay-3 mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link to="/book" className="btn-primary w-full sm:w-auto">
              Book Now
            </Link>
            <Link to="/services" className="btn-secondary w-full sm:w-auto">
              View services
            </Link>
          </div>
        </div>
      </section>

      {/* Featured styles */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="font-display text-3xl font-semibold text-brand sm:text-4xl">
            Featured styles
          </h2>
          <p className="mt-2 text-brand/65">
            Popular protective looks. Every style includes a tidy finish and aftercare tips.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {featured.map((s) => (
            <ServiceCard key={s.id} service={s} compact />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/services" className="text-sm font-semibold text-accent hover:underline">
            See all services & pricing →
          </Link>
        </div>
      </section>

      {/* Men’s styles */}
      {menStyles.length > 0 && (
        <section className="bg-lilac/50">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="font-display text-3xl font-semibold text-brand sm:text-4xl">
                Men’s styles
              </h2>
              <p className="mt-2 text-brand/65">
                Cornrows, plaits, twists, and design work for men — clean parts and solid hold.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {menStyles.map((s) => (
                <ServiceCard key={s.id} service={s} compact />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/services" className="text-sm font-semibold text-accent hover:underline">
                See all men’s styles →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why book */}
      <section className="bg-lilac/60">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-center font-display text-3xl font-semibold text-brand sm:text-4xl">
            Why book with me
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-brand/65">
            Thoughtful braiding, honest communication, and a space that feels like yours for a few
            hours.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {reasons.map((r) => (
              <div key={r.title} className="text-center sm:text-left">
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-accent sm:mx-0" />
                <h3 className="font-display text-xl font-semibold text-brand">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand/70">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ReviewsSection limit={4} showSeeAll />

      {/* CTA band */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="card-soft bg-gradient-to-br from-lilac to-white px-6 py-10 text-center sm:px-10">
          <h2 className="font-display text-3xl font-semibold text-brand">Ready for your next set?</h2>
          <p className="mx-auto mt-2 max-w-md text-brand/65">
            Pick a style, choose a time that works, and I&apos;ll take care of the rest. Same-day
            listed-price bookings confirm instantly.
          </p>
          <Link to="/book" className="btn-primary mt-6 inline-flex">
            Start booking
          </Link>
        </div>
      </section>
    </div>
  )
}
