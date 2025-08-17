import type { ShapeGenerator } from '../../../../shared/types';
import { createNoise1D } from './noise';
import { hash2 } from './prng';

/**
 * Blob (organic) shape generator
 * Params:
 * - noiseAmp: 0..1 fraction of radius displacement (default 0.15)
 * - noiseFreq: cycles around the shape (default 2.0)
 * - octaves: integer 1..4 (default 3)
 * - smooth: 0..1 blending between octaves (default 0.5)
 */
export const blobGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const params = profile.params ?? {};
  const amp = Math.max(0, Math.min(1, Number(params['noiseAmp'] ?? 0.15)));
  const freq = Number(params['noiseFreq'] ?? 2.0);
  const octaves = Math.max(1, Math.min(6, Math.floor(Number(params['octaves'] ?? 3))));
  const smooth = Math.max(0, Math.min(1, Number(params['smooth'] ?? 0.5)));

  const baseSeed = (profile.seed ?? 1) >>> 0;
  // Create octave noise functions with distinct seeds
  const noises = Array.from({ length: octaves }, (_, i) =>
    createNoise1D(hash2(baseSeed, i + 1)),
  );

  const maxVerts = profile.detail?.maxVertices ?? 256;
  const steps = Math.max(48, Math.min(maxVerts, 1024));
  const pts = new Float32Array(steps * 2);

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2; // angle
    // Multi-octave noise over angle domain (wrap by using frequency)
    let n = 0;
    let denom = 0;
    let amplitude = 1;
    let f = freq;
    for (let o = 0; o < octaves; o++) {
      n += noises[o](t * f) * amplitude;
      denom += amplitude;
      amplitude *= smooth; // decay amplitude
      f *= 2; // double frequency per octave
    }
    n = denom > 0 ? n / denom : n;

    // Displace radius by noise
    const rScale = 1 + amp * n;
    const x = Math.cos(t) * rx * rScale;
    const y = Math.sin(t) * ry * rScale;
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
  }

  // Bounds are conservative (may exceed slightly due to noise); keep axis-aligned ellipse bb
  return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};