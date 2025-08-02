/**
 * Node Scale Transformer Test
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, expect, it } from 'vitest';
import { nodeScaleTransform } from './node-scale';
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

describe('nodeScaleTransform', () => {
  it('should assign scale based on lifespan dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'lifespan' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0, // No randomness for predictable testing
    };

    const result = await nodeScaleTransform(context);

    // Should have scale metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // Each individual should have width, height, and scale assigned
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1).toHaveProperty('width');
    expect(individuals.I1).toHaveProperty('height');
    expect(individuals.I1).toHaveProperty('scale');
    expect(individuals.I2).toHaveProperty('width');
    expect(individuals.I2).toHaveProperty('height');
    expect(individuals.I2).toHaveProperty('scale');
    expect(individuals.I3).toHaveProperty('width');
    expect(individuals.I3).toHaveProperty('height');
    expect(individuals.I3).toHaveProperty('scale');

    // Scale values should be numbers between 0.5 and 2.0
    expect(typeof individuals.I1.width).toBe('number');
    expect(typeof individuals.I1.height).toBe('number');
    expect(typeof individuals.I1.scale).toBe('number');

    expect(individuals.I1.width).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I1.width).toBeLessThanOrEqual(2.0);
    expect(individuals.I1.height).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I1.height).toBeLessThanOrEqual(2.0);

    // I1 (lifespan 80) should have larger width than I3 (lifespan 45)
    expect(individuals.I1.width).toBeDefined();
    expect(individuals.I3.width).toBeDefined();
    expect(individuals.I1.width!).toBeGreaterThan(individuals.I3.width!);
  });

  it('should assign scale based on children count dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'childrenCount' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
    };

    const result = await nodeScaleTransform(context);

    // Should have scale metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // I1 has 1 child (I2), I2 has 1 child (I3), I3 has 0 children
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1).toHaveProperty('width');
    expect(individuals.I2).toHaveProperty('width');
    expect(individuals.I3).toHaveProperty('width');

    // I3 (no children) should have smaller width than I1 and I2
    expect(individuals.I3.width).toBeDefined();
    expect(individuals.I1.width).toBeDefined();
    expect(individuals.I2.width).toBeDefined();
    expect(individuals.I3.width!).toBeLessThanOrEqual(individuals.I1.width!);
    expect(individuals.I3.width!).toBeLessThanOrEqual(individuals.I2.width!);
  });

  it('should assign different scales for width and height with secondary dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'lifespan', secondary: 'childrenCount' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
    };

    const result = await nodeScaleTransform(context);

    // Should have scale metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // Width and height can be different since they're based on different dimensions
    const individuals = result.visualMetadata.individuals ?? {};

    // All should have valid width/height values
    expect(individuals.I1.width).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I1.width).toBeLessThanOrEqual(2.0);
    expect(individuals.I1.height).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I1.height).toBeLessThanOrEqual(2.0);

    // Scale should be geometric mean of width and height
    const expectedScale = Math.sqrt(
      (individuals.I1.width ?? 1) * (individuals.I1.height ?? 1),
    );
    expect(individuals.I1.scale).toBeDefined();
    expect(individuals.I1.scale!).toBeCloseTo(expectedScale, 5);
  });

  it('should preserve existing visual metadata while adding scale', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'lifespan' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
    };

    const result = await nodeScaleTransform(context);

    // Should preserve existing x, y coordinates
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1).toMatchObject({ x: 100, y: 100 });
    expect(individuals.I2).toMatchObject({ x: 200, y: 200 });
    expect(individuals.I3).toMatchObject({ x: 300, y: 300 });

    // Should also have width, height, scale
    expect(individuals.I1).toHaveProperty('width');
    expect(individuals.I1).toHaveProperty('height');
    expect(individuals.I1).toHaveProperty('scale');
    expect(individuals.I2).toHaveProperty('width');
    expect(individuals.I2).toHaveProperty('height');
    expect(individuals.I2).toHaveProperty('scale');
    expect(individuals.I3).toHaveProperty('width');
    expect(individuals.I3).toHaveProperty('height');
    expect(individuals.I3).toHaveProperty('scale');
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
      dimensions: { primary: 'lifespan' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
    };

    const result = await nodeScaleTransform(context);

    // Should return empty result
    expect(result.visualMetadata).toEqual({});
  });

  it('should apply variation with temperature', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'lifespan' },
      visual: { variationFactor: 0.5 },
      temperature: 1.0, // Maximum randomness
    };

    const result = await nodeScaleTransform(context);

    // Should still have valid scales despite randomness
    const individuals = result.visualMetadata.individuals ?? {};

    expect(individuals.I1.width).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I1.width).toBeLessThanOrEqual(2.0);
    expect(individuals.I1.height).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I1.height).toBeLessThanOrEqual(2.0);
    expect(individuals.I2.width).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I2.width).toBeLessThanOrEqual(2.0);
    expect(individuals.I2.height).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I2.height).toBeLessThanOrEqual(2.0);
    expect(individuals.I3.width).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I3.width).toBeLessThanOrEqual(2.0);
    expect(individuals.I3.height).toBeGreaterThanOrEqual(0.5);
    expect(individuals.I3.height).toBeLessThanOrEqual(2.0);
  });

  it('should handle generation dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'generation' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
    };

    const result = await nodeScaleTransform(context);

    // Should have scale metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // I1 (gen 1, relativeValue 0.0) should have smaller width than I3 (gen 3, relativeValue 1.0)
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I1.width).toBeDefined();
    expect(individuals.I3.width).toBeDefined();
    expect(individuals.I1.width!).toBeLessThan(individuals.I3.width!);
  });

  it('should handle name length dimension', async () => {
    const context: TransformerContext = {
      gedcomData: mockGedcomData,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'nameLength' },
      visual: { variationFactor: 0.1 },
      temperature: 0.0,
    };

    const result = await nodeScaleTransform(context);

    // Should have scale metadata for all individuals
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      3,
    );

    // Names: "John Doe" (8), "Jane Smith" (10), "Bob Johnson" (11)
    // Bob Johnson should have the largest width
    const individuals = result.visualMetadata.individuals ?? {};
    expect(individuals.I3.width).toBeDefined();
    expect(individuals.I1.width).toBeDefined();
    expect(individuals.I3.width!).toBeGreaterThanOrEqual(individuals.I1.width!);
  });
});
