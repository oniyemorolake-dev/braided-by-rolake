/**
 * Seed data & config for Braided by Rolake.
 * Structured so services/bookings/offers can later move to Supabase
 * without rewriting the UI - swap storage adapters, keep these types.
 */

export type BookingType = 'listed' | 'offer'
export type BookingStatus =
  | 'confirmed'
  | 'awaiting_deposit'
  | 'pending'
  | 'quote_requested'
  | 'countered'
  | 'declined'
  | 'cancelled'

export type BraidSizeId = 'small' | 'smedium' | 'medium' | 'large'
export type BraidBaseId = 'box' | 'knotless'
export type LengthId = 'shoulder' | 'midback' | 'waist' | 'butt'
export type MobileZoneId = 'nw' | 'sw' | 'ne' | 'se' | 'nearby' | 'extended'
export type DiscountType = 'review' | 'first_time' | 'referral' | 'loyalty' | 'promo'
export type DiscountStatus = 'unused' | 'used' | 'disabled'
export type AttendanceTag = 'on_time' | 'late' | 'no_show'
/** Face preference when media consent is yes */
export type MediaFacePreference = 'ok' | 'no_face' | 'either'

export interface Service {
  id: string
  name: string
  /** Base price for medium size + shoulder length */
  price: number
  durationHours: number
  /** Optional - add real photos later */
  image?: string
  description: string
  /** Optional floor - offers below this are auto-declined. Omit = all offers accepted for review. */
  minOffer?: number
  featured?: boolean
  /** Whether client picks Small / Smedium / Medium / Large */
  hasSizes?: boolean
  /** Whether client picks box vs knotless as the braid base (e.g. French Curls) */
  hasBraidBase?: boolean
  /** Extension length add-on. Default true for adult styles; set false when length doesn’t apply. */
  hasLength?: boolean
  /** Adult styles vs kids (ages 4-11) vs hair care extras vs men’s braids */
  category?: 'adult' | 'kids' | 'care' | 'men'
  /** Custom / special design - no listed price; client requests a quote */
  quoteOnly?: boolean
  /** If set, only these add-ons are offered (length is separate). Omit = all add-ons. Empty = none. */
  allowedAddonIds?: string[]
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

/** Travel fee when Rolake comes to the client - priced by area */
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
  /** Public URL of client inspo photo/video in Supabase Storage */
  inspoUrl?: string
  /** Allergies, sensitivities, or accommodations */
  notesAccommodations?: string
  /** Client allows photos/videos of finished work for portfolio & social */
  mediaConsent?: boolean
  /** When consenting: face OK, no face, or either is fine */
  mediaFace?: MediaFacePreference
  /** Person who booked (when different from client getting braids) */
  bookerName?: string
  bookerPhone?: string
  bookerEmail?: string
  /** Gift appointment for the client named above */
  isGift?: boolean
  giftMessage?: string
  /** Admin attendance record */
  attendanceTag?: AttendanceTag | null
  depositReminderSentAt?: string
  dayBeforeReminderSentAt?: string
  /** Applied discount code (uppercase) */
  discountCode?: string
  discountAmount?: number
  discountType?: DiscountType
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
  tiktok: string
  tiktokUrl: string
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
  /** 0 = Sun through 6 = Sat, working days */
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

/** Client-facing text/SMS number */
export const CONTACT_PHONE = '587-990-8645'

/** Minimum notice (hours) to cancel or reschedule */
export const CANCELLATION_HOURS = 48

/** Hours after an appointment to report style concerns */
export const ISSUE_CONTACT_HOURS = 24

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

/** Full studio policies (FAQ / Policies page + booking agreement) */
export const STUDIO_POLICY_SECTIONS = [
  {
    id: 'respect',
    title: 'Respect & zero tolerance for abuse',
    paragraphs: [
      'Braided by Rolake is a calm, home-based studio. Every client and guest is expected to treat Rolake with respect — in person, by text, email, or on social media.',
      'Abuse, harassment, threats, yelling, name-calling, discriminatory language, or any behaviour that makes the studio unsafe will not be tolerated. Appointments may be ended immediately, future bookings refused, and deposits forfeited in these cases.',
      'Parents/guardians are responsible for kids’ behaviour during appointments. If a session cannot continue safely, it may be stopped and the deposit retained.',
    ],
  },
  {
    id: 'issues',
    title: `Style concerns — contact within ${ISSUE_CONTACT_HOURS} hours`,
    paragraphs: [
      `If something feels wrong with your braids (tension, parting, finish, or anything that needs a fix), you must contact Rolake within ${ISSUE_CONTACT_HOURS} hours of your appointment — text ${CONTACT_PHONE || 'the number on your confirmation'} or email.`,
      `After ${ISSUE_CONTACT_HOURS} hours, free adjustments are not guaranteed. Normal settling, frizz from weather/activity, or wear-and-tear after the window is outside complimentary fix territory.`,
      'Please send a clear photo/video and a short description when you reach out so we can help quickly.',
    ],
  },
  {
    id: 'deposit',
    title: 'Deposits & payment',
    paragraphs: [
      'A deposit via Interac e-Transfer is required to hold your spot ($10 under $50, $15 under $60, otherwise $30). Your booking is confirmed only once the deposit is marked received.',
      'Remaining balance is paid in person at the appointment. Deposits are non-refundable for late cancellations, no-shows, or appointments ended due to disrespect or unsafe behaviour.',
    ],
  },
  {
    id: 'cancel',
    title: 'Cancellations, reschedules & no-shows',
    paragraphs: [
      `Cancel or reschedule at least ${CANCELLATION_HOURS} hours before your appointment by text or email.`,
      'Late cancellations and no-shows forfeit the deposit. Arriving more than 15 minutes late may mean the appointment is shortened or rescheduled so other clients are not delayed — the deposit still applies.',
    ],
  },
  {
    id: 'prep',
    title: 'Hair prep & studio rules',
    paragraphs: [
      'Hair must be clean and pre-stretched before your appointment unless a take-out / dry-detangle service is booked.',
      'Extensions are provided only on request — ask when you book so we can plan. No wash/shampoo services; take-outs and dry detangling only for hair-care appointments.',
      'Mobile (I come to you) is available for an extra travel fee based on your area. Full studio address is shared only after deposit confirmation.',
    ],
  },
] as const

export const FAQ_ITEMS = [
  {
    q: 'How do I book?',
    a: 'Pick a style on Services or Book, choose size/length/add-ons if needed, pick a date and time, then send the e-Transfer deposit. You’ll get a status link to track your booking.',
  },
  {
    q: 'When is my booking fully confirmed?',
    a: 'Once Rolake marks your Interac deposit as received. Until then the slot is held as awaiting deposit.',
  },
  {
    q: 'What if I need to cancel or change my time?',
    a: `Text or email at least ${CANCELLATION_HOURS} hours before. Late changes and no-shows keep the deposit non-refundable.`,
  },
  {
    q: 'What if I’m unhappy with my braids?',
    a: `Contact Rolake within ${ISSUE_CONTACT_HOURS} hours with photos and details. After that window, complimentary fixes are not guaranteed.`,
  },
  {
    q: 'Is disrespect or abuse allowed?',
    a: 'No. Abuse of any kind (in person or online) is zero-tolerance. Sessions can be ended and future bookings refused.',
  },
  {
    q: 'Do I need to bring hair?',
    a: 'Bring extensions if you have a preferred brand/colour, or ask ahead if you need hair provided. Prep: clean, detangled, pre-stretched hair unless otherwise booked.',
  },
  {
    q: 'Where is the studio?',
    a: 'Home studio in Calgary — the exact street address is shared after your deposit is confirmed, for privacy and safety.',
  },
  {
    q: 'Can I get mobile service?',
    a: 'Yes, for an extra travel fee by area (Uber/Lyft both ways). Choose mobile when booking and add your zone/address.',
  },
] as const

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
  studioAddress: 'Calgary, AB - full street address shared once your deposit is received',
  instagram: '@tgm.byrolake',
  instagramUrl: 'https://www.instagram.com/tgm.byrolake',
  tiktok: '@tgm.byrolake',
  tiktokUrl: 'https://www.tiktok.com/@tgm.byrolake',
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
    'Prices as listed. Deposit by Interac e-Transfer - no card fees. GST only if Rolake is GST-registered.',
  workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  workStartHour: 9,
  workEndHour: 19,
  bufferMinutes: 60,
  slotIntervalMinutes: 60,
  adminPassword: 'Morolake2024.',
  web3formsAccessKey: '51a35843-c702-4cd1-8f50-af5d97571a74',
}

