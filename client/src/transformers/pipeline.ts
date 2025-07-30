/**
 * VisualTransformer Pipeline
 *
 * This module implements the pipeline system for chaining and executing
 * multiple VisualTransformers in sequence.
 */

import type {
  LLMReadyData,
  IndividualId,
  FamilyId,
  EdgeId,
} from '../../../shared/types';
import type { AppGedcomDataWithMetadata } from '../types/app-data';
import type {
  VisualMetadata,
  CompleteVisualMetadata,
  TransformerContext,
  PipelineResult,
} from './types';
import type { VisualParameterValues } from './visual-parameters';
import {
  getTransformer,
  type TransformerId,
  transformers,
} from './transformers';
import {
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
} from './constants';

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  // List of transformer IDs to execute in order
  transformerIds: TransformerId[];

  // Randomness control (0.0 = deterministic, 1.0 = fully random)
  temperature?: number;

  // Seed for reproducible randomness
  seed?: string;

  // Canvas dimensions for reference
  canvasWidth?: number;
  canvasHeight?: number;
}

interface PipelineInput {
  fullData: AppGedcomDataWithMetadata;
  llmData: LLMReadyData;
  config: PipelineConfig;
}

interface TransformerResult {
  transformerId: TransformerId;
  transformerName: string;
  executionTime: number;
  success: boolean;
  error?: string;
}

// Re-export PipelineResult from types
export type { PipelineResult } from './types';

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
 * Create initial visual metadata for a single entity
 */
