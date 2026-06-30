import * as React from 'react'
import { cn } from './utils'

/**
 * Glassmorphism card styles matching the SassBlum dark theme.
 * Used across all dashboards to maintain visual consistency
 * with the public pages (dark navy + teal accents + blur).
 */
const GLASS_STYLE: React.CSSProperties = {
  background: 'rgba(8,22,36,0.82)',
  border: '1px solid rgba(0,196,224,0.14)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
}

interface DashboardCardProps extends React.ComponentProps<'div'> {
  /** Extra inline styles merged with the glassmorphism base. */
  glassStyle?: React.CSSProperties
}

/**
 * DashboardCard — drop-in replacement for `<Card>` inside dashboard pages.
 *
 * Applies the SassBlum glassmorphism treatment (translucent dark background,
 * teal border, heavy blur, deep shadow) so that the Three.js particle
 * background shows through.
 */
export function DashboardCard({ className, glassStyle, style, children, ...props }: Readonly<DashboardCardProps>) {
  return (
    <div
      className={cn('flex flex-col gap-6 rounded-xl text-[#eef4f8]', className)}
      style={{ ...GLASS_STYLE, ...glassStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

/** Header inside a DashboardCard. */
export function DashboardCardHeader({ className, ...props }: Readonly<React.ComponentProps<'div'>>) {
  return (
    <div
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6',
        className,
      )}
      {...props}
    />
  )
}

/** Title inside a DashboardCard header. */
export function DashboardCardTitle({ className, ...props }: Readonly<React.ComponentProps<'h3'>>) {
  return <h3 className={cn('leading-none font-semibold text-[#eef4f8]', className)} {...props} />
}

/** Description inside a DashboardCard header. */
export function DashboardCardDescription({ className, ...props }: Readonly<React.ComponentProps<'p'>>) {
  return <p className={cn('text-[#5c7a94]', className)} {...props} />
}

/** Content area inside a DashboardCard. */
export function DashboardCardContent({ className, ...props }: Readonly<React.ComponentProps<'div'>>) {
  return <div className={cn('px-6 [&:last-child]:pb-6', className)} {...props} />
}
