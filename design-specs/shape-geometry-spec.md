### Shape Geometry Specification (v0)

This document defines how nodes get their visual “shape” using a flexible, generator-based geometry system. The default remains a simple circle, but any node may opt into richer, organic shapes via a `ShapeProfile` that produces a normalized `ShapeGeometry` the renderer can draw.

---

## Goals
- Provide expressive, artful node silhouettes beyond basic primitives.
- Keep rendering straightforward by normalizing all shapes into geometry.
- Deterministic uniqueness via seeds; consistent results across zoom via LOD.
- Be renderer-agnostic (Canvas2D, SVG, WebGL/WebGPU) and data-driven.

## Non-goals (v0)
- Layered textures, blend modes, masks. These will be specified separately.
- Complex edge styling. This spec focuses on node shapes only.

---

## Core concepts
- Shape Profile: a compact, serializable description of a shape family and its parameters.
- Shape Generator: a pure function that maps a `ShapeProfile` to a `ShapeGeometry`.
- Shape Geometry: the ready-to-draw outline and metadata (bounds, optional path) in local coords.
- Registry: a pluggable lookup from `kind` → shape generator.

Conventions:
- Local coordinates are centered at the origin (0, 0).
- `size.width` × `size.height` denotes the intended bounding box of the silhouette before rotation.
- Rotation is applied at render time unless a generator bakes it in intentionally.

---

## TypeScript API (reference)

```ts
export type ShapeKind =
  | 'circle'
  | 'blob'
  | 'teardrop'
  | 'starburst'
  | 'supershape'
  | 'particleCluster'
  | 'capsule'
  | 'squircle'
  | 'polygon'; // convenience for regular/irregular polygons

export interface ShapeProfile {
  kind: ShapeKind;
  size: { width: number; height: number }; // bb in local coords
  rotation?: number; // radians, applied by renderer (default 0)
  seed?: number; // deterministic uniqueness
  params?: Record<string, number | number[] | boolean | string>; // kind-specific controls
  detail?: { maxVertices?: number; tolerance?: number }; // LOD hints
}

export interface ShapeGeometry {
  // Closed polygon outline in local coords, starting at any point, non-self-intersecting
  polygon: Float32Array; // [x0, y0, x1, y1, ...] with last segment implicitly closing
  bounds: { x: number; y: number; w: number; h: number }; // axis-aligned bb in local coords
  // Optional extras the renderer may use, but not required
  pathCommands?: Array<{ cmd: 'M' | 'L' | 'Q' | 'C' | 'Z'; data: number[] }>; // for SVG/Canvas
  triangles?: Uint32Array; // optional triangulation indices (earcut-style) for WebGL
  anchors?: {
    // Intersection of a ray AB with the outline; null if no hit
    intersection?: (
      a: { x: number; y: number },
      b: { x: number; y: number }
    ) => { x: number; y: number } | null;
    // Point slightly outside along the normal at angle theta (radians)
    outwardAtAngle?: (theta: number, distance?: number) => { x: number; y: number };
  };
}

export type ShapeGenerator = (profile: ShapeProfile) => ShapeGeometry;

export interface ShapeRegistry {
  register(kind: ShapeKind, gen: ShapeGenerator): void;
  get(kind: ShapeKind): ShapeGenerator | undefined;
}
```

Notes:
- `detail.maxVertices` caps polygon vertices. `detail.tolerance` (in px at current zoom) guides simplification.
- `triangles` is optional: generators may output only the outline; the renderer can triangulate and cache on demand.

---

## Default behavior
- If no shape is specified for a node, render a circle with diameter = `min(width, height)` and use the node’s size for its bounds.
- The circle is implemented as a normal shape kind (`'circle'`) so it fits the same pipeline.

Example default resolution:
```ts
const defaultShape: ShapeProfile = {
  kind: 'circle',
  size: { width: node.width, height: node.height }
};
```

---

## Shape families (MVP)

Each generator should accept the parameters below (through `profile.params`) and honor `size`, `seed`, and `detail`.

- Blob (organic/amoeba)
  - Base: sample an ellipse radially; displace radius by multi-octave noise.
  - Params: `noiseAmp` (0..1), `noiseFreq` (cycles around), `octaves` (1..4), `smooth` (0..1), `anisotropy` (0..1).

- Teardrop / Leaf / Plectrum
  - Base: superellipse blended to a tapered pole; or cubic Bézier skeleton.
  - Params: `tipSharpness` (0..1), `asymmetry` (-1..1), `curvatureBias` (0..1), `tipOffset` (px).

- Starburst / Flower
  - Base: sinusoidal radial function r(θ) = R × [1 + A × sin(kθ + φ)] with tip rounding.
  - Params: `lobes` (int ≥ 3), `lobeAmp` (0..1), `tipRoundness` (0..1), `irregularity` (0..1), `phase` (rad).

- Supershape (superformula)
  - Base: superformula with parameters spanning circles, stars, squarish forms.
  - Params: `m`, `n1`, `n2`, `n3`, `a`, `b` (numbers), optional `phase`.

- Particle Cluster (aggregate silhouette)
  - Base: Poisson-disk sample points, compute a concave hull/alpha shape, then smooth (Chaikin or Catmull-Rom).
  - Params: `pointCount`, `radius` (min distance), `alpha` (0..1 concavity), `smoothing` (0..1).

- Capsule
  - Base: rounded rectangle with max corner radius (stadium) or segment with circular caps.
  - Params: `cornerRadius` (px) or implicit from `min(width, height)/2`, optional `capBias`.

