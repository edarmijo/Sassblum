import { MEDIA_VARIANTS, type MediaVariant } from '../../generated/mediaManifest'

const SUPABASE_PUBLIC_OBJECT_PATH = '/storage/v1/object/public/'
const SUPABASE_PUBLIC_RENDER_PATH = '/storage/v1/render/image/public/'

/** Returns a responsive Supabase render URL, or the original URL for other hosts. */
export function getOptimizedImageUrl(src: string, width: number, quality = 76): string {
  if (!src.includes(SUPABASE_PUBLIC_OBJECT_PATH)) return src

  try {
    const url = new URL(src)
    url.pathname = url.pathname.replace(SUPABASE_PUBLIC_OBJECT_PATH, SUPABASE_PUBLIC_RENDER_PATH)
    url.searchParams.set('width', String(width))
    url.searchParams.set('quality', String(quality))
    url.searchParams.set('resize', 'cover')
    return url.toString()
  } catch {
    return src
  }
}

/** Exact URL lookup prevents stale local media after an administrator uploads a replacement. */
export function getLocalMediaVariant(src: string): MediaVariant | undefined {
  return MEDIA_VARIANTS[src]
}
