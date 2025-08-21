import type { ShapeGenerator } from '../../../../shared/types';
import { mulberry32 } from './prng';

/**
 * Regular polygon generator with optional radial jitter
 * Params:
 * - sides: integer >= 3 (default 5)
 * - jitter: 0..1 (default 0) radial jitter fraction
 */
export const polygonGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const p = profile.params ?? {};
  const sides = Math.max(3, Math.floor(Number(p['sides'] ?? 5)));
  const jitter = Math.max(0, Math.min(1, Number(p['jitter'] ?? 0)));

  const maxVerts = profile.detail?.maxVertices ?? sides;
  const steps = Math.min(Math.max(sides, 3), Math.max(3, maxVerts));

  const rand = mulberry32((profile.seed ?? 1) >>> 0);
  const pts = new Float32Array(steps * 2);

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const j = 1 - jitter * rand(); // inward jitter
    const x = rx * j * Math.cos(t);
    const y = ry * j * Math.sin(t);
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
  }

  return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};
