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

/**
 * Create a VisualTransformer configuration
 */
export function createTransformer(
  id: string,
  name: string,
  description: string,
  transform: VisualTransformerFn,
  options?: {
    parameters?: VisualTransformerConfig['parameters'];
    categories?: string[];
    requiresLLM?: boolean;
  },
): VisualTransformerConfig {
  return {
    id,
    name,
    description,
    transform,
    parameters: options?.parameters,
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
    parameters?: VisualTransformerConfig['parameters'];
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
    parameters?: VisualTransformerConfig['parameters'];
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
    parameters?: VisualTransformerConfig['parameters'];
    categories?: string[];
    requiresLLM?: boolean;
  },
): VisualTransformerConfig {
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
export function validateTransformer(transformer: VisualTransformerConfig): {
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

  // Validate parameter configurations
  if (transformer.parameters) {
    for (const [, paramConfig] of Object.entries(transformer.parameters)) {
      if (!paramConfig.description || paramConfig.description.trim() === '') {
        errors.push(`Parameter must have a description`);
      }

      if (paramConfig.type === 'number') {
        if (typeof paramConfig.defaultValue !== 'number') {
          errors.push(`Parameter default value must be a number`);
        }
      } else if (paramConfig.type === 'string') {
        if (typeof paramConfig.defaultValue !== 'string') {
          errors.push(`Parameter default value must be a string`);
        }
      } else if (paramConfig.type === 'boolean') {
        if (typeof paramConfig.defaultValue !== 'boolean') {
          errors.push(`Parameter default value must be a boolean`);
        }
      } else if (typeof paramConfig.defaultValue !== 'string') {
        errors.push('Parameter default value must be a string (color)');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
