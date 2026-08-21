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
    booking.type === 'offer' && booking.status === 'pending'
      ? `New offer — ${service?.name ?? 'Service'} from ${booking.clientName}`
      : booking.status === 'awaiting_deposit'
        ? `Awaiting deposit — ${service?.name ?? 'Service'} for ${booking.clientName}`
        : booking.status === 'confirmed'
          ? `Deposit received — ${service?.name ?? 'Service'} for ${booking.clientName}`
          : `New booking — ${service?.name ?? 'Service'} for ${booking.clientName}`

  const amount =
    booking.type === 'offer'
      ? booking.offerAmount ?? booking.price
      : booking.price

  const prepBlock = PREP_INSTRUCTIONS.map((line, i) => `${i + 1}. ${line}`).join('\n')

  const message = [
    `Status: ${booking.status}`,
    `Service: ${service?.name ?? booking.serviceId}`,
    `When: ${formatDateLabel(booking.date)} · ${formatSlotLabel(booking.slot)}`,
    `Client: ${booking.clientName} · ${booking.phone} · ${booking.email}`,
    `Price: $${amount}`,
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
    price_or_offer: `$${amount}`,
    deposit_required: `$${deposit}`,
    deposit_email: CONFIG.depositEmail,
    deposit_instructions: CONFIG.depositInstructions,
    remaining_balance: 'Paid in person',
    cancellation_notice: formatCancelNotice(),
    prep_instructions: prepBlock,
    booking_type: booking.type,
    status: booking.status,
    note: booking.note || '(none)',
    counter_amount: booking.counterAmount != null ? `$${booking.counterAmount}` : '(n/a)',
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
