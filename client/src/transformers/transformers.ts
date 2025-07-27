/**
 * VisualTransformer Registry
 *
 * This file exports all available transformers keyed by their unique IDs.
 * Each transformer configuration is defined here, with the actual transform
 * functions imported from their respective files.
 */

import type { VisualTransformerConfig } from './types';
import { horizontalSpreadByGenerationTransform } from './horizontal-spread-by-generation';
import { nodeSizeTransform } from './node-size';
import { nodeOpacityTransform } from './node-opacity';
import { edgeOpacityTransform } from './edge-opacity';
import { verticalSpreadTransform } from './vertical-spread';
import { generateTransformerId } from './utils';

/**
 * Registry of all available transformers
 * Keyed by transformer ID (slugified name)
 */
export const transformers: Record<string, VisualTransformerConfig> = {
  [generateTransformerId('Horizontal Spread by Generation')]: {
    id: generateTransformerId('Horizontal Spread by Generation'),
    name: 'Horizontal Spread by Generation',
    description:
      'Positions individuals horizontally based on their generation, creating a traditional family tree layout',
    transform:
      horizontalSpreadByGenerationTransform as VisualTransformerConfig['transform'],
    categories: ['layout', 'positioning'],
    parameters: {
      spacing: {
        type: 'number',
        defaultValue: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        description: 'Spacing multiplier between generations',
      },
      nodeSize: {
        type: 'number',
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 5,
        description: 'Default size for nodes',
      },
    },
  },
  [generateTransformerId('Node Size')]: {
    id: generateTransformerId('Node Size'),
    name: 'Node Size',
    description:
      'Controls the size of nodes based on metadata like number of children, age at death, or importance metrics',
    transform: nodeSizeTransform as VisualTransformerConfig['transform'],
    categories: ['visual', 'size'],
    parameters: {
      baseSize: {
        type: 'number',
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 5,
        description: 'Base size for nodes',
      },
      sizeMultiplier: {
        type: 'number',
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        description: 'Multiplier for size calculations',
      },
    },
  },
  [generateTransformerId('Node Opacity')]: {
    id: generateTransformerId('Node Opacity'),
    name: 'Node Opacity',
    description:
      'Adjusts node transparency based on generation depth, number of children, lifespan, and family importance',
    transform: nodeOpacityTransform as VisualTransformerConfig['transform'],
    categories: ['visual', 'opacity'],
    parameters: {
      baseOpacity: {
        type: 'number',
        defaultValue: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        description: 'Base opacity for all nodes',
      },
      minOpacity: {
        type: 'number',
        defaultValue: 0.3,
        min: 0.1,
        max: 0.9,
        step: 0.05,
        description: 'Minimum opacity allowed',
      },
    },
  },
  [generateTransformerId('Edge Opacity')]: {
    id: generateTransformerId('Edge Opacity'),
    name: 'Edge Opacity',
    description:
      'Controls edge transparency based on relationship type, generation distance, family importance, and edge length',
    transform: edgeOpacityTransform as VisualTransformerConfig['transform'],
    categories: ['visual', 'opacity'],
    parameters: {
      baseOpacity: {
        type: 'number',
        defaultValue: 0.7,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        description: 'Base opacity for all edges',
      },
      minOpacity: {
        type: 'number',
        defaultValue: 0.2,
        min: 0.1,
        max: 0.9,
        step: 0.05,
        description: 'Minimum opacity allowed',
      },
    },
  },
  [generateTransformerId('Vertical Spread')]: {
    id: generateTransformerId('Vertical Spread'),
    name: 'Vertical Spread',
    description:
      'Adds vertical positioning to individuals within their generation, creating visual separation and avoiding straight lines',
    transform: verticalSpreadTransform as VisualTransformerConfig['transform'],
    categories: ['layout', 'positioning'],
    parameters: {
      verticalPadding: {
        type: 'number',
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
        description: 'Padding from top and bottom of canvas',
      },
      variationFactor: {
        type: 'number',
        defaultValue: 0.1,
        min: 0.0,
        max: 0.5,
        step: 0.01,
        description: 'Amount of random variation to apply',
      },
    },
  },
};

/**
 * Get a transformer by ID
 */
export function getTransformer(
  id: string,
): VisualTransformerConfig | undefined {
  return transformers[id];
}

/**
 * Get all transformers
 */
export function getAllTransformers(): VisualTransformerConfig[] {
  return Object.values(transformers);
}

/**
 * Get transformers by category
 */
export function getTransformersByCategory(
  category: string,
): VisualTransformerConfig[] {
  return getAllTransformers().filter((transformer) =>
    transformer.categories?.includes(category),
  );
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  getAllTransformers().forEach((transformer) => {
    transformer.categories?.forEach((category) => categories.add(category));
  });
  return Array.from(categories).sort();
}
