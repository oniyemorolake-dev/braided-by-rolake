import {
  CONFIG,
  PREP_INSTRUCTIONS,
  formatCancelNotice,
  formatDateLabel,
  formatSlotLabel,
  getServiceById,
  formatAddonsLabel,
  formatSizeLabel,
  formatMobileLabel,
  getLengthOption,
} from '../data'
import type { Booking } from '../data'
import type { Review } from './reviews'

/**
 * Free email notifications via Web3Forms — no backend required.
 * Failures are logged but never thrown to the UI confirmation flow.
 */
export async function notifyOwner(booking: Booking): Promise<{ ok: boolean; error?: string }> {
  const service = getServiceById(booking.serviceId)
  const key = CONFIG.web3formsAccessKey

  if (!key || key.includes('PASTE_YOUR')) {
    console.warn('[Web3Forms] Access key not set — skipping email notification.')
    return { ok: false, error: 'Access key not configured' }
  }

  const deposit = booking.depositAmount ?? CONFIG.depositAmount
  const subject =
    booking.status === 'quote_requested'
      ? `Custom quote request — ${service?.name ?? 'Custom'} from ${booking.clientName}`
      : booking.status === 'countered'
        ? `Quote sent — $${booking.counterAmount} for ${booking.clientName}`
        : booking.type === 'offer' && booking.status === 'pending'
          ? `New offer — ${service?.name ?? 'Service'} from ${booking.clientName}`
          : booking.status === 'awaiting_deposit'
            ? `Awaiting deposit — ${service?.name ?? 'Service'} for ${booking.clientName}`
            : booking.status === 'confirmed'
              ? `Deposit received — ${service?.name ?? 'Service'} for ${booking.clientName}`
              : `New booking — ${service?.name ?? 'Service'} for ${booking.clientName}`

  const amount =
    booking.status === 'countered' && booking.counterAmount != null
      ? booking.counterAmount
      : booking.status === 'quote_requested'
        ? 0
        : booking.type === 'offer'
          ? booking.offerAmount ?? booking.price
          : booking.price

  const prepBlock = PREP_INSTRUCTIONS.map((line, i) => `${i + 1}. ${line}`).join('\n')

  const priceLine =
    booking.status === 'quote_requested'
      ? 'Price: on request (awaiting your quote)'
      : `Price: $${amount}`

  const message = [
    `Status: ${booking.status}`,
    `Service: ${service?.name ?? booking.serviceId}`,
    `When: ${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`,
    `Client: ${booking.clientName} · ${booking.phone} · ${booking.email}`,
    priceLine,
    '',
    `CUSTOM / NOTE: ${booking.note || '(none)'}`,
    `INSPO: ${booking.inspoUrl || '(none uploaded)'}`,
    `ACCOMMODATIONS / ALLERGIES: ${booking.notesAccommodations || '(none noted)'}`,
    '',
    `DEPOSIT: $${deposit} via Interac e-Transfer to ${CONFIG.depositEmail}`,
    CONFIG.depositInstructions,
    'Booking is only confirmed once the deposit is received. Remaining balance is paid in person.',
    '',
    formatCancelNotice(),
    '',
    'PREP INSTRUCTIONS:',
    prepBlock,
    '',
    `Booking ID: ${booking.id}`,
    `Status page: /status/${booking.id}`,
  ].join('\n')

  const payload = {
    access_key: key,
    subject,
    from_name: 'Braided by Rolake Bookings',
    message,
    service: service?.name ?? booking.serviceId,
    size: formatSizeLabel(booking.size),
    length: getLengthOption(booking.lengthId ?? 'shoulder')?.label ?? 'Shoulder',
    addons: formatAddonsLabel(booking.addonIds),
    location: formatMobileLabel(booking),
    mobile_address: booking.mobileAddress || '(studio visit)',
    date: formatDateLabel(booking.date),
    time: formatSlotLabel(booking.slot),
    client_name: booking.clientName,
    phone: booking.phone,
    email: booking.email,
    price_or_offer:
      booking.status === 'quote_requested' ? 'Price on request' : `$${amount}`,
    deposit_required: `$${deposit}`,
    deposit_email: CONFIG.depositEmail,
    deposit_instructions: CONFIG.depositInstructions,
    remaining_balance: 'Paid in person',
    cancellation_notice: formatCancelNotice(),
    prep_instructions: prepBlock,
    inspo_url: booking.inspoUrl || '(none)',
    allergies_accommodations: booking.notesAccommodations || '(none)',
    booking_type: booking.type,
    status: booking.status,
    note: booking.note || '(none)',
    counter_amount: booking.counterAmount != null ? `$${booking.counterAmount}` : '(n/a)',
    discount_code: booking.discountCode || '(none)',
    discount_amount: booking.discountAmount != null ? `$${booking.discountAmount}` : '(n/a)',
    discount_type: booking.discountType || '(n/a)',
    booking_id: booking.id,
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { success?: boolean; message?: string }
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message || 'Email send failed' }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[Web3Forms]', message)
    return { ok: false, error: message }
  }
}

