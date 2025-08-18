/**
 * Functional metadata transformation pipeline
 * Pure functions for extracting and transforming metadata from GEDCOM data
 */

import type {
  Individual,
  Family,
  IndividualMetadata,
  FamilyMetadata,
  TreeMetadata,
  AugmentedIndividual,
  FamilyWithMetadata,
  GedcomDataWithMetadata,
} from '../../shared/types';
import {
  getMetadataFieldsByScope,
  type MetadataFieldConfig,
  type TransformationContext,
} from './metadata-extraction-config';
import {
  analyzeGraphStructure,
  analyzeTemporalPatterns,
  analyzeGeographicPatterns,
  analyzeDemographics,
  analyzeRelationships,
  generateEdges,
  analyzeEdges,
  generateTreeSummary,
  calculateGeneration,
  calculateGenerationsForAll,
} from './graph-analysis';
import { buildGraphData } from './graph-utilities';

/**
 * PII Masking utilities - pure functions
 */

/**
 * Pure function to mask a lifespan value (0-1 normalized)
 */
export const maskLifespan = (value: number): number => {
  // Add small random noise to mask exact values
  const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
  return Math.max(0, Math.min(1, value + noise));
};

/**
 * Pure function to mask a boolean value (for isAlive)
 */
export const maskBoolean = (value: boolean): boolean => {
  // For now, return the original value
  // In a real implementation, you might want to add noise or use a different strategy
  return value;
};

/**
 * Pure function to mask a birth month (1-12)
 */
export const maskBirthMonth = (value: number): number => {
  // Add small random noise, keeping within 1-12 range
  const noise = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  return Math.max(1, Math.min(12, value + noise));
};

/**
 * Pure function to mask a value based on field configuration
 */
export const maskValue = (
  value: unknown,
  fieldConfig: MetadataFieldConfig,
): unknown => {
  if (!fieldConfig.requiresMasking) return value;

  if (fieldConfig.maskFunction) {
    return fieldConfig.maskFunction(value);
  }

  // Default masking based on data type
  switch (fieldConfig.dataType) {
    case 'float':
      if (fieldConfig.fieldName === 'lifespan' && typeof value === 'number') {
        return maskLifespan(value);
      }
      break;
    case 'boolean':
      if (fieldConfig.fieldName === 'isAlive' && typeof value === 'boolean') {
        return maskBoolean(value);
      }
      break;
    case 'integer':
      if (fieldConfig.fieldName === 'birthMonth' && typeof value === 'number') {
        return maskBirthMonth(value);
      }
      break;
  }

  return value;
};

/**
 * Pure function to validate a value using field configuration
 */
