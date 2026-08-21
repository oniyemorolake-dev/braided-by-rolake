import {
  CANCELLATION_POLICY,
  CONFIG,
  PREP_INSTRUCTIONS,
  formatCancelNotice,
  formatPrice,
} from '../data'

/** Shared deposit callout for confirmation + status pages */
export function DepositInstructions({
  amount,
  compact,
}: {
  amount?: number
  compact?: boolean
}) {
  const deposit = amount ?? CONFIG.depositAmount
  return (
    <div
      className={
        compact
          ? 'rounded-2xl border border-accent/25 bg-lilac/50 px-4 py-4 text-sm text-brand/80'
          : 'rounded-2xl bg-accent px-5 py-5 text-white'
      }
    >
      {!compact && (
        <>
          <p className="text-sm font-medium text-white/80">Deposit required</p>
          <p className="mt-1 font-display text-4xl font-semibold">{formatPrice(deposit)}</p>
          <p className="mt-2 text-sm text-white/90">
            Send by Interac e-Transfer to{' '}
            <span className="font-semibold break-all">{CONFIG.depositEmail}</span>
          </p>
        </>
      )}
      {compact && (
        <>
          <p className="font-semibold text-brand">
            {formatPrice(deposit)} deposit required
          </p>
          <p className="mt-1">
            e-Transfer to{' '}
            <span className="font-semibold break-all text-brand">{CONFIG.depositEmail}</span>
          </p>
        </>
      )}
      <p className={compact ? 'mt-2 text-brand/65' : 'mt-3 text-sm text-white/85'}>
        Your booking is only confirmed once the deposit is received. Remaining balance is paid in
        person.
      </p>
      <p className={compact ? 'mt-2 text-xs text-brand/55' : 'mt-2 text-xs text-white/75'}>
        {CONFIG.depositInstructions}
      </p>
    </div>
  )
}

export function PrepInstructionsBlock() {
  return (
    <div className="rounded-2xl border border-brand/10 bg-lilac/40 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
        Prep for your appointment
      </p>
      <ul className="mt-3 space-y-2 text-sm text-brand/75">
        {PREP_INSTRUCTIONS.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-0.5 text-accent" aria-hidden>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CancelNoticeLine() {
  return (
    <p className="rounded-xl bg-brand/[0.04] px-3 py-3 text-sm leading-relaxed text-brand/75">
      {formatCancelNotice()}
    </p>
  )
}

export function CancellationPolicySection() {
  return (
    <section className="rounded-2xl border border-brand/10 bg-white px-5 py-5">
      <h2 className="font-display text-2xl font-semibold text-brand">
        {CANCELLATION_POLICY.title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand/75">
        {CANCELLATION_POLICY.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </section>
  )
}
