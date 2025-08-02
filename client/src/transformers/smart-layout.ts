/**
 * Smart Layout Transformer
 *
 * AI-powered layout transformer that uses LLMs to intelligently position
 * nodes and edges based on genealogy data and user-selected layout style.
 */

import type {
  TransformerContext,
  VisualMetadata,
  TransformerOutput,
} from './types';
import {
  llmLayoutService,
  type LLMLayoutResponse,
} from '../services/llm-layout-service';
import { generateLayoutPrompt } from '../services/prompt-templates';

/**
 * Smart layout transform function with LLM integration
 */
export async function smartLayoutTransform(
  context: TransformerContext,
): Promise<TransformerOutput> {
  const { gedcomData, visualMetadata, visual, temperature } = context;
  const layoutStyle = visual.layoutStyle as string;

  const individuals = Object.values(gedcomData.individuals);
  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Check API key availability
  const apiKeyCheck = llmLayoutService.validateApiKeys();
  if (!apiKeyCheck.valid) {
    console.warn('LLM API keys missing:', apiKeyCheck.missing);
    return algorithmicFallback(context);
  }

  try {
    // Generate LLM prompt
    const prompt = generateLayoutPrompt(context);

    // Call LLM service
    const llmResponse = await llmLayoutService.generateLayout(
      prompt,
      temperature ?? 0.5,
    );

    // Merge LLM response with existing metadata
    const mergedMetadata = mergeLayoutResponse(llmResponse, visualMetadata);

    const providerInfo = llmLayoutService.getProviderInfo();

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
 * Merge LLM response with existing visual metadata
 */
function mergeLayoutResponse(
  llmResponse: LLMLayoutResponse,
  visualMetadata: TransformerContext['visualMetadata'],
): TransformerOutput['visualMetadata'] {
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

  // Merge individuals with position validation
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  Object.entries(visualMetadata.individuals).forEach(([id, existingMeta]) => {
    const llmMeta = llmResponse.individuals[id] || {} as Partial<LLMLayoutResponse['individuals'][string]>;

    // Validate and clamp positions to canvas bounds
    const x =
      llmMeta.x !== undefined
        ? Math.max(0, Math.min(canvasWidth, llmMeta.x))
        : existingMeta.x;

    const y =
      llmMeta.y !== undefined
        ? Math.max(0, Math.min(canvasHeight, llmMeta.y))
        : existingMeta.y;

    // Deep merge: preserve existing properties, override with LLM changes
    updatedIndividuals[id] = {
      ...existingMeta,
      ...llmMeta,
      x,
      y,
      // Special handling for cumulative properties
      rotation:
        existingMeta.rotation !== undefined && llmMeta.rotation !== undefined
          ? existingMeta.rotation + llmMeta.rotation
          : (llmMeta.rotation ?? existingMeta.rotation),
    };
  });

  // Merge edges if provided
  const updatedEdges: Record<string, VisualMetadata> = {};
  if (llmResponse.edges) {
    Object.entries(visualMetadata.edges || {}).forEach(([id, existingMeta]) => {
      const llmMeta = llmResponse.edges?.[id] || {};

      updatedEdges[id] = {
        ...existingMeta,
        ...llmMeta,
      };
    });
  }

  return {
    individuals: updatedIndividuals,
    ...(Object.keys(updatedEdges).length > 0 && { edges: updatedEdges }),
  };
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
