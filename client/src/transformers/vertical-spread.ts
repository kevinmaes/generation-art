import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  TransformerOutput,
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
export async function verticalSpreadTransform(
  context: TransformerContext,
): Promise<TransformerOutput> {
  const { gedcomData, visualMetadata } = context;
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Debug logging
  console.log(
    'Vertical Spread Transform - Input visualMetadata:',
    visualMetadata,
  );
  console.log(
    'Vertical Spread Transform - Number of individuals:',
    Object.keys(gedcomData.individuals).length,
  );

  // Get canvas dimensions from global settings
  const canvasHeight = visualMetadata.global.canvasHeight ?? 600;
  const verticalPadding = 50; // Padding from top/bottom
  const usableHeight = canvasHeight - verticalPadding * 2;

  // Debug canvas dimensions
  console.log('Vertical Spread Transform - Canvas height:', canvasHeight);
  console.log('Vertical Spread Transform - Usable height:', usableHeight);
  console.log('Vertical Spread Transform - Vertical padding:', verticalPadding);

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

    // Calculate vertical positions with better spacing
    const spacing = usableHeight / Math.max(sortedIndividuals.length, 1);

    sortedIndividuals.forEach((individualId, index) => {
      const currentMetadata = visualMetadata.individuals[individualId] ?? {};
      const individual = gedcomData.individuals[individualId];

      // Calculate base Y position with better distribution
      const baseY = verticalPadding + spacing * index + spacing / 2;

      // Add some variation based on individual characteristics
      let yVariation = 0;

      // Factor 1: Number of children (more children = slight upward shift)
      const childCount = individual.children.length;
      yVariation += childCount * -5; // Increased upward shift for parents

      // Factor 2: Lifespan (longer life = slight downward shift)
      const lifespan = individual.metadata.lifespan ?? 0;
      yVariation += lifespan / 5; // Increased downward shift for longer lives

      // Factor 3: Generation depth (deeper generations = more variation)
      const generationFactor = generation * 10;
      yVariation += generationFactor * (Math.random() - 0.5) * 0.2; // Increased random variation

      // Factor 4: Birth year variation within generation
      const birthYear = individual.birth?.date
        ? (extractYear(individual.birth.date) ?? 0)
        : 0;
      const birthYearVariation = (birthYear % 100) * 0.3; // Use birth year for additional variation
      yVariation += birthYearVariation;

      // Apply variation with bounds
      const finalY = Math.max(
        verticalPadding,
        Math.min(canvasHeight - verticalPadding, baseY + yVariation),
      );

      // Debug bounds checking for first few individuals
      if (index < 3) {
        console.log(
          `Individual ${individualId}: baseY=${String(baseY)}, yVariation=${String(yVariation)}, finalY=${String(finalY)}`,
        );
      }

      updatedIndividuals[individualId] = {
        ...currentMetadata,
        y: finalY,
      };
    });
  });

  // Debug logging
  console.log(
    'Vertical Spread Transform - Updated individuals:',
    updatedIndividuals,
  );
  console.log(
    'Vertical Spread Transform - Number of updated individuals:',
    Object.keys(updatedIndividuals).length,
  );

  // Simple test: Check if we have any Y values
  const yValues = Object.values(updatedIndividuals)
    .map((meta) => meta.y)
    .filter((y) => y !== undefined);
  console.log('Vertical Spread Transform - Y values found:', yValues.length);
  console.log(
    'Vertical Spread Transform - Sample Y values:',
    yValues.slice(0, 5),
  );

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}

// Helper function to extract year from date string
function extractYear(dateString: string): number | null {
  const yearMatch = dateString.match(/\b(\d{4})\b/);
  return yearMatch ? parseInt(yearMatch[1], 10) : null;
}
