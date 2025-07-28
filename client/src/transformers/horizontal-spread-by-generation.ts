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
 * Calculate horizontal position based on selected dimension and parameters
 */
function calculateHorizontalPosition(
  context: TransformerContext,
  individualId: string,
): number {
  const { gedcomData, visualMetadata, dimensions, visual, temperature } =
    context;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;

  // Find the individual
  const individual = gedcomData.individuals[individualId];

  // Get the primary dimension value
  const primaryDimension = dimensions.primary;
  let dimensionValue = 0.5; // Default fallback

  switch (primaryDimension) {
    case 'generation':
      dimensionValue = individual.metadata.relativeGenerationValue ?? 0.5;
      break;
    case 'birthYear': {
      // Normalize birth year to 0-1 range
      const allBirthYears = Object.values(gedcomData.individuals)
        .map((ind) => ind.metadata.birthYear)
        .filter((year): year is number => year !== undefined);
      if (allBirthYears.length > 0) {
        const minYear = Math.min(...allBirthYears);
        const maxYear = Math.max(...allBirthYears);
        const year = individual.metadata.birthYear ?? minYear;
        dimensionValue = (year - minYear) / (maxYear - minYear);
      }
      break;
    }
    case 'childrenCount': {
      // Count children by looking at parent relationships
      const allIndividuals = Object.values(gedcomData.individuals);
      const childrenCounts = allIndividuals.map((ind) => {
        const children = allIndividuals.filter((child) =>
          child.parents.includes(ind.id),
        );
        return children.length;
      });
      const maxChildren = Math.max(...childrenCounts);
      const individualChildren = allIndividuals.filter((child) =>
        child.parents.includes(individual.id),
      ).length;
      dimensionValue = maxChildren > 0 ? individualChildren / maxChildren : 0.5;
      break;
    }
    case 'lifespan': {
      const allLifespans = Object.values(gedcomData.individuals)
        .map((ind) => ind.metadata.lifespan)
        .filter((span): span is number => span !== undefined);
      if (allLifespans.length > 0) {
        const maxLifespan = Math.max(...allLifespans);
        dimensionValue =
          maxLifespan > 0
            ? (individual.metadata.lifespan ?? 0) / maxLifespan
            : 0.5;
      }
      break;
    }
    case 'nameLength': {
      const allNameLengths = Object.values(gedcomData.individuals).map(
        (ind) => ind.name.length,
      );
      const maxNameLength = Math.max(...allNameLengths);
      dimensionValue =
        maxNameLength > 0 ? individual.name.length / maxNameLength : 0.5;
      break;
    }
  }

  // Get visual parameters directly from context
  const { horizontalPadding, spacing } = visual;
  const temp = temperature ?? 0.5;

  // Calculate spacing multiplier based on spacing setting
  const spacingMultipliers = {
    tight: 0.6,
    compact: 0.8,
    normal: 1.0,
    loose: 1.2,
    sparse: 1.5,
  };
  const spacingMultiplier =
    spacingMultipliers[spacing as keyof typeof spacingMultipliers] || 1.0;

  // Calculate available width
  const availableWidth = canvasWidth - (horizontalPadding as number) * 2;
  const generationStart = horizontalPadding as number;

  // Add temperature-based randomness
  const randomFactor = (Math.random() - 0.5) * temp * 0.2; // ±10% max variation
  const adjustedDimensionValue = Math.max(
    0,
    Math.min(1, dimensionValue + randomFactor),
  );

  // Position within generation based on dimension value
  const positionInGeneration =
    generationStart +
    adjustedDimensionValue * availableWidth * spacingMultiplier;

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
    const currentMetadata = visualMetadata.individuals[individual.id] ?? {};
    const x = calculateHorizontalPosition(context, individual.id);
    const y = calculateVerticalPosition(context, individual.id);

    // Get visual parameters directly from context
    const { nodeSize, primaryColor } = context.visual;

    // Convert node size string to actual size
    const sizeMap = {
      small: 15,
      medium: 20,
      large: 30,
      'extra-large': 40,
    };
    const size = sizeMap[nodeSize as keyof typeof sizeMap] || 20;

    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      x,
      y,
      size,
      color: String(primaryColor),
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
