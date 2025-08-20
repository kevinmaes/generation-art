/**
 * Fan Chart Layout Transformer
 *
 * Pure positioning system that arranges individuals in a radial pattern
 * based on their generational distance from a selected center person.
 * Outputs x,y coordinates only - no visual elements.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualTransformerConfig,
  VisualMetadata,
} from './types';
import { createTransformerInstance } from './utils';

/**
 * Async wrapper for the fan chart transform
 */
async function fanChartTransformAsync(
  context: TransformerContext,
): Promise<{ visualMetadata: CompleteVisualMetadata }> {
  const result = fanChartTransform(context);
  await new Promise((resolve) => setTimeout(resolve, 1)); // Small delay for async compatibility
  return { visualMetadata: result };
}

/**
 * Configuration for the fan chart transformer
 */
export const fanChartConfig: VisualTransformerConfig = {
  id: 'fan-chart',
  name: 'Fan Chart Layout',
  description:
    'Positions individuals in a radial pattern from a selected center person',
  shortDescription: 'Radial family positioning',
  transform: fanChartTransformAsync,
  createTransformerInstance: (params) =>
    createTransformerInstance(
      params,
      fanChartTransformAsync,
      fanChartConfig.visualParameters || [],
    ),
  categories: ['layout', 'positioning'],
  availableDimensions: [],
  defaultPrimaryDimension: 'generation',
  multiInstance: true,
  visualParameters: [
    {
      name: 'viewMode',
      type: 'select',
      defaultValue: 'ancestors',
      options: [
        { value: 'ancestors', label: 'Ancestors' },
        { value: 'descendants', label: 'Descendants' },
      ],
      label: 'View Mode',
      description: 'Show ancestors or descendants from center person',
    },
    {
      name: 'maxGenerations',
      type: 'range',
      defaultValue: 16,
      min: 1,
      max: 16,
      label: 'Generations',
      description: 'Number of generations to display',
    },
    {
      name: 'spacingMode',
      type: 'select',
      defaultValue: 'auto-fit',
      options: [
        { value: 'auto-fit', label: 'Auto Fit' },
        { value: 'manual', label: 'Manual' },
      ],
      label: 'Spacing Mode',
      description: 'Auto-fit to canvas or manual spacing',
    },
    {
      name: 'distribution',
      type: 'select',
      defaultValue: 'uniform',
      options: [
        { value: 'uniform', label: 'Uniform' },
        { value: 'compressed', label: 'Compressed' },
        { value: 'logarithmic', label: 'Logarithmic' },
      ],
      label: 'Distribution',
      description: 'How to distribute generations radially',
    },
    {
      name: 'spreadDegrees',
      type: 'range',
      defaultValue: 360,
      min: 90,
      max: 360,
      step: 45,
      label: 'Angular spread °',
      description: 'Degrees of circle to use (180=semi, 360=full)',
      unit: '°',
    },
    {
      name: 'rotation',
      type: 'range',
      defaultValue: 0,
      min: -180,
      max: 180,
      step: 15,
      label: 'Rotation °',
      description: 'Starting angle rotation',
      unit: '°',
    },
    {
      name: 'spiralTwist',
      type: 'range',
      defaultValue: 0,
      min: 0,
      max: 30,
      label: 'Spiral twist °',
      description: 'Degrees of twist per generation',
      unit: '°',
    },
  ],
};

/**
 * Main transform function
 */
