import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
} from './types';

/**
 * Vertical Spread Transformer
 *
 * Adds vertical positioning to individuals within their generation:
 * - Spreads individuals vertically within their generation
 * - Uses birth order, family position, and other factors
 * - Creates visual separation to avoid straight lines
 * - Maintains generation-based horizontal positioning
 */
export function verticalSpreadTransform(
  context: TransformerContext,
): Partial<CompleteVisualMetadata> {
  const { gedcomData, visualMetadata } = context;
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Get canvas dimensions from global settings
  const canvasHeight = visualMetadata.global.canvasHeight ?? 600;
  const verticalPadding = 50; // Padding from top/bottom
  const usableHeight = canvasHeight - verticalPadding * 2;

  // Group individuals by generation
  const generationGroups: Record<number, string[]> = {};

  Object.keys(gedcomData.individuals).forEach((individualId) => {
    const individual = gedcomData.individuals[individualId];
    const generation = individual.metadata.generation ?? 0;

    if (!generationGroups[generation]) {
      generationGroups[generation] = [];
    }
    generationGroups[generation].push(individualId);
  });

  // Process each generation
  Object.keys(generationGroups).forEach((generationStr) => {
    const generation = parseInt(generationStr, 10);
    const individualsInGeneration = generationGroups[generation];

    if (individualsInGeneration.length === 0) return;

    // Sort individuals within generation by various factors
    const sortedIndividuals = individualsInGeneration.sort((a, b) => {
      const individualA = gedcomData.individuals[a];
      const individualB = gedcomData.individuals[b];

      // Primary sort: birth year (earlier = higher position)
      const birthYearA = individualA.birth?.date
        ? (extractYear(individualA.birth.date) ?? 0)
        : 0;
      const birthYearB = individualB.birth?.date
        ? (extractYear(individualB.birth.date) ?? 0)
        : 0;
      if (birthYearA !== birthYearB) return birthYearA - birthYearB;

      // Secondary sort: name (alphabetical)
      return individualA.name.localeCompare(individualB.name);
    });

    // Calculate vertical positions
    const spacing = usableHeight / (sortedIndividuals.length + 1); // +1 for better distribution

    sortedIndividuals.forEach((individualId, index) => {
      const currentMetadata = visualMetadata.individuals[individualId] ?? {};
      const individual = gedcomData.individuals[individualId];

      // Calculate base Y position
      const baseY = verticalPadding + spacing * (index + 1);

      // Add some variation based on individual characteristics
      let yVariation = 0;

      // Factor 1: Number of children (more children = slight upward shift)
      const childCount = individual.children.length;
      yVariation += childCount * -2; // Upward shift for parents

      // Factor 2: Lifespan (longer life = slight downward shift)
      const lifespan = individual.metadata.lifespan ?? 0;
      yVariation += lifespan / 10; // Downward shift for longer lives

      // Factor 3: Generation depth (deeper generations = more variation)
      const generationFactor = generation * 5;
      yVariation += generationFactor * (Math.random() - 0.5) * 0.1; // Small random variation

      // Apply variation with bounds
      const finalY = Math.max(
        verticalPadding,
        Math.min(canvasHeight - verticalPadding, baseY + yVariation),
      );

      updatedIndividuals[individualId] = {
        ...currentMetadata,
        y: finalY,
      };
    });
  });

  return {
    individuals: updatedIndividuals,
  };
}

// Helper function to extract year from date string
function extractYear(dateString: string): number | null {
  const yearMatch = dateString.match(/\b(\d{4})\b/);
  return yearMatch ? parseInt(yearMatch[1], 10) : null;
}
