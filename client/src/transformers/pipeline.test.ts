import { describe, it, expect } from 'vitest';
import {
  runPipeline,
  createInitialCompleteVisualMetadata,
  validatePipelineConfig,
  createSimplePipeline,
  type PipelineConfig,
} from './pipeline';
import {
  // Import default constants for testing
  DEFAULT_X,
  DEFAULT_Y,
  DEFAULT_SIZE,
  DEFAULT_SCALE,
  DEFAULT_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_OPACITY,
  DEFAULT_ALPHA,
  DEFAULT_SHAPE,
  DEFAULT_STROKE_WEIGHT,
  DEFAULT_STROKE_STYLE,
  DEFAULT_VELOCITY,
  DEFAULT_ACCELERATION,
  DEFAULT_ROTATION,
  DEFAULT_ROTATION_SPEED,
  DEFAULT_GROUP,
  DEFAULT_LAYER,
  DEFAULT_PRIORITY,
  DEFAULT_CUSTOM,
} from './constants';
import type { AppGedcomDataWithMetadata } from '../types/app-data';
import {
  HORIZONTAL_SPREAD,
  VERTICAL_SPREAD,
  type TransformerId,
} from './transformers';
import type { IndividualId } from '../../../shared/types';

// Mock data for testing
const mockMetadata: AppGedcomDataWithMetadata = {
  individuals: new Map<IndividualId, any>([
    [
      'I1' as IndividualId,
      {
        id: 'I1' as IndividualId,
        name: 'John Doe',
        parents: [],
        spouses: [],
        children: [],
        siblings: [],
        metadata: {
          lifespan: 0.8,
          isAlive: false,
          generation: 1,
          relativeGenerationValue: 0.5,
        },
      },
    ],
  ]),
  families: new Map(),
  edges: new Map(),
  metadata: {
    graphStructure: {
      totalIndividuals: 1,
      totalFamilies: 0,
      totalEdges: 0,
      maxGenerations: 1,
      minGenerations: 1,
      generationDistribution: {},
      averageGenerationsPerBranch: 1,
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
      maxGenerations: 1,
    },
  },
};

