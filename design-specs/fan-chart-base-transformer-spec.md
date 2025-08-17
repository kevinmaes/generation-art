### Fan Chart Base Transformer (FCBT) — Technical Specification


#### Overview
The Fan Chart Base Transformer (FCBT) replaces the Walker Tree transformer as the default base layout transformer in the visual pipeline. Given a normalized GEDCOM graph and a user-selected center person, it generates a radial, generation-based “fan chart” layout. The output is a deterministic JSON layout artifact suitable for downstream renderers (SVG/Canvas/WebGL) and style transformers.


#### Goals
- Produce a predictable, scalable radial layout centered on a selected individual.
- Support configurable generation depth, orientation (full/semicircle/quadrant), and label density.
- Handle missing parents and pedigree collapse gracefully.
- Emit a renderer-agnostic geometry contract that downstream stages can consume without additional layout work.
- Remain performant for large ancestor depths (up to 10–12 generations when feasible).


#### Non-Goals
- Descendant trees or complex relationship diagrams beyond direct ancestors.
- Automatic panning/zooming; the layout should be self-contained within a known canvas.
- Styling decisions beyond basic semantic tokens (colors by generation/lineage/sex, etc.). Styling is delegated to theming transformers.


#### Key User Stories
- As a user, I can choose any person in my GEDCOM as the fan chart center.
- As a user, I can limit the number of generations and see the chart update instantly.
- As a user, I can switch between 360°, 180°, and 90° fan modes and rotate the chart.
- As a user, I can show/hide placeholders for unknown ancestors and mark duplicate ancestors (pedigree collapse).
- As a user, I can export SVG/PNG and save/load layout JSON.


#### Terminology
- Center Person (Ego): The individual at the origin of the fan chart.
- Generation: Distance from the center person (0 = ego, 1 = parents, 2 = grandparents, ...).
- Segment: A single wedge-shaped arc representing one ancestor instance in the fan chart.
- Ring: A concentric band containing all segments for a specific generation.


#### Inputs and Preconditions
- Input graph: normalized GEDCOM-derived data structure with fast parent lookup.
  - Each person has a stable `personId` and possibly `parentIds: { fatherId?: string; motherId?: string }`.
  - Names, vital dates, sex, and optional metadata (e.g., photos, places).
- Required parameter: `centerPersonId`.
- Optional parameters:
  - `maxGenerations` (default 6)
  - `mode` ∈ { "full", "semi", "quadrant" } (default "semi")
  - `startAngleDeg` (default 90; 0 = pointing right, 90 = up)
  - `labelDensity` ∈ { "none", "low", "medium", "high" } (default "medium")
  - `showUnknownPlaceholders` (default true)
  - `highlightDuplicates` (default true)
  - `radialPaddingPx` (default 8) — space between rings
  - `angularPaddingDeg` (default 1) — gap between segments
  - `outerRadiusPx` (default derived from canvas) — if omitted, computed to fit
  - `centerRadiusPx` (default 48) — radius allocated to generation 0 tile


#### Coordinate System and Orientation
- Polar coordinates, converted to Cartesian for renderer convenience.
- Angles increase clockwise, with `startAngleDeg` defining the angle of the vertical axis of symmetry.
- For `mode`:
  - `full`: total sweep = 360°
  - `semi`: total sweep = 180°
  - `quadrant`: total sweep = 90°
- Ego sits at center; Generation 1 begins immediately outside `centerRadiusPx`.


#### Ring Sizing
- Let `R0 = centerRadiusPx`.
- For generation `g ≥ 1`:
  - `ringThicknessPx(g) = baseRingPx + f(g)`
  - Default `baseRingPx = 48`; `f(g) = 0` or a mild linear growth (e.g., +2px per generation) to improve readability outward.
- Compute `outerRadiusPx` as `R0 + sum_{g=1..G} ringThicknessPx(g) + radialPaddingPx*(G)`.
  - If `outerRadiusPx` is pre-specified, solve for `baseRingPx` to fit.


#### Angular Allocation
- Total sweep `S` based on `mode`.
- For generation `g`, the theoretical number of distinct ancestors is `2^g`, but pedigree collapse may reduce distinct persons.
- Allocate angular width per theoretical slot first: `slotAngle(g) = (S - totalInterSegmentGaps) / 2^g`.
- Create `2^g` ordered slots. Populate slots with existing ancestors; for missing parents, optionally emit placeholders if `showUnknownPlaceholders`.
- Apply per-segment angular padding `angularPaddingDeg` by subtracting half-gap at both ends.


#### Pedigree Collapse (Duplicate Ancestors)
- Support repeated persons appearing in multiple slots.
- Behavior controlled by `highlightDuplicates`:
  - If true: retain separate segments per occurrence; set `duplicateOf = canonicalPersonId` for non-canonical instances; emit a `duplicateGroupId` for grouping.
  - If false: retain separate segments without grouping metadata.
