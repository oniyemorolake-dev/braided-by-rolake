import { CONFIG, type Booking, type BookingStatus, type BookingType, type BraidSizeId, type DiscountType, type LengthId, type MobileZoneId } from '../data'
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
  quoted_price: number | null
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
  discount_code: string | null
  discount_amount: number | null
  discount_type: string | null
  created_at: string
  updated_at: string
}

/** Public occupancy row — no client PII */
interface OccupancyRow {
  id: string
  date: string
  slot: string
  service_id: string
  status: BookingStatus
  size: string | null
  length_id: string | null
  addon_ids: string[] | null
  mobile_service: boolean | null
}

function rowToBooking(row: BookingRow): Booking {
  const counter =
    row.counter_amount != null
      ? Number(row.counter_amount)
      : row.quoted_price != null
        ? Number(row.quoted_price)
        : undefined
  return {
    id: row.id,
    serviceId: row.service_id,
    date: typeof row.date === 'string' ? row.date : String(row.date),
    slot: row.slot,
    clientName: row.client_name,
    phone: row.phone,
    email: row.email,
    price: Number(row.price),
    type: row.type,
    status: row.status,
    offerAmount: row.offer_amount != null ? Number(row.offer_amount) : undefined,
    counterAmount: counter,
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
    discountCode: row.discount_code ?? undefined,
    discountAmount: row.discount_amount != null ? Number(row.discount_amount) : undefined,
    discountType: (row.discount_type as DiscountType | null) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Occupancy stubs are enough for slot conflict checks — never expose PII here */
function occupancyToBooking(row: OccupancyRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    date: typeof row.date === 'string' ? row.date : String(row.date),
    slot: row.slot,
    clientName: '',
    phone: '',
    email: '',
    price: 0,
    type: 'listed',
    status: row.status,
    size: (row.size as BraidSizeId | null) ?? undefined,
    lengthId: (row.length_id as LengthId | null) ?? undefined,
    addonIds: row.addon_ids ?? [],
    mobileService: Boolean(row.mobile_service),
    createdAt: '',
    updatedAt: '',
  }
}

function bookingToRow(booking: Booking): Omit<BookingRow, 'quoted_price'> & { quoted_price?: number | null } {
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
    quoted_price: booking.counterAmount ?? null,
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
    discount_code: booking.discountCode ?? null,
    discount_amount: booking.discountAmount ?? null,
    discount_type: booking.discountType ?? null,
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  }
}

function patchToSnake(patch: Partial<Booking>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (patch.serviceId !== undefined) out.service_id = patch.serviceId
  if (patch.date !== undefined) out.date = patch.date
  if (patch.slot !== undefined) out.slot = patch.slot
  if (patch.clientName !== undefined) out.client_name = patch.clientName
  if (patch.phone !== undefined) out.phone = patch.phone
  if (patch.email !== undefined) out.email = patch.email
  if (patch.price !== undefined) out.price = patch.price
  if (patch.type !== undefined) out.type = patch.type
  if (patch.status !== undefined) out.status = patch.status
  if (patch.offerAmount !== undefined) out.offer_amount = patch.offerAmount
  if (patch.counterAmount !== undefined) {
    out.counter_amount = patch.counterAmount
    out.quoted_price = patch.counterAmount
  }
  if (patch.note !== undefined) out.note = patch.note
  if (patch.size !== undefined) out.size = patch.size
  if (patch.lengthId !== undefined) out.length_id = patch.lengthId
  if (patch.addonIds !== undefined) out.addon_ids = patch.addonIds
  if (patch.mobileService !== undefined) out.mobile_service = patch.mobileService
  if (patch.mobileZoneId !== undefined) out.mobile_zone_id = patch.mobileZoneId
  if (patch.mobileAddress !== undefined) out.mobile_address = patch.mobileAddress
  if (patch.depositAmount !== undefined) out.deposit_amount = patch.depositAmount
  if (patch.depositPaid !== undefined) out.deposit_paid = patch.depositPaid
  if (patch.inspoUrl !== undefined) out.inspo_url = patch.inspoUrl
  if (patch.notesAccommodations !== undefined) out.notes_accommodations = patch.notesAccommodations
  if (patch.discountCode !== undefined) out.discount_code = patch.discountCode
  if (patch.discountAmount !== undefined) out.discount_amount = patch.discountAmount
  if (patch.discountType !== undefined) out.discount_type = patch.discountType
  return out
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

function isAdminSession(): boolean {
  try {
    return sessionStorage.getItem('bbr_admin') === '1'
  } catch {
    return false
  }
}

/** Public: occupied slots only (no names/phones/emails). Admin session: full rows. */
export async function loadBookings(): Promise<Booking[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal()
  }

  if (isAdminSession()) {
    return adminLoadBookings()
  }

  const { data, error } = await supabase.rpc('list_booking_occupancy')
  if (error) {
    console.error('[bookings] occupancy load failed', error.message)
    throw new Error(error.message)
  }
  return (data as OccupancyRow[]).map(occupancyToBooking)
}