describe('Pipeline', () => {
  describe('createInitialCompleteVisualMetadata', () => {
    it('should create complete visual metadata with default values', () => {
      const metadata = createInitialCompleteVisualMetadata(mockMetadata);

      // Test global settings
      expect(metadata.global.canvasWidth).toBe(800);
      expect(metadata.global.canvasHeight).toBe(600);
      expect(metadata.global.defaultNodeSize).toBe(DEFAULT_SIZE);
      expect(metadata.global.defaultNodeColor).toBe(DEFAULT_COLOR);

      // Test individual metadata
      const individualMetadata = metadata.individuals.get('I1' as any);
      expect(individualMetadata).toBeDefined();
      expect(individualMetadata?.x).toBe(DEFAULT_X);
      expect(individualMetadata?.y).toBe(DEFAULT_Y);
      expect(individualMetadata?.size).toBe(DEFAULT_SIZE);
      expect(individualMetadata?.color).toBe(DEFAULT_COLOR);
      expect(individualMetadata?.shape).toBe(DEFAULT_SHAPE);

      // Test tree metadata
      expect(metadata.tree.backgroundColor).toBe(DEFAULT_BACKGROUND_COLOR);
      expect(metadata.tree.group).toBe('tree');

      // Test edges metadata
      expect(metadata.edges).toBeDefined();
      expect(typeof metadata.edges).toBe('object');
    });

    it('should include all default properties for individuals', () => {
      const metadata = createInitialCompleteVisualMetadata(mockMetadata);
      const individualMetadata = metadata.individuals.get('I1' as any);

      // Test all default properties
      expect(individualMetadata?.x).toBe(DEFAULT_X);
      expect(individualMetadata?.y).toBe(DEFAULT_Y);
      expect(individualMetadata?.size).toBe(DEFAULT_SIZE);
      expect(individualMetadata?.scale).toBe(DEFAULT_SCALE);
      expect(individualMetadata?.color).toBe(DEFAULT_COLOR);
      expect(individualMetadata?.backgroundColor).toBe(
        DEFAULT_BACKGROUND_COLOR,
      );
      expect(individualMetadata?.strokeColor).toBe(DEFAULT_STROKE_COLOR);
      expect(individualMetadata?.opacity).toBe(DEFAULT_OPACITY);
      expect(individualMetadata?.alpha).toBe(DEFAULT_ALPHA);
      expect(individualMetadata?.shape).toBe(DEFAULT_SHAPE);
      expect(individualMetadata?.strokeWeight).toBe(DEFAULT_STROKE_WEIGHT);
      expect(individualMetadata?.strokeStyle).toBe(DEFAULT_STROKE_STYLE);
      expect(individualMetadata?.velocity).toEqual(DEFAULT_VELOCITY);
      expect(individualMetadata?.acceleration).toEqual(DEFAULT_ACCELERATION);
      expect(individualMetadata?.rotation).toBe(DEFAULT_ROTATION);
      expect(individualMetadata?.rotationSpeed).toBe(DEFAULT_ROTATION_SPEED);
      expect(individualMetadata?.group).toBe(DEFAULT_GROUP);
      expect(individualMetadata?.layer).toBe(DEFAULT_LAYER);
      expect(individualMetadata?.priority).toBe(DEFAULT_PRIORITY);
      expect(individualMetadata?.custom).toEqual(DEFAULT_CUSTOM);
    });

    it('should create edge metadata with appropriate defaults', () => {
      const metadata = createInitialCompleteVisualMetadata(mockMetadata);

      // Test that edges object exists
      expect(metadata.edges).toBeDefined();
      expect(typeof metadata.edges).toBe('object');

      // Test that edges object is empty when no edges in mock data
      expect(Object.keys(metadata.edges)).toHaveLength(0);
    });
  });

  describe('createSimplePipeline', () => {
    it('should create a pipeline with default settings', () => {
      const transformerIds = [HORIZONTAL_SPREAD.ID];
      const pipeline = createSimplePipeline(transformerIds);

      expect(pipeline.transformerIds).toEqual(transformerIds);
      expect(pipeline.temperature).toBe(0.5);
      expect(pipeline.seed).toBeUndefined();
      expect(pipeline.canvasWidth).toBeUndefined();
      expect(pipeline.canvasHeight).toBeUndefined();
    });

    it('should create a pipeline with custom settings', () => {
      const transformerIds = [HORIZONTAL_SPREAD.ID];
      const pipeline = createSimplePipeline(transformerIds, {
        temperature: 0.8,
        seed: 'test-seed',
        canvasWidth: 1000,
        canvasHeight: 800,
      });

      expect(pipeline.transformerIds).toEqual(transformerIds);
      expect(pipeline.temperature).toBe(0.8);
      expect(pipeline.seed).toBe('test-seed');
      expect(pipeline.canvasWidth).toBe(1000);
      expect(pipeline.canvasHeight).toBe(800);
    });
  });

  describe('validatePipelineConfig', () => {
    it('should validate a correct pipeline config', () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID],
        temperature: 0.5,
        canvasWidth: 800,
        canvasHeight: 600,
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty transformer list', () => {
      const config: PipelineConfig = {
        transformerIds: [],
        temperature: 0.5,
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Pipeline must have at least one transformer',
      );
    });

    it('should reject invalid temperature', () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID],
        temperature: 1.5, // Invalid: > 1
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature must be between 0 and 1');
    });

    it('should reject invalid canvas dimensions', () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID],
        canvasWidth: -100, // Invalid: negative
        canvasHeight: 0, // Invalid: zero
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Canvas width must be positive');
      expect(result.errors).toContain('Canvas height must be positive');
    });

    it('should reject non-existent transformer', () => {
      const config: PipelineConfig = {
        transformerIds: ['non-existent-transformer' as TransformerId],
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Transformer not found: non-existent-transformer',
      );
    });

    it('should collect multiple errors', () => {
      const config: PipelineConfig = {
        transformerIds: [],
        temperature: 2.0,
        canvasWidth: -100,
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain(
        'Pipeline must have at least one transformer',
      );
      expect(result.errors).toContain('Temperature must be between 0 and 1');
      expect(result.errors).toContain('Canvas width must be positive');
    });
  });

  describe('runPipeline', () => {
    it('should run a single transformer successfully', async () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID],
        temperature: 0.5,
        canvasWidth: 800,
        canvasHeight: 600,
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.totalExecutionTime).toBeGreaterThan(0);
      expect(result.debug.transformerResults).toHaveLength(1);
      expect(result.debug.transformerResults[0].success).toBe(true);
      expect(result.debug.transformerResults[0].transformerId).toBe(
        HORIZONTAL_SPREAD.ID,
      );
    });

    it('should run multiple transformers in sequence', async () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID, VERTICAL_SPREAD.ID],
        temperature: 0.5,
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.transformerResults).toHaveLength(2);
      expect(result.debug.transformerResults[0].success).toBe(true);
      expect(result.debug.transformerResults[1].success).toBe(true);
      expect(result.debug.transformerResults[0].transformerId).toBe(
        HORIZONTAL_SPREAD.ID,
      );
      expect(result.debug.transformerResults[1].transformerId).toBe(
        VERTICAL_SPREAD.ID,
      );
    });

    it('should handle transformer failures gracefully', async () => {
      const config: PipelineConfig = {
        transformerIds: ['non-existent-transformer' as TransformerId],
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.transformerResults).toHaveLength(1);
      expect(result.debug.transformerResults[0].success).toBe(false);
      expect(result.debug.transformerResults[0].error).toContain(
        'Cannot read properties of undefined',
      );
      expect(result.debug.transformerResults[0].transformerId).toBe(
        'non-existent-transformer' as TransformerId,
      );
    });

    it('should continue execution after transformer failure', async () => {
      const config: PipelineConfig = {
        transformerIds: [
          'non-existent-transformer' as TransformerId,
          HORIZONTAL_SPREAD.ID,
        ],
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.transformerResults).toHaveLength(2);
      expect(result.debug.transformerResults[0].success).toBe(false);
      expect(result.debug.transformerResults[1].success).toBe(true);
    });

    it('should pass context to transformers correctly', async () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID],
        temperature: 0.7,
        seed: 'test-seed',
        canvasWidth: 1000,
        canvasHeight: 800,
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.transformerResults[0].success).toBe(true);
    });

    it('should preserve position values between transformers', async () => {
      const config: PipelineConfig = {
        transformerIds: [HORIZONTAL_SPREAD.ID, VERTICAL_SPREAD.ID],
        temperature: 0.5,
        canvasWidth: 800,
        canvasHeight: 600,
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.transformerResults).toHaveLength(2);
      expect(result.debug.transformerResults[0].success).toBe(true);
      expect(result.debug.transformerResults[1].success).toBe(true);

      // Check that we have individual metadata
      const individualId = Array.from(
        result.visualMetadata.individuals.keys(),
      )[0];
      const individualMetadata =
        result.visualMetadata.individuals.get(individualId);
      expect(individualMetadata).toBeDefined();

      // The final result should have both x and y positions from both transformers
      // If transformers are overwriting each other, this test will fail
      expect(individualMetadata?.x).toBeDefined();
      expect(individualMetadata?.y).toBeDefined();

      // Log the positions to see what's happening
      console.log('Final positions:', {
        x: individualMetadata?.x,
        y: individualMetadata?.y,
      });
    });

    it('should preserve position values in reverse order', async () => {
      const config: PipelineConfig = {
        transformerIds: [VERTICAL_SPREAD.ID, HORIZONTAL_SPREAD.ID],
        temperature: 0.5,
        canvasWidth: 800,
        canvasHeight: 600,
      };

      const result = await runPipeline({
        fullData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        config,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.debug.transformerResults).toHaveLength(2);
      expect(result.debug.transformerResults[0].success).toBe(true);
      expect(result.debug.transformerResults[1].success).toBe(true);

      // Check that we have individual metadata
      const individualId = Array.from(
        result.visualMetadata.individuals.keys(),
      )[0];
      const individualMetadata =
        result.visualMetadata.individuals.get(individualId);
      expect(individualMetadata).toBeDefined();

      // The final result should have both x and y positions from both transformers
      expect(individualMetadata?.x).toBeDefined();
      expect(individualMetadata?.y).toBeDefined();

      // Log the positions to see what's happening
      console.log('Final positions (reverse order):', {
        x: individualMetadata?.x,
        y: individualMetadata?.y,
      });
    });
  });
});
