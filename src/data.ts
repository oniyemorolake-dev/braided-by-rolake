/**
 * Seed data & config for Braided by Rolake.
 * Structured so services/bookings/offers can later move to Supabase
 * without rewriting the UI — swap storage adapters, keep these types.
 */

export type BookingType = 'listed' | 'offer'
export type BookingStatus =
  | 'confirmed'
  | 'awaiting_deposit'
  | 'pending'
  | 'countered'
  | 'declined'

export type BraidSizeId = 'small' | 'smedium' | 'medium' | 'large'
export type LengthId = 'shoulder' | 'midback' | 'waist' | 'butt'
export type MobileZoneId = 'calgary' | 'nearby' | 'extended'

export interface Service {
  id: string
  name: string
  /** Base price for medium size + shoulder length */
  price: number
  durationHours: number
  /** Optional - add real photos later */
  image?: string
  description: string
  /** Optional floor — offers below this are auto-declined. Omit = all offers accepted for review. */
  minOffer?: number
  featured?: boolean
  /** Whether client picks Small / Smedium / Medium / Large */
  hasSizes?: boolean
  /** Adult styles vs kids (ages 4–11) vs hair care extras */
  category?: 'adult' | 'kids' | 'care'
}

export interface SizeOption {
  id: BraidSizeId
  label: string
  priceAdjust: number
  durationAdjustHours: number
}

export interface LengthOption {
  id: LengthId
  label: string
  price: number
  description: string
}

export interface Addon {
  id: string
  name: string
  price: number
  description: string
}

/** Travel fee when Rolake comes to the client — priced by area */
export interface MobileZone {
  id: MobileZoneId
  label: string
  price: number
  description: string
}

export interface Booking {
  id: string
  serviceId: string
  date: string // YYYY-MM-DD
  slot: string // HH:mm (24h)
  clientName: string
  phone: string
  email: string
  price: number
  type: BookingType
  status: BookingStatus
  offerAmount?: number
  counterAmount?: number
  note?: string
  size?: BraidSizeId
  lengthId?: LengthId
  addonIds?: string[]
  /** True when client requests mobile (at-home) service */
  mobileService?: boolean
  mobileZoneId?: MobileZoneId
  /** Area or street address for mobile appointments */
  mobileAddress?: string
  depositAmount?: number
  /** Client marked e-Transfer as sent */
  depositPaid?: boolean
  createdAt: string
  updatedAt: string
}

export interface BusinessConfig {
  name: string
  tagline: string
  city: string
  /** Shown only after booking is confirmed */
  studioAddress: string
  instagram: string
  instagramUrl: string
  email: string
  phoneDisplay: string
  contactPhone: string
  cancellationHours: number
  /** Minimum deposit required to hold a booking */
  depositAmount: number
  /** Interac e-Transfer email for deposits (free for most Canadian banks) */
  depositEmail: string
  depositInstructions: string
  /** Prices shown on site are before tax when true */
  pricesBeforeTax: boolean
  taxLabel: string
  taxNote: string
  /** 0 = Sun … 6 = Sat — working days */
  workingDays: number[]
  workStartHour: number
  workEndHour: number
  bufferMinutes: number
  slotIntervalMinutes: number
  adminPassword: string
  web3formsAccessKey: string
}


/** Interac e-Transfer destination for deposits */
export const ETRANSFER_EMAIL = 'oniyemorolake@gmail.com'

/** Client-facing text/SMS number - set Rolake's real number here */
export const CONTACT_PHONE = ''

/** Minimum notice (hours) to cancel or reschedule */
export const CANCELLATION_HOURS = 48

/** Prep checklist shown on confirmation, status page, and emails */
export const PREP_INSTRUCTIONS = [
  'Come with hair freshly washed and blow-dried (unless a wash is booked)',
  'Detangle your hair beforehand',
  'Arrive with hair product-free',
  'Bring any extensions/hair if not provided',
  'Eat before your appointment - long styles take several hours',
  'Kids should nap beforehand if possible',
] as const

