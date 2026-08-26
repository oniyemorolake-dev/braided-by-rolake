import { Link } from 'react-router-dom'
import {
  CANCELLATION_POLICY,
  CONFIG,
  FAQ_ITEMS,
  ISSUE_CONTACT_HOURS,
  PREP_INSTRUCTIONS,
  STUDIO_POLICY_SECTIONS,
} from '../data'
import { CancellationPolicySection } from '../components/BookingNotices'

export function Policies() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Studio guide</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-brand sm:text-5xl">
        FAQ &amp; policies
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-brand/70">
        Clear house rules so everyone has a calm appointment — including respect, deposits, and the{' '}
        {ISSUE_CONTACT_HOURS}-hour window if something needs a fix after your braids.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <a href="#faq" className="font-medium text-accent hover:underline">
          Jump to FAQ
        </a>
        <span className="text-brand/30">·</span>
        <a href="#policies" className="font-medium text-accent hover:underline">
          Jump to policies
        </a>
        <span className="text-brand/30">·</span>
        <Link to="/book" className="font-medium text-accent hover:underline">
          Book now
        </Link>
      </div>

      <section id="faq" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-brand">Frequently asked</h2>
        <div className="mt-5 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-brand/10 bg-white px-4 py-3 open:bg-lilac/30"
            >
              <summary className="cursor-pointer list-none font-semibold text-brand marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  {item.q}
                  <span className="mt-0.5 text-brand/35 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-2 pb-1 text-sm leading-relaxed text-brand/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="policies" className="mt-14 scroll-mt-24 space-y-6">
        <h2 className="font-display text-2xl font-semibold text-brand">Studio policies</h2>
        {STUDIO_POLICY_SECTIONS.map((section) => (
          <article key={section.id} id={section.id} className="scroll-mt-24 rounded-2xl border border-brand/10 bg-white px-5 py-5">
            <h3 className="font-display text-xl font-semibold text-brand">{section.title}</h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand/75">
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </article>
        ))}

        <CancellationPolicySection />

        <article className="rounded-2xl border border-brand/10 bg-lilac/40 px-5 py-5">
          <h3 className="font-display text-xl font-semibold text-brand">Prep checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-brand/75">
            {PREP_INSTRUCTIONS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <aside className="mt-12 rounded-2xl bg-brand px-5 py-6 text-white">
        <p className="font-display text-2xl font-semibold">Questions before you book?</p>
        <p className="mt-2 text-sm text-white/80">
          {CANCELLATION_POLICY.summary} Text {CONFIG.contactPhone || CONFIG.phoneDisplay} or email{' '}
          {CONFIG.email}.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link to="/book" className="btn-primary bg-white text-brand hover:bg-lilac">
            Book an appointment
          </Link>
          <a
            href={`tel:${CONFIG.contactPhone.replace(/\D/g, '')}`}
            className="btn-secondary border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            Text {CONFIG.phoneDisplay}
          </a>
        </div>
      </aside>
    </div>
  )
}