function createInitialEntityVisualMetadata(): VisualMetadata {
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
 * Create complete initial visual metadata structure
 * Mirrors the data structure with visual metadata for every entity
 */
export function createInitialCompleteVisualMetadata(
  gedcomData: AppGedcomDataWithMetadata,
  canvasWidth = 800,
  canvasHeight = 600,
): CompleteVisualMetadata {
  const individuals = new Map<IndividualId, VisualMetadata>();
  const families = new Map<FamilyId, VisualMetadata>();
  const edges = new Map<EdgeId, VisualMetadata>();

  // Initialize visual metadata for each individual
  gedcomData.individuals.forEach((_, individualId) => {
    individuals.set(individualId, createInitialEntityVisualMetadata());
  });

  // Initialize visual metadata for each family
  gedcomData.families.forEach((_, familyId) => {
    families.set(familyId, {
      ...createInitialEntityVisualMetadata(),
      // Family-specific defaults
      strokeColor: '#666',
      strokeWeight: 1,
      strokeStyle: 'solid',
      // Remove position attributes for families (they're connections, not positioned entities)
      x: undefined,
      y: undefined,
      size: undefined,
      shape: undefined,
    });
  });

  // Initialize visual metadata for each edge
  gedcomData.metadata.edges.forEach((edge) => {
    edges.set(edge.id, {
      // Edge-specific defaults
      strokeColor: DEFAULT_STROKE_COLOR,
      strokeWeight: DEFAULT_STROKE_WEIGHT,
      strokeStyle: DEFAULT_STROKE_STYLE,
      opacity: 1.0,
      // Remove position attributes for edges (they're connections, not positioned entities)
      x: undefined,
      y: undefined,
      size: undefined,
      shape: undefined,
      // Edge-specific grouping
      group: 'edges',
      layer: 1, // Edges typically rendered below nodes
      priority: 0,
    });
  });

  return {
    individuals,
    families,
    edges,
    tree: {
      // Tree-level visual settings
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      group: 'tree',
      layer: 0,
      priority: 0,
    },
    global: {
      canvasWidth,
      canvasHeight,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      defaultNodeSize: DEFAULT_SIZE,
      defaultEdgeWeight: DEFAULT_STROKE_WEIGHT,
      defaultNodeColor: DEFAULT_COLOR,
      defaultEdgeColor: DEFAULT_STROKE_COLOR,
      defaultNodeShape: DEFAULT_SHAPE,
      defaultEdgeStyle: DEFAULT_STROKE_STYLE,
    },
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
 * Deep merge visual metadata objects
 * Handles nested structures like individuals and families
 */
function mergeVisualMetadata(
  base: CompleteVisualMetadata,
  updates: Partial<CompleteVisualMetadata>,
): CompleteVisualMetadata {
  const result = { ...base };

  // Merge individuals
  if (updates.individuals) {
    result.individuals = new Map(result.individuals);
    updates.individuals.forEach((metadata, individualId) => {
      const existing = result.individuals.get(individualId) ?? {};
      result.individuals.set(individualId, {
        ...existing,
        ...metadata,
      });
    });
  }

  // Merge families
  if (updates.families) {
    result.families = new Map(result.families);
    updates.families.forEach((metadata, familyId) => {
      const existing = result.families.get(familyId) ?? {};
      result.families.set(familyId, {
        ...existing,
        ...metadata,
      });
    });
  }

  // Merge edges
  if (updates.edges) {
    result.edges = new Map(result.edges);
    updates.edges.forEach((metadata, edgeId) => {
      const existing = result.edges.get(edgeId) ?? {};
      result.edges.set(edgeId, {
        ...existing,
        ...metadata,
      });
    });
  }

  // Merge tree metadata
  if (updates.tree) {
    result.tree = { ...result.tree, ...updates.tree };
  }

  // Merge global settings
  if (updates.global) {
    result.global = { ...result.global, ...updates.global };
  }

  return result;
}

/**
 * Run the VisualTransformer pipeline
 * Executes all transformers in sequence, passing the output of each
 * as input to the next transformer.
 */
export async function runPipeline({
  fullData,
  llmData,
  config,
}: PipelineInput): Promise<PipelineResult> {
  const startTime = performance.now();

  // Log input data info (validation already done in data loading)
  console.log('🔍 Pipeline input data info...');
  console.log(
    `✅ Full data: ${String(fullData.individuals.size)} individuals, ${String(fullData.families.size)} families`,
  );
  console.log(
    `✅ LLM data: ${String(Object.keys(llmData.individuals).length)} anonymized individuals`,
  );

  // Initialize complete visual metadata structure
  let visualMetadata = createInitialCompleteVisualMetadata(
    fullData,
    config.canvasWidth,
    config.canvasHeight,
  );

  // Track transformer execution results
  const transformerResults: TransformerResult[] = [];

  // Execute each transformer in sequence
  for (const transformerId of config.transformerIds) {
    const transformerStartTime = performance.now();

    try {
      // Get transformer from registry
      const transformer = getTransformer(transformerId);

      // Create context for this transformer
      const context: TransformerContext = {
        gedcomData: fullData,
        llmData,
        visualMetadata,
        temperature: config.temperature,
        seed: config.seed,
        canvasWidth: config.canvasWidth,
        canvasHeight: config.canvasHeight,
        dimensions: { primary: 'generation' },
        visual: {} as VisualParameterValues, // Will be overridden by factory function
      };

      // Execute transformer using factory function to inject parameters
      const runtimeTransformer = transformer.createRuntimeTransformerFunction({
        dimensions: { primary: 'generation' },
        visual: {},
      });
      const result = await runtimeTransformer(context);

      // Update visual metadata with transformer output using deep merge
      visualMetadata = mergeVisualMetadata(
        visualMetadata,
        result.visualMetadata,
      );

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
    config,
    debug: {
      transformerResults: transformerResults.map((result) => ({
        transformerId: result.transformerId,
        transformerName: result.transformerName,
        output: { visualMetadata: {} },
        executionTime: result.executionTime,
        success: result.success,
        error: result.error,
      })),
      totalExecutionTime: executionTime,
    },
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

  // Check if all transformers exist
  for (const transformerId of config.transformerIds) {
    if (!(transformerId in transformers)) {
      errors.push(`Transformer not found: ${transformerId}`);
    }
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

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a simple pipeline with default settings
 */
export function createSimplePipeline(
  transformerIds: TransformerId[],
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
