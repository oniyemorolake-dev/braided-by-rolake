import { Link } from 'react-router-dom'
import { CONFIG } from '../data'

export function Gallery() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Gallery</h1>
        <p className="mt-3 text-brand/70">
          Real client photos are coming soon. For now, see recent work on Instagram.
        </p>
      </div>

      <div className="card-soft mt-10 px-6 py-16 text-center">
        <p className="font-display text-2xl text-brand">Photos coming soon</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-brand/60">
          Follow {CONFIG.instagram} for the latest sets — this page will be updated with real studio
          photos.
        </p>
        <a
          href={CONFIG.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-6 inline-flex"
        >
          View on Instagram
        </a>
      </div>

      <div className="mt-12 text-center">
        <Link to="/book" className="btn-secondary">
          Book an appointment
        </Link>
      </div>
    </div>
  )
}
