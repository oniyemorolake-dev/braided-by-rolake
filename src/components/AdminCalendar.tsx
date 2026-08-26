import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CONFIG,
  formatAddonsLabel,
  formatBraidBaseLabel,
  formatMediaConsentLabel,
  formatDateLabel,
  formatMobileLabel,
  formatPrice,
  formatSizeLabel,
  formatSlotLabel,
  getBookingDurationHours,
  getLengthOption,
  getServiceById,
  type Booking,
  type BookingStatus,
} from '../data'
import { StatusBadge } from './StatusBadge'
import { isInspoVideo } from '../lib/inspoUpload'
import { isBlockingStatus, minutesToSlot, slotToMinutes } from '../lib/scheduling'

type CalMode = 'week' | 'month'

const STATUS_BLOCK: Record<
  BookingStatus,
  { bar: string; buffer: string; text: string }
> = {
  confirmed: {
    bar: 'bg-emerald-500',
    buffer: 'bg-emerald-200/70',
    text: 'text-white',
  },
  awaiting_deposit: {
    bar: 'bg-violet-500',
    buffer: 'bg-violet-200/70',
    text: 'text-white',
  },
  pending: {
    bar: 'bg-amber-500',
    buffer: 'bg-amber-200/70',
    text: 'text-white',
  },
  quote_requested: {
    bar: 'bg-fuchsia-500',
    buffer: 'bg-fuchsia-200/70',
    text: 'text-white',
  },
  countered: {
    bar: 'bg-sky-500',
    buffer: 'bg-sky-200/70',
    text: 'text-white',
  },
  declined: {
    bar: 'bg-rose-300',
    buffer: 'bg-rose-100',
    text: 'text-rose-900',
  },
  cancelled: {
    bar: 'bg-rose-300',
    buffer: 'bg-rose-100',
    text: 'text-rose-900',
  },
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  const day = x.getDay() // 0 Sun
  const diff = day === 0 ? -6 : 1 - day // Monday start
  x.setDate(x.getDate() + diff)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function monthMatrix(anchor: Date): Date[][] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12)
  const start = startOfWeek(first)
  const weeks: Date[][] = []
  let cur = start
  for (let w = 0; w < 6; w++) {
    const row: Date[] = []
    for (let i = 0; i < 7; i++) {
      row.push(cur)
      cur = addDays(cur, 1)
    }
    weeks.push(row)
    if (cur.getMonth() !== anchor.getMonth() && w >= 3) break
  }
  return weeks
}

function dayOccupancy(
  dateIso: string,
  bookings: Booking[],
): { bookedMins: number; blocking: Booking[]; free: boolean; full: boolean } {
  const workStart = CONFIG.workStartHour * 60
  const workEnd = CONFIG.workEndHour * 60
  const workMins = workEnd - workStart
  const blocking = bookings
    .filter((b) => b.date === dateIso && isBlockingStatus(b.status))
    .sort((a, b) => a.slot.localeCompare(b.slot))
  let bookedMins = 0
  for (const b of blocking) {
    const dur = getBookingDurationHours(b) * 60
    bookedMins += dur + CONFIG.bufferMinutes
  }
  const free = blocking.length === 0
  const full = bookedMins >= workMins * 0.85
  return { bookedMins, blocking, free, full }
}

type AdminCalendarProps = {
  bookings: Booking[]
  onMarkDepositReceived: (id: string) => void
  onDecline: (id: string) => void
  onAcceptOffer: (id: string) => void
  onCounter: (id: string, amount: number) => void
}

