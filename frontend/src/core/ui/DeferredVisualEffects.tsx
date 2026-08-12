import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
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

const ENHANCED_ROUTES = new Set(['/', '/nosotros', '/servicios', '/galeria', '/clientes', '/login'])

function supportsEnhancedEffects(): boolean {
  if (typeof globalThis.matchMedia !== 'function' || typeof navigator === 'undefined') return false
  const connection = (navigator as NavigatorWithConnection).connection
  const slowConnection = connection?.saveData === true || connection?.effectiveType === '2g'
  const desktopPointer = globalThis.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  return desktopPointer && !reducedMotion && !slowConnection && globalThis.innerWidth >= 768
}

/** Loads decorative effects only after critical UI work has had a chance to paint. */
export function DeferredVisualEffects() {
  const [ready, setReady] = useState(false)
  const [enhancedSupported, setEnhancedSupported] = useState(supportsEnhancedEffects)
  const { pathname } = useLocation()
  const isEnhancedRoute = ENHANCED_ROUTES.has(pathname)

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
    if (!isEnhancedRoute || !enhancedSupported) return

    let idleId: number | undefined
    let delayId: number | undefined

    const scheduleAfterCriticalWork = () => {
      delayId = globalThis.setTimeout(() => {
        if ('requestIdleCallback' in globalThis) {
          idleId = globalThis.requestIdleCallback(() => setReady(true), { timeout: 1_000 })
        } else {
          setReady(true)
        }
      }, 1_000)
    }

    if (document.readyState === 'complete') {
      scheduleAfterCriticalWork()
    } else {
      globalThis.addEventListener('load', scheduleAfterCriticalWork, { once: true })
    }

    return () => {
      globalThis.removeEventListener('load', scheduleAfterCriticalWork)
      if (delayId !== undefined) globalThis.clearTimeout(delayId)
      if (idleId !== undefined && 'cancelIdleCallback' in globalThis) {
        globalThis.cancelIdleCallback(idleId)
      }
    }
  }, [enhancedSupported, isEnhancedRoute])

  if (!isEnhancedRoute) return null
  return (
    <>
      <MobileVisualEffects />
      {ready && enhancedSupported ? <Suspense fallback={null}><VisualEffects /></Suspense> : null}
    </>
  )
}
