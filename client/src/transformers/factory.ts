/**
 * VisualTransformer factory utilities
 *
 * This module provides utilities for creating and configuring VisualTransformers
 */

import type {
  VisualTransformerConfig,
  VisualTransformerFn,
  VisualMetadata,
  TransformerContext,
} from './types';
import type { TransformerId } from './transformers';

/**
 * Create a VisualTransformer configuration
 */
export function createTransformer(
  id: string,
  name: string,
  description: string,
  transform: VisualTransformerFn,
  options?: {
    categories?: string[];
    requiresLLM?: boolean;
  },
): Partial<VisualTransformerConfig> {
  return {
    id: id as TransformerId, // TODO: Fix transformer factory to be complete
    name,
    description,
    transform,
    categories: options?.categories,
    requiresLLM: options?.requiresLLM ?? false,
  };
}

/**
 * Create a simple transformer that only modifies specific visual properties
 */
export function createSimpleTransformer(
  id: string,
  name: string,
  description: string,
  transformFn: (
    context: TransformerContext,
  ) => Promise<Partial<VisualMetadata>>,
  options?: {
    categories?: string[];
    requiresLLM?: boolean;
  },
): Partial<VisualTransformerConfig> {
  const transform: VisualTransformerFn = async (context) => {
    const partialUpdate = await transformFn(context);

    return {
      visualMetadata: {
        ...context.visualMetadata,
        ...partialUpdate,
      },
    };
  };

  return createTransformer(id, name, description, transform, options);
}

/**
 * Create a transformer that merges visual metadata
 */
export function createMergingTransformer(
  id: string,
  name: string,
  description: string,
  transformFn: (context: TransformerContext) => Promise<VisualMetadata>,
  options?: {
    categories?: string[];
    requiresLLM?: boolean;
  },
): Partial<VisualTransformerConfig> {
  const transform: VisualTransformerFn = async (context) => {
    const newVisualMetadata = await transformFn(context);

    return {
      visualMetadata: {
        ...context.visualMetadata,
        ...newVisualMetadata,
      },
    };
  };

  return createTransformer(id, name, description, transform, options);
}

/**
 * Create a transformer that completely replaces visual metadata
 */
export function createReplacingTransformer(
  id: string,
  name: string,
  description: string,
  transformFn: (context: TransformerContext) => Promise<VisualMetadata>,
  options?: {
    categories?: string[];
    requiresLLM?: boolean;
  },
): Partial<VisualTransformerConfig> {
  const transform: VisualTransformerFn = async (context) => {
    const newVisualMetadata = await transformFn(context);

    return {
      visualMetadata: newVisualMetadata,
    };
  };

  return createTransformer(id, name, description, transform, options);
}

/**
 * Validate a transformer configuration
 */
export function validateTransformer(
  transformer: Partial<VisualTransformerConfig>,
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!transformer.id || transformer.id.trim() === '') {
    errors.push('Transformer must have a non-empty id');
  }

  if (!transformer.name || transformer.name.trim() === '') {
    errors.push('Transformer must have a non-empty name');
  }

  if (!transformer.description || transformer.description.trim() === '') {
    errors.push('Transformer must have a non-empty description');
  }

  if (typeof transformer.transform !== 'function') {
    errors.push('Transformer must have a valid transform function');
  }

  // TODO: Add validation for visual parameters, dimensions, etc.

  return {
    isValid: errors.length === 0,
    errors,
  };
}
