import { Link } from 'react-router-dom'
import { CONFIG, PREP_AFTERCARE, PREP_INSTRUCTIONS } from '../data'

export function PrepAftercare() {
  const c = PREP_AFTERCARE
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Care guide</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-brand sm:text-5xl">{c.title}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-brand/70">{c.intro}</p>

      <section className="mt-10 rounded-2xl border border-brand/10 bg-white px-5 py-6">
        <h2 className="font-display text-2xl font-semibold text-brand">{c.prepTitle}</h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-brand/75">
          {c.prep.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-brand/50">Quick checklist also emailed with your booking:</p>
        <ul className="mt-2 space-y-1 text-xs text-brand/55">
          {PREP_INSTRUCTIONS.map((item) => (
            <li key={item}>– {item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-brand/10 bg-lilac/40 px-5 py-6">
        <h2 className="font-display text-2xl font-semibold text-brand">{c.aftercareTitle}</h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-brand/75">
          {c.aftercare.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-brand/10 bg-white px-5 py-6">
        <h2 className="font-display text-2xl font-semibold text-brand">{c.returnTitle}</h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-brand/75">
          {c.returnTips.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link to="/book" className="btn-primary">
          Book an appointment
        </Link>
        <Link to="/policies" className="btn-secondary">
          FAQ &amp; policies
        </Link>
        <a
          href={`tel:${CONFIG.contactPhone.replace(/\D/g, '')}`}
          className="btn-secondary"
        >
          Text {CONFIG.phoneDisplay}
        </a>
      </div>
    </div>
  )
}