export const CANCELLATION_POLICY = {
  title: 'Cancellation policy',
  summary: `Please cancel or reschedule at least ${CANCELLATION_HOURS} hours before your appointment.`,
  depositNote: 'Deposits are non-refundable for late cancellations or no-shows.',
  paragraphs: [
    `Need to cancel or reschedule? Reply to your confirmation email or text ${CONTACT_PHONE || 'the number on your booking confirmation'} at least ${CANCELLATION_HOURS} hours before your appointment.`,
    'Deposits are non-refundable for late cancellations or no-shows. Giving enough notice lets someone else take the spot and keeps the schedule fair for everyone.',
  ],
} as const

export function formatCancelNotice(): string {
  const phone = CONTACT_PHONE.trim()
  const contact = phone
    ? `Reply to this email or text ${phone}`
    : 'Reply to this email (mowebsiteco@gmail.com)'
  return `Need to cancel or reschedule? ${contact} at least ${CANCELLATION_HOURS} hours before your appointment.`
}

export const CONFIG: BusinessConfig = {
  name: 'Braided by Rolake',
  tagline: 'Protective styles, done with care',
  city: 'Calgary',
  studioAddress: 'Calgary, AB — full street address shared once your deposit is received',
  instagram: '@tgm.byrolake',
  instagramUrl: 'https://www.instagram.com/tgm.byrolake',
  email: 'mowebsiteco@gmail.com',
  phoneDisplay: CONTACT_PHONE || 'Text or email after booking',
  contactPhone: CONTACT_PHONE,
  cancellationHours: CANCELLATION_HOURS,
  depositAmount: 30,
  depositEmail: ETRANSFER_EMAIL,
  depositInstructions:
    'Send Interac e-Transfer with your name + booking date in the message. Auto-deposit preferred if enabled on this email. Remaining balance is paid in person.',
  pricesBeforeTax: true,
  taxLabel: 'GST',
  taxNote:
    'Prices as listed. Deposit by Interac e-Transfer — no card fees. GST only if Rolake is GST-registered.',
  workingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
  workStartHour: 9,
  workEndHour: 19,
  bufferMinutes: 60,
  slotIntervalMinutes: 60,
  adminPassword: 'Morolake2024.',
  web3formsAccessKey: '51a35843-c702-4cd1-8f50-af5d97571a74',
}

/** Studio policies shown on Services, booking, and confirmation */
export const POLICIES = [
  'Hair must be clean and pre-stretched before your appointment.',
  'I can provide extensions only on request — please ask when you book so we can plan ahead.',
  'A $30 deposit via Interac e-Transfer is required to secure your appointment — booking is confirmed once the deposit is received.',
  'Mobile (I come to you) is available for an extra travel fee based on your location.',
  'Prices as listed — deposit by e-Transfer (no card fees). Remaining balance paid in person.',
  'No wash / shampoo services — take-outs and dry detangling only for hair-care appointments.',
] as const

/** Discounts clients can ask for (applied manually / note in booking) */
export const DISCOUNTS = [
  {
    id: 'first-time',
    label: 'First-time client',
    detail: '10% off your first full style (mention when you book)',
  },
  {
    id: 'student',
    label: 'Student',
    detail: '$10 off with a valid student ID (weekday appointments)',
  },
  {
    id: 'referral',
    label: 'Refer a friend',
    detail: 'You both get $15 off your next booking after they complete theirs',
  },
  {
    id: 'weekday',
    label: 'Weekday booking',
    detail: '$10 off Mon–Thu appointments (listed-price bookings)',
  },
] as const

