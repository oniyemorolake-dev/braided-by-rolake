import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  CONFIG,
  formatAddonsLabel,
  formatDateLabel,
  formatMobileLabel,
  formatPrice,
  formatSizeLabel,
  formatSlotLabel,
  getLengthOption,
  getServiceById,
  isCustomQuoteService,
  type Booking,
} from '../data'
import { useBookings } from '../context/BookingContext'
import { StatusBadge } from '../components/StatusBadge'
import {
  CancelNoticeLine,
  DepositInstructions,
  PrepInstructionsBlock,
} from '../components/BookingNotices'
import { getBookingById } from '../lib/storage'

export function Status() {
  const { id } = useParams<{ id: string }>()
  const { clientAcceptCounter, clientWalkAway, markDepositPaid } = useBookings()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [ack, setAck] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) {
        setBooking(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const row = await getBookingById(id)
      if (!cancelled) {
        setBooking(row)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function refresh() {
    if (!id) return
    const row = await getBookingById(id)
    setBooking(row)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-brand/60">Loading booking…</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand">Booking not found</h1>
        <p className="mt-2 text-sm text-brand/60">
          This link may be from another device or browser — try refreshing, or book again if needed.
        </p>
        <Link to="/book" className="btn-primary mt-6 inline-flex">
          Book again
        </Link>
      </div>
    )
  }

  const service = getServiceById(booking.serviceId)
  const isCustom = isCustomQuoteService(service)
  const isConfirmed = booking.status === 'confirmed'
  const isAwaitingDeposit = booking.status === 'awaiting_deposit'
  const isQuoteRequested = booking.status === 'quote_requested'
  const isCountered = booking.status === 'countered'
  const isPending = booking.status === 'pending'
  const isDeclined = booking.status === 'declined' || booking.status === 'cancelled'
  const deposit = booking.depositAmount ?? CONFIG.depositAmount

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="card-soft space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold text-brand">
            {isAwaitingDeposit
              ? 'Awaiting deposit'
              : isConfirmed
                ? 'Confirmed'
                : isQuoteRequested
                  ? 'Quote requested'
                  : isCountered && isCustom
                    ? 'Your quote'
                    : 'Your booking'}
          </h1>
          <StatusBadge status={booking.status} />
        </div>

        <p className="text-sm text-brand/65">
          {isAwaitingDeposit &&
            `Send your ${formatPrice(deposit)} Interac e-Transfer to ${CONFIG.depositEmail}. Your booking becomes Confirmed once Rolake marks the deposit received. Remaining balance is paid in person.`}
          {isConfirmed &&
            'Your deposit was received and your appointment is confirmed. See prep tips below.'}
          {isQuoteRequested &&
            'Your custom request is waiting for a quote. This time slot is held tentatively — check back here for the price.'}
          {isPending &&
            'Your offer is pending review. This time slot is held for you.'}
          {isCountered &&
            isCustom &&
            `Rolake quoted ${formatPrice(booking.counterAmount!)}. Accept to continue with the deposit, or decline to free the slot.`}
          {isCountered &&
            !isCustom &&
            `Rolake countered at ${formatPrice(booking.counterAmount!)}. Accept to continue, or walk away.`}
          {isDeclined && 'This request was declined and the time slot has been released.'}
          {!isAwaitingDeposit &&
            !isConfirmed &&
            !isQuoteRequested &&
            !isPending &&
            !isCountered &&
            !isDeclined &&
            'Status updates as Rolake reviews your request.'}
        </p>

        {isAwaitingDeposit && <DepositInstructions amount={deposit} />}

        <dl className="space-y-3 text-sm">
          <Row label="Service" value={service?.name ?? ''} />
          {booking.size && <Row label="Size" value={formatSizeLabel(booking.size)} />}
          {!isCustom && (
            <>
              <Row
                label="Length"
                value={getLengthOption(booking.lengthId ?? 'shoulder')?.label ?? 'Shoulder'}
              />
              <Row label="Add-ons" value={formatAddonsLabel(booking.addonIds)} />
            </>
          )}
          <Row label="Location" value={formatMobileLabel(booking)} />
          {booking.mobileService && booking.mobileAddress && (
            <Row label="Address" value={booking.mobileAddress} />
          )}
          <Row
            label="When"
            value={`${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`}
          />
          <Row
            label={
              isQuoteRequested
                ? 'Price'
                : booking.type === 'offer' && !isCustom
                  ? 'Your offer'
                  : 'Price'
            }
            value={
              isQuoteRequested
                ? 'Price on request'
                : isCountered || isAwaitingDeposit || isConfirmed
                  ? formatPrice(
                      booking.counterAmount ?? booking.offerAmount ?? booking.price,
                    )
                  : formatPrice(booking.offerAmount ?? booking.price)
            }
          />
          {isCountered && booking.counterAmount != null && !isCustom && (
            <Row label="Counter offer" value={formatPrice(booking.counterAmount)} />
          )}
          {booking.note && (
            <div className="rounded-xl bg-lilac/50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                {isCustom ? 'Your request' : 'Note'}
              </p>
              <p className="mt-1 text-brand">{booking.note}</p>
            </div>
          )}
          {booking.inspoUrl && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand/45">
                Inspo
              </p>
              <a
                href={booking.inspoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-xl border border-brand/10 bg-white p-2"
              >
                {/\.(mp4|mov|webm)(\?|$)/i.test(booking.inspoUrl) ? (
                  <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-lilac text-xs font-semibold text-accent">
                    Video
                  </span>
                ) : (
                  <img
                    src={booking.inspoUrl}
                    alt="Inspo"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <span className="text-sm font-semibold text-accent">Open inspo →</span>
              </a>
            </div>
          )}
          {(isAwaitingDeposit || isConfirmed) && (
            <Row
              label="Deposit"
              value={
                isConfirmed
                  ? `${formatPrice(deposit)} · received`
                  : booking.depositPaid
                    ? `${formatPrice(deposit)} · marked sent`
                    : formatPrice(deposit)
              }
            />
          )}
          {isConfirmed && !booking.mobileService && (
            <div className="rounded-xl bg-lilac/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                Studio address
              </p>
              <p className="mt-1 font-medium text-brand">{CONFIG.studioAddress}</p>
            </div>
          )}
          {isConfirmed && booking.mobileService && (
            <div className="rounded-xl bg-lilac/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                Mobile appointment
              </p>
              <p className="mt-1 font-medium text-brand">
                {booking.mobileAddress || 'Address on file'}
              </p>
            </div>
          )}
        </dl>

        {(isAwaitingDeposit || isConfirmed) && (
          <>
            <PrepInstructionsBlock />
            <CancelNoticeLine />
          </>
        )}

        {isAwaitingDeposit && !booking.depositPaid && (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-brand/80">
              <input
                type="checkbox"
                className="mt-1"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span>I have sent the {formatPrice(deposit)} e-Transfer deposit.</span>
            </label>
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={!ack}
              onClick={() => {
                void markDepositPaid(booking.id).then(() => refresh())
              }}
            >
              I’ve sent the deposit
            </button>
          </div>
        )}

        {isCountered && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                void clientAcceptCounter(booking.id).then(() => refresh())
              }}
            >
              Accept {formatPrice(booking.counterAmount!)} & continue
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => {
                void clientWalkAway(booking.id).then(() => refresh())
              }}
            >
              {isCustom ? 'Decline quote' : 'Walk away'}
            </button>
          </div>
        )}

        <Link to="/" className="btn-secondary inline-flex w-full">
          Back to home
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-brand/10 pb-2">
      <dt className="text-brand/50">{label}</dt>
      <dd className="text-right font-medium text-brand">{value}</dd>
    </div>
  )
}
