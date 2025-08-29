/**
 * Node Shape Transformer Test
 */

import { describe, expect, it } from 'vitest';
import { nodeShapeTransform } from './node-shape';
import type { TransformerContext } from '../types';
import type { LLMReadyData } from '../../../../shared/types/llm-data';
import { DEFAULT_TEST_CANVAS } from '../test-utils';

// Mock GEDCOM data for testing
const mockGedcomData = {
  individuals: {
    I1: {
      id: 'I1',
      name: 'John Doe',
      gender: 'M' as const,
      birth: { date: '1920', place: 'Unknown' },
      death: { date: '2000', place: 'Unknown' },
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
      name: 'Jane Doe',
      gender: 'F' as const,
      birth: { date: '1950', place: 'Unknown' },
      death: { date: '2025', place: 'Unknown' },
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
      name: 'Bob Doe',
      gender: 'M' as const,
      birth: { date: '1980', place: 'Unknown' },
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
        gender: 'M' as const,
        birth: { date: '1920', place: 'Unknown' },
        death: { date: '2000', place: 'Unknown' },
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
      wife: {
        id: 'I2',
        name: 'Jane Doe',
        gender: 'F' as const,
        birth: { date: '1950', place: 'Unknown' },
        death: { date: '2025', place: 'Unknown' },
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
      averageGenerationGap: 25,
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
      averageEdgeWeight: 1,
      parentChildEdges: 2,
      spouseEdges: 0,
      siblingEdges: 0,
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

const mockLLMData: LLMReadyData = {
  individuals: {},
  families: {},
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
      averageGenerationGap: 25,
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
      averageEdgeWeight: 1,
      parentChildEdges: 2,
      spouseEdges: 0,
      siblingEdges: 0,
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

describe('nodeShapeTransform', () => {
  it('should assign shapes based on generation dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'generation' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0, // No randomness for predictable testing
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);

    // Should have shape metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // Each individual should have a shape assigned
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1).toHaveProperty('shape');
    expect(individuals.I2).toHaveProperty('shape');
    expect(individuals.I3).toHaveProperty('shape');

    // Shapes should be valid values
    const validShapes = ['circle', 'square', 'triangle', 'hexagon', 'star'];
    expect(validShapes).toContain(individuals.I1.shape);
    expect(validShapes).toContain(individuals.I2.shape);
    expect(validShapes).toContain(individuals.I3.shape);
  });

  it('should assign shapes based on children count dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'childrenCount' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);

    // Should have shape metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // I1 has 1 child (I2), I2 has 1 child (I3), I3 has 0 children
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1).toHaveProperty('shape');
    expect(individuals.I2).toHaveProperty('shape');
    expect(individuals.I3).toHaveProperty('shape');
  });

  it('should preserve existing visual metadata while adding shape', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'generation' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);

    // Should preserve existing x, y coordinates
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1).toMatchObject({ x: 100, y: 100 });
    expect(individuals.I2).toMatchObject({ x: 200, y: 200 });
    expect(individuals.I3).toMatchObject({ x: 300, y: 300 });

    // Should also have shape
    expect(individuals.I1).toHaveProperty('shape');
    expect(individuals.I2).toHaveProperty('shape');
    expect(individuals.I3).toHaveProperty('shape');
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
      dimensions: { primary: 'generation' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);

    // Should return empty result
    expect(result.visualMetadata).toEqual({});
  });

  it('should apply variation with temperature', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'generation' },
      visual: { variationFactor: 0.5 },
      temperature: 1.0, // Maximum randomness
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);

    // Should still have valid shapes despite randomness
    const individuals = result.visualMetadata.individuals ?? {};
    const validShapes = ['circle', 'square', 'triangle', 'hexagon', 'star'];

    expect(validShapes).toContain(individuals.I1.shape);
    expect(validShapes).toContain(individuals.I2.shape);
    expect(validShapes).toContain(individuals.I3.shape);
  });

  it('should handle secondary dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'generation', secondary: 'lifespan' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);

    // Should have shape metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // Shapes should still be valid
    const individuals = result.visualMetadata.individuals ?? {};
    const validShapes = ['circle', 'square', 'triangle', 'hexagon', 'star'];
    expect(validShapes).toContain(individuals.I1.shape);
    expect(validShapes).toContain(individuals.I2.shape);
    expect(validShapes).toContain(individuals.I3.shape);
  });

  it('should generate shape profiles correctly', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'generation' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
      canvas: DEFAULT_TEST_CANVAS,
    };

    const result = await nodeShapeTransform(context);
    const individuals = result.visualMetadata.individuals ?? {};

    // Each individual should have a shapeProfile
    Object.values(individuals).forEach((individual) => {
      expect(individual).toHaveProperty('shapeProfile');
      expect(individual.shapeProfile).toHaveProperty('kind');
      expect(individual.shapeProfile).toHaveProperty('size');

      const profile = individual.shapeProfile;
      expect(profile).toBeDefined();

      if (profile) {
        // Size should be reasonable
        expect(profile.size.width).toBeGreaterThan(0);
        expect(profile.size.height).toBeGreaterThan(0);

        // Should have either circle or supershape kind
        expect(['circle', 'supershape']).toContain(profile.kind);

        // For supershapes, should have params
        if (profile.kind === 'supershape' && profile.params) {
          expect(profile.params).toBeDefined();
          expect(profile.params.m).toBeDefined();
        }
      }
    });

    console.log(
      'Generated shape profiles:',
      Object.fromEntries(
        Object.entries(individuals).map(([id, meta]) => [
          id,
          {
            shape: meta.shape,
            profileKind: meta.shapeProfile?.kind,
            profileParams: meta.shapeProfile?.params,
          },
        ]),
      ),
    );
  });
});
