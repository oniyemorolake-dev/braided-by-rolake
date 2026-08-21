import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { CONFIG } from '../data'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/about', label: 'About' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-brand/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img
            src="/logo.png"
            alt="Braided by Rolake"
            className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-lilac"
          />
          <span className="font-display text-lg font-semibold leading-tight text-brand sm:text-xl">
            Braided by Rolake
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-lilac text-brand'
                    : 'text-brand/70 hover:bg-lilac/60 hover:text-brand'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/book" className="btn-primary ml-2 !px-4 !py-2 text-sm">
            Book Now
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/15 text-brand md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand/10 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-medium ${
                    isActive ? 'bg-lilac text-brand' : 'text-brand/80'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/book"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full text-center"
            >
              Book Now
            </Link>
            <a
              href={CONFIG.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 px-4 py-2 text-center text-sm text-brand/60"
            >
              {CONFIG.instagram}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
