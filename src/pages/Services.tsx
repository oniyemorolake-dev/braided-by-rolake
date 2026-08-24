import { useMemo, useState } from 'react'
import {
  ADDONS,
  CONFIG,
  DISCOUNT_PRICE_FLOOR,
  DISCOUNTS,
  LENGTH_OPTIONS,
  MOBILE_BASE,
  MOBILE_ZONES,
  POLICIES,
  SIZE_OPTIONS,
  formatPrice,
  formatPriceAdjust,
  getAdultServices,
  getCareServices,
  getKidsServices,
  getMenServices,
} from '../data'
import { filterServices } from '../lib/serviceSearch'
import { ServiceCard } from '../components/ServiceCard'

export function Services() {
  const [query, setQuery] = useState('')
  const adult = useMemo(() => filterServices(getAdultServices(), query), [query])
  const men = useMemo(() => filterServices(getMenServices(), query), [query])
  const care = useMemo(() => filterServices(getCareServices(), query), [query])
  const kids = useMemo(() => filterServices(getKidsServices(), query), [query])
  const totalMatches = adult.length + men.length + care.length + kids.length
  const searching = query.trim().length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Services</h1>
        <p className="mt-3 text-brand/70">
          Calgary-aligned pricing (medium / shoulder base). Choose size, length, and add-ons when you
          book. Mobile travel available. Deposit via Interac e-Transfer: {formatPrice(10)} under{' '}
          {formatPrice(50)}, {formatPrice(15)} under {formatPrice(60)}, otherwise{' '}
          {formatPrice(CONFIG.depositAmount)}. {CONFIG.taxNote}
        </p>
      </div>

      <div className="mt-6">
        <label className="mb-1.5 block text-sm font-medium text-brand" htmlFor="service-search">
          Search services
        </label>
        <input
          id="service-search"
          className="input-field"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try knotless, crochet, kids, take out…"
          autoComplete="off"
        />
        {searching && (
          <p className="mt-2 text-xs text-brand/55">
            {totalMatches === 0
              ? 'No services match that search.'
              : `${totalMatches} service${totalMatches === 1 ? '' : 's'} found`}
          </p>
        )}
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
            From {MOBILE_BASE.area}.{' '}
            {MOBILE_ZONES.map((z) => `${z.label} (${formatPriceAdjust(z.price)})`).join(' · ')}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-lilac/60 px-4 py-4 text-sm text-brand/75 sm:px-5">
        <p className="font-semibold text-brand">How mobile travel works</p>
        <p className="mt-2">{MOBILE_BASE.note}</p>
        <p className="mt-2">{MOBILE_BASE.marketAverage}</p>
        <p className="mt-2 text-brand/60">
          Prefer no travel fee? Book a studio visit — come to me in {MOBILE_BASE.area}.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-accent/20 bg-white p-5">
        <h2 className="font-display text-2xl font-semibold text-brand">Discounts</h2>
        <p className="mt-1 text-sm text-brand/60">
          Enter a code at checkout — one code per booking, single-use, never below{' '}
          {formatPrice(DISCOUNT_PRICE_FLOOR)}.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {DISCOUNTS.filter((d) => d.enabled).map((d) => (
            <li key={d.id} className="rounded-xl bg-lilac/50 px-4 py-3">
              <p className="font-semibold text-brand">{d.label}</p>
              <p className="mt-0.5 text-sm text-brand/65">{d.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {adult.length > 0 && (
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
      )}

      {men.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-brand sm:text-3xl">
            Men’s braids
          </h2>
          <p className="mt-1 text-sm text-brand/60">
            Cornrows, plaits, twists, and design styles for men — clean parts and solid hold.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {men.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {care.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-brand sm:text-3xl">
            Hair care &amp; finishing
          </h2>
          <p className="mt-1 text-sm text-brand/60">
            Take-outs, no-wash detangling, gel styles, and basic straighten — no shampoo/wash
            services.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {care.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {kids.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-brand sm:text-3xl">
            Kids · ages 4–11
          </h2>
          <p className="mt-1 text-sm text-brand/60">
            Gentle, age-appropriate styles with soft tension and patient hands. Perfect for school,
            sports, and special days. Kids take-outs and no-wash detangling available too.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kids.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {searching && totalMatches === 0 && (
        <div className="card-soft mt-12 px-6 py-12 text-center">
          <p className="font-display text-2xl text-brand">No matches</p>
          <p className="mt-2 text-sm text-brand/60">
            Try another word, or clear the search to see all services.
          </p>
          <button type="button" className="btn-secondary mt-4" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      )}

      <div className="mt-10 space-y-3 rounded-2xl bg-lilac/70 px-4 py-5 text-sm text-brand/70">
        <p className="font-semibold text-brand">Before you book</p>
        <ul className="space-y-2">
          {POLICIES.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
        <p>
          <strong className="text-brand">Deposit:</strong> e-Transfer {formatPrice(10)} (under{' '}
          {formatPrice(50)}), {formatPrice(15)} (under {formatPrice(60)}), or{' '}
          {formatPrice(CONFIG.depositAmount)} otherwise — send to{' '}
          <a className="text-accent hover:underline" href={`mailto:${CONFIG.depositEmail}`}>
            {CONFIG.depositEmail}
          </a>
          . {CONFIG.depositInstructions}
        </p>
      </div>
    </div>
  )
}
