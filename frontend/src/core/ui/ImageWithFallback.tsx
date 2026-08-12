import { useEffect, useState } from 'react'
import { getLocalMediaVariant, getOptimizedImageUrl } from '../utils/image'

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%230a1628"/><text x="50%25" y="50%25" fill="%2300d4ff" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">SASS BLUM</text></svg>'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  fallbackSrc?: string
  optimizedWidth?: number
  optimizationEnabled?: boolean
}

/** <img> that swaps to a branded placeholder if the source fails to load. */
export function ImageWithFallback({
  src,
  fallbackSrc = FALLBACK,
  optimizedWidth,
  optimizationEnabled = false,
  sizes,
  srcSet,
  onError,
  alt = '',
  ...props
}: Readonly<ImageWithFallbackProps>) {
  const [errored, setErrored] = useState(false)
  const [useOriginal, setUseOriginal] = useState(false)
  const localVariant = src ? getLocalMediaVariant(src) : undefined
  const optimizedSrc = localVariant?.src ?? (
    src && optimizedWidth && optimizationEnabled
      ? getOptimizedImageUrl(src, optimizedWidth)
      : src
  )
  const hasOptimizedVariant = Boolean(src && optimizedSrc && optimizedSrc !== src)
  const responsiveSrcSet = localVariant?.srcSet ?? (
    hasOptimizedVariant && src
      ? [320, 640, 960]
        .map((width) => `${getOptimizedImageUrl(src, width)} ${width}w`)
        .join(', ')
      : srcSet
  )

  useEffect(() => {
    setErrored(false)
    setUseOriginal(false)
  }, [src])

  return (
    <img
      src={errored || !src ? fallbackSrc : useOriginal ? src : optimizedSrc}
      srcSet={!errored && !useOriginal ? responsiveSrcSet : undefined}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        if (hasOptimizedVariant && !useOriginal) {
          setUseOriginal(true)
          return
        }
        setErrored(true)
        onError?.(event)
      }}
      {...props}
    />
  )
}
