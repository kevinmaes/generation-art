/**
 * VisualTransformer Registry
 *
 * This file exports all available transformers keyed by their unique IDs.
 * Each transformer configuration is defined here, with the actual transform
 * functions imported from their respective files.
 */

import type { VisualTransformerConfig } from './types';
import { horizontalSpreadByGenerationTransform } from './horizontal-spread-by-generation';
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
