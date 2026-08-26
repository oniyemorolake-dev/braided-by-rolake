import {
  formatDateLabel,
  formatPrice,
  formatSlotLabel,
  getServiceById,
  type Booking,
} from '../data'
import { isBlockingStatus } from './scheduling'

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export interface DaySummary {
  date: string
  label: string
  bookings: Booking[]
}

export interface OpsSummary {
  today: DaySummary
  week: DaySummary[]
  pendingOffers: number
  awaitingDeposit: number
  confirmedToday: number
  confirmedWeek: number
  revenueWeek: number
}

function activeBookingsOnDate(bookings: Booking[], date: string): Booking[] {
  return bookings
    .filter((b) => b.date === date && isBlockingStatus(b.status))
    .sort((a, b) => a.slot.localeCompare(b.slot))
}

export function buildOpsSummary(bookings: Booking[], now = new Date()): OpsSummary {
  const todayIso = toIsoDate(now)
  const weekStart = startOfWeek(now)
  const week: DaySummary[] = []
  let confirmedWeek = 0
  let revenueWeek = 0

  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i)
    const iso = toIsoDate(d)
    const list = activeBookingsOnDate(bookings, iso)
    week.push({
      date: iso,
      label: formatDateLabel(iso),
      bookings: list,
    })
    for (const b of list) {
      if (b.status === 'confirmed') {
        confirmedWeek += 1
        revenueWeek += b.price
      }
    }
  }

  const todayList = activeBookingsOnDate(bookings, todayIso)
  let pendingOffers = 0
  let awaitingDeposit = 0
  for (const b of bookings) {
    if (b.status === 'pending' || b.status === 'quote_requested' || b.status === 'countered') {
      pendingOffers += 1
    } else if (b.status === 'awaiting_deposit') {
      awaitingDeposit += 1
    }
  }

  return {
    today: {
      date: todayIso,
      label: formatDateLabel(todayIso),
      bookings: todayList,
    },
    week,
    pendingOffers,
    awaitingDeposit,
    confirmedToday: todayList.filter((b) => b.status === 'confirmed').length,
    confirmedWeek,
    revenueWeek,
  }
}

export function formatBookingLine(b: Booking): string {
  const service = getServiceById(b.serviceId)?.name ?? b.serviceId
  return `${formatSlotLabel(b.slot)} · ${service} · ${b.clientName || 'Client'} · ${formatPrice(b.price)}`
}
