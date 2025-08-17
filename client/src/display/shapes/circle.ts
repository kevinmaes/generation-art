import type { ShapeGenerator } from '../../../../shared/types';

export const circleGenerator: ShapeGenerator = (profile) => {
	const { width, height } = profile.size;
	const rx = width / 2;
	const ry = height / 2;
	const maxVerts = profile.detail?.maxVertices ?? 128;
	const steps = Math.max(24, Math.min(maxVerts, 512));
	const pts = new Float32Array(steps * 2);
	for (let i = 0; i < steps; i++) {
		const t = (i / steps) * Math.PI * 2;
		pts[i * 2] = Math.cos(t) * rx;
		pts[i * 2 + 1] = Math.sin(t) * ry;
	}
	return { polygon: pts, bounds: { x: -rx, y: -ry, w: width, h: height } };
};