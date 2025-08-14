import { z } from 'zod';

/**
 * Zod schemas for shared types
 * These provide runtime validation and can be used to derive TypeScript types
 */

// Base schemas
export const IndividualSchema = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.enum(['M', 'F', 'U']).optional(), // M = Male, F = Female, U = Unknown
  birth: z
    .object({
      date: z.string().optional(),
      place: z.string().optional(),
    })
    .optional(),
  death: z
    .object({
      date: z.string().optional(),
      place: z.string().optional(),
    })
    .optional(),
  parents: z.array(z.string()),
  spouses: z.array(z.string()),
  children: z.array(z.string()),
  siblings: z.array(z.string()),
});

export const FamilySchema = z.object({
  id: z.string(),
  husband: IndividualSchema.optional(),
  wife: IndividualSchema.optional(),
  children: z.array(IndividualSchema),
});

export const GedcomDataSchema = z.object({
  individuals: z.record(z.string(), IndividualSchema),
  families: z.record(z.string(), FamilySchema),
});

// Edge schemas
export const EdgeMetadataSchema = z.object({
  relationshipStrength: z.number().min(0).max(1),
  isDirectRelationship: z.boolean(),
  relationshipDuration: z.number().optional(),
  overlapYears: z.number().optional(),
  familySize: z.number(),
  birthOrder: z.number().optional(),
  sameBirthCountry: z.boolean(),
  sameDeathCountry: z.boolean(),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  relationshipType: z.enum(['parent-child', 'spouse', 'sibling']),
  familyId: z.string().optional(),
  metadata: EdgeMetadataSchema,
});

// Graph analysis schemas
export const GraphStructureMetadataSchema = z.object({
  totalIndividuals: z.number(),
  totalFamilies: z.number(),
  totalEdges: z.number(),
  maxGenerations: z.number(),
  minGenerations: z.number(),
  generationDistribution: z.record(z.string(), z.number()),
  averageGenerationsPerBranch: z.number(),
  disconnectedComponents: z.number(),
  largestComponentSize: z.number(),
  averageConnectionsPerIndividual: z.number(),
  connectivityDensity: z.number().min(0).max(1),
  averageFamilySize: z.number(),
  largestFamilySize: z.number(),
  familySizeDistribution: z.record(z.string(), z.number()),
  childlessFamilies: z.number(),
  largeFamilies: z.number(),
  treeComplexity: z.number().min(0).max(1).nullable(),
  branchingFactor: z.number(),
  depthToBreadthRatio: z.number(),
});

export const TemporalMetadataSchema = z.object({
  earliestBirthYear: z.number(),
  latestBirthYear: z.number(),
  timeSpan: z.number(),
  generationTimeSpans: z.record(
    z.string(),
    z.object({
      earliest: z.number(),
      latest: z.number(),
      span: z.number(),
      averageBirthYear: z.number(),
    }),
  ),
  averageLifespan: z.number(),
  lifespanDistribution: z.record(z.string(), z.number()),
  longestLifespan: z.number(),
  shortestLifespan: z.number(),
  lifespanVariance: z.number(),
  historicalPeriods: z.array(
    z.object({
      period: z.string(),
      count: z.number(),
      percentage: z.number(),
      years: z.object({ start: z.number(), end: z.number() }),
    }),
  ),
  birthYearDistribution: z.record(z.string(), z.number()),
  deathYearDistribution: z.record(z.string(), z.number()),
  marriageYearDistribution: z.record(z.string(), z.number()),
  averageGenerationGap: z.number(),
  generationGapVariance: z.number(),
});

