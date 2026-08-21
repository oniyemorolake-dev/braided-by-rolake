import { Link } from 'react-router-dom'
import {
  formatDuration,
  formatPrice,
  type Service,
} from '../data'
import { PhotoSlot, servicePhotoPath } from './PhotoSlot'

interface ServiceCardProps {
  service: Service
  compact?: boolean
}

export function ServiceCard({ service, compact }: ServiceCardProps) {
  const src = service.image ?? servicePhotoPath(service.id)

  return (
    <article className="card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <PhotoSlot
        src={src}
        alt={service.name}
        className="aspect-[4/3] w-full"
        label="Photo coming soon"
      />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-semibold text-brand sm:text-2xl">
            {service.name}
          </h3>
          <p className="shrink-0 text-right text-lg font-semibold text-accent">
            from {formatPrice(service.price)}
            <span className="mt-0.5 block text-[10px] font-medium text-brand/45">before tax</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-brand/55">
          ~{formatDuration(service.durationHours)}
          {service.hasSizes !== false && (
            <span className="ml-2">· Small–Large</span>
          )}
        </p>
        {!compact && (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-brand/70">
            {service.description}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            to={`/book?service=${service.id}&mode=listed`}
            className="btn-primary flex-1 !px-3 !py-2.5 text-center text-sm"
          >
            Book from {formatPrice(service.price)}
          </Link>
          <Link
            to={`/book?service=${service.id}&mode=offer`}
            className="btn-secondary flex-1 !px-3 !py-2.5 text-center text-sm"
          >
            Make an offer
          </Link>
        </div>
      </div>
    </article>
  )
}
