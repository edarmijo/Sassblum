import { useEffect, useRef } from 'react'

interface Position {
  x: number
  y: number
}

const INTERACTIVE_SELECTORS = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '.card-interactive',
].join(', ')

const CURSOR_MEDIA_QUERY = [
  '(hover: hover)',
  '(pointer: fine)',
  '(prefers-reduced-motion: no-preference)',
].join(' and ')

const ACTIVE_CLASS = 'custom-cursor-active'

function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount
}

/**
 * Progressive custom cursor: the native cursor is only hidden after this
 * component confirms that its replacement is visible and tracking a real mouse.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)

  const mousePos = useRef<Position>({ x: -100, y: -100 })
  const dotPos = useRef<Position>({ x: -100, y: -100 })
  const followerPos = useRef<Position>({ x: -100, y: -100 })
  const trailPos = useRef<Position>({ x: -100, y: -100 })
  const isActive = useRef(false)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(CURSOR_MEDIA_QUERY)
    const cursorElements = [dotRef.current, followerRef.current, trailRef.current]

    const setLayersVisible = (visible: boolean) => {
      for (const element of cursorElements) {
        if (element) element.style.opacity = visible ? element.dataset.opacity ?? '1' : '0'
      }
    }

    const applyHoverStyles = (hovering: boolean) => {
      const dot = dotRef.current
      const follower = followerRef.current
      if (dot) {
        const size = hovering ? 50 : 8
        const margin = hovering ? -25 : -4
        dot.style.width = `${size}px`
        dot.style.height = `${size}px`
        dot.style.marginLeft = `${margin}px`
        dot.style.marginTop = `${margin}px`
        dot.style.background = hovering ? '#7c5cfc' : '#fff'
      }
      if (follower) {
        const size = hovering ? 70 : 40
        const margin = hovering ? -35 : -20
        follower.style.width = `${size}px`
        follower.style.height = `${size}px`
        follower.style.marginLeft = `${margin}px`
        follower.style.marginTop = `${margin}px`
        follower.style.borderColor = hovering ? '#7c5cfc' : 'rgba(124,92,252,0.5)'
      }
    }

    const positionLayersImmediately = (position: Position) => {
      mousePos.current = position
      dotPos.current = position
      followerPos.current = position
      trailPos.current = position
      dotRef.current?.style.setProperty('transform', `translate(${position.x}px, ${position.y}px)`)
      followerRef.current?.style.setProperty('transform', `translate(${position.x}px, ${position.y}px)`)
      trailRef.current?.style.setProperty('transform', `translate(${position.x}px, ${position.y}px)`)
    }

    const animate = () => {
      if (!isActive.current) return
      dotPos.current.x = lerp(dotPos.current.x, mousePos.current.x, 0.2)
      dotPos.current.y = lerp(dotPos.current.y, mousePos.current.y, 0.2)
      followerPos.current.x = lerp(followerPos.current.x, mousePos.current.x, 0.08)
      followerPos.current.y = lerp(followerPos.current.y, mousePos.current.y, 0.08)
      trailPos.current.x = lerp(trailPos.current.x, mousePos.current.x, 0.04)
      trailPos.current.y = lerp(trailPos.current.y, mousePos.current.y, 0.04)

      dotRef.current?.style.setProperty(
        'transform',
        `translate(${dotPos.current.x}px, ${dotPos.current.y}px)`,
      )
      followerRef.current?.style.setProperty(
        'transform',
        `translate(${followerPos.current.x}px, ${followerPos.current.y}px)`,
      )
      trailRef.current?.style.setProperty(
        'transform',
        `translate(${trailPos.current.x}px, ${trailPos.current.y}px)`,
      )
      rafId.current = requestAnimationFrame(animate)
    }

    const deactivate = () => {
      isActive.current = false
      document.documentElement.classList.remove(ACTIVE_CLASS)
      setLayersVisible(false)
      applyHoverStyles(false)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      rafId.current = null
    }

    const activate = (position: Position) => {
      if (!mediaQuery.matches || document.visibilityState !== 'visible') {
        deactivate()
        return
      }
      if (!isActive.current) {
        positionLayersImmediately(position)
        isActive.current = true
        setLayersVisible(true)
        document.documentElement.classList.add(ACTIVE_CLASS)
        rafId.current = requestAnimationFrame(animate)
      } else {
        mousePos.current = position
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return
      activate({ x: event.clientX, y: event.clientY })
    }

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target
      applyHoverStyles(target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTORS)))
    }

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        deactivate()
        return
      }
      const relatedTarget = event.relatedTarget
      applyHoverStyles(
        relatedTarget instanceof Element && Boolean(relatedTarget.closest(INTERACTIVE_SELECTORS)),
      )
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') deactivate()
    }

    const onMediaChange = () => deactivate()

    setLayersVisible(false)
    globalThis.window.addEventListener('pointermove', onPointerMove, { passive: true })
    globalThis.window.addEventListener('pointerout', onPointerOut, { passive: true })
    globalThis.window.addEventListener('pointercancel', deactivate)
    globalThis.window.addEventListener('blur', deactivate)
    globalThis.window.addEventListener('focus', deactivate)
    globalThis.window.addEventListener('pagehide', deactivate)
    globalThis.window.addEventListener('pageshow', deactivate)
    document.addEventListener('pointerover', onPointerOver, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    mediaQuery.addEventListener('change', onMediaChange)

    return () => {
      deactivate()
      globalThis.window.removeEventListener('pointermove', onPointerMove)
      globalThis.window.removeEventListener('pointerout', onPointerOut)
      globalThis.window.removeEventListener('pointercancel', deactivate)
      globalThis.window.removeEventListener('blur', deactivate)
      globalThis.window.removeEventListener('focus', deactivate)
      globalThis.window.removeEventListener('pagehide', deactivate)
      globalThis.window.removeEventListener('pageshow', deactivate)
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      mediaQuery.removeEventListener('change', onMediaChange)
    }
  }, [])

  const transition = [
    'width 0.3s cubic-bezier(0.22,1,0.36,1)',
    'height 0.3s cubic-bezier(0.22,1,0.36,1)',
    'margin 0.3s cubic-bezier(0.22,1,0.36,1)',
    'background 0.3s cubic-bezier(0.22,1,0.36,1)',
    'border-color 0.3s cubic-bezier(0.22,1,0.36,1)',
    'opacity 0.12s ease-out',
  ].join(', ')

  return (
    <div aria-hidden="true" data-testid="custom-cursor">
      <div
        ref={dotRef}
        data-opacity="1"
        style={{
          position: 'fixed', top: 0, left: 0, width: 8, height: 8,
          marginLeft: -4, marginTop: -4, borderRadius: '50%', background: '#fff',
          mixBlendMode: 'difference', zIndex: 10000, pointerEvents: 'none', opacity: 0,
          transition, willChange: 'transform',
        }}
      />
      <div
        ref={followerRef}
        data-opacity="1"
        style={{
          position: 'fixed', top: 0, left: 0, width: 40, height: 40,
          marginLeft: -20, marginTop: -20, borderRadius: '50%',
          border: '1.5px solid rgba(124,92,252,0.5)', background: 'transparent',
          zIndex: 10000, pointerEvents: 'none', opacity: 0, transition,
          willChange: 'transform',
        }}
      />
      <div
        ref={trailRef}
        data-opacity="0.6"
        style={{
          position: 'fixed', top: 0, left: 0, width: 4, height: 4,
          marginLeft: -2, marginTop: -2, borderRadius: '50%',
          background: '#7c5cfc', opacity: 0, zIndex: 10000,
          pointerEvents: 'none', willChange: 'transform',
          transition: 'opacity 0.12s ease-out',
        }}
      />
    </div>
  )
}