/**
 * Notify the client that a custom quote (or counter) is ready.
 * Web3Forms delivers to the form owner; include client email + status link so
 * the quote can be forwarded / autoresponded, and the status page is the source of truth.
 */
export async function notifyClientOfQuote(
  booking: Booking,
): Promise<{ ok: boolean; error?: string }> {
  const key = CONFIG.web3formsAccessKey
  if (!key || key.includes('PASTE_YOUR')) {
    console.warn('[Web3Forms] Access key not set — skipping client quote email.')
    return { ok: false, error: 'Access key not configured' }
  }

  if (booking.counterAmount == null) {
    return { ok: false, error: 'No quote amount' }
  }

  const service = getServiceById(booking.serviceId)
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://braidedbyrolake.ca'
  const statusUrl = `${origin}/status/${booking.id}`
  const amount = formatPriceLike(booking.counterAmount)

  const subject = `Your quote from Braided by Rolake — ${amount}`
  const message = [
    `Hi ${booking.clientName},`,
    '',
    `Rolake has sent a quote for your custom style request.`,
    '',
    `Service: ${service?.name ?? booking.serviceId}`,
    `When: ${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`,
    `Quoted price: ${amount}`,
    booking.note ? `Your request: ${booking.note}` : '',
    '',
    `Accept or decline your quote here:`,
    statusUrl,
    '',
    `If you accept, you'll send a $${booking.depositAmount ?? CONFIG.depositAmount} e-Transfer deposit to secure the appointment.`,
    '',
    '— Braided by Rolake',
  ]
    .filter(Boolean)
    .join('\n')

  const payload = {
    access_key: key,
    subject,
    from_name: 'Braided by Rolake',
    email: booking.email,
    name: booking.clientName,
    message,
    quoted_price: amount,
    status_url: statusUrl,
    booking_id: booking.id,
    // Ask Web3Forms to CC the client when supported by the account
    ccemail: booking.email,
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { success?: boolean; message?: string }
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message || 'Email send failed' }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[Web3Forms]', message)
    return { ok: false, error: message }
  }
}

function formatPriceLike(amount: number): string {
  return `$${amount}`
}

function statusUrlFor(bookingId: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://braidedbyrolake.ca'
  return `${origin}/status/${bookingId}`
}

/**
 * Email the client a booking receipt / confirmation via Web3Forms (CC to their address).
 * - awaiting_deposit: “we got your request — send deposit”
 * - confirmed: “you’re booked”
 */
export async function notifyClientBooking(
  booking: Booking,
): Promise<{ ok: boolean; error?: string }> {
  const key = CONFIG.web3formsAccessKey
  if (!key || key.includes('PASTE_YOUR')) {
    return { ok: false, error: 'Access key not configured' }
  }

  const service = getServiceById(booking.serviceId)
  const statusUrl = statusUrlFor(booking.id)
  const deposit = booking.depositAmount ?? CONFIG.depositAmount
  const when = `${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`

  const isConfirmed = booking.status === 'confirmed'
  const subject = isConfirmed
    ? `You’re booked — Braided by Rolake`
    : `Booking received — deposit needed · Braided by Rolake`

  const message = isConfirmed
    ? [
        `Hi ${booking.clientName},`,
        '',
        `Your deposit was received and your appointment is confirmed!`,
        '',
        `Service: ${service?.name ?? booking.serviceId}`,
        `When: ${when}`,
        `Total: $${booking.price}`,
        booking.mobileService
          ? `Location: Mobile — ${booking.mobileAddress || 'address on file'}`
          : `Location: Studio (address shared on your status page)`,
        '',
        `View your booking anytime:`,
        statusUrl,
        '',
        formatCancelNotice(),
        '',
        '— Braided by Rolake',
      ].join('\n')
    : [
        `Hi ${booking.clientName},`,
        '',
        `Thanks for booking with Braided by Rolake! Your time slot is held.`,
        '',
        `Service: ${service?.name ?? booking.serviceId}`,
        `When: ${when}`,
        `Total: $${booking.price}`,
        `Deposit to send: $${deposit} Interac e-Transfer to ${CONFIG.depositEmail}`,
        '',
        `Your booking is only fully confirmed once Rolake marks the deposit received.`,
        `Track status here:`,
        statusUrl,
        '',
        CONFIG.depositInstructions,
        '',
        '— Braided by Rolake',
      ].join('\n')

  const payload = {
    access_key: key,
    subject,
    from_name: 'Braided by Rolake',
    email: booking.email,
    name: booking.clientName,
    message,
    status_url: statusUrl,
    booking_id: booking.id,
    ccemail: booking.email,
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { success?: boolean; message?: string }
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message || 'Email send failed' }
    }
    return { ok: true }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Network error'
    console.error('[Web3Forms]', errMessage)
    return { ok: false, error: errMessage }
  }
}

