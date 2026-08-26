import {
  CONFIG,
  formatDateLabel,
  formatSlotLabel,
  getBookingDurationHours,
  getServiceById,
  type Booking,
} from '../data'
import { minutesToSlot, slotToMinutes } from './scheduling'

/** Local wall time → Google Calendar UTC-ish stamp (YYYYMMDDTHHmmss) without Z = floating local */
function localStamp(date: string, slot: string): string {
  const [y, m, d] = date.split('-')
  const [hh, mm] = slot.split(':')
  return `${y}${m}${d}T${hh}${mm}00`
}

function endSlot(booking: Booking): string {
  const start = slotToMinutes(booking.slot)
  const end = start + getBookingDurationHours(booking) * 60
  return minutesToSlot(end)
}

export function googleCalendarUrl(booking: Booking): string {
  const service = getServiceById(booking.serviceId)
  const title = `${service?.name ?? 'Appointment'} — ${booking.clientName}`
  const start = localStamp(booking.date, booking.slot)
  const end = localStamp(booking.date, endSlot(booking))
  const details = [
    `Client: ${booking.clientName}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    booking.note ? `Note: ${booking.note}` : '',
    `Status: ${booking.status}`,
    `Booked via ${CONFIG.name}`,
  ]
    .filter(Boolean)
    .join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details,
    location: booking.mobileService
      ? booking.mobileAddress || 'Mobile appointment'
      : `${CONFIG.city} home studio`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function bookingToIcs(booking: Booking): string {
  const service = getServiceById(booking.serviceId)
  const title = `${service?.name ?? 'Appointment'} — ${booking.clientName}`
  const dtStart = localStamp(booking.date, booking.slot)
  const dtEnd = localStamp(booking.date, endSlot(booking))
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const desc = icsEscape(
    [
      `Client: ${booking.clientName}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email}`,
      `${formatDateLabel(booking.date)} ${formatSlotLabel(booking.slot)}`,
    ].join('\\n'),
  )

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Braided by Rolake//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@braidedbyrolake`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadBookingIcs(booking: Booking): void {
  const blob = new Blob([bookingToIcs(booking)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${booking.date}-${booking.slot.replace(':', '')}-${booking.clientName || 'booking'}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarHomeUrl(): string {
  return 'https://calendar.google.com/'
}
