import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
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
} from '../data'
import { useBookings } from '../context/BookingContext'
import { StatusBadge } from '../components/StatusBadge'
import {
  CancelNoticeLine,
  DepositInstructions,
  PrepInstructionsBlock,
} from '../components/BookingNotices'

export function Status() {
  const { id } = useParams<{ id: string }>()
  const { getBooking, clientAcceptCounter, clientWalkAway, markDepositPaid } = useBookings()
  const booking = id ? getBooking(id) : undefined
  const [ack, setAck] = useState(false)

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
  const isConfirmed = booking.status === 'confirmed'
  const isAwaitingDeposit = booking.status === 'awaiting_deposit'
  const isCountered = booking.status === 'countered'
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
                : 'Your booking'}
          </h1>
          <StatusBadge status={booking.status} />
        </div>

        <p className="text-sm text-brand/65">
          {isAwaitingDeposit &&
            `Send your ${formatPrice(deposit)} Interac e-Transfer to ${CONFIG.depositEmail}. Your booking becomes Confirmed once Rolake marks the deposit received. Remaining balance is paid in person.`}
          {isConfirmed &&
            'Your deposit was received and your appointment is confirmed. See prep tips below.'}
          {!isAwaitingDeposit &&
            !isConfirmed &&
            'Status updates as Rolake reviews your request: Pending → Accepted → Awaiting deposit → Confirmed.'}
        </p>

        {isAwaitingDeposit && <DepositInstructions amount={deposit} />}

        <dl className="space-y-3 text-sm">
          <Row label="Service" value={service?.name ?? ''} />
          {booking.size && <Row label="Size" value={formatSizeLabel(booking.size)} />}
          <Row
            label="Length"
            value={getLengthOption(booking.lengthId ?? 'shoulder')?.label ?? 'Shoulder'}
          />
          <Row label="Add-ons" value={formatAddonsLabel(booking.addonIds)} />
          <Row label="Location" value={formatMobileLabel(booking)} />
          {booking.mobileService && booking.mobileAddress && (
            <Row label="Address" value={booking.mobileAddress} />
          )}
          <Row
            label="When"
            value={`${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`}
          />
          <Row
            label={booking.type === 'offer' ? 'Your offer' : 'Price'}
            value={formatPrice(booking.offerAmount ?? booking.price)}
          />
          {booking.counterAmount != null && (
            <Row label="Counter offer" value={formatPrice(booking.counterAmount)} />
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
              onClick={() => void markDepositPaid(booking.id)}
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
              onClick={() => void clientAcceptCounter(booking.id)}
            >
              Accept {formatPrice(booking.counterAmount!)} & continue
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => void clientWalkAway(booking.id)}
            >
              Walk away
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
