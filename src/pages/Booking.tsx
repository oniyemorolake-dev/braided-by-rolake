import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BRAID_BASE_OPTIONS,
  CONFIG,
  LENGTH_OPTIONS,
  MOBILE_BASE,
  MOBILE_ZONES,
  POLICIES,
  SIZE_OPTIONS,
  calculateBookingDurationHours,
  calculateBookingTotal,
  FIRST_TIME_CODE,
  FIRST_TIME_DISCOUNT,
  FIRST_TIME_ENABLED,
  FIRST_TIME_THRESHOLD,
  getFirstTimeDiscountAmount,
  DISCOUNT_PRICE_FLOOR,
  clampDiscountAmount,
  formatAddonsLabel,
  formatBraidBaseLabel,
  formatDateLabel,
  formatDuration,
  formatMobileLabel,
  formatPrice,
  formatPriceAdjust,
  formatSizeLabel,
  formatSlotLabel,
  getAdultServices,
  getCareServices,
  getDepositForPrice,
  getKidsServices,
  getLengthOption,
  getMenServices,
  getMobileZone,
  getAddonsForService,
  getServiceById,
  isCustomQuoteService,
  withBraidBase,
  type Booking,
  type BraidBaseId,
  type BraidSizeId,
  type LengthId,
  type MobileZoneId,
} from '../data'
import { useBookings } from '../context/BookingContext'
import { getAvailableSlots, getBookableDates } from '../lib/scheduling'
import {
  INSPO_ACCEPT,
  uploadInspoFile,
  validateInspoFile,
} from '../lib/inspoUpload'
import { filterServices } from '../lib/serviceSearch'
import { StatusBadge } from '../components/StatusBadge'
import {
  CancelNoticeLine,
  DepositInstructions,
  DepositSentNotice,
  PrepInstructionsBlock,
} from '../components/BookingNotices'
import { PhotoSlot, servicePhotoPath } from '../components/PhotoSlot'
import {
  checkFirstTimeEligible,
  validateDiscountCode,
  type ValidateDiscountResult,
} from '../lib/discounts'

type Mode = 'listed' | 'offer'
type Step = 'service' | 'options' | 'schedule' | 'details' | 'done'

