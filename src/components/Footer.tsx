import { Link } from 'react-router-dom'
import { CONFIG } from '../data'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand/10 bg-lilac/50">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-full object-cover" />
            <p className="font-display text-xl font-semibold text-brand">{CONFIG.name}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-brand/70">
            {CONFIG.tagline}. Home-based braiding studio in {CONFIG.city} — cozy, private, and all about
            healthy protective styles.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/services" className="text-brand/80 hover:text-accent">
                Services & pricing
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="text-brand/80 hover:text-accent">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/book" className="text-brand/80 hover:text-accent">
                Book an appointment
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-brand/80 hover:text-accent">
                About & contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand/50">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-brand/80">
            <li>
              <a
                href={CONFIG.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent hover:underline"
              >
                {CONFIG.instagram}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONFIG.email}`} className="hover:text-accent">
                {CONFIG.email}
              </a>
            </li>
            <li className="text-brand/60">
              Home studio in {CONFIG.city}. Full address shared once your booking is confirmed.
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand/10 px-4 py-4 text-center text-xs text-brand/45">
        © {new Date().getFullYear()} {CONFIG.name}. Made by MoTechCo.
      </div>
    </footer>
  )
}