/**
 * Deposit scales with appointment total:
 * under $50 → $10, under $60 → $15, otherwise default ($30).
 */
export function getDepositForPrice(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return CONFIG.depositAmount
  if (price < 50) return 10
  if (price < 60) return 15
  return CONFIG.depositAmount
}

/** Studio policies shown on Services, booking, and confirmation */
export const POLICIES = [
  'Hair must be clean and pre-stretched before your appointment.',
  'I can provide extensions only on request - please ask when you book so we can plan ahead.',
  'A deposit via Interac e-Transfer is required to secure your appointment ($10 under $50, $15 under $60, otherwise $30) - booking is confirmed once the deposit is received.',
  'Mobile (I come to you) is available for an extra travel fee based on your location.',
  'Prices as listed - deposit by e-Transfer (no card fees). Remaining balance paid in person.',
  'No wash / shampoo services - take-outs and dry detangling only for hair-care appointments.',
  `Zero tolerance for abuse or disrespect — in person or online. Sessions may be ended and deposits forfeited.`,
  `Style concerns must be reported within ${ISSUE_CONTACT_HOURS} hours of your appointment for a complimentary look-over / fix when needed.`,
] as const

/** Prep & aftercare page content (separate from policies) */
export const PREP_AFTERCARE = {
  title: 'Prep & aftercare',
  intro:
    'A little prep makes your appointment smoother — and good aftercare helps your braids last longer and stay comfortable.',
  prepTitle: 'Before your appointment',
  prep: [
    'Wash and blow-dry your hair (unless you booked a take-out / dry-detangle only).',
    'Detangle thoroughly — matted hair slows us down and can add time.',
    'Come with hair product-free (no heavy oils, gels, or leave-ins unless we agreed otherwise).',
    'Pre-stretch your hair if you can; it helps tension stay even.',
    'Bring extensions if you’re providing them (colour + pack count). Ask ahead if you need hair provided.',
    'Eat beforehand — long styles can take several hours. Kids: a nap before helps a lot.',
    'Arrive on time. More than ~15 minutes late may mean a shorter session or a reschedule.',
  ],
  aftercareTitle: 'Aftercare — keep them cute',
  aftercare: [
    'Sleep with a satin/silk scarf or bonnet (or pillowcase) to reduce frizz.',
    'Lightly moisturize your scalp — don’t soak the braids every day.',
    'Avoid heavy oils that attract lint; blot, don’t rub, if they get wet.',
    'Keep edge tension gentle — if something feels too tight, text within 24 hours.',
    'For swimming or heavy sweat: rinse, pat dry, and scarf overnight.',
  ],
  returnTitle: 'When to come back',
  returnTips: [
    'Most protective styles look their best for about 4–8 weeks depending on hair growth, activity, and how you sleep.',
    'Book a take-out when braids feel heavy, itchy beyond normal settling, or look very grown out.',
    'Don’t wait until hair is severely matted — earlier take-outs are kinder on your strands.',
    'Rebook your next install while you’re here or online so you keep your preferred time.',
  ],
} as const

export type GalleryTag =
  | 'knotless'
  | 'box'
  | 'cornrows'
  | 'kids'
  | 'men'
  | 'twists'
  | 'before-after'
  | 'boho'

export const GALLERY_FILTERS: { id: GalleryTag | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'knotless', label: 'Knotless' },
  { id: 'box', label: 'Box braids' },
  { id: 'cornrows', label: 'Cornrows' },
  { id: 'twists', label: 'Twists' },
  { id: 'boho', label: 'Boho' },
  { id: 'kids', label: 'Kids' },
  { id: 'men', label: 'Men' },
  { id: 'before-after', label: 'Before / after' },
]

/**
 * Curated gallery cards. Drop matching JPGs in public/gallery/ or link Instagram posts.
 * PhotoSlot shows a branded placeholder until the file exists.
 */
