import { lazy, Suspense, useEffect, useState } from 'react'
import { MobileVisualEffects } from './MobileVisualEffects'

const VisualEffects = lazy(() =>
  import('./VisualEffects').then((module) => ({ default: module.VisualEffects })),
)

interface NetworkInformationLike {
  effectiveType?: string
  saveData?: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike
}

function supportsEnhancedEffects(): boolean {
  if (typeof globalThis.matchMedia !== 'function' || typeof navigator === 'undefined') return false
  const connection = (navigator as NavigatorWithConnection).connection
  const slowConnection = connection?.saveData === true || connection?.effectiveType === '2g'
  const desktopPointer = globalThis.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  return desktopPointer && !reducedMotion && !slowConnection && globalThis.innerWidth >= 768
}

/**
 * Global visual atmosphere for every route and role.
 *
 * The lightweight layer paints immediately. The desktop Three.js bundle is
 * downloaded once, after critical UI work, and remains mounted across route
 * changes so navigation never recreates the WebGL context or animation loop.
 */
export function DeferredVisualEffects() {
  const [ready, setReady] = useState(false)
  const [enhancedSupported, setEnhancedSupported] = useState(supportsEnhancedEffects)

  useEffect(() => {
    const pointerQuery = globalThis.matchMedia('(hover: hover) and (pointer: fine)')
    const motionQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    const updateSupport = () => setEnhancedSupported(supportsEnhancedEffects())
    pointerQuery.addEventListener('change', updateSupport)
    motionQuery.addEventListener('change', updateSupport)
    globalThis.addEventListener('resize', updateSupport, { passive: true })
    return () => {
      pointerQuery.removeEventListener('change', updateSupport)
      motionQuery.removeEventListener('change', updateSupport)
      globalThis.removeEventListener('resize', updateSupport)
    }
  }, [])

  useEffect(() => {
    setReady(false)
    if (!enhancedSupported) return

    let idleId: number | undefined

    const scheduleAfterCriticalWork = () => {
      if ('requestIdleCallback' in globalThis) {
        idleId = globalThis.requestIdleCallback(() => setReady(true), { timeout: 1_200 })
      } else {
        setReady(true)
      }
    }

    if (document.readyState === 'complete') {
      scheduleAfterCriticalWork()
    } else {
      globalThis.addEventListener('load', scheduleAfterCriticalWork, { once: true })
    }

    return () => {
      globalThis.removeEventListener('load', scheduleAfterCriticalWork)
      if (idleId !== undefined && 'cancelIdleCallback' in globalThis) {
        globalThis.cancelIdleCallback(idleId)
      }
    }
  }, [enhancedSupported])

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        data-testid="global-visual-base"
        style={{
          background: 'radial-gradient(circle at 75% 20%, rgba(0,196,224,0.08), transparent 32%), radial-gradient(circle at 15% 80%, rgba(56,217,245,0.05), transparent 30%), #04090f',
        }}
      />
      <MobileVisualEffects />
      {!enhancedSupported || !ready ? <MobileVisualEffects desktopFallback /> : null}
      {ready && enhancedSupported ? (
        <Suspense fallback={<MobileVisualEffects desktopFallback />}>
          <VisualEffects />
        </Suspense>
      ) : null}
    </>
  )
}
