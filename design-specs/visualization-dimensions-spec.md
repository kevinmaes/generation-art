# Visualization Dimensions Specification

## Overview

Dimensions are data mappings that extract values from family tree data and normalize them to 0-1 ranges. These dimensions can influence any visual attribute: positions, colors, opacity, size, stroke width, etc.

## Dimension → Transformer → Visual Output Matrix

```
Family Tree Data → Dimensions → Transformers → Canvas
     ↓              ↓           ↓          ↓
  Birth Year → 0.0-1.0 → Position X → Visual Layout
  Children   → 0.0-1.0 → Opacity    → Visual Density
  Lifespan   → 0.0-1.0 → Size       → Visual Hierarchy
  Name Length→ 0.0-1.0 → Color      → Visual Patterns
```

**Example Pipeline:**

1. **Birth Year** dimension → **Horizontal Spread** transformer → X positions
2. **Children Count** dimension → **Node Opacity** transformer → Opacity values
3. **Lifespan** dimension → **Node Size** transformer → Size values
4. **Name Length** dimension → **Edge Color** transformer → Color values

## Priority Levels

- **P0 (Critical)**: Core functionality, must implement first
- **P1 (High)**: Important for user experience, implement soon
- **P2 (Medium)**: Nice to have, implement when time allows
- **P3 (Low)**: Future enhancement, consider for later versions

## Field Mapping Categories

### 1. Time-Based Dimensions

#### P0 - Birth Year

- **Field**: `individual.birth.date`
- **Extraction**: Parse year from date string
- **Normalization**: Min-max scaling across all individuals
- **Visual Uses**: Position X, Color hue, Opacity, Size
- **Implementation**: Simple regex extraction
- **Data Source**: Individual

#### P0 - Generation

- **Field**: `individual.metadata.generation`
- **Extraction**: Already calculated in metadata pipeline
- **Normalization**: Already normalized (0-based)
- **Visual Uses**: Position Y, Size, Opacity, Color saturation
- **Implementation**: Already implemented
- **Data Source**: Individual metadata

#### P1 - Lifespan

- **Field**: `individual.metadata.lifespan`
- **Extraction**: Already calculated in metadata pipeline
- **Normalization**: Scale to 0-1 (0 = unknown, 1 = longest life)
- **Visual Impact**: Life expectancy patterns
- **Implementation**: Already available in metadata
- **Data Availability**: Medium (requires both birth and death dates)

#### P1 - Age at First Marriage

- **Field**: `individual.marriages[0].date` and `individual.birth.date`
- **Extraction**: Calculate difference between birth and first marriage
- **Normalization**: Scale to 0-1 (youngest to oldest marriage age)
- **Visual Impact**: Marriage timing patterns
- **Implementation**: Date arithmetic
- **Data Availability**: Medium (requires marriage dates)

### 2. Family Structure Dimensions

#### P0 - Number of Children

- **Field**: `individual.children.length`
- **Extraction**: Direct count
- **Normalization**: Scale to 0-1 (0 = no children, 1 = most children)
- **Visual Impact**: Fertility patterns, family size clusters
- **Implementation**: Simple array length
- **Data Availability**: High (calculated for all individuals)

#### P1 - Birth Order

- **Field**: `individual.metadata.birthOrder`
- **Extraction**: Already calculated in metadata pipeline
- **Normalization**: Scale within family (0 = firstborn, 1 = youngest)
- **Visual Impact**: Sibling position patterns
- **Implementation**: Already available in metadata
- **Data Availability**: Medium (requires sibling relationships)

#### P1 - Number of Marriages

- **Field**: `individual.marriages.length`
- **Extraction**: Direct count
- **Normalization**: Scale to 0-1 (0 = no marriages, 1 = most marriages)
- **Visual Impact**: Marital history patterns
- **Implementation**: Simple array length
- **Data Availability**: Medium (requires marriage records)

#### P2 - Sibling Position

- **Field**: `individual.metadata.siblingOrder`
- **Extraction**: Position among siblings
- **Normalization**: Scale within family (0 = first, 1 = last)
- **Visual Impact**: Birth order within families
- **Implementation**: Calculate from family relationships
- **Data Availability**: Medium (requires sibling data)

