/**
 * VisualTransformer types and interfaces
 *
 * This module defines the core types for the VisualTransformer pipeline,
 * which converts GEDCOM metadata into visual attributes for generative art.
 */

import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { RoutingOutput } from '../display/types/edge-routing';
import type { LLMReadyData } from '../../../shared/types/llm-data';
import type { DimensionId } from './dimensions';
import type { VisualParameterValues } from './visual-parameters';
import type { TransformerId } from './transformers';
import type { ShapeProfile } from '../../../shared/types';

/**
 * Stroke properties for visual elements
 */
export interface StrokeProperties {
  color?: string;
  weight?: number; // Line thickness
  opacity?: number; // 0-1
  style?: 'solid' | 'dashed' | 'dotted';
  dashArray?: number[]; // For custom dash patterns [dash, gap, dash, gap...]
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
}

/**
 * Fill properties for visual elements
 */
export interface FillProperties {
  color?: string;
  opacity?: number; // 0-1
  // gradient?: GradientDefinition; // Future support
}

/**
 * Shadow properties for visual elements
 */
export interface ShadowProperties {
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Point for coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Base visual metadata that all visual elements share
 */
export interface BaseVisualMetadata {
  opacity?: number;
  hidden?: boolean;
  custom?: Record<string, unknown>;
}

/**
 * Visual layer for nodes - represents a single drawable layer
 */
export interface NodeVisualLayer {
  // Shape definition
  shape?: 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'custom';
  shapeProfile?: ShapeProfile;

  // Position (relative to node center)
  offset?: Point;

  // Size
  size?: Size;
  scale?: number;

  // Fill properties
  fill?: FillProperties;

  // Stroke properties
  stroke?: StrokeProperties;

  // Transform
  rotation?: number;

  // Effects
  blur?: number;
  shadow?: ShadowProperties;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';

  // Metadata
  source?: string; // Which transformer added this layer
  zIndex?: number; // Override natural order if needed
}

/**
 * Node visual metadata - for individuals and families
 */
export interface NodeVisualMetadata extends BaseVisualMetadata {
  // Position (shared by all layers)
  x?: number;
  y?: number;
  z?: number;

  // Node-specific layers
  nodeLayers?: NodeVisualLayer[];

  // Legacy properties for backward compatibility
  color?: string;
  backgroundColor?: string;
  shape?: 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'custom';
  shapeProfile?: ShapeProfile;
  size?: number;
  scale?: number;
  width?: number;
  height?: number;

  // Legacy stroke properties
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';

  // New structured stroke (transformers should migrate to this)
  stroke?: StrokeProperties;

  // Legacy layering parameters
  layerCount?: number;
  layerOffset?: number;
  layerOpacityFalloff?: number;

  // Animation and motion
  velocity?: Point;
  acceleration?: Point;
  rotation?: number;
  rotationSpeed?: number;

  // Layout and grouping
  group?: string;
  layer?: number;
  priority?: number;
  alpha?: number; // Legacy compatibility
}

/**
 * Edge visual metadata
 */
export interface EdgeVisualMetadata extends BaseVisualMetadata {
  // Edge path definition
  curveType?:
    | 'straight'
    | 'bezier-quad'
    | 'bezier-cubic'
    | 'arc'
    | 'catenary'
    | 'step'
    | 's-curve';
  controlPoints?: Point[];
  arcRadius?: number;
  curveIntensity?: number;

  // Edge stroke is primary visual element
  stroke?: StrokeProperties;

  // Legacy stroke properties
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';

  // Optional decorations (future)
  // startMarker?: MarkerDefinition;
  // endMarker?: MarkerDefinition;

  // Layout
  layer?: number; // Legacy compatibility
}

/**
 * Tree/Canvas visual metadata
 */
export interface TreeVisualMetadata extends BaseVisualMetadata {
  backgroundColor?: string;
  backgroundGradient?: unknown; // Future gradient support
  width?: number;
  height?: number;
  padding?:
    | number
    | { top: number; right: number; bottom: number; left: number };
  group?: string; // Legacy compatibility
  layer?: number; // Legacy compatibility
  priority?: number; // Legacy compatibility
}

/**
 * Complete visual metadata structure that mirrors the data structure
 * Contains visual metadata for every entity: individuals, families, edges, and the tree
 */
export interface CompleteVisualMetadata {
  // Visual metadata for each individual (keyed by individual ID)
  individuals: Record<string, NodeVisualMetadata>;

