/**
 * Tiny deterministic PRNG (mulberry32)
 * Returns a function that yields floats in [0,1).
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a pair of 32-bit integers into a single 32-bit seed (for octave streams).
 */
export function hash2(a: number, b: number): number {
  let h = 2166136261 >>> 0;
  h ^= a >>> 0;
  h = Math.imul(h, 16777619);
  h ^= b >>> 0;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}
