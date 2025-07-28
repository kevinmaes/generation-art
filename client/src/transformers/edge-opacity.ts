import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  TransformerOutput,
} from './types';

/**
 * Edge Opacity Transformer
 *
 * Adjusts the opacity of edges based on various factors:
 * - Relationship type (parent-child vs spouse vs sibling)
 * - Generation distance between connected individuals
 * - Family importance (based on number of children)
 * - Edge length (longer edges more transparent)
 */
export async function edgeOpacityTransform(
  context: TransformerContext,
): Promise<TransformerOutput> {
  const { gedcomData, visualMetadata } = context;
  const updatedEdges: Record<string, VisualMetadata> = {};

  // Get global defaults
  const baseOpacity = 0.7; // Base opacity for all edges
  const minOpacity = 0.2; // Minimum opacity
  const maxOpacity = 1.0; // Maximum opacity

  gedcomData.metadata.edges.forEach((edge) => {
    const currentMetadata = visualMetadata.edges[edge.id] ?? {};
    const sourceIndividual = gedcomData.individuals[edge.sourceId];
    const targetIndividual = gedcomData.individuals[edge.targetId];

    if (!sourceIndividual || !targetIndividual) {
      return;
    }

    // Calculate opacity based on various factors
    let opacity = baseOpacity;

    // Factor 1: Relationship type
    let relationshipFactor = 1.0;
    if (edge.relationshipType === 'parent-child') {
      relationshipFactor = 1.0; // Strongest relationship
    } else if (edge.relationshipType === 'spouse') {
      relationshipFactor = 0.9; // Strong relationship
    } else if (edge.relationshipType === 'sibling') {
      relationshipFactor = 0.7; // Moderate relationship
    }

    // Factor 2: Generation distance (closer generations = more opaque)
    const sourceGen = sourceIndividual.metadata.generation ?? 0;
    const targetGen = targetIndividual.metadata.generation ?? 0;
    const genDistance = Math.abs(sourceGen - targetGen);
    const generationFactor = Math.max(0.6, 1 - genDistance * 0.1); // 10% reduction per generation gap

    // Factor 3: Family importance (more children = more opaque edges)
    const sourceChildren = sourceIndividual.children.length;
    const targetChildren = targetIndividual.children.length;
    const totalChildren = sourceChildren + targetChildren;
    const childrenFactor = Math.min(1.2, 1 + totalChildren * 0.03); // 3% per child, max 20%

    // Factor 4: Edge length (longer edges = more transparent)
    const sourceX = visualMetadata.individuals[edge.sourceId]?.x ?? 0;
    const sourceY = visualMetadata.individuals[edge.sourceId]?.y ?? 0;
    const targetX = visualMetadata.individuals[edge.targetId]?.x ?? 0;
    const targetY = visualMetadata.individuals[edge.targetId]?.y ?? 0;
    const distance = Math.sqrt(
      (targetX - sourceX) ** 2 + (targetY - sourceY) ** 2,
    );
    const maxDistance = Math.sqrt(800 ** 2 + 600 ** 2); // Canvas diagonal
    const distanceFactor = Math.max(0.5, 1 - (distance / maxDistance) * 0.3); // 30% reduction for longest edges

    // Combine all factors
    opacity =
      baseOpacity *
      relationshipFactor *
      generationFactor *
      childrenFactor *
      distanceFactor;

    // Clamp to valid range
    opacity = Math.max(minOpacity, Math.min(maxOpacity, opacity));

    updatedEdges[edge.id] = {
      ...currentMetadata,
      opacity,
    };
  });

  return {
    visualMetadata: {
      edges: updatedEdges,
    },
  };
}
