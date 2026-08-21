import type { Booking, BookingStatus, BookingType, BraidSizeId, LengthId, MobileZoneId } from '../data'
import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_KEY = 'bbr_bookings_v1'

interface BookingRow {
  id: string
  service_id: string
  date: string
  slot: string
  client_name: string
  phone: string
  email: string
  price: number
  type: BookingType
  status: BookingStatus
  offer_amount: number | null
  counter_amount: number | null
  note: string | null
  size: string | null
  length_id: string | null
  addon_ids: string[] | null
  mobile_service: boolean | null
  mobile_zone_id: string | null
  mobile_address: string | null
  deposit_amount: number | null
  deposit_paid: boolean | null
  inspo_url: string | null
  notes_accommodations: string | null
  created_at: string
  updated_at: string
}

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    date: row.date,
    slot: row.slot,
    clientName: row.client_name,
    phone: row.phone,
    email: row.email,
    price: Number(row.price),
    type: row.type,
    status: row.status,
    offerAmount: row.offer_amount != null ? Number(row.offer_amount) : undefined,
    counterAmount: row.counter_amount != null ? Number(row.counter_amount) : undefined,
    note: row.note ?? undefined,
    size: (row.size as BraidSizeId | null) ?? undefined,
    lengthId: (row.length_id as LengthId | null) ?? undefined,
    addonIds: row.addon_ids ?? [],
    mobileService: Boolean(row.mobile_service),
    mobileZoneId: (row.mobile_zone_id as MobileZoneId | null) ?? undefined,
    mobileAddress: row.mobile_address ?? undefined,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
    depositPaid: Boolean(row.deposit_paid),
    inspoUrl: row.inspo_url ?? undefined,
    notesAccommodations: row.notes_accommodations ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function bookingToRow(booking: Booking): BookingRow {
  return {
    id: booking.id,
    service_id: booking.serviceId,
    date: booking.date,
    slot: booking.slot,
    client_name: booking.clientName,
    phone: booking.phone,
    email: booking.email,
    price: booking.price,
    type: booking.type,
    status: booking.status,
    offer_amount: booking.offerAmount ?? null,
    counter_amount: booking.counterAmount ?? null,
    note: booking.note ?? null,
    size: booking.size ?? null,
    length_id: booking.lengthId ?? null,
    addon_ids: booking.addonIds ?? [],
    mobile_service: Boolean(booking.mobileService),
    mobile_zone_id: booking.mobileZoneId ?? null,
    mobile_address: booking.mobileAddress ?? null,
    deposit_amount: booking.depositAmount ?? null,
    deposit_paid: Boolean(booking.depositPaid),
    inspo_url: booking.inspoUrl ?? null,
    notes_accommodations: booking.notesAccommodations ?? null,
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  }
}

function loadLocal(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Booking[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
}

export function generateId(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Load all bookings from Supabase (or localStorage fallback). */
export async function loadBookings(): Promise<Booking[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal()
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[bookings] load failed', error.message)
    throw new Error(error.message)
  }

  return (data as BookingRow[]).map(rowToBooking)
}

/** Insert a new booking. */
export async function insertBooking(booking: Booking): Promise<Booking> {
  if (!supabase || !isSupabaseConfigured) {
    const next = [booking, ...loadLocal()]
    saveLocal(next)
    return booking
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingToRow(booking))
    .select('*')
    .single()

  if (error) {
    console.error('[bookings] insert failed', error.message)
    throw new Error(error.message)
  }

  return rowToBooking(data as BookingRow)
}

/** Patch an existing booking. */
export async function updateBookingRemote(
  id: string,
  patch: Partial<Booking>,
): Promise<Booking> {
  if (!supabase || !isSupabaseConfigured) {
    const list = loadLocal()
    const next = list.map((b) =>
      b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
    )
    saveLocal(next)
    const found = next.find((b) => b.id === id)
    if (!found) throw new Error('Booking not found')
    return found
  }

  const rowPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (patch.serviceId !== undefined) rowPatch.service_id = patch.serviceId
  if (patch.date !== undefined) rowPatch.date = patch.date
  if (patch.slot !== undefined) rowPatch.slot = patch.slot
  if (patch.clientName !== undefined) rowPatch.client_name = patch.clientName
  if (patch.phone !== undefined) rowPatch.phone = patch.phone
  if (patch.email !== undefined) rowPatch.email = patch.email
  if (patch.price !== undefined) rowPatch.price = patch.price
  if (patch.type !== undefined) rowPatch.type = patch.type
  if (patch.status !== undefined) rowPatch.status = patch.status
  if (patch.offerAmount !== undefined) rowPatch.offer_amount = patch.offerAmount
  if (patch.counterAmount !== undefined) rowPatch.counter_amount = patch.counterAmount
  if (patch.note !== undefined) rowPatch.note = patch.note
  if (patch.size !== undefined) rowPatch.size = patch.size
  if (patch.lengthId !== undefined) rowPatch.length_id = patch.lengthId
  if (patch.addonIds !== undefined) rowPatch.addon_ids = patch.addonIds
  if (patch.mobileService !== undefined) rowPatch.mobile_service = patch.mobileService
  if (patch.mobileZoneId !== undefined) rowPatch.mobile_zone_id = patch.mobileZoneId
  if (patch.mobileAddress !== undefined) rowPatch.mobile_address = patch.mobileAddress
  if (patch.depositAmount !== undefined) rowPatch.deposit_amount = patch.depositAmount
  if (patch.depositPaid !== undefined) rowPatch.deposit_paid = patch.depositPaid
  if (patch.inspoUrl !== undefined) rowPatch.inspo_url = patch.inspoUrl
  if (patch.notesAccommodations !== undefined) {
    rowPatch.notes_accommodations = patch.notesAccommodations
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(rowPatch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[bookings] update failed', error.message)
    throw new Error(error.message)
  }

  return rowToBooking(data as BookingRow)
}

/** Clear all bookings (admin utility). */
export async function clearAllBookingsRemote(): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    saveLocal([])
    return
  }

  const { error } = await supabase.from('bookings').delete().neq('id', '')
  if (error) {
    console.error('[bookings] clear failed', error.message)
    throw new Error(error.message)
  }
}
