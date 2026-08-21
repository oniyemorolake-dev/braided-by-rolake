import { Link, useParams } from 'react-router-dom'
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

export function Status() {
  const { id } = useParams<{ id: string }>()
  const { getBooking, clientAcceptCounter, clientWalkAway } = useBookings()
  const booking = id ? getBooking(id) : undefined

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand">Booking not found</h1>
        <p className="mt-2 text-sm text-brand/60">
          This link may be from another device or browser — bookings are stored locally for now.
        </p>
        <Link to="/book" className="btn-primary mt-6 inline-flex">
          Book again
        </Link>
      </div>
    )
  }

  const service = getServiceById(booking.serviceId)
  const isConfirmed = booking.status === 'confirmed'
  const isCountered = booking.status === 'countered'

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="card-soft p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold text-brand">Your booking</h1>
          <StatusBadge status={booking.status} />
        </div>

        <p className="mt-2 text-sm text-brand/65">
          Status updates live as Rolake reviews your request: Pending → Accepted / Countered /
          Declined → Confirmed.
        </p>

        <dl className="mt-6 space-y-3 text-sm">
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
          <Row
            label="Deposit"
            value={formatPrice(booking.depositAmount ?? CONFIG.depositAmount)}
          />
          {isConfirmed && !booking.mobileService && (
            <div className="rounded-xl bg-lilac/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                Studio address
              </p>
              <p className="mt-1 font-medium text-brand">{CONFIG.studioAddress}</p>
              <p className="mt-2 text-xs text-brand/60">
                Arrive with hair pre-stretched. Extensions only if requested in advance.
              </p>
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
              <p className="mt-2 text-xs text-brand/60">
                Rolake comes to you. Have hair clean and pre-stretched.
              </p>
            </div>
          )}
        </dl>

        {isCountered && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => clientAcceptCounter(booking.id)}
            >
              Accept {formatPrice(booking.counterAmount!)} & confirm
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => clientWalkAway(booking.id)}
            >
              Walk away
            </button>
          </div>
        )}

        <Link to="/" className="btn-secondary mt-6 inline-flex w-full">
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