export function fanChartTransform(
  context: TransformerContext,
): CompleteVisualMetadata {
  const {
    gedcomData,
    visualMetadata,
    canvasWidth = 1024,
    canvasHeight = 1024,
  } = context;

  // Get parameters
  // viewMode is not used directly in layout calculation but will be used for lineage determination
  const _viewMode = (context.visual.viewMode as string) ?? 'ancestors';
  const maxGenerations = (context.visual.maxGenerations as number) ?? 6;
  const spacingMode = (context.visual.spacingMode as string) ?? 'auto-fit';
  const distribution = (context.visual.distribution as string) ?? 'uniform';
  const spreadDegrees = (context.visual.spreadDegrees as number) ?? 360;
  const rotation = (context.visual.rotation as number) ?? 0;
  const spiralTwist = (context.visual.spiralTwist as number) ?? 0;

  // Canvas center
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Find center person (for now, use first individual)
  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    console.warn('No individuals found in data');
    return visualMetadata;
  }

  // Use primary individual from context, or fall back to first individual
  let centerPerson;
  let centerPersonId;

  if (
    context.primaryIndividualId &&
    gedcomData.individuals[context.primaryIndividualId]
  ) {
    centerPerson = gedcomData.individuals[context.primaryIndividualId];
    centerPersonId = context.primaryIndividualId;
  } else {
    // Fallback: use first individual
    centerPerson = individuals[0];
    centerPersonId = centerPerson.id;
  }

  // Initialize output structure
  const output: CompleteVisualMetadata = {
    ...visualMetadata,
    individuals: {},
    families: visualMetadata.families || {},
    edges: {}, // Start with empty edges, we'll add filtered ones later
    tree: visualMetadata.tree || {},
    global: visualMetadata.global || {},
  };

  // Position center person
  output.individuals[centerPersonId] = {
    x: centerX,
    y: centerY,
    custom: {
      generation: 0,
      angle: 0,
      distance: 0,
      angleNormalized: 0.5,
      lineage: 'ego',
      completeness: 1.0,
    },
  };

  // Get relatives based on view mode
  const relatives =
    _viewMode === 'ancestors'
      ? getAncestorsByGeneration(centerPersonId, gedcomData, maxGenerations)
      : getDescendantsByGeneration(centerPersonId, gedcomData, maxGenerations);

  // Calculate generation distances
  const distances = calculateGenerationDistances(
    spacingMode,
    distribution,
    maxGenerations,
    Math.min(canvasWidth, canvasHeight) / 2,
  );

  // Position each generation differently based on view mode
  if (_viewMode === 'ancestors') {
    // Original ancestor positioning logic
    relatives.forEach((generationRelatives, generation) => {
      if (generation === 0) return; // Skip center person

      const distance = distances[generation - 1];
      const angleStep =
        (spreadDegrees * Math.PI) / 180 / Math.pow(2, generation);
      const startAngle =
        (rotation * Math.PI) / 180 - (spreadDegrees * Math.PI) / 360;
      const twist = ((spiralTwist * Math.PI) / 180) * generation;

      generationRelatives.forEach((relative, index) => {
        if (!relative) {
          // Placeholder for missing relative
          return;
        }

        const angle = startAngle + (index + 0.5) * angleStep + twist;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        output.individuals[relative.id] = {
          x,
          y,
          custom: {
            generation,
            angle,
            distance,
            angleNormalized: index / Math.pow(2, generation),
            lineage: determineLineage(index, generation),
            completeness: calculateCompleteness(generationRelatives),
          },
        };
      });
    });
  } else {
    // Descendant positioning - each child only occupies their parent's angular space
    const individualAngles = new Map<string, { start: number; end: number }>();

    // Initialize center person's angular range
    const baseStartAngle =
      (rotation * Math.PI) / 180 - (spreadDegrees * Math.PI) / 360;
    const baseEndAngle = baseStartAngle + (spreadDegrees * Math.PI) / 180;
    individualAngles.set(centerPersonId, {
      start: baseStartAngle,
      end: baseEndAngle,
    });

    // Build a map of parent-to-children relationships from the relatives data
    const parentToChildren = new Map<string, any[]>();

    // First pass: build the parent-child map
    for (let gen = 1; gen < relatives.length; gen++) {
      const previousGen = relatives[gen - 1];
      const currentGen = relatives[gen];

      // For each person in the previous generation, find their children in current generation
      previousGen.forEach((parent) => {
        if (!parent) return;

        const childrenOfParent = currentGen.filter((child) => {
          if (!child) return false;
          // Check if this parent is in the child's parent list
          const parentIds = child.parents as string[] | undefined;
          return parentIds?.includes(parent.id) ?? false;
        });

        if (childrenOfParent.length > 0) {
          parentToChildren.set(parent.id, childrenOfParent);
        }
      });
    }

    // Second pass: position individuals
    relatives.forEach((generationRelatives, generation) => {
      if (generation === 0) return; // Skip center person

      const distance = distances[generation - 1];
      const twist = ((spiralTwist * Math.PI) / 180) * generation;

      // Get previous generation to find parents
      const previousGeneration =
        generation > 0 ? relatives[generation - 1] : [];

      // Position each individual based on their parent's angular range
      previousGeneration.forEach((parent) => {
        if (!parent) return;

        const parentAngle = individualAngles.get(parent.id);
        if (!parentAngle) return;

        const children = parentToChildren.get(parent.id) || [];
        if (children.length === 0) return;

        const angleRange = parentAngle.end - parentAngle.start;
        const childAngleStep = angleRange / children.length;

        children.forEach((child, index) => {
          const childStartAngle = parentAngle.start + index * childAngleStep;
          const childEndAngle = childStartAngle + childAngleStep;
          const angle = (childStartAngle + childEndAngle) / 2 + twist;

          const x = centerX + distance * Math.cos(angle);
          const y = centerY + distance * Math.sin(angle);

          output.individuals[child.id] = {
            x,
            y,
            custom: {
              generation,
              angle,
              distance,
              angleNormalized:
                (angle - baseStartAngle) / (baseEndAngle - baseStartAngle),
              lineage: 'descendant',
              completeness: calculateCompleteness(generationRelatives),
              parentId: parent.id, // Track parent for debugging
            },
          };

          // Store this child's angular range for their potential children
          individualAngles.set(child.id, {
            start: childStartAngle,
            end: childEndAngle,
          });
        });
      });
    });
  }

  // Filter edges to only show connections between adjacent generations
  // We need to explicitly hide edges rather than remove them due to how the pipeline merges
  const positionedIds = new Set(Object.keys(output.individuals));
  const filteredEdges: Record<string, VisualMetadata> = {};
  const largeGenDiffEdges: string[] = [];

  for (const edge of gedcomData.metadata.edges) {
    // Start with existing metadata or empty object
    const existingMetadata = visualMetadata.edges?.[edge.id] ?? {};

    // Check if both source and target are positioned
    if (
      !positionedIds.has(edge.sourceId) ||
      !positionedIds.has(edge.targetId)
    ) {
      // Hide edges where one or both nodes aren't positioned
      filteredEdges[edge.id] = {
        ...existingMetadata,
        opacity: 0, // Make invisible
        hidden: true, // Mark as hidden
      };
      continue;
    }

    const sourceGen = output.individuals[edge.sourceId]?.custom?.generation as
      | number
      | undefined;
    const targetGen = output.individuals[edge.targetId]?.custom?.generation as
      | number
      | undefined;

    // Only include edges between adjacent generations
    if (sourceGen !== undefined && targetGen !== undefined) {
      const genDiff = Math.abs(sourceGen - targetGen);

      // Only show edges between adjacent generations (parent-child)
      // or same generation (spouses)
      if (genDiff <= 1) {
        // Keep edge visible
        filteredEdges[edge.id] = existingMetadata;
      } else {
        // Hide edges with large generation differences
        filteredEdges[edge.id] = {
          ...existingMetadata,
          opacity: 0, // Make invisible
          hidden: true, // Mark as hidden
        };

        const sourceInd = gedcomData.individuals[edge.sourceId];
        const targetInd = gedcomData.individuals[edge.targetId];
        largeGenDiffEdges.push(
          `Edge ${edge.id}: ${sourceInd?.name || edge.sourceId} (gen ${String(sourceGen)}) -> ${targetInd?.name || edge.targetId} (gen ${String(targetGen)}), diff=${String(genDiff)}`,
        );
      }
    } else {
      // Can't determine generation, hide the edge
      filteredEdges[edge.id] = {
        ...existingMetadata,
        opacity: 0,
        hidden: true,
      };
    }
  }

  // Set all edges with visibility status
  output.edges = filteredEdges;

  return output;
}

