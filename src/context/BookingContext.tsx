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
import { generateId, loadBookings, saveBookings } from '../lib/storage'

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
}

export interface CreateOfferInput extends CreateListedInput {
  offerAmount: number
  note?: string
}

interface BookingContextValue {
  bookings: Booking[]
  createListedBooking: (input: CreateListedInput) => Promise<Booking>
  createOffer: (input: CreateOfferInput) => Promise<Booking>
  acceptOffer: (id: string) => void
  declineOffer: (id: string) => void
  counterOffer: (id: string, amount: number) => void
  clientAcceptCounter: (id: string) => void
  clientWalkAway: (id: string) => void
  getBooking: (id: string) => Booking | undefined
  clearAllBookings: () => void
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
  const [bookings, setBookings] = useState<Booking[]>(() => loadBookings())

  useEffect(() => {
    saveBookings(bookings)
  }, [bookings])

  const updateBooking = useCallback(
    (id: string, patch: Partial<Booking>) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, ...patch, updatedAt: nowIso() } : b,
        ),
      )
    },
    [],
  )

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
      status: 'confirmed',
      size,
      lengthId,
      addonIds,
      mobileService,
      mobileZoneId,
      mobileAddress,
      depositAmount,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    setBookings((prev) => [booking, ...prev])
    void notifyOwner(booking)
    return booking
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
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    setBookings((prev) => [booking, ...prev])
    if (!belowFloor) {
      void notifyOwner(booking)
    }
    return booking
  }, [])

  const acceptOffer = useCallback((id: string) => {
    setBookings((prev) => {
      const next = prev.map((b) => {
        if (b.id !== id) return b
        const finalPrice = b.counterAmount ?? b.offerAmount ?? b.price
        return {
          ...b,
          status: 'confirmed' as BookingStatus,
          price: finalPrice,
          updatedAt: nowIso(),
        }
      })
      const confirmed = next.find((b) => b.id === id)
      if (confirmed) void notifyOwner(confirmed)
      return next
    })
  }, [])

  const declineOffer = useCallback(
    (id: string) => {
      updateBooking(id, { status: 'declined' })
    },
    [updateBooking],
  )

  const counterOffer = useCallback((id: string, amount: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'countered' as BookingStatus,
              counterAmount: amount,
              updatedAt: nowIso(),
            }
          : b,
      ),
    )
  }, [])

  const clientAcceptCounter = useCallback((id: string) => {
    setBookings((prev) => {
      const next = prev.map((b) => {
        if (b.id !== id || b.counterAmount == null) return b
        return {
          ...b,
          status: 'confirmed' as BookingStatus,
          price: b.counterAmount,
          updatedAt: nowIso(),
        }
      })
      const confirmed = next.find((b) => b.id === id)
      if (confirmed?.status === 'confirmed') void notifyOwner(confirmed)
      return next
    })
  }, [])

  const clientWalkAway = useCallback(
    (id: string) => {
      updateBooking(id, { status: 'declined' })
    },
    [updateBooking],
  )

  const getBooking = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  )

  const clearAllBookings = useCallback(() => {
    setBookings([])
  }, [])

  const value = useMemo(
    () => ({
      bookings,
      createListedBooking,
      createOffer,
      acceptOffer,
      declineOffer,
      counterOffer,
      clientAcceptCounter,
      clientWalkAway,
      getBooking,
      clearAllBookings,
    }),
    [
      bookings,
      createListedBooking,
      createOffer,
      acceptOffer,
      declineOffer,
      counterOffer,
      clientAcceptCounter,
      clientWalkAway,
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
