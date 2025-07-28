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
import type { VisualTransformerFn } from './types';
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
    transform: horizontalSpreadByGenerationTransform as VisualTransformerFn,
    categories: ['layout', 'positioning'],
    availableDimensions: [
      'generation',
      'birthYear',
      'childrenCount',
      'lifespan',
      'nameLength',
    ],
    visualParameters: [
      'horizontalPadding',
      'spacing',
      'nodeSize',
      'primaryColor',
    ],
    createRuntimeTransformerFunction: (_params) => {
      return async (context) => {
        // For now, just call the original transform function
        // TODO: Implement parameter injection
        return await horizontalSpreadByGenerationTransform(context);
      };
    },
  },
  [generateTransformerId('Node Size')]: {
    id: generateTransformerId('Node Size'),
    name: 'Node Size',
    description:
      'Controls the size of nodes based on metadata like number of children, age at death, or importance metrics',
    transform: nodeSizeTransform as VisualTransformerFn,
    categories: ['visual', 'size'],
    availableDimensions: [
      'childrenCount',
      'lifespan',
      'generation',
      'marriageCount',
    ],
    visualParameters: ['nodeSize', 'variationFactor'],
    createRuntimeTransformerFunction: (_params) => {
      return async (context) => {
        // For now, just call the original transform function
        // TODO: Implement parameter injection
        return await nodeSizeTransform(context);
      };
    },
  },
  [generateTransformerId('Node Opacity')]: {
    id: generateTransformerId('Node Opacity'),
    name: 'Node Opacity',
    description:
      'Adjusts node transparency based on generation depth, number of children, lifespan, and family importance',
    transform: nodeOpacityTransform as VisualTransformerFn,
    categories: ['visual', 'opacity'],
    availableDimensions: [
      'generation',
      'childrenCount',
      'lifespan',
      'distanceFromRoot',
    ],
    visualParameters: ['nodeOpacity', 'variationFactor'],
    createRuntimeTransformerFunction: (_params) => {
      return async (context) => {
        // For now, just call the original transform function
        // TODO: Implement parameter injection
        return await nodeOpacityTransform(context);
      };
    },
  },
  [generateTransformerId('Edge Opacity')]: {
    id: generateTransformerId('Edge Opacity'),
    name: 'Edge Opacity',
    description:
      'Controls edge transparency based on relationship type, generation distance, family importance, and edge length',
    transform: edgeOpacityTransform as VisualTransformerFn,
    categories: ['visual', 'opacity'],
    availableDimensions: [
      'generation',
      'childrenCount',
      'lifespan',
      'relationshipDensity',
    ],
    visualParameters: ['edgeOpacity', 'edgeWidth', 'secondaryColor'],
    createRuntimeTransformerFunction: (_params) => {
      return async (context) => {
        // For now, just call the original transform function
        // TODO: Implement parameter injection
        return await edgeOpacityTransform(context);
      };
    },
  },
  [generateTransformerId('Vertical Spread')]: {
    id: generateTransformerId('Vertical Spread'),
    name: 'Vertical Spread',
    description:
      'Adds vertical positioning to individuals within their generation, creating visual separation and avoiding straight lines',
    transform: verticalSpreadTransform as VisualTransformerFn,
    categories: ['layout', 'positioning'],
    availableDimensions: [
      'birthYear',
      'childrenCount',
      'lifespan',
      'generation',
      'nameLength',
    ],
    visualParameters: ['verticalPadding', 'spacing', 'variationFactor'],
    createRuntimeTransformerFunction: (_params) => {
      return async (context) => {
        // For now, just call the original transform function
        // TODO: Implement parameter injection
        return await verticalSpreadTransform(context);
      };
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