export const SIZE_OPTIONS: SizeOption[] = [
  {
    id: 'small',
    label: 'Small',
    priceAdjust: 30,
    durationAdjustHours: 1.5,
  },
  {
    id: 'smedium',
    label: 'Smedium',
    priceAdjust: 15,
    durationAdjustHours: 0.75,
  },
  {
    id: 'medium',
    label: 'Medium',
    priceAdjust: 0,
    durationAdjustHours: 0,
  },
  {
    id: 'large',
    label: 'Large',
    priceAdjust: -20,
    durationAdjustHours: -1,
  },
]

export const LENGTH_OPTIONS: LengthOption[] = [
  {
    id: 'shoulder',
    label: 'Shoulder',
    price: 0,
    description: 'Included in the base price',
  },
  {
    id: 'midback',
    label: 'Mid-back',
    price: 15,
    description: 'Extra length past the shoulders',
  },
  {
    id: 'waist',
    label: 'Waist',
    price: 20,
    description: 'Long, flowing length',
  },
  {
    id: 'butt',
    label: 'Butt-length',
    price: 40,
    description: 'Maximum length — more hair',
  },
]

export const ADDONS: Addon[] = [
  {
    id: 'curls',
    name: 'Curls',
    price: -10,
    description:
      'Curly ends instead of a full straight finish — saves time, so $10 off the total',
  },
  {
    id: 'boho',
    name: 'Boho strands',
    price: 25,
    description: 'Loose human-hair strands woven through for a goddess look',
  },
  {
    id: 'beads',
    name: 'Beads',
    price: 10,
    description: 'Decorative beads at the ends',
  },
  {
    id: 'color-mix',
    name: 'Colour mix',
    price: 10,
    description: 'Two or more colours blended through the set',
  },
]

/**
 * Mobile travel fees by location — fairer than one flat rate.
 * Studio visit = $0 travel; mobile adds the zone fee on top of the style.
 */
export const MOBILE_ZONES: MobileZone[] = [
  {
    id: 'calgary',
    label: 'Within Calgary',
    price: 25,
    description: 'Anywhere inside Calgary city limits',
  },
  {
    id: 'nearby',
    label: 'Nearby communities',
    price: 40,
    description: 'Airdrie, Cochrane, Okotoks, Chestermere, and similar',
  },
  {
    id: 'extended',
    label: 'Extended travel',
    price: 65,
    description: 'Further out — I’ll confirm the trip after you book',
  },
]

