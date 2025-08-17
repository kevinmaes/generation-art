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

## Core Concept

Fan chart as **pure positioning system** - outputs x,y coordinates, not visual shapes. Downstream transformers handle visual representation.

## Parameters

### Essential Controls

**Generation Display:**
- `maxGenerations`: 1-12 (default: 6)
- `centerPersonId`: Individual at center

**Spacing:**
```typescript
generationSpacing: {
  mode: 'auto-fit' | 'manual',
  // Auto-fit options:
  padding: 50,  // Canvas edge buffer
  distribution: 'uniform' | 'compressed' | 'logarithmic',
  // Manual options:
  initial: 120,  // First ring distance
  factor: 0.9,   // Scaling per generation
}
```

**Angular Coverage:**
```typescript
spread: {
  degrees: 180,     // 360=full, 180=semi, 90=quarter
  rotation: -90,    // Start angle (-90=top)
}
```

**Creative Distortion:**
```typescript
distortion: {
  spiral: 0,          // Twist per generation (0-30°)
  maternalBias: 1.0,  // Scale maternal side (0.5-1.5)
  paternalBias: 1.0,  // Scale paternal side (0.5-1.5)
}
```

### Auto-Fit Logic

When `mode: 'auto-fit'`:
- Calculate available radius: `min(width, height) / 2 - padding`
- **Uniform**: `spacing = radius / generations`
- **Compressed**: `initial = radius / Σ(factor^i)`
- **Logarithmic**: `spacing(i) = radius * log(i+1) / log(n+1)`

### Presets

```typescript
spacingPresets: {
  'comfortable': { initial: 150, factor: 1.0 },
  'compact': { initial: 100, factor: 0.85 },
  'dramatic': { initial: 200, factor: 0.7 },
  'auto': 'calculate from canvas'
}

## Positioning Algorithm

### Coordinate Calculation
- Center person at canvas center (or specified point)
- Each generation at calculated distance from center
- Angular position based on binary tree position
- Polar → Cartesian: `x = cx + r * cos(θ)`, `y = cy + r * sin(θ)`

### Generation Distances
- **Auto-fit**: Calculate from canvas size and generation count
- **Manual**: Use specified initial + scaling factor
- **Presets**: Comfortable, Compact, Dramatic

### Angular Distribution
- Generation 1: 2 positions (left/right or custom)
- Generation 2: 4 positions (grandparents)
- Generation n: 2^n positions
- Apply spread constraints (180°, 360°, etc)
- Add spiral twist if specified

### Missing Ancestors
- Calculate position anyway (maintain structure)
- Mark with `isPlaceholder: true`
- Downstream transformers decide visibility

## Output (Positioning Only)

```typescript
{
  individuals: {
    "I1": {
      // Core position
      x: 512,
      y: 300,
      
      // Metadata for downstream transformers
      generation: 2,
      angle: 1.67,              // Radians from center
      distance: 175,            // Pixels from center
      angleNormalized: 0.25,    // 0-1 within generation
      
      // Lineage info
      lineage: 'maternal' | 'paternal' | 'mixed',
      completeness: 0.75,       // % ancestors known at this level
      
      // Optional bounds (for collision detection)
      bounds: {
        innerRadius: 150,
        outerRadius: 200,
        startAngle: 1.57,
        endAngle: 1.77
      }
    }
  },
  
  metadata: {
    centerPerson: "I1",
    totalGenerations: 6,
    canvasCenter: { x: 512, y: 512 },
    parameters: { /* echo of inputs */ }
  }
}
```

**Note:** No shapes, wedges, or visual elements - just positions and metadata

## TypeScript Types

```ts
interface FanChartParams {
  centerPersonId: string;
  maxGenerations: number;
  
  generationSpacing: {
    mode: 'auto-fit' | 'manual';
    padding?: number;
    distribution?: 'uniform' | 'compressed' | 'logarithmic';
    initial?: number;
    factor?: number;
  };
  
  spread: {
    degrees: number;      // 360, 180, 90, etc
    rotation: number;     // Start angle
  };
  
  distortion?: {
    spiral?: number;      // Twist per generation
    maternalBias?: number;
    paternalBias?: number;
  };
}

interface FanChartPosition {
  x: number;
  y: number;
  generation: number;
  angle: number;
  distance: number;
  angleNormalized: number;
  lineage: 'ego' | 'maternal' | 'paternal' | 'mixed';
  completeness: number;
  bounds?: {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
  };
}

interface FanChartOutput {
  individuals: Record<string, FanChartPosition>;
  metadata: {
    centerPerson: string;
    totalGenerations: number;
    canvasCenter: { x: number; y: number };
    parameters: FanChartParams;
  };
}
```

## Pipeline Integration

**As Base Layout:**
```
GEDCOM → Fan Chart → Positions → Visual Transformers → Renderer
```

**Example Downstream Transformers:**
- Circle size by lifespan
- Color by generation/lineage
- Particle effects from positions
- Force physics using positions as anchors
- Traditional wedges (optional visualizer)

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