- Squircle (superellipse)
  - Base: |x/a|^p + |y/b|^p = 1.
  - Params: `exponent` p (≥ 2), optionally `cornerBias`.

- Polygon (convenience)
  - Base: regular or irregular polygon.
  - Params: `sides` (int ≥ 3), optional `jitter` (0..1), `radiusBias` (0..1).

---

## Geometry quality and LOD

- Resolution policy
  - Target vertex count: min(`detail.maxVertices` | default 256, adaptive by size and zoom).
  - Simplify with Ramer–Douglas–Peucker using `detail.tolerance` in device pixels.
- Zoom-aware regeneration
  - Bucket zoom into a small number of LOD levels, regenerate when crossing a bucket threshold.
- Stability
  - Use a deterministic PRNG seeded with `profile.seed` to keep outlines stable across renders and LOD.

---

## Renderer integration (React/Canvas2D example)

1) Resolve geometry from profile
```ts
const geometry = useMemo(
  () => resolveShapeGeometry(node.shape ?? { kind: 'circle', size: { width: node.w, height: node.h } }, zoom),
  [node.shape, node.w, node.h, zoom]
);
```

2) Draw the outline
```ts
ctx.save();
ctx.translate(node.x, node.y);
ctx.rotate(node.rotation ?? 0);
const path = new Path2D();
const p = geometry.polygon;
path.moveTo(p[0], p[1]);
for (let i = 2; i < p.length; i += 2) path.lineTo(p[i], p[i + 1]);
path.closePath();
ctx.fillStyle = fill;
ctx.fill(path);
if (strokeWidth > 0) { ctx.lineWidth = strokeWidth; ctx.strokeStyle = stroke; ctx.stroke(path); }
ctx.restore();
```

3) Cache and LOD
- Cache `ShapeGeometry` by hash of `profile + zoomBucket + detail`.
- Invalidate on changes to `kind`, `size`, `params`, `seed`, or `detail`.
- Heavy shapes (particle cluster) can be generated in a worker; geometry is serializable.

WebGL/SVG notes
- WebGL: triangulate (earcut) once, upload VBO/IBO; draw filled mesh and optional stroke as polyline.
- SVG: emit a single `path` from either `pathCommands` or the polygon.

---

## Hit-testing and anchors

- Hit test: point-in-polygon using the final outline (ray cast or winding number). For very small zoom, use bounding circle/box.
- Edge anchors: expose helpers on `geometry.anchors` to find the intersection between a center-to-target ray and the outline. Fallback: intersect with bounding ellipse if anchors are absent.
- Label placement: use centroid of polygon; for external labels, use `outwardAtAngle(θ, d)` to offset label/halo.

---

## Visual metadata shape field

- Nodes may specify a `shape` field in their visual metadata. If omitted, the renderer uses a circle with the node’s width/height.

Example JSON
```json
{
  "id": "n1",
  "x": 100,
  "y": 120,
  "w": 80,
  "h": 80,
  "shape": {
    "kind": "blob",
    "seed": 17,
    "size": { "width": 80, "height": 80 },
    "params": { "noiseAmp": 0.2, "noiseFreq": 2.4, "octaves": 3 },
    "detail": { "maxVertices": 256 }
  }
}
```

---

## Example profiles

```json
{ "kind": "circle", "size": { "width": 64, "height": 64 } }
```
```json
{ "kind": "teardrop", "seed": 21, "size": { "width": 70, "height": 90 }, "params": { "tipSharpness": 0.75, "asymmetry": 0.2, "curvatureBias": 0.6 } }
```
```json
{ "kind": "starburst", "size": { "width": 80, "height": 80 }, "params": { "lobes": 9, "lobeAmp": 0.35, "tipRoundness": 0.4, "irregularity": 0.1 } }
```
```json
{ "kind": "supershape", "size": { "width": 90, "height": 90 }, "params": { "m": 6, "n1": 0.4, "n2": 1.0, "n3": 1.0, "a": 1, "b": 1 } }
```
```json
{ "kind": "particleCluster", "seed": 12, "size": { "width": 80, "height": 70 }, "params": { "pointCount": 140, "radius": 4, "alpha": 0.4, "smoothing": 0.65 }, "detail": { "maxVertices": 512 } }
```

---

## Implementation notes

- Determinism: use a small fast PRNG (e.g., mulberry32, xoshiro) seeded by `profile.seed`.
- Noise: simplex/perlin noise; tie `noiseFreq` to shape perimeter so features scale with size.
- Polygon validity: ensure non-self-intersection; if needed, project to convex hull and blend back toward target.
- Simplification: apply after generation; preserve topology (no spikes removed if it changes silhouette intent).
- Performance bounds: clamp `maxVertices` (e.g., 512) globally; heavy shapes obey a per-frame generation budget.

---

## Migration

- New nodes specify `shape`. If absent, the renderer uses the `'circle'` generator as the default.
- We do not preserve legacy `shapeType` enums; if they exist in older data, map them to equivalent `ShapeProfile`s during ingestion.

---

## Roadmap (next)

- Add optional `maskPath` to reuse geometry for clipping internal textures.
- Provide a shared triangulation cache keyed by geometry hash.
- Authoring presets for shape families (e.g., “soft blob”, “leaf”, “sunburst”).
- Optional `quality` flag: `'low' | 'medium' | 'high'` to drive `detail` defaults.
- Worker-based generation for `particleCluster` and expensive supershapes.