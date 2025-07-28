import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  TransformerOutput,
} from './types';

/**
 * Node Opacity Transformer
 *
 * Adjusts the opacity of individual nodes based on various factors:
 * - Generation depth (deeper generations more transparent)
 * - Number of children (more children = more opaque)
 * - Age/lifespan (longer life = more opaque)
 * - Family importance (based on family size)
 */
export async function nodeOpacityTransform(
  context: TransformerContext,
): Promise<TransformerOutput> {
  const { gedcomData, visualMetadata } = context;
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Get global defaults
  const baseOpacity = 0.8; // Base opacity for all nodes
  const minOpacity = 0.3; // Minimum opacity
  const maxOpacity = 1.0; // Maximum opacity

  Object.keys(gedcomData.individuals).forEach((individualId) => {
    const individual = gedcomData.individuals[individualId];
    const currentMetadata = visualMetadata.individuals[individualId] ?? {};

    // Calculate opacity based on various factors
    let opacity = baseOpacity;

    // Factor 1: Generation depth (deeper = more transparent)
    const generation = individual.metadata.generation ?? 0;
    const generationFactor = Math.max(0.5, 1 - generation * 0.1); // 10% reduction per generation

    // Factor 2: Number of children (more children = more opaque)
    const childCount = individual.children.length;
    const childFactor = Math.min(1.2, 1 + childCount * 0.05); // 5% increase per child, max 20%

    // Factor 3: Lifespan (longer life = more opaque)
    const lifespan = individual.metadata.lifespan ?? 0;
    const lifespanFactor = lifespan > 0 ? Math.min(1.1, 1 + lifespan / 100) : 1;

    // Combine all factors
    opacity = baseOpacity * generationFactor * childFactor * lifespanFactor;

    // Clamp to valid range
    opacity = Math.max(minOpacity, Math.min(maxOpacity, opacity));

    updatedIndividuals[individualId] = {
      ...currentMetadata,
      opacity,
    };
  });

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
