import {
  CONFIG,
  formatDateLabel,
  formatPrice,
  formatSlotLabel,
  getServiceById,
  type Booking,
} from '../data'

export interface ReplyTemplate {
  id: string
  label: string
  /** Build body from booking context */
  body: (b: Booking) => string
}

function serviceName(b: Booking): string {
  return getServiceById(b.serviceId)?.name ?? 'your style'
}

function when(b: Booking): string {
  return `${formatDateLabel(b.date)} at ${formatSlotLabel(b.slot)}`
}

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'confirm',
    label: 'Confirm + deposit received',
    body: (b) =>
      `Hi ${b.clientName}! Your deposit is in and you’re confirmed for ${serviceName(b)} on ${when(b)}. Studio address will be shared closer to the day. See you soon — Rolake`,
  },
  {
    id: 'deposit_reminder',
    label: 'Deposit reminder',
    body: (b) =>
      `Hi ${b.clientName} — just a reminder to send your ${formatPrice(b.depositAmount ?? CONFIG.depositAmount)} Interac e-Transfer deposit to ${CONFIG.depositEmail} (name + booking date in the message) to hold ${when(b)}. Thanks! — Rolake`,
  },
  {
    id: 'prep',
    label: 'Prep reminder',
    body: (b) =>
      `Hi ${b.clientName}! Looking forward to ${serviceName(b)} on ${when(b)}. Please come with hair freshly washed, blow-dried, detangled, and product-free (unless we booked otherwise). Bring extensions if you’re providing them. Eat beforehand — long styles take a while. — Rolake`,
  },
  {
    id: 'reschedule',
    label: 'Reschedule ask',
    body: (b) =>
      `Hi ${b.clientName}, I need to move your ${serviceName(b)} appointment (${when(b)}). Can you share a few other dates/times that work? Thanks for understanding — Rolake`,
  },
  {
    id: 'bring_hair',
    label: 'Bring / order hair',
    body: (b) =>
      `Hi ${b.clientName}! For ${serviceName(b)} on ${when(b)}, please bring [colour + packs] OR let me know if you need me to provide hair. Text me once you’ve got it. — Rolake`,
  },
  {
    id: 'running_late',
    label: 'I’m running late',
    body: (b) =>
      `Hi ${b.clientName} — I’m running a little behind for our ${formatSlotLabel(b.slot)} appointment. I’ll keep you posted and start as soon as I can. Sorry for the wait! — Rolake`,
  },
  {
    id: 'thanks_review',
    label: 'Thanks + review ask',
    body: (b) =>
      `Hi ${b.clientName}! Thank you for coming in for ${serviceName(b)}. If you loved your look, a quick review on the site would mean a lot: ${typeof window !== 'undefined' ? window.location.origin : ''}/reviews — Rolake`,
  },
]

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function smsLink(phone: string, body: string): string {
  const digits = phone.replace(/\D/g, '')
  return `sms:${digits}?body=${encodeURIComponent(body)}`
}

export function mailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
