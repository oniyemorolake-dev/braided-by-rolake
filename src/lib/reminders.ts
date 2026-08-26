import type { Booking } from '../data'
import {
  notifyDayBeforeReminder,
  notifyDepositReminder,
} from './notifications'
import { updateBookingRemote } from './storage'

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export interface ReminderRunResult {
  depositSent: number
  dayBeforeSent: number
  skipped: number
  errors: string[]
}

/**
 * Free email reminders via Web3Forms (no SMS / no paid SMS gateway).
 * - Deposit nudge: awaiting_deposit, created ≥ 12h ago, not yet reminded
 * - Day-before: confirmed, appointment date is tomorrow, not yet reminded
 */
export async function runDueReminders(bookings: Booking[]): Promise<ReminderRunResult> {
  const now = new Date()
  const today = toIsoDate(now)
  const tomorrow = addDaysIso(today, 1)
  const twelveHoursMs = 12 * 60 * 60 * 1000

  let depositSent = 0
  let dayBeforeSent = 0
  let skipped = 0
  const errors: string[] = []

  for (const b of bookings) {
    if (b.status === 'awaiting_deposit' && !b.depositReminderSentAt) {
      const created = new Date(b.createdAt).getTime()
      if (Number.isFinite(created) && now.getTime() - created >= twelveHoursMs) {
        const res = await notifyDepositReminder(b)
        if (res.ok) {
          const stamp = now.toISOString()
          await updateBookingRemote(b.id, { depositReminderSentAt: stamp }, 'admin')
          depositSent += 1
        } else {
          errors.push(`${b.id} deposit: ${res.error ?? 'failed'}`)
        }
        continue
      }
    }

    if (
      b.status === 'confirmed' &&
      b.date === tomorrow &&
      !b.dayBeforeReminderSentAt
    ) {
      const res = await notifyDayBeforeReminder(b)
      if (res.ok) {
        const stamp = now.toISOString()
        await updateBookingRemote(b.id, { dayBeforeReminderSentAt: stamp }, 'admin')
        dayBeforeSent += 1
      } else {
        errors.push(`${b.id} day-before: ${res.error ?? 'failed'}`)
      }
      continue
    }

    skipped += 1
  }

  return { depositSent, dayBeforeSent, skipped, errors }
}
