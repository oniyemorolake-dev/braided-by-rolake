import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CONFIG,
  FIRST_TIME_CODE,
  FIRST_TIME_ENABLED,
  LOYALTY_ENABLED,
  REFERRAL_ENABLED,
  REFERRAL_DISCOUNT_FRIEND,
  calculateBookingTotal,
  clampDiscountAmount,
  getDepositForPrice,
  getServiceById,
  isCustomQuoteService,
  type Booking,
  type BookingStatus,
  type BraidSizeId,
  type DiscountType,
  type LengthId,
  type MobileZoneId,
} from '../data'
import {
  ensureReferralCode,
  maybeIssueLoyaltyCode,
  redeemDiscountCode,
  redeemFirstTimeIfEligible,
} from '../lib/discounts'
import {
  notifyOwner,
  notifyClientOfQuote,
  notifyClientBooking,
  notifyDiscountCodeEmail,
} from '../lib/notifications'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  clearAllBookingsRemote,
  generateId,
  getBookingById,
  insertBooking,
  loadBookings,
  updateBookingRemote,
} from '../lib/storage'

export interface CreateListedInput {
  serviceId: string
  date: string
  slot: string
  clientName: string
  phone: string
  email: string
  size?: BraidSizeId
  lengthId?: LengthId
  addonIds?: string[]
  mobileService?: boolean
  mobileZoneId?: MobileZoneId
  mobileAddress?: string
  inspoUrl?: string
  notesAccommodations?: string
  /** true = allow portfolio/social photos & videos; false = do not share */
  mediaConsent: boolean
  /** Optional exact discount code (one per booking) */
  discountCode?: string
  /** Auto-apply first-time WELCOME when eligible and no code entered */
  applyFirstTime?: boolean
}

export interface CreateOfferInput extends CreateListedInput {
  offerAmount: number
  note?: string
}

export interface CreateQuoteInput extends CreateListedInput {
  /** Description of the custom style / special design */
  note: string
}

interface BookingContextValue {
  bookings: Booking[]
  loading: boolean
  storageMode: 'supabase' | 'local'
  refreshBookings: () => Promise<void>
  createListedBooking: (input: CreateListedInput) => Promise<Booking>
  createOffer: (input: CreateOfferInput) => Promise<Booking>
  createQuoteRequest: (input: CreateQuoteInput) => Promise<Booking>
  acceptOffer: (id: string) => Promise<void>
  declineOffer: (id: string) => Promise<void>
  counterOffer: (id: string, amount: number) => Promise<void>
  clientAcceptCounter: (id: string) => Promise<void>
  clientWalkAway: (id: string) => Promise<void>
  /** Client soft-ack that e-Transfer was sent (does not confirm booking) */
  markDepositPaid: (id: string) => Promise<void>
  /** Admin: deposit received → status confirmed */
  markDepositReceived: (id: string) => Promise<void>
  getBooking: (id: string) => Booking | undefined
  clearAllBookings: () => Promise<void>
}

const BookingContext = createContext<BookingContextValue | null>(null)

function nowIso() {
  return new Date().toISOString()
}

