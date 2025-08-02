/**
 * Generic LLM Service
 *
 * Provides common LLM functionality that can be reused across different transformers
 * Supports multiple providers (OpenAI, Anthropic, etc.) via Vercel AI SDK
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export interface LLMValidationResult {
  valid: boolean;
  missing: string[];
  provider?: string;
}

export interface LLMProviderInfo {
  provider: string;
  model: string;
  maxTokens: number;
}

/**
 * Get the configured LLM model based on environment variables
 * This is a generic function that can be used by any transformer
 */
export function getProviderModel() {
  const provider = (import.meta.env.VITE_LLM_PROVIDER ?? 'openai') as string;
  console.log(`🔧 LLM Provider configured: ${provider}`);

  switch (provider) {
    case 'openai': {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
      const modelName = (import.meta.env.VITE_OPENAI_MODEL ??
        'gpt-4o-mini') as string;
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
 * Validate that required API keys are present for the configured provider
 * This is useful for any transformer that needs to check LLM availability
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
 * This can be used by any transformer to display provider info
 */
export function getProviderInfo(): LLMProviderInfo {
  const provider = (import.meta.env.VITE_LLM_PROVIDER ?? 'openai') as string;
  const maxTokens = (import.meta.env.VITE_LLM_MAX_TOKENS ?? '2000') as string;

  const modelName =
    provider === 'openai'
      ? ((import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini') as string)
      : ((import.meta.env.VITE_ANTHROPIC_MODEL ??
          'claude-3-5-haiku-20241022') as string);

  return {
    provider,
    model: modelName,
    maxTokens: parseInt(maxTokens),
  };
}

/**
 * Create a cache key from prompt and optional parameters
 * This generic function can be used by any transformer that needs caching
 */
export function createCacheKey(
  prompt: string,
  ...params: (string | number)[]
): string {
  // Create a simple hash of the prompt + parameters
  let hash = 0;
  const input = [prompt, ...params.map(String)].join('_');
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Helper function to handle common LLM errors
 * Can be used by any transformer to provide consistent error messages
 */
export function handleLLMError(error: unknown): Error {
  if (error instanceof Error) {
    // Network/fetch issues
    if (error.message.includes('Failed to fetch')) {
      const provider = getProviderInfo().provider;
      return new Error(
        `Network error connecting to ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}. Check your API key and internet connection.`,
      );
    }

    // Rate limiting
    if (error.message.includes('429')) {
      return new Error(
        'API rate limit hit. For OpenAI free tier: wait 60+ seconds (3 requests/minute) or add payment method for higher limits.',
      );
    }

    // Authentication issues
    if (error.message.includes('401')) {
      return new Error(
        'API authentication failed. Please check your API key configuration.',
      );
    }

    return error;
  }

  return new Error('Unknown LLM error occurred');
}

// Export grouped namespace for convenience
export const llmService = {
  getProviderModel,
  validateApiKeys,
  getProviderInfo,
  createCacheKey,
  handleLLMError,
};