export const validateValue = (
  value: unknown,
  fieldConfig: MetadataFieldConfig,
): boolean => {
  if (value === null || value === undefined) return false;

  if (fieldConfig.validate) {
    return fieldConfig.validate(value);
  }

  // Basic type validation
  switch (fieldConfig.dataType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
    case 'float':
    case 'integer':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
};

/**
 * Pure function to extract metadata for an individual
 */
export const extractIndividualMetadata = (
  individual: Individual,
  context: Omit<TransformationContext, 'individual'>,
): IndividualMetadata => {
  const metadata: IndividualMetadata = {};

  // Get individual-level metadata fields
  const individualFields = getMetadataFieldsByScope('individual');

  for (const fieldConfig of individualFields) {
    try {
      // Create context with individual
      const individualContext: TransformationContext = {
        ...context,
        individual,
      };

      // Transform the raw data
      let value: unknown = null;
      if (fieldConfig.transform) {
        value = fieldConfig.transform(individualContext);
      }

      // Validate the value
      if (
        value !== null &&
        value !== undefined &&
        !validateValue(value, fieldConfig)
      ) {
        console.warn(`Validation failed for ${fieldConfig.fieldName}:`, value);
        continue;
      }

      // Apply PII masking if required
      if (value !== null && value !== undefined) {
        value = maskValue(value, fieldConfig);
      }

      // Store the value
      if (value !== null && value !== undefined) {
        (metadata as unknown as Record<string, unknown>)[
          fieldConfig.fieldName
        ] = value;
      }
    } catch (error) {
      console.warn(
        `Error extracting metadata for ${fieldConfig.fieldName}:`,
        error,
      );
    }
  }

  return metadata;
};

/**
 * Pure function to extract family metadata
 */
export const extractFamilyMetadata = (
  family: Family,
  context: Omit<TransformationContext, 'family'>,
): FamilyMetadata => {
  const metadata: FamilyMetadata = {
    numberOfChildren: family.children.length,
  };

  // Get family-level metadata fields
  const familyFields = getMetadataFieldsByScope('family');

  for (const fieldConfig of familyFields) {
    try {
      // Create context with family
      const familyContext: TransformationContext = {
        ...context,
        family,
      };

      // Transform the raw data
      let value: unknown = null;
      if (fieldConfig.transform) {
        value = fieldConfig.transform(familyContext);
      }

      // Validate the value
      if (
        value !== null &&
        value !== undefined &&
        !validateValue(value, fieldConfig)
      ) {
        console.warn(`Validation failed for ${fieldConfig.fieldName}:`, value);
        continue;
      }

      // Apply PII masking if required
      if (value !== null && value !== undefined) {
        value = maskValue(value, fieldConfig);
      }

      // Store the value
      if (value !== null && value !== undefined) {
        (metadata as unknown as Record<string, unknown>)[
          fieldConfig.fieldName
        ] = value;
      }
    } catch (error) {
      console.warn(
        `Error extracting metadata for ${fieldConfig.fieldName}:`,
        error,
      );
    }
  }

  return metadata;
};

/**
 * Pure function to extract metadata for the entire tree
 * This is a legacy function that returns basic metadata
 * For comprehensive analysis, use transformGedcomDataWithComprehensiveAnalysis
 */
export const extractTreeMetadata = (
  context: Omit<TransformationContext, 'individual' | 'family'>,
): TreeMetadata => {
  // This function is kept for backward compatibility
  // It returns a minimal TreeMetadata structure
  return {
    graphStructure: {
      totalIndividuals: context.allIndividuals?.length ?? 0,
      totalFamilies: context.allFamilies?.length ?? 0,
      totalEdges: 0,
      maxGenerations: 0,
      minGenerations: 0,
      generationDistribution: {},
      averageGenerationsPerBranch: 0,
      disconnectedComponents: 1,
      largestComponentSize: context.allIndividuals?.length ?? 0,
      averageConnectionsPerIndividual: 0,
      connectivityDensity: 0,
      averageFamilySize: 0,
      largestFamilySize: 0,
      familySizeDistribution: {},
      childlessFamilies: 0,
      largeFamilies: 0,
      treeComplexity: 0,
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
      totalIndividuals: context.allIndividuals?.length ?? 0,
      totalFamilies: context.allFamilies?.length ?? 0,
      timeSpan: 'Unknown',
      geographicDiversity: 'Unknown',
      familyComplexity: 'Unknown',
      averageLifespan: 0,
      maxGenerations: 0,
    },
  };
};

/**
 * Pure function to transform individuals with metadata
 */
export const transformIndividualsWithMetadata = (
  individuals: Individual[],
  context: Omit<TransformationContext, 'individual' | 'family'>,
): Record<string, AugmentedIndividual> => {
  const individualsById: Record<string, AugmentedIndividual> = {};

  individuals.forEach((individual) => {
    const metadata = extractIndividualMetadata(individual, context);
    individualsById[individual.id] = {
      ...individual,
      metadata,
    };
  });

  return individualsById;
};

/**
 * Pure function to transform families with metadata
 */
export const transformFamiliesWithMetadata = (
  families: Family[],
  individualsWithMetadata: Record<string, AugmentedIndividual>,
  context: Omit<TransformationContext, 'individual' | 'family'>,
): Record<string, FamilyWithMetadata> => {
  const familiesById: Record<string, FamilyWithMetadata> = {};

  families.forEach((family) => {
    const metadata = extractFamilyMetadata(family, context);

    familiesById[family.id] = {
      id: family.id,
      husband: family.husband
        ? individualsWithMetadata[family.husband.id]
        : undefined,
      wife: family.wife ? individualsWithMetadata[family.wife.id] : undefined,
      children: family.children
        .map((child) => individualsWithMetadata[child.id])
        .filter(Boolean),
      metadata,
    };
  });

  return familiesById;
};

/**
 * Main transformation function - pure function
 */
export const transformGedcomDataWithMetadata = (
  individuals: Individual[],
  families: Family[],
  rootIndividual?: Individual,
): GedcomDataWithMetadata => {
  // Create transformation context
  const context: Omit<TransformationContext, 'individual' | 'family'> = {
    allIndividuals: individuals,
    allFamilies: families,
    rootIndividual,
  };

  // Transform individuals with metadata
  const individualsWithMetadata = transformIndividualsWithMetadata(
    individuals,
    context,
  );

  // Transform families with metadata
  const familiesWithMetadata = transformFamiliesWithMetadata(
    families,
    individualsWithMetadata,
    context,
  );

  // Extract tree-level metadata
  const treeMetadata = extractTreeMetadata(context);

  return {
    individuals: individualsWithMetadata,
    families: familiesWithMetadata,
    metadata: treeMetadata,
  } as GedcomDataWithMetadata;
};

/**
 * Enhanced transformation function with comprehensive graph analysis
 */
export const transformGedcomDataWithComprehensiveAnalysis = (
  individuals: Individual[],
  families: Family[],
  _rootIndividual?: Individual,
): GedcomDataWithMetadata => {
  console.log('    🕰️ Starting comprehensive transformation...');
  const analysisStart = Date.now();

  // 1. Generate edges
  console.log('    1/7 Generating edges...');
  const edges = generateEdges(individuals, families);
  console.log(
    `       Generated ${edges.length} edges (${Date.now() - analysisStart}ms)`,
  );

  // 2. Perform comprehensive analysis
  console.log('    2/7 Analyzing graph structure...');
  const graphStructure = analyzeGraphStructure(individuals, families);
  console.log(
    `       Graph structure complete (${Date.now() - analysisStart}ms)`,
  );

  console.log('    3/7 Analyzing temporal patterns...');
  const temporalPatterns = analyzeTemporalPatterns(individuals, families);
  console.log(
    `       Temporal patterns complete (${Date.now() - analysisStart}ms)`,
  );

  console.log('    4/7 Analyzing geographic patterns...');
  const geographicPatterns = analyzeGeographicPatterns(individuals);
  console.log(
    `       Geographic patterns complete (${Date.now() - analysisStart}ms)`,
  );

  console.log('    5/7 Analyzing demographics...');
  const demographics = analyzeDemographics(individuals, families);
  console.log(`       Demographics complete (${Date.now() - analysisStart}ms)`);

  console.log('    6/7 Analyzing relationships...');
  // Pre-calculate generations for relationships analysis
  const generationMapForRelationships = calculateGenerationsForAll(
    individuals,
    families,
  );
  const relationships = analyzeRelationships(
    individuals,
    families,
    generationMapForRelationships,
  );
  console.log(
    `       Relationships complete (${Date.now() - analysisStart}ms)`,
  );

  console.log('    7/7 Analyzing edges...');
  const edgeAnalysis = analyzeEdges(edges);
  console.log(
    `       Edge analysis complete (${Date.now() - analysisStart}ms)`,
  );

  // 3. Create enhanced metadata
  const enhancedMetadata: TreeMetadata = {
    graphStructure,
    temporalPatterns,
    geographicPatterns,
    demographics,
    relationships,
    edges,
    edgeAnalysis,
    summary: generateTreeSummary(
      graphStructure,
      temporalPatterns,
      geographicPatterns,
      demographics,
      relationships,
    ),
  };

  // 4. Pre-calculate generations for performance
  console.log('    📊 Pre-calculating generations for all individuals...');
  const generationMap = calculateGenerationsForAll(individuals, families);
  console.log(
    `       Calculated generations for ${generationMap.size} individuals (${Date.now() - analysisStart}ms)`,
  );

  // 5. Enhance individual and family metadata with graph data
  console.log('    📊 Enhancing individual metadata...');
  const enhancedIndividuals = enhanceIndividualMetadataWithCache(
    individuals,
    enhancedMetadata,
    families,
    generationMap,
  );
  console.log(
    `       Enhanced ${enhancedIndividuals.length} individuals (${Date.now() - analysisStart}ms)`,
  );

  console.log('    📊 Enhancing family metadata...');
  const enhancedFamilies = enhanceFamilyMetadataWithCache(
    families,
    enhancedMetadata,
    generationMap,
  );
  console.log(
    `       Enhanced ${enhancedFamilies.length} families (${Date.now() - analysisStart}ms)`,
  );

  // 6. Convert arrays to ID-keyed objects for efficient lookups
  const individualsById = {} as Record<string, AugmentedIndividual>;
  enhancedIndividuals.forEach((individual) => {
    individualsById[individual.id] = individual;
  });

  // Update families to reference the enhanced individuals
  const familiesById = {} as Record<string, FamilyWithMetadata>;
  enhancedFamilies.forEach((family) => {
    // Update husband and wife references to point to enhanced individuals
    const updatedFamily: FamilyWithMetadata = {
      ...family,
      husband: family.husband ? individualsById[family.husband.id] : undefined,
      wife: family.wife ? individualsById[family.wife.id] : undefined,
      children: family.children.map((child) => individualsById[child.id]),
    };
    familiesById[updatedFamily.id] = updatedFamily;
  });

  // 7. Build enhanced graph data for efficient traversals
  const graphData = buildGraphData(individualsById, familiesById);

  // 8. Return enhanced data structure with ID-keyed objects and graph data
  return {
    individuals: individualsById,
    families: familiesById,
    metadata: enhancedMetadata,
    graph: graphData,
  } as GedcomDataWithMetadata;
};

/**
 * Enhance individual metadata with graph analysis data (with cached generations)
 */
export const enhanceIndividualMetadataWithCache = (
  individuals: Individual[],
  treeMetadata: TreeMetadata,
  families: Family[] = [],
  generationMap: Map<string, number>,
): AugmentedIndividual[] => {
  let processedCount = 0;
  const total = individuals.length;

  return individuals.map((individual) => {
    if (processedCount % 100 === 0) {
      console.log(`       Processing individual ${processedCount}/${total}...`);
    }
    processedCount++;

    // Get existing metadata
    // Note: This might be slow if transform functions scan all individuals
    const existingMetadata = extractIndividualMetadata(individual, {
      allIndividuals: individuals,
      allFamilies: families,
    });

    // Get generation from cached map
    const generation = generationMap.get(individual.id) ?? 0;

    // Calculate centrality (simplified - count of relationships)
    const centrality = treeMetadata.edges.filter(
      (edge) =>
        edge.sourceId === individual.id || edge.targetId === individual.id,
    ).length;

    // Calculate relationship counts
    const relationshipCount = centrality;
    const ancestorCount = 0; // Would need more sophisticated calculation
    const descendantCount = 0; // Would need more sophisticated calculation
    const siblingCount = treeMetadata.edges.filter(
      (edge) =>
        edge.relationshipType === 'sibling' &&
        (edge.sourceId === individual.id || edge.targetId === individual.id),
    ).length;
    const cousinCount = 0; // Would need more sophisticated calculation

    // Extract geographic data
    const birthCountry = individual.birth?.place
      ? (extractCountry(individual.birth.place) ?? undefined)
      : undefined;
    const deathCountry = individual.death?.place
      ? (extractCountry(individual.death.place) ?? undefined)
      : undefined;
    const migrationDistance = 0; // Would need coordinates

    // Extract temporal data
    const birthYear = individual.birth?.date
      ? (extractYear(individual.birth.date) ?? undefined)
      : undefined;
    const deathYear = individual.death?.date
      ? (extractYear(individual.death.date) ?? undefined)
      : undefined;
    const ageAtDeath =
      birthYear && deathYear ? deathYear - birthYear : undefined;
    const generationGap = 25; // Default assumption

    // Combine all metadata
    const enhancedMetadata: IndividualMetadata = {
      ...existingMetadata,
      generation,
      centrality,
      relationshipCount,
      ancestorCount,
      descendantCount,
      siblingCount,
      cousinCount,
      birthCountry,
      deathCountry,
      migrationDistance,
      birthYear,
      deathYear,
      ageAtDeath,
      generationGap,
    };

    return {
      ...individual,
      metadata: enhancedMetadata,
    };
  });
};

/**
 * Enhance individual metadata with graph analysis data (legacy - kept for compatibility)
 */
export const enhanceIndividualMetadata = (
  individuals: Individual[],
  treeMetadata: TreeMetadata,
  families: Family[] = [],
): AugmentedIndividual[] => {
  return individuals.map((individual) => {
    // Get existing metadata
    const existingMetadata = extractIndividualMetadata(individual, {
      allIndividuals: individuals,
      allFamilies: families,
    });

    // Calculate graph-based metadata
    const generation = calculateGeneration(individual, individuals, families);

    // Calculate centrality (simplified - count of relationships)
    const centrality = treeMetadata.edges.filter(
      (edge) =>
        edge.sourceId === individual.id || edge.targetId === individual.id,
    ).length;

    // Calculate relationship counts
    const relationshipCount = centrality;
    const ancestorCount = 0; // Would need more sophisticated calculation
    const descendantCount = 0; // Would need more sophisticated calculation
    const siblingCount = treeMetadata.edges.filter(
      (edge) =>
        edge.relationshipType === 'sibling' &&
        (edge.sourceId === individual.id || edge.targetId === individual.id),
    ).length;
    const cousinCount = 0; // Would need more sophisticated calculation

    // Extract geographic data
    const birthCountry = individual.birth?.place
      ? (extractCountry(individual.birth.place) ?? undefined)
      : undefined;
    const deathCountry = individual.death?.place
      ? (extractCountry(individual.death.place) ?? undefined)
      : undefined;
    const migrationDistance = 0; // Would need coordinates

    // Extract temporal data
    const birthYear = individual.birth?.date
      ? (extractYear(individual.birth.date) ?? undefined)
      : undefined;
    const deathYear = individual.death?.date
      ? (extractYear(individual.death.date) ?? undefined)
      : undefined;
    const ageAtDeath =
      birthYear && deathYear ? deathYear - birthYear : undefined;
    const generationGap = 25; // Default assumption

    // Combine all metadata
    const enhancedMetadata: IndividualMetadata = {
      ...existingMetadata,
      generation,
      centrality,
      relationshipCount,
      ancestorCount,
      descendantCount,
      siblingCount,
      cousinCount,
      birthCountry,
      deathCountry,
      migrationDistance,
      birthYear,
      deathYear,
      ageAtDeath,
      generationGap,
    };

    return {
      ...individual,
      metadata: enhancedMetadata,
    };
  });
};

/**
 * Intermediate type for families with metadata but plain Individual references
 */
interface FamilyWithMetadataPlain extends Family {
  metadata: FamilyMetadata;
}

/**
 * Enhance family metadata with graph analysis data (with cached generations)
 */
export const enhanceFamilyMetadataWithCache = (
  families: Family[],
  _treeMetadata: TreeMetadata,
  generationMap: Map<string, number>,
): FamilyWithMetadataPlain[] => {
  return families.map((family) => {
    // Get existing metadata
    const existingMetadata = extractFamilyMetadata(family, {
      allIndividuals: [], // Will be populated later
      allFamilies: families,
    });

    // Calculate graph-based metadata
    const familyComplexity = family.children.length > 2 ? 0.8 : 0.3;
    const blendedFamily = false; // Would need more sophisticated analysis
    const remarriage = false; // Would need more sophisticated analysis

    // Get generation from cached map
    const generation =
      family.children.length > 0
        ? (generationMap.get(family.children[0].id) ?? 0) + 1
        : 0;

    // Geographic analysis
    const husband = family.husband;
    const wife = family.wife;
    const husbandBirthCountry = husband?.birth?.place
      ? extractCountry(husband.birth.place)
      : undefined;
    const wifeBirthCountry = wife?.birth?.place
      ? extractCountry(wife.birth.place)
      : undefined;
    const sameCountryParents =
      husbandBirthCountry && wifeBirthCountry
        ? husbandBirthCountry === wifeBirthCountry
        : false;
    const crossCountryMarriage =
      husbandBirthCountry && wifeBirthCountry
        ? husbandBirthCountry !== wifeBirthCountry
        : false;

    // Temporal analysis
    const marriageYear = 0; // Would need marriage date
    const averageChildAge = 0; // Would need more sophisticated calculation
    const childSpacing: number[] = []; // Would need more sophisticated calculation

    // Combine all metadata
    const enhancedMetadata: FamilyMetadata = {
      ...existingMetadata,
      familyComplexity,
      blendedFamily,
      remarriage,
      generation,
      sameCountryParents,
      crossCountryMarriage,
      marriageYear,
      averageChildAge,
      childSpacing,
    };

    return {
      id: family.id,
      husband: family.husband,
      wife: family.wife,
      children: family.children,
      metadata: enhancedMetadata,
    };
  });
};

/**
 * Enhance family metadata with graph analysis data (legacy - kept for compatibility)
 */
export const enhanceFamilyMetadata = (
  families: Family[],
  _treeMetadata: TreeMetadata,
): FamilyWithMetadataPlain[] => {
  return families.map((family) => {
    // Get existing metadata
    const existingMetadata = extractFamilyMetadata(family, {
      allIndividuals: [], // Will be populated later
      allFamilies: families,
    });

    // Calculate graph-based metadata
    const familyComplexity = family.children.length > 2 ? 0.8 : 0.3;
    const blendedFamily = false; // Would need more sophisticated analysis
    const remarriage = false; // Would need more sophisticated analysis
    const generation =
      family.children.length > 0
        ? calculateGeneration(family.children[0], [], families)
        : 0;

    // Geographic analysis
    const husband = family.husband;
    const wife = family.wife;
    const husbandBirthCountry = husband?.birth?.place
      ? extractCountry(husband.birth.place)
      : undefined;
    const wifeBirthCountry = wife?.birth?.place
      ? extractCountry(wife.birth.place)
      : undefined;
    const sameCountryParents =
      husbandBirthCountry && wifeBirthCountry
        ? husbandBirthCountry === wifeBirthCountry
        : false;
    const crossCountryMarriage =
      husbandBirthCountry && wifeBirthCountry
        ? husbandBirthCountry !== wifeBirthCountry
        : false;

    // Temporal analysis
    const marriageYear = 0; // Would need marriage date
    const averageChildAge = 0; // Would need more sophisticated calculation
    const childSpacing: number[] = []; // Would need more sophisticated calculation

    // Combine all metadata
    const enhancedMetadata: FamilyMetadata = {
      ...existingMetadata,
      familyComplexity,
      blendedFamily,
      remarriage,
      generation,
      sameCountryParents,
      crossCountryMarriage,
      marriageYear,
      averageChildAge,
      childSpacing,
    };

    return {
      id: family.id,
      husband: family.husband,
      wife: family.wife,
      children: family.children,
      metadata: enhancedMetadata,
    };
  });
};

// Helper function to extract year (imported from graph-analysis)
const extractYear = (dateString: string): number | null => {
  if (!dateString) return null;

  // Try to extract year from various date formats
  const yearMatch = /\b(\d{4})\b/.exec(dateString);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return year > 1000 && year < 2100 ? year : null;
  }

  return null;
};

// Helper function to extract country (imported from graph-analysis)
const extractCountry = (place: string): string | null => {
  if (!place) return null;

  // Simple extraction - look for common country patterns
  // This is a basic implementation that can be enhanced
  const parts = place.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || null;
};