function buildPriceFields(input: CreateListedInput) {
  const service = getServiceById(input.serviceId)
  if (!service) throw new Error('Service not found')

  const size = input.size ?? 'medium'
  const lengthId = input.lengthId ?? 'shoulder'
  const addonIds = input.addonIds ?? []
  const mobileService = Boolean(input.mobileService && input.mobileZoneId)
  const mobileZoneId = mobileService ? input.mobileZoneId : undefined
  const price = calculateBookingTotal(
    service,
    size,
    lengthId,
    addonIds,
    mobileZoneId,
  )

  return {
    service,
    size: service.hasSizes === false ? undefined : size,
    lengthId,
    addonIds,
    mobileService,
    mobileZoneId,
    mobileAddress: mobileService ? input.mobileAddress?.trim() || undefined : undefined,
    price,
    depositAmount: getDepositForPrice(price),
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const refreshBookings = useCallback(async () => {
    const list = await loadBookings()
    setBookings(list)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await loadBookings()
        if (!cancelled) setBookings(list)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Poll every 20s so admin sees new bookings without refresh
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const id = window.setInterval(() => {
      void refreshBookings()
    }, 20_000)
    return () => window.clearInterval(id)
  }, [refreshBookings])

  const createListedBooking = useCallback(async (input: CreateListedInput) => {
    const {
      size,
      lengthId,
      addonIds,
      mobileService,
      mobileZoneId,
      mobileAddress,
      price: subtotal,
    } = buildPriceFields(input)

    const bookingId = generateId()
    let price = subtotal
    let discountCode: string | undefined
    let discountAmount: number | undefined
    let discountType: DiscountType | undefined

    const code = input.discountCode?.trim().toUpperCase()
    if (code) {
      const redeemed = await redeemDiscountCode(code, input.email, bookingId, subtotal)
      if (!redeemed.ok || redeemed.amount == null) {
        throw new Error(redeemed.message || 'Discount code could not be applied.')
      }
      discountAmount = clampDiscountAmount(subtotal, redeemed.amount)
      price = Math.max(0, subtotal - discountAmount)
      discountCode = redeemed.code ?? code
      discountType = redeemed.type
      if (redeemed.referrerEmail && redeemed.referrerRewardCode) {
        void notifyDiscountCodeEmail({
          toEmail: redeemed.referrerEmail,
          subject: `You earned a $${redeemed.referrerRewardAmount} referral credit`,
          headline: 'Thanks for referring a friend!',
          body: `Your friend booked with your code. Use ${redeemed.referrerRewardCode} on your next booking for $${redeemed.referrerRewardAmount} off.`,
          code: redeemed.referrerRewardCode,
          amount: redeemed.referrerRewardAmount ?? 0,
        })
      }
    } else if (input.applyFirstTime && FIRST_TIME_ENABLED) {
      const redeemed = await redeemFirstTimeIfEligible(input.email, bookingId, subtotal)
      if (redeemed?.ok && redeemed.amount != null) {
        discountAmount = clampDiscountAmount(subtotal, redeemed.amount)
        price = Math.max(0, subtotal - discountAmount)
        discountCode = redeemed.code ?? FIRST_TIME_CODE
        discountType = redeemed.type ?? 'first_time'
      }
    }

    const booking: Booking = {
      id: bookingId,
      serviceId: input.serviceId,
      date: input.date,
      slot: input.slot,
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      price,
      type: 'listed',
      status: 'awaiting_deposit',
      size,
      lengthId,
      addonIds,
      mobileService,
      mobileZoneId,
      mobileAddress,
      depositAmount: getDepositForPrice(price),
      depositPaid: false,
      inspoUrl: input.inspoUrl,
      notesAccommodations: input.notesAccommodations?.trim() || undefined,
      mediaConsent: Boolean(input.mediaConsent),
      discountCode,
      discountAmount,
      discountType,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    const saved = await insertBooking(booking)
    setBookings((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)])
    void notifyOwner(saved)
    void notifyClientBooking(saved)
    return saved
  }, [])

  const createOffer = useCallback(async (input: CreateOfferInput) => {
    const {
      service,
      size,
      lengthId,
      addonIds,
      mobileService,
      mobileZoneId,
      mobileAddress,
      price,
      depositAmount,
    } = buildPriceFields(input)

    const belowFloor =
      service.minOffer != null && input.offerAmount < service.minOffer

    const booking: Booking = {
      id: generateId(),
      serviceId: input.serviceId,
      date: input.date,
      slot: input.slot,
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      price,
      type: 'offer',
      status: belowFloor ? 'declined' : 'pending',
      offerAmount: input.offerAmount,
      note: input.note?.trim() || undefined,
      size,
      lengthId,
      addonIds,
      mobileService,
      mobileZoneId,
      mobileAddress,
      depositAmount,
      depositPaid: false,
      inspoUrl: input.inspoUrl,
      notesAccommodations: input.notesAccommodations?.trim() || undefined,
      mediaConsent: Boolean(input.mediaConsent),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    const saved = await insertBooking(booking)
    setBookings((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)])
    if (!belowFloor) {
      void notifyOwner(saved)
    }
    return saved
  }, [])

  const createQuoteRequest = useCallback(async (input: CreateQuoteInput) => {
    const service = getServiceById(input.serviceId)
    if (!service || !isCustomQuoteService(service)) {
      throw new Error('Custom quote requires the custom style service.')
    }
    if (!input.inspoUrl?.trim()) {
      throw new Error('An inspo photo or video is required for custom quotes.')
    }
    if (!input.note?.trim()) {
      throw new Error('Please describe the style you want.')
    }

    const mobileService = Boolean(input.mobileService && input.mobileZoneId)
    const booking: Booking = {
      id: generateId(),
      serviceId: input.serviceId,
      date: input.date,
      slot: input.slot,
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      price: 0,
      type: 'offer',
      status: 'quote_requested',
      note: input.note.trim(),
      lengthId: input.lengthId ?? 'shoulder',
      addonIds: input.addonIds ?? [],
      mobileService,
      mobileZoneId: mobileService ? input.mobileZoneId : undefined,
      mobileAddress: mobileService ? input.mobileAddress?.trim() || undefined : undefined,
      depositAmount: CONFIG.depositAmount,
      depositPaid: false,
      inspoUrl: input.inspoUrl,
      notesAccommodations: input.notesAccommodations?.trim() || undefined,
      mediaConsent: Boolean(input.mediaConsent),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    const saved = await insertBooking(booking)
    setBookings((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)])
    void notifyOwner(saved)
    return saved
  }, [])

  const acceptOffer = useCallback(async (id: string) => {
    const current = (await getBookingById(id)) ?? bookings.find((b) => b.id === id)
    if (!current) return
    // Custom quotes must be priced via counter / Send quote first
    if (current.status === 'quote_requested') return
    const finalPrice = current.counterAmount ?? current.offerAmount ?? current.price
    const saved = await updateBookingRemote(
      id,
      {
        status: 'awaiting_deposit' as BookingStatus,
        price: finalPrice,
        depositAmount: getDepositForPrice(finalPrice),
      },
      'admin',
    )
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
    void notifyOwner(saved)
    void notifyClientBooking(saved)
  }, [bookings])

  const declineOffer = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, { status: 'declined' }, 'admin')
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
  }, [])

  const counterOffer = useCallback(async (id: string, amount: number) => {
    const saved = await updateBookingRemote(
      id,
      {
        status: 'countered',
        counterAmount: amount,
      },
      'admin',
    )
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
    void notifyClientOfQuote(saved)
    void notifyOwner(saved)
  }, [])

  const clientAcceptCounter = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(
      id,
      { status: 'awaiting_deposit', price: 0 },
      'client_accept',
    )
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === id)
      return exists ? prev.map((b) => (b.id === id ? saved : b)) : [saved, ...prev]
    })
    void notifyOwner(saved)
    void notifyClientBooking(saved)
  }, [])

  const clientWalkAway = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, { status: 'declined' }, 'client_walk')
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === id)
      return exists ? prev.map((b) => (b.id === id ? saved : b)) : [saved, ...prev]
    })
  }, [])

  const markDepositPaid = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, { depositPaid: true }, 'client_deposit')
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === id)
      return exists ? prev.map((b) => (b.id === id ? saved : b)) : [saved, ...prev]
    })
  }, [])

  const markDepositReceived = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(
      id,
      {
        status: 'confirmed' as BookingStatus,
        depositPaid: true,
      },
      'admin',
    )
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
    void notifyOwner(saved)
    void notifyClientBooking(saved)

    // Loyalty + referral code after confirmed booking
    if (LOYALTY_ENABLED) {
      const loyalty = await maybeIssueLoyaltyCode(saved.email)
      if (loyalty.issued && loyalty.code) {
        void notifyDiscountCodeEmail({
          toEmail: saved.email,
          subject: `Loyalty reward: $${loyalty.amount} off your next booking`,
          headline: 'You unlocked a loyalty discount!',
          body: `Thanks for booking with me ${loyalty.count ?? ''} times. Use code ${loyalty.code} on your next appointment for $${loyalty.amount} off.`,
          code: loyalty.code,
          amount: loyalty.amount ?? 0,
        })
      }
    }
    if (REFERRAL_ENABLED) {
      const ref = await ensureReferralCode(saved.email)
      if (ref.ok && ref.code) {
        void notifyDiscountCodeEmail({
          toEmail: saved.email,
          subject: 'Your Braided by Rolake referral code',
          headline: 'Share your referral code',
          body: `Share ${ref.code} with a friend. They get $${REFERRAL_DISCOUNT_FRIEND} off their first booking, and you’ll get a thank-you code after they book.`,
          code: ref.code,
          amount: REFERRAL_DISCOUNT_FRIEND,
        })
      }
    }
  }, [])

  const getBooking = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  )

  const clearAllBookings = useCallback(async () => {
    await clearAllBookingsRemote()
    setBookings([])
  }, [])

  const value = useMemo(
    () => ({
      bookings,
      loading,
      storageMode: isSupabaseConfigured ? ('supabase' as const) : ('local' as const),
      refreshBookings,
      createListedBooking,
      createOffer,
      createQuoteRequest,
      acceptOffer,
      declineOffer,
      counterOffer,
      clientAcceptCounter,
      clientWalkAway,
      markDepositPaid,
      markDepositReceived,
      getBooking,
      clearAllBookings,
    }),
    [
      bookings,
      loading,
      refreshBookings,
      createListedBooking,
      createOffer,
      createQuoteRequest,
      acceptOffer,
      declineOffer,
      counterOffer,
      clientAcceptCounter,
      clientWalkAway,
      markDepositPaid,
      markDepositReceived,
      getBooking,
      clearAllBookings,
    ],
  )

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings must be used within BookingProvider')
  return ctx
}
