import { describe, it, expect } from 'vitest';
import { nodeSizeTransform } from './node-size';
import type { TransformerContext } from './types';

// Mock GEDCOM data for testing
const mockGedcomData = {
  individuals: {
    I1: {
      id: 'I1',
      name: 'John Doe',
      parents: [],
      spouses: [],
      children: ['I2'],
      siblings: [],
      metadata: {
        generation: 1,
        relativeGenerationValue: 0.0,
        lifespan: 80,
        birthYear: 1920,
      },
    },
    I2: {
      id: 'I2',
      name: 'Jane Smith',
      parents: ['I1'],
      spouses: [],
      children: ['I3'],
      siblings: [],
      metadata: {
        generation: 2,
        relativeGenerationValue: 0.5,
        lifespan: 75,
        birthYear: 1950,
      },
    },
    I3: {
      id: 'I3',
      name: 'Bob Johnson',
      parents: ['I2'],
      spouses: [],
      children: [],
      siblings: [],
      metadata: {
        generation: 3,
        relativeGenerationValue: 1.0,
        lifespan: 45,
        birthYear: 1980,
      },
    },
  },
  families: {
    F1: {
      id: 'F1',
      children: [],
      metadata: {
        numberOfChildren: 1,
        familyComplexity: 0.5,
        blendedFamily: false,
        remarriage: false,
        generation: 1,
        sameCountryParents: true,
        crossCountryMarriage: false,
        marriageYear: 1945,
        averageChildAge: 30,
        birthCountryDiversity: 1,
        occupationDiversity: 1,
        educationLevel: 'Unknown',
      },
      husband: {
        id: 'I1',
        name: 'John Doe',
        parents: [],
        spouses: [],
        children: [],
        siblings: [],
      },
      wife: {
        id: 'I2',
        name: 'Jane Smith',
        parents: [],
        spouses: [],
        children: [],
        siblings: [],
      },
    },
  },
  metadata: {
    graphStructure: {
      totalIndividuals: 3,
      totalFamilies: 1,
      totalEdges: 2,
      maxGenerations: 3,
      minGenerations: 1,
      generationDistribution: { '1': 1, '2': 1, '3': 1 },
      averageGenerationsPerBranch: 2,
      disconnectedComponents: 1,
      largestComponentSize: 3,
      averageConnectionsPerIndividual: 1.33,
      connectivityDensity: 0.67,
      averageFamilySize: 2,
      largestFamilySize: 2,
      familySizeDistribution: { '2': 1 },
      childlessFamilies: 0,
      largeFamilies: 0,
      treeComplexity: 0.5,
      branchingFactor: 1,
      depthToBreadthRatio: 1.5,
    },
    temporalPatterns: {
      earliestBirthYear: 1920,
      latestBirthYear: 1980,
      timeSpan: 60,
      generationTimeSpans: {},
      averageLifespan: 70,
      lifespanDistribution: {
        '0-20': 0,
        '20-40': 0,
        '40-60': 0.33,
        '60-80': 0.67,
        '80+': 0,
      },
      longestLifespan: 80,
      shortestLifespan: 45,
      lifespanVariance: 10,
      historicalPeriods: [],
      birthYearDistribution: { 1920: 1, 1950: 1, 1980: 1 },
      deathYearDistribution: { 2000: 1, 2020: 2 },
      marriageYearDistribution: { 1945: 1 },
      averageGenerationGap: 25,
      generationGapVariance: 5,
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
        male: { count: 2, percentage: 66.67 },
        female: { count: 1, percentage: 33.33 },
        unknown: { count: 0, percentage: 0 },
      },
      ageDistribution: {
        '0-20': 0,
        '20-40': 0,
        '40-60': 0.33,
        '60-80': 0.67,
        '80+': 0,
      },
      averageAgeAtDeath: 70,
      ageGroupDistribution: {
        '0-20': 0,
        '20-40': 0,
        '40-60': 0.33,
        '60-80': 0.67,
        '80+': 0,
      },
      ageVariance: 15,
      averageChildrenPerFamily: 1,
      childlessFamilies: 0,
      largeFamilies: 0,
      familySizeVariance: 0.5,
      averageAgeAtMarriage: 25,
      marriageAgeDistribution: { '20-30': 1 },
      remarriageRate: 0,
      marriageAgeVariance: 5,
      averageChildrenPerWoman: 1,
      fertilityRate: 1,
      childbearingAgeRange: { min: 20, max: 30, average: 25 },
    },
    relationships: {
      relationshipTypeDistribution: { 'parent-child': 2 },
      averageRelationshipDistance: 1.5,
      relationshipDistanceDistribution: { 1: 2 },
      maxRelationshipDistance: 2,
      blendedFamilies: 0,
      stepRelationships: 0,
      adoptionRate: 0,
      multipleMarriages: 0,
      averageAncestorsPerGeneration: 1,
      missingAncestors: 0,
      ancestralCompleteness: 0.8,
      ancestralDepth: 3,
      averageSiblingsPerFamily: 0,
      onlyChildren: 3,
      largeSiblingGroups: 0,
      cousinRelationships: {
        firstCousins: 0,
        secondCousins: 0,
        thirdCousins: 0,
        distantCousins: 0,
      },
      keyConnectors: ['I1'],
      averageCentrality: 0.33,
      centralityDistribution: { I1: 0.5, I2: 0.33, I3: 0.17 },
    },
    summary: {
      totalIndividuals: 3,
      totalFamilies: 1,
      timeSpan: '60 years',
      geographicDiversity: 'unknown',
      familyComplexity: 'simple',
      averageLifespan: 70,
      maxGenerations: 3,
    },
    edges: [],
    edgeAnalysis: {
      totalEdges: 2,
      parentChildEdges: 2,
      spouseEdges: 0,
      siblingEdges: 0,
      averageEdgeWeight: 1,
      edgeWeightDistribution: { '1.0': 2 },
      strongRelationships: 2,
      weakRelationships: 0,
      averageRelationshipDuration: 30,
      relationshipDurationDistribution: { '30': 2 },
      sameCountryRelationships: 2,
      crossCountryRelationships: 0,
      averageDistanceBetweenSpouses: 0,
    },
  },
};