/**
 * Get ancestors organized by generation
 */
function getAncestorsByGeneration(
  centerPersonId: string,
  gedcomData: any,
  maxGenerations: number,
): any[][] {
  const result: any[][] = [];

  // Generation 0: center person
  const centerPerson = gedcomData.individuals[centerPersonId];
  if (!centerPerson) {
    console.error(`Center person ${centerPersonId} not found`);
    return result;
  }
  result.push([centerPerson]);

  // Use graph traversal if available
  if (gedcomData.graph?.traversalUtils) {
    const { getParents } = gedcomData.graph.traversalUtils;

    let currentGeneration = [centerPersonId];

    for (let gen = 1; gen <= maxGenerations; gen++) {
      const nextGeneration: any[] = [];

      currentGeneration.forEach((personId) => {
        if (!personId) {
          // Missing person - add two null placeholders for their parents
          nextGeneration.push(null, null);
        } else {
          const parents = (getParents as (id: string) => any[])(personId);

          // Always add 2 slots (father, mother) even if missing
          // Parents are already individual objects from getParents
          // Check both 'gender' and 'sex' fields as different GEDCOM files use different fields
          let father =
            parents.find(
              (p: any) =>
                p.gender === 'M' ||
                p.sex === 'M' ||
                p.gender === 'Male' ||
                p.sex === 'Male',
            ) || null;
          let mother =
            parents.find(
              (p: any) =>
                p.gender === 'F' ||
                p.sex === 'F' ||
                p.gender === 'Female' ||
                p.sex === 'Female',
            ) || null;

          // If we couldn't identify by gender but have parents, use them in order
          if (!father && !mother && parents.length > 0) {
            father = parents[0] || null;
            mother = parents[1] || null;
          }

          // Important: Push the actual individual objects, not just null
          nextGeneration.push(father, mother);
        }
      });

      result.push(nextGeneration);
      currentGeneration = nextGeneration.map((p) => p?.id || null);
    }
  } else {
    // Fallback: use parent links directly from individuals
    console.warn('No graph traversal utilities available, using fallback');

    let currentGeneration = [centerPerson];

    for (let gen = 1; gen <= maxGenerations; gen++) {
      const nextGeneration: any[] = [];

      currentGeneration.forEach((person) => {
        if (!person) {
          // Missing person - add two null placeholders
          nextGeneration.push(null, null);
        } else {
          // Find parents through families
          let father = null;
          let mother = null;

          // Look for families where this person is a child
          Object.values(gedcomData.families).forEach((family: any) => {
            const children = (family.children as any[]) || [];
            if (children.some((child: any) => child.id === person.id)) {
              if (family.husband)
                father = gedcomData.individuals[family.husband.id];
              if (family.wife) mother = gedcomData.individuals[family.wife.id];
            }
          });

          nextGeneration.push(father, mother);
        }
      });

      result.push(nextGeneration);
      currentGeneration = nextGeneration;
    }
  }

  return result;
}

