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
  calculateBookingTotal,
  getServiceById,
  type Booking,
  type BookingStatus,
  type BraidSizeId,
  type LengthId,
  type MobileZoneId,
} from '../data'
import { notifyOwner } from '../lib/notifications'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  clearAllBookingsRemote,
  generateId,
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
}

export interface CreateOfferInput extends CreateListedInput {
  offerAmount: number
  note?: string
}

interface BookingContextValue {
  bookings: Booking[]
  loading: boolean
  storageMode: 'supabase' | 'local'
  refreshBookings: () => Promise<void>
  createListedBooking: (input: CreateListedInput) => Promise<Booking>
  createOffer: (input: CreateOfferInput) => Promise<Booking>
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
    depositAmount: CONFIG.depositAmount,
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
      price,
      depositAmount,
    } = buildPriceFields(input)

    const booking: Booking = {
      id: generateId(),
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
      depositAmount,
      depositPaid: false,
      inspoUrl: input.inspoUrl,
      notesAccommodations: input.notesAccommodations?.trim() || undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    const saved = await insertBooking(booking)
    setBookings((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)])
    void notifyOwner(saved)
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

  const acceptOffer = useCallback(async (id: string) => {
    const current = (await loadBookings()).find((b) => b.id === id)
    if (!current) return
    const finalPrice = current.counterAmount ?? current.offerAmount ?? current.price
    const saved = await updateBookingRemote(id, {
      status: 'awaiting_deposit' as BookingStatus,
      price: finalPrice,
    })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
    void notifyOwner(saved)
  }, [])

  const declineOffer = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, { status: 'declined' })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
  }, [])

  const counterOffer = useCallback(async (id: string, amount: number) => {
    const saved = await updateBookingRemote(id, {
      status: 'countered',
      counterAmount: amount,
    })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
  }, [])

  const clientAcceptCounter = useCallback(async (id: string) => {
    const current = (await loadBookings()).find((b) => b.id === id)
    if (!current || current.counterAmount == null) return
    const saved = await updateBookingRemote(id, {
      status: 'awaiting_deposit',
      price: current.counterAmount,
    })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
    void notifyOwner(saved)
  }, [])

  const clientWalkAway = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, { status: 'declined' })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
  }, [])

  const markDepositPaid = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, { depositPaid: true })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
  }, [])

  const markDepositReceived = useCallback(async (id: string) => {
    const saved = await updateBookingRemote(id, {
      status: 'confirmed' as BookingStatus,
      depositPaid: true,
    })
    setBookings((prev) => prev.map((b) => (b.id === id ? saved : b)))
    void notifyOwner(saved)
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