export const GALLERY_ITEMS: {
  id: string
  title: string
  tags: GalleryTag[]
  /** public path e.g. /gallery/knotless-1.jpg */
  image?: string
  caption?: string
  href?: string
}[] = [
  {
    id: 'knotless-1',
    title: 'Knotless braids',
    tags: ['knotless'],
    image: '/gallery/knotless-1.jpg',
    caption: 'Soft start, clean parts',
  },
  {
    id: 'box-1',
    title: 'Box braids',
    tags: ['box'],
    image: '/gallery/box-1.jpg',
    caption: 'Classic protective install',
  },
  {
    id: 'cornrows-1',
    title: 'Cornrows',
    tags: ['cornrows'],
    image: '/gallery/cornrows-1.jpg',
    caption: 'Neat rows, lasting finish',
  },
  {
    id: 'boho-1',
    title: 'Boho knotless',
    tags: ['knotless', 'boho'],
    image: '/gallery/boho-1.jpg',
    caption: 'Loose ends, soft vibe',
  },
  {
    id: 'twists-1',
    title: 'Twists',
    tags: ['twists'],
    image: '/gallery/twists-1.jpg',
    caption: 'Low-manipulation twists',
  },
  {
    id: 'natural-1',
    title: 'Natural hair styles',
    tags: ['box', 'cornrows', 'twists'],
    image: '/gallery/natural-1.jpg',
    caption: 'Box, cornrows & twists on natural hair',
  },
  {
    id: 'miracle-1',
    title: 'Miracle knots',
    tags: ['twists', 'box'],
    image: '/gallery/miracle-knots-1.jpg',
    caption: 'Protective knots without braiding hair',
  },
  {
    id: 'kids-1',
    title: 'Kids styles',
    tags: ['kids'],
    image: '/gallery/kids-1.jpg',
    caption: 'Gentle tension for little ones',
  },
  {
    id: 'men-1',
    title: 'Men’s braids',
    tags: ['men', 'cornrows'],
    image: '/gallery/men-1.jpg',
    caption: 'Clean men’s installs',
  },
  {
    id: 'ba-1',
    title: 'Before & after',
    tags: ['before-after', 'knotless'],
    image: '/gallery/before-after-1.jpg',
    caption: 'Transformation sets',
  },
]

export function formatAttendanceLabel(tag?: AttendanceTag): string {
  if (tag === 'late') return 'Late'
  if (tag === 'no_show') return 'No-show'
  if (tag === 'on_time') return 'On time'
  return '—'
}

/** Photo / video consent copy shown at checkout */
export const MEDIA_CONSENT = {
  title: 'Photo & video consent',
  requiredLabel: 'Required',
  summary:
    'May I take photos or short videos of your finished hair / style for my portfolio, Instagram, and TikTok?',
  yesLabel: 'Yes — you can photograph / film my hair and finished style for portfolio & social.',
  noLabel: 'No — please do not take or share photos or videos of my hair or appointment.',
  faceTitle: 'About your face in the photos / videos',
  faceSummary: 'If you said yes, tell me how you want your face handled:',
  faceOk: 'Face is OK — I’m fine appearing in photos / videos.',
  faceNo: 'No face — hair / style only (crop, angle away, or blur my face).',
  faceEither: 'Either is fine — your call at the appointment.',
  note: 'You can change your mind later by texting. Consent is required to finish booking.',
} as const

export function formatMediaConsentLabel(
  consent?: boolean,
  face?: MediaFacePreference,
): string {
  if (consent === false) return 'No — do not photograph'
  if (consent === true) {
    if (face === 'ok') return 'Yes — face OK'
    if (face === 'no_face') return 'Yes — hair only, no face'
    if (face === 'either') return 'Yes — face either way'
    return 'Yes — hair photos/videos OK'
  }
  return 'Not answered'
}

export function formatMediaFaceLabel(face?: MediaFacePreference): string {
  if (face === 'ok') return 'Face OK'
  if (face === 'no_face') return 'No face — hair only'
  if (face === 'either') return 'Either is fine'
  return '—'
}

/** Discount program config — amounts & toggles live here */
export const FIRST_TIME_ENABLED = true
/** Flat $ off when first-booking total is at/above the threshold */
export const FIRST_TIME_DISCOUNT = 15
/** Percent off when first-booking total is below the threshold (0.05 = 5%) */
export const FIRST_TIME_PERCENT = 0.05
export const FIRST_TIME_THRESHOLD = 150
export const FIRST_TIME_CODE = 'WELCOME'

/** First-time WELCOME amount for a given subtotal */
export function getFirstTimeDiscountAmount(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0
  if (subtotal < FIRST_TIME_THRESHOLD) {
    return Math.round(subtotal * FIRST_TIME_PERCENT * 100) / 100
  }
  return FIRST_TIME_DISCOUNT
}

export function firstTimeDiscountLabel(subtotal?: number): string {
  if (subtotal != null && Number.isFinite(subtotal) && subtotal > 0) {
    const amt = getFirstTimeDiscountAmount(subtotal)
    if (subtotal < FIRST_TIME_THRESHOLD) {
      return `5% off (${formatPrice(amt)}) under ${formatPrice(FIRST_TIME_THRESHOLD)}`
    }
    return `${formatPrice(amt)} off at ${formatPrice(FIRST_TIME_THRESHOLD)}+`
  }
  return `5% off under ${formatPrice(FIRST_TIME_THRESHOLD)}, or $${FIRST_TIME_DISCOUNT} off at $${FIRST_TIME_THRESHOLD}+`
}

export const REFERRAL_ENABLED = true
export const REFERRAL_DISCOUNT_FRIEND = 15
export const REFERRAL_DISCOUNT_REFERRER = 15

export const LOYALTY_ENABLED = true
export const LOYALTY_THRESHOLD = 5
export const LOYALTY_DISCOUNT = 25

export const REVIEW_DISCOUNT = 10

/** Final price cannot go below this after a discount */
export const DISCOUNT_PRICE_FLOOR = 30

