import { Link } from 'react-router-dom'
import { CONFIG } from '../data'

export function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <h1 className="font-display text-4xl font-semibold text-brand sm:text-5xl">
            About Rolake
          </h1>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-brand/75">
            <p>
              Hi — I&apos;m Rolake, the hands behind {CONFIG.name}. I specialize in protective styles
              that look beautiful and feel kind on your scalp: knotless braids, box braids, twists,
              cornrows, and gentle kids styles.
            </p>
            <p>
              I work from a home-based studio in {CONFIG.city}. It&apos;s a quiet, comfortable space
              where we can take our time — play your playlist, chat, or simply rest while I braid.
              For privacy and safety, the exact street address is shared only after your booking is
              confirmed.
            </p>
            <p>
              Whether you book at the listed price or send an offer, you&apos;ll always get clear
              communication and honest timing. My goal is simple: you leave feeling cared for, with a
              style that lasts.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className="btn-primary">
              Book an appointment
            </Link>
            <a
              href={CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Follow {CONFIG.instagram}
            </a>
          </div>
        </div>

        <aside className="card-soft space-y-6 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Studio</p>
            <p className="mt-1 font-medium text-brand">Home studio · {CONFIG.city}, AB</p>
            <p className="mt-1 text-sm text-brand/60">
              Full address revealed on your confirmation screen once you&apos;re booked.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Email</p>
            <a href={`mailto:${CONFIG.email}`} className="mt-1 block font-medium text-accent hover:underline">
              {CONFIG.email}
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Instagram</p>
            <a
              href={CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block font-medium text-accent hover:underline"
            >
              {CONFIG.instagram}
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/45">Hours</p>
            <p className="mt-1 text-sm text-brand/75">
              Monday–Saturday · 9:00 AM – 7:00 PM
              <br />
              Longer styles often take a full morning or afternoon — book early for weekend spots.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
