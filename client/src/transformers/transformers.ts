/**
 * VisualTransformer Registry
 *
 * This file exports all available transformers keyed by their unique IDs.
 * Each transformer configuration is defined here, with the actual transform
 * functions imported from their respective files.
 */

import type { VisualTransformerConfig } from './types';
import { horizontalSpreadTransform } from './horizontal-spread';
import { nodeSizeTransform } from './node-size';
import { nodeOpacityTransform } from './node-opacity';
import { edgeOpacityTransform } from './edge-opacity';
import { verticalSpreadTransform } from './vertical-spread';
import { nodeShapeTransform } from './node-shape';
import { nodeRotationTransform } from './node-rotation';
import { nodeScaleTransform } from './node-scale';
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
export const NODE_SHAPE = {
  ID: 'node-shape',
  NAME: 'Node Shape',
} as const;
export const NODE_ROTATION = {
  ID: 'node-rotation',
  NAME: 'Node Rotation',
} as const;
export const NODE_SCALE = {
  ID: 'node-scale',
  NAME: 'Node Scale',
} as const;

export type TransformerId =
  | typeof HORIZONTAL_SPREAD.ID
  | typeof NODE_SIZE.ID
  | typeof NODE_OPACITY.ID
  | typeof EDGE_OPACITY.ID
  | typeof VERTICAL_SPREAD.ID
  | typeof NODE_SHAPE.ID
  | typeof NODE_ROTATION.ID
  | typeof NODE_SCALE.ID;

/**
 * Registry of all available transformers
 * Keyed by transformer ID for type safety
 */
export const transformers: Record<TransformerId, VisualTransformerConfig> = {
  [HORIZONTAL_SPREAD.ID]: {
    id: HORIZONTAL_SPREAD.ID,
    name: HORIZONTAL_SPREAD.NAME,
    description:
      'Uses advanced algorithms to create visually compelling horizontal arrangements with customizable spacing, padding, and variation factors.',
    shortDescription: 'Spreads nodes horizontally by generation or age',
    transform: horizontalSpreadTransform as VisualTransformerFn,
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
      createRuntimeTransformerFunction(params, horizontalSpreadTransform),
  },
  [NODE_SIZE.ID]: {
    id: NODE_SIZE.ID,
    name: NODE_SIZE.NAME,
    description:
      'Intelligently scales visual elements using sophisticated algorithms that consider multiple family metrics and importance indicators.',
    shortDescription: 'Adjusts node sizes by children or lifespan',
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
      'Creates sophisticated transparency effects by analyzing family relationships, generational depth, and genealogical significance patterns.',
    shortDescription: 'Controls node transparency by generation or children',
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
      'Applies nuanced transparency and width variations to relationship lines, considering generational distance, family importance, and visual hierarchy.',
    shortDescription: 'Controls edge transparency by relationship type',
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
      'Employs sophisticated vertical positioning algorithms to create meaningful visual separations and hierarchies within family structures.',
    shortDescription: 'Spreads nodes vertically by birth year or children',
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
    visualParameters: [
      'verticalPadding',
      'nodeSize',
      'primaryColor',
      'spacing',
      'temperature',
      'variationFactor',
    ],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, verticalSpreadTransform),
  },
  [NODE_SHAPE.ID]: {
    id: NODE_SHAPE.ID,
    name: NODE_SHAPE.NAME,
    description:
      'Uses sophisticated algorithms to map genealogical patterns to geometric forms, creating meaningful visual distinctions across family structures.',
    shortDescription: 'Changes node shapes based on generation or metadata',
    transform: nodeShapeTransform as VisualTransformerFn,
    categories: ['visual', 'shape'],
    availableDimensions: [
      'generation',
      'childrenCount',
      'lifespan',
      'marriageCount',
      'birthYear',
      'nameLength',
    ],
    defaultPrimaryDimension: 'generation',
    defaultSecondaryDimension: 'childrenCount',
    visualParameters: ['variationFactor', 'temperature'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, nodeShapeTransform),
  },
  [NODE_ROTATION.ID]: {
    id: NODE_ROTATION.ID,
    name: NODE_ROTATION.NAME,
    description:
      'Applies precise angular calculations that reflect temporal and genealogical relationships, adding dynamic visual interest to family trees.',
    shortDescription: 'Rotates nodes based on birth year or lifespan',
    transform: nodeRotationTransform as VisualTransformerFn,
    categories: ['visual', 'rotation'],
    availableDimensions: [
      'birthYear',
      'generation',
      'lifespan',
      'childrenCount',
      'marriageCount',
      'nameLength',
    ],
    defaultPrimaryDimension: 'birthYear',
    defaultSecondaryDimension: 'generation',
    visualParameters: ['variationFactor', 'temperature'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, nodeRotationTransform),
  },
  [NODE_SCALE.ID]: {
    id: NODE_SCALE.ID,
    name: NODE_SCALE.NAME,
    description:
      'Applies independent width and height transformations that create compelling oval and rectangular forms reflecting individual significance.',
    shortDescription: 'Scales node dimensions for oval or rectangular shapes',
    transform: nodeScaleTransform as VisualTransformerFn,
    categories: ['visual', 'scale'],
    availableDimensions: [
      'lifespan',
      'childrenCount',
      'generation',
      'marriageCount',
      'birthYear',
      'nameLength',
    ],
    defaultPrimaryDimension: 'lifespan',
    defaultSecondaryDimension: 'childrenCount',
    visualParameters: ['variationFactor', 'temperature'],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, nodeScaleTransform),
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
