/**
 * VisualTransformer types and interfaces
 *
 * This module defines the core types for the VisualTransformer pipeline,
 * which converts GEDCOM metadata into visual attributes for generative art.
 */

import type { GedcomDataWithMetadata } from '../../../shared/types';

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
 * Input context for a VisualTransformer
 */
export interface TransformerContext {
  // The complete GEDCOM data with metadata
  metadata: GedcomDataWithMetadata;

  // Current visual metadata state (may be partial)
  visualMetadata: VisualMetadata;

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
 */
export interface TransformerOutput {
  // The transformed visual metadata
  visualMetadata: VisualMetadata;

  // Optional debug information
  debug?: {
    message?: string;
    data?: Record<string, unknown>;
  };
}

/**
 * A VisualTransformer function
 * Takes a context and returns transformed visual metadata
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

  // Optional parameters that can be configured
  parameters?: Record<
    string,
    {
      type: 'number' | 'string' | 'boolean' | 'color';
      defaultValue: unknown;
      min?: number;
      max?: number;
      step?: number;
      description: string;
    }
  >;

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
 */
export interface PipelineResult {
  visualMetadata: VisualMetadata;
  debug: {
    transformerResults: {
      transformerId: string;
      transformerName: string;
      output: TransformerOutput;
      executionTime: number;
    }[];
    totalExecutionTime: number;
  };
}
