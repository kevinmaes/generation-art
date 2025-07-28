/**
 * Transformer utilities
 */

import type {
  TransformerContext,
  TransformerOutput,
  VisualTransformerFn,
} from './types';

/**
 * Convert a transformer name to a slugified ID
 * e.g., "Horizontal Spread by Generation" -> "horizontal-spread-by-generation"
 */
export function slugifyTransformerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate that a transformer ID is valid
 */
export function isValidTransformerId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id) && id.length > 0;
}

/**
 * Generate a unique transformer ID from a name
 */
export function generateTransformerId(name: string): string {
  const slug = slugifyTransformerName(name);

  if (!isValidTransformerId(slug)) {
    throw new Error(
      `Invalid transformer name: "${name}" - cannot generate valid ID`,
    );
  }

  return slug;
}

/**
 * Creates a runtime transformer function that injects parameters into the context
 * @param params - User-selected dimensions and visual parameters
 * @param transformFn - The actual transformer function to execute
 * @returns A runtime transformer function with enhanced context
 */
export function createRuntimeTransformerFunction(
  params: {
    dimensions: { primary?: string; secondary?: string[] };
    visual: Record<string, unknown>;
  },
  transformFn: VisualTransformerFn,
): VisualTransformerFn {
  return async (context: TransformerContext): Promise<TransformerOutput> => {
    // Merge parameters into the context
    const enhancedContext = {
      ...context,
      dimensions: params.dimensions,
      visual: params.visual,
      temperature:
        (params.visual.temperature as number | undefined) ??
        context.temperature,
    };

    // Call the transformer function with enhanced context
    return await transformFn(enhancedContext);
  };
}