export function Booking() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const {
    bookings,
    createListedBooking,
    createOffer,
    createQuoteRequest,
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
  const [braidBase, setBraidBase] = useState<BraidBaseId>('box')
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
  const [notesAccommodations, setNotesAccommodations] = useState('')
  const [inspoFile, setInspoFile] = useState<File | null>(null)
  const [inspoPreview, setInspoPreview] = useState<string | null>(null)
  const [inspoUploading, setInspoUploading] = useState(false)
  const [serviceQuery, setServiceQuery] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountResult, setDiscountResult] = useState<ValidateDiscountResult | null>(null)
  const [discountChecking, setDiscountChecking] = useState(false)
  const [firstTimeEligible, setFirstTimeEligible] = useState(false)
  const [applyFirstTime, setApplyFirstTime] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Booking | null>(null)

  const service = serviceId ? getServiceById(serviceId) : undefined
  const isQuote = isCustomQuoteService(service)

  const activeMobileZone = mobileService && mobileZoneId ? mobileZoneId : undefined

  const total = useMemo(() => {
    if (!service) return 0
    return calculateBookingTotal(service, size, lengthId, addonIds, activeMobileZone)
  }, [service, size, lengthId, addonIds, activeMobileZone])

  const discountOff =
    !isQuote && mode === 'listed'
      ? discountResult?.ok && discountResult.amount != null
        ? clampDiscountAmount(total, discountResult.amount)
        : applyFirstTime && firstTimeEligible && !discountCode.trim()
          ? clampDiscountAmount(total, getFirstTimeDiscountAmount(total))
          : 0
      : 0

  const payableTotal = Math.max(0, total - discountOff)

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

  const adultServices = useMemo(
    () => filterServices(getAdultServices(), serviceQuery),
    [serviceQuery],
  )
  const menServices = useMemo(
    () => filterServices(getMenServices(), serviceQuery),
    [serviceQuery],
  )
  const careServices = useMemo(
    () => filterServices(getCareServices(), serviceQuery),
    [serviceQuery],
  )
  const kidsServices = useMemo(
    () => filterServices(getKidsServices(), serviceQuery),
    [serviceQuery],
  )
  const serviceMatchCount =
    adultServices.length + menServices.length + careServices.length + kidsServices.length

  function selectService(id: string) {
    setServiceId(id)
    setDate('')
    setSlot('')
    setSize('medium')
    setBraidBase('box')
    setLengthId('shoulder')
    setAddonIds([])
    setMobileService(false)
    setMobileZoneId('')
    setMobileAddress('')
    const next = getServiceById(id)
    if (isCustomQuoteService(next)) {
      setMode('listed')
    }
    setStep('options')
    navigate(`/book?service=${id}&mode=${isCustomQuoteService(next) ? 'listed' : mode}`, {
      replace: true,
    })
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function applyCode() {
    setDiscountChecking(true)
    setError('')
    try {
      if (!email.trim()) {
        setDiscountResult({ ok: false, message: 'Enter your email before applying a code.' })
        return
      }
      if (!discountCode.trim()) {
        setDiscountResult({ ok: false, message: 'Enter a discount code.' })
        return
      }
      const result = await validateDiscountCode(discountCode, email, total)
      setDiscountResult(result)
      if (result.ok) setApplyFirstTime(false)
    } finally {
      setDiscountChecking(false)
    }
  }

  async function refreshFirstTimeEligibility(nextEmail: string) {
    if (!FIRST_TIME_ENABLED || !nextEmail.includes('@')) {
      setFirstTimeEligible(false)
      setApplyFirstTime(false)
      return
    }
    const check = await checkFirstTimeEligible(nextEmail)
    setFirstTimeEligible(check.eligible)
    if (!check.eligible) setApplyFirstTime(false)
  }

  function onInspoPicked(file: File | null) {
    setError('')
    if (inspoPreview) {
      URL.revokeObjectURL(inspoPreview)
      setInspoPreview(null)
    }
    if (!file) {
      setInspoFile(null)
      return
    }
    const problem = validateInspoFile(file)
    if (problem) {
      setError(problem)
      setInspoFile(null)
      return
    }
    setInspoFile(file)
    setInspoPreview(URL.createObjectURL(file))
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

    setSubmitting(true)
    let inspoUrl: string | undefined
    try {
      if (inspoFile) {
        setInspoUploading(true)
        inspoUrl = await uploadInspoFile(inspoFile)
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
        addonIds: service.hasBraidBase ? withBraidBase(addonIds, braidBase) : addonIds,
        mobileService,
        mobileZoneId: mobileService && mobileZoneId ? mobileZoneId : undefined,
        mobileAddress: mobileService ? mobileAddress : undefined,
        inspoUrl,
        notesAccommodations: notesAccommodations.trim() || undefined,
      }

      let booking: Booking
      if (isQuote) {
        if (!inspoUrl) {
          setError('Please upload an inspo photo or video for a custom quote.')
          setSubmitting(false)
          setInspoUploading(false)
          return
        }
        if (!note.trim()) {
          setError('Please describe the custom style or special design you want.')
          setSubmitting(false)
          setInspoUploading(false)
          return
        }
        booking = await createQuoteRequest({
          ...options,
          inspoUrl,
          note: note.trim(),
        })
      } else if (mode === 'listed') {
        booking = await createListedBooking({
          ...options,
          discountCode:
            discountResult?.ok && discountCode.trim()
              ? discountCode.trim().toUpperCase()
              : undefined,
          applyFirstTime: Boolean(
            applyFirstTime && firstTimeEligible && !(discountResult?.ok && discountCode.trim()),
          ),
        })
      } else {
        const amount = Number(offerAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
          setError('Enter a valid offer amount.')
          setSubmitting(false)
          setInspoUploading(false)
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setInspoUploading(false)
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
        Home studio in {CONFIG.city}. Deposit via Interac e-Transfer: {formatPrice(10)} under{' '}
        {formatPrice(50)}, {formatPrice(15)} under {formatPrice(60)}, otherwise{' '}
        {formatPrice(CONFIG.depositAmount)} — booking is confirmed once it&apos;s received
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

      {!isQuote && (
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
      )}
      {isQuote && (
        <div className="mt-6 rounded-2xl bg-lilac/80 px-4 py-3 text-sm text-brand/70">
          <p className="font-semibold text-brand">Custom quote request</p>
          <p className="mt-1">
            Price on request — upload inspo, describe your look, and I&apos;ll send a quote for this
            time slot.
          </p>
        </div>
      )}

      {step === 'service' && (
        <div className="mt-6 space-y-6">
          <button
            type="button"
            onClick={() => selectService('custom')}
            className="card-soft flex w-full items-start gap-3 border-accent/30 bg-gradient-to-br from-lilac to-white p-4 text-left transition hover:border-accent/50"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-xl font-semibold text-accent">
              ✦
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-brand">
                Custom style or special design — request a quote
              </span>
              <span className="mt-1 block text-xs text-brand/60">
                Price on request · upload inspo · I&apos;ll quote you back
              </span>
            </span>
            <span className="text-accent">→</span>
          </button>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand" htmlFor="book-service-search">
              Search styles
            </label>
            <input
              id="book-service-search"
              className="input-field"
              type="search"
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              placeholder="Search knotless, crochet, kids…"
              autoComplete="off"
            />
            {serviceQuery.trim() && (
              <p className="mt-2 text-xs text-brand/55">
                {serviceMatchCount === 0
                  ? 'No styles match — try another word.'
                  : `${serviceMatchCount} style${serviceMatchCount === 1 ? '' : 's'}`}
              </p>
            )}
          </div>

          {adultServices.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-brand">Adult styles</p>
            <div className="space-y-3">
              {adultServices
                .filter((s) => !isCustomQuoteService(s))
                .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <PhotoSlot
                    src={s.image ?? servicePhotoPath(s.id)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl"
                    label="Soon"
                  />
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
          )}

          {menServices.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium text-brand">Men’s braids</p>
            <p className="mb-3 text-xs text-brand/55">
              Cornrows, plaits, twists, and design styles for men.
            </p>
            <div className="space-y-3">
              {menServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <PhotoSlot
                    src={s.image ?? servicePhotoPath(s.id)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl"
                    label="Soon"
                  />
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
          )}

          {careServices.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium text-brand">Hair care &amp; finishing</p>
            <p className="mb-3 text-xs text-brand/55">
              Take-outs, detangle, gel styles, and basic straighten — no wash services.
            </p>
            <div className="space-y-3">
              {careServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <PhotoSlot
                    src={s.image ?? servicePhotoPath(s.id)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl"
                    label="Soon"
                  />
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
          )}

          {kidsServices.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium text-brand">Kids · ages 4–11</p>
            <p className="mb-3 text-xs text-brand/55">
              Soft tension, shorter appointments, styles made for school and play.
            </p>
            <div className="space-y-3">
              {kidsServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition hover:border-accent/40"
                >
                  <PhotoSlot
                    src={s.image ?? servicePhotoPath(s.id)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl"
                    label="Soon"
                  />
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
          )}

          {serviceQuery.trim() && serviceMatchCount === 0 && (
            <div className="card-soft px-4 py-8 text-center text-sm text-brand/60">
              <p>No styles found for “{serviceQuery.trim()}”.</p>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-accent"
                onClick={() => setServiceQuery('')}
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'options' && service && (
        <div className="mt-6 space-y-5">
          <div className="card-soft flex items-center gap-3 p-3">
            <PhotoSlot
              src={service.image ?? servicePhotoPath(service.id)}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl"
              label="Soon"
            />
            <div className="flex-1">
              <p className="font-semibold text-brand">{service.name}</p>
              <p className="text-xs text-brand/55">
                {isQuote ? 'Price on request' : `Base from ${formatPrice(service.price)}`}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-accent"
              onClick={() => setStep('service')}
            >
              Change
            </button>
          </div>

          {service.hasBraidBase && !isQuote && (
            <div>
              <label className="mb-2 block text-sm font-medium text-brand">
                Base style
              </label>
              <p className="mb-2 text-xs text-brand/55">
                French curls can be done on a box braid or knotless base.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BRAID_BASE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBraidBase(opt.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      braidBase === opt.id
                        ? 'border-accent bg-lilac text-brand'
                        : 'border-brand/15 bg-white hover:border-accent/40'
                    }`}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        braidBase === opt.id ? 'text-brand/70' : 'text-brand/50'
                      }`}
                    >
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {service.hasSizes !== false && !isQuote && (
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

          {!isQuote &&
            service.category !== 'care' &&
            service.category !== 'men' &&
            service.id !== 'kids-take-out' &&
            service.id !== 'kids-detangle' && (
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
          )}

          {!isQuote &&
            service.category !== 'care' &&
            service.id !== 'kids-take-out' &&
            service.id !== 'kids-detangle' &&
            getAddonsForService(service).length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-brand">Add-ons</label>
            <div className="space-y-2">
              {getAddonsForService(service).map((addon) => {
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
          )}

          {isQuote && (
            <p className="rounded-xl bg-lilac/60 px-3 py-2 text-sm text-brand/70">
              No listed price for custom work — choose a preferred time, then upload inspo and
              describe your design on the next steps. I&apos;ll send a quote before any deposit.
            </p>
          )}

          {(service.category === 'care' ||
            service.id === 'kids-take-out' ||
            service.id === 'kids-detangle') && (
            <p className="rounded-xl bg-lilac/60 px-3 py-2 text-sm text-brand/70">
              No wash service — take-out, detangle, gel, or straighten only. Length and braid
              add-ons don&apos;t apply.
            </p>
          )}

          {service.category === 'men' && (
            <p className="rounded-xl bg-lilac/60 px-3 py-2 text-sm text-brand/70">
              Men&apos;s styles are priced as listed. Optional add-ons (like styling gel) are below —
              extension length doesn&apos;t apply.
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
                  if (!mobileZoneId) setMobileZoneId('nw')
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
                <div className="rounded-xl bg-lilac/60 px-3 py-2.5 text-xs leading-relaxed text-brand/70">
                  <p>
                    I&apos;m based in <strong className="text-brand">{MOBILE_BASE.area}</strong> and
                    take Uber/Lyft <strong className="text-brand">both ways</strong> (to you and
                    home). Your travel fee covers that round trip — not an extra markup on the
                    braids.
                  </p>
                  <p className="mt-2">{MOBILE_BASE.marketAverage}</p>
                </div>
                <p className="text-xs text-brand/55">Pick your quadrant or city:</p>
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
                    placeholder="e.g. Bridgeland NE, or full address"
                    value={mobileAddress}
                    onChange={(e) => setMobileAddress(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-lilac/70 px-4 py-3 text-sm">
            <div className="flex justify-between font-semibold text-brand">
              <span>{isQuote ? 'Pricing' : 'Estimated total'}</span>
              <span className="text-accent">
                {isQuote ? 'Price on request' : formatPrice(total)}
              </span>
            </div>
            {!isQuote && mobileService && mobileZoneId && (
              <p className="mt-1 text-xs text-brand/60">
                Includes {formatPrice(getMobileZone(mobileZoneId)!.price)} travel (
                {getMobileZone(mobileZoneId)!.label}) for Uber/Lyft both ways
              </p>
            )}
            <p className="mt-1 text-xs text-brand/60">
              About {formatDuration(durationHours)}
              {!isQuote &&
                ` · ${formatPrice(getDepositForPrice(total))} deposit due to confirm`}
              {isQuote && ' · slot held tentatively until you accept a quote'}
            </p>
            {!isQuote && <p className="mt-1 text-xs text-brand/50">{CONFIG.taxNote}</p>}
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
            {!isQuote && (
              <p>
                {service.hasBraidBase && `${BRAID_BASE_OPTIONS.find((o) => o.id === braidBase)?.label} · `}
                {service.hasSizes !== false && `${formatSizeLabel(size)} · `}
                {getLengthOption(lengthId)?.label}
                {addonIds.length > 0 && ` · ${formatAddonsLabel(addonIds)}`}
              </p>
            )}
            <p className="mt-1 text-brand/70">
              {formatMobileLabel({
                mobileService,
                mobileZoneId: activeMobileZone,
              })}
            </p>
            <p className="mt-1 font-medium text-accent">
              {isQuote
                ? `Price on request · ~${formatDuration(durationHours)}`
                : `${formatPrice(total)} · ~${formatDuration(durationHours)}`}
            </p>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-accent"
              onClick={() => setStep('options')}
            >
              {isQuote ? 'Edit location' : 'Edit size & add-ons'}
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
            {!isQuote && (
              <p className="mt-1">
                {service.hasBraidBase && `${BRAID_BASE_OPTIONS.find((o) => o.id === braidBase)?.label} · `}
                {service.hasSizes !== false && `${formatSizeLabel(size)} · `}
                {getLengthOption(lengthId)?.label}
                {addonIds.length > 0 && ` · ${formatAddonsLabel(addonIds)}`}
              </p>
            )}
            <p className="mt-1 text-brand/70">
              {formatMobileLabel({
                mobileService,
                mobileZoneId: activeMobileZone,
              })}
              {mobileService && mobileAddress.trim() && ` · ${mobileAddress.trim()}`}
            </p>
            <p className="mt-1 font-semibold text-accent">
              {isQuote
                ? 'Price on request — quote after review'
                : mode === 'listed'
                  ? `Total ${formatPrice(payableTotal)}${
                      discountOff > 0 ? ` (${formatPrice(discountOff)} off)` : ''
                    } · ${formatPrice(getDepositForPrice(payableTotal))} deposit`
                  : 'You are sending an offer for review'}
            </p>
            {!isQuote && <p className="mt-1 text-xs text-brand/50">{CONFIG.taxNote}</p>}
          </div>

          {isQuote && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand">
                Describe what you want
              </label>
              <textarea
                className="input-field min-h-[100px] resize-y"
                placeholder="e.g. Half cornrows into a bun with beads, similar to my inspo…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </div>
          )}

          {mode === 'offer' && !isQuote && (
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
              onChange={(e) => {
                setEmail(e.target.value)
                setDiscountResult(null)
                void refreshFirstTimeEligibility(e.target.value)
              }}
              onBlur={() => void refreshFirstTimeEligibility(email)}
              autoComplete="email"
              required
            />
          </div>

          {mode === 'listed' && !isQuote && (
            <div className="space-y-3 rounded-2xl border border-accent/20 bg-lilac/40 p-4">
              <p className="text-sm font-semibold text-brand">Discount code</p>
              <p className="text-xs text-brand/55">
                One code per booking. Final price won&apos;t go below {formatPrice(DISCOUNT_PRICE_FLOOR)}.
              </p>
              <div className="flex gap-2">
                <input
                  className="input-field !py-2"
                  placeholder="e.g. WELCOME"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase())
                    setDiscountResult(null)
                    if (e.target.value.trim()) setApplyFirstTime(false)
                  }}
                  autoCapitalize="characters"
                />
                <button
                  type="button"
                  className="btn-secondary shrink-0 !px-4 !py-2 text-sm"
                  disabled={discountChecking}
                  onClick={() => void applyCode()}
                >
                  {discountChecking ? 'Checking…' : 'Apply'}
                </button>
              </div>
              {discountResult && (
                <p
                  className={`text-sm ${discountResult.ok ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {discountResult.message}
                </p>
              )}
                  {FIRST_TIME_ENABLED && firstTimeEligible && !discountResult?.ok && (
                <label className="flex cursor-pointer items-start gap-3 text-sm text-brand/80">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={applyFirstTime}
                    onChange={(e) => {
                      const on = e.target.checked
                      setApplyFirstTime(on)
                      if (on) {
                        setDiscountCode(FIRST_TIME_CODE)
                        void validateDiscountCode(FIRST_TIME_CODE, email, total).then((r) => {
                          setDiscountResult(r)
                          if (r.ok) setApplyFirstTime(true)
                        })
                      } else {
                        setDiscountCode('')
                        setDiscountResult(null)
                      }
                    }}
                  />
                  <span>
                    Apply first-time discount (
                    {total < FIRST_TIME_THRESHOLD
                      ? `5% off · ${formatPrice(getFirstTimeDiscountAmount(total))}`
                      : `${formatPrice(FIRST_TIME_DISCOUNT)} off`}{' '}
                    with {FIRST_TIME_CODE})
                  </span>
                </label>
              )}
              {discountOff > 0 && (
                <div className="rounded-xl bg-white/80 px-3 py-2 text-sm text-brand">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-accent">
                    <span>Discount</span>
                    <span>-{formatPrice(discountOff)}</span>
                  </div>
                  <div className="mt-1 flex justify-between font-semibold">
                    <span>Total due</span>
                    <span>{formatPrice(payableTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand">
              Upload your inspo (photo or video){' '}
              {isQuote ? (
                <span className="font-normal text-rose-600">(required)</span>
              ) : (
                <span className="font-normal text-brand/45">(optional)</span>
              )}
            </label>
            <p className="mb-2 text-xs text-brand/55">
              JPG, PNG, WebP, MP4, or MOV · max 20MB. For longer clips, send a short video or a
              screenshot of the key look.
            </p>
            <input
              className="block w-full text-sm text-brand/70 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              accept={INSPO_ACCEPT}
              required={isQuote}
              onChange={(e) => onInspoPicked(e.target.files?.[0] ?? null)}
            />
            {inspoFile && inspoPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-brand/10 bg-lilac/40">
                {inspoFile.type.startsWith('video/') || /\.(mp4|mov)$/i.test(inspoFile.name) ? (
                  <video src={inspoPreview} controls className="max-h-48 w-full object-contain" />
                ) : (
                  <img
                    src={inspoPreview}
                    alt="Inspo preview"
                    className="max-h-48 w-full object-contain"
                  />
                )}
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-brand/60">
                  <span className="truncate">{inspoFile.name}</span>
                  <button
                    type="button"
                    className="shrink-0 font-semibold text-accent"
                    onClick={() => onInspoPicked(null)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            {inspoUploading && (
              <p className="mt-2 text-xs font-medium text-accent">Uploading your inspo…</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand">
              Allergies, sensitivities, or accommodations?{' '}
              <span className="font-normal text-brand/45">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-brand/55">
              Let me know anything I should be aware of — scalp sensitivities, product allergies,
              mobility needs, or anything that helps me take care of you. All accommodations
              welcome.
            </p>
            <textarea
              className="input-field min-h-[100px] resize-y"
              value={notesAccommodations}
              onChange={(e) => setNotesAccommodations(e.target.value)}
              placeholder="Optional — share whatever helps me care for you"
            />
          </div>

          <p className="rounded-xl bg-lilac/60 px-3 py-2.5 text-xs leading-relaxed text-brand/70">
            By booking, you agree that hair will be <strong>pre-stretched</strong>, a{' '}
            <strong>
              {formatPrice(getDepositForPrice(isQuote ? 0 : payableTotal || total))} e-Transfer
              deposit
            </strong>{' '}
            is required to secure the appointment (confirmed once received; balance paid in person),
            and extensions are provided <strong>only on request</strong>.
          </p>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting || inspoUploading}
          >
            {inspoUploading
              ? 'Uploading inspo…'
              : submitting
                ? 'Submitting…'
                : isQuote
                  ? 'Request quote'
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
  const isQuoteRequested = live.status === 'quote_requested'
  const isCountered = live.status === 'countered'
  const isDeclined = live.status === 'declined'
  const isCustom = isCustomQuoteService(service)
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
              : isAwaitingDeposit && live.depositPaid
                ? 'Deposit marked as sent'
                : isAwaitingDeposit
                  ? 'Almost there — deposit needed'
                  : isQuoteRequested
                    ? 'Quote requested'
                    : isPending
                      ? 'Offer sent'
                      : isCountered
                        ? isCustom
                          ? 'Your quote'
                          : 'Counter offer'
                        : 'Offer update'}
          </h1>
          <StatusBadge status={live.status} depositPaid={live.depositPaid} />
        </div>

        <p className="text-sm leading-relaxed text-brand/70">
          {isConfirmed &&
            (live.mobileService
              ? 'Deposit received — I’ll come to you. See prep tips below.'
              : 'Deposit received — your appointment is confirmed. See prep tips below.')}
          {isAwaitingDeposit &&
            live.depositPaid &&
            'Thanks — we’ve noted that you sent the deposit. Your booking is confirmed once Rolake verifies the e-Transfer (usually same day). You’ll get an email when it’s confirmed, and you can check status anytime with your link.'}
          {isAwaitingDeposit &&
            !live.depositPaid &&
            `A ${formatPrice(live.depositAmount ?? CONFIG.depositAmount)} deposit is required to secure your appointment, sent by e-Transfer to ${CONFIG.depositEmail}. Your booking is only confirmed once the deposit is received. The remaining balance is paid in person.`}
          {isQuoteRequested &&
            'Thanks! Your custom request is in and this time slot is held tentatively. I’ll review your inspo and send a quote — check back here or watch your email.'}
          {isPending &&
            'Thanks! Your offer is pending review and this time slot is held for you. Once accepted, you’ll send the deposit to finalize.'}
          {isCountered &&
            isCustom &&
            `I've quoted ${formatPrice(live.counterAmount!)}. Accept to continue with the deposit, or decline to free the slot.`}
          {isCountered &&
            !isCustom &&
            `I've suggested $${live.counterAmount}. Accept to continue, or walk away to free the slot.`}
          {isDeclined &&
            autoDeclined &&
            `Your offer was below the minimum of ${formatPrice(service!.minOffer!)} for this style, so it was declined automatically and the slot is open again.`}
          {isDeclined &&
            !autoDeclined &&
            'This request was declined and the time slot has been released. You are welcome to book again.'}
        </p>

        {isAwaitingDeposit && live.depositPaid && (
          <DepositSentNotice amount={live.depositAmount ?? CONFIG.depositAmount} />
        )}
        {isAwaitingDeposit && !live.depositPaid && (
          <DepositInstructions amount={live.depositAmount ?? CONFIG.depositAmount} />
        )}

        <dl className="space-y-3 text-sm">
          <Row label="Service" value={service?.name ?? ''} />
          {formatBraidBaseLabel(live.addonIds) && (
            <Row label="Base" value={formatBraidBaseLabel(live.addonIds)!} />
          )}
          {live.size && <Row label="Size" value={formatSizeLabel(live.size)} />}
          {!isCustom && (
            <>
              <Row
                label="Length"
                value={getLengthOption(live.lengthId ?? 'shoulder')?.label ?? 'Shoulder'}
              />
              <Row label="Add-ons" value={formatAddonsLabel(live.addonIds)} />
            </>
          )}
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
              isQuoteRequested
                ? 'Price on request'
                : isCountered && live.counterAmount != null
                  ? formatPrice(live.counterAmount)
                  : live.type === 'offer' && !isConfirmed && !isAwaitingDeposit
                    ? `Offer ${formatPrice(live.offerAmount ?? live.price)}`
                    : formatPrice(live.price)
            }
          />
          {isCountered && live.counterAmount != null && !isCustom && (
            <Row label="Counter" value={formatPrice(live.counterAmount)} />
          )}
          {live.note && (
            <div className="rounded-xl bg-lilac/50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">
                {isCustom ? 'Your request' : 'Note'}
              </p>
              <p className="mt-1 text-brand">{live.note}</p>
            </div>
          )}
          {live.inspoUrl && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand/45">
                Your inspo
              </p>
              <a
                href={live.inspoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-xl border border-brand/10 bg-white p-2 transition hover:border-accent/40"
              >
                {/\.(mp4|mov|webm)(\?|$)/i.test(live.inspoUrl) ? (
                  <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-lilac text-xs font-semibold text-accent">
                    Video
                  </span>
                ) : (
                  <img
                    src={live.inspoUrl}
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
                  ? `${formatPrice(live.depositAmount ?? CONFIG.depositAmount)} · received`
                  : live.depositPaid
                    ? `${formatPrice(live.depositAmount ?? CONFIG.depositAmount)} · sent (pending verify)`
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
              {isCustom ? 'Decline quote' : 'Walk away'}
            </button>
          </div>
        )}

        <p className="text-xs text-brand/45">
          Reference: <span className="font-mono">{live.id}</span>
          {(isPending || isQuoteRequested || isCountered || isAwaitingDeposit || isConfirmed) && (
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
