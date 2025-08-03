# Transformer Ideas & Development Roadmap

This document tracks transformer ideas organized by complexity and category. We'll start with low-level transformers and build up to high-level, complex visualizations.

## Transformer Categories

### Primary Categories (What it affects)

- **Node Style**: Affects individual node appearance (shape, color, size, opacity)
- **Edge Style**: Affects connection line appearance (curve, thickness, style)
- **Layout**: Affects positioning and arrangement of elements
- **Effects**: Adds visual effects and artistic treatments
- **Metaphor**: Creates complex visual representations

### Secondary Categories (How it works)

- **Data-Driven**: Uses genealogy data to determine visual properties
- **Artistic**: Adds aesthetic effects independent of data
- **LLM-Enhanced**: Uses AI for intelligent decisions
- **Mathematical**: Uses algorithms/formulas for positioning

## Transformer Ideas Table

| Name                                     | Primary Category | Secondary Category | Description                                                                                                                                | LLM | Priority | Custom Parameters                                          |
| ---------------------------------------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --- | -------- | ---------------------------------------------------------- |
| **Color Palette Transformer**            | Node Style       | Data-Driven        | Assigns colors to nodes based on criteria like generation, birth decade, or family branch                                                  | ✅  | 🔥 High  | colorScheme, paletteType, saturationRange, brightnessRange |
| **Node Shape Transformer**               | Node Style       | Data-Driven        | Determines the shape of individual nodes (circle, square, triangle, star, etc.) based on metadata like gender, birth order, or generation  | ❌  | 🔥 High  | ✅                                                         |
| **Edge Style Transformer**               | Edge Style       | Data-Driven        | Controls line style for graph edges (solid, dashed, dotted, thickness, color) based on relationship type (parent-child, sibling, marriage) | ❌  | 🔥 High  | ✅                                                         |
| **Node Size Transformer**                | Node Style       | Data-Driven        | Controls the size of nodes based on metadata like number of children, age at death, or importance metrics                                  | ❌  | 🔥 High  | ✅                                                         |
| **Position Grid Transformer**            | Layout           | Mathematical       | Arranges nodes in a regular grid pattern with configurable spacing and alignment                                                           | ❌  | 🔥 High  | ✅                                                         |
| **Circular Layout Transformer**          | Layout           | Mathematical       | Places nodes in concentric circles with generations radiating outward from center                                                          | ❌  | 🔥 High  | ✅                                                         |
| **Force-Directed Layout Transformer**    | Layout           | Mathematical       | Uses physics simulation to position nodes with attractive/repulsive forces based on relationships                                          | ❌  | 🔥 High  | ✅                                                         |
| **Timeline Layout Transformer**          | Layout           | Data-Driven        | Arranges nodes along a horizontal timeline based on birth/death dates                                                                      | ❌  | 🔥 High  | ✅                                                         |
| **Geographic Layout Transformer**        | Layout           | Data-Driven        | Positions nodes as if plotting birth locations on a world map, creating geographic visualizations                                          | ✅  | 🔥 High  | ✅                                                         |
| **Family Tree Metaphor Transformer**     | Metaphor         | LLM-Enhanced       | Uses organic tree-like structures with branches, leaves, and roots representing family relationships                                       | ✅  | 🔥 High  | ✅                                                         |
| **Spiral Layout Transformer**            | Layout           | Mathematical       | Arranges nodes in spiral patterns, useful for large families or recursive structures                                                       | ❌  | 🔥 High  | ✅                                                         |
| **Cluster Layout Transformer**           | Layout           | Data-Driven        | Groups related individuals into visual clusters with clear boundaries                                                                      | ❌  | 🔥 High  | ✅                                                         |
| **Seasonal Color Transformer**           | Node Style       | Data-Driven        | Assigns colors based on birth seasons or months, creating seasonal themes                                                                  | ❌  | 🔥 High  | ✅                                                         |
| **Generation Opacity Transformer**       | Node Style       | Data-Driven        | Controls transparency of nodes based on generation depth or distance from root                                                             | ❌  | 🔥 High  | ✅                                                         |
| **Relationship Line Weight Transformer** | Edge Style       | Data-Driven        | Adjusts line thickness based on relationship strength or type                                                                              | ❌  | 🔥 High  | ✅                                                         |
| **Node Border Style Transformer**        | Node Style       | Data-Driven        | Adds borders, patterns, or textures to nodes based on metadata                                                                             | ❌  | 🔥 High  | ✅                                                         |
| **Radial Layout Transformer**            | Layout           | Mathematical       | Places nodes in radial patterns from a central ancestor                                                                                    | ❌  | 🔥 High  | ✅                                                         |
| **Hierarchical Layout Transformer**      | Layout           | Data-Driven        | Creates traditional top-down family tree layouts with clear hierarchy                                                                      | ❌  | 🔥 High  | ✅                                                         |
| **Organic Growth Transformer**           | Metaphor         | LLM-Enhanced       | Simulates organic growth patterns like tree branches or coral structures                                                                   | ✅  | 🔥 High  | ✅                                                         |
| **Historical Timeline Transformer**      | Metaphor         | LLM-Enhanced       | Creates visual timelines that incorporate historical events and family milestones                                                          | ✅  | 🔥 High  | ✅                                                         |
| **DNA Helix Transformer**                | Metaphor         | Mathematical       | Arranges nodes in double-helix patterns representing genetic inheritance                                                                   | ❌  | 🔥 High  | ✅                                                         |
| **Constellation Transformer**            | Metaphor         | LLM-Enhanced       | Creates star-like patterns connecting family members as constellations                                                                     | ✅  | 🔥 High  | ✅                                                         |
| **River Flow Transformer**               | Metaphor         | LLM-Enhanced       | Uses river-like flowing patterns to show family lineage and branching                                                                      | ✅  | 🔥 High  | ✅                                                         |
| **Mosaic Pattern Transformer**           | Metaphor         | Mathematical       | Creates tile-like patterns where each family member is a unique tile                                                                       | ❌  | 🔥 High  | ✅                                                         |
| **Fractal Tree Transformer**             | Metaphor         | Mathematical       | Uses fractal mathematics to create self-similar branching patterns                                                                         | ❌  | 🔥 High  | ✅                                                         |
| **Seasonal Growth Transformer**          | Metaphor         | LLM-Enhanced       | Simulates seasonal growth cycles with nodes appearing as leaves, flowers, or fruits                                                        | ✅  | 🔥 High  | ✅                                                         |
| **Migration Path Transformer**           | Metaphor         | LLM-Enhanced       | Shows family migration patterns with connecting paths and geographic markers                                                               | ✅  | 🔥 High  | ✅                                                         |
| **Cultural Symbol Transformer**          | Node Style       | LLM-Enhanced       | Uses cultural symbols or icons for nodes based on ethnicity or cultural background                                                         | ✅  | 🔥 High  | ✅                                                         |
| **Life Event Marker Transformer**        | Node Style       | Data-Driven        | Adds visual markers for significant life events (marriage, death, immigration)                                                             | ❌  | 🔥 High  | ✅                                                         |
| **Family Crest Transformer**             | Metaphor         | LLM-Enhanced       | Creates heraldic-style visualizations with family crests and coats of arms                                                                 | ✅  | 🔥 High  | ✅                                                         |
| **Variance Transformer**                 | Effects          | Data-Driven        | Systematically varies properties by percentage based on data attributes                                                                    | ❌  | 🔥 High  | varianceAmount, targetProperties, varianceMode             |
| **Noise Transformer**                    | Effects          | Artistic           | Adds smooth, organic Perlin/Simplex noise to properties for natural variation                                                              | ❌  | 🔥 High  | noiseType, noiseScale, noiseOctaves, amplitude             |
| **Jitter Transformer**                   | Effects          | Artistic           | Adds small random offsets for hand-drawn or imperfect aesthetic                                                                            | ❌  | 🔥 High  | jitterAmount, jitterProperties, distributionType           |
| **Edge Curve Transformer**               | Edge Style       | Artistic           | Transforms straight edges into bezier curves, arcs, or organic paths                                                                       | ❌  | 🔥 High  | curveType, curveTension, controlPointMode                  |
| **Bloom/Glow Transformer**               | Effects          | Artistic           | Creates soft, luminous effects by rendering multiple offset layers                                                                         | ❌  | 🔥 High  | layerCount, bloomRadius, opacityFalloff                    |
| **Echo Transformer**                     | Effects          | Artistic           | Creates trailing/ghost effects with decreasing opacity duplicates                                                                          | ❌  | 🔥 High  | echoCount, echoOffset, echoDecay                           |
| **Particle Cloud Transformer**           | Effects          | Artistic           | Replaces solid shapes with particle systems (dots, stipples)                                                                               | ❌  | 🔥 High  | particleCount, particleSize, distribution                  |
| **Sketch Transformer**                   | Effects          | Artistic           | Creates hand-drawn aesthetic with multiple offset strokes                                                                                  | ❌  | 🔥 High  | strokeCount, roughness, sketchStyle                        |
| **Ink Bleed Transformer**                | Effects          | Artistic           | Watercolor/ink effect with overlapping shapes and color variation                                                                          | ❌  | 🔥 High  | bleedAmount, colorVariance, wetness                        |

