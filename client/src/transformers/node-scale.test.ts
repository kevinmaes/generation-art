/**
 * Node Scale Transformer Test
 */

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
      husband: { id: 'I1' },
      wife: { id: 'I2' },
      children: [],
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

const mockLLMData = {
  individuals: {},
  families: {},
  relationships: [],
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
    expect(individuals.I1.width).toBeGreaterThan(individuals.I3.width);
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
    expect(individuals.I3.width).toBeLessThanOrEqual(individuals.I1.width);
    expect(individuals.I3.width).toBeLessThanOrEqual(individuals.I2.width);
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
    expect(individuals.I1.scale).toBeCloseTo(expectedScale, 5);
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
    expect(individuals.I1.width).toBeLessThan(individuals.I3.width);
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
    expect(individuals.I3.width).toBeGreaterThanOrEqual(individuals.I1.width);
  });
});
