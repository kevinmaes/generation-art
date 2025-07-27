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
    // Default position (center of canvas)
    x: 0,
    y: 0,

    // Default size
    size: 20,
    scale: 1.0,

    // Default colors
    color: '#4CAF50',
    backgroundColor: '#ffffff',
    strokeColor: '#000000',
    opacity: 1.0,
    alpha: 1.0,

    // Default shape
    shape: 'circle',
    strokeWeight: 1,
    strokeStyle: 'solid',

    // Default animation values
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    rotation: 0,
    rotationSpeed: 0,

    // Default layout values
    group: 'default',
    layer: 0,
    priority: 0,

    // Custom attributes
    custom: {},
  };
}

/**
 * Create a seeded random number generator
 * This ensures reproducible results when a seed is provided
 * (Currently unused, will be used in Phase 3)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createSeededRandom(seed?: string): () => number {
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
