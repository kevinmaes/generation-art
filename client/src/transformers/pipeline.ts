/**
 * VisualTransformer Pipeline
 *
 * This module implements the pipeline system for chaining and executing
 * multiple VisualTransformers in sequence.
 */

import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';
import type {
  VisualMetadata,
  CompleteVisualMetadata,
  TransformerContext,
  PipelineResult,
} from './types';
import type { VisualParameterValues } from './visual-parameters';
import {
  getTransformer,
  SMART_LAYOUT,
  type TransformerId,
  transformers,
} from './transformers';
import { GedcomDataWithMetadataSchema } from '../../../shared/types';
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

export const PIPELINE_DEFAULTS: {
  TRANSFORMER_IDS: TransformerId[];
} = {
  TRANSFORMER_IDS: [SMART_LAYOUT.ID],
};

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

  // Transformer parameters (dimensions and visual parameters for each transformer)
  transformerParameters?: Record<
    string,
    {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
    }
  >;
}

interface PipelineInput {
  fullData: GedcomDataWithMetadata;
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

export const initialEntityVisualMetadata: VisualMetadata = {
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

/**
 * Create initial visual metadata for a single entity
 */
function createInitialEntityVisualMetadata(): VisualMetadata {
  return initialEntityVisualMetadata;
}

/**
 * Create complete initial visual metadata structure
 * Mirrors the data structure with visual metadata for every entity
 */
export function createInitialCompleteVisualMetadata(
  gedcomData: GedcomDataWithMetadata,
  canvasWidth = 800,
  canvasHeight = 600,
): CompleteVisualMetadata {
  const individuals: Record<string, VisualMetadata> = {};
  const families: Record<string, VisualMetadata> = {};
  const edges: Record<string, VisualMetadata> = {};

  // Initialize visual metadata for each individual
  Object.keys(gedcomData.individuals).forEach((individualId) => {
    individuals[individualId] = createInitialEntityVisualMetadata();
  });

  // Initialize visual metadata for each family
  Object.keys(gedcomData.families).forEach((familyId) => {
    families[familyId] = {
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
    };
  });

  // Initialize visual metadata for each edge
  gedcomData.metadata.edges.forEach((edge) => {
    edges[edge.id] = {
      // Edge-specific defaults
      strokeColor: DEFAULT_STROKE_COLOR,
      strokeWeight: DEFAULT_STROKE_WEIGHT,
      strokeStyle: DEFAULT_STROKE_STYLE,
      opacity: 0.5, // More transparent initial edges
      // Remove position attributes for edges (they're connections, not positioned entities)
      x: undefined,
      y: undefined,
      size: undefined,
      shape: undefined,
      // Edge-specific grouping
      group: 'edges',
      layer: 1, // Edges typically rendered below nodes
      priority: 0,
    };
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
    result.individuals = { ...result.individuals };
    Object.keys(updates.individuals).forEach((individualId) => {
      result.individuals[individualId] = {
        ...result.individuals[individualId],
        ...(updates.individuals?.[individualId] ?? {}),
      };
    });
  }

  // Merge families
  if (updates.families) {
    result.families = { ...result.families };
    Object.keys(updates.families).forEach((familyId) => {
      result.families[familyId] = {
        ...result.families[familyId],
        ...(updates.families?.[familyId] ?? {}),
      };
    });
  }

  // Merge edges
  if (updates.edges) {
    result.edges = { ...result.edges };
    Object.keys(updates.edges).forEach((edgeId) => {
      result.edges[edgeId] = {
        ...result.edges[edgeId],
        ...(updates.edges?.[edgeId] ?? {}),
      };
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

  // Validate input data with Zod
  try {
    console.log('🔍 Validating pipeline input data...');

    // Validate full data structure
    const validatedFullData = GedcomDataWithMetadataSchema.parse(fullData);
    console.log(
      `✅ Full data validated: ${String(Object.keys(validatedFullData.individuals).length)} individuals, ${String(Object.keys(validatedFullData.families).length)} families`,
    );

    // LLM data structure is guaranteed by TypeScript types
    console.log(
      `✅ LLM data validated: ${String(Object.keys(llmData.individuals).length)} anonymized individuals`,
    );

    // Use validated data
    fullData = validatedFullData;
  } catch (error) {
    console.error('❌ Pipeline input validation failed:', error);
    throw new Error(
      `Pipeline input validation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

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

      // Get transformer parameters from config (or use defaults)
      const transformerParams = config.transformerParameters?.[
        transformerId
      ] ?? {
        dimensions: {
          primary: transformer.defaultPrimaryDimension,
          secondary: transformer.defaultSecondaryDimension,
        },
        visual: {},
      };

      // Create context for this transformer
      const context: TransformerContext = {
        gedcomData: fullData,
        llmData,
        visualMetadata,
        temperature: config.temperature,
        seed: config.seed,
        canvasWidth: config.canvasWidth,
        canvasHeight: config.canvasHeight,
        dimensions: {
          primary:
            transformerParams.dimensions.primary ??
            transformer.defaultPrimaryDimension,
          secondary:
            transformerParams.dimensions.secondary ??
            transformer.defaultSecondaryDimension,
        },
        visual: transformerParams.visual,
      };

      // Execute transformer using factory function to inject parameters
      const runtimeTransformer = transformer.createRuntimeTransformerFunction({
        dimensions: {
          primary:
            transformerParams.dimensions.primary ??
            transformer.defaultPrimaryDimension,
          secondary:
            transformerParams.dimensions.secondary ??
            transformer.defaultSecondaryDimension,
        },
        visual: transformerParams.visual,
      });
      const result = await runtimeTransformer(context);

      // Update visual metadata with transformer output using deep merge
      visualMetadata = mergeVisualMetadata(
        visualMetadata,
        result.visualMetadata,
      );

      // Debug: check if shape transformer updated shapes
      if (transformerId === 'node-shape' && result.visualMetadata.individuals) {
        const sampleShapes = Object.entries(result.visualMetadata.individuals)
          .slice(0, 3)
          .map(([id, meta]) => `${id}:${meta.shape || 'undefined'}`)
          .join(', ');
        console.log(
          `🔍 After ${transformerId}: Sample shapes in result:`,
          sampleShapes,
        );

        const sampleFinalShapes = Object.entries(visualMetadata.individuals)
          .slice(0, 3)
          .map(([id, meta]) => `${id}:${meta.shape || 'undefined'}`)
          .join(', ');
        console.log(
          `🔍 After ${transformerId}: Sample shapes in final metadata:`,
          sampleFinalShapes,
        );
      }

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
    transformerParameters?: Record<
      string,
      {
        dimensions: { primary?: string; secondary?: string };
        visual: VisualParameterValues;
      }
    >;
  },
): PipelineConfig {
  return {
    transformerIds,
    temperature: options?.temperature ?? 0.5,
    seed: options?.seed,
    canvasWidth: options?.canvasWidth,
    canvasHeight: options?.canvasHeight,
    transformerParameters: options?.transformerParameters,
  };
}
