/**
 * Prompt Templates for LLM Layout Generation
 *
 * Generates prompts for different layout styles and providers
 */

import type { TransformerContext } from '../transformers/types';
import type { LLMReadyData } from '../../../shared/types/llm-data';
import type { CompleteVisualMetadata } from '../transformers/types';

interface PromptContext {
  layoutStyle: string;
  canvasWidth: number;
  canvasHeight: number;
  llmData: LLMReadyData;
  visualParameters: Record<string, unknown>;
  temperature: number;
  currentVisualMetadata?: string; // JSON string of current state
}

/**
 * Generate the main layout prompt for LLM
 */
export function generateLayoutPrompt(context: TransformerContext): string {
  const { llmData, visualMetadata, visual, temperature, dimensions } = context;
  const layoutStyle = String(visual.layoutStyle);
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

  const promptContext: PromptContext = {
    layoutStyle,
    canvasWidth,
    canvasHeight,
    llmData,
    visualParameters: {
      ...visual,
      primary: dimensions.primary,
      secondary: dimensions.secondary,
    },
    temperature: temperature ?? 0.5,
    currentVisualMetadata: buildCompactVisualMetadata(visualMetadata),
  };

  const basePrompt = buildBasePrompt(promptContext);
  const provider = (import.meta.env.VITE_LLM_PROVIDER ?? 'openai') as string;

  return getProviderOptimizedPrompt(basePrompt, provider);
}

/**
 * Build the core prompt with all context
 */
function buildBasePrompt(context: PromptContext): string {
  const {
    layoutStyle,
    canvasWidth,
    canvasHeight,
    llmData,
    visualParameters,
    temperature,
    currentVisualMetadata,
  } = context;

  return `You are a layout algorithm for genealogy visualization. Given family tree metadata and current visual properties, calculate new positions while preserving existing visual attributes.

Layout Style: ${layoutStyle}
Canvas: ${String(canvasWidth)}x${String(canvasHeight)}
Temperature: ${String(temperature)} (0.0 = precise/deterministic, 1.0 = creative/varied)

User Parameters:
- Spacing: ${String(visualParameters.spacing)} (tight/compact/normal/loose/sparse)
- Primary Dimension: ${visualParameters.primary as string} (for emphasis in layout)
- Secondary Dimension: ${(visualParameters.secondary as string) || 'birthYear'} (for variation)

Current State: ${currentVisualMetadata ?? 'No positioned nodes'}

Tree Structure:
- Total Individuals: ${String(llmData.metadata.graphStructure.totalIndividuals)}
- Generations: ${String(llmData.metadata.graphStructure.maxGenerations)}
- Tree Complexity: ${String(llmData.metadata.graphStructure.treeComplexity)}
- Average Family Size: ${String(llmData.metadata.graphStructure.averageFamilySize)}

Key Family Connections (sampled):
${buildConnectionsDescription(llmData, 12)}

Requirements:
1. MERGE STRATEGY: Build upon existing visual metadata, don't replace it
   - Preserve all properties you don't explicitly change
   - For position changes, consider current positions as starting points
   - Maintain existing colors, sizes, shapes, etc. unless layout requires changes

2. Position all individuals within canvas bounds (0,0 to ${String(canvasWidth)},${String(canvasHeight)})

3. Apply layout style:
${getLayoutStyleInstructions(layoutStyle, canvasWidth, canvasHeight)}

4. Respect user parameters:
   - Apply ${String(visualParameters.spacing)} spacing multiplier to distances
   - Consider ${visualParameters.primary as string} for main layout axis
   - Use ${(visualParameters.secondary as string) || 'birthYear'} for secondary positioning

5. Apply temperature:
${getTemperatureInstructions(temperature)}

${getLayoutSpecificGuidance(layoutStyle, llmData)}

Output format (ONLY layout properties - x, y, rotation):
{
  "individuals": {
    "id1": { "x": 100, "y": 200 },
    "id2": { "x": 150, "y": 250, "rotation": 45 }
  },
  "edges": {
    "edge1": { "controlPoints": [{"x": 125, "y": 225}] }
  },
  "layoutMetadata": {
    "boundingBox": { "x": 50, "y": 50, "width": 900, "height": 700 },
    "centerOfMass": { "x": 500, "y": 400 },
    "layoutQuality": 0.85
  }
}

IMPORTANT: Only return position/rotation data. Do NOT include colors, sizes, shapes, or other visual properties.`;
}

/**
 * Extract only layout-relevant properties for LLM processing
 * This dramatically reduces token usage while preserving what the LLM needs to modify
 */
export function extractLayoutRelevantMetadata(visualMetadata: CompleteVisualMetadata): {
  individuals: Record<string, { x?: number; y?: number; rotation?: number }>;
  edges: Record<string, { controlPoints?: { x: number; y: number }[] }>;
} {
  const individuals: Record<string, { x?: number; y?: number; rotation?: number }> = {};
  const edges: Record<string, { controlPoints?: { x: number; y: number }[] }> = {};

  // Extract only position and rotation data for individuals
  Object.entries(visualMetadata.individuals).forEach(([id, meta]) => {
    individuals[id] = {
      ...(meta.x !== undefined && { x: meta.x }),
      ...(meta.y !== undefined && { y: meta.y }),
      ...(meta.rotation !== undefined && { rotation: meta.rotation }),
    };
  });

  // Extract only control points for edges
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (visualMetadata.edges) {
    Object.entries(visualMetadata.edges).forEach(([id, meta]) => {
    if (meta.custom?.controlPoints) {
      edges[id] = {
        controlPoints: meta.custom.controlPoints as { x: number; y: number }[],
      };
    }
  });
  }

  return { individuals, edges };
}

