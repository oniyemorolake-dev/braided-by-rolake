import { Link } from 'react-router-dom'
import { CONFIG } from '../data'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand/8 bg-gradient-to-b from-lilac/40 to-lilac/70">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white/80"
            />
            <p className="font-display text-xl font-semibold text-brand">{CONFIG.name}</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand/65">
            {CONFIG.tagline}. Home-based braiding in {CONFIG.city} — calm, private, protective
            styles done with care.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand/45">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/services" className="text-brand/75 hover:text-accent">
                Services & pricing
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="text-brand/75 hover:text-accent">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/book" className="text-brand/75 hover:text-accent">
                Book an appointment
              </Link>
            </li>
            <li>
              <Link to="/care" className="text-brand/75 hover:text-accent">
                Prep & aftercare
              </Link>
            </li>
            <li>
              <Link to="/policies" className="text-brand/75 hover:text-accent">
                FAQ & policies
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-brand/75 hover:text-accent">
                About & contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand/45">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-brand/75">
            <li>
              <a
                href={`tel:${CONFIG.contactPhone.replace(/\D/g, '')}`}
                className="font-medium text-accent hover:underline"
              >
                {CONFIG.phoneDisplay}
              </a>
              <span className="block text-xs text-brand/45">Text or call for more info</span>
            </li>
            <li>
              <a
                href={CONFIG.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent hover:underline"
              >
                IG {CONFIG.instagram}
              </a>
            </li>
            <li>
              <a
                href={CONFIG.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent hover:underline"
              >
                TikTok {CONFIG.tiktok}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONFIG.email}`} className="hover:text-accent">
                {CONFIG.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand/8 px-4 py-4 text-center text-xs text-brand/40">
        © {new Date().getFullYear()} {CONFIG.name}. Made by MoTechCo.
      </div>
    </footer>
  )
}
