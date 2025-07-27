/**
 * Node Size Transformer
 *
 * This transformer controls the size of nodes based on metadata like
 * number of children, age at death, or importance metrics.
 */

import type { TransformerContext, VisualMetadata } from './types';

/**
 * Calculate node size based on number of children
 */
function calculateSizeByChildren(
  context: TransformerContext,
  individualId: string,
  baseSize: number,
  sizeMultiplier: number,
): number {
  const { gedcomData } = context;

  // Count children for this individual
  const children = Object.values(gedcomData.families)
    .filter(
      (family) =>
        family.husband?.id === individualId || family.wife?.id === individualId,
    )
    .flatMap((family) => family.children ?? []);

  const childCount = children.length;

  // Size increases with number of children
  return baseSize + childCount * sizeMultiplier;
}

/**
 * Calculate node size based on age at death
 */
function calculateSizeByAge(
  context: TransformerContext,
  individualId: string,
  baseSize: number,
  sizeMultiplier: number,
): number {
  const { gedcomData } = context;
  const individual = gedcomData.individuals[individualId];

  // Get birth and death dates
  const birthDate = individual.birth?.date;
  const deathDate = individual.death?.date;

  if (!birthDate || !deathDate) {
    return baseSize; // Default size if dates are missing
  }

  // Calculate age at death
  const birthYear = new Date(birthDate).getFullYear();
  const deathYear = new Date(deathDate).getFullYear();
  const ageAtDeath = deathYear - birthYear;

  // Size increases with age (longer life = larger node)
  return baseSize + ageAtDeath * sizeMultiplier;
}

/**
 * Calculate node size based on generation depth
 */
function calculateSizeByGeneration(
  context: TransformerContext,
  individualId: string,
  baseSize: number,
  sizeMultiplier: number,
): number {
  const { gedcomData } = context;
  const individual = gedcomData.individuals[individualId];

  const generation = individual.metadata.generation ?? 0;

  // Size decreases with generation depth (older generations = smaller nodes)
  return Math.max(baseSize - generation * sizeMultiplier, baseSize * 0.3);
}

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
    .flatMap((family) => family.children ?? []);
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
 */
export async function nodeSizeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<VisualMetadata> }> {
  const { gedcomData } = context;

  // Get parameters from context (these would come from UI configuration)
  const baseSize = 20;
  const sizeMultiplier = 2;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // For now, we'll use the first individual as an example
  // In a real implementation, this would be applied to each individual
  const firstIndividual = individuals[0];

  // Use importance-based sizing for now
  const calculatedSize = calculateSizeByImportance(
    context,
    firstIndividual.id,
    baseSize,
    sizeMultiplier,
  );

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      size: calculatedSize,
      // Keep other properties from previous transformers
      x: context.visualMetadata.x,
      y: context.visualMetadata.y,
      color: context.visualMetadata.color ?? '#4CAF50',
      shape: context.visualMetadata.shape ?? 'circle',
    },
  };
}
