import CustomCursor from './CustomCursor'
import { MouseGradient } from './MouseGradient'
import { ThreeBackground } from './ThreeBackground'

/** Optional desktop visual layer, split away from the critical application shell. */
export function VisualEffects() {
  return (
    <>
      <CustomCursor />
      <ThreeBackground />
      <MouseGradient />
    </>
  )
}
