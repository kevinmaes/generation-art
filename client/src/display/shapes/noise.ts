import { mulberry32 } from './prng';

/**
 * Simple seeded 1D Perlin-like noise
 * - Gradients on integer lattice, smoothstep interpolation
 * - Deterministic per seed
 */
export function createNoise1D(seed: number): (x: number) => number {
  const rand = mulberry32(seed);
  // Precompute gradients for 2048 entries
  const size = 2048;
  const mask = size - 1;
  const grads = new Float32Array(size);
  for (let i = 0; i < size; i++) grads[i] = rand() * 2 - 1; // [-1,1]

  function gradAt(i: number): number {
    return grads[i & mask];
  }

  function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  return function (x: number): number {
    const xi = Math.floor(x);
    const xf = x - xi;
    const g0 = gradAt(xi);
    const g1 = gradAt(xi + 1);
    const v0 = g0 * xf;
    const v1 = g1 * (xf - 1);
    const u = smoothstep(xf);
    return v0 * (1 - u) + v1 * u; // roughly in [-1,1]
  };
}