  // Visual metadata for each family (keyed by family ID)
  families: Record<string, NodeVisualMetadata>;

  // Visual metadata for each edge (keyed by edge ID)
  edges: Record<string, EdgeVisualMetadata>;

  // Visual metadata for the overall tree/canvas
  tree: TreeVisualMetadata;

  // Edge routing output for advanced edge rendering (orthogonal, curved, etc.)
  routing?: RoutingOutput;

  // Global visual settings
  global: {
    canvasWidth?: number;
    canvasHeight?: number;
    backgroundColor?: string;
    defaultNodeSize?: number;
    defaultEdgeWeight?: number;
    defaultNodeColor?: string;
    defaultEdgeColor?: string;
    defaultNodeShape?: NodeVisualMetadata['shape'];
    defaultEdgeStyle?: EdgeVisualMetadata['strokeStyle'];
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

  // User-selected dimensions (injected by createTransformerInstance)
  dimensions: {
    primary: string;
    secondary?: string;
  };

  // User-selected visual parameters (injected by createTransformerInstance)
  visual: VisualParameterValues;

  // Optional: Primary individual ID selected by the user for transformers that need a focal point
  primaryIndividualId?: string;

  // Optional: describes which visual metadata properties were modified by the
  // immediately previous transformer in the pipeline
  previousChangeSet?: ChangeSet;
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
 * Visual parameter configuration
 */
export interface VisualParameter {
  name: string;
  type: 'select' | 'range' | 'number' | 'boolean' | 'color';
  defaultValue: string | number | boolean;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  unit?: string; // Unit for display (px, %, deg, etc.)
  formatValue?: (value: number) => string; // Custom formatter for values
  minLabel?: string; // Custom label for minimum value
  maxLabel?: string; // Custom label for maximum value
}

/**
 * Configuration for a VisualTransformer
 */
export interface VisualTransformerConfig {
  // Unique identifier for the transformer
  id: TransformerId;

  // Human-readable name
  name: string;

  // Description of what this transformer does
  description: string;

  // Short one-line description for compact views
  shortDescription?: string;

  // The transformer function
  transform: VisualTransformerFn;

  // Available dimensions for this transformer
  availableDimensions: DimensionId[];

  // Default primary dimension (required)
  defaultPrimaryDimension: DimensionId;

  // Default secondary dimension (optional)
  defaultSecondaryDimension?: DimensionId;

  // Visual parameters configuration for this transformer
  visualParameters: VisualParameter[];

  // Factory function to create transformer instance with parameters
  createTransformerInstance: (params: {
    dimensions: {
      primary?: DimensionId;
      secondary?: DimensionId;
    };
    visual: VisualParameterValues;
  }) => VisualTransformerFn;

  // Helper method to get default values for this transformer
  getDefaults?: () => VisualParameterValues;

  // Categories for organization
  categories?: string[];

  // Whether this transformer requires LLM delegation
  requiresLLM?: boolean;

  // Whether this transformer supports multiple instances (UI hint)
  multiInstance: boolean;

  // Optional factory to create a short, unique instance ID
  createInstanceId?: () => string;
}

/**
 * A transformer instance in a pipeline
 * Combines the transformer type with its specific configuration
 */
export interface TransformerInstance {
  // The type of transformer (matches TransformerId)
  type: TransformerId;

  // Unique instance ID for this specific instance
  instanceId: string;

  // Dimension configuration for this instance
  dimensions: {
    primary?: DimensionId;
    secondary?: DimensionId;
  };

  // Visual parameter values for this instance
  visual: VisualParameterValues;
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
    transformers: TransformerInstance[];
    temperature?: number;
    seed?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  };
  debug: {
    transformerResults: {
      transformerId: TransformerId;
      transformerName: string;
      output: TransformerOutput;
      executionTime: number;
      success: boolean;
      error?: string;
    }[];
    totalExecutionTime: number;
  };
}

// Records which properties were changed by a transformer, scoped by entity
export interface ChangeSet {
  individuals?: Record<string, (keyof NodeVisualMetadata)[]>;
  families?: Record<string, (keyof NodeVisualMetadata)[]>;
  edges?: Record<string, (keyof EdgeVisualMetadata)[]>;
  tree?: (keyof TreeVisualMetadata)[];
}
