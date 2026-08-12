import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  pathname: string
}

/**
 * Lightweight route-entry wrapper.
 *
 * The keyed element restarts a short CSS animation on navigation. The CSS only
 * animates opacity and transform, and the global reduced-motion rule disables
 * the spatial transition for users who request it.
 */
export function PageTransition({ children, pathname }: Readonly<PageTransitionProps>) {
  return (
    <div key={pathname} className="route-enter" data-route-transition={pathname}>
      {children}
    </div>
  )
}
