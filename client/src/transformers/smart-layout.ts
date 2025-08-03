/**
 * Smart Layout Transformer
 *
 * AI-powered layout transformer that uses LLMs to intelligently position
 * nodes and edges based on genealogy data and user-selected layout style.
 */

import { z } from 'zod';
import type {
  TransformerContext,
  TransformerOutput,
  VisualMetadata,
  VisualTransformerConfig,
} from './types';
import type { SmartTransformerConfig } from './smart-transformer-types';
import { createTransformerInstance } from './utils';
import {
  buildSmartTransformerPrompt,
  mergeLLMResponse,
} from '../services/smart-transformer-utils';
import { executeSmartTransformer } from '../services/smart-llm-service';
import { llmService } from '../services/llm-service';

/**
 * Configuration for the smart layout transformer
 */
export const smartLayoutTransformerConfig: VisualTransformerConfig = {
  id: 'smart-layout',
  name: 'Smart Layout',
  description:
    'AI-powered layout that uses machine learning to intelligently position nodes and edges based on family tree structure and user preferences.',
  shortDescription: 'Smart AI-powered layout positioning',
  transform: smartLayoutTransform,
  categories: ['layout', 'ai'],
  requiresLLM: true,
  availableDimensions: ['generation', 'birthYear', 'childrenCount', 'lifespan'],
  defaultPrimaryDimension: 'generation',
  defaultSecondaryDimension: 'birthYear',
  visualParameters: [
    {
      name: 'layoutStyle',
      type: 'select',
      defaultValue: 'tree',
      label: 'Layout Style',
      description: 'AI-powered layout algorithm for positioning nodes',
      options: [
        { value: 'tree', label: 'Tree (Hierarchical)' },
        { value: 'radial', label: 'Radial (Circular)' },
        { value: 'grid', label: 'Grid (Uniform)' },
      ],
    },
    {
      name: 'spacing',
      type: 'select',
      defaultValue: 'normal',
      label: 'Spacing',
      description: 'General spacing between elements',
      options: [
        { value: 'tight', label: 'Tight' },
        { value: 'compact', label: 'Compact' },
        { value: 'normal', label: 'Normal' },
        { value: 'loose', label: 'Loose' },
        { value: 'sparse', label: 'Sparse' },
      ],
    },
    {
      name: 'temperature',
      type: 'range',
      defaultValue: 0.5,
      label: 'Temperature',
      description: 'Creativity level for AI layout (0 = strict, 1 = creative)',
      min: 0,
      max: 1.0,
      step: 0.1,
    },
  ],
  getDefaults: () => ({
    layoutStyle: 'tree',
    spacing: 'normal',
    temperature: 0.5,
  }),
  createTransformerInstance: (params) =>
    createTransformerInstance(params, smartLayoutTransform, [
      { name: 'layoutStyle', defaultValue: 'tree' },
      { name: 'spacing', defaultValue: 'normal' },
      { name: 'temperature', defaultValue: 0.5 },
    ]),
};

