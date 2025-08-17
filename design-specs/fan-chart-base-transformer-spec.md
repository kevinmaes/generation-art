# Fan Chart Base Transformer (FCBT) — Technical Specification

## Overview

Replaces Walker Tree as default layout. Generates radial fan chart from GEDCOM data centered on selected individual. Outputs deterministic JSON for renderers (SVG/Canvas/WebGL).

## Goals

- Predictable radial layout from selected center
- Configurable: generations, orientation (360°/180°/90°), label density
- Handle missing parents and pedigree collapse
- Renderer-agnostic geometry output
- Performant up to 10–12 generations

## Non-Goals

- Descendant trees or complex relationships
- Auto pan/zoom (self-contained canvas)
- Styling (delegated to theme transformers)

## User Stories

- Choose any person as center
- Adjust generation depth (instant update)
- Switch modes: 360°/180°/90° + rotation
- Toggle: unknown placeholders, duplicate highlighting
- Export: SVG/PNG/JSON

## Terms

- **Ego**: Center person (generation 0)
- **Generation**: Distance from ego (1=parents, 2=grandparents)
- **Segment**: Wedge for one ancestor
- **Ring**: Band containing all segments of a generation

## Inputs

**Required:**

- GEDCOM graph with parent lookups
- `centerPersonId`

**Config (defaults):**

- `maxGenerations` (6)
- `mode`: full/semi/quadrant (semi)
- `startAngleDeg` (90, up)
- `labelDensity`: none/low/medium/high (medium)
- `showUnknownPlaceholders` (true)
- `highlightDuplicates` (true)
- `radialPaddingPx` (8)
- `angularPaddingDeg` (1)
- `outerRadiusPx` (auto-fit)
- `centerRadiusPx` (48)

## Coordinates

- Polar → Cartesian conversion
- Clockwise angles from `startAngleDeg`
- Sweep: full=360°, semi=180°, quadrant=90°
- Ego at center, Gen 1 starts at `centerRadiusPx`

## Ring Sizing

- Base: `R0 = centerRadiusPx`
- Ring thickness: `baseRingPx` (48) + optional growth
- Total: `R0 + Σ(ringThickness) + padding`
- Auto-solve `baseRingPx` if `outerRadiusPx` specified

## Angular Allocation

- Generation `g` has `2^g` theoretical slots
- Slot angle: `(sweep - gaps) / 2^g`
- Fill slots with ancestors or placeholders
- Apply `angularPaddingDeg` gaps

## Pedigree Collapse

- Same person in multiple slots
- If `highlightDuplicates`:
  - Mark with `duplicateOf` and `duplicateGroupId`
- Future: merge adjacent duplicates visually

## Missing Parents

- Unknown → placeholder segment (`isPlaceholder = true`)
- Labels: none/low → empty, medium/high → "Unknown"

## Labels

**Position:** Mid-angle, mid-radius

**Density levels:**

- high: Name + years
- medium: Name only
- low: Surname/initials
- none: hidden

**Auto-degrade if segment too narrow**

## Geometry

- Polar: start/end angles, inner/outer radii
- Optional: pre-computed SVG path
- Renderers can use either format

## Output JSON

```json
{
  "kind": "fanChartLayout",
  "version": 1,
  "metadata": {
    "centerPersonId": "P123",
    "generatedAt": "2025-01-01T00:00:00Z",
    "config": {
      /* echo of inputs */
    },
    "canvas": { "width": 2048, "height": 2048, "cx": 1024, "cy": 1024 }
  },
  "rings": [
    { "generation": 0, "innerRadiusPx": 0, "outerRadiusPx": 48 },
    { "generation": 1, "innerRadiusPx": 56, "outerRadiusPx": 104 }
  ],
  "segments": [
    {
      "segmentId": "seg-g2-17",
      "personId": "P789",
      "generation": 2,
      "startAngleRad": 1.57,
      "endAngleRad": 1.77,
      "innerRadiusPx": 112,
      "outerRadiusPx": 160,
      "isPlaceholder": false,
      "duplicateOf": null,
      "duplicateGroupId": null,
      "label": {
        "text": "Jane Doe (1901–1975)",
        "anchorAngleRad": 1.67,
        "radiusPx": 136,
        "wrapWidthPx": 120,
        "density": "medium"
      },
      "style": {
        "tokens": ["generation-2", "female", "maternal-lineage"]
      },
      "path": "M ... Z"
    }
  ],
  "indexes": {
    "byPersonId": { "P789": ["seg-g2-17", "seg-g3-35"] },
    "byGeneration": { "2": ["seg-g2-0", "seg-g2-1"], "3": ["seg-g3-0"] }
  }
}
```

## TypeScript Types

