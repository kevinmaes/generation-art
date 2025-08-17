import type { ShapeGenerator } from '../../../../shared/types';

/**
 * Squircle (superellipse) generator: |x/a|^p + |y/b|^p = 1
 * Params: exponent p (>=2)
 */
export const squircleGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const p = Number(profile.params?.['exponent'] ?? 4);

  const maxVerts = profile.detail?.maxVertices ?? 256;
  const steps = Math.max(48, Math.min(maxVerts, 1024));
  const pts = new Float32Array(steps * 2);

  const a = rx;
  const b = ry;
  const n = p;

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * a;
    const y = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * b;
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
  }

  return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};
