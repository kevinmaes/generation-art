/**
 * Supershape (superformula) generator
 * r(θ) = [ |cos(m θ / 4)/a|^n2 + |sin(m θ / 4)/b|^n3 ]^(-1/n1)
 * Params: m, n1, n2, n3, a, b
 */
import type { ShapeGenerator } from '../../../../shared/types';

export const supershapeGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const p = profile.params ?? {};
  const m = Number(p['m'] ?? 4);
  const n1 = Number(p['n1'] ?? 0.2);
  const n2 = Number(p['n2'] ?? 1.7);
  const n3 = Number(p['n3'] ?? 1.7);
  const a = Number(p['a'] ?? 1);
  const b = Number(p['b'] ?? 1);

  const maxVerts = profile.detail?.maxVertices ?? 256;
  const steps = Math.max(48, Math.min(maxVerts, 1024));
  const pts = new Float32Array(steps * 2);

  // Avoid division by zero in formula
  const eps = 1e-6;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const t2 = (m * t) / 4;
    const ct = Math.cos(t2);
    const st = Math.sin(t2);
    const term1 = Math.pow(Math.abs(ct / (a || eps)), n2 || eps);
    const term2 = Math.pow(Math.abs(st / (b || eps)), n3 || eps);
    const denom = Math.pow(term1 + term2, 1 / (n1 || eps));
    const r = denom > eps ? 1 / denom : 0;

    // Scale r into ellipse
    const x = rx * r * Math.cos(t);
    const y = ry * r * Math.sin(t);
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
  }

  return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};