export const GeographicMetadataSchema = z.object({
  uniqueBirthPlaces: z.number(),
  uniqueDeathPlaces: z.number(),
  countriesRepresented: z.number(),
  statesProvincesRepresented: z.number(),
  birthPlaceDistribution: z.record(z.string(), z.number()),
  deathPlaceDistribution: z.record(z.string(), z.number()),
  countryDistribution: z.record(z.string(), z.number()),
  stateProvinceDistribution: z.record(z.string(), z.number()),
  countryPercentages: z.record(z.string(), z.number()),
  stateProvincePercentages: z.record(z.string(), z.number()),
  migrationPatterns: z.array(
    z.object({
      fromCountry: z.string(),
      toCountry: z.string(),
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  regions: z.array(
    z.object({
      region: z.string(),
      countries: z.array(z.string()),
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  geographicClusters: z.array(
    z.object({
      clusterId: z.string(),
      center: z.object({ lat: z.number(), lng: z.number() }),
      radius: z.number(),
      individuals: z.array(z.string()),
      count: z.number(),
    }),
  ),
  geographicDiversity: z.number().min(0).max(1),
  averageDistanceBetweenBirthPlaces: z.number(),
});

export const DemographicMetadataSchema = z.object({
  genderDistribution: z.object({
    male: z.object({ count: z.number(), percentage: z.number() }),
    female: z.object({ count: z.number(), percentage: z.number() }),
    unknown: z.object({ count: z.number(), percentage: z.number() }),
  }),
  ageDistribution: z.record(z.string(), z.number()),
  averageAgeAtDeath: z.number(),
  ageGroupDistribution: z.record(z.string(), z.number()),
  ageVariance: z.number(),
  averageChildrenPerFamily: z.number(),
  childlessFamilies: z.number(),
  largeFamilies: z.number(),
  familySizeVariance: z.number(),
  averageAgeAtMarriage: z.number(),
  marriageAgeDistribution: z.record(z.string(), z.number()),
  remarriageRate: z.number(),
  marriageAgeVariance: z.number(),
  averageChildrenPerWoman: z.number(),
  fertilityRate: z.number(),
  childbearingAgeRange: z.object({
    min: z.number(),
    max: z.number(),
    average: z.number(),
  }),
});

export const RelationshipMetadataSchema = z.object({
  relationshipTypeDistribution: z.record(z.string(), z.number()),
  averageRelationshipDistance: z.number(),
  relationshipDistanceDistribution: z.record(z.string(), z.number()),
  maxRelationshipDistance: z.number(),
  blendedFamilies: z.number(),
  stepRelationships: z.number(),
  adoptionRate: z.number(),
  multipleMarriages: z.number(),
  averageAncestorsPerGeneration: z.number(),
  missingAncestors: z.number(),
  ancestralCompleteness: z.number().min(0).max(1),
  ancestralDepth: z.number(),
  averageSiblingsPerFamily: z.number(),
  onlyChildren: z.number(),
  largeSiblingGroups: z.number(),
  cousinRelationships: z.object({
    firstCousins: z.number(),
    secondCousins: z.number(),
    thirdCousins: z.number(),
    distantCousins: z.number(),
  }),
  keyConnectors: z.array(z.string()),
  averageCentrality: z.number(),
  centralityDistribution: z.record(z.string(), z.number()),
});

export const EdgeAnalysisMetadataSchema = z.object({
  totalEdges: z.number(),
  parentChildEdges: z.number(),
  spouseEdges: z.number(),
  siblingEdges: z.number(),
  averageEdgeWeight: z.number(),
  edgeWeightDistribution: z.record(z.string(), z.number()),
  strongRelationships: z.number(),
  weakRelationships: z.number(),
  averageRelationshipDuration: z.number(),
  relationshipDurationDistribution: z.record(z.string(), z.number()),
  sameCountryRelationships: z.number(),
  crossCountryRelationships: z.number(),
  averageDistanceBetweenSpouses: z.number(),
});

export const TreeSummarySchema = z.object({
  totalIndividuals: z.number(),
  totalFamilies: z.number(),
  timeSpan: z.string(),
  geographicDiversity: z.string(),
  familyComplexity: z.string(),
  averageLifespan: z.number(),
  maxGenerations: z.number(),
});

// Enhanced metadata schemas
export const IndividualMetadataSchema = z.object({
  // Basic metadata
  lifespan: z.number().min(0).max(1).optional(),
  isAlive: z.boolean().optional(),
  birthMonth: z.number().min(1).max(12).optional(),
  zodiacSign: z.string().optional(),
  generation: z.number().nullable().optional(),
  relativeGenerationValue: z.number().min(0).max(100).optional(),

  // Graph-based fields
  centrality: z.number().optional(),
  relationshipCount: z.number().optional(),
  ancestorCount: z.number().optional(),
  descendantCount: z.number().optional(),
  siblingCount: z.number().optional(),
  cousinCount: z.number().optional(),

  // Geographic fields
  birthCountry: z.string().optional(),
  deathCountry: z.string().optional(),
  migrationDistance: z.number().optional(),

  // Temporal fields
  birthYear: z.number().optional(),
  deathYear: z.number().optional(),
  ageAtDeath: z.number().optional(),
  generationGap: z.number().optional(),
});

export const FamilyMetadataSchema = z.object({
  // Basic metadata
  numberOfChildren: z.number().min(0),

  // Graph-based fields
  familyComplexity: z.number().optional(),
  blendedFamily: z.boolean().optional(),
  remarriage: z.boolean().optional(),
  generation: z.number().optional(),

  // Geographic fields
  sameCountryParents: z.boolean().optional(),
  crossCountryMarriage: z.boolean().optional(),

  // Temporal fields
  marriageYear: z.number().optional(),
  averageChildAge: z.number().optional(),
  childSpacing: z.array(z.number()).optional(),
});

export const TreeMetadataSchema = z.object({
  // Graph structure
  graphStructure: GraphStructureMetadataSchema,

  // Temporal patterns
  temporalPatterns: TemporalMetadataSchema,

  // Geographic patterns
  geographicPatterns: GeographicMetadataSchema,

  // Demographics
  demographics: DemographicMetadataSchema,

  // Relationships
  relationships: RelationshipMetadataSchema,

  // Edges
  edges: z.array(EdgeSchema),
  edgeAnalysis: EdgeAnalysisMetadataSchema,

  // Summary statistics for quick access
  summary: TreeSummarySchema,
});

// Augmented schemas
export const AugmentedIndividualSchema = IndividualSchema.extend({
  metadata: IndividualMetadataSchema,
});

export const FamilyWithMetadataSchema = z.object({
  id: z.string(),
  husband: AugmentedIndividualSchema.optional(),
  wife: AugmentedIndividualSchema.optional(),
  children: z.array(AugmentedIndividualSchema),
  metadata: FamilyMetadataSchema,
});

// Graph data schemas
// Use z.record for JSON-serialized objects (Maps don't serialize to JSON)
export const GraphAdjacencyMapsSchema = z.object({
  parentToChildren: z.union([
    z.map(z.string(), z.array(z.string())),
    z.record(z.string(), z.array(z.string())),
  ]),
  childToParents: z.union([
    z.map(z.string(), z.array(z.string())),
    z.record(z.string(), z.array(z.string())),
  ]),
  spouseToSpouse: z.union([
    z.map(z.string(), z.array(z.string())),
    z.record(z.string(), z.array(z.string())),
  ]),
  siblingGroups: z.union([
    z.map(z.string(), z.array(z.string())),
    z.record(z.string(), z.array(z.string())),
  ]),
  familyMembership: z.union([
    z.map(z.string(), z.array(z.string())),
    z.record(z.string(), z.array(z.string())),
  ]),
});

export const WalkerTreeDataSchema = z.object({
  nodeHierarchy: z.union([
    z.map(
      z.string(),
      z.object({
        parent: z.string().optional(),
        children: z.array(z.string()),
        leftSibling: z.string().optional(),
        rightSibling: z.string().optional(),
        depth: z.number(),
      }),
    ),
    z.record(
      z.string(),
      z.object({
        parent: z.string().optional(),
        children: z.array(z.string()),
        leftSibling: z.string().optional(),
        rightSibling: z.string().optional(),
        depth: z.number(),
      }),
    ),
  ]),
  familyClusters: z.array(
    z.object({
      id: z.string(),
      parents: z.array(z.string()),
      children: z.array(z.string()),
      spouseOrder: z.array(z.string()),
      generation: z.number(),
    }),
  ),
  rootNodes: z.array(z.string()),
  generationLevels: z.union([
    z.map(z.number(), z.array(z.string())),
    z.record(z.string(), z.array(z.string())),
  ]),
});

export const GraphDataSchema = z.object({
  adjacencyMaps: GraphAdjacencyMapsSchema,
  traversalUtils: z.any(), // Functions can't be properly validated with Zod
  walkerData: WalkerTreeDataSchema,
});

export const GedcomDataWithMetadataSchema = z.object({
  individuals: z.record(z.string(), AugmentedIndividualSchema),
  families: z.record(z.string(), FamilyWithMetadataSchema),
  metadata: TreeMetadataSchema,
  graph: GraphDataSchema.optional(), // Optional for backward compatibility
});

// Helper function to create default metadata
const createDefaultMetadata = (
  individualCount: number,
  familyCount: number,
): TreeMetadata => ({
  graphStructure: {
    totalIndividuals: individualCount,
    totalFamilies: familyCount,
    totalEdges: 0,
    maxGenerations: 0,
    minGenerations: 0,
    generationDistribution: {},
    averageGenerationsPerBranch: 0,
    disconnectedComponents: 1,
    largestComponentSize: individualCount,
    averageConnectionsPerIndividual: 0,
    connectivityDensity: 0,
    averageFamilySize: 0,
    largestFamilySize: 0,
    familySizeDistribution: {},
    childlessFamilies: 0,
    largeFamilies: 0,
    treeComplexity: null,
    branchingFactor: 0,
    depthToBreadthRatio: 0,
  },
  temporalPatterns: {
    earliestBirthYear: 0,
    latestBirthYear: 0,
    timeSpan: 0,
    generationTimeSpans: {},
    averageLifespan: 0,
    lifespanDistribution: {},
    longestLifespan: 0,
    shortestLifespan: 0,
    lifespanVariance: 0,
    historicalPeriods: [],
    birthYearDistribution: {},
    deathYearDistribution: {},
    marriageYearDistribution: {},
    averageGenerationGap: 0,
    generationGapVariance: 0,
  },
  geographicPatterns: {
    uniqueBirthPlaces: 0,
    uniqueDeathPlaces: 0,
    countriesRepresented: 0,
    statesProvincesRepresented: 0,
    birthPlaceDistribution: {},
    deathPlaceDistribution: {},
    countryDistribution: {},
    stateProvinceDistribution: {},
    countryPercentages: {},
    stateProvincePercentages: {},
    migrationPatterns: [],
    regions: [],
    geographicClusters: [],
    geographicDiversity: 0,
    averageDistanceBetweenBirthPlaces: 0,
  },
  demographics: {
    genderDistribution: {
      male: { count: 0, percentage: 0 },
      female: { count: 0, percentage: 0 },
      unknown: { count: 0, percentage: 0 },
    },
    ageDistribution: {},
    averageAgeAtDeath: 0,
    ageGroupDistribution: {},
    ageVariance: 0,
    averageChildrenPerFamily: 0,
    childlessFamilies: 0,
    largeFamilies: 0,
    familySizeVariance: 0,
    averageAgeAtMarriage: 0,
    marriageAgeDistribution: {},
    remarriageRate: 0,
    marriageAgeVariance: 0,
    averageChildrenPerWoman: 0,
    fertilityRate: 0,
    childbearingAgeRange: { min: 0, max: 0, average: 0 },
  },
  relationships: {
    relationshipTypeDistribution: {},
    averageRelationshipDistance: 0,
    relationshipDistanceDistribution: {},
    maxRelationshipDistance: 0,
    blendedFamilies: 0,
    stepRelationships: 0,
    adoptionRate: 0,
    multipleMarriages: 0,
    averageAncestorsPerGeneration: 0,
    missingAncestors: 0,
    ancestralCompleteness: 0,
    ancestralDepth: 0,
    averageSiblingsPerFamily: 0,
    onlyChildren: 0,
    largeSiblingGroups: 0,
    cousinRelationships: {
      firstCousins: 0,
      secondCousins: 0,
      thirdCousins: 0,
      distantCousins: 0,
    },
    keyConnectors: [],
    averageCentrality: 0,
    centralityDistribution: {},
  },
  edges: [],
  edgeAnalysis: {
    totalEdges: 0,
    parentChildEdges: 0,
    spouseEdges: 0,
    siblingEdges: 0,
    averageEdgeWeight: 0,
    edgeWeightDistribution: {},
    strongRelationships: 0,
    weakRelationships: 0,
    averageRelationshipDuration: 0,
    relationshipDurationDistribution: {},
    sameCountryRelationships: 0,
    crossCountryRelationships: 0,
    averageDistanceBetweenSpouses: 0,
  },
  summary: {
    totalIndividuals: individualCount,
    totalFamilies: familyCount,
    timeSpan: 'Unknown',
    geographicDiversity: 'Unknown',
    familyComplexity: 'Unknown',
    averageLifespan: 0,
    maxGenerations: 0,
  },
});

// Alternative format for enhanced data (array of individuals)
export const EnhancedIndividualArraySchema = z.array(AugmentedIndividualSchema);

// Union schema for flexible input validation
// First try to parse as full schema with metadata
const FlexibleGedcomDataSchemaBase = z.union([
  GedcomDataWithMetadataSchema,
  z.object({
    individuals: z.record(z.string(), AugmentedIndividualSchema),
    families: z.record(z.string(), FamilyWithMetadataSchema),
    metadata: TreeMetadataSchema.optional(),
  }),
  z.object({
    individuals: z.array(AugmentedIndividualSchema),
    families: z.array(FamilyWithMetadataSchema),
  }),
  EnhancedIndividualArraySchema,
]);

export const FlexibleGedcomDataSchema = FlexibleGedcomDataSchemaBase;

// Type exports derived from schemas
export type Individual = z.infer<typeof IndividualSchema>;
export type Family = z.infer<typeof FamilySchema>;
export type GedcomData = z.infer<typeof GedcomDataSchema>;
export type IndividualMetadata = z.infer<typeof IndividualMetadataSchema>;
export type FamilyMetadata = z.infer<typeof FamilyMetadataSchema>;
export type TreeMetadata = z.infer<typeof TreeMetadataSchema>;
export type AugmentedIndividual = z.infer<typeof AugmentedIndividualSchema>;
export type FamilyWithMetadata = z.infer<typeof FamilyWithMetadataSchema>;
export type GedcomDataWithMetadata = z.infer<
  typeof GedcomDataWithMetadataSchema
>;

// Graph analysis types
export type Edge = z.infer<typeof EdgeSchema>;
export type EdgeMetadata = z.infer<typeof EdgeMetadataSchema>;
export type GraphStructureMetadata = z.infer<
  typeof GraphStructureMetadataSchema
>;
export type TemporalMetadata = z.infer<typeof TemporalMetadataSchema>;
export type GeographicMetadata = z.infer<typeof GeographicMetadataSchema>;
export type DemographicMetadata = z.infer<typeof DemographicMetadataSchema>;
export type RelationshipMetadata = z.infer<typeof RelationshipMetadataSchema>;
export type EdgeAnalysisMetadata = z.infer<typeof EdgeAnalysisMetadataSchema>;
export type TreeSummary = z.infer<typeof TreeSummarySchema>;

// Validation functions
export const validateGedcomData = (data: unknown): GedcomData => {
  return GedcomDataSchema.parse(data);
};

export const validateGedcomDataWithMetadata = (
  data: unknown,
): GedcomDataWithMetadata => {
  return GedcomDataWithMetadataSchema.parse(data);
};

export const validateFlexibleGedcomData = (
  data: unknown,
): GedcomDataWithMetadata => {
  const result = FlexibleGedcomDataSchema.parse(data);

  let validatedData: GedcomDataWithMetadata;

  // If it's just an array of individuals, convert to full structure
  if (Array.isArray(result)) {
    // Convert array to ID-keyed object
    const individualsById: Record<string, AugmentedIndividual> = {};
    result.forEach((individual) => {
      individualsById[individual.id] = individual;
    });

    validatedData = {
      individuals: individualsById,
      families: {},
      metadata: createDefaultMetadata(result.length, 0),
    };
  } else if (Array.isArray(result.individuals)) {
    // Convert array format to ID-keyed format
    const individualsById: Record<string, AugmentedIndividual> = {};
    result.individuals.forEach((individual) => {
      individualsById[individual.id] = individual;
    });

    const familiesById: Record<string, FamilyWithMetadata> = {};
    if (Array.isArray(result.families)) {
      result.families.forEach((family) => {
        familiesById[family.id] = family;
      });
    }

    validatedData = {
      individuals: individualsById,
      families: familiesById,
      metadata:
        ('metadata' in result
          ? (result as { metadata?: TreeMetadata }).metadata
          : undefined) ??
        createDefaultMetadata(
          Object.keys(individualsById).length,
          Object.keys(familiesById).length,
        ),
    };
  } else if ('individuals' in result && 'families' in result) {
    // Already in correct format, but might be missing metadata
    if ('metadata' in result && result.metadata) {
      validatedData = result as GedcomDataWithMetadata;
    } else {
      // Add default metadata
      validatedData = {
        ...result,
        metadata: createDefaultMetadata(
          Object.keys(result.individuals).length,
          Object.keys(result.families).length,
        ),
      } as GedcomDataWithMetadata;
    }
  } else {
    // Fallback - should not happen with proper schema validation
    validatedData = result;
  }

  // Always rebuild graph data on the client-side since functions can't be serialized
  // This is done in a separate function to avoid circular dependencies
  return validatedData;
};

// Safe validation functions that don't throw
export const safeValidateGedcomData = (data: unknown) => {
  return GedcomDataSchema.safeParse(data);
};

export const safeValidateGedcomDataWithMetadata = (data: unknown) => {
  return GedcomDataWithMetadataSchema.safeParse(data);
};

export const safeValidateFlexibleGedcomData = (data: unknown) => {
  return FlexibleGedcomDataSchema.safeParse(data);
};
