import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function jumpToTop() {
  // Disable browser restoring the previous page scroll position
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  // html { scroll-behavior: smooth } can fight scrollTo(0,0) — force an instant jump
  const html = document.documentElement
  const previous = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'

  window.scrollTo(0, 0)
  html.scrollTop = 0
  document.body.scrollTop = 0

  html.style.scrollBehavior = previous
}

/** Jump to top on every client-side route change. */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useLayoutEffect(() => {
    if (hash) {
      // Allow the target section to mount, then scroll to it
      const id = decodeURIComponent(hash.slice(1))
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView()
          return
        }
        jumpToTop()
      })
      return
    }

    jumpToTop()
    // Extra pass after paint (images / sticky header / late layout)
    requestAnimationFrame(() => jumpToTop())
  }, [pathname, search, hash])

  return null
}