## Priority Levels

- 🔥 **High**: Core transformers that provide fundamental visual improvements
- 🔶 **Medium**: Important transformers that enhance the experience
- 🔷 **Low**: Nice-to-have transformers for future enhancement
- 🧪 **Experimental**: Creative concepts for exploration

## Implementation Phases

### Phase 1: Core Visual Elements - Immediate Priority

#### Node Style Transformers

1. **Color Palette Transformer** - Essential for visual appeal
2. **Node Shape Transformer** - Basic visual variety
3. **Node Size Transformer** - Visual hierarchy
4. **Generation Opacity Transformer** - Depth visualization

#### Edge Style Transformers

5. **Edge Style Transformer** - Relationship clarity
6. **Edge Curve Transformer** - Transform straight lines to artistic curves
7. **Relationship Line Weight Transformer** - Visual emphasis

### Phase 2: Artistic Effects - Immediate Priority

#### Effects Transformers

8. **Variance Transformer** - Systematic property variation
9. **Noise Transformer** - Organic variation patterns
10. **Jitter Transformer** - Hand-drawn imperfection
11. **Bloom/Glow Transformer** - Soft luminous effects
12. **Echo Transformer** - Trailing/ghost effects
13. **Sketch Transformer** - Hand-drawn aesthetic
14. **Particle Cloud Transformer** - Replace solids with particle systems

