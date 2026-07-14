import { useState, useCallback, type MouseEvent, type ComponentProps } from 'react'
import { Button } from './button'

type RippleButtonProps = ComponentProps<typeof Button>

type Ripple = { x: number; y: number; id: number }

/**
 * Botón con efecto ripple (onda expansiva) al hacer click.
 * Cada ripple se auto-destruye después de 600ms.
 * Usa solo CSS animation para el efecto (GPU-friendly).
 */
export function RippleButton({ children, className, onClick, ...props }: Readonly<RippleButtonProps>) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const filterRipple = useCallback((id: number) => (prev: Ripple[]) => prev.filter((r) => r.id !== id), [])

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])

    setTimeout(() => setRipples(filterRipple(id)), 600)

    // Call original onClick if provided
    onClick?.(e as MouseEvent<HTMLButtonElement> & { nativeEvent: MouseEvent })
  }, [onClick, filterRipple])

  return (
    <Button className={`relative overflow-hidden ${className ?? ''}`} onClick={handleClick} {...props}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
            animation: 'ripple 0.6s ease-out forwards',
          }}
        />
      ))}
    </Button>
  )
}
