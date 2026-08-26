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
      {/* Hero — brand first */}
      <section className="bg-brand-wash relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-lilac-deep/40 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-24 sm:pt-16">
          <div className="animate-float">
            <img
              src="/logo.png"
              alt="Braided by Rolake logo"
              className="animate-fade-up h-32 w-32 rounded-full object-cover shadow-[0_20px_50px_rgba(61,15,74,0.18)] ring-[6px] ring-white/90 sm:h-40 sm:w-40"
            />
          </div>
          <h1 className="animate-fade-up animate-delay-1 mt-7 font-display text-5xl font-semibold tracking-tight text-brand sm:text-6xl md:text-7xl">
            Braided by Rolake
          </h1>
          <div
            className="animate-line mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-accent to-transparent"
            aria-hidden
          />
          <p className="animate-fade-up animate-delay-2 mt-4 max-w-md font-display text-xl italic text-brand/70 sm:text-2xl">
            {CONFIG.tagline}
          </p>
          <p className="animate-fade-up animate-delay-2 mt-4 max-w-lg text-sm leading-relaxed text-brand/55 sm:text-base">
            Home studio in {CONFIG.city} — protective styles in a calm space. Address shared once
            you&apos;re confirmed.
          </p>
          <div className="animate-fade-up animate-delay-3 mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
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
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-9 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/80">
            The menu
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-brand sm:text-4xl">
            Featured styles
          </h2>
          <p className="mt-2 max-w-lg text-brand/60">
            Popular protective looks — tidy finish, clear pricing, aftercare tips included.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {featured.map((s) => (
            <ServiceCard key={s.id} service={s} compact />
          ))}
        </div>
        <div className="mt-9 text-center">
          <Link to="/services" className="text-sm font-semibold text-accent hover:underline">
            See all services & pricing →
          </Link>
        </div>
      </section>

      {/* Men’s styles */}
      {menStyles.length > 0 && (
        <section className="bg-brand-section">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-9 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/80">
                For him
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-brand sm:text-4xl">
                Men’s styles
              </h2>
              <p className="mt-2 max-w-lg text-brand/60">
                Cornrows, plaits, twists, and design work — size options, plus extensions when you
                want them.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {menStyles.map((s) => (
                <ServiceCard key={s.id} service={s} compact />
              ))}
            </div>
            <div className="mt-9 text-center">
              <Link to="/services" className="text-sm font-semibold text-accent hover:underline">
                See all men’s styles →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why book */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-center font-display text-3xl font-semibold text-brand sm:text-4xl">
            Why book with me
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-brand/60">
            Thoughtful braiding, honest communication, and a space that feels like yours.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {reasons.map((r, i) => (
              <div key={r.title} className="text-center sm:text-left">
                <p className="font-display text-3xl font-semibold text-accent/35">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-brand">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand/65">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ReviewsSection limit={4} showSeeAll />

      {/* CTA band */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:pb-20 sm:pt-8">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-brand px-6 py-12 text-center text-white sm:px-12 sm:py-14">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-lilac/20 blur-3xl"
            aria-hidden
          />
          <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            Calgary home studio
          </p>
          <h2 className="relative mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Ready for your next set?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            Pick a style, choose a time, send your deposit — I&apos;ll take care of the rest.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/book"
              className="btn-primary !bg-white !text-brand !shadow-none hover:!bg-lilac w-full sm:w-auto"
            >
              Start booking
            </Link>
            <Link
              to="/care"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 w-full sm:w-auto"
            >
              Prep & aftercare
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
