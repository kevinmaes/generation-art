/**
 * Smart Transformer Utilities
 *
 * Pure functions for extracting, merging, and building prompts for smart transformers
 */

import type {
  TransformerContext,
  VisualMetadata,
} from '../pipeline/transformers/types';
import type {
  SmartTransformerConfig,
  GenericPromptData,
} from '../pipeline/transformers/smart-transformer-types';
import type { LLMReadyData } from '../../../shared/types/llm-data';

type ExtractedData = Record<string, Record<string, unknown>>;

/**
 * Extract only the properties specified in the config from visualMetadata
 * This reduces the data sent to the LLM to only what's needed
 */
export function extractLLMProperties(
  metadata: TransformerContext['visualMetadata'],
  config: SmartTransformerConfig,
): ExtractedData {
  // Use custom extractor if provided
  if (config.customExtractor) {
    return config.customExtractor(metadata) as ExtractedData;
  }

  const extracted: ExtractedData = {};

  // Extract individual properties
  if (config.llmProperties.individuals) {
    extracted.individuals = {};
    const { properties } = config.llmProperties.individuals;

    Object.entries(metadata.individuals).forEach(([id, meta]) => {
      const props: Record<string, unknown> = {};

      properties.forEach((prop) => {
        // Handle nested properties (e.g., 'custom.something')
        if (prop.includes('.')) {
          const [parent, child] = prop.split('.');
          if (parent === 'custom' && meta.custom && child in meta.custom) {
            props[prop] = meta.custom[child];
          }
        } else if (prop in meta) {
          props[prop] = meta[prop as keyof VisualMetadata];
        }
      });

      if (Object.keys(props).length > 0) {
        extracted.individuals[id] = props;
      }
    });
  }

  // Extract edge properties
  if (config.llmProperties.edges && Object.keys(metadata.edges).length > 0) {
    extracted.edges = {};
    const { properties } = config.llmProperties.edges;

    Object.entries(metadata.edges).forEach(([id, meta]) => {
      const props: Record<string, unknown> = {};

      properties.forEach((prop) => {
        if (prop === 'controlPoints' && meta.custom?.controlPoints) {
          props.controlPoints = meta.custom.controlPoints;
        } else if (prop.includes('.')) {
          const [parent, child] = prop.split('.');
          if (parent === 'custom' && meta.custom && child in meta.custom) {
            props[child] = meta.custom[child];
          }
        } else if (prop in meta) {
          props[prop] = meta[prop as keyof VisualMetadata];
        }
      });

      if (Object.keys(props).length > 0) {
        extracted.edges[id] = props;
      }
    });
  }

  // Extract global properties
  if (config.llmProperties.global) {
    extracted.global = {};
    const { properties } = config.llmProperties.global;

    properties.forEach((prop) => {
      if (prop in metadata.global) {
        extracted.global[prop] =
          metadata.global[prop as keyof typeof metadata.global];
      }
    });
  }

  return extracted;
}

interface LLMResponse {
  individuals?: Record<string, Record<string, unknown>>;
  edges?: Record<
    string,
    { controlPoints?: { x: number; y: number }[] } & Record<string, unknown>
  >;
  global?: Record<string, unknown>;
}

/**
 * Merge LLM response back into the original metadata
 * Only updates properties that were sent to the LLM
 */
export function mergeLLMResponse(
  llmResponse: LLMResponse,
  originalMetadata: TransformerContext['visualMetadata'],
  config: SmartTransformerConfig,
): TransformerContext['visualMetadata'] {
  // Use custom merger if provided
  if (config.customMerger) {
    return config.customMerger(llmResponse, originalMetadata);
  }

  // Deep clone to avoid mutations
  const merged: TransformerContext['visualMetadata'] = {
    individuals: { ...originalMetadata.individuals },
    edges: { ...originalMetadata.edges },
    families: { ...originalMetadata.families },
    tree: originalMetadata.tree,
    global: { ...originalMetadata.global },
  };

  // Merge individuals
  if (llmResponse.individuals && config.llmProperties.individuals) {
    Object.entries(llmResponse.individuals).forEach(([id, props]) => {
      merged.individuals[id] = {
        ...merged.individuals[id],
        ...props,
      };
    });
  }

  // Merge edges
  if (llmResponse.edges && config.llmProperties.edges) {
    Object.entries(llmResponse.edges).forEach(([id, props]) => {
      // Handle special case for controlPoints
      if (props.controlPoints) {
        // Ensure edge metadata exists (LLM may reference edges not in original metadata)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!merged.edges[id]) {
          merged.edges[id] = {};
        }
        merged.edges[id] = {
          ...merged.edges[id],
          custom: {
            ...merged.edges[id].custom,
            controlPoints: props.controlPoints,
          },
        };
        // Remove controlPoints from props to avoid duplicate at top level
        const { controlPoints: _, ...otherProps } = props;
        Object.assign(merged.edges[id], otherProps);
      } else {
        // Ensure edge metadata exists (LLM may reference edges not in original metadata)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!merged.edges[id]) {
          merged.edges[id] = {};
        }
        merged.edges[id] = {
          ...merged.edges[id],
          ...props,
        };
      }
    });
  }

  // Merge global
  if (llmResponse.global && config.llmProperties.global) {
    merged.global = {
      ...merged.global,
      ...llmResponse.global,
    };
  }

  return merged;
}

