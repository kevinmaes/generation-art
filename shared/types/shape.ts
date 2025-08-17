/**
 * Shape geometry public API
 *
 * Why this exists:
 * - Deterministic, reproducible, and cacheable shapes for nodes (and later, edges).
 * - Unifies simple and complex silhouettes under a single data model that the renderer can consume.
 * - Decouples authoring (transformers choose a shape profile) from drawing (renderer draws geometry).
 *
 * How it is used:
 * - A transformer assigns a `ShapeProfile` to a node's visual metadata.
 * - The renderer resolves the `ShapeProfile` via a registered generator into a `ShapeGeometry`.
 * - The renderer can cache the `ShapeGeometry` by a key derived from the profile for efficient redraws.
 */

/**
 * Identifier for a family of shapes. Each kind maps to a registered generator.
 */
export type ShapeKind =
  | 'circle'
  | 'blob'
  | 'teardrop'
  | 'starburst'
  | 'supershape'
  | 'particleCluster'
  | 'capsule'
  | 'squircle'
  | 'polygon';

/**
 * Declarative description of a shape instance. This is the contract that
 * transformers author and the renderer resolves into concrete geometry.
 *
 * Determinism & reproducibility:
 * - Provide a numeric `seed` so generators can produce stable, per-node results.
 * - The same `ShapeProfile` (same kind/size/params/seed) should always resolve to the same geometry.
 *
 * Cacheability:
 * - The profile is serializable; renderers can hash/serialize it to cache geometry across frames.
 */
export interface ShapeProfile {
  /** Shape family identifier (e.g., 'circle', 'blob'). */
  kind: ShapeKind;
  /** Intended bounding box in local coordinates (centered at 0,0). */
  size: { width: number; height: number };
  /** Optional deterministic seed for stable, unique instances. */
  seed?: number;
  /** Optional kind-specific parameters (amplitudes, exponents, counts, etc.). */
  params?: Record<string, number | number[] | boolean | string>;
  /**
   * Level-of-detail hints for generators/resolvers.
   * - maxVertices: cap polygon resolution
   * - tolerance: simplification tolerance in device pixels (renderer-dependent)
   */
  detail?: { maxVertices?: number; tolerance?: number };
}

/**
 * Ready-to-draw geometry in local coordinates. Render engines consume this to
 * fill/stroke the outline, triangulate for GPU, and perform hit tests.
 */
export interface ShapeGeometry {
  /** Closed polygon outline [x0, y0, x1, y1, ...]; last segment closes implicitly. */
  polygon: Float32Array;
  /** Axis-aligned bounds for quick culling/hit-testing. */
  bounds: { x: number; y: number; w: number; h: number };
}

/**
 * A pure function that converts a `ShapeProfile` into `ShapeGeometry`.
 *
 * Requirements:
 * - Must be deterministic for a given profile (incl. seed) to ensure reproducibility.
 * - Should respect `detail` to control output complexity.
 */
export type ShapeGenerator = (profile: ShapeProfile) => ShapeGeometry;
