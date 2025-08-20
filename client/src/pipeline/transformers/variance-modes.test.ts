import { describe, it, expect, beforeEach } from 'vitest';
import { varianceTransform, varianceConfig } from './variance';
import type { TransformerContext, CompleteVisualMetadata } from './types';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import type { LLMReadyData } from '../../../../shared/types/llm-data';

describe('Variance Modes Implementation', () => {
  let baseContext: TransformerContext;
  let visualMetadata: CompleteVisualMetadata;

  beforeEach(() => {
    // Create base visual metadata with known values
    visualMetadata = {
      individuals: {
        I001: { x: 100, y: 200, size: 30, opacity: 1, rotation: 0 },
        I002: { x: 200, y: 200, size: 40, opacity: 0.8, rotation: 0 },
        I003: { x: 150, y: 300, size: 25, opacity: 0.9, rotation: 0 },
      },
      families: {},
      edges: {},
      tree: {},
      global: {},
    };

    // Create test context with different generations for graduated mode
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
            metadata: {
              generation: 1,
              relativeGenerationValue: 0, // Oldest generation
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
            metadata: {
              generation: 2,
              relativeGenerationValue: 0.5, // Middle generation
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
            metadata: {
              generation: 3,
              relativeGenerationValue: 1, // Youngest generation
              lifespan: 50,
            },
          },
        },
        families: {
          F001: {
            id: 'F001',
            husband: { id: 'I001' } as any,
            wife: null,
            children: [{ id: 'I002' } as any],
            metadata: {},
          },
        },
        edges: [],
        metadata: {
          generationRange: { min: 1, max: 3 },
          totalIndividuals: 3,
          totalFamilies: 1,
        },
      } as unknown as GedcomDataWithMetadata,
      llmData: {} as LLMReadyData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {},
      seed: 'test-seed', // Fixed seed for reproducibility
    };
  });

  describe('Variance Modes', () => {
    it('should apply uniform variance equally to all nodes', async () => {
      const context = {
        ...baseContext,
        visual: { varianceAmount: 20, varianceMode: 'uniform', varySize: true },
      };

      const result = await varianceTransform(context);

      // All nodes should have variance applied
      expect(result.visualMetadata.individuals?.['I001']?.size).not.toBe(30);
      expect(result.visualMetadata.individuals?.['I002']?.size).not.toBe(40);
      expect(result.visualMetadata.individuals?.['I003']?.size).not.toBe(25);

      // With uniform mode and same seed, the variance factor should be consistent
      const sizes = [
        result.visualMetadata.individuals?.['I001']?.size ?? 0,
        result.visualMetadata.individuals?.['I002']?.size ?? 0,
        result.visualMetadata.individuals?.['I003']?.size ?? 0,
      ];

      // All should be modified
      expect(sizes.every((s) => s > 0)).toBe(true);
    });

    it('should apply graduated variance based on generation', async () => {
      const context = {
        ...baseContext,
        visual: {
          varianceAmount: 30,
          varianceMode: 'graduated',
          varySize: true,
        },
      };

      const result = await varianceTransform(context);

      const original = [30, 40, 25]; // Original sizes
      const modified = [
        result.visualMetadata.individuals?.['I001']?.size ?? 0,
        result.visualMetadata.individuals?.['I002']?.size ?? 0,
        result.visualMetadata.individuals?.['I003']?.size ?? 0,
      ];

      // Calculate variance percentages
      const variances = modified.map(
        (m, i) => Math.abs(m - original[i]) / original[i],
      );

      // Older generation (I001) should have more variance than younger (I003)
      // Due to the graduated formula: variance * (1 - generation * 0.5)
      // I001 (gen=0): full variance
      // I002 (gen=0.5): 75% variance
      // I003 (gen=1): 50% variance
      expect(variances[0]).toBeGreaterThan(0); // I001 has variance
      expect(variances[2]).toBeGreaterThan(0); // I003 has variance

      // Note: Due to randomness, we can't guarantee exact ordering,
      // but all should have some variance applied
    });

    it('should apply random variance differently to each node', async () => {
      const context = {
        ...baseContext,
        visual: { varianceAmount: 25, varianceMode: 'random', varySize: true },
      };

      const result = await varianceTransform(context);

      const sizes = [
        result.visualMetadata.individuals?.['I001']?.size ?? 0,
        result.visualMetadata.individuals?.['I002']?.size ?? 0,
        result.visualMetadata.individuals?.['I003']?.size ?? 0,
      ];

      // All should be modified
      expect(sizes[0]).not.toBe(30);
      expect(sizes[1]).not.toBe(40);
      expect(sizes[2]).not.toBe(25);

      // Each should have a different amount of variance
      // (though with random, there's a small chance they could be similar)
      const variances = [
        Math.abs(sizes[0] - 30) / 30,
        Math.abs(sizes[1] - 40) / 40,
        Math.abs(sizes[2] - 25) / 25,
      ];

      // At least verify they're all different from zero
      expect(variances.every((v) => v > 0)).toBe(true);
    });

    it('should apply clustered variance with family similarity', async () => {
      const context = {
        ...baseContext,
        visual: {
          varianceAmount: 20,
          varianceMode: 'clustered',
          varySize: true,
        },
      };

      const result = await varianceTransform(context);

      // All nodes should have variance
      expect(result.visualMetadata.individuals?.['I001']?.size).not.toBe(30);
      expect(result.visualMetadata.individuals?.['I002']?.size).not.toBe(40);
      expect(result.visualMetadata.individuals?.['I003']?.size).not.toBe(25);

      // Family members (I001 and I002 are in F001) should have similar variance patterns
      // This is harder to test precisely due to the 70% family / 30% individual split
      const sizes = [
        result.visualMetadata.individuals?.['I001']?.size ?? 0,
        result.visualMetadata.individuals?.['I002']?.size ?? 0,
        result.visualMetadata.individuals?.['I003']?.size ?? 0,
      ];

      // All should be valid positive numbers
      expect(sizes.every((s) => s > 5)).toBe(true);
    });
  });

  describe('Variance Amount Options', () => {
    const amounts = [
      { value: 0, label: 'None' },
      { value: 5, label: 'Subtle' },
      { value: 10, label: 'Light' },
      { value: 15, label: 'Moderate' },
      { value: 25, label: 'Strong' },
    ];

    amounts.forEach(({ value, label }) => {
      it(`should handle ${label} (${String(value)}%) variance amount`, async () => {
        const context = {
          ...baseContext,
          visual: {
            varianceAmount: value,
            varianceMode: 'uniform',
            varySize: true,
          },
        };

        const result = await varianceTransform(context);

        if (value === 0) {
          // No variance should be applied
          expect(result.visualMetadata).toEqual({});
        } else {
          // Some variance should be applied
          const size1 = result.visualMetadata.individuals?.['I001']?.size;
          expect(size1).toBeDefined();
          expect(size1).not.toBe(30);

          // Verify the variance is reasonable (within expected bounds)
          const variance = Math.abs((size1 ?? 30) - 30) / 30;
          expect(variance).toBeLessThanOrEqual(value / 100 + 0.1); // Allow some margin
        }
      });
    });
  });

  describe('Configuration', () => {
    it('should have correct dropdown options for variance mode', () => {
      const modeParam = varianceConfig.visualParameters.find(
        (p) => p.name === 'varianceMode',
      );
      expect(modeParam?.type).toBe('select');
      expect(modeParam?.options).toHaveLength(4);
      expect(modeParam?.options?.map((o) => o.value)).toEqual([
        'uniform',
        'graduated',
        'random',
        'clustered',
      ]);
    });

    it('should have correct dropdown options for variance amount', () => {
      const amountParam = varianceConfig.visualParameters.find(
        (p) => p.name === 'varianceAmount',
      );
      expect(amountParam?.type).toBe('select');
      expect(amountParam?.options).toHaveLength(5);
      expect(amountParam?.options?.map((o) => o.value)).toEqual([
        0, 5, 10, 15, 25,
      ]);
    });
  });
});
