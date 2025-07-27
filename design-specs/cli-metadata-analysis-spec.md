# CLI Metadata Analysis & Graph Calculation Specification

## Overview

This document defines the CLI-level metadata analysis system that performs comprehensive graph calculations and analysis during the GEDCOM parsing/augmentation phase. This analysis runs **once** during CLI processing and provides rich, structured metadata for transformers to consume.

## Core Principles

1. **Single-Pass Analysis**: All calculations performed once during CLI processing
2. **Pure Functions**: All analysis functions are pure and testable
3. **PII Safety**: No sensitive data in output metadata
4. **Performance**: Optimized for large family trees
5. **Extensibility**: Easy to add new analysis functions
6. **Structured Data**: Rich metadata that transformers can easily consume
7. **MCP Ready**: Structured inputs/outputs for future MCP implementations

## Analysis Categories

### 1. Graph Structure Analysis

```typescript
interface GraphStructureMetadata {
  // Tree topology
  totalIndividuals: number;
  totalFamilies: number;
  totalEdges: number;

  // Generation analysis
  maxGenerations: number;
  minGenerations: number;
  generationDistribution: Record<number, number>;
  averageGenerationsPerBranch: number;

  // Connectivity analysis
  disconnectedComponents: number;
  largestComponentSize: number;
  averageConnectionsPerIndividual: number;
  connectivityDensity: number; // 0-1 scale

  // Family structure
  averageFamilySize: number;
  largestFamilySize: number;
  familySizeDistribution: Record<number, number>;
  childlessFamilies: number;
  largeFamilies: number; // 5+ children

  // Tree complexity
  treeComplexity: number; // 0-1 scale based on branching, depth, etc.
  branchingFactor: number; // Average children per family
  depthToBreadthRatio: number;
}
```

### 2. Temporal Analysis

```typescript
interface TemporalMetadata {
  // Time span analysis
  earliestBirthYear: number;
  latestBirthYear: number;
  timeSpan: number;

  // Generation timing
  generationTimeSpans: Record<
    number,
    {
      earliest: number;
      latest: number;
      span: number;
      averageBirthYear: number;
    }
  >;

  // Life expectancy analysis
  averageLifespan: number;
  lifespanDistribution: Record<string, number>;
  longestLifespan: number;
  shortestLifespan: number;
  lifespanVariance: number;

  // Historical periods
  historicalPeriods: {
    period: string;
    count: number;
    percentage: number;
    years: { start: number; end: number };
  }[];

  // Temporal patterns
  birthYearDistribution: Record<number, number>;
  deathYearDistribution: Record<number, number>;
  marriageYearDistribution: Record<number, number>;

  // Generation gaps
  averageGenerationGap: number;
  generationGapVariance: number;
}
```

### 3. Geographic Analysis

```typescript
interface GeographicMetadata {
  // Location diversity
  uniqueBirthPlaces: number;
  uniqueDeathPlaces: number;
  countriesRepresented: number;
  statesProvincesRepresented: number;

  // Geographic distribution
  birthPlaceDistribution: Record<string, number>;
  deathPlaceDistribution: Record<string, number>;
  countryDistribution: Record<string, number>;
  stateProvinceDistribution: Record<string, number>;

  // Percentage calculations
  countryPercentages: Record<string, number>; // % of individuals born in each country
  stateProvincePercentages: Record<string, number>;

  // Migration patterns
  migrationPatterns: {
    fromCountry: string;
    toCountry: string;
    count: number;
    percentage: number;
  }[];

  // Regional analysis
  regions: {
    region: string;
    countries: string[];
    count: number;
    percentage: number;
  }[];

  // Geographic clustering
  geographicClusters: {
    clusterId: string;
    center: { lat: number; lng: number };
    radius: number;
    individuals: string[];
    count: number;
  }[];

  // Geographic diversity metrics
  geographicDiversity: number; // 0-1 scale
  averageDistanceBetweenBirthPlaces: number;
}
```

### 4. Demographic Analysis