### 3. Geographic Dimensions

#### P2 - Birth Location (Longitude)

- **Field**: `individual.birth.place.coordinates.longitude`
- **Extraction**: Geographic coordinate
- **Normalization**: -180 to +180 → 0 to 1
- **Visual Impact**: Geographic distribution (east-west)
- **Implementation**: Coordinate parsing
- **Data Availability**: Low (requires geocoded place data)

#### P2 - Birth Location (Latitude)

- **Field**: `individual.birth.place.coordinates.latitude`
- **Extraction**: Geographic coordinate
- **Normalization**: -90 to +90 → 0 to 1
- **Visual Impact**: Geographic distribution (north-south)
- **Implementation**: Coordinate parsing
- **Data Availability**: Low (requires geocoded place data)

#### P3 - Migration Distance

- **Field**: `individual.birth.place` and `individual.death.place`
- **Extraction**: Calculate distance between birth and death locations
- **Normalization**: Scale to 0-1 (0 = same place, 1 = furthest migration)
- **Visual Impact**: Migration patterns
- **Implementation**: Geographic distance calculation
- **Data Availability**: Very Low (requires both locations and coordinates)

### 4. Social/Cultural Dimensions

#### P1 - Name Length

- **Field**: `individual.name`
- **Extraction**: String length
- **Normalization**: Scale to 0-1 (shortest to longest name)
- **Visual Impact**: Cultural naming complexity
- **Implementation**: Simple string length
- **Data Availability**: High (all individuals have names)

#### P2 - Name Alphabetical Position

- **Field**: `individual.name`
- **Extraction**: Alphabetical ordering
- **Normalization**: A-Z → 0-1
- **Visual Impact**: Alphabetical patterns
- **Implementation**: String comparison
- **Data Availability**: High (all individuals have names)

#### P3 - Title/Status

- **Field**: `individual.title` or `individual.occupation`
- **Extraction**: Social status mapping
- **Normalization**: Categorical to numeric mapping
- **Visual Impact**: Social hierarchy patterns
- **Implementation**: Status classification system
- **Data Availability**: Low (requires title/occupation data)

### 5. Relationship Dimensions

#### P1 - Distance from Root

- **Field**: Calculated from family tree structure
- **Extraction**: Number of generations from root person
- **Normalization**: Scale to 0-1 (root = 0, furthest = 1)
- **Visual Impact**: Family tree depth patterns
- **Implementation**: Tree traversal algorithm
- **Data Availability**: High (can be calculated from relationships)

#### P2 - Family Branch

- **Field**: Calculated from family tree structure
- **Extraction**: Identify major family branches
- **Normalization**: Categorical to numeric mapping
- **Visual Impact**: Family branch clustering
- **Implementation**: Tree clustering algorithm
- **Data Availability**: Medium (requires family structure analysis)

#### P3 - Relationship Density

- **Field**: Calculated from family connections
- **Extraction**: Number of connections per individual
- **Normalization**: Scale to 0-1 (isolated to highly connected)
- **Visual Impact**: Social network patterns
- **Implementation**: Graph analysis
- **Data Availability**: Medium (requires relationship analysis)

## Implementation Priority Matrix

