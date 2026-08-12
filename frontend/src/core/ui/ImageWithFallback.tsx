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
  let optimizedSrc = src
  if (localVariant) {
    optimizedSrc = localVariant.src
  } else if (src && optimizedWidth && optimizationEnabled) {
    optimizedSrc = getOptimizedImageUrl(src, optimizedWidth)
  }
  const hasOptimizedVariant = Boolean(src && optimizedSrc && optimizedSrc !== src)
  let responsiveSrcSet = srcSet
  if (localVariant) {
    responsiveSrcSet = localVariant.srcSet
  } else if (hasOptimizedVariant && src) {
    responsiveSrcSet = [320, 640, 960]
      .map((width) => `${getOptimizedImageUrl(src, width)} ${width}w`)
      .join(', ')
  }

  let displayedSrc = optimizedSrc
  if (errored || !src) {
    displayedSrc = fallbackSrc
  } else if (useOriginal) {
    displayedSrc = src
  }

  useEffect(() => {
    setErrored(false)
    setUseOriginal(false)
  }, [src])

  return (
    <img
      src={displayedSrc}
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