/** Marketing cards on Services (backed by the shared discounts system) */
export const DISCOUNTS = [
  {
    id: 'first_time',
    type: 'first_time' as DiscountType,
    label: 'First-time client',
    detail: FIRST_TIME_ENABLED
      ? `New clients: 5% off under $${FIRST_TIME_THRESHOLD}, or $${FIRST_TIME_DISCOUNT} off at $${FIRST_TIME_THRESHOLD}+ — use code ${FIRST_TIME_CODE} or we’ll offer it automatically`
      : 'First-time discount currently paused',
    enabled: FIRST_TIME_ENABLED,
  },
  {
    id: 'referral',
    type: 'referral' as DiscountType,
    label: 'Refer a friend',
    detail: REFERRAL_ENABLED
      ? `They get $${REFERRAL_DISCOUNT_FRIEND} off; you get $${REFERRAL_DISCOUNT_REFERRER} off your next booking`
      : 'Referral program currently paused',
    enabled: REFERRAL_ENABLED,
  },
  {
    id: 'loyalty',
    type: 'loyalty' as DiscountType,
    label: 'Loyalty',
    detail: LOYALTY_ENABLED
      ? `After ${LOYALTY_THRESHOLD} confirmed bookings, get $${LOYALTY_DISCOUNT} off your next set`
      : 'Loyalty rewards currently paused',
    enabled: LOYALTY_ENABLED,
  },
  {
    id: 'review',
    type: 'review' as DiscountType,
    label: 'Leave a review',
    detail: `Share your experience ? approved reviews may unlock a $${REVIEW_DISCOUNT} thank-you code`,
    enabled: true,
  },
] as const

export function applyDiscountToTotal(subtotal: number, discountAmount: number): number {
  const clamped = Math.max(
    0,
    Math.min(discountAmount, Math.max(0, subtotal - DISCOUNT_PRICE_FLOOR)),
  )
  return Math.max(DISCOUNT_PRICE_FLOOR, subtotal - clamped)
}

export function clampDiscountAmount(subtotal: number, discountAmount: number): number {
  return Math.max(
    0,
    Math.min(discountAmount, Math.max(0, subtotal - DISCOUNT_PRICE_FLOOR)),
  )
}
export const SIZE_OPTIONS: SizeOption[] = [
  {
    id: 'small',
    label: 'Small',
    priceAdjust: 40,
    durationAdjustHours: 1.5,
  },
  {
    id: 'smedium',
    label: 'Smedium',
    priceAdjust: 20,
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
    priceAdjust: -15,
    durationAdjustHours: -1,
  },
]

/**
 * Men’s parting sizes — included in the listed price (no size upcharge),
 * except cornrows which use CORNROW_SIZE_OPTIONS.
 * Smaller still takes a bit longer.
 */
export const MEN_SIZE_OPTIONS: SizeOption[] = [
  {
    id: 'small',
    label: 'Small',
    priceAdjust: 0,
    durationAdjustHours: 0.75,
  },
  {
    id: 'smedium',
    label: 'Smedium',
    priceAdjust: 0,
    durationAdjustHours: 0.35,
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
    priceAdjust: 0,
    durationAdjustHours: -0.35,
  },
]

/** Cornrows / men’s cornrows — medium included; small/smedium more; large $10 less */
export const CORNROW_SIZE_OPTIONS: SizeOption[] = [
  {
    id: 'small',
    label: 'Small',
    priceAdjust: 25,
    durationAdjustHours: 0.75,
  },
  {
    id: 'smedium',
    label: 'Smedium',
    priceAdjust: 15,
    durationAdjustHours: 0.35,
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
    priceAdjust: -10,
    durationAdjustHours: -0.35,
  },
]

/** Box vs knotless base — used by French Curls (and similar) */
export const BRAID_BASE_OPTIONS: {
  id: BraidBaseId
  label: string
  description: string
}[] = [
  {
    id: 'box',
    label: 'Box braids',
    description: 'Classic box braid base with French curl ends',
  },
  {
    id: 'knotless',
    label: 'Knotless',
    description: 'Knotless braid base with French curl ends',
  },
]

const BRAID_BASE_PREFIX = 'braid-base:'

export function braidBaseAddonId(id: BraidBaseId): string {
  return `${BRAID_BASE_PREFIX}${id}`
}

export function getBraidBase(addonIds?: string[]): BraidBaseId | undefined {
  const raw = addonIds?.find((id) => id.startsWith(BRAID_BASE_PREFIX))
  if (!raw) return undefined
  const id = raw.slice(BRAID_BASE_PREFIX.length)
  return id === 'box' || id === 'knotless' ? id : undefined
}

export function formatBraidBaseLabel(addonIds?: string[]): string | undefined {
  const id = getBraidBase(addonIds)
  return BRAID_BASE_OPTIONS.find((o) => o.id === id)?.label
}

/** Style add-ons only (excludes braid-base markers stored in addon_ids). */
export function styleAddonIds(addonIds?: string[]): string[] {
  return (addonIds ?? []).filter((id) => !id.startsWith(BRAID_BASE_PREFIX))
}

export function withBraidBase(
  addonIds: string[] | undefined,
  base: BraidBaseId | undefined,
): string[] {
  const rest = styleAddonIds(addonIds)
  return base ? [...rest, braidBaseAddonId(base)] : rest
}

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
    description: 'Maximum length - more hair',
  },
]

