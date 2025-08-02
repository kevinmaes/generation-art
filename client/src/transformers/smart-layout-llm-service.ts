/**
 * LLM Layout Service
 *
 * Provides AI-powered layout generation using the Vercel AI SDK
 * with support for multiple providers (OpenAI, Anthropic, etc.)
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { llmService } from '../services/llm-service';

// Zod schema for selective layout response validation
// Only includes properties that LLM should modify for layout
const LLMLayoutResponseSchema = z.object({
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
        {
          message:
            'At least one layout property (x, y, or rotation) must be provided',
        },
      ),
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
const layoutCache = new Map<
  string,
  { result: LLMLayoutResponse; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

/**
 * Primary function for this service
 * Generates a layout based on the provided prompt and temperature.
 * Uses caching to avoid redundant API calls.
 * Handles rate limiting and token estimation for cost tracking.
 * @param prompt
 * @param temperature
 * @returns
 */
export async function generateLayout(
  prompt: string,
  temperature = 0.5,
): Promise<LLMLayoutResponse> {
  console.log(`🔍 generateLayout called (API call #${String(++apiCallCount)})`);

  // Check cache first
  const cacheKey = llmService.createCacheKey(prompt, temperature);
  const cached = layoutCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log('🎯 Using cached layout result');
    return cached.result;
  }

  // Rate limiting for free tier
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
    const waitTime = MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
    console.log(
      `⏱️ Rate limiting: waiting ${String(Math.round(waitTime / 1000))}s before API call`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  // Improved token estimation (1 token ≈ 3.5 characters for English text)
  const estimatedInputTokens = Math.ceil(prompt.length / 3.5);
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.15); // Typical output is ~15% of input for layout tasks
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

  // Extract key info from prompt for logging
  const promptLines = prompt.split('\n');
  const layoutStyleLine = promptLines.find((line) =>
    line.startsWith('Layout Style:'),
  );
  const canvasLine = promptLines.find((line) => line.startsWith('Canvas:'));
  const individualsLine = promptLines.find((line) =>
    line.includes('Total Individuals:'),
  );

  console.log(
    `🌐 Making API call to OpenAI (attempt #${String(apiCallCount)})`,
  );
  console.log(`📊 Cache status: ${String(layoutCache.size)} items cached`);
  console.log(`🔑 Using model: ${llmService.getProviderInfo().model}`);
  console.log(
    `📏 Estimated tokens: ${estimatedTotalTokens.toLocaleString()} (${String(estimatedInputTokens)} input + ${String(estimatedOutputTokens)} output)`,
  );
  console.log(
    `📝 Prompt summary: ${layoutStyleLine?.trim() ?? 'N/A'}, ${canvasLine?.trim() ?? 'N/A'}, ${individualsLine?.trim() ?? 'N/A'}`,
  );
  console.log(
    `🎯 Visual properties: Sending [x, y, rotation] → Expecting [x, y, rotation, edges.controlPoints?]`,
  );

  lastApiCall = Date.now();

  try {
    const model = llmService.getProviderModel();

    const result = await generateObject({
      model,
      schema: LLMLayoutResponseSchema,
      prompt,
      temperature,
    });

    // Track token usage
    const actualTokensUsed = result.usage?.totalTokens ?? estimatedTotalTokens;
    lastTokenCount = actualTokensUsed;
    totalTokensUsed += actualTokensUsed;

    console.log(`✅ API call completed`);
    // Calculate cost using proper gpt-4o-mini pricing
    const inputTokens = estimatedInputTokens; // Vercel AI SDK doesn't provide separate token counts
    const outputTokens = actualTokensUsed - inputTokens;
    const inputCost = inputTokens * 0.00000015; // $0.150 per 1M input tokens
    const outputCost = outputTokens * 0.0000006; // $0.600 per 1M output tokens
    const totalCost = inputCost + outputCost;

    const estimationAccuracy = Math.round(
      (estimatedTotalTokens / actualTokensUsed) * 100,
    );
    console.log(
      `📊 Tokens used this call: ${actualTokensUsed.toLocaleString()} (${String(inputTokens)} input + ${String(outputTokens)} output)`,
    );
    console.log(
      `📊 Estimation accuracy: ${estimatedTotalTokens.toLocaleString()} estimated vs ${actualTokensUsed.toLocaleString()} actual (${String(estimationAccuracy)}%)`,
    );
    console.log(`📊 Total tokens used: ${totalTokensUsed.toLocaleString()}`);
    console.log(
      `💰 Estimated cost this call: $${totalCost.toFixed(4)} (gpt-4o-mini pricing)`,
    );

    // Cache the result
    layoutCache.set(cacheKey, {
      result: result.object,
      timestamp: now,
    });

    return result.object;
  } catch (error) {
    console.error('LLM layout generation failed:', error);

    // Use generic error handling
    const handledError = llmService.handleLLMError(error);

    // Add layout-specific context for rate limiting
    if (handledError.message.includes('rate limit')) {
      console.warn('⚠️ Rate Limit Hit! Solutions:');
      console.warn('1. 💳 Add payment method for higher limits');
      console.warn('2. ⏰ Wait before retrying');
      console.warn('3. 🔄 Use caching (reload page to test cached results)');
      console.warn('4. 🎨 Use algorithmic fallback temporarily');

      // Add helpful timing info
      const timeSinceLastCall = Date.now() - lastApiCall;
      console.warn(
        `⏱️ Time since last call: ${String(Math.round(timeSinceLastCall / 1000))}s`,
      );
    }

    throw new Error(`Layout generation failed: ${handledError.message}`);
  }
}

/**
 * Get layout-specific provider info including token usage
 */
export function getLayoutProviderInfo() {
  const baseInfo = llmService.getProviderInfo();
  return {
    ...baseInfo,
    totalTokensUsed,
    lastTokenCount,
    callCount: apiCallCount,
  };
}

// Export grouped namespace for convenience while keeping individual exports
export const llmLayoutService = {
  generateLayout,
  validateApiKeys: llmService.validateApiKeys,
  getProviderInfo: getLayoutProviderInfo,
};

// Export schema for external validation
export { LLMLayoutResponseSchema };
