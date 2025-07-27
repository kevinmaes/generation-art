/**
 * Horizontal Spread by Generation Transformer
 *
 * This transformer positions individuals horizontally based on their generation,
 * creating a traditional family tree layout where each generation is on a row.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';

/**
 * Calculate horizontal position based on relative generation value
 */
function calculateHorizontalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, visualMetadata } = context;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;

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
  const { gedcomData, visualMetadata } = context;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

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
 * Positions all individuals based on their generation
 */
export async function horizontalSpreadByGenerationTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Position each individual based on their generation
  individuals.forEach((individual) => {
    const x = calculateHorizontalPosition(context, individual.id);
    const y = calculateVerticalPosition(context, individual.id);

    updatedIndividuals[individual.id] = {
      x,
      y,
      size: visualMetadata.global.defaultNodeSize ?? 20,
      color: visualMetadata.global.defaultNodeColor ?? '#4CAF50',
      shape: visualMetadata.global.defaultNodeShape ?? 'circle',
    };
  });

  // Small delay to simulate async work (will be useful for future LLM calls)
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
