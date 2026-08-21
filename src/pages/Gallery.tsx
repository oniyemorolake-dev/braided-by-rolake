import { Link } from 'react-router-dom'
import { CONFIG } from '../data'

export function Gallery() {
  const phoneHref = CONFIG.contactPhone.replace(/\D/g, '')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Gallery</h1>
        <p className="mt-3 text-brand/70">
          For photos and videos of my work, check Instagram or TikTok. Text or call for more info —
          I&apos;m happy to share recent sets and answer style questions.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href={CONFIG.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="card-soft flex flex-col gap-2 p-5 transition hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Instagram</p>
          <p className="font-display text-2xl font-semibold text-brand">{CONFIG.instagram}</p>
          <p className="text-sm text-brand/60">Photos &amp; finished looks</p>
          <span className="mt-1 text-sm font-semibold text-accent">Open Instagram →</span>
        </a>
        <a
          href={CONFIG.tiktokUrl}
          target="_blank"
          rel="noreferrer"
          className="card-soft flex flex-col gap-2 p-5 transition hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">TikTok</p>
          <p className="font-display text-2xl font-semibold text-brand">{CONFIG.tiktok}</p>
          <p className="text-sm text-brand/60">Videos of braiding &amp; styles</p>
          <span className="mt-1 text-sm font-semibold text-accent">Open TikTok →</span>
        </a>
      </div>

      <div className="mt-6 card-soft px-5 py-6 text-center sm:px-8">
        <p className="font-display text-xl font-semibold text-brand">Need more info?</p>
        <p className="mt-2 text-sm text-brand/65">
          Contact me and I&apos;ll walk you through styles, timing, and what to expect.
        </p>
        <a
          href={`tel:${phoneHref}`}
          className="mt-4 inline-block text-lg font-semibold text-accent hover:underline"
        >
          {CONFIG.phoneDisplay}
        </a>
        <p className="mt-1 text-xs text-brand/45">Text or call</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={`tel:${phoneHref}`} className="btn-primary w-full sm:w-auto">
            Call / text me
          </a>
          <Link to="/book" className="btn-secondary w-full sm:w-auto">
            Book an appointment
          </Link>
        </div>
      </div>
    </div>
  )
}