export const ADDONS: Addon[] = [
  {
    id: 'curls',
    name: 'Curls',
    price: -10,
    description:
      'Curly ends instead of a full straight finish - saves time, so $10 off the total',
  },
  {
    id: 'boho',
    name: 'Boho strands',
    price: 10,
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
  {
    id: 'styling-gel',
    name: 'Styling gel',
    price: 10,
    description: 'Extra gel for edges, parts, and a smoother finish on your style',
  },
  {
    id: 'extensions',
    name: 'With extensions',
    price: 15,
    description:
      'Extra when braiding hair / extensions are added. Bring your own hair or ask ahead. Choose extension length if you want longer than natural.',
  },
]

/**
 * Mobile travel fees - based from NW Calgary near SAIT.
 * Fees cover Uber/Lyft BOTH ways (to the client and home). Studio visit = $0 travel.
 */
export const MOBILE_BASE = {
  area: 'NW Calgary near SAIT',
  /** Shown on Services + booking so clients understand the fee */
  note: 'Travel fees cover my Uber/Lyft both ways - to you and back home. They are not a markup on the braid; they replace what I spend on the round trip.',
  /** Market context for clients */
  marketAverage:
    'For reference, mobile braiding travel add-ons in Calgary often average about $30-$80+ depending on distance. My rates are set to cover the two-way ride from NW near SAIT, not to inflate the style price.',
} as const

export const MOBILE_ZONES: MobileZone[] = [
  {
    id: 'nw',
    label: 'NW Calgary',
    price: 25,
    description: 'Same quadrant (near SAIT) - covers Uber/Lyft both ways',
  },
  {
    id: 'sw',
    label: 'SW Calgary',
    price: 35,
    description: 'Southwest - round-trip Uber/Lyft both ways',
  },
  {
    id: 'ne',
    label: 'NE Calgary',
    price: 40,
    description: 'Northeast - round-trip Uber/Lyft both ways',
  },
  {
    id: 'se',
    label: 'SE Calgary',
    price: 45,
    description: 'Southeast - farthest in-city round trip for me',
  },
  {
    id: 'nearby',
    label: 'Nearby cities',
    price: 65,
    description: 'Airdrie, Cochrane, Chestermere, Okotoks - Uber both ways',
  },
  {
    id: 'extended',
    label: 'Extended travel',
    price: 85,
    description: 'Further out - I confirm after booking; covers two-way ride',
  },
]

export const SERVICES: Service[] = [
  {
    id: 'custom',
    name: 'Custom Style / Special Design',
    price: 0,
    durationHours: 4,
    description:
      'Have a unique look, mixed style, or special design in mind? Request a quote - upload your inspo and describe what you want. I\'ll review and send a price.',
    hasSizes: false,
    quoteOnly: true,
    featured: true,
  },
  {
    id: 'knotless',
    name: 'Knotless Braids',
    price: 175,
    durationHours: 5,
    description:
      'Lightweight, tension-friendly braids that look natural from root to tip. Ideal for everyday wear and low manipulation. (Braiding hair not included unless arranged.)',
    minOffer: 145,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'boho-knotless',
    name: 'Boho / Goddess Knotless',
    price: 215,
    durationHours: 6,
    description:
      'Knotless braids with soft human-hair strands for that effortless goddess look. Perfect for vacations and special moments.',
    minOffer: 175,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'box',
    name: 'Box Braids',
    price: 160,
    durationHours: 4,
    description:
      'Classic protective braids with clean parts and lasting hold (typically with braiding hair). Sized to your preference - medium is most popular. For natural hair only, book Box Braids (Natural Hair).',
    minOffer: 130,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'fulani',
    name: 'Fulani Braids',
    price: 165,
    durationHours: 4,
    description:
      'Tribal-inspired design with cornrows in the middle and braids around the sides - beads optional.',
    minOffer: 135,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'lemonade',
    name: 'Lemonade Braids',
    price: 155,
    durationHours: 3.5,
    description:
      'Side-swept cornrows and braids that frame the face. Sleek, stylish, and camera-ready.',
    minOffer: 125,
    hasSizes: true,
  },
  {
    id: 'cornrows',
    name: 'Cornrows / Feed-in',
    price: 90,
    durationHours: 2,
    description:
      'Neat feed-in cornrows that grow gracefully into your length (with braiding hair). Great for workouts, travel, or a sleek look. Medium size included — small/smedium cost more, large is $10 less. For natural hair only, book Cornrows (Natural Hair).',
    minOffer: 70,
    hasSizes: true,
  },
  {
    id: 'half-cornrows',
    name: 'Half Cornrows',
    price: 65,
    durationHours: 1.5,
    description:
      'Cornrows on half the head with the rest left out or styled simply - quick, cute, and easy to maintain. Design details welcome.',
    minOffer: 55,
    hasSizes: false,
    featured: true,
  },
  {
    id: 'pick-and-drop',
    name: 'Pick and Drop',
    price: 125,
    durationHours: 3.5,
    description:
      'Cornrow base with braids dropped at intervals for a layered, freestyle look. Great for a bold finish without a full all-over braid set.',
    minOffer: 100,
    hasSizes: true,
    featured: true,
  },
  {
    id: 'twists',
    name: 'Two-Strand Twists',
    price: 165,
    durationHours: 4,
    description:
      'Soft two-strand twists with defined parts (typically with braiding hair). Protective, versatile, and easy to style up or down.',
    minOffer: 135,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'passion',
    name: 'Passion Twists',
    price: 180,
    durationHours: 5,
    description:
      'Romantic, springy twists with a soft fall. Low maintenance and beautiful for weeks.',
    minOffer: 145,
    hasSizes: true,
  },
  {
    id: 'senegalese',
    name: 'Senegalese Twists',
    price: 175,
    durationHours: 5,
    description:
      'Rope-style twists with a polished finish. Great for a sleek protective look that lasts.',
    minOffer: 140,
    hasSizes: true,
  },

  // --- Women’s natural hair (no braiding hair / extensions) ---
  {
    id: 'natural-box',
    name: 'Box Braids (Natural Hair)',
    price: 110,
    durationHours: 3.5,
    description:
      'Classic box braids using your own natural hair only — no braiding hair or extensions. Clean parts, comfortable tension. Great for a protective break without added length.',
    minOffer: 90,
    featured: true,
    hasSizes: true,
    hasLength: false,
    allowedAddonIds: ['beads', 'styling-gel'],
  },
  {
    id: 'natural-cornrows',
    name: 'Cornrows (Natural Hair)',
    price: 75,
    durationHours: 1.75,
    description:
      'Neat cornrows on your natural hair — no feed-in extensions. Workout-friendly and easy to maintain. Medium size included; small/smedium cost more, large is $10 less.',
    minOffer: 60,
    featured: true,
    hasSizes: true,
    hasLength: false,
    allowedAddonIds: ['beads', 'styling-gel'],
  },
  {
    id: 'natural-twists',
    name: 'Twists (Natural Hair)',
    price: 95,
    durationHours: 2.5,
    description:
      'Two-strand twists on your natural hair only — soft parts, no braiding hair. Ideal for wash day, low manipulation, and healthy protective styling.',
    minOffer: 75,
    featured: true,
    hasSizes: true,
    hasLength: false,
    allowedAddonIds: ['beads', 'styling-gel'],
  },
  {
    id: 'miracle-knots',
    name: 'Miracle Knots',
    price: 130,
    durationHours: 3.5,
    description:
      'Miracle knots on natural hair — neat knotted sections that look full and stay protective without braiding hair. Sized to your preference; bring inspo for parting.',
    minOffer: 105,
    featured: true,
    hasSizes: true,
    hasLength: false,
    allowedAddonIds: ['beads', 'styling-gel'],
  },
  {
    id: 'flat-twists',
    name: 'Flat Twists (Natural Hair)',
    price: 85,
    durationHours: 2,
    description:
      'Flat twists along the scalp using your natural hair — sleek, protective, and great under wigs or as a finished look. Design / number of twists welcome in your note.',
    minOffer: 70,
    hasSizes: false,
    hasLength: false,
    allowedAddonIds: ['beads', 'styling-gel'],
  },
  {
    id: 'bantu-knots',
    name: 'Bantu Knots (Natural Hair)',
    price: 70,
    durationHours: 1.5,
    description:
      'Classic Bantu knots on natural hair for a bold protective look (or as a set for knot-out curls later). No braiding hair needed.',
    minOffer: 55,
    hasSizes: false,
    hasLength: false,
    allowedAddonIds: ['styling-gel'],
  },

  {
    id: 'soft-locs',
    name: 'Soft Locs',
    price: 200,
    durationHours: 6,
    description:
      'Faux locs with a soft, natural feel. Lightweight compared to traditional locs and easy to style.',
    minOffer: 165,
    hasSizes: true,
  },
  {
    id: 'butterfly',
    name: 'Butterfly Locs',
    price: 210,
    durationHours: 6,
    description:
      'Textured, wavy faux locs with that signature butterfly look - bold and low-maintenance.',
    minOffer: 170,
    hasSizes: true,
  },
  {
    id: 'french-curls',
    name: 'French Curls',
    price: 190,
    durationHours: 5,
    description:
      'Choose a box braid or knotless base, pick your size and length, finished with soft French-curl ends for bounce and volume. Optional boho strands.',
    minOffer: 155,
    featured: true,
    hasSizes: true,
    hasBraidBase: true,
    allowedAddonIds: ['boho'],
  },
  {
    id: 'french-plaits',
    name: 'French Plaits',
    price: 70,
    durationHours: 2.5,
    description:
      'Classic French plaits (braids) with clean parts - one, two, or more. Simple, neat, and timeless. Flat rate — no length or style add-ons.',
    minOffer: 50,
    hasSizes: false,
    hasLength: false,
    allowedAddonIds: [],
  },
  {
    id: 'island-braids',
    name: 'Island Braids',
    price: 165,
    durationHours: 4.5,
    description:
      'Chunky, vacation-ready island braids with a relaxed vibe. Perfect for travel, beach days, and low upkeep.',
    minOffer: 135,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'ponytail',
    name: 'Cornrow Ponytail',
    price: 80,
    durationHours: 2,
    description:
      'Sleek cornrows gathered into a polished ponytail. Perfect for events, school, or keeping hair tidy.',
    minOffer: 65,
    hasSizes: false,
  },


  {
    id: 'cornrows-wig',
    name: 'Cornrows for Wig',
    price: 55,
    durationHours: 1.25,
    description:
      'Clean cornrow base for wig install. Neat parts ready for your wig or sew-in - wig/weave not included.',
    minOffer: 45,
    hasSizes: false,
    featured: true,
  },
  {
    id: 'crochet',
    name: 'Crochet Styles',
    price: 145,
    durationHours: 3.5,
    description:
      'Crochet braids or twists on a cornrow base. Choose parting size (small / smedium / medium / large). Hair not included unless arranged.',
    minOffer: 115,
    featured: true,
    hasSizes: true,
  },
  {
    id: 'kids-crochet',
    name: 'Kids Crochet',
    price: 95,
    durationHours: 2.5,
    description:
      'Ages 4-11. Gentle crochet style on a soft cornrow base. Bring your crochet hair or ask ahead.',
    minOffer: 75,
    hasSizes: false,
    category: 'kids',
  },

  // --- Hair care (take-outs & detangling - no wash) ---
  {
    id: 'take-out',
    name: 'Take Out (Braid Removal)',
    price: 60,
    durationHours: 1.5,
    description:
      'Careful removal of braids, twists, or locs. Taken down gently to protect your natural hair. No restyle and no wash included.',
    minOffer: 50,
    hasSizes: false,
    category: 'care',
    featured: true,
  },
  {
    id: 'take-out-long',
    name: 'Take Out - Long / Dense Styles',
    price: 80,
    durationHours: 2.5,
    description:
      'For waist+ length, small size, or very dense sets that need more time to remove safely. No wash included.',
    minOffer: 65,
    hasSizes: false,
    category: 'care',
  },
  {
    id: 'detangle-no-wash',
    name: 'Detangling (No Wash)',
    price: 55,
    durationHours: 1,
    description:
      'Finger-detangle and section your natural hair after a take-out or between styles. Dry detangle only - no shampoo or wash.',
    minOffer: 45,
    hasSizes: false,
    category: 'care',
    featured: true,
  },
  {
    id: 'take-out-detangle',
    name: 'Take Out + Detangle (No Wash)',
    price: 90,
    durationHours: 2.5,
    description:
      'Full take-out plus gentle no-wash detangling so your hair is soft and ready for your next style or wash day at home.',
    minOffer: 70,
    hasSizes: false,
    category: 'care',
  },
  {
    id: 'gel-styles',
    name: 'Gel Styles',
    price: 90,
    durationHours: 1.5,
    description:
      'Slicked gel looks — finger waves, wet-look styles, or a polished gel finish on natural hair. Gel included for this service. From $90.',
    minOffer: 75,
    hasSizes: false,
    category: 'care',
    featured: true,
  },
  {
    id: 'basic-straighten',
    name: 'Basic Hair Straighten',
    price: 55,
    durationHours: 1.5,
    description:
      'Blow-dry and flat-iron straighten for a smooth finish. No wash included — come with clean, dry hair. Length and density may affect time.',
    minOffer: 40,
    hasSizes: false,
    category: 'care',
    featured: true,
  },

  // --- Men’s styles ---
  {
    id: 'men-cornrows',
    name: 'Men’s Cornrows',
    price: 70,
    durationHours: 1.5,
    description:
      'Clean straight-back or design cornrows sized for men’s hairlines. Medium included — small/smedium cost more, large is $10 less. Add extensions if you want braiding hair.',
    minOffer: 55,
    hasSizes: true,
    hasLength: true,
    allowedAddonIds: ['extensions'],
    category: 'men',
    featured: true,
  },
  {
    id: 'men-box',
    name: 'Men’s Box Braids / Plaits',
    price: 90,
    durationHours: 2.5,
    description:
      'Box braids or classic plaits for men — protective and tidy. Pick size, and add extensions + length when using braiding hair.',
    minOffer: 70,
    hasSizes: true,
    hasLength: true,
    allowedAddonIds: ['extensions'],
    category: 'men',
    featured: true,
  },
  {
    id: 'men-twists',
    name: 'Men’s Twists',
    price: 80,
    durationHours: 2,
    description:
      'Two-strand twists for men — soft parts, comfortable tension. Size options available; add extensions + length if needed.',
    minOffer: 60,
    hasSizes: true,
    hasLength: true,
    allowedAddonIds: ['extensions'],
    category: 'men',
    featured: true,
  },
  {
    id: 'men-design',
    name: 'Men’s Design / Tribal',
    price: 95,
    durationHours: 2.5,
    description:
      'Custom design cornrows or tribal-inspired parts. Choose size; add extensions + length for longer looks. Bring inspo.',
    minOffer: 75,
    hasSizes: true,
    hasLength: true,
    allowedAddonIds: ['extensions'],
    category: 'men',
    featured: true,
  },
  {
    id: 'men-ponytail',
    name: 'Men’s Cornrow Ponytail',
    price: 75,
    durationHours: 1.75,
    description:
      'Cornrows gathered into a tidy ponytail. Pick size; add extensions + length for a fuller or longer finish.',
    minOffer: 60,
    hasSizes: true,
    hasLength: true,
    allowedAddonIds: ['extensions'],
    category: 'men',
    featured: true,
  },

  // --- Kids (ages 4-11) ---
  {
    id: 'kids-braids',
    name: 'Kids Braids',
    price: 70,
    durationHours: 2,
    description:
      'Ages 4-11. Soft, simple braids sized for little heads - neat parts, gentle tension, and a finish that lasts through school and play.',
    minOffer: 55,
    hasSizes: false,
    category: 'kids',
    featured: true,
  },
  {
    id: 'kids-cornrows',
    name: 'Kids Cornrows',
    price: 65,
    durationHours: 1.5,
    description:
      'Ages 4-11. Straight-back or design cornrows that stay tidy for school, sports, and busy weeks. Soft on the scalp.',
    minOffer: 50,
    hasSizes: false,
    category: 'kids',
    featured: true,
  },
  {
    id: 'kids-box',
    name: 'Kids Box Braids',
    price: 90,
    durationHours: 3,
    description:
      'Ages 4-11. Lightweight box braids in a kid-friendly size - protective, cute, and easy for parents to maintain.',
    minOffer: 70,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-knotless',
    name: 'Kids Knotless Braids',
    price: 105,
    durationHours: 3.5,
    description:
      'Ages 4-11. Gentler knotless style for growing hairlines - less tension, natural look, still protective.',
    minOffer: 85,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-twists',
    name: 'Kids Twists',
    price: 80,
    durationHours: 2.5,
    description:
      'Ages 4-11. Soft two-strand twists that are quick to put in and easy to wash around. Great for everyday wear.',
    minOffer: 65,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-plaits',
    name: 'Kids French Plaits',
    price: 60,
    durationHours: 1.5,
    description:
      'Ages 4-11. One, two, or more French plaits - classic, neat, and perfect for school mornings.',
    minOffer: 45,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-ponytail',
    name: 'Kids Cornrow Ponytail',
    price: 65,
    durationHours: 1.5,
    description:
      'Ages 4-11. Cornrows into a tidy ponytail - event-ready and stays put through recess and dance class.',
    minOffer: 50,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-fulani',
    name: 'Kids Fulani / Tribal',
    price: 85,
    durationHours: 2.5,
    description:
      'Ages 4-11. Fun tribal-inspired parts with braids or beads - a favourite for birthdays and photos.',
    minOffer: 65,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-natural',
    name: 'Kids Natural Styles',
    price: 60,
    durationHours: 1.5,
    description:
      'Ages 4-11. Bantu knots, puff, rubber-band styles, or simple updos on natural hair - gentle and age-appropriate.',
    minOffer: 45,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-take-out',
    name: 'Kids Take Out',
    price: 50,
    durationHours: 1,
    description:
      'Ages 4-11. Gentle braid or style removal for little ones - patient and careful with tender scalps. No wash included.',
    minOffer: 40,
    hasSizes: false,
    category: 'kids',
  },
  {
    id: 'kids-detangle',
    name: 'Kids Detangling (No Wash)',
    price: 45,
    durationHours: 0.75,
    description:
      'Ages 4-11. Soft, no-wash detangling after a take-out or for tangled natural hair. No shampoo included.',
    minOffer: 35,
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

export const GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Medium knotless',
    caption: 'Shoulder-length knotless - everyday favourite.',
    image: '/gallery/knotless.jpg',
  },
  {
    id: 'g2',
    title: 'Box braids',
    caption: 'Classic box braids with clean parts.',
    image: '/gallery/box.jpg',
  },
  {
    id: 'g3',
    title: 'Feed-in cornrows',
    caption: 'Straight-back feed-ins with a clean finish.',
    image: '/gallery/cornrows.jpg',
  },
  {
    id: 'g4',
    title: 'Passion twists',
    caption: 'Soft twists with a romantic fall.',
    image: '/gallery/twists.jpg',
  },
  {
    id: 'g5',
    title: 'Kids styles',
    caption: 'Gentle styles for ages 4-11.',
    image: '/gallery/kids.jpg',
  },
  {
    id: 'g6',
    title: 'Cornrow ponytail',
    caption: 'Sleek parts into a polished ponytail.',
    image: '/gallery/ponytail.jpg',
  },
  {
    id: 'g7',
    title: 'Boho knotless',
    caption: 'Goddess strands for that vacation look.',
    image: '/gallery/boho-knotless.jpg',
  },
  {
    id: 'g8',
    title: 'Fulani braids',
    caption: 'Tribal design with optional beads.',
    image: '/gallery/fulani.jpg',
  },
  {
    id: 'g9',
    title: 'French curls',
    caption: 'Braids with soft curly ends.',
    image: '/gallery/french-curls.jpg',
  },
  {
    id: 'g10',
    title: 'Island braids',
    caption: 'Chunky vacation-ready braids.',
    image: '/gallery/island-braids.jpg',
  },
  {
    id: 'g11',
    title: 'Soft locs',
    caption: 'Lightweight faux locs.',
    image: '/gallery/soft-locs.jpg',
  },
  {
    id: 'g12',
    title: 'Take out & care',
    caption: 'Gentle removal and no-wash detangling.',
    image: '/gallery/take-out.jpg',
  },
]

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}

