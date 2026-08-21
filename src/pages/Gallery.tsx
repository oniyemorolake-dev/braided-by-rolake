import { Link } from 'react-router-dom'
import { CONFIG, GALLERY } from '../data'
import { PhotoSlot } from '../components/PhotoSlot'

export function Gallery() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Gallery</h1>
        <p className="mt-3 text-brand/70">
          Studio photo spots are ready — real client pictures will fill these as they&apos;re added.
          Follow along on Instagram for the latest sets.
        </p>
      </div>

      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {GALLERY.map((item) => (
          <figure key={item.id} className="card-soft mb-4 break-inside-avoid overflow-hidden">
            <PhotoSlot
              src={item.image}
              alt={item.title}
              className="aspect-[3/4] w-full"
              label="Photo coming soon"
            />
            <figcaption className="p-4">
              <p className="font-display text-lg font-semibold text-brand">{item.title}</p>
              <p className="mt-1 text-sm text-brand/60">{item.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-lilac/60 px-5 py-6 text-center">
        <p className="text-sm text-brand/70">
          See more on Instagram{' '}
          <a
            href={CONFIG.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            {CONFIG.instagram}
          </a>
        </p>
        <Link to="/book" className="btn-primary mt-4 inline-flex">
          Book an appointment
        </Link>
      </div>
    </div>
  )
}
