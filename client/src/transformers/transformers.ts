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
import { smartLayoutTransform } from './smart-layout';
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
export const SMART_LAYOUT = {
  ID: 'smart-layout',
  NAME: 'Smart Layout',
} as const;

export type TransformerId =
  | typeof HORIZONTAL_SPREAD.ID
  | typeof NODE_SIZE.ID
  | typeof NODE_OPACITY.ID
  | typeof EDGE_OPACITY.ID
  | typeof VERTICAL_SPREAD.ID
  | typeof NODE_SHAPE.ID
  | typeof NODE_ROTATION.ID
  | typeof NODE_SCALE.ID
  | typeof SMART_LAYOUT.ID;

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
      {
        name: 'horizontalPadding',
        type: 'range',
        defaultValue: 80,
        label: 'Horizontal Padding',
        description: 'Padding from left and right of canvas',
        min: 10,
        max: 200,
        step: 5,
      },
      {
        name: 'nodeSize',
        type: 'select',
        defaultValue: 'medium',
        label: 'Node Size',
        description: 'Size of individual nodes',
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'extra-large', label: 'Extra Large' },
        ],
      },
      {
        name: 'primaryColor',
        type: 'color',
        defaultValue: '#4A90E2',
        label: 'Primary Color',
        description: 'Main color for nodes',
      },
      {
        name: 'spacing',
        type: 'select',
        defaultValue: 'normal',
        label: 'Spacing',
        description: 'General spacing between elements',
        options: [
          { value: 'tight', label: 'Tight' },
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'loose', label: 'Loose' },
          { value: 'sparse', label: 'Sparse' },
        ],
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.3,
        label: 'Temperature',
        description: 'Randomness factor for non-deterministic behavior',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.2,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
    getDefaults: () => ({
      horizontalPadding: 80,
      nodeSize: 'medium',
      primaryColor: '#4A90E2',
      spacing: 'normal',
      temperature: 0.3,
      variationFactor: 0.2,
    }),
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, horizontalSpreadTransform, [
        { name: 'horizontalPadding', defaultValue: 80 },
        { name: 'nodeSize', defaultValue: 'medium' },
        { name: 'primaryColor', defaultValue: '#4A90E2' },
        { name: 'spacing', defaultValue: 'normal' },
        { name: 'temperature', defaultValue: 0.3 },
        { name: 'variationFactor', defaultValue: 0.2 },
      ]),
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
    visualParameters: [
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.3,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'nodeSize',
        type: 'select',
        defaultValue: 'medium',
        label: 'Node Size',
        description: 'Size of individual nodes',
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'extra-large', label: 'Extra Large' },
        ],
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.4,
        label: 'Temperature',
        description: 'Randomness factor for non-deterministic behavior',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
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
    visualParameters: [
      {
        name: 'nodeOpacity',
        type: 'range',
        defaultValue: 0.9,
        label: 'Node Opacity',
        description: 'Opacity of individual nodes',
        min: 0.1,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.2,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
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
    visualParameters: [
      {
        name: 'edgeOpacity',
        type: 'range',
        defaultValue: 0.5,
        label: 'Edge Opacity',
        description: 'Opacity of relationship lines',
        min: 0.1,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'edgeWidth',
        type: 'select',
        defaultValue: 'normal',
        label: 'Edge Width',
        description: 'Width of relationship lines',
        options: [
          { value: 'thin', label: 'Thin' },
          { value: 'normal', label: 'Normal' },
          { value: 'thick', label: 'Thick' },
          { value: 'bold', label: 'Bold' },
        ],
      },
      {
        name: 'secondaryColor',
        type: 'color',
        defaultValue: '#666666',
        label: 'Secondary Color',
        description: 'Secondary color for edges',
      },
    ],
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
      {
        name: 'verticalPadding',
        type: 'range',
        defaultValue: 60,
        label: 'Vertical Padding',
        description: 'Padding from top and bottom of canvas',
        min: 10,
        max: 200,
        step: 5,
      },
      {
        name: 'nodeSize',
        type: 'select',
        defaultValue: 'medium',
        label: 'Node Size',
        description: 'Size of individual nodes',
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'extra-large', label: 'Extra Large' },
        ],
      },
      {
        name: 'primaryColor',
        type: 'color',
        defaultValue: '#7B68EE',
        label: 'Primary Color',
        description: 'Main color for nodes',
      },
      {
        name: 'spacing',
        type: 'select',
        defaultValue: 'normal',
        label: 'Spacing',
        description: 'General spacing between elements',
        options: [
          { value: 'tight', label: 'Tight' },
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'loose', label: 'Loose' },
          { value: 'sparse', label: 'Sparse' },
        ],
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.4,
        label: 'Temperature',
        description: 'Randomness factor for non-deterministic behavior',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.25,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
    getDefaults: () => ({
      verticalPadding: 60,
      nodeSize: 'medium',
      primaryColor: '#7B68EE',
      spacing: 'normal',
      temperature: 0.4,
      variationFactor: 0.25,
    }),
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, verticalSpreadTransform, [
        { name: 'verticalPadding', defaultValue: 60 },
        { name: 'nodeSize', defaultValue: 'medium' },
        { name: 'primaryColor', defaultValue: '#7B68EE' },
        { name: 'spacing', defaultValue: 'normal' },
        { name: 'temperature', defaultValue: 0.4 },
        { name: 'variationFactor', defaultValue: 0.25 },
      ]),
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
    visualParameters: [
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.15,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.2,
        label: 'Temperature',
        description: 'Randomness factor for non-deterministic behavior',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
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
    visualParameters: [
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.3,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.6,
        label: 'Temperature',
        description: 'Randomness factor for non-deterministic behavior',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
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
    visualParameters: [
      {
        name: 'variationFactor',
        type: 'range',
        defaultValue: 0.25,
        label: 'Variation Factor',
        description: 'Amount of random variation to apply',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.3,
        label: 'Temperature',
        description: 'Randomness factor for non-deterministic behavior',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, nodeScaleTransform),
  },
  [SMART_LAYOUT.ID]: {
    id: SMART_LAYOUT.ID,
    name: SMART_LAYOUT.NAME,
    description:
      'AI-powered layout that uses machine learning to intelligently position nodes and edges based on family tree structure and user preferences.',
    shortDescription: 'Smart AI-powered layout positioning',
    transform: smartLayoutTransform as VisualTransformerFn,
    categories: ['layout', 'ai'],
    requiresLLM: true,
    availableDimensions: [
      'generation',
      'birthYear',
      'childrenCount',
      'lifespan',
    ],
    defaultPrimaryDimension: 'generation',
    defaultSecondaryDimension: 'birthYear',
    visualParameters: [
      {
        name: 'layoutStyle',
        type: 'select',
        defaultValue: 'tree',
        label: 'Layout Style',
        description: 'AI-powered layout algorithm for positioning nodes',
        options: [
          { value: 'tree', label: 'Tree (Hierarchical)' },
          { value: 'radial', label: 'Radial (Circular)' },
          { value: 'grid', label: 'Grid (Uniform)' },
        ],
      },
      {
        name: 'spacing',
        type: 'select',
        defaultValue: 'normal',
        label: 'Spacing',
        description: 'General spacing between elements',
        options: [
          { value: 'tight', label: 'Tight' },
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'loose', label: 'Loose' },
          { value: 'sparse', label: 'Sparse' },
        ],
      },
      {
        name: 'temperature',
        type: 'range',
        defaultValue: 0.5,
        label: 'Temperature',
        description:
          'Creativity level for AI layout (0 = strict, 1 = creative)',
        min: 0,
        max: 1.0,
        step: 0.1,
      },
    ],
    getDefaults: () => ({
      layoutStyle: 'tree',
      spacing: 'normal',
      temperature: 0.5,
    }),
    createRuntimeTransformerFunction: (params) =>
      createRuntimeTransformerFunction(params, smartLayoutTransform, [
        { name: 'layoutStyle', defaultValue: 'tree' },
        { name: 'spacing', defaultValue: 'normal' },
        { name: 'temperature', defaultValue: 0.5 },
      ]),
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