// Layout-specific response schema
const LayoutResponseSchema = z.object({
  individuals: z.record(
    z.string(),
    z
      .object({
        x: z.number().optional(),
        y: z.number().optional(),
        rotation: z.number().optional(),
      })
      .refine(
        (data) =>
          data.x !== undefined ||
          data.y !== undefined ||
          data.rotation !== undefined,
        { message: 'At least one layout property must be provided' },
      ),
  ),
  edges: z
    .record(
      z.string(),
      z.object({
        controlPoints: z
          .array(z.object({ x: z.number(), y: z.number() }))
          .optional(),
      }),
    )
    .optional(),
  layoutMetadata: z
    .object({
      boundingBox: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      centerOfMass: z.object({
        x: z.number(),
        y: z.number(),
      }),
      layoutQuality: z.number().min(0).max(1).optional(),
      layoutDensity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

type LayoutResponse = z.infer<typeof LayoutResponseSchema>;

// Smart layout configuration
const smartLayoutConfig: SmartTransformerConfig = {
  llmProperties: {
    individuals: {
      properties: ['x', 'y', 'rotation'],
      required: ['x', 'y'],
    },
    edges: {
      properties: ['controlPoints'],
    },
  },

  responseSchema: LayoutResponseSchema,

  prompt: {
    taskDescription: `You are a layout algorithm for genealogy visualization. Given family tree metadata and current visual properties, calculate optimal positions while preserving existing visual attributes.

Your goal is to create clear, readable layouts that:
- Show family relationships clearly
- Avoid overlapping nodes
- Use space efficiently
- Maintain visual hierarchy`,

    outputExample: `{
  "individuals": {
    "id1": { "x": 100, "y": 200, "rotation": 0 },
    "id2": { "x": 300, "y": 200 }
  },
  "edges": {
    "edge1": { "controlPoints": [{"x": 200, "y": 200}] }
  },
  "layoutMetadata": {
    "boundingBox": { "x": 50, "y": 50, "width": 900, "height": 700 },
    "centerOfMass": { "x": 500, "y": 400 },
    "layoutQuality": 0.85
  }
}`,

    getSpecificGuidance: (context) => {
      const style = context.visual.layoutStyle as string;
      const spacing = context.visual.spacing as string;
      const { totalIndividuals, treeComplexity } =
        context.llmData.metadata.graphStructure;

      let guidance = `Layout Requirements:\n`;
      guidance += `- Apply ${style} layout style\n`;
      guidance += `- Use ${spacing} spacing between nodes\n`;
      guidance += `- Position all nodes within canvas bounds\n`;

      if (totalIndividuals > 50) {
        guidance += `- Large tree: Focus on preventing overcrowding\n`;
      }

      if (Number(treeComplexity) > 0.7) {
        guidance += `- Complex structure: Emphasize relationship clarity\n`;
      }

      return guidance;
    },

    getStyleInstructions: (style, context) => {
      const width = context.visualMetadata.global.canvasWidth ?? 1000;
      const height = context.visualMetadata.global.canvasHeight ?? 800;

      switch (style) {
        case 'tree':
          return `Tree Layout Instructions:
- Arrange generations hierarchically from top to bottom
- Keep siblings horizontally aligned
- Maintain consistent vertical spacing between generations
- Center each generation horizontally`;

        case 'radial':
          return `Radial Layout Instructions:
- Place root generation at center (${String(width / 2)}, ${String(height / 2)})
- Arrange subsequent generations in concentric circles
- Distribute nodes evenly around each ring
- Increase radius proportionally for each generation`;

        case 'grid':
          return `Grid Layout Instructions:
- Create a regular grid pattern
- Order nodes by generation and birth year
- Maintain consistent row and column spacing
- Use full canvas area efficiently`;

        default:
          return `Optimize layout for readability and relationship clarity`;
      }
    },
  },
};

/**
 * Smart layout transform function with LLM integration
 */
// Debug: Track how many times this transformer is called
let smartLayoutCallCount = 0;

export async function smartLayoutTransform(
  context: TransformerContext,
): Promise<TransformerOutput> {
  console.log(
    `🧠 Smart Layout Transformer called (call #${String(++smartLayoutCallCount)})`,
  );

  // Log key parameters being used
  const layoutStyle = context.visual.layoutStyle as string;
  const spacing = context.visual.spacing as string;
  const temperature = context.temperature ?? 0.5;
  const individualsCount = Object.keys(context.gedcomData.individuals).length;
  const canvasSize = `${String(context.visualMetadata.global.canvasWidth ?? 1000)}x${String(context.visualMetadata.global.canvasHeight ?? 800)}`;

  console.log(
    `📐 Layout: ${layoutStyle}, Spacing: ${spacing}, Temp: ${String(temperature)}, Canvas: ${canvasSize}, Individuals: ${String(individualsCount)}`,
  );
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Check API key availability
  const apiKeyCheck = llmService.validateApiKeys();
  if (!apiKeyCheck.valid) {
    console.warn('LLM API keys missing:', apiKeyCheck.missing);
    return algorithmicFallback(context);
  }

  try {
    // Generate prompt using new architecture
    const prompt = buildSmartTransformerPrompt(context, smartLayoutConfig);

    // Execute smart transformer
    const llmResponse = await executeSmartTransformer<LayoutResponse>(
      'smart-layout',
      prompt,
      smartLayoutConfig,
      temperature ?? 0.5,
    );

    // Merge LLM response with existing metadata
    const mergedMetadata = mergeLLMResponse(
      llmResponse,
      visualMetadata,
      smartLayoutConfig,
    );

    // Log what properties were actually modified
    const sampleIndividual = Object.values(llmResponse.individuals)[0];
    const modifiedProps = sampleIndividual
      ? Object.keys(sampleIndividual).join(', ')
      : 'none';
    const hasEdges =
      llmResponse.edges && Object.keys(llmResponse.edges).length > 0;

    console.log(
      `✨ LLM Layout applied: Modified [${modifiedProps}${hasEdges ? ', edges.controlPoints' : ''}] | Preserved [color, size, shape, opacity, etc.]`,
    );

    const providerInfo = llmService.getProviderInfo();

    return {
      visualMetadata: mergedMetadata,
      debug: {
        message: `Smart layout applied: ${layoutStyle} (LLM-powered)`,
        data: {
          layoutStyle,
          provider: providerInfo.provider,
          model: providerInfo.model,
          individualsProcessed: individuals.length,
          layoutQuality: llmResponse.layoutMetadata?.layoutQuality,
          boundingBox: llmResponse.layoutMetadata?.boundingBox,
        },
      },
    };
  } catch (error) {
    console.error('LLM layout failed, falling back to algorithmic:', error);
    return algorithmicFallback(context);
  }
}

/**
 * Algorithmic fallback when LLM is unavailable
 */
function algorithmicFallback(context: TransformerContext): TransformerOutput {
  const { gedcomData, visualMetadata, visual } = context;
  const layoutStyle = visual.layoutStyle as string;
  const individuals = Object.values(gedcomData.individuals);

  const updatedIndividuals: Record<string, VisualMetadata> = {};
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

  // Simple layout based on style
  individuals.forEach((individual, index) => {
    const currentMetadata = visualMetadata.individuals[individual.id] ?? {};
    let x: number;
    let y: number;

    switch (layoutStyle) {
      case 'tree': {
        // Simple hierarchical layout
        const generation = individual.metadata?.relativeGenerationValue ?? 0.5;
        x = (index % 5) * (canvasWidth / 5) + canvasWidth / 10;
        y = generation * canvasHeight * 0.8 + 50;
        break;
      }
      case 'radial': {
        // Simple radial layout
        const angle = (index / individuals.length) * 2 * Math.PI;
        const radius = Math.min(canvasWidth, canvasHeight) * 0.3;
        x = canvasWidth / 2 + Math.cos(angle) * radius;
        y = canvasHeight / 2 + Math.sin(angle) * radius;
        break;
      }
      case 'grid': {
        // Simple grid layout
        const cols = Math.ceil(Math.sqrt(individuals.length));
        const cellWidth = canvasWidth / cols;
        const cellHeight = canvasHeight / Math.ceil(individuals.length / cols);
        x = (index % cols) * cellWidth + cellWidth / 2;
        y = Math.floor(index / cols) * cellHeight + cellHeight / 2;
        break;
      }
      default:
        // Default to preserving existing position
        x = currentMetadata.x ?? canvasWidth / 2;
        y = currentMetadata.y ?? canvasHeight / 2;
    }

    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      x,
      y,
    };
  });

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
    debug: {
      message: `Smart layout applied: ${layoutStyle} (algorithmic fallback)`,
      data: {
        layoutStyle,
        individualsProcessed: individuals.length,
        fallbackReason: 'LLM unavailable',
      },
    },
  };
}
