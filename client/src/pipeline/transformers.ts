/**
 * VisualTransformer Registry
 *
 * This file exports all available transformers keyed by their unique IDs.
 * Each transformer configuration is defined here, with the actual transform
 * functions imported from their respective files.
 */

import type { VisualTransformerConfig } from './types';
import { horizontalSpreadConfig } from './transformers/horizontal-spread';
import { nodeSizeConfig } from './transformers/node-size';
import { nodeOpacityConfig } from './transformers/node-opacity';
import { edgeOpacityConfig } from './transformers/edge-opacity';
import { verticalSpreadConfig } from './transformers/vertical-spread';
import { nodeShapeConfig } from './transformers/node-shape';
import { nodeRotationConfig } from './transformers/node-rotation';
import { nodeScaleConfig } from './transformers/node-scale';
import { smartLayoutTransformerConfig } from './transformers/smart-layout';
import { edgeCurveConfig } from './transformers/edge-curve';
import { varianceConfig } from './transformers/variance';
import { simpleTreeConfig } from './transformers/simple-tree';
import { walkerTreeConfig } from './transformers/walker-tree';
import { fanChartConfig } from './transformers/fan-chart';

// Transformer constants for type safety
export const TRANSFORMERS = {
  HORIZONTAL_SPREAD: {
    ID: 'horizontal-spread',
    NAME: 'Horizontal Spread',
  },
  NODE_SIZE: {
    ID: 'node-size',
    NAME: 'Node Size',
  },
  NODE_OPACITY: {
    ID: 'node-opacity',
    NAME: 'Node Opacity',
  },
  EDGE_OPACITY: {
    ID: 'edge-opacity',
    NAME: 'Edge Opacity',
  },
  VERTICAL_SPREAD: {
    ID: 'vertical-spread',
    NAME: 'Vertical Spread',
  },
  NODE_SHAPE: {
    ID: 'node-shape',
    NAME: 'Node Shape',
  },
  NODE_ROTATION: {
    ID: 'node-rotation',
    NAME: 'Node Rotation',
  },
  NODE_SCALE: {
    ID: 'node-scale',
    NAME: 'Node Scale',
  },
  SMART_LAYOUT: {
    ID: 'smart-layout',
    NAME: 'Smart Layout',
  },
  EDGE_CURVE: {
    ID: 'edge-curve',
    NAME: 'Edge Curve',
  },
  VARIANCE: {
    ID: 'variance',
    NAME: 'Variance',
  },
  SIMPLE_TREE: {
    ID: 'simple-tree',
    NAME: 'Simple Tree Layout',
  },
  WALKER_TREE: {
    ID: 'walker-tree',
    NAME: 'Walker Tree Layout',
  },
  FAN_CHART: {
    ID: 'fan-chart',
    NAME: 'Fan Chart Layout',
  },
} as const;

export type TransformerId =
  (typeof TRANSFORMERS)[keyof typeof TRANSFORMERS]['ID'];

export type TransformerName =
  (typeof TRANSFORMERS)[keyof typeof TRANSFORMERS]['NAME'];

/**
 * Registry of all available transformer configurations
 * Keyed by transformer ID for type safety
 */
export const transformerConfigs: Record<
  TransformerId,
  VisualTransformerConfig
> = {
  'horizontal-spread': horizontalSpreadConfig,
  'node-size': nodeSizeConfig,
  'node-opacity': nodeOpacityConfig,
  'edge-opacity': edgeOpacityConfig,
  'vertical-spread': verticalSpreadConfig,
  'node-shape': nodeShapeConfig,
  'node-rotation': nodeRotationConfig,
  'node-scale': nodeScaleConfig,
  'smart-layout': smartLayoutTransformerConfig,
  'edge-curve': edgeCurveConfig,
  variance: varianceConfig,
  'simple-tree': simpleTreeConfig,
  'walker-tree': walkerTreeConfig,
  'fan-chart': fanChartConfig,
};

/**
 * Type guard to check if a string is a valid TransformerId
 */
export function isTransformerId(id: string): id is TransformerId {
  return id in transformerConfigs;
}

/**
 * Get a transformer by ID
 */
export function getTransformer(id: TransformerId): VisualTransformerConfig {
  return transformerConfigs[id];
}

/**
 * Get all transformer IDs as a properly typed array
 */
export function getTransformerIds(): TransformerId[] {
  return Object.keys(transformerConfigs).filter(isTransformerId);
}

/**
 * Get all transformer configs
 */
export function getAllTransformers(): VisualTransformerConfig[] {
  return Object.values(transformerConfigs);
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
