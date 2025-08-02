/**
 * LLM Layout Service
 *
 * Provides AI-powered layout generation using the Vercel AI SDK
 * with support for multiple providers (OpenAI, Anthropic, etc.)
 */

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Zod schema for response validation
const LLMLayoutResponseSchema = z.object({
  individuals: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
      layer: z.number().optional(),
      rotation: z.number().optional(),
    }),
  ),
  edges: z
    .record(
      z.string(),
      z.object({
        controlPoints: z
          .array(
            z.object({
              x: z.number(),
              y: z.number(),
            }),
          )
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

export type LLMLayoutResponse = z.infer<typeof LLMLayoutResponseSchema>;

interface LLMValidationResult {
  valid: boolean;
  missing: string[];
  provider?: string;
}

/**
 * Get the configured LLM model based on environment variables
 */
function getProviderModel() {
  const provider = (import.meta.env.VITE_LLM_PROVIDER ?? 'openai') as string;

  switch (provider) {
    case 'openai': {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
      const modelName = (import.meta.env.VITE_OPENAI_MODEL ??
        'gpt-4') as string;
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }
      const openaiClient = createOpenAI({ apiKey });
      return openaiClient(modelName);
    }
    case 'anthropic': {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
      const modelName = (import.meta.env.VITE_ANTHROPIC_MODEL ??
        'claude-3-5-sonnet-20241022') as string;
      if (!apiKey) {
        throw new Error('Anthropic API key not found');
      }
      const anthropicClient = createAnthropic({ apiKey });
      return anthropicClient(modelName);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Generate a layout using the configured LLM provider
 */
export async function generateLayout(
  prompt: string,
  temperature = 0.5,
): Promise<LLMLayoutResponse> {
  try {
    const model = getProviderModel();

    const result = await generateObject({
      model,
      schema: LLMLayoutResponseSchema,
      prompt,
      temperature,
    });

    return result.object;
  } catch (error) {
    console.error('LLM layout generation failed:', error);
    throw new Error(
      `Layout generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Validate that required API keys are present for the configured provider
 */
export function validateApiKeys(): LLMValidationResult {
  const provider = (import.meta.env.VITE_LLM_PROVIDER ?? 'openai') as string;
  const missing: string[] = [];

  switch (provider) {
    case 'openai':
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        missing.push('VITE_OPENAI_API_KEY');
      }
      break;
    case 'anthropic':
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        missing.push('VITE_ANTHROPIC_API_KEY');
      }
      break;
    default:
      missing.push(`Unknown provider: ${provider}`);
  }

  return {
    valid: missing.length === 0,
    missing,
    provider,
  };
}

/**
 * Get information about the configured LLM provider and model
 */
export function getProviderInfo() {
  const provider = (import.meta.env.VITE_LLM_PROVIDER ?? 'openai') as string;
  const maxTokens = (import.meta.env.VITE_LLM_MAX_TOKENS ?? '2000') as string;

  const modelName =
    provider === 'openai'
      ? ((import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4') as string)
      : ((import.meta.env.VITE_ANTHROPIC_MODEL ??
          'claude-3-5-sonnet-20241022') as string);

  return {
    provider,
    model: modelName,
    maxTokens: parseInt(maxTokens),
  };
}

// Export grouped namespace for convenience while keeping individual exports
export const llmLayoutService = {
  generateLayout,
  validateApiKeys,
  getProviderInfo,
};

// Export schema for external validation
export { LLMLayoutResponseSchema };