/**
 * Get descendants organized by generation
 */
function getDescendantsByGeneration(
  centerPersonId: string,
  gedcomData: any,
  maxGenerations: number,
): any[][] {
  const result: any[][] = [];

  // Generation 0: center person
  const centerPerson = gedcomData.individuals[centerPersonId];
  if (!centerPerson) {
    console.error(`Center person ${centerPersonId} not found`);
    return result;
  }
  result.push([centerPerson]);

  // Use graph traversal if available
  if (gedcomData.graph?.traversalUtils) {
    const { getChildren } = gedcomData.graph.traversalUtils;

    let currentGeneration = [centerPersonId];

    for (let gen = 1; gen <= maxGenerations; gen++) {
      const nextGeneration: any[] = [];
      const seenIds = new Set<string>();

      currentGeneration.forEach((personId) => {
        if (!personId) return;

        const children = (getChildren as (id: string) => any[])(personId);

        // Add each child to the next generation (avoiding duplicates)
        children.forEach((child: any) => {
          if (child && !seenIds.has(child.id)) {
            seenIds.add(child.id);
            nextGeneration.push(child);
          }
        });
      });

      if (nextGeneration.length === 0) {
        break;
      }

      result.push(nextGeneration);
      currentGeneration = nextGeneration.map((p) => p?.id || null);
    }
  } else {
    // Fallback: use family links directly
    console.warn('No graph traversal utilities available, using fallback');

    let currentGeneration = [centerPerson];

    for (let gen = 1; gen <= maxGenerations; gen++) {
      const nextGeneration: any[] = [];
      const seenIds = new Set<string>();

      currentGeneration.forEach((person) => {
        if (!person) return;

        // Look for families where this person is a parent
        Object.values(gedcomData.families).forEach((family: any) => {
          const isParent =
            (family.husband && family.husband.id === person.id) ||
            (family.wife && family.wife.id === person.id);

          if (isParent && family.children) {
            (family.children as any[]).forEach((childRef: any) => {
              const child = gedcomData.individuals[childRef.id];
              if (child && !seenIds.has(child.id)) {
                seenIds.add(child.id);
                nextGeneration.push(child);
              }
            });
          }
        });
      });

      if (nextGeneration.length === 0) {
        break;
      }

      result.push(nextGeneration);
      currentGeneration = nextGeneration;
    }
  }

  return result;
}

