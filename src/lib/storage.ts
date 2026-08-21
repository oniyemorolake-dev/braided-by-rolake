import type { Booking } from '../data'

const STORAGE_KEY = 'bbr_bookings_v1'

/**
 * Local persistence layer. Swap this module for a Supabase client later —
 * keep the same function signatures so the context/UI stay unchanged.
 */
export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Booking[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveBookings(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
}

export function generateId(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
