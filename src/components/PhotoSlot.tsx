import { useEffect, useState } from 'react'

interface PhotoSlotProps {
  src?: string | null
  alt: string
  className?: string
  /** Extra classes for the inner placeholder / image fill */
  mediaClassName?: string
  label?: string
}

/**
 * Reserved photo area. Shows the image when the file exists;
 * otherwise a branded empty slot ready for real studio photos.
 */
export function PhotoSlot({
  src,
  alt,
  className = '',
  mediaClassName = 'h-full w-full',
  label = 'Photo coming soon',
}: PhotoSlotProps) {
  const [failed, setFailed] = useState(!src)

  useEffect(() => {
    setFailed(!src)
  }, [src])

  const showImage = Boolean(src) && !failed

  return (
    <div className={`relative overflow-hidden bg-lilac ${className}`}>
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          className={`${mediaClassName} object-cover`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={`${mediaClassName} flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-lilac via-[#efe0f8] to-[#e8d4f5] px-3 text-center`}
          aria-hidden={!label}
        >
          <span className="font-display text-sm font-semibold text-brand/40 sm:text-base">
            {label}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-brand/25">
            Studio photo
          </span>
        </div>
      )}
    </div>
  )
}

/** Convention: public/gallery/{serviceId}.jpg */
export function servicePhotoPath(serviceId: string): string {
  return `/gallery/${serviceId}.jpg`
}
