import { performance } from 'perf_hooks';
import type { Individual, Family } from '../../shared/types';
import type {
  CLIProcessingResult,
  CLIProcessingStats,
} from '../../shared/types/llm-data';
import type {
  AugmentedIndividual,
  FamilyWithMetadata,
} from '../../shared/types/schemas';
import { stripPIIForLLM } from '../../shared/utils/pii-stripping';
import { transformGedcomDataWithComprehensiveAnalysis } from './transformation-pipeline';
import { calculateGenerationsForAll, generateEdges } from './graph-analysis';

/**
 * Process GEDCOM data with both full and LLM-ready outputs
 * This is the main CLI processing function that generates optimized data structures
 */
export function processGedcomWithLLMOptimization(
  individuals: Individual[],
  families: Family[],
): CLIProcessingResult {
  const startTime = performance.now();

  console.log('🔄 Starting GEDCOM processing with LLM optimization...');
  console.log(
    `📊 Processing ${String(individuals.length)} individuals and ${String(families.length)} families`,
  );

  // For very large datasets, use a simplified processing to avoid memory issues
  // Lowered threshold due to performance issues with comprehensive analysis
  const isLargeDataset = individuals.length > 1000;

  if (isLargeDataset) {
    console.log('  ⚠️  Large dataset detected - using optimized processing...');
  }

  // Step 1: Generate full data with comprehensive metadata
  console.log('📈 Generating full data with comprehensive metadata...');
  console.log(
    `  Dataset size check: ${String(individuals.length)} individuals (large threshold: 2000)`,
  );

  // For large datasets, create a simplified version
  let fullData;
  if (isLargeDataset) {
    // Create a simplified structure without heavy analysis
    // But still calculate essential data for front-end performance
    console.log('  📊 Pre-calculating essential data for front-end...');

    // Pre-calculate generations for all individuals
    const generationMap = calculateGenerationsForAll(individuals, families);

    // Pre-calculate centrality scores (connection count)
    const centralityMap = new Map<string, number>();
    individuals.forEach((ind) => {
      let connections = 0;
      connections += ind.parents.length;
      connections += ind.children.length;
      connections += ind.spouses.length;
      connections += ind.siblings.length;
      centralityMap.set(ind.id, connections);
    });

    // Convert to ID-keyed objects with pre-computed metadata
    const individualsObj: Record<string, AugmentedIndividual> = {};

    individuals.forEach((ind) => {
      individualsObj[ind.id] = {
        ...ind,
        metadata: {
          generation: generationMap.get(ind.id),
          centrality: centralityMap.get(ind.id),
          relationshipCount: centralityMap.get(ind.id), // Same as centrality for now
        },
      };
    });

    const familiesObj: Record<string, FamilyWithMetadata> = {};
    families.forEach((fam) => {
      // Update family members to reference the enhanced individuals
      const enhancedChildren = fam.children.map(
        (child) => individualsObj[child.id],
      );
      const enhancedHusband = fam.husband
        ? individualsObj[fam.husband.id]
        : undefined;
      const enhancedWife = fam.wife ? individualsObj[fam.wife.id] : undefined;

      familiesObj[fam.id] = {
        ...fam,
        husband: enhancedHusband,
        wife: enhancedWife,
        children: enhancedChildren,
        metadata: {
          numberOfChildren: fam.children.length,
        },
      };
    });

    // Generate edges for front-end graph operations
    const edges = generateEdges(individuals, families);

    // Calculate generation statistics
    const generations = Array.from(generationMap.values());
    const maxGenerations = Math.max(...generations, 0);
    const minGenerations = Math.min(...generations, 0);
    const generationDistribution: Record<number, number> = {};
    generations.forEach((gen) => {
      generationDistribution[gen] = (generationDistribution[gen] || 0) + 1;
    });

    fullData = {
      individuals: individualsObj,
      families: familiesObj,
      metadata: {
        edges, // Include edges in metadata
        graphStructure: {
          totalIndividuals: individuals.length,
          totalFamilies: families.length,
          totalEdges: edges.length,
          maxGenerations,
          minGenerations,
          generationDistribution,
          averageGenerationsPerBranch:
            maxGenerations > 0 ? individuals.length / maxGenerations : 0,
          // Add missing required fields with default values for large datasets
          disconnectedComponents: 1,
          largestComponentSize: individuals.length,
          averageConnectionsPerIndividual: edges.length / individuals.length,
          connectivityDensity:
            edges.length / (individuals.length * (individuals.length - 1)),
          averageFamilySize:
            families.length > 0 ? individuals.length / families.length : 0,
          largestFamilySize: 0,
          familySizeDistribution: {},
          childlessFamilies: 0,
          largeFamilies: 0,
          treeComplexity: 0,
          branchingFactor: 0,
          depthToBreadthRatio:
            maxGenerations > 0
              ? maxGenerations / Math.sqrt(individuals.length)
              : 0,
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
          childbearingAgeRange: {
            min: 0,
            max: 0,
            average: 0,
          },
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
        edgeAnalysis: {
          totalEdges: edges.length,
          parentChildEdges: edges.filter(
            (e) => e.relationshipType === 'parent-child',
          ).length,
          spouseEdges: edges.filter((e) => e.relationshipType === 'spouse')
            .length,
          siblingEdges: edges.filter((e) => e.relationshipType === 'sibling')
            .length,
          averageEdgeWeight: 1,
          edgeWeightDistribution: {},
          strongRelationships: edges.length,
          weakRelationships: 0,
          averageRelationshipDuration: 0,
          relationshipDurationDistribution: {},
          sameCountryRelationships: 0,
          crossCountryRelationships: 0,
          averageDistanceBetweenSpouses: 0,
        },
        summary: {
          totalIndividuals: individuals.length,
          totalFamilies: families.length,
          timeSpan: '0 years',
          geographicDiversity: 'Unknown',
          familyComplexity: 'Unknown',
          averageLifespan: 0,
          maxGenerations,
        },
      },
    };
  } else {
    console.log(
      '  📊 Performing comprehensive analysis (non-large dataset)...',
    );
    fullData = transformGedcomDataWithComprehensiveAnalysis(
      individuals,
      families,
    );
    console.log('  ✅ Comprehensive analysis complete');
  }

  // Step 2: Generate LLM-ready data (PII stripped)
  console.log('🔒 Generating LLM-ready data with PII stripping...');
  const piiStrippingResult = stripPIIForLLM(fullData);

  // Step 3: Create LLM-ready data structure
  const llmData = {
    individuals: piiStrippingResult.anonymizedData.individuals,
    families: piiStrippingResult.anonymizedData.families,
    metadata: fullData.metadata, // Safe aggregate data, no changes needed
  };

  // Step 4: Calculate processing statistics
  const endTime = performance.now();
  const processingTime = endTime - startTime;

  // Calculate memory usage (approximate) - use a more efficient estimation
  // For large datasets, we estimate based on counts rather than stringifying
  interface DataWithCounts {
    individuals?: Record<string, unknown>;
    families?: Record<string, unknown>;
    metadata?: unknown;
  }

  const estimateDataSize = (
    data: DataWithCounts | null | undefined,
  ): number => {
    if (!data) return 0;

    // Rough estimation:
    // - Each individual ~500 bytes average
    // - Each family ~200 bytes average
    // - Metadata ~10KB
    const individualCount = data.individuals
      ? Object.keys(data.individuals).length
      : 0;
    const familyCount = data.families ? Object.keys(data.families).length : 0;

    return individualCount * 500 + familyCount * 200 + 10240;
  };

  const fullDataSize = estimateDataSize(fullData);
  const llmDataSize = estimateDataSize(llmData);
  const totalSize = fullDataSize + llmDataSize;

  const stats: CLIProcessingStats = {
    individualsProcessed: individuals.length,
    familiesProcessed: families.length,
    piiStrippingStats: {
      ...piiStrippingResult.strippingStats,
      warnings: piiStrippingResult.warnings,
    },
    processingTime,
    memoryUsage: {
      fullDataSize,
      llmDataSize,
      totalSize,
    },
  };

  console.log('✅ GEDCOM processing completed successfully');
  console.log(`⏱️  Processing time: ${processingTime.toFixed(2)}ms`);
  console.log(`💾 Memory usage: ${(totalSize / 1024).toFixed(2)}KB`);
  console.log(
    `🔒 PII stripped: ${String(piiStrippingResult.strippingStats.namesStripped)} names, ${String(piiStrippingResult.strippingStats.datesStripped)} dates, ${String(piiStrippingResult.strippingStats.locationsStripped)} locations`,
  );

  return {
    full: fullData,
    llm: llmData,
    stats,
  };
}

/**
 * Generate only the LLM-ready data (for cases where full data isn't needed)
 */
export function generateLLMReadyData(
  individuals: Individual[],
  families: Family[],
) {
  console.log('🔒 Generating LLM-ready data only...');

  // Generate full data first (needed for metadata)
  const fullData = transformGedcomDataWithComprehensiveAnalysis(
    individuals,
    families,
  );

  // Strip PII for LLM
  const piiStrippingResult = stripPIIForLLM(fullData);

  return {
    individuals: piiStrippingResult.anonymizedData.individuals,
    families: piiStrippingResult.anonymizedData.families,
    metadata: fullData.metadata,
  };
}

/**
 * Validate that LLM-ready data is properly anonymized
 */
export function validateLLMData(
  llmData: ReturnType<typeof generateLLMReadyData>,
) {
  console.log('🔍 Validating LLM-ready data...');

  const issues: string[] = [];

  // Check for any remaining PII in individuals
  Object.entries(llmData.individuals).forEach(([id, individual]) => {
    // Check for names that aren't anonymized
    if (
      !individual.name.startsWith('Individual_') &&
      !individual.name.startsWith('Person_')
    ) {
      issues.push(
        `Individual ${id} has non-anonymized name: ${individual.name}`,
      );
    }

    // Check for specific dates (should only have years, not date strings)
    if (individual.birth && 'date' in individual.birth) {
      issues.push(
        `Individual ${id} has specific birth date instead of year only`,
      );
    }
    if (individual.death && 'date' in individual.death) {
      issues.push(
        `Individual ${id} has specific death date instead of year only`,
      );
    }

    // Check for place data (should be stripped)
    if (individual.birth && 'place' in individual.birth) {
      issues.push(
        `Individual ${id} has birth place data that should be stripped`,
      );
    }
    if (individual.death && 'place' in individual.death) {
      issues.push(
        `Individual ${id} has death place data that should be stripped`,
      );
    }
  });

  if (issues.length > 0) {
    console.warn('⚠️  LLM data validation issues found:');
    issues.forEach((issue) => {
      console.warn(`  - ${issue}`);
    });
    return false;
  }

  console.log('✅ LLM-ready data validation passed');
  return true;
}