export function getAdultServices(): Service[] {
  return SERVICES.filter(
    (s) => s.category !== 'kids' && s.category !== 'care' && s.category !== 'men',
  )
}

export function getKidsServices(): Service[] {
  return SERVICES.filter((s) => s.category === 'kids')
}

export function getCareServices(): Service[] {
  return SERVICES.filter((s) => s.category === 'care')
}

export function getMenServices(): Service[] {
  return SERVICES.filter((s) => s.category === 'men')
}

export function getSizeOptionsForService(service: Service): SizeOption[] {
  if (
    service.id === 'cornrows' ||
    service.id === 'natural-cornrows' ||
    service.id === 'men-cornrows'
  ) {
    return CORNROW_SIZE_OPTIONS
  }
  if (service.category === 'men') return MEN_SIZE_OPTIONS
  return SIZE_OPTIONS
}

export function getSizeOption(id: BraidSizeId, service?: Service): SizeOption | undefined {
  const list = service ? getSizeOptionsForService(service) : SIZE_OPTIONS
  return list.find((s) => s.id === id)
}

export function getLengthOption(id: LengthId): LengthOption | undefined {
  return LENGTH_OPTIONS.find((l) => l.id === id)
}

export function getAddon(id: string): Addon | undefined {
  return ADDONS.find((a) => a.id === id)
}