export function AdminCalendar({
  bookings,
  onMarkDepositReceived,
  onDecline,
  onAcceptOffer,
  onCounter,
}: AdminCalendarProps) {
  const [mode, setMode] = useState<CalMode>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState<Booking | null>(null)
  const [counterDraft, setCounterDraft] = useState('')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setMode(mq.matches ? 'month' : 'week')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const todayIso = toIsoDate(new Date())
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )
  const months = useMemo(() => monthMatrix(anchor), [anchor])

  const workStart = CONFIG.workStartHour * 60
  const workEnd = CONFIG.workEndHour * 60
  const span = workEnd - workStart
  const hourMarks = useMemo(() => {
    const marks: number[] = []
    for (let m = workStart; m <= workEnd; m += 60) marks.push(m)
    return marks
  }, [workStart, workEnd])

  const calendarBookings = useMemo(
    () => bookings.filter((b) => b.status !== 'declined'),
    [bookings],
  )

  function goToday() {
    setAnchor(new Date())
  }

  function shift(dir: -1 | 1) {
    setAnchor((prev) => {
      const next = new Date(prev)
      if (mode === 'week') next.setDate(next.getDate() + dir * 7)
      else next.setMonth(next.getMonth() + dir)
      return next
    })
  }

  const headerLabel =
    mode === 'week'
      ? `${formatDateLabel(toIsoDate(weekDays[0]!))} – ${formatDateLabel(toIsoDate(weekDays[6]!))}`
      : anchor.toLocaleString('en-CA', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-2xl bg-lilac/70 p-1">
          {(
            [
              ['week', 'Week'],
              ['month', 'Month'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === key ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-secondary !px-3 !py-2 text-sm" onClick={goToday}>
          Today
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn-secondary !px-3 !py-2 text-sm"
          onClick={() => shift(-1)}
          aria-label="Previous"
        >
          ←
        </button>
        <p className="min-w-0 flex-1 text-center text-sm font-semibold text-brand sm:text-base">
          {headerLabel}
        </p>
        <button
          type="button"
          className="btn-secondary !px-3 !py-2 text-sm"
          onClick={() => shift(1)}
          aria-label="Next"
        >
          →
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] font-medium text-brand/55">
        <Legend color="bg-emerald-500" label="Confirmed" />
        <Legend color="bg-violet-500" label="Deposit" />
        <Legend color="bg-amber-500" label="Offer" />
        <Legend color="bg-fuchsia-500" label="Quote" />
        <Legend color="bg-sky-500" label="Countered" />
        <Legend color="bg-lilac-deep" label="60m buffer" />
      </div>

      {mode === 'week' ? (
        <WeekGrid
          days={weekDays}
          bookings={calendarBookings}
          todayIso={todayIso}
          workStart={workStart}
          span={span}
          hourMarks={hourMarks}
          onSelect={setSelected}
        />
      ) : (
        <MonthGrid
          weeks={months}
          anchor={anchor}
          bookings={calendarBookings}
          todayIso={todayIso}
          onSelectDay={(d) => {
            setAnchor(d)
            setMode('week')
          }}
          onSelectBooking={setSelected}
        />
      )}

      {selected && (
        <BookingDetailSheet
          booking={bookings.find((b) => b.id === selected.id) ?? selected}
          counterDraft={counterDraft}
          onCounterDraft={setCounterDraft}
          onClose={() => {
            setSelected(null)
            setCounterDraft('')
          }}
          onMarkDepositReceived={onMarkDepositReceived}
          onDecline={onDecline}
          onAcceptOffer={onAcceptOffer}
          onCounter={onCounter}
        />
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

function WeekGrid({
  days,
  bookings,
  todayIso,
  workStart,
  span,
  hourMarks,
  onSelect,
}: {
  days: Date[]
  bookings: Booking[]
  todayIso: string
  workStart: number
  span: number
  hourMarks: number[]
  onSelect: (b: Booking) => void
}) {
  // Mobile: stack days. Desktop: columns.
  return (
    <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] md:gap-1">
      <div className="hidden md:block" />
      {days.map((d) => {
        const iso = toIsoDate(d)
        const occ = dayOccupancy(iso, bookings)
        const isToday = iso === todayIso
        return (
          <div
            key={`head-${iso}`}
            className={`hidden rounded-xl px-1 py-1 text-center text-[11px] font-semibold md:block ${
              isToday ? 'bg-accent/15 text-accent' : 'text-brand/70'
            }`}
          >
            <span className="md:block">
              {d.toLocaleDateString('en-CA', { weekday: 'short' })}
            </span>
            <span className="md:block">{d.getDate()}</span>
            <span
              className={`mt-0.5 block text-[9px] font-medium ${
                occ.free ? 'text-emerald-600' : occ.full ? 'text-rose-600' : 'text-amber-700'
              }`}
            >
              {occ.free ? 'Free' : occ.full ? 'Full' : 'Open'}
            </span>
          </div>
        )
      })}

      {/* Mobile stacked day timelines */}
      <div className="space-y-4 md:hidden">
        {days.map((d) => {
          const iso = toIsoDate(d)
          const occ = dayOccupancy(iso, bookings)
          return (
            <div key={iso} className="card-soft overflow-hidden">
              <div className="flex items-center justify-between border-b border-brand/10 px-3 py-2">
                <p className="text-sm font-semibold text-brand">
                  {d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <span
                  className={`text-xs font-semibold ${
                    occ.free ? 'text-emerald-600' : occ.full ? 'text-rose-600' : 'text-amber-700'
                  }`}
                >
                  {occ.free ? 'Fully free' : occ.full ? 'Mostly booked' : 'Has openings'}
                </span>
              </div>
              <DayTimeline
                dateIso={iso}
                bookings={bookings}
                workStart={workStart}
                span={span}
                hourMarks={hourMarks}
                height={320}
                onSelect={onSelect}
              />
            </div>
          )
        })}
      </div>

      {/* Desktop multi-column */}
      <div className="col-span-full hidden md:contents">
        <div className="relative" style={{ height: 480 }}>
          {hourMarks.map((m) => {
            const top = ((m - workStart) / span) * 100
            return (
              <div
                key={m}
                className="absolute right-1 left-0 border-t border-brand/10 text-[9px] text-brand/40"
                style={{ top: `${top}%` }}
              >
                {minutesToSlot(m)}
              </div>
            )
          })}
        </div>
        {days.map((d) => {
          const iso = toIsoDate(d)
          return (
            <DayTimeline
              key={iso}
              dateIso={iso}
              bookings={bookings}
              workStart={workStart}
              span={span}
              hourMarks={hourMarks}
              height={480}
              onSelect={onSelect}
              showHours={false}
            />
          )
        })}
      </div>
    </div>
  )
}

function DayTimeline({
  dateIso,
  bookings,
  workStart,
  span,
  hourMarks,
  height,
  onSelect,
  showHours = true,
}: {
  dateIso: string
  bookings: Booking[]
  workStart: number
  span: number
  hourMarks: number[]
  height: number
  onSelect: (b: Booking) => void
  showHours?: boolean
}) {
  const dayBookings = bookings
    .filter((b) => b.date === dateIso && isBlockingStatus(b.status))
    .sort((a, b) => a.slot.localeCompare(b.slot))

  return (
    <div className="relative overflow-hidden bg-lilac/20" style={{ height }}>
      {showHours &&
        hourMarks.map((m) => {
          const top = ((m - workStart) / span) * 100
          return (
            <div
              key={m}
              className="absolute right-0 left-0 border-t border-brand/10"
              style={{ top: `${top}%` }}
            >
              <span className="absolute left-1 -translate-y-1/2 text-[9px] text-brand/40">
                {formatSlotLabel(minutesToSlot(m))}
              </span>
            </div>
          )
        })}
      {!showHours &&
        hourMarks.map((m) => {
          const top = ((m - workStart) / span) * 100
          return (
            <div
              key={m}
              className="absolute inset-x-0 border-t border-brand/5"
              style={{ top: `${top}%` }}
            />
          )
        })}

      {dayBookings.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-xs font-medium text-emerald-700/80">
          Free
        </p>
      )}

      {dayBookings.map((b) => {
        const start = slotToMinutes(b.slot)
        const durMins = getBookingDurationHours(b) * 60
        const topPct = ((start - workStart) / span) * 100
        const servicePct = (durMins / span) * 100
        const bufferPct = (CONFIG.bufferMinutes / span) * 100
        const colors = STATUS_BLOCK[b.status]
        const service = getServiceById(b.serviceId)
        const endSlot = minutesToSlot(start + durMins)
        return (
          <div key={b.id}>
            <button
              type="button"
              onClick={() => onSelect(b)}
              className={`absolute right-1 left-1 z-10 overflow-hidden rounded-lg px-1.5 py-0.5 text-left shadow-sm ${colors.bar} ${colors.text}`}
              style={{
                top: `${topPct}%`,
                height: `${Math.max(servicePct, 4)}%`,
                minHeight: 26,
              }}
            >
              <p className="truncate text-[10px] font-bold leading-tight sm:text-xs">
                {b.clientName}
              </p>
              <p className="truncate text-[9px] opacity-90">
                {formatSlotLabel(b.slot)}–{formatSlotLabel(endSlot)}
              </p>
              <p className="truncate text-[9px] opacity-80">{service?.name ?? b.serviceId}</p>
            </button>
            <div
              className={`pointer-events-none absolute right-1 left-1 z-[5] rounded-md ${colors.buffer}`}
              style={{
                top: `${topPct + Math.max(servicePct, 4)}%`,
                height: `${bufferPct}%`,
                minHeight: 6,
              }}
              title="60 min buffer"
            />
          </div>
        )
      })}
    </div>
  )
}

function MonthGrid({
  weeks,
  anchor,
  bookings,
  todayIso,
  onSelectDay,
  onSelectBooking,
}: {
  weeks: Date[][]
  anchor: Date
  bookings: Booking[]
  todayIso: string
  onSelectDay: (d: Date) => void
  onSelectBooking: (b: Booking) => void
}) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <div className="card-soft overflow-hidden p-2 sm:p-3">
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-brand/45">
        {labels.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((d) => {
          const iso = toIsoDate(d)
          const inMonth = d.getMonth() === anchor.getMonth()
          const occ = dayOccupancy(iso, bookings)
          const isToday = iso === todayIso
          const isWorkDay = CONFIG.workingDays.includes(d.getDay())
          return (
            <button
              key={iso + String(d.getMonth())}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelectDay(d)}
              className={`min-h-[4.5rem] rounded-xl border p-1 text-left transition sm:min-h-[5.5rem] ${
                !inMonth
                  ? 'border-transparent opacity-30'
                  : isToday
                    ? 'border-accent bg-accent/10'
                    : occ.free && isWorkDay
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : occ.full
                        ? 'border-rose-200 bg-rose-50/60'
                        : 'border-brand/10 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${inMonth ? 'text-brand' : 'text-brand/30'}`}
                >
                  {d.getDate()}
                </span>
                {inMonth && isWorkDay && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      occ.free ? 'bg-emerald-500' : occ.full ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                  />
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {occ.blocking.slice(0, 2).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`block w-full truncate rounded px-0.5 text-[8px] font-semibold leading-4 ${STATUS_BLOCK[b.status].bar} ${STATUS_BLOCK[b.status].text}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectBooking(b)
                    }}
                  >
                    {formatSlotLabel(b.slot)} {b.clientName.split(' ')[0]}
                  </button>
                ))}
                {occ.blocking.length > 2 && (
                  <p className="text-[8px] font-medium text-brand/50">
                    +{occ.blocking.length - 2} more
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BookingDetailSheet({
  booking,
  counterDraft,
  onCounterDraft,
  onClose,
  onMarkDepositReceived,
  onDecline,
  onAcceptOffer,
  onCounter,
}: {
  booking: Booking
  counterDraft: string
  onCounterDraft: (v: string) => void
  onClose: () => void
  onMarkDepositReceived: (id: string) => void
  onDecline: (id: string) => void
  onAcceptOffer: (id: string) => void
  onCounter: (id: string, amount: number) => void
}) {
  const service = getServiceById(booking.serviceId)
  const dur = getBookingDurationHours(booking)
  const start = slotToMinutes(booking.slot)
  const end = minutesToSlot(start + dur * 60)
  const isQuoteRequest = booking.status === 'quote_requested'
  const isOfferActionable = booking.status === 'pending'
  const needsDeposit = booking.status === 'awaiting_deposit'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-brand/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand">
              {service?.name ?? booking.serviceId}
            </h2>
            <p className="text-sm text-brand/60">
              {formatDateLabel(booking.date)} · {formatSlotLabel(booking.slot)}–
              {formatSlotLabel(end)}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="space-y-2 text-sm text-brand/80">
          <Row label="Client" value={booking.clientName} />
          <Row
            label="Phone"
            value={
              <a href={`tel:${booking.phone}`} className="font-medium text-accent">
                {booking.phone}
              </a>
            }
          />
          <Row
            label="Email"
            value={
              <a href={`mailto:${booking.email}`} className="font-medium text-accent">
                {booking.email}
              </a>
            }
          />
          <Row
            label="Price"
            value={
              isQuoteRequest
                ? 'On request'
                : formatPrice(booking.offerAmount ?? booking.price)
            }
          />
          {booking.counterAmount != null && (
            <Row label="Quote / counter" value={formatPrice(booking.counterAmount)} />
          )}
          <Row
            label="Deposit"
            value={`${formatPrice(booking.depositAmount ?? CONFIG.depositAmount)}${
              booking.status === 'confirmed'
                ? ' · received'
                : booking.depositPaid
                  ? ' · marked sent'
                  : ' · unpaid'
            }`}
          />
          {formatBraidBaseLabel(booking.addonIds) && (
            <Row label="Base" value={formatBraidBaseLabel(booking.addonIds)!} />
          )}
          {booking.size && <Row label="Size" value={formatSizeLabel(booking.size)} />}
          <Row
            label="Length"
            value={getLengthOption(booking.lengthId ?? 'shoulder')?.label ?? 'Shoulder'}
          />
          <Row label="Add-ons" value={formatAddonsLabel(booking.addonIds)} />
          <Row label="Media consent" value={formatMediaConsentLabel(booking.mediaConsent, booking.mediaFace)} />
          <Row
            label="Location"
            value={`${formatMobileLabel(booking)}${booking.mobileAddress ? ` — ${booking.mobileAddress}` : ''}`}
          />
          {booking.discountCode && (
            <Row
              label="Discount"
              value={`${booking.discountCode} (−${formatPrice(booking.discountAmount ?? 0)})`}
            />
          )}
        </dl>

        {booking.note && (
          <div className="mt-3 rounded-xl bg-lilac/50 px-3 py-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
              {isQuoteRequest ? 'Custom request' : 'Note'}
            </p>
            <p className="mt-1 text-brand">{booking.note}</p>
          </div>
        )}
        {booking.notesAccommodations && (
          <div className="mt-3 rounded-xl bg-lilac/50 px-3 py-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
              Allergies / accommodations
            </p>
            <p className="mt-1 text-brand">{booking.notesAccommodations}</p>
          </div>
        )}
        {booking.inspoUrl && (
          <a
            href={booking.inspoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-xl border border-brand/10 p-2"
          >
            {isInspoVideo(booking.inspoUrl) ? (
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
        )}

        <div className="mt-5 space-y-2 border-t border-brand/10 pt-4">
          {needsDeposit && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                void onMarkDepositReceived(booking.id)
                onClose()
              }}
            >
              Deposit received / Confirm
            </button>
          )}
          {isOfferActionable && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                void onAcceptOffer(booking.id)
                onClose()
              }}
            >
              Accept offer
            </button>
          )}
          {isQuoteRequest && (
            <div className="flex gap-2">
              <input
                className="input-field !py-2"
                type="number"
                min={1}
                placeholder="Quoted price"
                value={counterDraft}
                onChange={(e) => onCounterDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary shrink-0 !px-4 !py-2 text-sm"
                onClick={() => {
                  const n = Number(counterDraft)
                  if (!Number.isFinite(n) || n <= 0) return
                  void onCounter(booking.id, n)
                  onClose()
                }}
              >
                Send quote
              </button>
            </div>
          )}
          {isOfferActionable && (
            <div className="flex gap-2">
              <input
                className="input-field !py-2"
                type="number"
                min={1}
                placeholder="Counter amount"
                value={counterDraft}
                onChange={(e) => onCounterDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary shrink-0 !px-4 !py-2 text-sm"
                onClick={() => {
                  const n = Number(counterDraft)
                  if (!Number.isFinite(n) || n <= 0) return
                  void onCounter(booking.id, n)
                  onClose()
                }}
              >
                Counter
              </button>
            </div>
          )}
          {booking.status !== 'declined' && (
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => {
                if (confirm('Cancel / decline this booking? The slot and buffer will free up.')) {
                  void onDecline(booking.id)
                  onClose()
                }
              }}
            >
              Cancel / decline
            </button>
          )}
          <button type="button" className="w-full py-2 text-sm font-semibold text-brand/50" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-brand/5 pb-1.5">
      <dt className="text-brand/45">{label}</dt>
      <dd className="text-right font-medium text-brand">{value}</dd>
    </div>
  )
}
