import type {
  TransformerContext,
  VisualMetadata,
  TransformerOutput,
} from './types';
import type { EdgeId, Edge } from '../../../shared/types';
import type { AppAugmentedIndividual } from '../types/app-data';

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
  const updatedEdges = new Map<EdgeId, VisualMetadata>();

  // Get global defaults
  const baseOpacity = 0.7; // Base opacity for all edges
  const minOpacity = 0.2; // Minimum opacity
  const maxOpacity = 1.0; // Maximum opacity

  // Add a small delay to satisfy async requirement
  await new Promise((resolve) => setTimeout(resolve, 0));

  gedcomData.edges.forEach((edge: Edge, edgeId: EdgeId) => {
    const currentMetadata = visualMetadata.edges.get(edgeId) ?? {};
    const sourceIndividual: AppAugmentedIndividual | undefined = gedcomData.individuals.get(edge.sourceId);
    const targetIndividual: AppAugmentedIndividual | undefined = gedcomData.individuals.get(edge.targetId);

    if (!sourceIndividual || !targetIndividual) {
      return; // Skip if either individual is missing
    }

    // Calculate opacity based on various factors
    let opacity = baseOpacity;

    // Factor 1: Relationship type
    let relationshipFactor = 1.0;
    if (edge.relationshipType === 'parent-child') {
      relationshipFactor = 1.0; // Strongest relationship
    } else if (edge.relationshipType === 'spouse') {
      relationshipFactor = 0.9; // Strong relationship
    } else {
      relationshipFactor = 0.7; // Moderate relationship (sibling or other)
    }

    // Factor 2: Generation distance (closer generations = more opaque)
    const sourceGen = sourceIndividual.metadata.generation ?? 0;
    const targetGen = targetIndividual.metadata.generation ?? 0;
    const genDistance = Math.abs(sourceGen - targetGen);
    const generationFactor = Math.max(0.6, 1 - genDistance * 0.1); // 10% reduction per generation gap

    // Factor 3: Family importance (more children = more opaque edges)
    const sourceChildren = sourceIndividual.children.size;
    const targetChildren = targetIndividual.children.size;
    const totalChildren = sourceChildren + targetChildren;
    const childrenFactor = Math.min(1.2, 1 + totalChildren * 0.03); // 3% per child, max 20%

    // Factor 4: Edge length (longer edges = more transparent)
    const sourceX = visualMetadata.individuals.get(edge.sourceId)?.x ?? 0;
    const sourceY = visualMetadata.individuals.get(edge.sourceId)?.y ?? 0;
    const targetX = visualMetadata.individuals.get(edge.targetId)?.x ?? 0;
    const targetY = visualMetadata.individuals.get(edge.targetId)?.y ?? 0;
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

    updatedEdges.set(edgeId, {
      ...currentMetadata,
      opacity,
    });
  });

  return {
    visualMetadata: {
      edges: updatedEdges,
    },
  };
}