/** Add-ons offered for a service. Length is always separate when applicable. */
export function getAddonsForService(service: Service): Addon[] {
  if (!service.allowedAddonIds) return ADDONS
  return service.allowedAddonIds
    .map((id) => getAddon(id))
    .filter((a): a is Addon => Boolean(a))
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

/** Whether length options apply (and can add to price). */
export function serviceUsesLength(service: Service): boolean {
  if (service.hasLength === false) return false
  if (isCareService(service)) return false
  // Men’s styles: length only when explicitly enabled (extension length)
  if (service.category === 'men') return service.hasLength === true
  return true
}

export function isCustomQuoteService(service: Service | undefined | null): boolean {
  return Boolean(service?.quoteOnly)
}

export function calculateBookingTotal(
  service: Service,
  sizeId: BraidSizeId = 'medium',
  lengthId: LengthId = 'shoulder',
  addonIds: string[] = [],
  mobileZoneId?: MobileZoneId | null,
): number {
  if (isCustomQuoteService(service)) return 0
  const size = getSizeOption(sizeId, service)
  const length = getLengthOption(lengthId)
  const care = isCareService(service)
  const addonsTotal = care
    ? 0
    : styleAddonIds(addonIds).reduce((sum, id) => sum + (getAddon(id)?.price ?? 0), 0)
  const sizeAdjust = service.hasSizes === false ? 0 : (size?.priceAdjust ?? 0)
  const menWithExtensions =
    service.category === 'men' && styleAddonIds(addonIds).includes('extensions')
  const lengthPrice =
    serviceUsesLength(service) && (service.category !== 'men' || menWithExtensions)
      ? (length?.price ?? 0)
      : 0
  const mobileFee = mobileZoneId ? (getMobileZone(mobileZoneId)?.price ?? 0) : 0
  return Math.max(0, service.price + sizeAdjust + lengthPrice + addonsTotal + mobileFee)
}

export function calculateBookingDurationHours(
  service: Service,
  sizeId: BraidSizeId = 'medium',
  lengthId: LengthId = 'shoulder',
  addonIds: string[] = [],
): number {
  const size = getSizeOption(sizeId, service)
  const sizeAdjust = service.hasSizes === false ? 0 : (size?.durationAdjustHours ?? 0)
  if (isCareService(service) || !serviceUsesLength(service)) {
    return Math.max(0.5, service.durationHours + sizeAdjust)
  }
  if (service.category === 'men' && !styleAddonIds(addonIds).includes('extensions')) {
    return Math.max(0.5, service.durationHours + sizeAdjust)
  }
  const lengthExtra =
    lengthId === 'waist' ? 0.5 : lengthId === 'butt' ? 1 : lengthId === 'midback' ? 0.25 : 0
  const addonExtra =
    (styleAddonIds(addonIds).includes('boho') ? 0.5 : 0) +
    (styleAddonIds(addonIds).includes('extensions') ? 0.5 : 0) +
    (styleAddonIds(addonIds).includes('curls') ? -0.5 : 0)
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

/** Listed price label - custom quotes show "Price on request" */
export function formatServicePriceLabel(service: Service): string {
  if (isCustomQuoteService(service)) return 'Price on request'
  return `from ${formatPrice(service.price)}`
}

export function formatPriceAdjust(amount: number): string {
  if (amount === 0) return 'Incl.'
  if (amount > 0) return `+$${amount}`
  return `-$${Math.abs(amount)}`
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
  if (!id) return '-'
  return getSizeOption(id)?.label ?? id
}

export function formatAddonsLabel(ids?: string[]): string {
  const styleIds = styleAddonIds(ids)
  if (!styleIds.length) return 'None'
  return styleIds.map((id) => getAddon(id)?.name ?? id).join(', ')
}

export function formatMobileLabel(booking: {
  mobileService?: boolean
  mobileZoneId?: MobileZoneId
}): string {
  if (!booking.mobileService || !booking.mobileZoneId) return 'Studio visit'
  const zone = getMobileZone(booking.mobileZoneId)
  return zone ? `Mobile - ${zone.label} (+$${zone.price})` : 'Mobile'
}