/**
 * Build tree structure description for prompts
 */
export function buildTreeStructureDescription(llmData: LLMReadyData): string {
  const { graphStructure } = llmData.metadata;
  return `- Total Individuals: ${String(graphStructure.totalIndividuals)}
- Generations: ${String(graphStructure.maxGenerations)}
- Tree Complexity: ${String(graphStructure.treeComplexity)}
- Average Family Size: ${String(graphStructure.averageFamilySize)}`;
}

/**
 * Build connections description from LLM data with intelligent sampling
 */
export function buildConnectionsDescription(
  llmData: LLMReadyData,
  maxIndividuals = 12,
): string {
  const individuals = Object.entries(llmData.individuals);

  // Intelligent sampling: prioritize key nodes (roots, connectors, recent generations)
  const sampledIndividuals = individuals
    .sort(([_idA, a], [_idB, b]) => {
      // Priority scoring: root nodes (no parents) and highly connected nodes first
      const aScore =
        (a.parents.length === 0 ? 10 : 0) +
        Object.values(llmData.individuals).filter((ind) =>
          ind.parents.includes(a.id),
        ).length;
      const bScore =
        (b.parents.length === 0 ? 10 : 0) +
        Object.values(llmData.individuals).filter((ind) =>
          ind.parents.includes(b.id),
        ).length;
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
  return (
    connections +
    (totalCount > maxIndividuals
      ? `\n... (${String(totalCount - maxIndividuals)} more)`
      : '')
  );
}

/**
 * Build current state description for prompt
 */
export function buildCurrentStateDescription(
  extractedData: ExtractedData,
): string {
  const hasData = Object.values(extractedData).some(
    (category) =>
      Boolean(category) &&
      typeof category === 'object' &&
      Object.keys(category).length > 0,
  );

  if (!hasData) {
    return 'No existing data';
  }

  // Count items in each category
  const counts = Object.entries(extractedData)
    .filter(([_, value]) => Boolean(value) && typeof value === 'object')
    .map(([key, value]) => `${key}: ${String(Object.keys(value).length)}`)
    .join(', ');

  return `Existing data (${counts})`;
}

/**
 * Build temperature instructions
 */
export function getTemperatureInstructions(temperature: number): string {
  if (temperature < 0.3) {
    return `Temperature ${String(temperature)}: Apply strict mathematical rules, perfect alignment, no creative variations`;
  } else if (temperature < 0.7) {
    return `Temperature ${String(temperature)}: Balance structure with natural variation, subtle deviations for visual interest`;
  } else {
    return `Temperature ${String(temperature)}: Create organic, artistic output, prioritize visual appeal over strict rules`;
  }
}

/**
 * Build a generic prompt for any smart transformer
 */
export function buildGenericPrompt(data: GenericPromptData): string {
  let prompt = `${data.taskDescription}

Canvas: ${data.canvasInfo}
${getTemperatureInstructions(data.temperature)}

Tree Structure:
${data.treeStructure}

Key Family Connections:
${data.connections}

Current State: ${data.currentState}

${data.specificGuidance}`;

  if (data.styleInstructions) {
    prompt += `\n\n${data.styleInstructions}`;
  }

  prompt += `

Output Requirements:
1. Return ONLY the properties shown in the output format
2. Do NOT include any properties not specified in the format
3. Ensure all values are within valid ranges
4. Return valid JSON that matches this exact structure:

${data.outputFormat}`;

  return prompt;
}

/**
 * Build a prompt for any smart transformer using its config
 */
export function buildSmartTransformerPrompt(
  context: TransformerContext,
  config: SmartTransformerConfig,
): string {
  const { llmData, visualMetadata, temperature } = context;
  const canvasWidth = visualMetadata.global.canvasWidth ?? 1000;
  const canvasHeight = visualMetadata.global.canvasHeight ?? 800;

  // Extract only relevant properties for this transformer
  const extractedData = extractLLMProperties(visualMetadata, config);

  const promptData: GenericPromptData = {
    taskDescription: config.prompt.taskDescription,
    canvasInfo: `${String(canvasWidth)}x${String(canvasHeight)}`,
    temperature: temperature ?? 0.5,
    treeStructure: buildTreeStructureDescription(llmData),
    connections: buildConnectionsDescription(llmData),
    currentState: buildCurrentStateDescription(extractedData),
    outputFormat: config.prompt.outputExample,
    specificGuidance: config.prompt.getSpecificGuidance(context),
  };

  // Add style instructions if available
  if (config.prompt.getStyleInstructions && context.visual.layoutStyle) {
    promptData.styleInstructions = config.prompt.getStyleInstructions(
      String(context.visual.layoutStyle),
      context,
    );
  }

  return buildGenericPrompt(promptData);
}
