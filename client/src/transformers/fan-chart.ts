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
    'Positions individuals in a radial ancestor pattern from a selected center person',
  shortDescription: 'Radial ancestor positioning',
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
      name: 'maxGenerations',
      type: 'range',
      defaultValue: 6,
      min: 1,
      max: 12,
      label: 'Generations',
      description: 'Number of ancestor generations to display',
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
      defaultValue: 180,
      min: 90,
      max: 360,
      step: 45,
      label: 'Angular Spread',
      description: 'Degrees of circle to use (180=semi, 360=full)',
    },
    {
      name: 'rotation',
      type: 'range',
      defaultValue: -90,
      min: -180,
      max: 180,
      step: 15,
      label: 'Rotation',
      description: 'Starting angle rotation',
    },
    {
      name: 'spiralTwist',
      type: 'range',
      defaultValue: 0,
      min: 0,
      max: 30,
      label: 'Spiral Twist',
      description: 'Degrees of twist per generation',
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
  const maxGenerations = (context.visual.maxGenerations as number) ?? 6;
  const spacingMode = (context.visual.spacingMode as string) ?? 'auto-fit';
  const distribution = (context.visual.distribution as string) ?? 'uniform';
  const spreadDegrees = (context.visual.spreadDegrees as number) ?? 180;
  const rotation = (context.visual.rotation as number) ?? -90;
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

  // TODO: Add person selector parameter
  const centerPerson = individuals[0];
  const centerPersonId = centerPerson.id;

  console.log(`🎯 Fan chart center: ${centerPerson.name} (${centerPersonId})`);

  // Initialize output structure
  const output: CompleteVisualMetadata = {
    ...visualMetadata,
    individuals: {},
    families: visualMetadata.families || {},
    edges: visualMetadata.edges || {},
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

  // Get ancestors using graph traversal
  const ancestors = getAncestorsByGeneration(
    centerPersonId,
    gedcomData,
    maxGenerations,
  );

  console.log(
    'Ancestors by generation:',
    ancestors.map(
      (gen, i) =>
        `Gen ${String(i)}: ${String(gen.filter((a) => a).length)}/${String(gen.length)} known`,
    ),
  );

  // Calculate generation distances
  const distances = calculateGenerationDistances(
    spacingMode,
    distribution,
    maxGenerations,
    Math.min(canvasWidth, canvasHeight) / 2,
  );

  console.log('Generation distances:', distances);

  // Position each generation
  ancestors.forEach((generationAncestors, generation) => {
    if (generation === 0) return; // Skip center person

    const distance = distances[generation - 1];
    const angleStep = (spreadDegrees * Math.PI) / 180 / Math.pow(2, generation);
    const startAngle =
      (rotation * Math.PI) / 180 - (spreadDegrees * Math.PI) / 360;
    const twist = ((spiralTwist * Math.PI) / 180) * generation;

    console.log(
      `Gen ${String(generation)}: ${String(generationAncestors.length)} slots, angleStep: ${String((angleStep * 180) / Math.PI)}°`,
    );

    generationAncestors.forEach((ancestor, index) => {
      if (!ancestor) {
        // Placeholder for missing ancestor
        console.log(`  Slot ${String(index)}: empty`);
        return;
      }

      const angle = startAngle + (index + 0.5) * angleStep + twist;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      console.log(
        `  Slot ${String(index)}: ${String(ancestor.name)} at (${String(x.toFixed(0))}, ${String(y.toFixed(0))})`,
      );

      output.individuals[ancestor.id] = {
        x,
        y,
        custom: {
          generation,
          angle,
          distance,
          angleNormalized: index / Math.pow(2, generation),
          lineage: determineLineage(index, generation),
          completeness: calculateCompleteness(generationAncestors),
        },
      };
    });
  });

  console.log(
    `📍 Positioned ${String(Object.keys(output.individuals).length)} individuals`,
  );

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

  console.log('Graph available?', !!gedcomData.graph);
  console.log('TraversalUtils available?', !!gedcomData.graph?.traversalUtils);

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
          console.log(
            `Parents of ${String(personId)}:`,
            parents.map(
              (p: any) =>
                `${String(p.name)} (gender: ${String(p.gender)}, sex: ${String(p.sex)})`,
            ),
          );

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
            console.log(
              '  Warning: Could not identify parent genders, using order',
            );
            father = parents[0] || null;
            mother = parents[1] || null;
          }

          // Important: Push the actual individual objects, not just null
          nextGeneration.push(father, mother);
          console.log(
            `  Added father: ${father ? String(father.name) : 'null'}, mother: ${mother ? String(mother.name) : 'null'}`,
          );
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
