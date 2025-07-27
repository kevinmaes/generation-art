/**
 * Node Size Transformer
 *
 * This transformer controls the size of nodes based on metadata like
 * number of children, age at death, or importance metrics.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';

/**
 * Calculate node size based on importance score
 */
function calculateSizeByImportance(
  context: TransformerContext,
  individualId: string,
  baseSize: number,
  sizeMultiplier: number,
): number {
  const { gedcomData } = context;
  const individual = gedcomData.individuals[individualId];

  // Calculate importance score based on various factors
  let importanceScore = 0;

  // Factor 1: Number of children
  const children = Object.values(gedcomData.families)
    .filter(
      (family) =>
        family.husband?.id === individualId || family.wife?.id === individualId,
    )
    .flatMap((family) => family.children);
  importanceScore += children.length * 2;

  // Factor 2: Number of marriages
  const marriages = Object.values(gedcomData.families).filter(
    (family) =>
      family.husband?.id === individualId || family.wife?.id === individualId,
  ).length;
  importanceScore += marriages;

  // Factor 3: Generation depth (earlier generations are more important)
  const generation = individual.metadata.generation ?? 0;
  importanceScore += Math.max(10 - generation, 0);

  // Factor 4: Has photos/media (not available in current schema, so skip)
  // if (individual.media?.length > 0) {
  //   importanceScore += 5;
  // }

  return baseSize + importanceScore * sizeMultiplier;
}

/**
 * Node size transform function
 * Applies size calculations to all individuals
 */
export async function nodeSizeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  // Get parameters from context (these would come from UI configuration)
  const baseSize = visualMetadata.global.defaultNodeSize ?? 20;
  const sizeMultiplier = 2;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Apply size calculations to each individual
  individuals.forEach((individual) => {
    const calculatedSize = calculateSizeByImportance(
      context,
      individual.id,
      baseSize,
      sizeMultiplier,
    );

    // Preserve existing visual metadata and update size
    updatedIndividuals[individual.id] = {
      ...visualMetadata.individuals[individual.id],
      size: calculatedSize,
    };
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
