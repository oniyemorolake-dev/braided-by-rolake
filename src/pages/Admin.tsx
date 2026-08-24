import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CONFIG,
  formatDateLabel,
  formatPrice,
  formatSlotLabel,
  formatSizeLabel,
  formatAddonsLabel,
  formatBraidBaseLabel,
  formatMobileLabel,
  getLengthOption,
  getServiceById,
  type Booking,
  type DiscountType,
} from '../data'
import { useBookings } from '../context/BookingContext'
import { StatusBadge } from '../components/StatusBadge'
import { StarRating } from '../components/StarRating'
import { isInspoVideo } from '../lib/inspoUpload'
import {
  loadAllReviewsAdmin,
  setReviewStatusAdmin,
  type Review,
  type ReviewStatus,
} from '../lib/reviews'
import {
  adminCreateDiscount,
  adminListDiscounts,
  adminSetDiscountStatus,
  discountTypeLabel,
  type DiscountRecord,
} from '../lib/discounts'
import { AdminCalendar } from '../components/AdminCalendar'
import { notifyOwnerOfCancellation } from '../lib/notifications'

type Tab = 'all' | 'pending' | 'awaiting' | 'confirmed'
type Panel = 'bookings' | 'reviews' | 'discounts'

export function Admin() {
  const {
    bookings,
    loading,
    storageMode,
    refreshBookings,
    acceptOffer,
    declineOffer,
    counterOffer,
    markDepositReceived,
    clearAllBookings,
  } = useBookings()

  const [authed, setAuthed] = useState(() => sessionStorage.getItem('bbr_admin') === '1')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('pending')
  const [panel, setPanel] = useState<Panel>('bookings')
  const [bookingsView, setBookingsView] = useState<'list' | 'calendar'>('list')
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null)
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([])
  const [discountsLoading, setDiscountsLoading] = useState(false)
  const [discountsError, setDiscountsError] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState<DiscountType>('promo')
  const [newAmount, setNewAmount] = useState('15')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [creatingDiscount, setCreatingDiscount] = useState(false)

  async function refreshReviews() {
    setReviewsLoading(true)
    setReviewsError('')
    try {
      const list = await loadAllReviewsAdmin()
      setReviews(list)
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : 'Could not load reviews.')
    } finally {
      setReviewsLoading(false)
    }
  }

  async function refreshDiscounts() {
    setDiscountsLoading(true)
    setDiscountsError('')
    try {
      const list = await adminListDiscounts()
      setDiscounts(list)
    } catch (err) {
      setDiscountsError(err instanceof Error ? err.message : 'Could not load discounts.')
    } finally {
      setDiscountsLoading(false)
    }
  }

  useEffect(() => {
    if (!authed) return
    void refreshBookings()
  }, [authed, refreshBookings])

  useEffect(() => {
    if (!authed || panel !== 'reviews') return
    void refreshReviews()
  }, [authed, panel])

  useEffect(() => {
    if (!authed || panel !== 'discounts') return
    void refreshDiscounts()
  }, [authed, panel])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setBookingsView(mq.matches ? 'calendar' : 'list')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  async function handleDecline(id: string) {
    const booking = bookings.find((b) => b.id === id)
    await declineOffer(id)
    if (booking) void notifyOwnerOfCancellation(booking)
  }

  async function moderateReview(id: string, status: ReviewStatus) {
    setReviewBusyId(id)
    setReviewsError('')
    try {
      const updated = await setReviewStatusAdmin(id, status)
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)))
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : 'Could not update review.')
    } finally {
      setReviewBusyId(null)
    }
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (password === CONFIG.adminPassword) {
      sessionStorage.setItem('bbr_admin', '1')
      setAuthed(true)
      setLoginError('')
      void refreshBookings()
    } else {
      setLoginError('Incorrect password.')
    }
  }

  function logout() {
    sessionStorage.removeItem('bbr_admin')
    setAuthed(false)
  }

  const tabCounts = useMemo(() => {
    let pending = 0
    let awaiting = 0
    let confirmed = 0
    for (const b of bookings) {
      if (b.status === 'pending' || b.status === 'quote_requested' || b.status === 'countered') {
        pending += 1
      } else if (b.status === 'awaiting_deposit') {
        awaiting += 1
      } else if (b.status === 'confirmed') {
        confirmed += 1
      }
    }
    return { pending, awaiting, confirmed, all: bookings.length }
  }, [bookings])

  const filtered = useMemo(() => {
    const list =
      tab === 'pending'
        ? bookings.filter(
            (b) =>
              b.status === 'pending' ||
              b.status === 'quote_requested' ||
              b.status === 'countered',
          )
        : tab === 'awaiting'
          ? bookings.filter((b) => b.status === 'awaiting_deposit')
          : tab === 'confirmed'
            ? bookings.filter((b) => b.status === 'confirmed')
            : [...bookings]

    return [...list].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date)
      if (byDate !== 0) return byDate
      const bySlot = a.slot.localeCompare(b.slot)
      if (bySlot !== 0) return bySlot
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [bookings, tab])

  /** Group current list by appointment date for a clear schedule view */
  const filteredByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of filtered) {
      const list = map.get(b.date) ?? []
      list.push(b)
      map.set(b.date, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const needsAttention = tabCounts.pending + tabCounts.awaiting

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-12">
        <h1 className="font-display text-3xl font-semibold text-brand">Admin</h1>
        <p className="mt-2 text-sm text-brand/60">
          Sign in to manage bookings, offers, and reviews. Change the password in{' '}
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
    <div className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 ${bookingsView === 'calendar' && panel === 'bookings' ? 'max-w-6xl' : 'max-w-3xl'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand">Dashboard</h1>
          <p className="text-sm text-brand/60">
            {loading
              ? 'Loading…'
              : `${bookings.length} saved · ${needsAttention} need action · ${tabCounts.confirmed} confirmed`}
            {' · '}
            {storageMode === 'supabase' ? 'Synced online (Supabase)' : 'Local only (this browser)'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary !px-4 !py-2 text-sm"
            disabled={refreshing || reviewsLoading || discountsLoading}
            onClick={() => {
              if (panel === 'reviews') {
                void refreshReviews()
                return
              }
              if (panel === 'discounts') {
                void refreshDiscounts()
                return
              }
              setRefreshing(true)
              void refreshBookings().finally(() => setRefreshing(false))
            }}
          >
            {refreshing || reviewsLoading || discountsLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" onClick={logout} className="btn-secondary !px-4 !py-2 text-sm">
            Log out
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-1 rounded-2xl bg-brand/5 p-1">
        {(
          [
            ['bookings', 'Bookings'],
            ['reviews', 'Reviews'],
            ['discounts', 'Discounts'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPanel(key)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              panel === key ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === 'discounts' ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-brand/60">
            All discount codes in one place. Public clients can only validate a single code — they
            cannot list codes. Create review thank-you codes with the client&apos;s email.
          </p>
          {discountsError && <p className="text-sm text-rose-600">{discountsError}</p>}

          <form
            className="card-soft space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              const amount = Number(newAmount)
              if (!newCode.trim() || !Number.isFinite(amount) || amount <= 0) return
              setCreatingDiscount(true)
              void adminCreateDiscount({
                code: newCode,
                type: newType,
                amount,
                ownerEmail: newOwnerEmail || undefined,
                note: newType === 'referral' ? 'invite' : undefined,
              })
                .then(() => {
                  setNewCode('')
                  setNewOwnerEmail('')
                  return refreshDiscounts()
                })
                .catch((err) => {
                  setDiscountsError(err instanceof Error ? err.message : 'Could not create code.')
                })
                .finally(() => setCreatingDiscount(false))
            }}
          >
            <p className="font-semibold text-brand">Create code</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="input-field !py-2"
                placeholder="CODE"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                required
              />
              <select
                className="input-field !py-2"
                value={newType}
                onChange={(e) => setNewType(e.target.value as DiscountType)}
              >
                {(['promo', 'review', 'first_time', 'referral', 'loyalty'] as DiscountType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {discountTypeLabel(t)}
                    </option>
                  ),
                )}
              </select>
              <input
                className="input-field !py-2"
                type="number"
                min={1}
                placeholder="Amount $"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
              <input
                className="input-field !py-2"
                type="email"
                placeholder="Owner email (loyalty/review/referral)"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary !px-4 !py-2 text-sm" disabled={creatingDiscount}>
              {creatingDiscount ? 'Creating…' : 'Create discount'}
            </button>
          </form>

          {discountsLoading && discounts.length === 0 ? (
            <p className="text-sm text-brand/50">Loading discounts…</p>
          ) : discounts.length === 0 ? (
            <div className="card-soft px-6 py-12 text-center">
              <p className="font-display text-2xl text-brand">No codes yet</p>
            </div>
          ) : (
            discounts.map((d) => (
              <article key={d.id} className="card-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-lg font-semibold text-brand">{d.code}</p>
                    <p className="text-sm text-brand/60">
                      {discountTypeLabel(d.type)} · {formatPrice(d.amount)}
                      {d.note ? ` · ${d.note}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-brand/45">
                      Owner: {d.ownerEmail || '—'}
                      {d.usedByEmail ? ` · Used by ${d.usedByEmail}` : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      d.status === 'unused'
                        ? 'bg-emerald-50 text-emerald-700'
                        : d.status === 'used'
                          ? 'bg-brand/10 text-brand/70'
                          : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.status !== 'disabled' && (
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                      onClick={() => {
                        void adminSetDiscountStatus(d.id, 'disabled')
                          .then(() => refreshDiscounts())
                          .catch((err) =>
                            setDiscountsError(
                              err instanceof Error ? err.message : 'Could not disable.',
                            ),
                          )
                      }}
                    >
                      Disable
                    </button>
                  )}
                  {d.status === 'disabled' && (
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                      onClick={() => {
                        void adminSetDiscountStatus(d.id, 'unused')
                          .then(() => refreshDiscounts())
                          .catch((err) =>
                            setDiscountsError(
                              err instanceof Error ? err.message : 'Could not re-enable.',
                            ),
                          )
                      }}
                    >
                      Re-enable
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      ) : panel === 'reviews' ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-brand/60">
            New reviews start as pending. Approve to show them on the site, or hide anytime.
          </p>
          {reviewsError && <p className="text-sm text-rose-600">{reviewsError}</p>}
          {reviewsLoading && reviews.length === 0 ? (
            <p className="text-sm text-brand/50">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <div className="card-soft px-6 py-12 text-center">
              <p className="font-display text-2xl text-brand">No reviews yet</p>
              <p className="mt-2 text-sm text-brand/60">
                When clients submit a review, it will appear here for approval.
              </p>
            </div>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="card-soft p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-xl font-semibold text-brand">{r.name}</p>
                    {r.style && (
                      <p className="text-xs font-medium uppercase tracking-wide text-accent/80">
                        {r.style}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : r.status === 'hidden'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-2">
                  <StarRating rating={r.rating} size="sm" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand/75">&ldquo;{r.text}&rdquo;</p>
                <p className="mt-2 font-mono text-xs text-brand/35">
                  {new Date(r.createdAt).toLocaleString()} · {r.id}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-brand/10 pt-4">
                  {r.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn-primary !px-4 !py-2 text-sm"
                      disabled={reviewBusyId === r.id}
                      onClick={() => void moderateReview(r.id, 'approved')}
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== 'hidden' && (
                    <button
                      type="button"
                      className="btn-secondary !px-4 !py-2 text-sm"
                      disabled={reviewBusyId === r.id}
                      onClick={() => void moderateReview(r.id, 'hidden')}
                    >
                      Hide
                    </button>
                  )}
                  {r.status === 'hidden' && (
                    <button
                      type="button"
                      className="btn-secondary !px-4 !py-2 text-sm"
                      disabled={reviewBusyId === r.id}
                      onClick={() => void moderateReview(r.id, 'pending')}
                    >
                      Mark pending
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <>
      <div className="mt-6 flex gap-1 rounded-2xl bg-brand/5 p-1">
        {(
          [
            ['list', 'List'],
            ['calendar', 'Calendar'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setBookingsView(key)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              bookingsView === key ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {bookingsView === 'calendar' ? (
        <div className="mt-6">
          <AdminCalendar
            bookings={bookings}
            onMarkDepositReceived={(id) => void markDepositReceived(id)}
            onDecline={(id) => void handleDecline(id)}
            onAcceptOffer={(id) => void acceptOffer(id)}
            onCounter={(id, amount) => void counterOffer(id, amount)}
          />
        </div>
      ) : (
        <>
      <div className="mt-6 flex flex-wrap gap-1 rounded-2xl bg-lilac/70 p-1">
        {(
          [
            ['pending', 'Offers & quotes', tabCounts.pending],
            ['awaiting', 'Awaiting deposit', tabCounts.awaiting],
            ['confirmed', 'Confirmed', tabCounts.confirmed],
            ['all', 'All', tabCounts.all],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold sm:text-sm ${
              tab === key ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
            }`}
          >
            {label}
            <span className={`ml-1 tabular-nums ${tab === key ? 'text-accent' : 'text-brand/40'}`}>
              ({count})
            </span>
          </button>
        ))}
      </div>

      {filteredByDate.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-brand">
            {tab === 'confirmed'
              ? 'Confirmed schedule'
              : tab === 'awaiting'
                ? 'Waiting on deposit'
                : tab === 'pending'
                  ? 'Needs your reply'
                  : 'By appointment date'}
          </h2>
          {filteredByDate.map(([date, list]) => (
            <div key={date} className="card-soft p-4">
              <p className="font-semibold text-brand">{formatDateLabel(date)}</p>
              <ul className="mt-2 space-y-2">
                {list.map((b) => (
                  <li key={b.id} className="flex justify-between gap-2 text-sm text-brand/75">
                    <span>
                      {formatSlotLabel(b.slot)} · {getServiceById(b.serviceId)?.name} ·{' '}
                      {b.clientName || 'Client'}
                      <span className="ml-1 text-brand/45">({b.status.replace(/_/g, ' ')})</span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {b.status === 'quote_requested' ? 'Quote' : formatPrice(b.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-brand">Details</h2>
        {filtered.length === 0 ? (
          <div className="card-soft px-6 py-12 text-center">
            <p className="font-display text-2xl text-brand">Nothing here yet</p>
            <p className="mt-2 text-sm text-brand/60">
              {tab === 'pending'
                ? 'New offers and custom quote requests show up here.'
                : tab === 'awaiting'
                  ? 'Bookings waiting on deposit appear here — tap Deposit received when paid.'
                  : tab === 'confirmed'
                    ? 'Confirmed appointments will appear as deposits are marked received.'
                    : 'New client bookings are saved to Supabase and listed here automatically.'}
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const service = getServiceById(b.serviceId)
            const isQuoteRequest = b.status === 'quote_requested'
            const isOfferActionable = b.status === 'pending'
            const needsDepositConfirm = b.status === 'awaiting_deposit'
            return (
              <article key={b.id} className="card-soft p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-xl font-semibold text-brand">
                      {service?.name ?? b.serviceId}
                      {isQuoteRequest && (
                        <span className="ml-2 text-sm font-semibold text-accent">· Quote</span>
                      )}
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
                      {isQuoteRequest
                        ? 'Price · '
                        : b.type === 'offer'
                          ? 'Offer · '
                          : 'Price · '}
                    </span>
                    {isQuoteRequest
                      ? 'On request'
                      : formatPrice(b.offerAmount ?? b.price)}
                    {b.counterAmount != null && (
                      <span> → quote {formatPrice(b.counterAmount)}</span>
                    )}
                  </div>
                  {b.discountCode && (
                    <div>
                      <span className="text-brand/45">Discount · </span>
                      {b.discountCode} (−{formatPrice(b.discountAmount ?? 0)})
                    </div>
                  )}
                  {formatBraidBaseLabel(b.addonIds) && (
                    <div>
                      <span className="text-brand/45">Base · </span>
                      {formatBraidBaseLabel(b.addonIds)}
                    </div>
                  )}
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
                    {b.status === 'confirmed'
                      ? ' · received'
                      : b.depositPaid
                        ? ' · client marked sent'
                        : ' · unpaid'}
                  </div>
                  {b.note && (
                    <div className="sm:col-span-2 rounded-xl bg-lilac/50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                        {isQuoteRequest ? 'Custom request' : 'Note'}
                      </p>
                      <p className="mt-1 text-brand">{b.note}</p>
                    </div>
                  )}
                  {b.notesAccommodations && (
                    <div className="sm:col-span-2 rounded-xl bg-lilac/50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                        Allergies / accommodations
                      </p>
                      <p className="mt-1 text-brand">{b.notesAccommodations}</p>
                    </div>
                  )}
                  {b.inspoUrl && (
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand/45">
                        Client inspo
                      </p>
                      <a
                        href={b.inspoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 rounded-xl border border-brand/10 bg-white p-2 transition hover:border-accent/40"
                      >
                        {isInspoVideo(b.inspoUrl) ? (
                          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-lilac text-xs font-semibold text-accent">
                            Video
                          </span>
                        ) : (
                          <img
                            src={b.inspoUrl}
                            alt="Client inspo"
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <span className="text-sm font-semibold text-accent">Open inspo →</span>
                      </a>
                    </div>
                  )}
                  <div className="sm:col-span-2 font-mono text-xs text-brand/40">{b.id}</div>
                </dl>

                {needsDepositConfirm && (
                  <div className="mt-4 border-t border-brand/10 pt-4">
                    <button
                      type="button"
                      className="btn-primary !px-4 !py-2 text-sm"
                      onClick={() => void markDepositReceived(b.id)}
                    >
                      Deposit received
                    </button>
                    <p className="mt-2 text-xs text-brand/50">
                      Marks this booking Confirmed and notifies you by email.
                    </p>
                  </div>
                )}

                {isQuoteRequest && (
                  <div className="mt-4 space-y-2 border-t border-brand/10 pt-4">
                    <p className="text-xs text-brand/55">
                      Enter your quoted price — this becomes the counter the client can Accept or
                      Decline.
                    </p>
                    <div className="flex gap-2">
                      <input
                        className="input-field !py-2"
                        type="number"
                        min={1}
                        placeholder="Quoted price"
                        value={counterDrafts[b.id] ?? ''}
                        onChange={(e) =>
                          setCounterDrafts((d) => ({ ...d, [b.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="btn-primary shrink-0 !px-4 !py-2 text-sm"
                        onClick={() => {
                          const n = Number(counterDrafts[b.id])
                          if (!Number.isFinite(n) || n <= 0) return
                          void counterOffer(b.id, n)
                        }}
                      >
                        Send quote
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary !px-4 !py-2 text-sm"
                      onClick={() => void handleDecline(b.id)}
                    >
                      Decline
                    </button>
                  </div>
                )}

                {isOfferActionable && (
                  <div className="mt-4 space-y-2 border-t border-brand/10 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary !px-4 !py-2 text-sm"
                        onClick={() => void acceptOffer(b.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn-secondary !px-4 !py-2 text-sm"
                        onClick={() => void handleDecline(b.id)}
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
                          void counterOffer(b.id, n)
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
        </>
      )}
        </>
      )}

      <div className="mt-10 border-t border-brand/10 pt-6">
        {panel === 'bookings' && (
          <>
        <button
          type="button"
          className="text-xs text-rose-600/80 hover:underline"
          onClick={() => {
            if (confirm('Clear all bookings? This cannot be undone.')) {
              void clearAllBookings()
            }
          }}
        >
          Clear all local data
        </button>
        <p className="mt-2 text-xs text-brand/40">
          {storageMode === 'supabase'
            ? 'Bookings sync from Supabase so you see every client booking.'
            : 'Data is stored in this browser only until Supabase env vars are set.'}
        </p>
          </>
        )}
        <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          ← Back to site
        </Link>
      </div>
    </div>
  )
}
