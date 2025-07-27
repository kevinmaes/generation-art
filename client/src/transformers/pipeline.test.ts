import { describe, it, expect } from 'vitest';
import {
  runPipeline,
  createInitialVisualMetadata,
  validatePipelineConfig,
  createSimplePipeline,
  type PipelineConfig,
} from './pipeline';
import type { GedcomDataWithMetadata } from '../../../shared/types';

// Mock data for testing
const mockMetadata: GedcomDataWithMetadata = {
  individuals: [
    {
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
      },
    },
  ],
  families: [],
  metadata: {
    totalIndividuals: 1,
    depthOfTree: 1,
  },
};

describe('Pipeline', () => {
  describe('createInitialVisualMetadata', () => {
    it('should create visual metadata with default values', () => {
      const metadata = createInitialVisualMetadata();

      expect(metadata.x).toBe(0);
      expect(metadata.y).toBe(0);
      expect(metadata.size).toBe(20);
      expect(metadata.color).toBe('#4CAF50');
      expect(metadata.shape).toBe('circle');
      expect(metadata.opacity).toBe(1.0);
      expect(metadata.velocity).toEqual({ x: 0, y: 0 });
      expect(metadata.custom).toEqual({});
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

      const result = await runPipeline(mockMetadata, config);

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

      const result = await runPipeline(mockMetadata, config);

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

      const result = await runPipeline(mockMetadata, config);

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

      const result = await runPipeline(mockMetadata, config);

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

      const result = await runPipeline(mockMetadata, config);

      expect(result.visualMetadata).toBeDefined();
      expect(result.transformerResults[0].success).toBe(true);
    });
  });
});