export const SERVICES: Service[] = [
  {
    id: 'knotless',
    name: 'Knotless Braids',
    price: 120,
    durationHours: 5,
    description:
      'Lightweight, tension-friendly braids that look natural from root to tip. Ideal for everyday wear and low manipulation. (Braiding hair not included unless arranged.)',
    minOffer: 95,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'boho-knotless',
    name: 'Boho / Goddess Knotless',
    price: 150,
    durationHours: 6,
    description:
      'Knotless braids with soft human-hair strands for that effortless goddess look. Perfect for vacations and special moments.',
    minOffer: 120,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'box',
    name: 'Box Braids',
    price: 100,
    durationHours: 4,
    description:
      'Classic protective braids with clean parts and lasting hold. Sized to your preference — medium is most popular.',
    minOffer: 80,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'fulani',
    name: 'Fulani Braids',
    price: 100,
    durationHours: 4,
    description:
      'Tribal-inspired design with cornrows in the middle and braids around the sides — beads optional.',
    minOffer: 80,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'lemonade',
    name: 'Lemonade Braids',
    price: 95,
    durationHours: 3.5,
    description:
      'Side-swept cornrows and braids that frame the face. Sleek, stylish, and camera-ready.',
    minOffer: 75,
    hasSizes: true,
  },
  {
    id: 'cornrows',
    name: 'Cornrows / Feed-in',
    price: 55,
    durationHours: 2,
    description:
      'Neat feed-in cornrows that grow gracefully into your length. Great for workouts, travel, or a sleek look.',
    minOffer: 40,
    hasSizes: false,
  },
  {
    id: 'stitch',
    name: 'Stitch Braids',
    price: 65,
    durationHours: 2.5,
    description:
      'Clean, stitched parts for a sharp finish. Straight-back or custom designs available.',
    minOffer: 50,
    hasSizes: false,
  },
  {
    id: 'twists',
    name: 'Two-Strand Twists',
    price: 110,
    durationHours: 4,
    description:
      'Soft two-strand twists with defined parts. Protective, versatile, and easy to style up or down.',
    minOffer: 90,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'passion',
    name: 'Passion Twists',
    price: 120,
    durationHours: 5,
    description:
      'Romantic, springy twists with a soft fall. Low maintenance and beautiful for weeks.',
    minOffer: 95,
    hasSizes: true,
  },
  {
    id: 'senegalese',
    name: 'Senegalese Twists',
    price: 115,
    durationHours: 5,
    description:
      'Rope-style twists with a polished finish. Great for a sleek protective look that lasts.',
    minOffer: 90,
    hasSizes: true,
  },
  {
    id: 'soft-locs',
    name: 'Soft Locs',
    price: 140,
    durationHours: 6,
    description:
      'Faux locs with a soft, natural feel. Lightweight compared to traditional locs and easy to style.',
    minOffer: 110,
    hasSizes: true,
  },
  {
    id: 'butterfly',
    name: 'Butterfly Locs',
    price: 150,
    durationHours: 6,
    description:
      'Textured, wavy faux locs with that signature butterfly look — bold and low-maintenance.',
    minOffer: 120,
    hasSizes: true,
  },
  {
    id: 'french-curls',
    name: 'French Curls',
    price: 130,
    durationHours: 5,
    description:
      'Braids finished with soft French-curl ends for bounce and volume. Pretty, feminine, and great for events.',
    minOffer: 100,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'french-plaits',
    name: 'French Plaits',
    price: 55,
    durationHours: 2.5,
    description:
      'Classic French plaits (braids) with clean parts — one, two, or more. Simple, neat, and timeless.',
    minOffer: 40,
    hasSizes: false,
  },
  {
    id: 'island-braids',
    name: 'Island Braids',
    price: 110,
    durationHours: 4.5,
    description:
      'Chunky, vacation-ready island braids with a relaxed vibe. Perfect for travel, beach days, and low upkeep.',
    minOffer: 90,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'ponytail',
    name: 'Cornrow Ponytail',
    price: 50,
    durationHours: 2,
    description:
      'Sleek cornrows gathered into a polished ponytail. Perfect for events, school, or keeping hair tidy.',
    minOffer: 40,
    hasSizes: false,
  },

  // —— Hair care (take-outs & detangling — no wash) ——
  {
    id: 'take-out',
    name: 'Take Out (Braid Removal)',
    price: 40,
    durationHours: 1.5,
    description:
      'Careful removal of braids, twists, or locs. Taken down gently to protect your natural hair. No restyle and no wash included.',
    minOffer: 30,
    hasSizes: false,
    category: 'care',
    featured: true,
  },
  {
    id: 'take-out-long',
    name: 'Take Out · Long / Dense Styles',
    price: 55,
    durationHours: 2.5,
    description:
      'For waist+ length, small size, or very dense sets that need more time to remove safely. No wash included.',
    minOffer: 40,
    hasSizes: false,
    category: 'care',
  },
  {
    id: 'detangle-no-wash',
    name: 'Detangling (No Wash)',
    price: 35,
    durationHours: 1,
    description:
      'Finger-detangle and section your natural hair after a take-out or between styles. Dry detangle only — no shampoo or wash.',
    minOffer: 25,
    hasSizes: false,
    category: 'care',
    featured: true,
  },
  {
    id: 'take-out-detangle',
    name: 'Take Out + Detangle (No Wash)',
    price: 65,
    durationHours: 2.5,
    description:
      'Full take-out plus gentle no-wash detangling so your hair is soft and ready for your next style or wash day at home.',
    minOffer: 50,
    hasSizes: false,
    category: 'care',
  },

  // —— Kids (ages 4–11) ——
  {
    id: 'kids-braids',
    name: 'Kids Braids',
    price: 45,
    durationHours: 2,
    description:
      'Ages 4–11. Soft, simple braids sized for little heads — neat parts, gentle tension, and a finish that lasts through school and play.',
    minOffer: 35,
    hasSizes: false,
    category: 'kids',
    featured: true,
  },
  {
    id: 'kids-cornrows',
    name: 'Kids Cornrows',
    price: 40,
    durationHours: 1.5,
    description:
      'Ages 4–11. Straight-back or design cornrows that stay tidy for school, sports, and busy weeks. Soft on the scalp.',
    minOffer: 30,
    hasSizes: false,
    category: 'kids',
    featured: true,
  },
  {
    id: 'kids-box',
    name: 'Kids Box Braids',
    price: 60,
    durationHours: 3,
    description:
      'Ages 4–11. Lightweight box braids in a kid-friendly size — protective, cute, and easy for parents to maintain.',
    minOffer: 45,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-knotless',
    name: 'Kids Knotless Braids',
    price: 70,
    durationHours: 3.5,
    description:
      'Ages 4–11. Gentler knotless style for growing hairlines — less tension, natural look, still protective.',
    minOffer: 55,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-twists',
    name: 'Kids Twists',
    price: 50,
    durationHours: 2.5,
    description:
      'Ages 4–11. Soft two-strand twists that are quick to put in and easy to wash around. Great for everyday wear.',
    minOffer: 40,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-plaits',
    name: 'Kids French Plaits',
    price: 35,
    durationHours: 1.5,
    description:
      'Ages 4–11. One, two, or more French plaits — classic, neat, and perfect for school mornings.',
    minOffer: 25,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-ponytail',
    name: 'Kids Cornrow Ponytail',
    price: 40,
    durationHours: 1.5,
    description:
      'Ages 4–11. Cornrows into a tidy ponytail — event-ready and stays put through recess and dance class.',
    minOffer: 30,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-fulani',
    name: 'Kids Fulani / Tribal',
    price: 55,
    durationHours: 2.5,
    description:
      'Ages 4–11. Fun tribal-inspired parts with braids or beads — a favourite for birthdays and photos.',
    minOffer: 40,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-natural',
    name: 'Kids Natural Styles',
    price: 35,
    durationHours: 1.5,
    description:
      'Ages 4–11. Bantu knots, puff, rubber-band styles, or simple updos on natural hair — gentle and age-appropriate.',
    minOffer: 25,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-take-out',
    name: 'Kids Take Out',
    price: 30,
    durationHours: 1,
    description:
      'Ages 4–11. Gentle braid or style removal for little ones — patient and careful with tender scalps. No wash included.',
    minOffer: 20,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-detangle',
    name: 'Kids Detangling (No Wash)',
    price: 25,
    durationHours: 0.75,
    description:
      'Ages 4–11. Soft, no-wash detangling after a take-out or for tangled natural hair. No shampoo included.',
    minOffer: 20,
    hasSizes: false,
    category: 'kids',
  },
]

