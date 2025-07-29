# Transformer Ideas & Development Roadmap

This document tracks transformer ideas organized by complexity and category. We'll start with low-level transformers and build up to high-level, complex visualizations.

## Transformer Categories

- **Low-Level**: Basic visual attributes (shapes, colors, lines, positions)
- **Mid-Level**: Layout and arrangement patterns
- **High-Level**: Complex visual metaphors and data-driven layouts
- **Experimental**: Advanced concepts for future exploration

## Transformer Ideas Table

| Name                                     | Category     | Description                                                                                                                                | LLM Integration | Priority | Custom Parameters                                          |
| ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | -------- | ---------------------------------------------------------- |
| **Color Palette Transformer**            | Low-Level    | Assigns colors to nodes based on criteria like generation, birth decade, or family branch                                                  | ✅              | 🔥 High  | colorScheme, paletteType, saturationRange, brightnessRange |
| **Node Shape Transformer**               | Low-Level    | Determines the shape of individual nodes (circle, square, triangle, star, etc.) based on metadata like gender, birth order, or generation  | ❌              | 🔥 High  | ✅                                                         |
| **Edge Style Transformer**               | Low-Level    | Controls line style for graph edges (solid, dashed, dotted, thickness, color) based on relationship type (parent-child, sibling, marriage) | ❌              | 🔥 High  | ✅                                                         |
| **Node Size Transformer**                | Low-Level    | Controls the size of nodes based on metadata like number of children, age at death, or importance metrics                                  | ❌              | 🔥 High  | ✅                                                         |
| **Position Grid Transformer**            | Mid-Level    | Arranges nodes in a regular grid pattern with configurable spacing and alignment                                                           | ❌              | 🔥 High  | ✅                                                         |
| **Circular Layout Transformer**          | Mid-Level    | Places nodes in concentric circles with generations radiating outward from center                                                          | ❌              | 🔥 High  | ✅                                                         |
| **Force-Directed Layout Transformer**    | Mid-Level    | Uses physics simulation to position nodes with attractive/repulsive forces based on relationships                                          | ❌              | 🔥 High  | ✅                                                         |
| **Timeline Layout Transformer**          | Mid-Level    | Arranges nodes along a horizontal timeline based on birth/death dates                                                                      | ❌              | 🔥 High  | ✅                                                         |
| **Geographic Layout Transformer**        | High-Level   | Positions nodes as if plotting birth locations on a world map, creating geographic visualizations                                          | ✅              | 🔥 High  | ✅                                                         |
| **Family Tree Metaphor Transformer**     | High-Level   | Uses organic tree-like structures with branches, leaves, and roots representing family relationships                                       | ✅              | 🔥 High  | ✅                                                         |
| **Spiral Layout Transformer**            | High-Level   | Arranges nodes in spiral patterns, useful for large families or recursive structures                                                       | ❌              | 🔥 High  | ✅                                                         |
| **Cluster Layout Transformer**           | High-Level   | Groups related individuals into visual clusters with clear boundaries                                                                      | ❌              | 🔥 High  | ✅                                                         |
| **Seasonal Color Transformer**           | Low-Level    | Assigns colors based on birth seasons or months, creating seasonal themes                                                                  | ❌              | 🔥 High  | ✅                                                         |
| **Generation Opacity Transformer**       | Low-Level    | Controls transparency of nodes based on generation depth or distance from root                                                             | ❌              | 🔥 High  | ✅                                                         |
| **Relationship Line Weight Transformer** | Low-Level    | Adjusts line thickness based on relationship strength or type                                                                              | ❌              | 🔥 High  | ✅                                                         |
| **Node Border Style Transformer**        | Low-Level    | Adds borders, patterns, or textures to nodes based on metadata                                                                             | ❌              | 🔥 High  | ✅                                                         |
| **Radial Layout Transformer**            | Mid-Level    | Places nodes in radial patterns from a central ancestor                                                                                    | ❌              | 🔥 High  | ✅                                                         |
| **Hierarchical Layout Transformer**      | Mid-Level    | Creates traditional top-down family tree layouts with clear hierarchy                                                                      | ❌              | 🔥 High  | ✅                                                         |
| **Organic Growth Transformer**           | High-Level   | Simulates organic growth patterns like tree branches or coral structures                                                                   | ✅              | 🔥 High  | ✅                                                         |
| **Historical Timeline Transformer**      | High-Level   | Creates visual timelines that incorporate historical events and family milestones                                                          | ✅              | 🔥 High  | ✅                                                         |
| **DNA Helix Transformer**                | Experimental | Arranges nodes in double-helix patterns representing genetic inheritance                                                                   | ❌              | 🔥 High  | ✅                                                         |
| **Constellation Transformer**            | Experimental | Creates star-like patterns connecting family members as constellations                                                                     | ✅              | 🔥 High  | ✅                                                         |
| **River Flow Transformer**               | Experimental | Uses river-like flowing patterns to show family lineage and branching                                                                      | ✅              | 🔥 High  | ✅                                                         |
| **Mosaic Pattern Transformer**           | Experimental | Creates tile-like patterns where each family member is a unique tile                                                                       | ❌              | 🔥 High  | ✅                                                         |
| **Fractal Tree Transformer**             | Experimental | Uses fractal mathematics to create self-similar branching patterns                                                                         | ❌              | 🔥 High  | ✅                                                         |
| **Seasonal Growth Transformer**          | High-Level   | Simulates seasonal growth cycles with nodes appearing as leaves, flowers, or fruits                                                        | ✅              | 🔥 High  | ✅                                                         |
| **Migration Path Transformer**           | High-Level   | Shows family migration patterns with connecting paths and geographic markers                                                               | ✅              | 🔥 High  | ✅                                                         |
| **Cultural Symbol Transformer**          | Low-Level    | Uses cultural symbols or icons for nodes based on ethnicity or cultural background                                                         | ✅              | 🔥 High  | ✅                                                         |
| **Life Event Marker Transformer**        | Low-Level    | Adds visual markers for significant life events (marriage, death, immigration)                                                             | ❌              | 🔥 High  | ✅                                                         |
| **Family Crest Transformer**             | Experimental | Creates heraldic-style visualizations with family crests and coats of arms                                                                 | ✅              | 🔥 High  | ✅                                                         |

