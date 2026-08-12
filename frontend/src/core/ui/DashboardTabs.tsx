import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from './utils'

/**
 * DashboardTabs — dark glassmorphism-themed tab primitives.
 *
 * Drop-in replacements for the default light-themed Tabs components.
 * Match the SassBlum dark navy palette with teal accents so tabs
 * blend seamlessly over the Three.js particle background.
 */

function DashboardTabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function DashboardTabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex min-h-11 max-w-full w-fit items-center justify-start overflow-x-auto rounded-xl p-1 gap-1 flex-nowrap',
        className,
      )}
      style={{
        background: 'rgba(8,22,36,0.92)',
        border: '1px solid rgba(0,196,224,0.12)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      {...props}
    />
  )
}

function DashboardTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200',
        'text-[#7aa3b8] hover:text-[#eef4f8]',
        'data-[state=active]:text-[#eef4f8] data-[state=active]:shadow-sm',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      style={{
        // Active state styles are handled via data attribute below
      }}
      // We use a wrapper to apply active bg since Tailwind data attributes
      // can't set CSS custom properties easily for glassmorphism
      {...props}
    />
  )
}

// CSS for the active trigger state — injected once
const activeTabCss = `
  [data-slot="tabs-trigger"][data-state="active"] {
    background: rgba(0,196,224,0.15) !important;
    border: 1px solid rgba(0,196,224,0.25);
    box-shadow: 0 0 12px rgba(0,196,224,0.15);
  }
`

function DashboardTabsStyle() {
  return <style>{activeTabCss}</style>
}

function DashboardTabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export {
  DashboardTabs,
  DashboardTabsList,
  DashboardTabsTrigger,
  DashboardTabsContent,
  DashboardTabsStyle,
}
