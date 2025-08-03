/**
 * VisualTransformer factory utilities
 *
 * This module provides utilities for creating and configuring VisualTransformers
 */

import type {
  VisualTransformerConfig,
  VisualTransformerFn,
  CompleteVisualMetadata,
  TransformerContext,
  TransformerOutput,
} from './types';
import type { TransformerId } from './transformers';
import type { DimensionId } from './dimensions';
import type { VisualParameterId } from './visual-parameters';
import { VISUAL_PARAMETERS } from './visual-parameters';

/**
 * Create a VisualTransformer configuration
 */
export function createTransformer(
  id: TransformerId,
  name: string,
  description: string,
  transform: VisualTransformerFn,
  availableDimensions: DimensionId[],
  defaultPrimaryDimension: DimensionId,
  visualParameters: VisualParameterId[],
  createTransformerInstance: VisualTransformerConfig['createTransformerInstance'],
  options?: {
    defaultSecondaryDimension?: DimensionId;
    categories?: string[];
    requiresLLM?: boolean;
  },
): VisualTransformerConfig {
  return {
    id,
    name,
    description,
    transform,
    availableDimensions,
    defaultPrimaryDimension,
    defaultSecondaryDimension: options?.defaultSecondaryDimension,
    visualParameters: visualParameters.map((paramId) => {
      const param = VISUAL_PARAMETERS[paramId];
      return {
        name: param.id,
        type: param.type,
        defaultValue: param.defaultValue,
        label: param.label,
        description: param.description,
        min: param.min,
        max: param.max,
        step: param.step,
        options: param.options,
      };
    }),
    createTransformerInstance,
    categories: options?.categories,
    requiresLLM: options?.requiresLLM ?? false,
  };
}

/**
 * Create a simple transformer that only modifies specific visual properties
 */
export function createSimpleTransformer(
  id: TransformerId,
  name: string,
  description: string,
  transformFn: (
    context: TransformerContext,
  ) => Promise<Partial<CompleteVisualMetadata>>,
  availableDimensions: DimensionId[],
  defaultPrimaryDimension: DimensionId,
  visualParameters: VisualParameterId[],
  createTransformerInstance: VisualTransformerConfig['createTransformerInstance'],
  options?: {
    defaultSecondaryDimension?: DimensionId;
    categories?: string[];
    requiresLLM?: boolean;
  },
): VisualTransformerConfig {
  const transform: VisualTransformerFn = async (context) => {
    const partialUpdate = await transformFn(context);

    return {
      visualMetadata: {
        ...context.visualMetadata,
        ...partialUpdate,
      },
    } as TransformerOutput;
  };

  return createTransformer(
    id,
    name,
    description,
    transform,
    availableDimensions,
    defaultPrimaryDimension,
    visualParameters,
    createTransformerInstance,
    options,
  );
}

/**
 * Create a transformer that merges visual metadata
 */
export function createMergingTransformer(
  id: TransformerId,
  name: string,
  description: string,
  transformFn: (context: TransformerContext) => Promise<CompleteVisualMetadata>,
  availableDimensions: DimensionId[],
  defaultPrimaryDimension: DimensionId,
  visualParameters: VisualParameterId[],
  createTransformerInstance: VisualTransformerConfig['createTransformerInstance'],
  options?: {
    defaultSecondaryDimension?: DimensionId;
    categories?: string[];
    requiresLLM?: boolean;
  },
): VisualTransformerConfig {
  const transform: VisualTransformerFn = async (context) => {
    const newVisualMetadata = await transformFn(context);

    return {
      visualMetadata: {
        ...context.visualMetadata,
        ...newVisualMetadata,
      },
    } as TransformerOutput;
  };

  return createTransformer(
    id,
    name,
    description,
    transform,
    availableDimensions,
    defaultPrimaryDimension,
    visualParameters,
    createTransformerInstance,
    options,
  );
}

/**
 * Create a transformer that completely replaces visual metadata
 */
export function createReplacingTransformer(
  id: TransformerId,
  name: string,
  description: string,
  transformFn: (context: TransformerContext) => Promise<CompleteVisualMetadata>,
  availableDimensions: DimensionId[],
  defaultPrimaryDimension: DimensionId,
  visualParameters: VisualParameterId[],
  createTransformerInstance: VisualTransformerConfig['createTransformerInstance'],
  options?: {
    defaultSecondaryDimension?: DimensionId;
    categories?: string[];
    requiresLLM?: boolean;
  },
): VisualTransformerConfig {
  const transform: VisualTransformerFn = async (context) => {
    const newVisualMetadata = await transformFn(context);

    return {
      visualMetadata: newVisualMetadata,
    } as TransformerOutput;
  };

  return createTransformer(
    id,
    name,
    description,
    transform,
    availableDimensions,
    defaultPrimaryDimension,
    visualParameters,
    createTransformerInstance,
    options,
  );
}

/**
 * Validate a transformer configuration
 */
export function validateTransformer(transformer: VisualTransformerConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!transformer.id.trim()) {
    errors.push('Transformer must have a non-empty id');
  }

  if (!transformer.name.trim()) {
    errors.push('Transformer must have a non-empty name');
  }

  if (!transformer.description.trim()) {
    errors.push('Transformer must have a non-empty description');
  }

  if (typeof transformer.transform !== 'function') {
    errors.push('Transformer must have a valid transform function');
  }

  if (transformer.availableDimensions.length === 0) {
    errors.push('Transformer must have at least one available dimension');
  }

  if (!transformer.defaultPrimaryDimension) {
    errors.push('Transformer must have a default primary dimension');
  }

  if (transformer.visualParameters.length === 0) {
    errors.push('Transformer must have at least one visual parameter');
  }

  if (typeof transformer.createTransformerInstance !== 'function') {
    errors.push(
      'Transformer must have a valid createTransformerInstance',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
