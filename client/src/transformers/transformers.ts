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
import { createRuntimeTransformerFunction } from './utils';

// Transformer constants for type safety
export const HORIZONTAL_SPREAD = {
  ID: 'horizontal-spread',
  NAME: 'Horizontal Spread',
} as const;
export const NODE_SIZE = { ID: 'node-size', NAME: 'Node Size' } as const;
export const NODE_OPACITY = {
  ID: 'node-opacity',
  NAME: 'Node Opacity',
} as const;
export const EDGE_OPACITY = {
  ID: 'edge-opacity',
  NAME: 'Edge Opacity',
} as const;
export const VERTICAL_SPREAD = {
  ID: 'vertical-spread',
  NAME: 'Vertical Spread',
} as const;

export type TransformerId =
  | typeof HORIZONTAL_SPREAD.ID
  | typeof NODE_SIZE.ID
  | typeof NODE_OPACITY.ID
  | typeof EDGE_OPACITY.ID
  | typeof VERTICAL_SPREAD.ID;

/**
 * Registry of all available transformers
 * Keyed by transformer ID for type safety
 */
export const transformers: Record<TransformerId, VisualTransformerConfig> = {
  [HORIZONTAL_SPREAD.ID]: {
    id: HORIZONTAL_SPREAD.ID,
    name: HORIZONTAL_SPREAD.NAME,
    description:
      'Positions individuals horizontally based on selected dimensions, creating spread-out layouts',
    transform: horizontalSpreadByGenerationTransform as VisualTransformerFn,
    categories: ['layout', 'positioning'],
    availableDimensions: [
      'generation',
      'birthYear',
      'childrenCount',
      'lifespan',
      'nameLength',
    ],
    defaultPrimaryDimension: 'generation',
    defaultSecondaryDimension: 'birthYear',
    visualParameters: [
      'horizontalPadding',
      'nodeSize',
      'primaryColor',
      'spacing',
      'temperature',
      'variationFactor',
    ],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(
        params,
        horizontalSpreadByGenerationTransform,
      ),
  },
  [NODE_SIZE.ID]: {
    id: NODE_SIZE.ID,
    name: NODE_SIZE.NAME,
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
    defaultPrimaryDimension: 'childrenCount',
    defaultSecondaryDimension: 'lifespan',
    visualParameters: ['variationFactor', 'nodeSize', 'temperature'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, nodeSizeTransform),
  },
  [NODE_OPACITY.ID]: {
    id: NODE_OPACITY.ID,
    name: NODE_OPACITY.NAME,
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
    defaultPrimaryDimension: 'generation',
    defaultSecondaryDimension: 'childrenCount',
    visualParameters: ['nodeOpacity', 'variationFactor'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, nodeOpacityTransform),
  },
  [EDGE_OPACITY.ID]: {
    id: EDGE_OPACITY.ID,
    name: EDGE_OPACITY.NAME,
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
    defaultPrimaryDimension: 'generation',
    defaultSecondaryDimension: 'childrenCount',
    visualParameters: ['edgeOpacity', 'edgeWidth', 'secondaryColor'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, edgeOpacityTransform),
  },
  [VERTICAL_SPREAD.ID]: {
    id: VERTICAL_SPREAD.ID,
    name: VERTICAL_SPREAD.NAME,
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
    defaultPrimaryDimension: 'birthYear',
    defaultSecondaryDimension: 'childrenCount',
    visualParameters: ['verticalPadding', 'variationFactor', 'spacing'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, verticalSpreadTransform),
  },
};

/**
 * Type guard to check if a string is a valid TransformerId
 */
export function isTransformerId(id: string): id is TransformerId {
  return id in transformers;
}

/**
 * Get a transformer by ID
 */
export function getTransformer(id: TransformerId): VisualTransformerConfig {
  return transformers[id];
}

/**
 * Get all transformer IDs as a properly typed array
 */
export function getTransformerIds(): TransformerId[] {
  return Object.keys(transformers).filter(isTransformerId);
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
