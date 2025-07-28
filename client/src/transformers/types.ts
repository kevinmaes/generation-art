/**
 * VisualTransformer types and interfaces
 *
 * This module defines the core types for the VisualTransformer pipeline,
 * which converts GEDCOM metadata into visual attributes for generative art.
 */

import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { LLMReadyData } from '../../../shared/types/llm-data';
import type { DimensionId } from './dimensions';
import type { VisualParameterId } from './visual-parameters';

/**
 * Visual metadata represents the visual attributes of elements in the art
 * These are the properties that get transformed by the pipeline
 */
export interface VisualMetadata {
  // Position attributes
  x?: number;
  y?: number;
  z?: number;

  // Size and scale attributes
  size?: number;
  scale?: number;
  width?: number;
  height?: number;

  // Color attributes
  color?: string;
  backgroundColor?: string;
  strokeColor?: string;
  opacity?: number;
  alpha?: number;

  // Shape and style attributes
  shape?: 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'custom';
  strokeWeight?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';

  // Animation and motion attributes
  velocity?: { x: number; y: number };
  acceleration?: { x: number; y: number };
  rotation?: number;
  rotationSpeed?: number;

  // Layout and grouping attributes
  group?: string;
  layer?: number;
  priority?: number;

  // Custom attributes (for extensibility)
  custom?: Record<string, unknown>;
}

/**
 * Complete visual metadata structure that mirrors the data structure
 * Contains visual metadata for every entity: individuals, families, edges, and the tree
 */
export interface CompleteVisualMetadata {
  // Visual metadata for each individual (keyed by individual ID)
  individuals: Record<string, VisualMetadata>;

  // Visual metadata for each family (keyed by family ID)
  families: Record<string, VisualMetadata>;

  // Visual metadata for each edge (keyed by edge ID)
  edges: Record<string, VisualMetadata>;

  // Visual metadata for the overall tree/canvas
  tree: VisualMetadata;

  // Global visual settings
  global: {
    canvasWidth?: number;
    canvasHeight?: number;
    backgroundColor?: string;
    defaultNodeSize?: number;
    defaultEdgeWeight?: number;
    defaultNodeColor?: string;
    defaultEdgeColor?: string;
    defaultNodeShape?: VisualMetadata['shape'];
    defaultEdgeStyle?: VisualMetadata['strokeStyle'];
  };
}

/**
 * Input context for a VisualTransformer
 * Contains the complete data suite: raw data, LLM data, and visual metadata
 */
export interface TransformerContext {
  // The complete GEDCOM data with metadata (for local operations)
  gedcomData: GedcomDataWithMetadata;

  // Pre-formatted LLM-ready data (PII stripped, for LLM calls)
  llmData: LLMReadyData;

  // Current visual metadata state (complete structure for all entities)
  visualMetadata: CompleteVisualMetadata;

  // Randomness control (0.0 = deterministic, 1.0 = fully random)
  temperature?: number;

  // Seed for reproducible randomness
  seed?: string;

  // Canvas dimensions for reference
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Output from a VisualTransformer
 * Returns the full data suite with modified visual metadata
 */
export interface TransformerOutput {
  // The transformed visual metadata (can be partial - only modified parts)
  visualMetadata: Partial<CompleteVisualMetadata>;

  // Optional debug information
  debug?: {
    message?: string;
    data?: Record<string, unknown>;
  };
}

/**
 * A VisualTransformer function
 * Takes a context and returns transformed visual metadata
 * Can modify visual metadata through coded logic, LLM calls, or both
 */
export type VisualTransformerFn = (
  context: TransformerContext,
) => Promise<TransformerOutput>;

/**
 * Configuration for a VisualTransformer
 */
export interface VisualTransformerConfig {
  // Unique identifier for the transformer
  id: string;

  // Human-readable name
  name: string;

  // Description of what this transformer does
  description: string;

  // The transformer function
  transform: VisualTransformerFn;

  // Available dimensions for this transformer
  availableDimensions: DimensionId[];

  // Default primary dimension (required)
  defaultPrimaryDimension: DimensionId;

  // Default secondary dimension (optional)
  defaultSecondaryDimension?: DimensionId;

  // Available visual parameters for this transformer
  visualParameters: VisualParameterId[];

  // Factory function to create runtime transformer with parameters
  createRuntimeTransformerFunction: (params: {
    dimensions: {
      primary?: DimensionId;
      secondary?: DimensionId;
    };
    visual: Record<string, unknown>;
  }) => VisualTransformerFn;

  // Categories for organization
  categories?: string[];

  // Whether this transformer requires LLM delegation
  requiresLLM?: boolean;
}

/**
 * A pipeline is an ordered sequence of transformers
 */
export interface VisualTransformerPipeline {
  id: string;
  name: string;
  description?: string;
  transformers: VisualTransformerConfig[];
  parameters?: {
    temperature?: number;
    seed?: string;
  };
}

/**
 * Result of running a pipeline
 * Contains the complete visual metadata after all transformers
 */
export interface PipelineResult {
  visualMetadata: CompleteVisualMetadata;
  config: {
    transformerIds: string[];
    temperature?: number;
    seed?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  };
  debug: {
    transformerResults: {
      transformerId: string;
      transformerName: string;
      output: TransformerOutput;
      executionTime: number;
      success: boolean;
      error?: string;
    }[];
    totalExecutionTime: number;
  };
}
