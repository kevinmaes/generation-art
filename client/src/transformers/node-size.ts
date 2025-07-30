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
import type { IndividualId } from '../../../shared/types';

/**
 * Calculate node size based on importance score
 */
function calculateSizeByImportance(
  context: TransformerContext,
  individualId: IndividualId,
  baseSize: number,
  sizeMultiplier: number,
): number {
  const { gedcomData } = context;
  // Individual is already retrieved above

  // Calculate importance score based on various factors
  let importanceScore = 0;

  // Factor 1: Number of children
  const individual = gedcomData.individuals.get(individualId);
  if (individual) {
    importanceScore += individual.children.size * 2;
  }

  // Factor 2: Number of marriages
  if (individual) {
    importanceScore += individual.spouses.size;
  }

  // Factor 3: Generation depth (earlier generations are more important)
  if (individual) {
    const generation = individual.metadata.generation ?? 0;
    importanceScore += Math.max(10 - generation, 0);
  }

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

  const individuals = Array.from(gedcomData.individuals.values());
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals = new Map<IndividualId, VisualMetadata>();

  // Apply size calculations to each individual
  individuals.forEach((individual) => {
    const calculatedSize = calculateSizeByImportance(
      context,
      individual.id,
      baseSize,
      sizeMultiplier,
    );

    // Preserve existing visual metadata and update size
    updatedIndividuals.set(individual.id, {
      ...visualMetadata.individuals.get(individual.id),
      size: calculatedSize,
    });
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
