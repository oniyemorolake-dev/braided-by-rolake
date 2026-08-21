import {
  ADDONS,
  CONFIG,
  DISCOUNTS,
  LENGTH_OPTIONS,
  MOBILE_ZONES,
  POLICIES,
  SIZE_OPTIONS,
  formatPrice,
  formatPriceAdjust,
  getAdultServices,
  getKidsServices,
} from '../data'
import { ServiceCard } from '../components/ServiceCard'

export function Services() {
  const adult = getAdultServices()
  const kids = getKidsServices()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Services</h1>
        <p className="mt-3 text-brand/70">
          Competitive Calgary home-studio pricing. Choose size, length, and add-ons when you book.
          Mobile travel available. A {formatPrice(CONFIG.depositAmount)} Interac e-Transfer deposit
          holds your spot. {CONFIG.taxNote}
        </p>
      </div>

      <div className="mt-8 grid gap-3 rounded-2xl bg-lilac/60 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Sizes</p>
          <p className="mt-1 text-sm text-brand/75">
            {SIZE_OPTIONS.map((s) => s.label).join(' · ')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Length</p>
          <p className="mt-1 text-sm text-brand/75">
            {LENGTH_OPTIONS.map((l) =>
              l.price === 0 ? l.label : `${l.label} (${formatPriceAdjust(l.price)})`,
            ).join(' · ')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Add-ons</p>
          <p className="mt-1 text-sm text-brand/75">
            {ADDONS.map((a) => `${a.name} (${formatPriceAdjust(a.price)})`).join(' · ')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Mobile travel</p>
          <p className="mt-1 text-sm text-brand/75">
            {MOBILE_ZONES.map((z) => `${z.label} (${formatPriceAdjust(z.price)})`).join(' · ')}
          </p>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-accent/20 bg-white p-5">
        <h2 className="font-display text-2xl font-semibold text-brand">Discounts</h2>
        <p className="mt-1 text-sm text-brand/60">
          Mention the discount in your booking note — I&apos;ll apply it when confirming.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {DISCOUNTS.map((d) => (
            <li key={d.id} className="rounded-xl bg-lilac/50 px-4 py-3">
              <p className="font-semibold text-brand">{d.label}</p>
              <p className="mt-0.5 text-sm text-brand/65">{d.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-brand sm:text-3xl">
          Adult styles
        </h2>
        <p className="mt-1 text-sm text-brand/60">Protective styles for teens and adults.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {adult.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-brand sm:text-3xl">
          Kids · ages 4–11
        </h2>
        <p className="mt-1 text-sm text-brand/60">
          Gentle, age-appropriate styles with soft tension and patient hands. Perfect for school,
          sports, and special days.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kids.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-3 rounded-2xl bg-lilac/70 px-4 py-5 text-sm text-brand/70">
        <p className="font-semibold text-brand">Before you book</p>
        <ul className="space-y-2">
          {POLICIES.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
        <p>
          <strong className="text-brand">Deposit:</strong> e-Transfer{' '}
          {formatPrice(CONFIG.depositAmount)} to{' '}
          <a className="text-accent hover:underline" href={`mailto:${CONFIG.depositEmail}`}>
            {CONFIG.depositEmail}
          </a>
          . {CONFIG.depositInstructions}
        </p>
      </div>
    </div>
  )
}
