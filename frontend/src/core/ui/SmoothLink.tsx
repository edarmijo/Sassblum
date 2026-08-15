import { Link, type LinkProps } from 'react-router-dom'

/** Internal navigation with a native cross-fade when the browser supports it. */
export function SmoothLink({ viewTransition, ...props }: Readonly<LinkProps>) {
  return <Link {...props} viewTransition={viewTransition ?? true} />
}
