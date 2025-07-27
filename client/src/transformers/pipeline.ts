/**
 * VisualTransformer Pipeline
 *
 * This module implements the pipeline system for chaining and executing
 * multiple VisualTransformers in sequence.
 */

import type { TransformerContext, VisualMetadata } from './types';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import { getTransformer } from './transformers';

/**
 * Default visual metadata constants
 */

// Default position (center of canvas)
const DEFAULT_X = 0;
const DEFAULT_Y = 0;

// Default size and scale
const DEFAULT_SIZE = 20;
const DEFAULT_SCALE = 1.0;

// Default colors
const DEFAULT_COLOR = '#4CAF50';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_STROKE_COLOR = '#000000';
const DEFAULT_OPACITY = 1.0;
const DEFAULT_ALPHA = 1.0;

// Default shape and style
const DEFAULT_SHAPE = 'circle' as const;
const DEFAULT_STROKE_WEIGHT = 1;
const DEFAULT_STROKE_STYLE = 'solid' as const;

// Default animation and motion values
const DEFAULT_VELOCITY = { x: 0, y: 0 };
const DEFAULT_ACCELERATION = { x: 0, y: 0 };
const DEFAULT_ROTATION = 0;
const DEFAULT_ROTATION_SPEED = 0;

// Default layout and grouping values
const DEFAULT_GROUP = 'default';
const DEFAULT_LAYER = 0;
const DEFAULT_PRIORITY = 0;

// Default custom attributes
const DEFAULT_CUSTOM = {};

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  // List of transformer IDs to execute in order
  transformerIds: string[];

  // Randomness control (0.0 = deterministic, 1.0 = fully random)
  temperature?: number;

  // Seed for reproducible randomness
  seed?: string;

  // Canvas dimensions for reference
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  // Final visual metadata after all transformers
  visualMetadata: VisualMetadata;

  // Execution details
  executionTime: number;
  transformerResults: {
    transformerId: string;
    transformerName: string;
    executionTime: number;
    success: boolean;
    error?: string;
  }[];

  // Pipeline configuration used
  config: PipelineConfig;
}

/**
 * Pipeline execution error
 */
export interface PipelineError {
  transformerId: string;
  transformerName: string;
  error: string;
  step: number;
}

/**
 * Create initial visual metadata with default values
 */
export function createInitialVisualMetadata(): VisualMetadata {
  return {
    x: DEFAULT_X,
    y: DEFAULT_Y,
    size: DEFAULT_SIZE,
    scale: DEFAULT_SCALE,
    color: DEFAULT_COLOR,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    strokeColor: DEFAULT_STROKE_COLOR,
    opacity: DEFAULT_OPACITY,
    alpha: DEFAULT_ALPHA,
    shape: DEFAULT_SHAPE,
    strokeWeight: DEFAULT_STROKE_WEIGHT,
    strokeStyle: DEFAULT_STROKE_STYLE,
    velocity: DEFAULT_VELOCITY,
    acceleration: DEFAULT_ACCELERATION,
    rotation: DEFAULT_ROTATION,
    rotationSpeed: DEFAULT_ROTATION_SPEED,
    group: DEFAULT_GROUP,
    layer: DEFAULT_LAYER,
    priority: DEFAULT_PRIORITY,
    custom: DEFAULT_CUSTOM,
  };
}

/**
 * Create a seeded random number generator
 * This ensures reproducible results when a seed is provided
 * (Currently unused, will be used in Phase 3)
 */
export function createSeededRandom(seed?: string): () => number {
  if (!seed) {
    return Math.random;
  }

  // Simple seeded random generator
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  let state = Math.abs(hash);

  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Run the VisualTransformer pipeline
 * Executes all transformers in sequence, passing the output of each
 * as input to the next transformer.
 */
export async function runPipeline(
  metadata: GedcomDataWithMetadata,
  config: PipelineConfig,
): Promise<PipelineResult> {
  const startTime = performance.now();
  const transformerResults: PipelineResult['transformerResults'] = [];

  // Create seeded random generator (for future use)
  // const random = createSeededRandom(config.seed);

  // Initialize visual metadata
  let visualMetadata = createInitialVisualMetadata();

  // Execute each transformer in sequence
  for (const transformerId of config.transformerIds) {
    const transformerStartTime = performance.now();

    try {
      // Get transformer from registry
      const transformer = getTransformer(transformerId);
      if (!transformer) {
        throw new Error(`Transformer not found: ${transformerId}`);
      }

      // Create context for this transformer
      const context: TransformerContext = {
        metadata,
        visualMetadata,
        temperature: config.temperature,
        seed: config.seed,
        canvasWidth: config.canvasWidth,
        canvasHeight: config.canvasHeight,
      };

      // Execute transformer
      const result = await transformer.transform(context);

      // Update visual metadata with transformer output
      visualMetadata = {
        ...visualMetadata,
        ...result.visualMetadata,
      };

      // Record successful execution
      transformerResults.push({
        transformerId,
        transformerName: transformer.name,
        executionTime: performance.now() - transformerStartTime,
        success: true,
      });
    } catch (error) {
      // Record failed execution
      transformerResults.push({
        transformerId,
        transformerName: transformerId, // Fallback name
        executionTime: performance.now() - transformerStartTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      // Continue with next transformer (don't fail the entire pipeline)
      console.warn(`Transformer ${transformerId} failed:`, error);
    }
  }

  const executionTime = performance.now() - startTime;

  return {
    visualMetadata,
    executionTime,
    transformerResults,
    config,
  };
}

/**
 * Validate a pipeline configuration
 */
export function validatePipelineConfig(config: PipelineConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.transformerIds.length === 0) {
    errors.push('Pipeline must have at least one transformer');
  }

  if (
    config.temperature !== undefined &&
    (config.temperature < 0 || config.temperature > 1)
  ) {
    errors.push('Temperature must be between 0 and 1');
  }

  if (config.canvasWidth !== undefined && config.canvasWidth <= 0) {
    errors.push('Canvas width must be positive');
  }

  if (config.canvasHeight !== undefined && config.canvasHeight <= 0) {
    errors.push('Canvas height must be positive');
  }

  // Validate that all transformer IDs exist
  for (const transformerId of config.transformerIds) {
    const transformer = getTransformer(transformerId);
    if (!transformer) {
      errors.push(`Transformer not found: ${transformerId}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a simple pipeline with default settings
 */
export function createSimplePipeline(
  transformerIds: string[],
  options?: {
    temperature?: number;
    seed?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  },
): PipelineConfig {
  return {
    transformerIds,
    temperature: options?.temperature ?? 0.5,
    seed: options?.seed,
    canvasWidth: options?.canvasWidth,
    canvasHeight: options?.canvasHeight,
  };
}

// Export constants for testing
export {
  DEFAULT_X,
  DEFAULT_Y,
  DEFAULT_SIZE,
  DEFAULT_SCALE,
  DEFAULT_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_OPACITY,
  DEFAULT_ALPHA,
  DEFAULT_SHAPE,
  DEFAULT_STROKE_WEIGHT,
  DEFAULT_STROKE_STYLE,
  DEFAULT_VELOCITY,
  DEFAULT_ACCELERATION,
  DEFAULT_ROTATION,
  DEFAULT_ROTATION_SPEED,
  DEFAULT_GROUP,
  DEFAULT_LAYER,
  DEFAULT_PRIORITY,
  DEFAULT_CUSTOM,
};