const mockLLMData = {
  individuals: {},
  families: {},
  metadata: mockGedcomData.metadata,
};

const mockVisualMetadata = {
  individuals: {
    I1: { x: 100, y: 100 },
    I2: { x: 200, y: 200 },
    I3: { x: 300, y: 300 },
  },
  families: {},
  edges: {},
  tree: {},
  global: {},
};

describe('Node Size Transformer', () => {
  describe('Basic functionality', () => {
    it('should calculate node size based on children count dimension', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'childrenCount' },
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0, // No randomness for predictable testing
      };

      const result = await nodeSizeTransform(context);

      // Should have size metadata for all individuals
      expect(result.visualMetadata.individuals).toBeDefined();
      expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
        3,
      );

      // Each individual should have a size assigned
      const individuals = result.visualMetadata.individuals ?? {};
      expect(individuals.I1).toHaveProperty('size');
      expect(individuals.I2).toHaveProperty('size');
      expect(individuals.I3).toHaveProperty('size');

      // Sizes should be valid numbers
      expect(typeof individuals.I1.size).toBe('number');
      expect(typeof individuals.I2.size).toBe('number');
      expect(typeof individuals.I3.size).toBe('number');

      // I1 and I2 have children, I3 does not - I3 should have smaller or equal size
      expect(individuals.I3.size).toBeDefined();
      expect(individuals.I1.size).toBeDefined();
      expect(individuals.I2.size).toBeDefined();
      expect(individuals.I3.size!).toBeLessThanOrEqual(individuals.I1.size!);
      expect(individuals.I3.size!).toBeLessThanOrEqual(individuals.I2.size!);
    });

    it('should calculate node size based on lifespan dimension', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'lifespan' },
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0,
      };

      const result = await nodeSizeTransform(context);

      const individuals = result.visualMetadata.individuals ?? {};

      // I1 (lifespan 80) should have larger size than I3 (lifespan 45)
      expect(individuals.I1.size).toBeDefined();
      expect(individuals.I3.size).toBeDefined();
      expect(individuals.I1.size!).toBeGreaterThan(individuals.I3.size!);
    });
  });

  describe('Bug fix tests - Edge cases and validation', () => {
    it('should handle undefined nodeSize gracefully', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'childrenCount' },
        visual: {
          // nodeSize is intentionally undefined to test the bug fix
          variationFactor: 0.1,
          temperature: 0.3,
        },
        temperature: 0.0,
      };

      // This should not throw an error and should use 'medium' as default
      const result = await nodeSizeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();
      const individuals = result.visualMetadata.individuals ?? {};

      // Should still calculate valid sizes using the default 'medium' nodeSize
      expect(individuals.I1.size).toBeGreaterThanOrEqual(15); // medium min: 15
      expect(individuals.I1.size).toBeLessThanOrEqual(35); // medium max: 35
    });

    it('should handle invalid nodeSize values', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'childrenCount' },
        visual: {
          nodeSize: 'invalid-size' as any, // Testing invalid value handling
          variationFactor: 0.1,
          temperature: 0.3,
        },
        temperature: 0.0,
      };

      // Should not throw an error and should use 'medium' as fallback
      const result = await nodeSizeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();
      const individuals = result.visualMetadata.individuals ?? {};

      // Should still calculate valid sizes using the fallback 'medium' nodeSize
      expect(individuals.I1.size).toBeGreaterThanOrEqual(15); // medium min: 15
      expect(individuals.I1.size).toBeLessThanOrEqual(35); // medium max: 35
    });

    it('should handle missing visual context gracefully', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'childrenCount' },
        // @ts-expect-error - Testing missing visual context
        visual: undefined,
        temperature: 0.0,
      };

      // Should not throw an error due to missing visual context
      const result = await nodeSizeTransform(context);

      // Should return early with default size due to validation
      expect(result.visualMetadata.individuals).toBeDefined();
    });

    it('should handle missing dimensions gracefully', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        // @ts-expect-error - Testing missing dimensions
        dimensions: undefined,
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0,
      };

      // Should not throw an error due to missing dimensions
      const result = await nodeSizeTransform(context);

      // Should return early due to validation
      expect(result.visualMetadata.individuals).toBeDefined();
    });

    it('should handle empty arrays in Math.max operations', async () => {
      const emptyGedcomData = {
        ...mockGedcomData,
        individuals: {
          I1: {
            id: 'I1',
            name: 'Lone Individual',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              generation: 1,
              relativeGenerationValue: 0.0,
              // No lifespan data to test empty array handling
            },
          },
        },
      };

      const context: TransformerContext = {
        gedcomData: emptyGedcomData,
        llmData: mockLLMData,
        visualMetadata: {
          ...mockVisualMetadata,
          individuals: { I1: { x: 100, y: 100 } },
        },
        dimensions: { primary: 'lifespan' },
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0,
      };

      // Should not throw an error when there are no valid lifespans
      const result = await nodeSizeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();
      const individuals = result.visualMetadata.individuals ?? {};

      // Should still assign a valid size despite missing data
      expect(individuals.I1.size).toBeGreaterThanOrEqual(15);
      expect(individuals.I1.size).toBeLessThanOrEqual(35);
    });

    it('should handle unknown primary dimension', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: {
          primary: 'unknownDimension',
        },
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0,
      };

      // Should not throw an error and should use default value
      const result = await nodeSizeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();
      const individuals = result.visualMetadata.individuals ?? {};

      // Should assign valid default sizes
      expect(individuals.I1.size).toBeGreaterThanOrEqual(15);
      expect(individuals.I1.size).toBeLessThanOrEqual(35);
    });

    it('should handle undefined temperature and variationFactor', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'childrenCount' },
        visual: {
          nodeSize: 'medium',
          // variationFactor and temperature intentionally undefined
        },
        // temperature also undefined at context level
      };

      // Should not throw an error with undefined temperature/variationFactor
      const result = await nodeSizeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();
      const individuals = result.visualMetadata.individuals ?? {};

      // Should still calculate valid sizes
      expect(individuals.I1.size).toBeGreaterThanOrEqual(15);
      expect(individuals.I1.size).toBeLessThanOrEqual(35);
    });
  });

  describe('Size ranges and validation', () => {
    it('should respect node size parameter ranges', async () => {
      const testCases = [
        { nodeSize: 'small', min: 10, max: 20 },
        { nodeSize: 'medium', min: 15, max: 35 },
        { nodeSize: 'large', min: 25, max: 50 },
        { nodeSize: 'extra-large', min: 35, max: 70 },
      ];

      for (const { nodeSize, min, max } of testCases) {
        const context: TransformerContext = {
          gedcomData: mockGedcomData,
          llmData: mockLLMData,
          visualMetadata: mockVisualMetadata,
          dimensions: { primary: 'childrenCount' },
          visual: {
            nodeSize: nodeSize as 'small' | 'medium' | 'large' | 'extra-large',
            variationFactor: 0.0,
            temperature: 0.0,
          },
          temperature: 0.0,
        };

        const result = await nodeSizeTransform(context);
        const individuals = result.visualMetadata.individuals ?? {};

        // All sizes should be within the expected range
        Object.values(individuals).forEach((individual) => {
          expect(individual.size).toBeGreaterThanOrEqual(min);
          expect(individual.size).toBeLessThanOrEqual(max);
        });
      }
    });
  });

  describe('Data preservation', () => {
    it('should preserve existing visual metadata except size', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'childrenCount' },
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0,
      };

      const result = await nodeSizeTransform(context);

      // Should preserve existing x, y coordinates
      const individuals = result.visualMetadata.individuals ?? {};
      expect(individuals.I1).toMatchObject({ x: 100, y: 100 });
      expect(individuals.I2).toMatchObject({ x: 200, y: 200 });
      expect(individuals.I3).toMatchObject({ x: 300, y: 300 });

      // Should also have size
      expect(individuals.I1).toHaveProperty('size');
      expect(individuals.I2).toHaveProperty('size');
      expect(individuals.I3).toHaveProperty('size');
    });

    it('should handle empty individuals gracefully', async () => {
      const emptyGedcomData = {
        ...mockGedcomData,
        individuals: {},
      };

      const context: TransformerContext = {
        gedcomData: emptyGedcomData,
        llmData: mockLLMData,
        visualMetadata: { ...mockVisualMetadata, individuals: {} },
        dimensions: { primary: 'childrenCount' },
        visual: { nodeSize: 'medium', variationFactor: 0.1, temperature: 0.3 },
        temperature: 0.0,
      };

      const result = await nodeSizeTransform(context);

      // Should return empty result
      expect(result.visualMetadata).toEqual({});
    });
  });
});