```typescript
interface DemographicMetadata {
  // Gender analysis
  genderDistribution: {
    male: { count: number; percentage: number };
    female: { count: number; percentage: number };
    unknown: { count: number; percentage: number };
  };

  // Age analysis
  ageDistribution: Record<string, number>;
  averageAgeAtDeath: number;
  ageGroupDistribution: Record<string, number>;
  ageVariance: number;

  // Family dynamics
  averageChildrenPerFamily: number;
  childlessFamilies: number;
  largeFamilies: number; // 5+ children
  familySizeVariance: number;

  // Marriage patterns
  averageAgeAtMarriage: number;
  marriageAgeDistribution: Record<string, number>;
  remarriageRate: number;
  marriageAgeVariance: number;

  // Fertility analysis
  averageChildrenPerWoman: number;
  fertilityRate: number;
  childbearingAgeRange: { min: number; max: number; average: number };
}
```

### 5. Relationship Analysis

```typescript
interface RelationshipMetadata {
  // Relationship types
  relationshipTypeDistribution: Record<string, number>;

  // Connection strength
  averageRelationshipDistance: number;
  relationshipDistanceDistribution: Record<number, number>;
  maxRelationshipDistance: number;

  // Family complexity
  blendedFamilies: number;
  stepRelationships: number;
  adoptionRate: number;
  multipleMarriages: number;

  // Ancestral patterns
  averageAncestorsPerGeneration: number;
  missingAncestors: number;
  ancestralCompleteness: number; // 0-1 scale
  ancestralDepth: number;

  // Sibling patterns
  averageSiblingsPerFamily: number;
  onlyChildren: number;
  largeSiblingGroups: number; // 5+ siblings

  // Cousin relationships
  cousinRelationships: {
    firstCousins: number;
    secondCousins: number;
    thirdCousins: number;
    distantCousins: number;
  };

  // Relationship centrality
  keyConnectors: string[]; // Individual IDs with most connections
  averageCentrality: number;
  centralityDistribution: Record<string, number>;
}
```

### 6. Edge Analysis

```typescript
interface EdgeMetadata {
  // Edge types and counts
  totalEdges: number;
  parentChildEdges: number;
  spouseEdges: number;
  siblingEdges: number;

  // Edge properties
  averageEdgeWeight: number;
  edgeWeightDistribution: Record<string, number>;

  // Relationship strength
  strongRelationships: number; // High-weight edges
  weakRelationships: number; // Low-weight edges

  // Temporal edge properties
  averageRelationshipDuration: number;
  relationshipDurationDistribution: Record<string, number>;

  // Geographic edge properties
  sameCountryRelationships: number;
  crossCountryRelationships: number;
  averageDistanceBetweenSpouses: number;
}
```

## Analysis Functions

### Pure Analysis Functions

```typescript
// Graph structure analysis
export const analyzeGraphStructure = (
  individuals: Individual[],
  families: Family[],
): GraphStructureMetadata => {
  // Pure function implementation
  // Calculate tree topology, generations, connectivity, etc.
};

// Temporal analysis
export const analyzeTemporalPatterns = (
  individuals: Individual[],
  families: Family[],
): TemporalMetadata => {
  // Pure function implementation
  // Calculate time spans, life expectancy, historical periods, etc.
};

// Geographic analysis
export const analyzeGeographicPatterns = (
  individuals: Individual[],
): GeographicMetadata => {
  // Pure function implementation
  // Calculate location distributions, migration patterns, etc.
};

// Demographic analysis
export const analyzeDemographics = (
  individuals: Individual[],
  families: Family[],
): DemographicMetadata => {
  // Pure function implementation
  // Calculate gender, age, family dynamics, etc.
};

// Relationship analysis
export const analyzeRelationships = (
  individuals: Individual[],
  families: Family[],
): RelationshipMetadata => {
  // Pure function implementation
  // Calculate relationship types, distances, complexity, etc.
};

// Edge analysis
export const analyzeEdges = (edges: Edge[]): EdgeMetadata => {
  // Pure function implementation
  // Calculate edge properties, weights, durations, etc.
};
```

### Edge Generation Functions

```typescript
// Generate all edges from families
export const generateEdges = (
  individuals: Individual[],
  families: Family[],
): Edge[] => {
  const edges: Edge[] = [];

  // Generate parent-child edges
  for (const family of families) {
    for (const child of family.children) {
      if (family.husband) {
        edges.push(
          createParentChildEdge(family.husband.id, child.id, family.id),
        );
      }
      if (family.wife) {
        edges.push(createParentChildEdge(family.wife.id, child.id, family.id));
      }
    }

    // Generate spouse edges
    if (family.husband && family.wife) {
      edges.push(
        createSpouseEdge(family.husband.id, family.wife.id, family.id),
      );
    }

    // Generate sibling edges
    if (family.children.length > 1) {
      for (let i = 0; i < family.children.length; i++) {
        for (let j = i + 1; j < family.children.length; j++) {
          edges.push(
            createSiblingEdge(
              family.children[i].id,
              family.children[j].id,
              family.id,
            ),
          );
        }
      }
    }
  }

  return edges;
};

// Create edge with metadata
export const createEdge = (
  sourceId: string,
  targetId: string,
  type: 'parent-child' | 'spouse' | 'sibling',
  familyId?: string,
): Edge => {
  return {
    id: generateEdgeId(sourceId, targetId, type, familyId),
    sourceId,
    targetId,
    relationshipType: type,
    familyId,
    metadata: calculateEdgeMetadata(sourceId, targetId, type, familyId),
  };
};
```