### Phase 3: Layout Systems - High Priority

#### Layout Transformers

15. **Position Grid Transformer** - Simple, reliable layout
16. **Circular Layout Transformer** - Classic family tree style
17. **Timeline Layout Transformer** - Temporal organization
18. **Hierarchical Layout Transformer** - Traditional trees
19. **Force-Directed Layout Transformer** - Dynamic positioning

### Phase 4: Complex Metaphors - Medium Priority

#### Metaphor Transformers

20. **Family Tree Metaphor Transformer** - Organic structures
21. **Geographic Layout Transformer** - Location-based visualization
22. **DNA Helix Transformer** - Genetic representation
23. **Constellation Transformer** - Artistic star patterns

### Phase 5: Advanced Concepts - Low Priority

24. **River Flow Transformer** - Flowing lineage patterns
25. **Seasonal Growth Transformer** - Natural cycles
26. **Migration Path Transformer** - Movement visualization

## Transformer Metadata Schema

Each transformer should include:

- **Name**: Human-readable name
- **Category**: Low/Mid/High/Experimental
- **Description**: What it does
- **LLM Integration**: Whether it requires LLM for decision-making
- **Priority**: Implementation priority level
- **Custom Parameters**: Configurable options beyond temperature/seed
- **Dependencies**: Other transformers it works well with
- **Examples**: Sample outputs or use cases

## Custom Parameters Examples

### Color Palette Transformer

- `colorScheme`: "generation", "birthDecade", "familyBranch", "seasonal"
- `paletteType`: "warm", "cool", "monochrome", "complementary"
- `saturationRange`: [0.3, 0.9]
- `brightnessRange`: [0.4, 0.8]

### Node Shape Transformer

- `shapeMapping`: "gender", "generation", "birthOrder", "custom"
- `customShapes`: Array of shape definitions
- `randomnessFactor`: 0.0-1.0 for shape variation

### Geographic Layout Transformer

- `projectionType`: "mercator", "equal-area", "orthographic"
- `scaleFactor`: 1.0-10.0 for zoom level
- `centerCoordinates`: [lat, lng] for map center
- `locationFallback`: "random", "grid", "cluster" for missing coordinates

### Edge Curve Transformer

- `curveType`: "bezier", "arc", "organic", "catmull-rom"
- `curveTension`: 0.0-1.0 for curve intensity
- `controlPointMode`: "auto", "midpoint", "random", "generation-based"
- `curveDirection`: "up", "down", "auto" for arc direction

### Variance Transformer

- `varianceAmount`: 0.0-1.0 percentage of variation
- `targetProperties`: ["size", "opacity", "position", "color"]
- `varianceMode`: "uniform", "gaussian", "exponential"
- `basedOn`: "generation", "childrenCount", "random"

### Noise Transformer

- `noiseType`: "perlin", "simplex", "turbulence"
- `noiseScale`: 0.001-0.1 for frequency
- `noiseOctaves`: 1-8 for detail levels
- `amplitude`: 0.0-100.0 for effect strength
- `timeEvolution`: boolean for animated noise

### Bloom/Glow Transformer

- `layerCount`: 3-20 number of glow layers
- `bloomRadius`: 5-50 pixels spread
- `opacityFalloff`: "linear", "exponential", "gaussian"
- `colorShift`: 0.0-1.0 for hue variation in layers
- `glowIntensity`: 0.1-2.0 for brightness

---

_Last updated: 2025-08-02 UTC_