```ts
export type FanChartMode = 'full' | 'semi' | 'quadrant';
export type LabelDensity = 'none' | 'low' | 'medium' | 'high';

export interface FanChartConfig {
  centerPersonId: string;
  maxGenerations: number;
  mode: FanChartMode;
  startAngleDeg: number;
  labelDensity: LabelDensity;
  showUnknownPlaceholders: boolean;
  highlightDuplicates: boolean;
  radialPaddingPx: number;
  angularPaddingDeg: number;
  outerRadiusPx?: number;
  centerRadiusPx: number;
}

export interface FanChartRing {
  generation: number;
  innerRadiusPx: number;
  outerRadiusPx: number;
}

export interface FanChartLabelSpec {
  text: string;
  anchorAngleRad: number;
  radiusPx: number;
  wrapWidthPx: number;
  density: LabelDensity;
}

export interface FanChartSegment {
  segmentId: string;
  personId: string | null;
  generation: number;
  startAngleRad: number;
  endAngleRad: number;
  innerRadiusPx: number;
  outerRadiusPx: number;
  isPlaceholder: boolean;
  duplicateOf: string | null;
  duplicateGroupId: string | null;
  label: FanChartLabelSpec | null;
  style: { tokens: string[] };
  path?: string;
}

export interface FanChartLayout {
  kind: 'fanChartLayout';
  version: 1;
  metadata: {
    centerPersonId: string;
    generatedAt: string;
    config: FanChartConfig;
    canvas: { width: number; height: number; cx: number; cy: number };
  };
  rings: FanChartRing[];
  segments: FanChartSegment[];
  indexes: {
    byPersonId: Record<string, string[]>;
    byGeneration: Record<string, string[]>;
  };
}
```

## Pipeline Integration

- First transformer when "Fan Chart" selected
- Input: GEDCOM + config
- Output: `FanChartLayout` JSON
- Downstream: theming, rendering, export
- Walker Tree remains available via toggle

## UI/UX

**Person picker:** Typeahead search, filters (has ancestors, direct line)

**Controls:**

- Generation slider (2–10, warn >8)
- Mode: full/semi/quadrant + rotation
- Label density: none/low/medium/high
- Toggles: duplicates, unknowns

**Theming:** Presets by generation/lineage/gender

**Export:** SVG/PNG/JSON

**Interaction:** Hover tooltip, click to recenter

## Performance

### Phase 1: Current Approach

- Leverage existing `getAncestors(individualId, maxLevels)` traversal utility for initial implementation
- Compute maternal/paternal lineage flags on-the-fly using gender information
- Calculate angular positions during transformation
- Use existing graph adjacency maps for O(1) parent lookups

### Phase 2: Future Optimizations

Pre-compute in augmentation phase:

```typescript
ancestorMetadata: {
  // Direct path from root to this ancestor
  pathFromRoot: string[],  // ['root_id', 'parent_id', 'grandparent_id']

  // Lineage classification for color coding
  lineType: 'paternal' | 'maternal' | 'mixed',

  // Completeness at this generation level (e.g., 0.75 = 3 of 4 grandparents known)
  generationCompleteness: number,

  // Pre-computed angular hints (optional)
  suggestedAngularPosition?: number,  // Normalized 0-1 within generation
}
```

**Benefits:**

- Eliminate redundant ancestor path traversals
- Enable instant maternal/paternal line filtering
- Support efficient duplicate ancestor detection
- Allow for pre-optimized angular distribution

### Strategy

- **Phase 1**: Use existing utilities (`getAncestors`, `getParents`) to build functional fan chart
- **Phase 2**: Profile performance with large trees (8+ generations)
- **Phase 3**: If needed, implement ancestor metadata pre-computation in CLI augmentation phase
- **Phase 4**: Cache computed layouts for instant re-rendering with different styles

### Additional

- Precompute parent chains and memoize person lookups
- Use typed arrays for geometry if needed
- Clamp label rendering when segment angle below threshold
- For high depths, optionally skip `path` precomputation and let renderer derive
- Implement virtual rendering for segments outside viewport (for zoomable implementations)

## Edge Cases

- No parents → ego only
- Single parent → one real, one placeholder
- Cycles → break, mark as placeholder, log warning
- Long names → truncate + ellipsis (full in tooltip)

## Testing

- Unit: ring sizing, angles, duplicates, labels
- Snapshots: small trees (3–5 generations)
- Property tests: angle coverage = sweep - gaps

## Milestones

1. Core layout → JSON
2. Renderer integration + basic theming
3. UI controls
4. Duplicates + placeholders
5. Export + tests

## Open Questions

- Descendant overlays (outside-in)?
- Merge adjacent duplicate arcs?
- Curved text on arcs?
