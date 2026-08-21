import type { BookingStatus } from '../data'

const styles: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-100 text-emerald-800',
  },
  awaiting_deposit: {
    label: 'Awaiting deposit',
    className: 'bg-violet-100 text-violet-900',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-900',
  },
  countered: {
    label: 'Countered',
    className: 'bg-sky-100 text-sky-900',
  },
  declined: {
    label: 'Declined',
    className: 'bg-rose-100 text-rose-800',
  },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = styles[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  )
}