## Enhanced Metadata Structure

### Updated TreeMetadata Interface

```typescript
interface TreeMetadata {
  // Graph structure
  graphStructure: GraphStructureMetadata;

  // Temporal patterns
  temporalPatterns: TemporalMetadata;

  // Geographic patterns
  geographicPatterns: GeographicMetadata;

  // Demographics
  demographics: DemographicMetadata;

  // Relationships
  relationships: RelationshipMetadata;

  // Edges
  edges: Edge[];
  edgeAnalysis: EdgeMetadata;

  // Summary statistics for quick access
  summary: {
    totalIndividuals: number;
    totalFamilies: number;
    timeSpan: string;
    geographicDiversity: string;
    familyComplexity: string;
    averageLifespan: number;
    maxGenerations: number;
  };
}
```

### Individual and Family Metadata Enhancement

```typescript
interface IndividualMetadata {
  // Existing fields...
  lifespan?: number;
  isAlive?: boolean;
  birthMonth?: number;
  zodiacSign?: string;

  // New graph-based fields
  generation?: number;
  centrality?: number;
  relationshipCount?: number;
  ancestorCount?: number;
  descendantCount?: number;
  siblingCount?: number;
  cousinCount?: number;

  // Geographic fields
  birthCountry?: string;
  deathCountry?: string;
  migrationDistance?: number;

  // Temporal fields
  birthYear?: number;
  deathYear?: number;
  ageAtDeath?: number;
  generationGap?: number;
}

interface FamilyMetadata {
  // Existing fields...
  numberOfChildren: number;

  // New graph-based fields
  familyComplexity?: number;
  blendedFamily?: boolean;
  remarriage?: boolean;
  generation?: number;

  // Geographic fields
  sameCountryParents?: boolean;
  crossCountryMarriage?: boolean;

  // Temporal fields
  marriageYear?: number;
  averageChildAge?: number;
  childSpacing?: number[];
}
```

## Integration with Existing Pipeline

### Updated CLI Processing

```typescript
export const processGedcomWithComprehensiveAnalysis = (
  individuals: Individual[],
  families: Family[],
): GedcomDataWithMetadata => {
  // 1. Generate edges
  const edges = generateEdges(individuals, families);

  // 2. Perform comprehensive analysis
  const graphStructure = analyzeGraphStructure(individuals, families);
  const temporalPatterns = analyzeTemporalPatterns(individuals, families);
  const geographicPatterns = analyzeGeographicPatterns(individuals);
  const demographics = analyzeDemographics(individuals, families);
  const relationships = analyzeRelationships(individuals, families);
  const edgeAnalysis = analyzeEdges(edges);

  // 3. Create enhanced metadata
  const enhancedMetadata: TreeMetadata = {
    graphStructure,
    temporalPatterns,
    geographicPatterns,
    demographics,
    relationships,
    edges,
    edgeAnalysis,
    summary: generateSummary({
      graphStructure,
      temporalPatterns,
      geographicPatterns,
      demographics,
      relationships,
    }),
  };

  // 4. Enhance individual and family metadata with graph data
  const enhancedIndividuals = enhanceIndividualMetadata(
    individuals,
    enhancedMetadata,
  );
  const enhancedFamilies = enhanceFamilyMetadata(families, enhancedMetadata);

  // 5. Return enhanced data structure
  return {
    individuals: enhancedIndividuals,
    families: enhancedFamilies,
    metadata: enhancedMetadata,
  };
};
```

## Performance Considerations

### Optimization Strategies

1. **Single-Pass Algorithms**: Calculate multiple metrics in one pass
2. **Memoization**: Cache expensive calculations
3. **Lazy Evaluation**: Only calculate what's needed
4. **Batch Processing**: Process large datasets in chunks
5. **Indexed Lookups**: Use Maps for O(1) access