export interface GalleryItem {
  id: string
  title: string
  caption: string
  image: string
}

export const GALLERY: GalleryItem[] = []

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}

export function getAdultServices(): Service[] {
  return SERVICES.filter((s) => s.category !== 'kids' && s.category !== 'care')
}

export function getKidsServices(): Service[] {
  return SERVICES.filter((s) => s.category === 'kids')
}

export function getCareServices(): Service[] {
  return SERVICES.filter((s) => s.category === 'care')
}

export function getSizeOption(id: BraidSizeId): SizeOption | undefined {
  return SIZE_OPTIONS.find((s) => s.id === id)
}

export function getLengthOption(id: LengthId): LengthOption | undefined {
  return LENGTH_OPTIONS.find((l) => l.id === id)
}

export function getAddon(id: string): Addon | undefined {
  return ADDONS.find((a) => a.id === id)
}

export function getMobileZone(id: MobileZoneId): MobileZone | undefined {
  return MOBILE_ZONES.find((z) => z.id === id)
}

export function isCareService(service: Service): boolean {
  return (
    service.category === 'care' ||
    service.id === 'kids-take-out' ||
    service.id === 'kids-detangle'
  )
}

export function calculateBookingTotal(
  service: Service,
  sizeId: BraidSizeId = 'medium',
  lengthId: LengthId = 'shoulder',
  addonIds: string[] = [],
  mobileZoneId?: MobileZoneId | null,
): number {
  const size = getSizeOption(sizeId)
  const length = getLengthOption(lengthId)
  const care = isCareService(service)
  const addonsTotal = care
    ? 0
    : addonIds.reduce((sum, id) => sum + (getAddon(id)?.price ?? 0), 0)
  const sizeAdjust = service.hasSizes === false ? 0 : (size?.priceAdjust ?? 0)
  const lengthPrice = care ? 0 : (length?.price ?? 0)
  const mobileFee = mobileZoneId ? (getMobileZone(mobileZoneId)?.price ?? 0) : 0
  return Math.max(0, service.price + sizeAdjust + lengthPrice + addonsTotal + mobileFee)
}

