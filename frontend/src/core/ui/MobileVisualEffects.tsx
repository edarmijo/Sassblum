interface MobileVisualEffectsProps {
  /** Show only on desktop while WebGL is deferred or unavailable. */
  desktopFallback?: boolean
}

/** CSS-only counterpart of the WebGL scene for mobile and desktop fallback. */
export function MobileVisualEffects({ desktopFallback = false }: Readonly<MobileVisualEffectsProps>) {
  return (
    <div
      aria-hidden="true"
      className={`mobile-visual-effects pointer-events-none fixed inset-0 z-0 overflow-hidden ${desktopFallback ? 'hidden md:block' : 'md:hidden'}`}
      data-visual-fallback={desktopFallback ? 'desktop' : 'mobile'}
    >
      <div className="mobile-visual-effects__grid" />
      <div className="mobile-visual-effects__nodes" />
      <div className="mobile-visual-effects__orb mobile-visual-effects__orb--primary" />
      <div className="mobile-visual-effects__orb mobile-visual-effects__orb--secondary" />
      <div className="mobile-visual-effects__ring mobile-visual-effects__ring--outer" />
      <div className="mobile-visual-effects__ring mobile-visual-effects__ring--inner" />
    </div>
  )
}
