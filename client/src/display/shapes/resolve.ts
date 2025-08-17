import type { ShapeGeometry, ShapeProfile } from '../../../../shared/types';
import { registerShapeGenerator, ensureShapeGenerator } from './registry';
import { circleGenerator } from './circle';

// Register built-in generators
registerShapeGenerator('circle', circleGenerator);

// Simple cache keyed by JSON string of the profile
const geometryCache = new Map<string, ShapeGeometry>();

function profileCacheKey(profile: ShapeProfile): string {
	// Note: For determinism, callers should provide stable ordering of params
	return JSON.stringify(profile);
}

export function resolveShapeGeometry(profile: ShapeProfile): ShapeGeometry {
	const key = profileCacheKey(profile);
	const cached = geometryCache.get(key);
	if (cached) return cached;
	const generator = ensureShapeGenerator(profile.kind);
	const geometry = generator(profile);
	geometryCache.set(key, geometry);
	return geometry;
}