- Optional future: merge contiguous duplicate segments if they are adjacent and visually highlight the merged block.


#### Missing Parents and Placeholders
- If an ancestor is unknown, emit a `placeholder` segment with synthetic `segmentId` and `isPlaceholder = true`.
- Placeholder label strategy:
  - Empty label when `labelDensity = low|none`.
  - "Unknown" or "—" when `labelDensity = medium|high`.


#### Label Placement
- For each segment, compute a label anchor:
  - `label.anchorAngleRad = (startAngleRad + endAngleRad) / 2`
  - `label.radiusPx = innerRadiusPx + 0.5 * ringThickness`
- Label text content tiers:
  - `high`: Full name + life years (e.g., "Jane Doe (1901–1975)")
  - `medium`: Full name
  - `low`: Surname or initials
  - `none`: no label
- Truncation/wrapping:
  - `label.wrapWidthPx = arcChordLength(innerRadiusPx, outerRadiusPx, segmentAngle)` minus margin.
  - If insufficient width, degrade density tier for that segment.


#### Arc Geometry
- Each segment provides both polar and Cartesian data for convenience:
  - `startAngleRad`, `endAngleRad`, `innerRadiusPx`, `outerRadiusPx`
  - Optional pre-computed SVG `path` string (large-arc flags etc.).
- Downstream renderers can ignore `path` and reconstruct as needed.


#### Output Contract (Renderer-Agnostic JSON)
```json
{
  "kind": "fanChartLayout",
  "version": 1,
  "metadata": {
    "centerPersonId": "P123",
    "generatedAt": "2025-01-01T00:00:00Z",
    "config": { /* echo of inputs */ },
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


#### Suggested TypeScript Types (for implementation later)
```ts
export type FanChartMode = "full" | "semi" | "quadrant";
export type LabelDensity = "none" | "low" | "medium" | "high";

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
	kind: "fanChartLayout";
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


#### Pipeline Integration
- FCBT is the first transformer in the pipeline when the “Fan Chart” layout mode is selected.
- Input contract: normalized GEDCOM graph, plus `FanChartConfig`.
- Output contract: `FanChartLayout` JSON above.
- Downstream transformers may:
  - Apply color schemes based on `style.tokens`.
  - Add textures/gradients, overlays, or decorative connectors.
  - Render to SVG, Canvas, or export to raster formats.
- Keep Walker Tree transformer available; expose a pipeline mode toggle.


#### UI/UX Changes
- Center Person selection:
  - Typeahead search box with debounce; results show name + life years + personId.
  - Optional filters: “has ancestors”, “limit to direct line”, “living only”.
  - Quick actions: “Recenter on this person” on click.
- Generation depth:
  - Slider (2–10) with dynamic preview; enforce performance guardrails for >8.
- Layout mode and rotation:
  - Toggle: full/semicircle/quadrant; rotation dial or numeric input for `startAngleDeg`.
- Labels:
  - Density selector: none/low/medium/high; auto-degrade per segment when too tight.
- Duplicates and unknowns:
  - Checkboxes: “Highlight duplicate ancestors”, “Show placeholders for unknowns”.
- Theming:
  - Palette presets (by generation, by maternal/paternal line, by sex), dark/light.
- Export:
  - SVG/PNG export; download `FanChartLayout.json`.
- Interactions:
  - Hover tooltip (name, life years, birthplace), click to recenter (generates new layout).


#### Performance Considerations
- Precompute parent chains and memoize person lookups.
- Use typed arrays for geometry if needed.
- Clamp label rendering when segment angle below threshold.
- For high depths, optionally skip `path` precomputation and let renderer derive.


#### Edge Cases
- No parents found: chart shows only ego ring.
- Single-parent known: show one real segment, one placeholder.
- Inconsistent or cyclic data: break cycles, mark segments as `isPlaceholder` and log warnings.
- Extremely large names: truncate with ellipsis; provide full text in tooltip only.


#### Test Plan
- Unit tests for:
  - Ring radii calculations under fixed and fit-to-canvas modes.
  - Angular allocation per generation; gaps respected.
  - Duplicate handling and indexing.
  - Label placement and density degradation.
- Golden layout snapshots for small synthetic trees (G=3..5).
- Property-based tests to ensure total angle coverage matches mode sweep minus gaps.


#### Milestones
1) Prototype layout core producing `FanChartLayout` from small GEDCOM.
2) Integrate with existing renderer; basic theming tokens.
3) UI wiring: person picker, generation slider, mode toggle.
4) Duplicate highlighting and placeholders.
5) Export pipeline and snapshot tests.


#### Open Questions
- Should we support descendant fan overlays in the future (outside-in layering)?
- Should duplicates optionally merge contiguous arcs to emphasize collapse visually?
- Do we want curved text along arc midlines for high-density labels?