| Dimension             | Priority | Implementation Effort | Visual Impact | Data Source         | Notes                   |
| --------------------- | -------- | --------------------- | ------------- | ------------------- | ----------------------- |
| Generation            | P0       | Low                   | High          | Individual metadata | Already implemented     |
| Birth Year            | P0       | Low                   | High          | Individual          | Simple date parsing     |
| Children Count        | P0       | Low                   | High          | Individual          | Direct field access     |
| Lifespan              | P1       | Low                   | High          | Individual metadata | Already in metadata     |
| Name Length           | P1       | Low                   | Medium        | Individual          | Simple string length    |
| Distance from Root    | P1       | Medium                | High          | Individual metadata | Tree traversal needed   |
| Age at First Marriage | P1       | Medium                | Medium        | Individual          | Date arithmetic         |
| Birth Order           | P1       | Low                   | Medium        | Individual metadata | Already in metadata     |
| Marriage Count        | P1       | Low                   | Medium        | Individual          | Direct field access     |
| Name Alphabetical     | P2       | Low                   | Low           | Individual          | Simple sorting          |
| Sibling Position      | P2       | Medium                | Medium        | Family metadata     | Family analysis needed  |
| Birth Location (Long) | P2       | Medium                | High          | Individual          | Requires geocoding      |
| Birth Location (Lat)  | P2       | Medium                | High          | Individual          | Requires geocoding      |
| Family Branch         | P2       | High                  | Medium        | Family metadata     | Complex clustering      |
| Title/Status          | P3       | High                  | Medium        | Individual          | Requires classification |
| Migration Distance    | P3       | High                  | High          | Individual          | Complex geocoding       |
| Relationship Density  | P3       | High                  | Low           | Edge metadata       | Graph analysis          |

## Dimension → Transformer Mapping

### Visual Attributes Each Dimension Can Influence

| Dimension          | Position X | Position Y | Size | Opacity | Color | Stroke Width |
| ------------------ | ---------- | ---------- | ---- | ------- | ----- | ------------ |
| Birth Year         | ✅         | ✅         | ✅   | ✅      | ✅    | ✅           |
| Generation         | ✅         | ✅         | ✅   | ✅      | ✅    | ✅           |
| Children Count     | ✅         | ✅         | ✅   | ✅      | ✅    | ✅           |
| Lifespan           | ✅         | ✅         | ✅   | ✅      | ✅    | ✅           |
| Name Length        | ✅         | ✅         | ✅   | ✅      | ✅    | ✅           |
| Distance from Root | ✅         | ✅         | ✅   | ✅      | ✅    | ✅           |

### Transformer Examples

- **Position Transformers**: Use dimensions for X/Y coordinates
- **Size Transformers**: Use dimensions for node/edge size
- **Opacity Transformers**: Use dimensions for transparency
- **Color Transformers**: Use dimensions for hue/saturation/brightness
- **Stroke Transformers**: Use dimensions for line thickness

## Technical Implementation

### Dimension Interface

```typescript
interface Dimension {
  id: string;
  name: string;
  description: string;
  category: 'time' | 'family' | 'geography' | 'social' | 'relationship';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  extractValue: (
    individual: Individual,
    context: GedcomDataWithMetadata,
  ) => number;
  normalizeValue: (value: number, allValues: number[]) => number;
  getMinMax: (allIndividuals: Individual[]) => { min: number; max: number };
  isAvailable: (individual: Individual) => boolean;
}
```

### Transformer Integration

```typescript
interface TransformerParameters {
  horizontalDimension: string;
  verticalDimension: string;
  horizontalSpacing: number;
  verticalSpacing: number;
  horizontalRandomness: number;
  verticalRandomness: number;
  temperature: number;
}
```

### UI Components

- **Dimension Selector**: Dropdown for horizontal/vertical dimensions
- **Parameter Sliders**: Spacing, randomness, temperature controls
- **Live Preview**: Real-time parameter adjustment
- **Dimension Info**: Description and data availability for each dimension

## Next Steps

1. **Phase 1 (P0)**: Implement birth year, children count dimensions
2. **Phase 2 (P1)**: Add lifespan, name length, distance from root
3. **Phase 3 (P2)**: Implement geographic and advanced family dimensions
4. **Phase 4 (P3)**: Add social status and complex relationship dimensions

## Summary

Dimensions are reusable data mappings that can influence any visual attribute. This creates a flexible system where:

- **1 Dimension** → **Multiple Transformers** → **Multiple Visual Effects**
- **Multiple Dimensions** → **1 Transformer** → **Complex Visual Patterns**
- **User Control** → **Dimension Selection** → **Personalized Art**

## Success Metrics

- **User Engagement**: Time spent exploring different dimensions
- **Visual Variety**: Number of distinct visual patterns created
- **Data Discovery**: Users finding new insights about their family
- **Parameter Usage**: Frequency of dimension and parameter changes