/** Admin: full booking list (password-gated RPC). */
export async function adminLoadBookings(
  password = CONFIG.adminPassword,
): Promise<Booking[]> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal()
  }
  const { data, error } = await supabase.rpc('admin_list_bookings', {
    p_password: password,
  })
  if (error) {
    console.error('[bookings] admin list failed', error.message)
    throw new Error(error.message)
  }
  return (data as BookingRow[]).map(rowToBooking)
}

/** Public: fetch one booking by exact id (status page). */
export async function getBookingById(id: string): Promise<Booking | null> {
  if (!supabase || !isSupabaseConfigured) {
    return loadLocal().find((b) => b.id === id) ?? null
  }
  const { data, error } = await supabase.rpc('get_booking_by_id', { p_id: id })
  if (error) {
    console.error('[bookings] get by id failed', error.message)
    return null
  }
  return rowToBooking(data as BookingRow)
}

/** Insert a new booking. */
export async function insertBooking(booking: Booking): Promise<Booking> {
  if (!supabase || !isSupabaseConfigured) {
    const next = [booking, ...loadLocal()]
    saveLocal(next)
    return booking
  }

  const { error } = await supabase.from('bookings').insert(bookingToRow(booking))
  if (error) {
    console.error('[bookings] insert failed', error.message)
    throw new Error(error.message)
  }

  // INSERT has no SELECT policy — re-fetch via id RPC
  const saved = await getBookingById(booking.id)
  if (!saved) throw new Error('Booking created but could not be reloaded.')
  return saved
}

type UpdateMode = 'admin' | 'client_deposit' | 'client_accept' | 'client_walk' | 'auto'

function inferUpdateMode(patch: Partial<Booking>): UpdateMode {
  const keys = Object.keys(patch)
  if (keys.length === 1 && patch.depositPaid === true) return 'client_deposit'
  if (
    patch.status === 'awaiting_deposit' &&
    patch.price != null &&
    keys.every((k) => k === 'status' || k === 'price')
  ) {
    return 'client_accept'
  }
  if (keys.length === 1 && patch.status === 'declined') return 'client_walk'
  return 'admin'
}

/** Patch an existing booking via client or admin RPC. */
export async function updateBookingRemote(
  id: string,
  patch: Partial<Booking>,
  mode: UpdateMode = 'auto',
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

  const resolved = mode === 'auto' ? inferUpdateMode(patch) : mode

  if (resolved === 'client_deposit') {
    const { data, error } = await supabase.rpc('client_mark_deposit_paid', { p_id: id })
    if (error) throw new Error(error.message)
    return rowToBooking(data as BookingRow)
  }
  if (resolved === 'client_accept') {
    const { data, error } = await supabase.rpc('client_accept_counter', { p_id: id })
    if (error) throw new Error(error.message)
    return rowToBooking(data as BookingRow)
  }
  if (resolved === 'client_walk') {
    const { data, error } = await supabase.rpc('client_walk_away', { p_id: id })
    if (error) throw new Error(error.message)
    return rowToBooking(data as BookingRow)
  }

  const { data, error } = await supabase.rpc('admin_update_booking', {
    p_password: CONFIG.adminPassword,
    p_id: id,
    p_patch: patchToSnake(patch),
  })
  if (error) {
    console.error('[bookings] admin update failed', error.message)
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

  const { error } = await supabase.rpc('admin_clear_bookings', {
    p_password: CONFIG.adminPassword,
  })
  if (error) {
    console.error('[bookings] clear failed', error.message)
    throw new Error(error.message)
  }
}
