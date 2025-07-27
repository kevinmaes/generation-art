/**
 * Horizontal Spread by Generation Transformer
 *
 * This transformer positions individuals horizontally based on their generation,
 * creating a traditional family tree layout where each generation is on a row.
 */

import type { TransformerContext, VisualMetadata } from './types';

/**
 * Calculate horizontal position based on relative generation value
 */
function calculateHorizontalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, canvasWidth = 1000 } = context;
  console.log('transformer gedcomData', gedcomData);

  // Find the individual
  const individual = gedcomData.individuals[individualId];
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
  const { gedcomData, canvasHeight = 800 } = context;

  // Find the individual
  const individual = gedcomData.individuals[individualId];
  const generation = individual.metadata.generation ?? 0;

  // Calculate vertical spacing
  const individuals = Object.values(gedcomData.individuals);
  const maxGenerations = Math.max(
    ...individuals.map((ind) => ind.metadata.generation ?? 0),
  );
  const minGenerations = Math.min(
    ...individuals.map((ind) => ind.metadata.generation ?? 0),
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
  const { gedcomData } = context;

  // For now, we'll return a single visual metadata object
  // In a real implementation, this would be applied to each individual
  // For the prototype, we'll use the first individual as an example

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  const firstIndividual = individuals[0];
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