## Priority Levels

- 🔥 **High**: Core transformers that provide fundamental visual improvements
- 🔶 **Medium**: Important transformers that enhance the experience
- 🔷 **Low**: Nice-to-have transformers for future enhancement
- 🧪 **Experimental**: Creative concepts for exploration

## Implementation Phases

### Phase 1: Foundation (Low-Level) - Immediate Priority

1. **Color Palette Transformer** - Essential for visual appeal
2. **Node Shape Transformer** - Basic visual variety
3. **Edge Style Transformer** - Relationship clarity
4. **Node Size Transformer** - Visual hierarchy

### Phase 2: Layout Basics (Mid-Level) - High Priority

5. **Position Grid Transformer** - Simple, reliable layout
6. **Circular Layout Transformer** - Classic family tree style
7. **Timeline Layout Transformer** - Temporal organization

### Phase 3: Advanced Layouts (High-Level) - Medium Priority

8. **Force-Directed Layout Transformer** - Dynamic positioning
9. **Geographic Layout Transformer** - Location-based visualization
10. **Family Tree Metaphor Transformer** - Organic structures

### Phase 4: Creative Exploration (Experimental) - Low Priority

11. **Spiral Layout Transformer** - Creative patterns
12. **Organic Growth Transformer** - Natural aesthetics
13. **Constellation Transformer** - Artistic interpretation

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

---

_Last updated: 2025-01-27 19:30 UTC_
