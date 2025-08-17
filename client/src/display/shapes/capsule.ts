import type { ShapeGenerator } from '../../../../shared/types';

/**
 * Capsule (stadium) generator: rectangle with semicircular caps on the long axis
 */
export const capsuleGenerator: ShapeGenerator = (profile) => {
  const { width, height } = profile.size;
  const rx = width / 2;
  const ry = height / 2;
  const maxVerts = profile.detail?.maxVertices ?? 256;
  const stepsArc = Math.max(12, Math.min(Math.floor(maxVerts / 4), 128));

  const pts: number[] = [];

  if (width >= height) {
    // Horizontal capsule
    const r = ry; // cap radius
    const cxL = -rx + r;
    const cxR = rx - r;
    const cy = 0;

    // Right cap: θ from -π/2 → +π/2 (bottom → top)
    for (let i = 0; i <= stepsArc; i++) {
      const t = -Math.PI / 2 + (i / stepsArc) * Math.PI;
      const x = cxR + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      pts.push(x, y);
    }
    // Top edge: right → left
    for (let i = 1; i <= stepsArc; i++) {
      const u = i / stepsArc;
      const x = cxR - u * (cxR - cxL);
      const y = cy + r;
      pts.push(x, y);
    }
    // Left cap: θ from +π/2 → -π/2 (top → bottom)
    for (let i = 0; i <= stepsArc; i++) {
      const t = Math.PI / 2 - (i / stepsArc) * Math.PI;
      const x = cxL + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      pts.push(x, y);
    }
    // Bottom edge: left → right
    for (let i = 1; i <= stepsArc; i++) {
      const u = i / stepsArc;
      const x = cxL + u * (cxR - cxL);
      const y = cy - r;
      pts.push(x, y);
    }
  } else {
    // Vertical capsule
    const r = rx; // cap radius
    const cyT = -ry + r;
    const cyB = ry - r;
    const cx = 0;

    // Top cap: θ from π → 0 (left → right along top arc)
    for (let i = 0; i <= stepsArc; i++) {
      const t = Math.PI - (i / stepsArc) * Math.PI;
      const x = cx + r * Math.cos(t);
      const y = cyT + r * Math.sin(t);
      pts.push(x, y);
    }
    // Right edge: top → bottom
    for (let i = 1; i <= stepsArc; i++) {
      const u = i / stepsArc;
      const x = cx + r;
      const y = cyT + u * (cyB - cyT);
      pts.push(x, y);
    }
    // Bottom cap: θ from 0 → π (right → left along bottom arc)
    for (let i = 0; i <= stepsArc; i++) {
      const t = (i / stepsArc) * Math.PI;
      const x = cx + r * Math.cos(t);
      const y = cyB + r * Math.sin(t);
      pts.push(x, y);
    }
    // Left edge: bottom → top
    for (let i = 1; i <= stepsArc; i++) {
      const u = i / stepsArc;
      const x = cx - r;
      const y = cyB - u * (cyB - cyT);
      pts.push(x, y);
    }
  }

  return {
    polygon: new Float32Array(pts),
    bounds: { x: -rx, y: -ry, w: width, h: height },
  };
};