/**
 * Notify owner when a client submits a new review (pending moderation).
 */
export async function notifyOwnerOfReview(review: Review): Promise<{ ok: boolean; error?: string }> {
  const key = CONFIG.web3formsAccessKey

  if (!key || key.includes('PASTE_YOUR')) {
    console.warn('[Web3Forms] Access key not set — skipping email notification.')
    return { ok: false, error: 'Access key not configured' }
  }

  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  const subject = `New review (${review.rating}/5) from ${review.name}`

  const message = [
    'A new review was submitted and is waiting for approval.',
    '',
    `Name: ${review.name}`,
    `Rating: ${stars} (${review.rating}/5)`,
    `Style: ${review.style || '(not specified)'}`,
    '',
    'Review:',
    review.text,
    '',
    `Review ID: ${review.id}`,
    'Approve or hide it in Admin → Reviews.',
  ].join('\n')

  const payload = {
    access_key: key,
    subject,
    from_name: 'Braided by Rolake Reviews',
    message,
    client_name: review.name,
    rating: String(review.rating),
    style: review.style || '(none)',
    review_text: review.text,
    review_id: review.id,
    status: review.status,
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { success?: boolean; message?: string }
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message || 'Email send failed' }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[Web3Forms]', message)
    return { ok: false, error: message }
  }
}

/** Email a client (via Web3Forms + cc) about a discount / referral / loyalty code */
export async function notifyDiscountCodeEmail(input: {
  toEmail: string
  subject: string
  headline: string
  body: string
  code: string
  amount: number
}): Promise<{ ok: boolean; error?: string }> {
  const key = CONFIG.web3formsAccessKey
  if (!key || key.includes('PASTE_YOUR')) {
    console.warn('[Web3Forms] Access key not set — skipping discount email.')
    return { ok: false, error: 'Access key not configured' }
  }

  const message = [
    input.headline,
    '',
    input.body,
    '',
    `Code: ${input.code}`,
    `Amount off: $${input.amount}`,
    '',
    'One code per booking · codes are single-use.',
    '— Braided by Rolake',
  ].join('\n')

  const payload = {
    access_key: key,
    subject: input.subject,
    from_name: 'Braided by Rolake',
    email: input.toEmail,
    ccemail: input.toEmail,
    message,
    discount_code: input.code,
    discount_amount: `$${input.amount}`,
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { success?: boolean; message?: string }
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message || 'Email send failed' }
    }
    return { ok: true }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Network error'
    console.error('[Web3Forms]', errMessage)
    return { ok: false, error: errMessage }
  }
}

/** Record a cancellation / decline for the owner inbox */
export async function notifyOwnerOfCancellation(
  booking: Booking,
): Promise<{ ok: boolean; error?: string }> {
  const key = CONFIG.web3formsAccessKey
  if (!key || key.includes('PASTE_YOUR')) {
    return { ok: false, error: 'Access key not configured' }
  }
  const service = getServiceById(booking.serviceId)
  const subject = `Cancelled — ${service?.name ?? 'Booking'} for ${booking.clientName}`
  const message = [
    'A booking was cancelled / declined. The slot and buffer are free again.',
    '',
    `Service: ${service?.name ?? booking.serviceId}`,
    `When: ${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`,
    `Client: ${booking.clientName} · ${booking.phone} · ${booking.email}`,
    `Previous status before cancel action was handled in admin.`,
    `Booking ID: ${booking.id}`,
  ].join('\n')

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: key,
        subject,
        from_name: 'Braided by Rolake Bookings',
        message,
        booking_id: booking.id,
        status: 'declined',
      }),
    })
    const data = (await res.json()) as { success?: boolean; message?: string }
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message || 'Email send failed' }
    }
    return { ok: true }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Network error'
    console.error('[Web3Forms]', errMessage)
    return { ok: false, error: errMessage }
  }
}
