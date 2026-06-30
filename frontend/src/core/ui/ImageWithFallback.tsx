import { useState } from 'react'

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%230a1628"/><text x="50%25" y="50%25" fill="%2300d4ff" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">SASS BLUM</text></svg>'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  fallbackSrc?: string
}

/** <img> that swaps to a branded placeholder if the source fails to load. */
export function ImageWithFallback({ src, fallbackSrc = FALLBACK, alt = '', ...props }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false)
  return (
    <img
      src={errored || !src ? fallbackSrc : src}
      alt={alt}
      onError={() => setErrored(true)}
      {...props}
    />
  )
}
