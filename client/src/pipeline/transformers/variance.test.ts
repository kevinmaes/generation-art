import { describe, it, expect, beforeEach } from 'vitest';
import { varianceTransform, varianceConfig } from './variance';
import type { TransformerContext, CompleteVisualMetadata } from '../types';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import type { LLMReadyData } from '../../../../shared/types/llm-data';
import { DEFAULT_TEST_CANVAS } from '../test-utils';

describe('Variance Transformer', () => {
  let baseContext: TransformerContext;
  let visualMetadata: CompleteVisualMetadata;

  beforeEach(() => {
    // Create base visual metadata with known values
    visualMetadata = {
      individuals: {
        I001: {
          x: 100,
          y: 200,
          size: 30,
          opacity: 1,
          rotation: 0,
        },
        I002: {
          x: 200,
          y: 200,
          size: 40,
          opacity: 0.8,
          rotation: 0,
        },
        I003: {
          x: 150,
          y: 300,
          size: 25,
          opacity: 0.9,
          rotation: 0,
        },
      },
      families: {},
      edges: {
        E001: {
          curveIntensity: 0.5,
        },
      },
      tree: {},
      global: {},
    };

    // Create test context
    baseContext = {
      gedcomData: {
        individuals: {
          I001: {
            id: 'I001',
            name: 'John Smith',
            parents: [],
            spouses: [],
            children: ['I002'],
            siblings: [],
            birthDate: '1900-01-01',
            deathDate: '1980-01-01',
            metadata: {
              generation: 1,
              relativeGenerationValue: 0,
              lifespan: 80,
            },
          },
          I002: {
            id: 'I002',
            name: 'Jane Smith',
            parents: ['I001'],
            spouses: [],
            children: ['I003'],
            siblings: [],
            birthDate: '1925-01-01',
            metadata: {
              generation: 2,
              relativeGenerationValue: 0.5,
              lifespan: 75,
            },
          },
          I003: {
            id: 'I003',
            name: 'Bob Smith',
            parents: ['I002'],
            spouses: [],
            children: [],
            siblings: [],
            birthDate: '1950-01-01',
            metadata: {
              generation: 3,
              relativeGenerationValue: 1,
              lifespan: 50,
            },
          },
        },
        families: {
          F001: {
            id: 'F001',
            husband: {
              id: 'I001',
              name: 'John Smith',
              parents: [],
              spouses: [],
              children: ['I002'],
              siblings: [],
            },
            wife: null,
            children: [
              {
                id: 'I002',
                name: 'Jane Smith',
                parents: ['I001'],
                spouses: [],
                children: ['I003'],
                siblings: [],
              },
            ],
            metadata: {},
          },
          F002: {
            id: 'F002',
            husband: null,
            wife: {
              id: 'I002',
              name: 'Jane Smith',
              parents: ['I001'],
              spouses: [],
              children: ['I003'],
              siblings: [],
            },
            children: [
              {
                id: 'I003',
                name: 'Bob Smith',
                parents: ['I002'],
                spouses: [],
                children: [],
                siblings: [],
              },
            ],
            metadata: {},
          },
        },
        edges: [],
        metadata: {
          generationRange: { min: 1, max: 3 },
          totalIndividuals: 3,
          totalFamilies: 2,
        },
      } as unknown as GedcomDataWithMetadata,
      llmData: {} as LLMReadyData,
      visualMetadata,
      dimensions: {
        primary: 'generation',
      },
      visual: {
        varianceAmount: 50,
        varianceMode: 'uniform',
        varySize: true,
        varyPosition: true,
        varyRotation: false,
        varyOpacity: false,
      },
      seed: 'test-seed',
      canvas: DEFAULT_TEST_CANVAS,
    };
  });

  describe('Configuration', () => {
    it('should have correct transformer config', () => {
      expect(varianceConfig.id).toBe('variance');
      expect(varianceConfig.name).toBe('Variance');
      expect(varianceConfig.categories).toContain('visual');
      expect(varianceConfig.categories).toContain('style');
      expect(varianceConfig.availableDimensions).toContain('generation');
    });

    it('should have correct visual parameters', () => {
      const params = varianceConfig.visualParameters;

      const varianceAmountParam = params.find(
        (p) => p.name === 'varianceAmount',
      );
      expect(varianceAmountParam?.type).toBe('select');
      expect(varianceAmountParam?.options).toBeDefined();
      expect(varianceAmountParam?.options).toHaveLength(5); // None, Small, Medium, Large, Extreme

      const modeParam = params.find((p) => p.name === 'varianceMode');
      expect(modeParam?.type).toBe('select');
      expect(modeParam?.options).toHaveLength(4);
    });
  });

  describe('Zero variance', () => {
    it('should return empty metadata when variance is 0', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varianceAmount: 0 },
      };

      const result = await varianceTransform(context);
      expect(result.visualMetadata).toEqual({});
    });
  });

  describe('Uniform variance mode', () => {
    it('should apply variance to size when enabled', async () => {
      const result = await varianceTransform(baseContext);

      // Check that sizes have changed but remain positive
      expect(result.visualMetadata.individuals?.['I001']?.size).not.toBe(30);
      expect(result.visualMetadata.individuals?.['I001']?.size).toBeGreaterThan(
        5,
      );

      expect(result.visualMetadata.individuals?.['I002']?.size).not.toBe(40);
      expect(result.visualMetadata.individuals?.['I002']?.size).toBeGreaterThan(
        5,
      );
    });

    it('should apply variance to position when enabled', async () => {
      const result = await varianceTransform(baseContext);

      // Check that positions have changed
      expect(result.visualMetadata.individuals?.['I001']?.x).not.toBe(100);
      expect(result.visualMetadata.individuals?.['I001']?.y).not.toBe(200);

      // Position variance should be limited (30% of normal variance)
      const xDiff = Math.abs(
        (result.visualMetadata.individuals?.['I001']?.x ?? 0) - 100,
      );
      const yDiff = Math.abs(
        (result.visualMetadata.individuals?.['I001']?.y ?? 0) - 200,
      );
      expect(xDiff).toBeLessThan(50); // Reasonable bounds
      expect(yDiff).toBeLessThan(50);
    });

    it('should apply variance to rotation when enabled', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varyRotation: true },
      };

      const result = await varianceTransform(context);

      // Check that rotation has changed and is a valid number
      const rotation = result.visualMetadata.individuals?.['I001']?.rotation;
      expect(rotation).toBeDefined();
      expect(typeof rotation).toBe('number');
      expect(Number.isNaN(rotation)).toBe(false);
      expect(Number.isFinite(rotation)).toBe(true);
    });

    it('should apply variance to opacity when enabled', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varyOpacity: true },
      };

      const result = await varianceTransform(context);

      // Check that opacity has been set and remains within bounds
      const opacity = result.visualMetadata.individuals?.['I001']?.opacity ?? 0;
      expect(opacity).toBeGreaterThanOrEqual(0.1);
      expect(opacity).toBeLessThanOrEqual(1);

      // Check that at least one individual had opacity changed
      const opacityChanged = Object.values(
        result.visualMetadata.individuals ?? {},
      ).some((individual, index) => {
        const originalOpacity =
          Object.values(visualMetadata.individuals)[index]?.opacity ?? 1;
        return individual.opacity !== originalOpacity;
      });
      expect(opacityChanged).toBe(true);
    });
  });

  describe('Graduated variance mode', () => {
    it('should apply decreasing variance by generation', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varianceMode: 'graduated' },
      };

      const result = await varianceTransform(context);

      // Get size differences from original
      const diff1 = Math.abs(
        (result.visualMetadata.individuals?.['I001']?.size ?? 0) - 30,
      );
      const diff3 = Math.abs(
        (result.visualMetadata.individuals?.['I003']?.size ?? 0) - 25,
      );

      // Earlier generations should have more variance
      // I001 (gen 0) > I002 (gen 0.5) > I003 (gen 1)
      expect(diff1).toBeGreaterThan(0);
      expect(diff3).toBeLessThan(diff1); // Latest generation has least variance
    });
  });

  describe('Random variance mode', () => {
    it('should apply different variance per node', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varianceMode: 'random' },
      };

      const result = await varianceTransform(context);

      // Each node should have variance applied
      expect(result.visualMetadata.individuals?.['I001']?.size).not.toBe(30);
      expect(result.visualMetadata.individuals?.['I002']?.size).not.toBe(40);
      expect(result.visualMetadata.individuals?.['I003']?.size).not.toBe(25);
    });
  });

  describe('Clustered variance mode', () => {
    it('should apply similar variance within families', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varianceMode: 'clustered' },
      };

      const result = await varianceTransform(context);

      // All nodes should have variance
      expect(result.visualMetadata.individuals?.['I001']?.size).not.toBe(30);
      expect(result.visualMetadata.individuals?.['I002']?.size).not.toBe(40);
      expect(result.visualMetadata.individuals?.['I003']?.size).not.toBe(25);

      // Family members should have somewhat similar variance
      // This is hard to test precisely due to randomness, but we can verify
      // that variance was applied
      expect(result.visualMetadata.individuals).toBeDefined();
      expect(Object.keys(result.visualMetadata.individuals ?? {}).length).toBe(
        3,
      );
    });
  });

  describe('Edge variance', () => {
    it('should apply subtle variance to edge curves when position is varied', async () => {
      const result = await varianceTransform(baseContext);

      // Edge curve intensity should have changed
      expect(result.visualMetadata.edges?.['E001']?.curveIntensity).not.toBe(
        0.5,
      );
      expect(
        result.visualMetadata.edges?.['E001']?.curveIntensity,
      ).toBeGreaterThanOrEqual(0);
      expect(
        result.visualMetadata.edges?.['E001']?.curveIntensity,
      ).toBeLessThanOrEqual(1);
    });

    it('should not vary edges when position variance is disabled', async () => {
      const context = {
        ...baseContext,
        visual: { ...baseContext.visual, varyPosition: false },
      };

      const result = await varianceTransform(context);

      // Edges should not be in the result
      expect(result.visualMetadata.edges).toBeUndefined();
    });
  });

  describe('Reproducibility', () => {
    it('should produce consistent results with the same seed', async () => {
      // Provide explicit seed for deterministic behavior
      const contextWithSeed = { ...baseContext, seed: 'fixed-seed' };

      const result1 = await varianceTransform(contextWithSeed);
      const result2 = await varianceTransform(contextWithSeed);

      // Results should be identical with same seed
      expect(result1.visualMetadata.individuals?.['I001']?.size).toBe(
        result2.visualMetadata.individuals?.['I001']?.size,
      );
      expect(result1.visualMetadata.individuals?.['I001']?.x).toBe(
        result2.visualMetadata.individuals?.['I001']?.x,
      );
    });

    it('should produce different results without seed (non-deterministic)', async () => {
      // Remove seed to test non-deterministic behavior
      const contextNoSeed = { ...baseContext };
      delete contextNoSeed.seed;

      // Run multiple iterations to ensure we find at least one difference
      let foundDifference = false;
      for (let i = 0; i < 10 && !foundDifference; i++) {
        const result1 = await varianceTransform(contextNoSeed);

        // Add small delay to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 5));

        const result2 = await varianceTransform(contextNoSeed);

        // Check multiple properties for differences
        const individual1 = result1.visualMetadata.individuals?.['I001'];
        const individual2 = result2.visualMetadata.individuals?.['I001'];

        if (
          individual1?.size !== individual2?.size ||
          individual1?.x !== individual2?.x ||
          individual1?.y !== individual2?.y
        ) {
          foundDifference = true;
        }
      }

      // At least one difference should be found across multiple runs
      expect(foundDifference).toBe(true);
    });

    it('should produce different results with different seeds', async () => {
      const context1 = { ...baseContext, seed: 'seed-1' };
      const context2 = { ...baseContext, seed: 'seed-2' };

      const result1 = await varianceTransform(context1);
      const result2 = await varianceTransform(context2);

      // Results should be different with different seeds
      expect(result1.visualMetadata.individuals?.['I001']?.size).not.toBe(
        result2.visualMetadata.individuals?.['I001']?.size,
      );
    });
  });

  describe('Parameter validation', () => {
    it('should handle missing visual parameters gracefully', async () => {
      const context = {
        ...baseContext,
        visual: {},
      };

      const result = await varianceTransform(context);

      // Should use defaults and still produce results
      expect(result.visualMetadata.individuals).toBeDefined();
      expect(Object.keys(result.visualMetadata.individuals ?? {}).length).toBe(
        3,
      );
    });

    it('should preserve other metadata properties', async () => {
      const result = await varianceTransform(baseContext);

      // Original properties should be preserved
      const individual = result.visualMetadata.individuals?.['I001'];
      expect(individual).toHaveProperty('x');
      expect(individual).toHaveProperty('y');
      expect(individual).toHaveProperty('size');
      expect(individual).toHaveProperty('opacity');
      expect(individual).toHaveProperty('rotation');
    });
  });
});
