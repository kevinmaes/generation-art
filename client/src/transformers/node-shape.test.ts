/**
 * Node Shape Transformer Test
 */

import { describe, expect, it } from 'vitest';
import { nodeShapeTransform } from './node-shape';
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
      name: 'Jane Doe',
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
      name: 'Bob Doe',
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
