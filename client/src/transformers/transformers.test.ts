import { describe, it, expect } from 'vitest';
import {
  transformers,
  getTransformer,
  getAllTransformers,
  getTransformersByCategory,
  getAllCategories,
} from './transformers';
import type { GedcomDataWithMetadata } from '../../../shared/types';

describe('Transformers Registry', () => {
  it('should export transformers object', () => {
    expect(transformers).toBeDefined();
    expect(typeof transformers).toBe('object');
  });

  it('should have horizontal spread transformer', () => {
    const transformer = transformers['horizontal-spread-by-generation'];
    expect(transformer).toBeDefined();
    expect(transformer.id).toBe('horizontal-spread-by-generation');
    expect(transformer.name).toBe('Horizontal Spread by Generation');
    expect(typeof transformer.transform).toBe('function');
  });

  it('should get transformer by ID', () => {
    const transformer = getTransformer('horizontal-spread-by-generation');
    expect(transformer).toBeDefined();
    expect(transformer?.id).toBe('horizontal-spread-by-generation');
  });

  it('should return undefined for non-existent transformer', () => {
    const transformer = getTransformer('non-existent');
    expect(transformer).toBeUndefined();
  });

  it('should get all transformers', () => {
    const allTransformers = getAllTransformers();
    expect(Array.isArray(allTransformers)).toBe(true);
    expect(allTransformers.length).toBeGreaterThan(0);
    expect(allTransformers[0]).toHaveProperty('id');
    expect(allTransformers[0]).toHaveProperty('name');
    expect(allTransformers[0]).toHaveProperty('transform');
  });

  it('should get transformers by category', () => {
    const layoutTransformers = getTransformersByCategory('layout');
    expect(Array.isArray(layoutTransformers)).toBe(true);
    expect(layoutTransformers.length).toBeGreaterThan(0);
    expect(layoutTransformers[0].categories).toContain('layout');
  });

  it('should get all categories', () => {
    const categories = getAllCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain('layout');
    expect(categories).toContain('positioning');
  });

  it('should have valid transformer configurations', () => {
    const allTransformers = getAllTransformers();

    for (const transformer of allTransformers) {
      expect(transformer.id).toBeTruthy();
      expect(transformer.name).toBeTruthy();
      expect(transformer.description).toBeTruthy();
      expect(typeof transformer.transform).toBe('function');

      if (transformer.parameters) {
        for (const [, paramConfig] of Object.entries(transformer.parameters)) {
          expect(paramConfig.description).toBeTruthy();
          expect(paramConfig.defaultValue).toBeDefined();
        }
      }
    }
  });
});

describe('Horizontal Spread Transformer', () => {
  it('should transform context with individuals', async () => {
    const transformer = getTransformer('horizontal-spread-by-generation');
    expect(transformer).toBeDefined();

    if (!transformer) return;

    const mockMetadata: GedcomDataWithMetadata = {
      individuals: {
        I1: {
          id: 'I1',
          name: 'John Doe',
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
          metadata: {
            generation: 0,
            relativeGenerationValue: 0.5,
          },
        },
      },
      families: {},
      metadata: {
        graphStructure: {
          totalIndividuals: 1,
          totalFamilies: 0,
          totalEdges: 0,
          maxGenerations: 0,
          minGenerations: 0,
          generationDistribution: {},
          averageGenerationsPerBranch: 0,
          disconnectedComponents: 1,
          largestComponentSize: 1,
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
          totalIndividuals: 1,
          totalFamilies: 0,
          timeSpan: 'Unknown',
          geographicDiversity: 'Unknown',
          familyComplexity: 'Unknown',
          averageLifespan: 0,
          maxGenerations: 0,
        },
      },
    };

    const context = {
      gedcomData: mockMetadata,
      llmData: {
        individuals: {},
        families: {},
        metadata: mockMetadata.metadata,
      },
      visualMetadata: {
        individuals: {},
        families: {},
        tree: {},
        global: {
          canvasWidth: 1000,
          canvasHeight: 800,
          defaultNodeSize: 20,
          defaultNodeColor: '#4CAF50',
          defaultNodeShape: 'circle' as const,
        },
      },
    };

    const result = await transformer.transform(context);

    expect(result.visualMetadata).toBeDefined();
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals || {})).toHaveLength(
      1,
    );
    const individualId = Object.keys(
      result.visualMetadata.individuals || {},
    )[0];
    const individualMetadata =
      result.visualMetadata.individuals?.[individualId];
    expect(individualMetadata?.x).toBeDefined();
    expect(individualMetadata?.y).toBeDefined();
    expect(individualMetadata?.size).toBe(20);
    expect(individualMetadata?.color).toBe('#4CAF50');
    expect(individualMetadata?.shape).toBe('circle');
  });

  it('should handle empty individuals array', async () => {
    const transformer = getTransformer('horizontal-spread-by-generation');
    expect(transformer).toBeDefined();

    if (!transformer) return;

    const mockMetadata: GedcomDataWithMetadata = {
      individuals: {},
      families: {},
      metadata: {
        graphStructure: {
          totalIndividuals: 0,
          totalFamilies: 0,
          totalEdges: 0,
          maxGenerations: 0,
          minGenerations: 0,
          generationDistribution: {},
          averageGenerationsPerBranch: 0,
          disconnectedComponents: 0,
          largestComponentSize: 0,
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
          totalIndividuals: 0,
          totalFamilies: 0,
          timeSpan: 'Unknown',
          geographicDiversity: 'Unknown',
          familyComplexity: 'Unknown',
          averageLifespan: 0,
          maxGenerations: 0,
        },
      },
    };

    const context = {
      gedcomData: mockMetadata,
      visualMetadata: {},
      canvasWidth: 1000,
      canvasHeight: 800,
    };

    const result = await transformer.transform(context);

    expect(result.visualMetadata).toEqual({});
  });
});
