import { describe, it, expect } from 'vitest';
import { nodeOpacityTransform } from './node-opacity';
import type { TransformerContext } from '../types';

describe('nodeOpacityTransform', () => {
  const createMockContext = (
    overrides: Partial<TransformerContext> = {},
  ): TransformerContext => {
    // Create a minimal mock context that satisfies the transformer
    return {
      gedcomData: {
        individuals: {
          person1: {
            id: 'person1',
            name: 'Person 1',
            parents: [],
            spouses: [],
            children: ['person2'],
            siblings: [],
            metadata: {
              generation: 0,
              relativeGenerationValue: 0,
              lifespan: 80,
              isAlive: false,
              birthYear: 1920,
              deathYear: 2000,
            },
          },
          person2: {
            id: 'person2',
            name: 'Person 2',
            parents: ['person1'],
            spouses: [],
            children: ['person3'],
            siblings: [],
            metadata: {
              generation: 1,
              relativeGenerationValue: 0.5,
              lifespan: 60,
              isAlive: false,
              birthYear: 1950,
              deathYear: 2010,
            },
          },
          person3: {
            id: 'person3',
            name: 'Person 3',
            parents: ['person2'],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              generation: 2,
              relativeGenerationValue: 1,
              lifespan: 40,
              isAlive: true,
              birthYear: 1980,
            },
          },
        },
        families: {},
        metadata: {} as any, // Type assertion to avoid complex mock
      },
      llmData: {
        individuals: {},
        families: {},
        metadata: {} as any,
      },
      visualMetadata: {
        individuals: {},
        families: {},
        global: {},
        edges: {},
        tree: {},
      },
      dimensions: {
        primary: 'generation',
        secondary: 'lifespan',
      },
      visual: {
        nodeOpacity: 0.7,
        variationFactor: 0.5,
      },
      temperature: 0.5,
      ...overrides,
    } as TransformerContext;
  };

  it('should calculate different opacities for different individuals', async () => {
    const context = createMockContext();
    const result = await nodeOpacityTransform(context);

    expect(result.visualMetadata.individuals).toBeDefined();
    const individuals = result.visualMetadata.individuals || {};

    // Get opacity values
    const opacity1 = individuals.person1?.opacity;
    const opacity2 = individuals.person2?.opacity;
    const opacity3 = individuals.person3?.opacity;

    // All should have opacity values
    expect(opacity1).toBeDefined();
    expect(opacity2).toBeDefined();
    expect(opacity3).toBeDefined();

    // All should be within valid range
    expect(opacity1).toBeGreaterThanOrEqual(0.1);
    expect(opacity1).toBeLessThanOrEqual(1.0);
    expect(opacity2).toBeGreaterThanOrEqual(0.1);
    expect(opacity2).toBeLessThanOrEqual(1.0);
    expect(opacity3).toBeGreaterThanOrEqual(0.1);
    expect(opacity3).toBeLessThanOrEqual(1.0);
  });

  it('should respect opacity range based on nodeOpacity setting', async () => {
    // Test with low opacity setting
    const transparentContext = createMockContext({
      visual: {
        nodeOpacity: 0.3,
        variationFactor: 0,
      },
      temperature: 0, // No randomness
    });

    const transparentResult = await nodeOpacityTransform(transparentContext);
    const transparentOpacities = Object.values(
      transparentResult.visualMetadata.individuals || {},
    )
      .map((ind) => ind.opacity)
      .filter((op) => op !== undefined);

    // Should all be in low opacity range (around 0.3 ± 0.2)
    transparentOpacities.forEach((opacity) => {
      expect(opacity).toBeGreaterThanOrEqual(0.1);
      expect(opacity).toBeLessThanOrEqual(0.5);
    });
  });

  it('should vary opacity based on generation dimension', async () => {
    const context = createMockContext({
      dimensions: {
        primary: 'generation',
      },
      visual: {
        nodeOpacity: 0.7,
        variationFactor: 0,
      },
      temperature: 0, // No randomness for predictable testing
    });

    const result = await nodeOpacityTransform(context);
    const individuals = result.visualMetadata.individuals || {};

    // Earlier generations (lower generation value) should be more opaque
    // person1 (gen 0) > person2 (gen 1) > person3 (gen 2)
    const opacity1 = individuals.person1?.opacity ?? 0;
    const opacity2 = individuals.person2?.opacity ?? 0;
    const opacity3 = individuals.person3?.opacity ?? 0;

    expect(opacity1).toBeGreaterThan(opacity2);
    expect(opacity2).toBeGreaterThan(opacity3);
  });

  it('should handle missing individuals gracefully', async () => {
    const context = createMockContext({
      gedcomData: {
        individuals: {},
        families: {},
        metadata: {} as any,
      },
    });

    const result = await nodeOpacityTransform(context);
    expect(result.visualMetadata).toEqual({});
  });

  it('should preserve existing visual metadata', async () => {
    const context = createMockContext({
      visualMetadata: {
        individuals: {
          person1: {
            x: 100,
            y: 200,
            color: '#ff0000',
            size: 50,
          },
        },
        families: {},
        global: {},
        edges: {},
        tree: {},
      },
    });

    const result = await nodeOpacityTransform(context);
    const person1 = result.visualMetadata.individuals?.person1;

    if (person1) {
      // Should preserve existing properties
      expect(person1.x).toBe(100);
      expect(person1.y).toBe(200);
      expect(person1.color).toBe('#ff0000');
      expect(person1.size).toBe(50);
      // And add opacity
      expect(person1.opacity).toBeDefined();
    }
  });

  it('should never return NaN or invalid opacity values', async () => {
    // Test with edge cases that could cause NaN
    const edgeCaseContext = createMockContext({
      gedcomData: {
        individuals: {
          person1: {
            id: 'person1',
            name: 'Person 1',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              generation: 0,
              relativeGenerationValue: undefined as any,
              lifespan: undefined as any,
              isAlive: undefined as any,
            },
          },
        },
        families: {},
        metadata: {} as any,
      },
      visual: {
        nodeOpacity: 0.5,
        variationFactor: 1.0, // High variation
      },
      temperature: 1.0, // High temperature
    });

    const result = await nodeOpacityTransform(edgeCaseContext);
    const individuals = result.visualMetadata.individuals || {};

    Object.values(individuals).forEach((individual) => {
      const opacity = individual.opacity;
      expect(opacity).toBeDefined();
      expect(opacity).not.toBeNaN();
      expect(opacity).toBeGreaterThanOrEqual(0.1);
      expect(opacity).toBeLessThanOrEqual(1.0);
      expect(Number.isFinite(opacity)).toBe(true);
    });
  });
});
