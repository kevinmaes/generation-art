/**
 * Horizontal Spread by Generation Transformer
 *
 * This transformer positions individuals horizontally based on their generation,
 * creating a traditional family tree layout where each generation is on a row.
 */

import type { TransformerContext, VisualMetadata } from './types';

/**
 * Calculate horizontal position based on generation and relative position within generation
 */
function calculateHorizontalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { metadata, canvasWidth = 1000 } = context;

  // Find the individual
  const individual = metadata.individuals.find(
    (ind) => ind.id === individualId,
  );
  if (!individual) {
    return canvasWidth / 2; // Default to center
  }

  const relativeValue = individual.metadata.relativeGenerationValue ?? 0.5;

  // Calculate base position for this generation
  const generationWidth = canvasWidth * 0.8; // Use 80% of canvas width
  const generationStart = canvasWidth * 0.1; // Start at 10% from left

  // Position within generation based on relative value
  const positionInGeneration =
    generationStart + relativeValue * generationWidth;

  return positionInGeneration;
}

/**
 * Calculate vertical position based on generation
 */
function calculateVerticalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { metadata, canvasHeight = 800 } = context;

  // Find the individual
  const individual = metadata.individuals.find(
    (ind) => ind.id === individualId,
  );
  if (!individual) {
    return canvasHeight / 2; // Default to center
  }

  const generation = individual.metadata.generation ?? 0;

  // Calculate vertical spacing
  const maxGenerations = Math.max(
    ...metadata.individuals.map((ind) => ind.metadata.generation ?? 0),
  );
  const minGenerations = Math.min(
    ...metadata.individuals.map((ind) => ind.metadata.generation ?? 0),
  );
  const generationRange = maxGenerations - minGenerations;

  if (generationRange === 0) {
    return canvasHeight / 2; // All in same generation, center vertically
  }

  // Normalize generation to 0-1 range
  const normalizedGeneration = (generation - minGenerations) / generationRange;

  // Position vertically with some padding
  const verticalPadding = canvasHeight * 0.1;
  const availableHeight = canvasHeight - verticalPadding * 2;
  const y = verticalPadding + normalizedGeneration * availableHeight;

  return y;
}

/**
 * Horizontal spread by generation transform function
 */
export async function horizontalSpreadByGenerationTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<VisualMetadata> }> {
  const { metadata } = context;

  // For now, we'll return a single visual metadata object
  // In a real implementation, this would be applied to each individual
  // For the prototype, we'll use the first individual as an example

  if (metadata.individuals.length === 0) {
    return { visualMetadata: {} };
  }

  const firstIndividual = metadata.individuals[0];
  const x = calculateHorizontalPosition(context, firstIndividual.id);
  const y = calculateVerticalPosition(context, firstIndividual.id);

  // Small delay to simulate async work (will be useful for future LLM calls)
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      x,
      y,
      size: 20, // Default size
      color: '#4CAF50', // Default color
      shape: 'circle',
    },
  };
}
