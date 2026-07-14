/**
 * Random helpers backed by the Web Crypto API.
 * Se usan para efectos visuales (partículas, loaders); la fuente criptográfica
 * no cuesta nada a este volumen de llamadas y evita PRNGs débiles en el bundle.
 */

const UINT32_RANGE = 2 ** 32

/** Float en [0, 1) — reemplazo directo de Math.random(). */
export function secureRandom(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / UINT32_RANGE
}

/** Entero en [min, max] inclusive. */
export function secureRandomInt(min: number, max: number): number {
  return min + Math.floor(secureRandom() * (max - min + 1))
}