/**
 * Calculate distances for each generation
 */
function calculateGenerationDistances(
  mode: string,
  distribution: string,
  maxGenerations: number,
  maxRadius: number,
): number[] {
  const distances: number[] = [];
  const padding = 50;
  const availableRadius = maxRadius - padding;

  if (mode === 'auto-fit') {
    if (distribution === 'uniform') {
      const spacing = availableRadius / maxGenerations;
      for (let i = 0; i < maxGenerations; i++) {
        distances.push(spacing * (i + 1));
      }
    } else if (distribution === 'compressed') {
      const factor = 0.85;
      let sum = 0;
      for (let i = 0; i < maxGenerations; i++) {
        sum += Math.pow(factor, i);
      }
      const initial = availableRadius / sum;

      let currentDistance = 0;
      for (let i = 0; i < maxGenerations; i++) {
        currentDistance += initial * Math.pow(factor, i);
        distances.push(currentDistance);
      }
    } else if (distribution === 'logarithmic') {
      for (let i = 0; i < maxGenerations; i++) {
        const ratio = Math.log(i + 2) / Math.log(maxGenerations + 1);
        distances.push(availableRadius * ratio);
      }
    }
  } else {
    // Manual mode - use fixed spacing
    const initial = 120;
    const factor = 0.9;
    let currentDistance = 0;
    for (let i = 0; i < maxGenerations; i++) {
      currentDistance += initial * Math.pow(factor, i);
      distances.push(currentDistance);
    }
  }

  return distances;
}

/**
 * Determine lineage type based on position in generation
 */
function determineLineage(index: number, generation: number): string {
  if (generation === 0) return 'ego';

  const halfPoint = Math.pow(2, generation) / 2;
  if (index < halfPoint) {
    return 'paternal';
  } else {
    return 'maternal';
  }
}

/**
 * Calculate completeness (percentage of known ancestors in generation)
 */
function calculateCompleteness(generationAncestors: any[]): number {
  const total = generationAncestors.length;
  const known = generationAncestors.filter((a) => a !== null).length;
  return known / total;
}
