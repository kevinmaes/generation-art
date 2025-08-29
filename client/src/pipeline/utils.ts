/**
 * Transformer utilities
 */

import type {
  TransformerContext,
  TransformerOutput,
  VisualTransformerFn,
} from './types';
import type { VisualParameterValues } from './visual-parameters';

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
 * Creates a transformer instance that injects parameters into the context
 * @param params - User-selected dimensions and visual parameters
 * @param transformFn - The actual transformer function to execute
 * @param transformerConfig - The transformer configuration with parameter defaults
 * @returns A transformer instance with enhanced context
 */
export function createTransformerInstance(
  params: {
    dimensions: { primary?: string; secondary?: string };
    visual: VisualParameterValues;
  },
  transformFn: VisualTransformerFn,
  visualParameters?: {
    name: string;
    defaultValue: string | number | boolean;
  }[],
): VisualTransformerFn {
  return async (context: TransformerContext): Promise<TransformerOutput> => {
    // Get transformer-specific defaults
    const transformerDefaults: VisualParameterValues =
      {} as VisualParameterValues;
    if (visualParameters) {
      for (const param of visualParameters) {
        transformerDefaults[param.name] = param.defaultValue;
      }
    }

    console.log(
      '[DEBUG] createTransformerInstance - creating enhanced context',
      '| params.visual:',
      params.visual,
      '| params.visual keys:',
      Object.keys(params.visual || {}),
      '| transformerDefaults:',
      transformerDefaults,
      '| merged visual:',
      { ...transformerDefaults, ...params.visual },
    );

    // Merge parameters into the context with transformer defaults
    const enhancedContext = {
      ...context,
      dimensions: {
        primary: params.dimensions.primary ?? 'generation',
        secondary: params.dimensions.secondary,
      },
      visual: {
        ...transformerDefaults,
        ...params.visual,
      },
      temperature:
        (Number(params.visual.temperature) || context.temperature) ?? 0.5,
    };

    // Call the transformer function with enhanced context
    return await transformFn(enhancedContext);
  };
}
