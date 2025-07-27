import { describe, it, expect } from 'vitest';
import {
  runPipeline,
  createInitialVisualMetadata,
  validatePipelineConfig,
  createSimplePipeline,
  type PipelineConfig,
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
} from './pipeline';
import type { GedcomDataWithMetadata } from '../../../shared/types';

// Mock data for testing
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
        lifespan: 0.8,
        isAlive: false,
        generation: 1,
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
  describe('createInitialVisualMetadata', () => {
    it('should create visual metadata with default values', () => {
      const metadata = createInitialVisualMetadata();

      expect(metadata.x).toBe(DEFAULT_X);
      expect(metadata.y).toBe(DEFAULT_Y);
      expect(metadata.size).toBe(DEFAULT_SIZE);
      expect(metadata.color).toBe(DEFAULT_COLOR);
      expect(metadata.shape).toBe(DEFAULT_SHAPE);
      expect(metadata.opacity).toBe(DEFAULT_OPACITY);
      expect(metadata.velocity).toEqual(DEFAULT_VELOCITY);
      expect(metadata.custom).toEqual(DEFAULT_CUSTOM);
    });

    it('should include all default properties', () => {
      const metadata = createInitialVisualMetadata();

      // Test all default properties
      expect(metadata.x).toBe(DEFAULT_X);
      expect(metadata.y).toBe(DEFAULT_Y);
      expect(metadata.size).toBe(DEFAULT_SIZE);
      expect(metadata.scale).toBe(DEFAULT_SCALE);
      expect(metadata.color).toBe(DEFAULT_COLOR);
      expect(metadata.backgroundColor).toBe(DEFAULT_BACKGROUND_COLOR);
      expect(metadata.strokeColor).toBe(DEFAULT_STROKE_COLOR);
      expect(metadata.opacity).toBe(DEFAULT_OPACITY);
      expect(metadata.alpha).toBe(DEFAULT_ALPHA);
      expect(metadata.shape).toBe(DEFAULT_SHAPE);
      expect(metadata.strokeWeight).toBe(DEFAULT_STROKE_WEIGHT);
      expect(metadata.strokeStyle).toBe(DEFAULT_STROKE_STYLE);
      expect(metadata.velocity).toEqual(DEFAULT_VELOCITY);
      expect(metadata.acceleration).toEqual(DEFAULT_ACCELERATION);
      expect(metadata.rotation).toBe(DEFAULT_ROTATION);
      expect(metadata.rotationSpeed).toBe(DEFAULT_ROTATION_SPEED);
      expect(metadata.group).toBe(DEFAULT_GROUP);
      expect(metadata.layer).toBe(DEFAULT_LAYER);
      expect(metadata.priority).toBe(DEFAULT_PRIORITY);
      expect(metadata.custom).toEqual(DEFAULT_CUSTOM);
    });
  });

  describe('createSimplePipeline', () => {
    it('should create a pipeline with default settings', () => {
      const transformerIds = ['horizontal-spread-by-generation'];
      const pipeline = createSimplePipeline(transformerIds);

      expect(pipeline.transformerIds).toEqual(transformerIds);
      expect(pipeline.temperature).toBe(0.5);
      expect(pipeline.seed).toBeUndefined();
      expect(pipeline.canvasWidth).toBeUndefined();
      expect(pipeline.canvasHeight).toBeUndefined();
    });

    it('should create a pipeline with custom settings', () => {
      const transformerIds = ['horizontal-spread-by-generation'];
      const pipeline = createSimplePipeline(transformerIds, {
        temperature: 0.8,
        seed: 'test-seed',
        canvasWidth: 800,
        canvasHeight: 600,
      });

      expect(pipeline.transformerIds).toEqual(transformerIds);
      expect(pipeline.temperature).toBe(0.8);
      expect(pipeline.seed).toBe('test-seed');
      expect(pipeline.canvasWidth).toBe(800);
      expect(pipeline.canvasHeight).toBe(600);
    });
  });

  describe('validatePipelineConfig', () => {
    it('should validate a correct pipeline config', () => {
      const config: PipelineConfig = {
        transformerIds: ['horizontal-spread-by-generation'],
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
        transformerIds: ['horizontal-spread-by-generation'],
        temperature: 1.5, // Invalid: > 1
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature must be between 0 and 1');
    });

    it('should reject invalid canvas dimensions', () => {
      const config: PipelineConfig = {
        transformerIds: ['horizontal-spread-by-generation'],
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
        transformerIds: ['non-existent-transformer'],
      };

      const result = validatePipelineConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Transformer not found: non-existent-transformer',
      );
    });
  });

  describe('runPipeline', () => {
    it('should run a single transformer successfully', async () => {
      const config: PipelineConfig = {
        transformerIds: ['horizontal-spread-by-generation'],
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
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.transformerResults).toHaveLength(1);
      expect(result.transformerResults[0].success).toBe(true);
      expect(result.transformerResults[0].transformerId).toBe(
        'horizontal-spread-by-generation',
      );
      expect(result.config).toEqual(config);
    });

    it('should run multiple transformers in sequence', async () => {
      const config: PipelineConfig = {
        transformerIds: [
          'horizontal-spread-by-generation',
          'horizontal-spread-by-generation',
        ],
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
      expect(result.transformerResults).toHaveLength(2);
      expect(result.transformerResults[0].success).toBe(true);
      expect(result.transformerResults[1].success).toBe(true);
      expect(result.transformerResults[0].transformerId).toBe(
        'horizontal-spread-by-generation',
      );
      expect(result.transformerResults[1].transformerId).toBe(
        'horizontal-spread-by-generation',
      );
    });

    it('should handle transformer failures gracefully', async () => {
      const config: PipelineConfig = {
        transformerIds: ['non-existent-transformer'],
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
      expect(result.transformerResults).toHaveLength(1);
      expect(result.transformerResults[0].success).toBe(false);
      expect(result.transformerResults[0].error).toContain(
        'Transformer not found',
      );
      expect(result.transformerResults[0].transformerId).toBe(
        'non-existent-transformer',
      );
    });

    it('should continue execution after transformer failure', async () => {
      const config: PipelineConfig = {
        transformerIds: [
          'non-existent-transformer',
          'horizontal-spread-by-generation',
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
      expect(result.transformerResults).toHaveLength(2);
      expect(result.transformerResults[0].success).toBe(false);
      expect(result.transformerResults[1].success).toBe(true);
    });

    it('should pass context to transformers correctly', async () => {
      const config: PipelineConfig = {
        transformerIds: ['horizontal-spread-by-generation'],
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
      expect(result.transformerResults[0].success).toBe(true);
    });
  });
});
