/**
 * Smart LLM Service
 *
 * Generic LLM operations for smart transformers
 * Handles prompt generation, API calls, caching, and response validation
 */

import { generateObject } from 'ai';
import type { z } from 'zod';
import { llmService } from './llm-service';
import type { SmartTransformerConfig } from '../pipeline/smart-transformer-types';

interface CacheEntry {
  result: unknown;
  timestamp: number;
}

// Generic cache for any smart transformer results
const transformerCaches = new Map<string, Map<string, CacheEntry>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track API calls per transformer
const apiCallCounts = new Map<string, number>();
const lastApiCalls = new Map<string, number>();
const MIN_DELAY_BETWEEN_CALLS = 20000; // 20 seconds for free tier safety

/**
 * Get or create cache for a specific transformer
 */
function getTransformerCache(transformerId: string): Map<string, CacheEntry> {
  if (!transformerCaches.has(transformerId)) {
    transformerCaches.set(transformerId, new Map());
  }
  const cache = transformerCaches.get(transformerId);
  if (!cache) {
    throw new Error(`Cache not found for transformer: ${transformerId}`);
  }
  return cache;
}

/**
 * Generate LLM response for any smart transformer
 * Handles caching, rate limiting, and error handling
 */
export async function generateSmartTransformerResponse<T>(
  transformerId: string,
  prompt: string,
  schema: z.ZodType<T>,
  temperature = 0.5,
): Promise<T> {
  // Update call count
  const callCount = (apiCallCounts.get(transformerId) ?? 0) + 1;
  apiCallCounts.set(transformerId, callCount);

  console.log(
    `🔍 ${transformerId} LLM called (API call #${String(callCount)})`,
  );

  // Check cache first
  const cache = getTransformerCache(transformerId);
  const cacheKey = llmService.createCacheKey(prompt, temperature);
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`🎯 Using cached ${transformerId} result`);
    return cached.result as T;
  }

  // Rate limiting
  const lastCall = lastApiCalls.get(transformerId) ?? 0;
  const timeSinceLastCall = now - lastCall;
  if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
    const waitTime = MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
    console.log(
      `⏱️ Rate limiting ${transformerId}: waiting ${String(Math.round(waitTime / 1000))}s`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  // Extract key info from prompt for logging
  const promptLines = prompt.split('\n');
  const canvasLine = promptLines.find((line) => line.startsWith('Canvas:'));
  const taskLine = promptLines.find((line) => line.trim().length > 0);

  console.log(`🌐 Making API call for ${transformerId}`);
  console.log(`📊 Cache status: ${String(cache.size)} items cached`);
  console.log(`🔑 Using model: ${llmService.getProviderInfo().model}`);
  console.log(`📝 Task: ${taskLine?.trim() ?? 'N/A'}`);
  console.log(`📐 ${canvasLine?.trim() ?? 'N/A'}`);

  lastApiCalls.set(transformerId, Date.now());

  try {
    const model = llmService.getProviderModel();

    // Type assertion needed due to AI SDK's complex generic constraints
    const result = await generateObject({
      model,
      schema: schema as z.ZodType,
      prompt,
      temperature,
    } as Parameters<typeof generateObject>[0]);

    console.log(`✅ ${transformerId} API call completed`);

    // Cache the result
    cache.set(cacheKey, {
      result: result.object,
      timestamp: now,
    });

    // Safe type assertion since schema validates the response
    return result.object as T;
  } catch (error) {
    console.error(`${transformerId} LLM generation failed:`, error);

    // Use generic error handling
    const handledError = llmService.handleLLMError(error);

    // Add transformer-specific context for rate limiting
    if (handledError.message.includes('rate limit')) {
      console.warn(`⚠️ Rate limit hit for ${transformerId}`);
      console.warn('Consider using caching or reducing request frequency');
    }

    throw new Error(
      `${transformerId} generation failed: ${handledError.message}`,
    );
  }
}

/**
 * Optimize prompt for specific LLM providers
 */
export function getProviderOptimizedPrompt(
  basePrompt: string,
  provider?: string,
): string {
  const actualProvider = provider ?? llmService.getProviderInfo().provider;

  switch (actualProvider) {
    case 'openai':
      return `${basePrompt}

Please respond with valid JSON only. Use precise calculations and exact values. Focus on mathematical precision.`;

    case 'anthropic':
      return `${basePrompt}

Think step by step about the optimal solution, considering all the requirements and constraints, then provide the JSON response with your calculated values.`;

    default:
      return basePrompt;
  }
}

/**
 * Clear cache for a specific transformer
 */
export function clearTransformerCache(transformerId: string): void {
  const cache = getTransformerCache(transformerId);
  cache.clear();
  console.log(`🗑️ Cleared cache for ${transformerId}`);
}

/**
 * Clear all caches and reset counters (for testing)
 */
export function clearAllCaches(): void {
  transformerCaches.clear();
  apiCallCounts.clear();
  lastApiCalls.clear();
}

/**
 * Get statistics for a transformer
 */
export function getTransformerStats(transformerId: string) {
  const cache = getTransformerCache(transformerId);
  return {
    apiCalls: apiCallCounts.get(transformerId) ?? 0,
    cacheSize: cache.size,
    lastApiCall: lastApiCalls.get(transformerId),
  };
}

/**
 * Execute a smart transformer with its config
 * This is the main entry point for smart transformers
 */
export async function executeSmartTransformer<T>(
  transformerId: string,
  prompt: string,
  config: SmartTransformerConfig,
  temperature = 0.5,
): Promise<T> {
  // Add provider optimization to the prompt
  const optimizedPrompt = getProviderOptimizedPrompt(prompt);

  // Generate and validate response
  return generateSmartTransformerResponse<T>(
    transformerId,
    optimizedPrompt,
    config.responseSchema as z.ZodType<T>,
    temperature,
  );
}
