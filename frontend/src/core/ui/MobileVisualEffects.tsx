/**
 * CSS-only counterpart of the desktop WebGL scene.
 *
 * It keeps the network, orbit and glow language on small screens without
 * downloading Three.js or running a JavaScript animation loop.
 */
export function MobileVisualEffects() {
  return (
    <div
      aria-hidden="true"
      className="mobile-visual-effects pointer-events-none fixed inset-0 z-0 overflow-hidden md:hidden"
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
