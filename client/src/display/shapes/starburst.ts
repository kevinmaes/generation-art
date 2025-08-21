import type { ShapeGenerator } from '../../../../shared/types';

/**
 * Starburst/Flower generator via sinusoidal radial modulation
 * Params:
 * - lobes: integer >= 3 (default 8)
 * - lobeAmp: 0..1 (default 0.35) amplitude of spikes
 * - tipRoundness: 0..1 (default 0.4) reduces sharpness (applied as power)
 * - irregularity: 0..1 (default 0) adds slight phase jitter
 */
export const starburstGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const p = profile.params ?? {};
  const lobes = Math.max(3, Math.floor(Number(p['lobes'] ?? 8)));
  const amp = Math.max(0, Math.min(1, Number(p['lobeAmp'] ?? 0.35)));
  const tipRound = Math.max(0, Math.min(1, Number(p['tipRoundness'] ?? 0.4)));
  const irregularity = Math.max(0, Math.min(1, Number(p['irregularity'] ?? 0)));

  const maxVerts = profile.detail?.maxVertices ?? Math.max(64, lobes * 8);
  const steps = Math.max(48, Math.min(maxVerts, 2048));
  const pts = new Float32Array(steps * 2);

  const phaseJitter = irregularity * 0.5;

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const phase = t * lobes + phaseJitter * Math.sin(7 * t);
    const s = Math.sin(phase);
    let r = 1 + amp * s; // base sinusoidal radius
    if (tipRound > 0) {
      const k = 1 + tipRound * 4;
      r = Math.sign(r) * Math.pow(Math.abs(r), 1 / k);
    }
    const x = rx * r * Math.cos(t);
    const y = ry * r * Math.sin(t);
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
  }

  return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};
