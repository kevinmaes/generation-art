import type { ShapeGeometry, ShapeProfile } from '../../../../shared/types';
import { registerShapeGenerator, ensureShapeGenerator } from './registry';
import { circleGenerator } from './circle';
import { blobGenerator } from './blob';
import { supershapeGenerator } from './supershape';
import { teardropGenerator } from './teardrop';

/**
 * Built-in registrations. Additional generators can be registered elsewhere
 * during app initialization.
 */
// Register built-in generators
registerShapeGenerator('circle', circleGenerator);
registerShapeGenerator('blob', blobGenerator);
registerShapeGenerator('supershape', supershapeGenerator);
registerShapeGenerator('teardrop', teardropGenerator);

/**
 * Cache of resolved geometries keyed by a serialized profile.
 *
 * Why: Many nodes reuse the same profile (or only differ by seed). Since
 * geometry generation can be non-trivial, we memoize results for faster redraw.
 */
const geometryCache = new Map<string, ShapeGeometry>();

/**
 * Derive a stable cache key from a profile. The profile should be treated as a
 * value object; JSON.stringify is sufficient when property order is stable.
 */
function profileCacheKey(profile: ShapeProfile): string {
  // Note: For determinism, callers should provide stable ordering of params
  return JSON.stringify(profile);
}

/**
 * Resolve a `ShapeProfile` into `ShapeGeometry` using the registered generator.
 * Results are cached by profile to ensure repeatability and performance.
 */
export function resolveShapeGeometry(profile: ShapeProfile): ShapeGeometry {
  const key = profileCacheKey(profile);
  const cached = geometryCache.get(key);
  if (cached) return cached;
  const generator = ensureShapeGenerator(profile.kind);
  const geometry = generator(profile);
  geometryCache.set(key, geometry);
  return geometry;
}
