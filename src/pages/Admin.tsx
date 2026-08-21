import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CONFIG,
  formatDateLabel,
  formatPrice,
  formatSlotLabel,
  formatSizeLabel,
  formatAddonsLabel,
  formatMobileLabel,
  getLengthOption,
  getServiceById,
  type Booking,
} from '../data'
import { useBookings } from '../context/BookingContext'
import { StatusBadge } from '../components/StatusBadge'

type Tab = 'all' | 'pending' | 'confirmed'

export function Admin() {
  const {
    bookings,
    acceptOffer,
    declineOffer,
    counterOffer,
    clearAllBookings,
  } = useBookings()

  const [authed, setAuthed] = useState(() => sessionStorage.getItem('bbr_admin') === '1')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('pending')
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>({})

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (password === CONFIG.adminPassword) {
      sessionStorage.setItem('bbr_admin', '1')
      setAuthed(true)
      setLoginError('')
    } else {
      setLoginError('Incorrect password.')
    }
  }

  function logout() {
    sessionStorage.removeItem('bbr_admin')
    setAuthed(false)
  }

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    if (tab === 'pending') {
      return sorted.filter((b) => b.status === 'pending' || b.status === 'countered')
    }
    if (tab === 'confirmed') {
      return sorted.filter((b) => b.status === 'confirmed')
    }
    return sorted
  }, [bookings, tab])

  const confirmedByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    bookings
      .filter((b) => b.status === 'confirmed')
      .forEach((b) => {
        const list = map.get(b.date) ?? []
        list.push(b)
        map.set(b.date, list)
      })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [bookings])

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-12">
        <h1 className="font-display text-3xl font-semibold text-brand">Admin</h1>
        <p className="mt-2 text-sm text-brand/60">
          Sign in to manage bookings and offers. Change the password in{' '}
          <code className="text-accent">src/data.ts</code> before going live.
        </p>
        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {loginError && <p className="text-sm text-rose-600">{loginError}</p>}
          <button type="submit" className="btn-primary w-full">
            Enter dashboard
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand">Dashboard</h1>
          <p className="text-sm text-brand/60">{bookings.length} total bookings & offers</p>
        </div>
        <button type="button" onClick={logout} className="btn-secondary !px-4 !py-2 text-sm">
          Log out
        </button>
      </div>

      <div className="mt-6 flex gap-1 rounded-2xl bg-lilac/70 p-1">
        {(
          [
            ['pending', 'Offers'],
            ['confirmed', 'Confirmed'],
            ['all', 'All'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
              tab === key ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'confirmed' && confirmedByDate.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-brand">By date</h2>
          {confirmedByDate.map(([date, list]) => (
            <div key={date} className="card-soft p-4">
              <p className="font-semibold text-brand">{formatDateLabel(date)}</p>
              <ul className="mt-2 space-y-2">
                {list
                  .sort((a, b) => a.slot.localeCompare(b.slot))
                  .map((b) => (
                    <li key={b.id} className="flex justify-between gap-2 text-sm text-brand/75">
                      <span>
                        {formatSlotLabel(b.slot)} · {getServiceById(b.serviceId)?.name} ·{' '}
                        {b.clientName}
                      </span>
                      <span className="font-medium">{formatPrice(b.price)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="card-soft px-6 py-12 text-center">
            <p className="font-display text-2xl text-brand">Nothing here yet</p>
            <p className="mt-2 text-sm text-brand/60">
              {tab === 'pending'
                ? 'New client offers will show up here for Accept / Counter / Decline.'
                : 'Confirmed appointments will appear as clients book.'}
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const service = getServiceById(b.serviceId)
            const isOfferActionable = b.status === 'pending'
            return (
              <article key={b.id} className="card-soft p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-xl font-semibold text-brand">
                      {service?.name ?? b.serviceId}
                    </p>
                    <p className="text-sm text-brand/60">
                      {formatDateLabel(b.date)} · {formatSlotLabel(b.slot)}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <dl className="mt-3 grid gap-1 text-sm text-brand/75 sm:grid-cols-2">
                  <div>
                    <span className="text-brand/45">Client · </span>
                    {b.clientName}
                  </div>
                  <div>
                    <span className="text-brand/45">Phone · </span>
                    <a href={`tel:${b.phone}`} className="text-accent">
                      {b.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-brand/45">Email · </span>
                    <a href={`mailto:${b.email}`} className="text-accent">
                      {b.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-brand/45">
                      {b.type === 'offer' ? 'Offer · ' : 'Price · '}
                    </span>
                    {formatPrice(b.offerAmount ?? b.price)}
                    {b.counterAmount != null && (
                      <span> → counter {formatPrice(b.counterAmount)}</span>
                    )}
                  </div>
                  {b.size && (
                    <div>
                      <span className="text-brand/45">Size · </span>
                      {formatSizeLabel(b.size)}
                    </div>
                  )}
                  <div>
                    <span className="text-brand/45">Length · </span>
                    {getLengthOption(b.lengthId ?? 'shoulder')?.label ?? 'Shoulder'}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-brand/45">Add-ons · </span>
                    {formatAddonsLabel(b.addonIds)}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-brand/45">Location · </span>
                    {formatMobileLabel(b)}
                    {b.mobileAddress ? ` — ${b.mobileAddress}` : ''}
                  </div>
                  <div>
                    <span className="text-brand/45">Deposit · </span>
                    {formatPrice(b.depositAmount ?? CONFIG.depositAmount)}
                    {b.depositPaid ? ' · paid (client marked)' : ' · unpaid'}
                  </div>
                  {b.note && (
                    <div className="sm:col-span-2">
                      <span className="text-brand/45">Note · </span>
                      {b.note}
                    </div>
                  )}
                  <div className="sm:col-span-2 font-mono text-xs text-brand/40">{b.id}</div>
                </dl>

                {isOfferActionable && (
                  <div className="mt-4 space-y-2 border-t border-brand/10 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary !px-4 !py-2 text-sm"
                        onClick={() => acceptOffer(b.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn-secondary !px-4 !py-2 text-sm"
                        onClick={() => declineOffer(b.id)}
                      >
                        Decline
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="input-field !py-2"
                        type="number"
                        min={1}
                        placeholder="Counter amount"
                        value={counterDrafts[b.id] ?? ''}
                        onChange={(e) =>
                          setCounterDrafts((d) => ({ ...d, [b.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="btn-secondary shrink-0 !px-4 !py-2 text-sm"
                        onClick={() => {
                          const n = Number(counterDrafts[b.id])
                          if (!Number.isFinite(n) || n <= 0) return
                          counterOffer(b.id, n)
                        }}
                      >
                        Counter
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      <div className="mt-10 border-t border-brand/10 pt-6">
        <button
          type="button"
          className="text-xs text-rose-600/80 hover:underline"
          onClick={() => {
            if (confirm('Clear all local bookings? This cannot be undone.')) {
              clearAllBookings()
            }
          }}
        >
          Clear all local data
        </button>
        <p className="mt-2 text-xs text-brand/40">
          Data is stored in this browser&apos;s localStorage until you connect Supabase.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          ← Back to site
        </Link>
      </div>
    </div>
  )
}
