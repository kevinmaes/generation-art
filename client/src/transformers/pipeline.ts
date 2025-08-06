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
  TransformerInstance,
} from './types';
import type { VisualParameterValues } from './visual-parameters';
import {
  getTransformer,
  TRANSFORMERS,
  type TransformerId,
  transformerConfigs,
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
  TRANSFORMER_IDS: [TRANSFORMERS.WALKER_TREE.ID],
};

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  // Array of transformer instances to execute in order
  transformers: TransformerInstance[];

  // Randomness control (0.0 = deterministic, 1.0 = fully random)
  temperature?: number;

  // Seed for reproducible randomness
  seed?: string;

  // Canvas dimensions for reference
  canvasWidth?: number;
  canvasHeight?: number;
}

interface PipelineInput {
  fullData: GedcomDataWithMetadata;
  llmData: LLMReadyData;
  config: PipelineConfig;
  onProgress?: (
    current: number,
    total: number,
    transformerName: string,
  ) => void;
}

export type PipelineYield =
  | {
      type: 'progress';
      current: number;
      total: number;
      transformerName: string;
    }
  | {
      type: 'transformer-result';
      transformerId: string;
      visualMetadata: Partial<CompleteVisualMetadata>;
    }
  | { type: 'complete'; result: PipelineResult };

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
 * Generator-based pipeline execution for non-blocking UI
 * Yields control back to the browser between each transformer
 */
export async function* runPipelineGenerator({
  fullData,
  llmData,
  config,
}: PipelineInput): AsyncGenerator<PipelineYield, PipelineResult, unknown> {
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

  // Execute each transformer instance in sequence
  for (let i = 0; i < config.transformers.length; i++) {
    const transformerInstance = config.transformers[i];
    const transformerStartTime = performance.now();

    try {
      // Get transformer configuration from registry
      const transformer = getTransformer(transformerInstance.type);

      console.log(
        `🔄 Executing transformer ${String(i + 1)}/${String(config.transformers.length)}: ${transformer.name} (${transformerInstance.type})`,
      );

      // Yield progress update
      yield {
        type: 'progress',
        current: i + 1,
        total: config.transformers.length,
        transformerName: transformer.name,
      };

      // Create context for this transformer instance
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
            transformerInstance.dimensions.primary ??
            transformer.defaultPrimaryDimension,
          secondary:
            transformerInstance.dimensions.secondary ??
            transformer.defaultSecondaryDimension,
        },
        visual: transformerInstance.visual,
      };

      // Execute transformer using factory function to inject parameters
      const runtimeTransformer = transformer.createTransformerInstance({
        dimensions: {
          primary:
            transformerInstance.dimensions.primary ??
            transformer.defaultPrimaryDimension,
          secondary:
            transformerInstance.dimensions.secondary ??
            transformer.defaultSecondaryDimension,
        },
        visual: transformerInstance.visual,
      });
      const result = await runtimeTransformer(context);

      // Update visual metadata with transformer output using deep merge
      visualMetadata = mergeVisualMetadata(
        visualMetadata,
        result.visualMetadata,
      );

      // Debug what positions this transformer created
      const positionedIndividuals = Object.entries(
        result.visualMetadata.individuals || {},
      )
        .filter(([, meta]) => meta.x !== undefined && meta.y !== undefined)
        .slice(0, 3); // First 3 individuals

      const individualCount =
        positionedIndividuals.length > 0
          ? Object.keys(result.visualMetadata.individuals || {}).length
          : 0;
      console.log(
        `✅ Transformer ${transformer.name} positioned ${String(individualCount)} individuals. Sample:`,
        positionedIndividuals.map(([id, meta]) => ({
          id,
          x: meta.x,
          y: meta.y,
        })),
      );

      // Yield transformer result
      yield {
        type: 'transformer-result',
        transformerId: transformerInstance.type,
        visualMetadata: result.visualMetadata,
      };

      // Yield control back to browser to prevent UI blocking
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Record successful execution
      transformerResults.push({
        transformerId: transformerInstance.type,
        transformerName: transformer.name,
        executionTime: performance.now() - transformerStartTime,
        success: true,
      });
    } catch (error) {
      // Get transformer config for error reporting, handle case where transformer doesn't exist
      let transformerName: string = transformerInstance.type; // fallback name
      try {
        const transformerForError = getTransformer(transformerInstance.type);
        transformerName = transformerForError.name;
      } catch {
        // Transformer doesn't exist, use the type as name
      }

      // Record failed execution
      transformerResults.push({
        transformerId: transformerInstance.type,
        transformerName,
        executionTime: performance.now() - transformerStartTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      // Continue with next transformer (don't fail the entire pipeline)
      console.warn(
        `Transformer ${transformerInstance.type} (${transformerInstance.instanceId}) failed:`,
        error,
      );
    }
  }

  const executionTime = performance.now() - startTime;

  const pipelineResult: PipelineResult = {
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

  // Yield final result
  yield {
    type: 'complete',
    result: pipelineResult,
  };

  return pipelineResult;
}

/**
 * Backward-compatible wrapper for the generator-based pipeline
 * Consumes the generator and returns the final result
 */
export async function runPipeline(
  input: PipelineInput,
): Promise<PipelineResult> {
  const generator = runPipelineGenerator(input);
  let result: PipelineResult | undefined;

  for await (const yielded of generator) {
    if (yielded.type === 'progress' && input.onProgress) {
      input.onProgress(yielded.current, yielded.total, yielded.transformerName);
    } else if (yielded.type === 'complete') {
      result = yielded.result;
    }
  }

  if (!result) {
    throw new Error('Pipeline did not complete successfully');
  }

  return result;
}

/**
 * Validate a pipeline configuration
 */
export function validatePipelineConfig(config: PipelineConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.transformers.length === 0) {
    errors.push('Pipeline must have at least one transformer');
  }

  // Check if all transformers exist and have valid instance IDs
  for (const transformerInstance of config.transformers) {
    if (!(transformerInstance.type in transformerConfigs)) {
      errors.push(`Transformer not found: ${transformerInstance.type}`);
    }

    if (
      !transformerInstance.instanceId ||
      transformerInstance.instanceId.trim() === ''
    ) {
      errors.push(
        `Transformer instance missing instanceId: ${transformerInstance.type}`,
      );
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
 * Converts the old-style API to the new transformer instances array
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
  // Convert transformer IDs to transformer instances
  const transformers: TransformerInstance[] = transformerIds.map(
    (transformerId, index) => {
      const transformer = getTransformer(transformerId);
      const params = options?.transformerParameters?.[transformerId] ?? {
        dimensions: {},
        visual: {},
      };

      return {
        type: transformerId,
        instanceId: `${transformerId}-${String(index)}`, // Generate simple instance ID
        dimensions: {
          primary:
            params.dimensions.primary ?? transformer.defaultPrimaryDimension,
          secondary:
            params.dimensions.secondary ??
            transformer.defaultSecondaryDimension,
        },
        visual: params.visual,
      };
    },
  );

  return {
    transformers,
    temperature: options?.temperature ?? 0.5,
    seed: options?.seed,
    canvasWidth: options?.canvasWidth,
    canvasHeight: options?.canvasHeight,
  };
}
