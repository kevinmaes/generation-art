/**
 * Node Shape Transformer Test
 */

import { describe, expect, it } from 'vitest';
import { nodeShapeTransform } from './node-shape';
import type { TransformerContext } from './types';
import type { LLMReadyData } from '../../../shared/types/llm-data';

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
      },
      children: [{
        id: 'I3',
        name: 'Bob Doe',
        gender: 'M' as const,
        birth: { date: '1980', place: 'Unknown' },
        parents: ['I2'],
        spouses: [],
        children: [],
        siblings: [],
      }],
    },
  },
  metadata: {
    totalIndividuals: 3,
    totalFamilies: 1,
    generations: 3,
    earliestBirthYear: 1920,
    latestBirthYear: 1980,
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
      averageFamilySize: 1,
      largestFamilySize: 1,
      familySizeDistribution: { '1': 1 },
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
      temporalClustering: 0.5,
      contemporaryRatio: 0.33,
      averageLifespan: 70,
      lifespanDistribution: { '0-20': 0, '20-40': 0, '40-60': 0.33, '60-80': 0.67, '80+': 0 },
      longestLifespan: 80,
      shortestLifespan: 45,
      birthMonthDistribution: {},
      deathMonthDistribution: {},
      birthDecadeDistribution: { '1920s': 0.33, '1950s': 0.33, '1980s': 0.33 },
      deathDecadeDistribution: { '2000s': 0.5, '2020s': 0.5 },
      monthlyPatterns: { births: {}, deaths: {} },
      seasonalPatterns: { births: {}, deaths: {} },
      generationGapVariance: 5,
    },
    geographicPatterns: {
      totalCountries: 0,
      totalPlaces: 0,
      countryDistribution: {},
      placeDistribution: {},
      migrationPatterns: [],
      geographicSpread: 0,
      mostCommonCountry: '',
      mostCommonPlace: '',
    },
    demographics: {
      totalBirths: 3,
      totalDeaths: 0,
      averageLifespan: 66.67,
      medianLifespan: 75,
      maxLifespan: 80,
      minLifespan: 45,
      genderDistribution: { M: 0, F: 0, U: 3 },
      aliveCount: 3,
      deceasedCount: 0,
      unknownVitalStatusCount: 0,
      generationSizes: { '1': 1, '2': 1, '3': 1 },
      largestGeneration: 1,
      smallestGeneration: 1,
    },
    relationships: {
      totalRelationships: 2,
      parentChildRelationships: 2,
      spouseRelationships: 0,
      siblingRelationships: 0,
      relationshipStrengthDistribution: { '1.0': 2 },
      averageRelationshipStrength: 1.0,
      directRelationshipRatio: 1.0,
      multigenerationalFamilies: 1,
      averageFamilyComplexity: 0.5,
    },
    edges: [],
    edgeAnalysis: {
      totalEdges: 2,
      averageEdgeWeight: 1.0,
      edgeTypeDistribution: { 'parent-child': 2 },
      strongConnectionRatio: 1.0,
      weakConnectionRatio: 0.0,
      isolatedNodeCount: 0,
      bridgeEdgeCount: 2,
      clusteringCoefficient: 0.0,
    },
    summary: {
      totalNodes: 3,
      totalConnections: 2,
      networkDensity: 0.67,
      averageConnectionsPerNode: 1.33,
      largestConnectedComponent: 3,
      networkComplexity: 0.5,
      treeBalance: 0.5,
      generationalSpread: 2,
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
});
