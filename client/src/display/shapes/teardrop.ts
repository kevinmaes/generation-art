import type { ShapeGenerator } from '../../../../shared/types';

/**
 * Teardrop generator (asymmetric tapered ellipse)
 * Params (optional):
 * - tipSharpness: 0..1 (default 0.7) bigger = sharper tip
 * - curvatureBias: 0..1 (default 0.5) controls taper falloff
 * - asymmetry: -1..1 (default 0.15) horizontal skew
 */
export const teardropGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const p = profile.params ?? {};
  const tipSharpness = Math.max(
    0,
    Math.min(1, Number(p['tipSharpness'] ?? 0.7)),
  );
  const curvatureBias = Math.max(
    0,
    Math.min(1, Number(p['curvatureBias'] ?? 0.5)),
  );
  const asymmetry = Math.max(-1, Math.min(1, Number(p['asymmetry'] ?? 0.15)));

  const maxVerts = profile.detail?.maxVertices ?? 256;
  const steps = Math.max(48, Math.min(maxVerts, 1024));
  const pts = new Float32Array(steps * 2);

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2; // angle
    const cx = Math.cos(t);
    const sy = Math.sin(t);
    // Taper function: strongest at top (sy=-1), weakest at bottom (sy=+1)
    const u = (sy + 1) * 0.5; // 0 at top, 1 at bottom
    const taper = 1 - tipSharpness * Math.pow(1 - u, 1 + curvatureBias * 2);
    // Horizontal skew proportional to sin
    const skew = asymmetry * sy;

    const x = rx * taper * cx + skew * rx * 0.1;
    const y = ry * taper * sy;
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
  }

  return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};
