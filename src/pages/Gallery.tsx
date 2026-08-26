import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CONFIG,
  GALLERY_FILTERS,
  GALLERY_ITEMS,
  type GalleryTag,
} from '../data'
import { PhotoSlot } from '../components/PhotoSlot'

export function Gallery() {
  const phoneHref = CONFIG.contactPhone.replace(/\D/g, '')
  const [filter, setFilter] = useState<GalleryTag | 'all'>('all')

  const items = useMemo(() => {
    if (filter === 'all') return GALLERY_ITEMS
    return GALLERY_ITEMS.filter((item) => item.tags.includes(filter))
  }, [filter])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">Gallery</h1>
        <p className="mt-3 text-brand/70">
          Browse by style. Studio photos appear here as they’re added — for the latest videos, check
          Instagram and TikTok.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
              filter === f.id
                ? 'bg-brand text-white'
                : 'bg-lilac/70 text-brand/70 hover:bg-lilac hover:text-brand'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const card = (
            <article className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
              <PhotoSlot
                src={item.image}
                alt={item.title}
                className="aspect-[4/5]"
                mediaClassName="h-full w-full"
                label={item.title}
              />
              <div className="px-4 py-3">
                <p className="font-display text-lg font-semibold text-brand">{item.title}</p>
                {item.caption && <p className="mt-0.5 text-sm text-brand/60">{item.caption}</p>}
                <p className="mt-2 text-[11px] uppercase tracking-wide text-brand/40">
                  {item.tags.join(' · ')}
                </p>
              </div>
            </article>
          )
          return item.href ? (
            <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="block">
              {card}
            </a>
          ) : (
            <div key={item.id}>{card}</div>
          )
        })}
      </div>

      {items.length === 0 && (
        <p className="mt-8 text-center text-sm text-brand/55">No looks in this filter yet.</p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={CONFIG.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="card-soft flex flex-col gap-2 p-5 transition hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Instagram</p>
          <p className="font-display text-2xl font-semibold text-brand">{CONFIG.instagram}</p>
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
          <span className="mt-1 text-sm font-semibold text-accent">Open TikTok →</span>
        </a>
      </div>

      <div className="mt-6 card-soft px-5 py-6 text-center sm:px-8">
        <p className="font-display text-xl font-semibold text-brand">Ready to book?</p>
        <p className="mt-2 text-sm text-brand/65">
          Text {CONFIG.phoneDisplay} with questions, or book online.
        </p>
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