### Memory Management

```typescript
// Use efficient data structures
const individualMap = new Map(individuals.map((ind) => [ind.id, ind]));
const familyMap = new Map(families.map((fam) => [fam.id, fam]));

// Batch processing for large datasets
const processInBatches = <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => void,
) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    processor(batch);
  }
};
```

## Testing Strategy

### Unit Tests

```typescript
describe('Graph Analysis Functions', () => {
  it('should calculate graph structure correctly', () => {
    const result = analyzeGraphStructure(mockIndividuals, mockFamilies);
    expect(result.totalIndividuals).toBe(10);
    expect(result.maxGenerations).toBe(3);
    expect(result.treeComplexity).toBeGreaterThan(0);
    expect(result.treeComplexity).toBeLessThanOrEqual(1);
  });

  it('should calculate geographic patterns correctly', () => {
    const result = analyzeGeographicPatterns(mockIndividuals);
    expect(result.countriesRepresented).toBe(3);
    expect(result.countryPercentages['USA']).toBe(0.6); // 60% born in USA
    expect(result.geographicDiversity).toBeGreaterThan(0);
  });

  it('should generate edges correctly', () => {
    const edges = generateEdges(mockIndividuals, mockFamilies);
    expect(edges).toHaveLength(15); // Expected edge count
    expect(edges[0].relationshipType).toBe('parent-child');
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Analysis', () => {
  it('should process complete GEDCOM data with comprehensive analysis', () => {
    const result = processGedcomWithComprehensiveAnalysis(
      mockIndividuals,
      mockFamilies,
    );
    expect(result.edges).toBeDefined();
    expect(result.metadata.graphStructure).toBeDefined();
    expect(result.metadata.geographicPatterns).toBeDefined();
    expect(result.metadata.summary).toBeDefined();
    expect(result.individuals[0].metadata.generation).toBeDefined();
  });
});
```

## MCP Integration

### Structured Data for MCP

```typescript
// Structured data for MCP with LLM-safe summaries
interface MCPAnalysisContext {
  // Rich metadata for transformers
  graphStructure: GraphStructureMetadata;
  temporalPatterns: TemporalMetadata;
  geographicPatterns: GeographicMetadata;
  demographics: DemographicMetadata;
  relationships: RelationshipMetadata;
  edges: Edge[];
  edgeAnalysis: EdgeMetadata;

  // LLM-safe summary for natural language processing
  summary: {
    totalIndividuals: number;
    timeSpan: string;
    geographicDiversity: string;
    familyComplexity: string;
    averageLifespan: number;
    maxGenerations: number;
    keyInsights: string[];
  };

  // Structured prompts for different transformer types
  transformerPrompts: {
    layout: string;
    color: string;
    animation: string;
    style: string;
  };
}
```

## Implementation Phases

### Phase 1: Core Graph Analysis

- [ ] Implement `analyzeGraphStructure`
- [ ] Implement `analyzeTemporalPatterns`
- [ ] Implement `analyzeGeographicPatterns`
- [ ] Implement `analyzeDemographics`
- [ ] Implement `analyzeRelationships`

### Phase 2: Edge Generation

- [ ] Implement `generateEdges`
- [ ] Implement `analyzeEdges`
- [ ] Create edge metadata calculation functions

### Phase 3: Integration

- [ ] Update CLI processing pipeline
- [ ] Enhance individual and family metadata
- [ ] Create summary generation functions

### Phase 4: Testing & Optimization

- [ ] Comprehensive unit tests
- [ ] Performance optimization
- [ ] Memory management improvements

### Phase 5: MCP Preparation

- [ ] Create MCP-safe data structures
- [ ] Implement LLM-friendly summaries
- [ ] Prepare structured prompts for transformers

## Benefits for Transformers

This comprehensive metadata analysis will enable transformers to:

1. **Make Informed Decisions**: Access rich data about tree structure, demographics, and patterns
2. **Create Meaningful Visualizations**: Use geographic, temporal, and relationship data for layout
3. **Generate Contextual Art**: Apply different styles based on historical periods, cultural patterns
4. **Optimize Performance**: Pre-calculated metrics eliminate runtime computation
5. **Ensure Consistency**: Standardized data structure across all transformers
6. **Support MCP**: Structured data ready for LLM consumption

---

_Last updated: 2025-01-27_
