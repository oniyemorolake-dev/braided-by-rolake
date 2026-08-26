import {
  CONFIG,
  getBookingDurationHours,
  type Booking,
  type Service,
} from '../data'
import {
  slotConflictsWithBlocks,
  type ScheduleBlock,
} from './scheduleBlocks'

/** Convert "HH:mm" to minutes from midnight */
export function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

export function minutesToSlot(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Bookings that occupy time on a given date:
 * confirmed + awaiting_deposit + pending + quote_requested + countered (slot held). Declined frees the slot.
 */
export function isBlockingStatus(status: Booking['status']): boolean {
  return (
    status === 'confirmed' ||
    status === 'awaiting_deposit' ||
    status === 'pending' ||
    status === 'quote_requested' ||
    status === 'countered'
  )
}

export function getBookingOccupiedRange(
  booking: Booking,
  serviceDurationHours: number,
): { start: number; end: number } {
  const start = slotToMinutes(booking.slot)
  const end =
    start + serviceDurationHours * 60 + CONFIG.bufferMinutes
  return { start, end }
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

/**
 * Available start slots for a service on a date.
 * Working hours − existing bookings (duration + buffer) − unfittable starts.
 */
export function getAvailableSlots(
  date: string,
  service: Service,
  bookings: Booking[],
  excludeBookingId?: string,
  blocks: ScheduleBlock[] = [],
): string[] {
  const day = new Date(date + 'T12:00:00')
  const dow = day.getDay()
  if (!CONFIG.workingDays.includes(dow)) return []

  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = todayIso === date

  const workStart = CONFIG.workStartHour * 60
  const workEnd = CONFIG.workEndHour * 60
  const durationMins = service.durationHours * 60
  const interval = CONFIG.slotIntervalMinutes

  const occupied = bookings
    .filter(
      (b) =>
        b.date === date &&
        isBlockingStatus(b.status) &&
        b.id !== excludeBookingId,
    )
    .map((b) => getBookingOccupiedRange(b, getBookingDurationHours(b)))

  const slots: string[] = []

  for (let start = workStart; start + durationMins <= workEnd; start += interval) {
    if (isToday) {
      const currentMins = now.getHours() * 60 + now.getMinutes()
      if (start < currentMins + 60) continue
    }

    const endWithBuffer = start + durationMins + CONFIG.bufferMinutes
    if (start + durationMins > workEnd) continue

    const conflicts = occupied.some((occ) =>
      rangesOverlap(start, endWithBuffer, occ.start, occ.end),
    )
    if (conflicts) continue

    const slot = minutesToSlot(start)
    if (slotConflictsWithBlocks(date, slot, durationMins + CONFIG.bufferMinutes, blocks)) {
      continue
    }

    slots.push(slot)
  }

  return slots
}

export function canFitServiceOnDate(
  date: string,
  service: Service,
  bookings: Booking[],
  blocks: ScheduleBlock[] = [],
): boolean {
  return getAvailableSlots(date, service, bookings, undefined, blocks).length > 0
}

/** Next N bookable calendar dates (YYYY-MM-DD) that have at least one slot */
export function getBookableDates(
  service: Service,
  bookings: Booking[],
  daysAhead = 60,
  blocks: ScheduleBlock[] = [],
): string[] {
  const dates: string[] = []
  const start = new Date()
  start.setHours(12, 0, 0, 0)

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (canFitServiceOnDate(iso, service, bookings, blocks)) {
      dates.push(iso)
    }
  }
  return dates
}