export function calculateBookingDurationHours(
  service: Service,
  sizeId: BraidSizeId = 'medium',
  lengthId: LengthId = 'shoulder',
  addonIds: string[] = [],
): number {
  const size = getSizeOption(sizeId)
  const sizeAdjust = service.hasSizes === false ? 0 : (size?.durationAdjustHours ?? 0)
  if (isCareService(service)) {
    return Math.max(0.5, service.durationHours + sizeAdjust)
  }
  const lengthExtra =
    lengthId === 'waist' ? 0.5 : lengthId === 'butt' ? 1 : lengthId === 'midback' ? 0.25 : 0
  const addonExtra =
    (addonIds.includes('boho') ? 0.5 : 0) + (addonIds.includes('curls') ? -0.5 : 0)
  return Math.max(1, service.durationHours + sizeAdjust + lengthExtra + addonExtra)
}

/** Resolve duration for an existing booking (uses stored size/length/addons). */
export function getBookingDurationHours(booking: Booking): number {
  const service = getServiceById(booking.serviceId)
  if (!service) return 2
  return calculateBookingDurationHours(
    service,
    booking.size ?? 'medium',
    booking.lengthId ?? 'shoulder',
    booking.addonIds ?? [],
  )
}

export function formatPrice(amount: number): string {
  return `$${amount}`
}

export function formatPriceAdjust(amount: number): string {
  if (amount === 0) return 'Incl.'
  if (amount > 0) return `+$${amount}`
  return `−$${Math.abs(amount)}`
}

export function formatDuration(hours: number): string {
  if (hours === 1) return '1 hour'
  if (Number.isInteger(hours)) return `${hours} hours`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m} min`
  return `${h}h ${m}m`
}

export function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDateLabel(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSizeLabel(id?: BraidSizeId): string {
  if (!id) return '—'
  return getSizeOption(id)?.label ?? id
}

export function formatAddonsLabel(ids?: string[]): string {
  if (!ids?.length) return 'None'
  return ids.map((id) => getAddon(id)?.name ?? id).join(', ')
}

export function formatMobileLabel(booking: {
  mobileService?: boolean
  mobileZoneId?: MobileZoneId
}): string {
  if (!booking.mobileService || !booking.mobileZoneId) return 'Studio visit'
  const zone = getMobileZone(booking.mobileZoneId)
  return zone ? `Mobile · ${zone.label} (+$${zone.price})` : 'Mobile'
}
