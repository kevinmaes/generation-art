import { describe, it, expect } from 'vitest';
import {
  transformers,
  getTransformer,
  getAllTransformers,
  getTransformersByCategory,
  getAllCategories,
} from './transformers';
import type { GedcomDataWithMetadata } from '../../../shared/types';

describe('Transformers Registry', () => {
  it('should export transformers object', () => {
    expect(transformers).toBeDefined();
    expect(typeof transformers).toBe('object');
  });

  it('should have horizontal spread transformer', () => {
    const transformer = transformers['horizontal-spread-by-generation'];
    expect(transformer).toBeDefined();
    expect(transformer.id).toBe('horizontal-spread-by-generation');
    expect(transformer.name).toBe('Horizontal Spread by Generation');
    expect(typeof transformer.transform).toBe('function');
  });

  it('should get transformer by ID', () => {
    const transformer = getTransformer('horizontal-spread-by-generation');
    expect(transformer).toBeDefined();
    expect(transformer?.id).toBe('horizontal-spread-by-generation');
  });

  it('should return undefined for non-existent transformer', () => {
    const transformer = getTransformer('non-existent');
    expect(transformer).toBeUndefined();
  });

  it('should get all transformers', () => {
    const allTransformers = getAllTransformers();
    expect(Array.isArray(allTransformers)).toBe(true);
    expect(allTransformers.length).toBeGreaterThan(0);
    expect(allTransformers[0]).toHaveProperty('id');
    expect(allTransformers[0]).toHaveProperty('name');
    expect(allTransformers[0]).toHaveProperty('transform');
  });

  it('should get transformers by category', () => {
    const layoutTransformers = getTransformersByCategory('layout');
    expect(Array.isArray(layoutTransformers)).toBe(true);
    expect(layoutTransformers.length).toBeGreaterThan(0);
    expect(layoutTransformers[0].categories).toContain('layout');
  });

  it('should get all categories', () => {
    const categories = getAllCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain('layout');
    expect(categories).toContain('positioning');
  });

  it('should have valid transformer configurations', () => {
    const allTransformers = getAllTransformers();

    for (const transformer of allTransformers) {
      expect(transformer.id).toBeTruthy();
      expect(transformer.name).toBeTruthy();
      expect(transformer.description).toBeTruthy();
      expect(typeof transformer.transform).toBe('function');

      if (transformer.parameters) {
        for (const [, paramConfig] of Object.entries(transformer.parameters)) {
          expect(paramConfig.description).toBeTruthy();
          expect(paramConfig.defaultValue).toBeDefined();
        }
      }
    }
  });
});

describe('Horizontal Spread Transformer', () => {
  it('should transform context with individuals', async () => {
    const transformer = getTransformer('horizontal-spread-by-generation');
    expect(transformer).toBeDefined();

    if (!transformer) return;

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
            generation: 0,
            relativeGenerationValue: 0.5,
          },
        },
      ],
      families: [],
      metadata: {},
    };

    const context = {
      metadata: mockMetadata,
      visualMetadata: {},
      canvasWidth: 1000,
      canvasHeight: 800,
    };

    const result = await transformer.transform(context);

    expect(result.visualMetadata).toBeDefined();
    expect(result.visualMetadata.x).toBeDefined();
    expect(result.visualMetadata.y).toBeDefined();
    expect(result.visualMetadata.size).toBe(20);
    expect(result.visualMetadata.color).toBe('#4CAF50');
    expect(result.visualMetadata.shape).toBe('circle');
  });

  it('should handle empty individuals array', async () => {
    const transformer = getTransformer('horizontal-spread-by-generation');
    expect(transformer).toBeDefined();

    if (!transformer) return;

    const mockMetadata: GedcomDataWithMetadata = {
      individuals: [],
      families: [],
      metadata: {},
    };

    const context = {
      metadata: mockMetadata,
      visualMetadata: {},
      canvasWidth: 1000,
      canvasHeight: 800,
    };

    const result = await transformer.transform(context);

    expect(result.visualMetadata).toEqual({});
  });
});
