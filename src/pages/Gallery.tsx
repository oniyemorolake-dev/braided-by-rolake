import { Link } from 'react-router-dom'
import { GALLERY } from '../data'

export function Gallery() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Gallery</h1>
        <p className="mt-3 text-brand/70">
          A peek at recent protective styles from the studio. Follow along on Instagram for even more
          sets between updates.
        </p>
      </div>

      {GALLERY.length === 0 ? (
        <div className="card-soft mt-10 px-6 py-16 text-center">
          <p className="font-display text-2xl text-brand">Gallery coming soon</p>
          <p className="mt-2 text-sm text-brand/60">
            Follow along on Instagram for the latest sets while we update this page.
          </p>
        </div>
      ) : (
        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {GALLERY.map((item) => (
            <figure
              key={item.id}
              className="card-soft mb-4 break-inside-avoid overflow-hidden"
            >
              <img
                src={item.image}
                alt={item.title}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="p-4">
                <p className="font-display text-lg font-semibold text-brand">{item.title}</p>
                <p className="mt-1 text-sm text-brand/60">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link to="/book" className="btn-primary">
          Book a style like these
        </Link>
      </div>
    </div>
  )
}
