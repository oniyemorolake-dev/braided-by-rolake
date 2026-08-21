import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ADDONS,
  CONFIG,
  LENGTH_OPTIONS,
  MOBILE_ZONES,
  POLICIES,
  SIZE_OPTIONS,
  calculateBookingDurationHours,
  calculateBookingTotal,
  formatAddonsLabel,
  formatDateLabel,
  formatDuration,
  formatMobileLabel,
  formatPrice,
  formatPriceAdjust,
  formatSizeLabel,
  formatSlotLabel,
  getAdultServices,
  getCareServices,
  getKidsServices,
  getLengthOption,
  getMobileZone,
  getServiceById,
  type Booking,
  type BraidSizeId,
  type LengthId,
  type MobileZoneId,
} from '../data'
import { useBookings } from '../context/BookingContext'
import { getAvailableSlots, getBookableDates } from '../lib/scheduling'
import { StatusBadge } from '../components/StatusBadge'
import {
  CancelNoticeLine,
  DepositInstructions,
  PrepInstructionsBlock,
} from '../components/BookingNotices'

type Mode = 'listed' | 'offer'
type Step = 'service' | 'options' | 'schedule' | 'details' | 'done'

export function Booking() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const {
    bookings,
    createListedBooking,
    createOffer,
    clientAcceptCounter,
    clientWalkAway,
  } = useBookings()

  const initialService = params.get('service') || ''
  const initialMode = (params.get('mode') as Mode) || 'listed'

  const [step, setStep] = useState<Step>(initialService ? 'options' : 'service')
  const [mode, setMode] = useState<Mode>(
    initialMode === 'offer' ? 'offer' : 'listed',
  )
  const [serviceId, setServiceId] = useState(initialService)
  const [size, setSize] = useState<BraidSizeId>('medium')
  const [lengthId, setLengthId] = useState<LengthId>('shoulder')
  const [addonIds, setAddonIds] = useState<string[]>([])
  const [mobileService, setMobileService] = useState(false)
  const [mobileZoneId, setMobileZoneId] = useState<MobileZoneId | ''>('')
  const [mobileAddress, setMobileAddress] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Booking | null>(null)

  const service = serviceId ? getServiceById(serviceId) : undefined

  const activeMobileZone = mobileService && mobileZoneId ? mobileZoneId : undefined

  const total = useMemo(() => {
    if (!service) return 0
    return calculateBookingTotal(service, size, lengthId, addonIds, activeMobileZone)
  }, [service, size, lengthId, addonIds, activeMobileZone])

  const durationHours = useMemo(() => {
    if (!service) return 1
    return calculateBookingDurationHours(service, size, lengthId, addonIds)
  }, [service, size, lengthId, addonIds])

  const serviceForSchedule = useMemo(() => {
    if (!service) return undefined
    return { ...service, durationHours }
  }, [service, durationHours])

  const bookableDates = useMemo(() => {
    if (!serviceForSchedule) return []
    return getBookableDates(serviceForSchedule, bookings)
  }, [serviceForSchedule, bookings])

  const slots = useMemo(() => {
    if (!serviceForSchedule || !date) return []
    return getAvailableSlots(date, serviceForSchedule, bookings)
  }, [serviceForSchedule, date, bookings])

  function selectService(id: string) {
    setServiceId(id)
    setDate('')
    setSlot('')
    setSize('medium')
    setLengthId('shoulder')
    setAddonIds([])
    setMobileService(false)
    setMobileZoneId('')
    setMobileAddress('')
    setStep('options')
    navigate(`/book?service=${id}&mode=${mode}`, { replace: true })
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!service || !date || !slot) {
      setError('Please choose a service, date, and time.')
      return
    }
    if (!clientName.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in your name, phone, and email.')
      return
    }
    if (mobileService && !mobileZoneId) {
      setError('Please choose a mobile travel zone.')
      return
    }
    if (mobileService && !mobileAddress.trim()) {
      setError('Please add the area or address for mobile service.')
      return
    }

    const options = {
      serviceId: service.id,
      date,
      slot,
      clientName,
      phone,
      email,
      size: service.hasSizes === false ? undefined : size,
      lengthId,
      addonIds,
      mobileService,
      mobileZoneId: mobileService && mobileZoneId ? mobileZoneId : undefined,
      mobileAddress: mobileService ? mobileAddress : undefined,
    }

    setSubmitting(true)
    try {
      let booking: Booking
      if (mode === 'listed') {
        booking = await createListedBooking(options)
      } else {
        const amount = Number(offerAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
          setError('Enter a valid offer amount.')
          setSubmitting(false)
          return
        }
        booking = await createOffer({
          ...options,
          offerAmount: amount,
          note,
        })
      }
      setResult(booking)
      // Listed price + accepted offers land on confirmation (awaiting deposit)
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done' && result) {
    return (
      <ConfirmationView
        booking={result}
        onAcceptCounter={() => {
          void clientAcceptCounter(result.id).then(() => {
            setResult({
              ...result,
              status: 'awaiting_deposit',
              price: result.counterAmount ?? result.price,
              depositPaid: false,
            })
          })
        }}
        onWalkAway={() => {
          void clientWalkAway(result.id).then(() => {
            setResult({ ...result, status: 'declined' })
          })
        }}
      />
    )
  }

  const stepOrder = {
    service: 0,
    options: 1,
    schedule: 2,
    details: 3,
    done: 4,
  } as const

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-brand sm:text-4xl">
        Book with Rolake
      </h1>
      <p className="mt-2 text-sm text-brand/65">
        Home studio in {CONFIG.city}. A {formatPrice(CONFIG.depositAmount)} Interac e-Transfer
        deposit is required to secure your spot — booking is confirmed once it&apos;s received
        (remaining balance paid in person).
      </p>

      <ol className="mt-6 flex gap-1.5 text-[10px] font-medium text-brand/50 sm:gap-2 sm:text-xs">
        {(
          [
            ['service', 'Style'],
            ['options', 'Size'],
            ['schedule', 'When'],
            ['details', 'Details'],
          ] as const
        ).map(([key, label], i) => {
          const current = stepOrder[step]
          const isCurrent = step === key
          const isDone = current > i
          return (
            <li
              key={key}
              className={`flex-1 rounded-full px-1 py-1.5 text-center sm:px-2 ${
                isCurrent
                  ? 'bg-accent text-white'
                  : isDone
                    ? 'bg-lilac text-brand'
                    : 'bg-brand/5'
              }`}
            >
              {label}
            </li>
          )
        })}
      </ol>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-lilac/80 p-1">
        <button
          type="button"
          onClick={() => setMode('listed')}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === 'listed' ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
          }`}
        >
          Listed price
        </button>
        <button
          type="button"
          onClick={() => setMode('offer')}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === 'offer' ? 'bg-white text-brand shadow-sm' : 'text-brand/60'
          }`}
        >
          Make an offer
        </button>
      </div>

      {step === 'service' && (
        <div className="mt-6 space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-brand">Adult styles</p>
            <div className="space-y-3">
              {getAdultServices().map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand">{s.name}</p>
                    <p className="text-xs text-brand/55">
                      from {formatPrice(s.price)} · {formatDuration(s.durationHours)}
                    </p>
                  </div>
                  <span className="text-accent">→</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-brand">Take outs &amp; detangling</p>
            <p className="mb-3 text-xs text-brand/55">
              Removal and no-wash detangle only — no wash services.
            </p>
            <div className="space-y-3">
              {getCareServices().map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand">{s.name}</p>
                    <p className="text-xs text-brand/55">
                      from {formatPrice(s.price)} · {formatDuration(s.durationHours)}
                    </p>
                  </div>
                  <span className="text-accent">→</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-brand">Kids · ages 4–11</p>
            <p className="mb-3 text-xs text-brand/55">
              Soft tension, shorter appointments, styles made for school and play.
            </p>
            <div className="space-y-3">
              {getKidsServices().map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand">{s.name}</p>
                    <p className="text-xs text-brand/55">
                      from {formatPrice(s.price)} · {formatDuration(s.durationHours)}
                    </p>
                  </div>
                  <span className="text-accent">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'options' && service && (
        <div className="mt-6 space-y-5">
          <div className="card-soft flex items-center gap-3 p-3">
            <div className="flex-1">
              <p className="font-semibold text-brand">{service.name}</p>
              <p className="text-xs text-brand/55">Base from {formatPrice(service.price)}</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-accent"
              onClick={() => setStep('service')}
            >
              Change
            </button>
          </div>

          {service.hasSizes !== false && (
            <div>
              <label className="mb-2 block text-sm font-medium text-brand">Size</label>
              <p className="mb-2 text-xs text-brand/55">
                Smaller sizes take longer (more braids). Large is quicker and costs less.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSize(opt.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      size === opt.id
                        ? 'border-accent bg-accent text-white'
                        : 'border-brand/15 bg-white text-brand hover:border-accent/40'
                    }`}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p
                      className={`text-xs ${size === opt.id ? 'text-white/80' : 'text-brand/50'}`}
                    >
                      {opt.priceAdjust === 0
                        ? 'Base price'
                        : opt.priceAdjust > 0
                          ? `+$${opt.priceAdjust}`
                          : `−$${Math.abs(opt.priceAdjust)}`}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {service.category !== 'care' &&
            service.id !== 'kids-take-out' &&
            service.id !== 'kids-detangle' && (
            <>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand">Length (add-on)</label>
            <div className="space-y-2">
              {LENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLengthId(opt.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                    lengthId === opt.id
                      ? 'border-accent bg-lilac text-brand'
                      : 'border-brand/15 bg-white hover:border-accent/40'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="text-xs text-brand/50">{opt.description}</span>
                  </span>
                    <span className="text-sm font-semibold text-accent">
                      {opt.price === 0 ? 'Incl.' : formatPriceAdjust(opt.price)}
                    </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand">Add-ons</label>
            <div className="space-y-2">
              {ADDONS.map((addon) => {
                const on = addonIds.includes(addon.id)
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      on
                        ? 'border-accent bg-lilac'
                        : 'border-brand/15 bg-white hover:border-accent/40'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                        on
                          ? 'border-accent bg-accent text-white'
                          : 'border-brand/25 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-brand">{addon.name}</span>
                      <span className="text-xs text-brand/50">{addon.description}</span>
                    </span>
                    <span className="text-sm font-semibold text-accent">
                      {formatPriceAdjust(addon.price)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
            </>
          )}

          {(service.category === 'care' ||
            service.id === 'kids-take-out' ||
            service.id === 'kids-detangle') && (
            <p className="rounded-xl bg-lilac/60 px-3 py-2 text-sm text-brand/70">
              No wash service — take-out / detangle only. Length and style add-ons don&apos;t apply.
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-brand">
              Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileService(false)
                  setMobileZoneId('')
                  setMobileAddress('')
                }}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  !mobileService
                    ? 'border-accent bg-accent text-white'
                    : 'border-brand/15 bg-white text-brand hover:border-accent/40'
                }`}
              >
                <p className="text-sm font-semibold">Studio visit</p>
                <p className={`text-xs ${!mobileService ? 'text-white/80' : 'text-brand/50'}`}>
                  Come to me · no travel fee
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileService(true)
                  if (!mobileZoneId) setMobileZoneId('calgary')
                }}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  mobileService
                    ? 'border-accent bg-accent text-white'
                    : 'border-brand/15 bg-white text-brand hover:border-accent/40'
                }`}
              >
                <p className="text-sm font-semibold">Mobile</p>
                <p className={`text-xs ${mobileService ? 'text-white/80' : 'text-brand/50'}`}>
                  I come to you · + travel
                </p>
              </button>
            </div>

            {mobileService && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-brand/55">
                  Travel fee depends on where you are — pick the closest match.
                </p>
                {MOBILE_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setMobileZoneId(zone.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                      mobileZoneId === zone.id
                        ? 'border-accent bg-lilac text-brand'
                        : 'border-brand/15 bg-white hover:border-accent/40'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{zone.label}</span>
                      <span className="text-xs text-brand/50">{zone.description}</span>
                    </span>
                    <span className="text-sm font-semibold text-accent">+${zone.price}</span>
                  </button>
                ))}
                <div>
                  <label className="mb-1.5 mt-2 block text-sm font-medium text-brand">
                    Your area or address
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. NW Calgary, or full address"
                    value={mobileAddress}
                    onChange={(e) => setMobileAddress(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-lilac/70 px-4 py-3 text-sm">
            <div className="flex justify-between font-semibold text-brand">
              <span>Estimated total</span>
              <span className="text-accent">{formatPrice(total)}</span>
            </div>
            {mobileService && mobileZoneId && (
              <p className="mt-1 text-xs text-brand/60">
                Includes {formatPrice(getMobileZone(mobileZoneId)!.price)} mobile travel (
                {getMobileZone(mobileZoneId)!.label})
              </p>
            )}
            <p className="mt-1 text-xs text-brand/60">
              About {formatDuration(durationHours)} · {formatPrice(CONFIG.depositAmount)} deposit
              due to confirm
            </p>
            <p className="mt-1 text-xs text-brand/50">{CONFIG.taxNote}</p>
          </div>

          <ul className="space-y-1.5 text-xs text-brand/60">
            {POLICIES.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={mobileService && (!mobileZoneId || !mobileAddress.trim())}
            onClick={() => {
              setDate('')
              setSlot('')
              setStep('schedule')
            }}
          >
            Continue to date & time
          </button>
        </div>
      )}

      {step === 'schedule' && service && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-lilac/50 px-4 py-3 text-sm text-brand/80">
            <p className="font-semibold text-brand">{service.name}</p>
            <p>
              {service.hasSizes !== false && `${formatSizeLabel(size)} · `}
              {getLengthOption(lengthId)?.label}
              {addonIds.length > 0 && ` · ${formatAddonsLabel(addonIds)}`}
            </p>
            <p className="mt-1 text-brand/70">
              {formatMobileLabel({
                mobileService,
                mobileZoneId: activeMobileZone,
              })}
            </p>
            <p className="mt-1 font-medium text-accent">
              {formatPrice(total)} · ~{formatDuration(durationHours)}
            </p>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-accent"
              onClick={() => setStep('options')}
            >
              Edit size & add-ons
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand">Date</label>
            {bookableDates.length === 0 ? (
              <p className="rounded-xl bg-lilac/60 px-4 py-3 text-sm text-brand/70">
                No open dates for this style length in the next 60 days — try a smaller size or
                fewer add-ons.
              </p>
            ) : (
              <select
                className="input-field"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setSlot('')
                }}
              >
                <option value="">Select a date</option>
                {bookableDates.map((d) => (
                  <option key={d} value={d}>
                    {formatDateLabel(d)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {date && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand">
                Start time
                <span className="ml-1 font-normal text-brand/50">
                  (needs ~{formatDuration(durationHours)} + buffer)
                </span>
              </label>
              {slots.length === 0 ? (
                <p className="rounded-xl bg-lilac/60 px-4 py-3 text-sm text-brand/70">
                  No slots left on this day for this duration. Pick another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                        slot === s
                          ? 'border-accent bg-accent text-white'
                          : 'border-brand/15 bg-white text-brand hover:border-accent/50'
                      }`}
                    >
                      {formatSlotLabel(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!date || !slot}
            onClick={() => setStep('details')}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'details' && service && (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <button
            type="button"
            className="text-sm font-semibold text-accent"
            onClick={() => setStep('schedule')}
          >
            ← Back to date & time
          </button>

          <div className="rounded-2xl bg-lilac/50 px-4 py-3 text-sm text-brand/80">
            <p className="font-semibold text-brand">{service.name}</p>
            <p>
              {formatDateLabel(date)} · {formatSlotLabel(slot)}
            </p>
            <p className="mt-1">
              {service.hasSizes !== false && `${formatSizeLabel(size)} · `}
              {getLengthOption(lengthId)?.label}
              {addonIds.length > 0 && ` · ${formatAddonsLabel(addonIds)}`}
            </p>
            <p className="mt-1 text-brand/70">
              {formatMobileLabel({
                mobileService,
                mobileZoneId: activeMobileZone,
              })}
              {mobileService && mobileAddress.trim() && ` · ${mobileAddress.trim()}`}
            </p>
            <p className="mt-1 font-semibold text-accent">
              {mode === 'listed'
                ? `Total ${formatPrice(total)} · ${formatPrice(CONFIG.depositAmount)} deposit`
                : 'You are sending an offer for review'}
            </p>
            <p className="mt-1 text-xs text-brand/50">{CONFIG.taxNote}</p>
          </div>

          {mode === 'offer' && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand">
                  Your offer (CAD)
                </label>
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder={`Listed ${total}`}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                />
                {service.minOffer != null && (
                  <p className="mt-1.5 text-xs text-brand/55">
                    Offers below {formatPrice(service.minOffer)} (before add-ons) may be declined
                    automatically.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand">
                  Note <span className="font-normal text-brand/45">(optional)</span>
                </label>
                <textarea
                  className="input-field min-h-[88px] resize-y"
                  placeholder='e.g. "Student — can we do $130?"'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand">Full name</label>
            <input
              className="input-field"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand">Phone</label>
            <input
              className="input-field"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand">Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <p className="rounded-xl bg-lilac/60 px-3 py-2.5 text-xs leading-relaxed text-brand/70">
            By booking, you agree that hair will be <strong>pre-stretched</strong>, a{' '}
            <strong>{formatPrice(CONFIG.depositAmount)} e-Transfer deposit</strong> is required to
            secure the appointment (confirmed once received; balance paid in person), and extensions
            are provided <strong>only on request</strong>.
          </p>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting
              ? 'Submitting…'
              : mode === 'listed'
                ? 'Confirm booking'
                : 'Send offer'}
          </button>
        </form>
      )}
    </div>
  )
}

function ConfirmationView({
  booking,
  onAcceptCounter,
  onWalkAway,
}: {
  booking: Booking
  onAcceptCounter: () => void
  onWalkAway: () => void
}) {
  const { getBooking, markDepositPaid } = useBookings()
  const live = getBooking(booking.id) ?? booking
  const service = getServiceById(live.serviceId)
  const [ack, setAck] = useState(false)

  const isConfirmed = live.status === 'confirmed'
  const isAwaitingDeposit = live.status === 'awaiting_deposit'
  const isPending = live.status === 'pending'
  const isCountered = live.status === 'countered'
  const isDeclined = live.status === 'declined'
  const autoDeclined =
    isDeclined &&
    live.type === 'offer' &&
    service?.minOffer != null &&
    (live.offerAmount ?? 0) < service.minOffer

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="card-soft animate-fade-up space-y-5 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-3xl font-semibold text-brand">
            {isConfirmed
              ? 'You are booked!'
              : isAwaitingDeposit
                ? 'Almost there — deposit needed'
                : isPending
                  ? 'Offer sent'
                  : isCountered
                    ? 'Counter offer'
                    : 'Offer update'}
          </h1>
          <StatusBadge status={live.status} />
        </div>

        <p className="text-sm leading-relaxed text-brand/70">
          {isConfirmed &&
            (live.mobileService
              ? 'Deposit received — I’ll come to you. See prep tips below.'
              : 'Deposit received — your appointment is confirmed. See prep tips below.')}
          {isAwaitingDeposit &&
            `A ${formatPrice(live.depositAmount ?? CONFIG.depositAmount)} deposit is required to secure your appointment, sent by e-Transfer to ${CONFIG.depositEmail}. Your booking is only confirmed once the deposit is received. The remaining balance is paid in person.`}
          {isPending &&
            'Thanks! Your offer is pending review and this time slot is held for you. Once accepted, you’ll send the deposit to finalize.'}
          {isCountered &&
            `I've suggested $${live.counterAmount}. Accept to continue, or walk away to free the slot.`}
          {isDeclined &&
            autoDeclined &&
            `Your offer was below the minimum of ${formatPrice(service!.minOffer!)} for this style, so it was declined automatically and the slot is open again.`}
          {isDeclined &&
            !autoDeclined &&
            'This offer was declined and the time slot has been released. You are welcome to book again at the listed price or with a new offer.'}
        </p>

        {isAwaitingDeposit && (
          <DepositInstructions amount={live.depositAmount ?? CONFIG.depositAmount} />
        )}

        <dl className="space-y-3 text-sm">
          <Row label="Service" value={service?.name ?? ''} />
          {live.size && <Row label="Size" value={formatSizeLabel(live.size)} />}
          <Row
            label="Length"
            value={getLengthOption(live.lengthId ?? 'shoulder')?.label ?? 'Shoulder'}
          />
          <Row label="Add-ons" value={formatAddonsLabel(live.addonIds)} />
          <Row label="Location" value={formatMobileLabel(live)} />
          {live.mobileService && live.mobileAddress && (
            <Row label="Mobile address" value={live.mobileAddress} />
          )}
          <div className="flex justify-between gap-4 border-b border-brand/10 pb-2">
            <dt className="text-brand/50">When</dt>
            <dd className="text-right font-medium text-brand">
              {formatDateLabel(live.date)}
              <br />
              {formatSlotLabel(live.slot)}
            </dd>
          </div>
          <Row
            label="Amount"
            value={
              live.type === 'offer' && !isConfirmed && !isAwaitingDeposit
                ? `Offer ${formatPrice(live.offerAmount ?? live.price)}`
                : formatPrice(live.price)
            }
          />
          {isCountered && live.counterAmount != null && (
            <Row label="Counter" value={formatPrice(live.counterAmount)} />
          )}
          {(isAwaitingDeposit || isConfirmed) && (
            <Row
              label="Deposit"
              value={
                isConfirmed
                  ? `${formatPrice(live.depositAmount ?? CONFIG.depositAmount)} · received`
                  : live.depositPaid
                    ? `${formatPrice(live.depositAmount ?? CONFIG.depositAmount)} · marked sent`
                    : formatPrice(live.depositAmount ?? CONFIG.depositAmount)
              }
            />
          )}
          <Row label="Name" value={live.clientName} />
          {isConfirmed && !live.mobileService && (
            <div className="rounded-xl bg-lilac/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                Studio address
              </p>
              <p className="mt-1 font-medium text-brand">{CONFIG.studioAddress}</p>
            </div>
          )}
          {isConfirmed && live.mobileService && (
            <div className="rounded-xl bg-lilac/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                Mobile appointment
              </p>
              <p className="mt-1 font-medium text-brand">
                {live.mobileAddress || 'Address on file'}
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

        {isAwaitingDeposit && !live.depositPaid && (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-brand/80">
              <input
                type="checkbox"
                className="mt-1"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span>
                I have sent (or will send) the{' '}
                {formatPrice(live.depositAmount ?? CONFIG.depositAmount)} e-Transfer to{' '}
                {CONFIG.depositEmail}.
              </span>
            </label>
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={!ack}
              onClick={() => void markDepositPaid(live.id)}
            >
              I’ve sent the deposit
            </button>
            <p className="text-center text-xs text-brand/45">
              Rolake will mark your booking Confirmed once the deposit arrives.
            </p>
          </div>
        )}

        {isCountered && (
          <div className="flex flex-col gap-2">
            <button type="button" className="btn-primary w-full" onClick={onAcceptCounter}>
              Accept {formatPrice(live.counterAmount!)} & continue
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onWalkAway}>
              Walk away
            </button>
          </div>
        )}

        <p className="text-xs text-brand/45">
          Reference: <span className="font-mono">{live.id}</span>
          {(isPending || isAwaitingDeposit || isConfirmed) && (
            <>
              {' '}
              ·{' '}
              <Link to={`/status/${live.id}`} className="text-accent hover:underline">
                Check status anytime
              </Link>
            </>
          )}
        </p>

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