/**
 * Build compact visual metadata representation for LLM context
 * Shows current layout state in a token-efficient format
 */
function buildCompactVisualMetadata(visualMetadata: CompleteVisualMetadata): string {
  const layoutData = extractLayoutRelevantMetadata(visualMetadata);
  
  // Count positioned individuals
  const positionedCount = Object.values(layoutData.individuals)
    .filter(meta => meta.x !== undefined && meta.y !== undefined).length;
    
  const totalCount = Object.keys(layoutData.individuals).length;
  
  if (positionedCount === 0) {
    return `No positioned nodes (${String(totalCount)} total need positioning)`;
  }
  
  // Show sample positions in compact format
  const samplePositions = Object.entries(layoutData.individuals)
    .filter(([, meta]) => meta.x !== undefined && meta.y !== undefined)
    .slice(0, 5)
    .map(([id, meta]) => `${id}:(${String(Math.round(meta.x ?? 0))},${String(Math.round(meta.y ?? 0))})`)
    .join(', ');

  return `${String(positionedCount)}/${String(totalCount)} positioned: ${samplePositions}${positionedCount > 5 ? '...' : ''}`;
}

/**
 * Build connections description from LLM data with intelligent sampling
 */
function buildConnectionsDescription(llmData: LLMReadyData, maxIndividuals = 15): string {
  const individuals = Object.entries(llmData.individuals);
  
  // Intelligent sampling: prioritize key nodes (roots, connectors, recent generations)
  const sampledIndividuals = individuals
    .sort(([_idA, a], [_idB, b]) => {
      // Priority scoring: root nodes (no parents) and highly connected nodes first
      const aScore = (a.parents.length === 0 ? 10 : 0) + 
                    Object.values(llmData.individuals).filter(ind => ind.parents.includes(a.id)).length;
      const bScore = (b.parents.length === 0 ? 10 : 0) + 
                    Object.values(llmData.individuals).filter(ind => ind.parents.includes(b.id)).length;
      return bScore - aScore;
    })
    .slice(0, maxIndividuals);

  const connections = sampledIndividuals
    .map(([id, individual]) => {
      const parents = individual.parents.length;
      const children = Object.values(llmData.individuals).filter((ind) =>
        ind.parents.includes(id),
      ).length;

      return `- ${id}: Gen ${String(individual.metadata.generation ?? '?')}, ${String(parents)}p, ${String(children)}c`;
    })
    .join('\n');

  const totalCount = Object.keys(llmData.individuals).length;
  return connections + (totalCount > maxIndividuals ? `\n... (${String(totalCount - maxIndividuals)} more)` : '');
}

/**
 * Get layout style specific instructions
 */
function getLayoutStyleInstructions(
  layoutStyle: string,
  width: number,
  height: number,
): string {
  switch (layoutStyle) {
    case 'tree':
      return `   - tree: Maintain generational hierarchy, top-down flow
   - Earlier generations at top, later at bottom
   - Siblings should be horizontally aligned
   - Keep family groups visually connected`;

    case 'radial':
      return `   - radial: Center at (${String(width / 2)}, ${String(height / 2)}), generations as rings
   - Root generation at center, expanding outward
   - Maintain angular relationships between family branches
   - Use concentric circles for each generation`;

    case 'grid':
      return `   - grid: Uniform spacing, consider primary dimension for ordering
   - Create regular grid pattern
   - Order by primary dimension (generation/birthYear)
   - Maintain readability with consistent spacing`;

    default:
      return `   - Position nodes to optimize readability and relationships`;
  }
}

/**
 * Get temperature-based instructions
 */
function getTemperatureInstructions(temperature: number): string {
  if (temperature < 0.3) {
    return `   - Low temperature: Apply strict mathematical layout
   - Positions should be perfectly aligned and evenly spaced
   - No creative variations or organic feel`;
  } else if (temperature < 0.7) {
    return `   - Medium temperature: Balance structure with natural variation
   - Allow small deviations from perfect alignment
   - Add subtle position adjustments for visual interest`;
  } else {
    return `   - High temperature: Create organic, artistic layout
   - Prioritize visual appeal over strict rules
   - Add creative variations while maintaining readability`;
  }
}

/**
 * Get layout-specific guidance based on tree characteristics
 */
function getLayoutSpecificGuidance(
  layoutStyle: string,
  llmData: LLMReadyData,
): string {
  const { totalIndividuals, treeComplexity } = llmData.metadata.graphStructure;

  let guidance = '';

  if (totalIndividuals > 50) {
    guidance +=
      'Large tree detected: Focus on preventing overcrowding and maintaining readability.\n';
  }

  if (Number(treeComplexity) > 0.7) {
    guidance +=
      'Complex tree structure: Pay special attention to relationship clarity.\n';
  }

  if (layoutStyle === 'radial' && Number(totalIndividuals) > 30) {
    guidance +=
      'For radial layout with many nodes: Use multiple rings and consider angular spacing.\n';
  }

  return guidance;
}

/**
 * Optimize prompt for specific LLM providers
 */
export function getProviderOptimizedPrompt(
  basePrompt: string,
  provider: string,
): string {
  switch (provider) {
    case 'openai':
      return `${basePrompt}

Please respond with valid JSON only. Use precise calculations for optimal layout. Focus on mathematical precision and exact positioning.`;

    case 'anthropic':
      return `${basePrompt}

I need you to think step by step about the optimal layout, considering the family relationships and visual hierarchy, then provide the JSON response with your calculated positions.`;

    default:
      return basePrompt;
  }
}
