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

// Zod schema for selective layout response validation
// Only includes properties that LLM should modify for layout
const LLMLayoutResponseSchema = z.object({
  individuals: z.record(
    z.string(),
    z.object({
      x: z.number().optional(),
      y: z.number().optional(), 
      rotation: z.number().optional(),
    }).refine(data => data.x !== undefined || data.y !== undefined || data.rotation !== undefined, {
      message: "At least one layout property (x, y, or rotation) must be provided"
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

// Simple in-memory cache for layout results
const layoutCache = new Map<string, { result: LLMLayoutResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create a cache key from prompt and temperature
function createCacheKey(prompt: string, temperature: number): string {
  // Create a simple hash of the prompt + temperature
  let hash = 0;
  const input = `${prompt}_${temperature}`;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

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
  console.log(`🔧 LLM Provider configured: ${provider}`);

  switch (provider) {
    case 'openai': {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
      const modelName = (import.meta.env.VITE_OPENAI_MODEL ??
        'gpt-4o-mini') as string; // Better rate limits for development
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
// Debug: Track API call count and token usage
let apiCallCount = 0;
let totalTokensUsed = 0;
let lastTokenCount = 0;

// Track last API call time for rate limiting
let lastApiCall = 0;
const MIN_DELAY_BETWEEN_CALLS = 20000; // 20 seconds for free tier safety

export async function generateLayout(
  prompt: string,
  temperature = 0.5,
): Promise<LLMLayoutResponse> {
  console.log(`🔍 generateLayout called (API call #${++apiCallCount})`);
  
  // Check cache first
  const cacheKey = createCacheKey(prompt, temperature);
  const cached = layoutCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('🎯 Using cached layout result');
    return cached.result;
  }

  // Rate limiting for free tier
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
    const waitTime = MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
    console.log(`⏱️ Rate limiting: waiting ${Math.round(waitTime/1000)}s before API call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Improved token estimation (1 token ≈ 3.5 characters for English text)
  const estimatedInputTokens = Math.ceil(prompt.length / 3.5);
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.15); // Typical output is ~15% of input for layout tasks
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
  
  // Extract key info from prompt for logging
  const promptLines = prompt.split('\n');
  const layoutStyleLine = promptLines.find(line => line.startsWith('Layout Style:'));
  const canvasLine = promptLines.find(line => line.startsWith('Canvas:'));
  const individualsLine = promptLines.find(line => line.includes('Total Individuals:'));
  
  console.log(`🌐 Making API call to OpenAI (attempt #${apiCallCount})`);
  console.log(`📊 Cache status: ${layoutCache.size} items cached`);
  console.log(`🔑 Using model: ${getProviderInfo().model}`);
  console.log(`📏 Estimated tokens: ${estimatedTotalTokens.toLocaleString()} (${estimatedInputTokens} input + ${estimatedOutputTokens} output)`);
  console.log(`📝 Prompt summary: ${layoutStyleLine?.trim()}, ${canvasLine?.trim()}, ${individualsLine?.trim()}`);
  console.log(`🎯 Visual properties: Sending [x, y, rotation] → Expecting [x, y, rotation, edges.controlPoints?]`);
  
  lastApiCall = Date.now();
  
  try {
    const model = getProviderModel();

    const result = await generateObject({
      model,
      schema: LLMLayoutResponseSchema,
      prompt,
      temperature,
    });

    // Track token usage
    const actualTokensUsed = result.usage?.totalTokens ?? estimatedInputTokens;
    lastTokenCount = actualTokensUsed;
    totalTokensUsed += actualTokensUsed;
    
    console.log(`✅ API call completed`);
    // Calculate cost using proper gpt-4o-mini pricing  
    const inputTokens = result.usage?.promptTokens ?? estimatedInputTokens;
    const outputTokens = result.usage?.completionTokens ?? (actualTokensUsed - inputTokens);
    const inputCost = inputTokens * 0.00000015; // $0.150 per 1M input tokens
    const outputCost = outputTokens * 0.0000006; // $0.600 per 1M output tokens
    const totalCost = inputCost + outputCost;
    
    const estimationAccuracy = Math.round((estimatedTotalTokens / actualTokensUsed) * 100);
    console.log(`📊 Tokens used this call: ${actualTokensUsed.toLocaleString()} (${inputTokens} input + ${outputTokens} output)`);
    console.log(`📊 Estimation accuracy: ${estimatedTotalTokens.toLocaleString()} estimated vs ${actualTokensUsed.toLocaleString()} actual (${estimationAccuracy}%)`);
    console.log(`📊 Total tokens used: ${totalTokensUsed.toLocaleString()}`);
    console.log(`💰 Estimated cost this call: $${totalCost.toFixed(4)} (gpt-4o-mini pricing)`);

    // Cache the result
    layoutCache.set(cacheKey, {
      result: result.object,
      timestamp: now,
    });

    return result.object;
  } catch (error) {
    console.error('LLM layout generation failed:', error);
    
    // Check for network/fetch issues
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      const provider = getProviderInfo().provider;
      if (provider === 'anthropic') {
        throw new Error(
          'Network error connecting to Anthropic. Check your VITE_ANTHROPIC_API_KEY and internet connection.',
        );
      } else {
        throw new Error(
          'Network error connecting to OpenAI. Check your VITE_OPENAI_API_KEY and internet connection.',
        );
      }
    }
    
    // Check for rate limiting
    if (error instanceof Error && error.message.includes('429')) {
      console.warn('⚠️ OpenAI Rate Limit Hit! Solutions:');
      console.warn('1. 💳 Add payment method for Tier 1 (500 req/min): https://platform.openai.com/settings/organization/billing/overview');
      console.warn('2. ⏰ Wait 60+ seconds (free tier: 3 requests/minute)'); 
      console.warn('3. 🔄 Use caching (reload page to test cached results)');
      console.warn('4. 🎨 Use algorithmic fallback temporarily');
      
      // Add helpful timing info
      const timeSinceLastCall = Date.now() - lastApiCall;
      console.warn(`⏱️ Time since last call: ${Math.round(timeSinceLastCall/1000)}s`);
      
      throw new Error(
        'OpenAI rate limit hit. Free tier: 3 requests/minute. Add payment method for higher limits.',
      );
    }
    
    // Check for API key issues
    if (error instanceof Error && error.message.includes('401')) {
      throw new Error(
        'API authentication failed. Please check your API key configuration.',
      );
    }
    
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
      ? ((import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini') as string) // Better rate limits for development
      : ((import.meta.env.VITE_ANTHROPIC_MODEL ??
          'claude-3-5-haiku-20241022') as string); // Fast and creative

  return {
    provider,
    model: modelName,
    maxTokens: parseInt(maxTokens),
    totalTokensUsed,
    lastTokenCount,
    callCount: apiCallCount,
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