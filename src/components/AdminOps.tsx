import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  formatDateLabel,
  formatPrice,
  formatSlotLabel,
  getServiceById,
  type Booking,
} from '../data'
import {
  buildOpsSummary,
  formatBookingLine,
} from '../lib/adminSummary'
import {
  REPLY_TEMPLATES,
  copyText,
  mailtoLink,
  smsLink,
} from '../lib/adminTemplates'
import {
  adminDeleteScheduleBlock,
  adminLoadScheduleBlocks,
  adminUpsertScheduleBlock,
  type ScheduleBlock,
} from '../lib/scheduleBlocks'
import {
  downloadBookingIcs,
  googleCalendarHomeUrl,
  googleCalendarUrl,
} from '../lib/googleCalendar'
import { runDueReminders } from '../lib/reminders'

export function AdminSummaryStrip({ bookings }: { bookings: Booking[] }) {
  const summary = useMemo(() => buildOpsSummary(bookings), [bookings])

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand/10 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Today</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">
            {summary.today.bookings.length}
          </p>
          <p className="text-xs text-brand/55">
            {summary.confirmedToday} confirmed · {summary.today.label}
          </p>
        </div>
        <div className="rounded-2xl border border-brand/10 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">This week</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">
            {summary.confirmedWeek}
          </p>
          <p className="text-xs text-brand/55">
            confirmed · ~{formatPrice(summary.revenueWeek)} booked
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">
            Needs reply
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber-950">
            {summary.pendingOffers}
          </p>
          <p className="text-xs text-amber-900/60">offers & quotes</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/70">
            Awaiting deposit
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-violet-950">
            {summary.awaitingDeposit}
          </p>
          <p className="text-xs text-violet-900/60">waiting on e-Transfer</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand/10 bg-lilac/40 px-4 py-4">
          <p className="font-semibold text-brand">Today’s schedule</p>
          {summary.today.bookings.length === 0 ? (
            <p className="mt-2 text-sm text-brand/55">No active bookings today.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm text-brand/80">
              {summary.today.bookings.map((b) => (
                <li key={b.id}>{formatBookingLine(b)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-brand/10 bg-white px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-brand">Week at a glance</p>
            <a
              href={googleCalendarHomeUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-accent hover:underline"
            >
              Open Google Calendar →
            </a>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-brand/75">
            {summary.week.map((day) => (
              <li key={day.date} className="flex justify-between gap-2">
                <span className={day.date === summary.today.date ? 'font-semibold text-brand' : ''}>
                  {day.label}
                </span>
                <span className="tabular-nums text-brand/50">
                  {day.bookings.length === 0 ? '—' : `${day.bookings.length} appt`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function AdminBlocksPanel({ onChanged }: { onChanged?: () => void }) {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [fullDay, setFullDay] = useState(true)
  const [startSlot, setStartSlot] = useState('09:00')
  const [endSlot, setEndSlot] = useState('13:00')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setBlocks(await adminLoadScheduleBlocks())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load blocks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!date) return
    setSaving(true)
    setError('')
    try {
      await adminUpsertScheduleBlock({
        date,
        startSlot: fullDay ? undefined : startSlot,
        endSlot: fullDay ? undefined : endSlot,
        note: note.trim() || undefined,
      })
      setNote('')
      await refresh()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save block.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-brand">Block off time</h2>
        <p className="mt-1 text-sm text-brand/60">
          Blocked days/times disappear from the public booking calendar. Use this for days off,
          errands, or personal plans — then mirror them in Google Calendar if you like.
        </p>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <form className="card-soft space-y-3 p-4" onSubmit={(e) => void handleAdd(e)}>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-brand/55">Date</span>
            <input
              className="input-field mt-1 !py-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-brand/80">
            <input
              type="checkbox"
              checked={fullDay}
              onChange={(e) => setFullDay(e.target.checked)}
            />
            Full day off
          </label>
          {!fullDay && (
            <>
              <label className="text-sm">
                <span className="text-brand/55">From</span>
                <input
                  className="input-field mt-1 !py-2"
                  type="time"
                  value={startSlot}
                  onChange={(e) => setStartSlot(e.target.value)}
                  required
                />
              </label>
              <label className="text-sm">
                <span className="text-brand/55">Until</span>
                <input
                  className="input-field mt-1 !py-2"
                  type="time"
                  value={endSlot}
                  onChange={(e) => setEndSlot(e.target.value)}
                  required
                />
              </label>
            </>
          )}
          <label className="text-sm sm:col-span-2">
            <span className="text-brand/55">Note (private)</span>
            <input
              className="input-field mt-1 !py-2"
              placeholder="e.g. doctor, family day"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="btn-primary !px-4 !py-2 text-sm" disabled={saving}>
          {saving ? 'Saving…' : 'Add block'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-brand/50">Loading blocks…</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-brand/55">No blocks yet — your full working hours are open.</p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/10 bg-white px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium text-brand">{formatDateLabel(b.date)}</p>
                <p className="text-brand/55">
                  {b.startSlot && b.endSlot
                    ? `${formatSlotLabel(b.startSlot)} – ${formatSlotLabel(b.endSlot)}`
                    : 'Full day'}
                  {b.note ? ` · ${b.note}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-rose-600 hover:underline"
                onClick={() => {
                  void adminDeleteScheduleBlock(b.id)
                    .then(() => {
                      void refresh()
                      onChanged?.()
                    })
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Could not delete.'),
                    )
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AdminRemindersPanel({
  bookings,
  onDone,
}: {
  bookings: Booking[]
  onDone?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string>('')

  return (
    <div className="space-y-3 rounded-2xl border border-brand/10 bg-white px-4 py-4">
      <h2 className="font-display text-xl font-semibold text-brand">Email reminders (free)</h2>
      <p className="text-sm leading-relaxed text-brand/65">
        Uses your existing Web3Forms email — <strong>no SMS fees</strong>. Sends deposit nudges
        (awaiting deposit 12+ hours) and day-before prep emails for confirmed appointments. Run this
        once a day from here (or whenever you open admin).
      </p>
      <button
        type="button"
        className="btn-primary !px-4 !py-2 text-sm"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setResult('')
          void runDueReminders(bookings)
            .then((r) => {
              setResult(
                `Sent ${r.depositSent} deposit reminder(s), ${r.dayBeforeSent} day-before. Skipped ${r.skipped}.${
                  r.errors.length ? ` Errors: ${r.errors.slice(0, 3).join('; ')}` : ''
                }`,
              )
              onDone?.()
            })
            .catch((err) => {
              setResult(err instanceof Error ? err.message : 'Reminder run failed.')
            })
            .finally(() => setBusy(false))
        }}
      >
        {busy ? 'Sending…' : 'Send due reminders now'}
      </button>
      {result && <p className="text-sm text-brand/70">{result}</p>}
    </div>
  )
}

export function AdminQuickReplies({ booking }: { booking: Booking }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const service = getServiceById(booking.serviceId)

  return (
    <div className="mt-4 border-t border-brand/10 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Quick replies</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {REPLY_TEMPLATES.map((t) => {
          const body = t.body(booking)
          return (
            <div key={t.id} className="flex flex-wrap gap-1">
              <button
                type="button"
                className="rounded-full border border-brand/15 bg-white px-3 py-1.5 text-xs font-medium text-brand hover:border-accent/40"
                onClick={() => {
                  void copyText(body).then((ok) => {
                    if (ok) {
                      setCopiedId(t.id)
                      window.setTimeout(() => setCopiedId(null), 1500)
                    }
                  })
                }}
              >
                {copiedId === t.id ? 'Copied!' : t.label}
              </button>
              <a
                href={smsLink(booking.phone, body)}
                className="rounded-full border border-brand/10 px-2 py-1.5 text-xs text-accent hover:underline"
              >
                SMS
              </a>
              <a
                href={mailtoLink(
                  booking.email,
                  `${service?.name ?? 'Appointment'} — Braided by Rolake`,
                  body,
                )}
                className="rounded-full border border-brand/10 px-2 py-1.5 text-xs text-accent hover:underline"
              >
                Email
              </a>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={googleCalendarUrl(booking)}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-accent hover:underline"
        >
          Add to Google Calendar
        </a>
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={() => downloadBookingIcs(booking)}
        >
          Download .ics
        </button>
      </div>
    </div>
  )
}
