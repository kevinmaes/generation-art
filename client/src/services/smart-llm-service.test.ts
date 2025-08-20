/**
 * Tests for Smart LLM Service
 *
 * Comprehensive tests for smart LLM service functions including caching,
 * rate limiting, error handling, and transformer execution
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  generateSmartTransformerResponse,
  getProviderOptimizedPrompt,
  clearTransformerCache,
  clearAllCaches,
  getTransformerStats,
  executeSmartTransformer,
} from './smart-llm-service';
import type { SmartTransformerConfig } from '../pipeline/smart-transformer-types';

// Mock the ai module
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock the llm-service
vi.mock('./llm-service', () => ({
  llmService: {
    createCacheKey: vi.fn((prompt: string, ...params: (string | number)[]) => {
      return `cache_${prompt.substring(0, 10)}_${params.join('_')}`;
    }),
    getProviderModel: vi.fn(() => 'mock-model'),
    getProviderInfo: vi.fn(() => ({
      provider: 'openai',
      model: 'gpt-4',
    })),
    handleLLMError: vi.fn((error: Error) => ({
      message: `Handled: ${error.message}`,
    })),
  },
}));

// Import after mocking
import { generateObject } from 'ai';
import { llmService } from './llm-service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGenerateObject = generateObject as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockLLMService = llmService as any;

// Test schema
const TestSchema = z.object({
  result: z.string(),
  value: z.number(),
});

type TestResponse = z.infer<typeof TestSchema>;

// Mock config
const mockConfig: SmartTransformerConfig = {
  llmProperties: {
    individuals: { properties: ['x', 'y'] },
  },
  responseSchema: TestSchema,
  prompt: {
    taskDescription: 'Test task',
    outputExample: '{"result": "test", "value": 42}',
    getSpecificGuidance: () => 'Test guidance',
  },
};

describe('Smart LLM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set a base time
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    // Clear all caches and counters
    clearAllCaches();

    // Reset mock functions
    mockLLMService.createCacheKey.mockClear();
    mockLLMService.getProviderModel.mockClear();
    mockLLMService.getProviderInfo.mockClear();
    mockLLMService.handleLLMError.mockClear();

    // Reset default mock behavior
    mockLLMService.getProviderInfo.mockReturnValue({
      provider: 'openai',
      model: 'gpt-4',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('generateSmartTransformerResponse', () => {
    it('should successfully generate LLM response', async () => {
      const mockResponse = { result: 'success', value: 100 };
      mockGenerateObject.mockResolvedValueOnce({
        object: mockResponse,
      });

      const result = await generateSmartTransformerResponse<TestResponse>(
        'test-transformer',
        'test prompt',
        TestSchema,
        0.5,
      );

      expect(result).toEqual(mockResponse);
      expect(mockGenerateObject).toHaveBeenCalledWith({
        model: 'mock-model',
        schema: TestSchema,
        prompt: 'test prompt',
        temperature: 0.5,
      });
    });

    it('should use cached results when available', async () => {
      const mockResponse = { result: 'cached', value: 200 };
      mockGenerateObject.mockResolvedValueOnce({
        object: mockResponse,
      });

      // First call - should hit API
      const result1 = await generateSmartTransformerResponse<TestResponse>(
        'cache-transformer',
        'test prompt for caching',
        TestSchema,
        0.5,
      );

      expect(result1).toEqual(mockResponse);
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);

      // Second call with same parameters - should use cache
      const result2 = await generateSmartTransformerResponse<TestResponse>(
        'cache-transformer',
        'test prompt for caching',
        TestSchema,
        0.5,
      );

      expect(result2).toEqual(mockResponse);
      expect(mockGenerateObject).toHaveBeenCalledTimes(1); // Should not call API again
    });

    it('should handle cache expiration', async () => {
      const mockResponse1 = { result: 'first', value: 100 };
      const mockResponse2 = { result: 'second', value: 200 };

      mockGenerateObject
        .mockResolvedValueOnce({ object: mockResponse1 })
        .mockResolvedValueOnce({ object: mockResponse2 });

      // First call
      const result1 = await generateSmartTransformerResponse<TestResponse>(
        'expiry-test',
        'test expiry prompt',
        TestSchema,
      );

      expect(result1).toEqual(mockResponse1);
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);

      // Advance time beyond cache duration (5 minutes + 1 second)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Second call - cache should be expired
      const result2 = await generateSmartTransformerResponse<TestResponse>(
        'expiry-test',
        'test expiry prompt',
        TestSchema,
      );

      expect(result2).toEqual(mockResponse2);
      expect(mockGenerateObject).toHaveBeenCalledTimes(2);
    });

    it.skip('should handle rate limiting', async () => {
      const mockResponse1 = { result: 'rate-limited-1', value: 300 };
      const mockResponse2 = { result: 'rate-limited-2', value: 400 };

      mockGenerateObject
        .mockResolvedValueOnce({ object: mockResponse1 })
        .mockResolvedValueOnce({ object: mockResponse2 });

      // First call
      const result1 = await generateSmartTransformerResponse<TestResponse>(
        'rate-limit-transformer',
        'rate test prompt 1',
        TestSchema,
      );

      expect(result1).toEqual(mockResponse1);

      // Second call immediately after - should be rate limited
      const promise2 = generateSmartTransformerResponse<TestResponse>(
        'rate-limit-transformer',
        'rate test prompt 2',
        TestSchema,
      );

      // Run timers to complete the rate limit delay
      await vi.runAllTimersAsync();

      const result2 = await promise2;
      expect(result2).toEqual(mockResponse2);
      expect(mockGenerateObject).toHaveBeenCalledTimes(2);
    });

    it.skip('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      mockGenerateObject.mockRejectedValueOnce(mockError);

      await expect(
        generateSmartTransformerResponse<TestResponse>(
          'api-error-test',
          'api error prompt',
          TestSchema,
        ),
      ).rejects.toThrow('api-error-test generation failed: Handled: API Error');

      expect(mockLLMService.handleLLMError).toHaveBeenCalledWith(mockError);
    });

    it('should handle rate limit errors specifically', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockGenerateObject.mockRejectedValueOnce(rateLimitError);
      mockLLMService.handleLLMError.mockReturnValueOnce({
        message: 'rate limit exceeded',
      });

      await expect(
        generateSmartTransformerResponse<TestResponse>(
          'rate-limit-test',
          'test prompt',
          TestSchema,
        ),
      ).rejects.toThrow(
        'rate-limit-test generation failed: rate limit exceeded',
      );
    });

    it.skip('should track API call counts', async () => {
      const mockResponse1 = { result: 'counted-1', value: 400 };
      const mockResponse2 = { result: 'counted-2', value: 500 };

      mockGenerateObject
        .mockResolvedValueOnce({ object: mockResponse1 })
        .mockResolvedValueOnce({ object: mockResponse2 });

      // Make multiple calls with different prompts (to avoid cache)
      const result1 = await generateSmartTransformerResponse<TestResponse>(
        'count-transformer',
        'count prompt 1',
        TestSchema,
      );

      expect(result1).toEqual(mockResponse1);

      // Advance time for rate limiting
      vi.advanceTimersByTime(20000);

      const result2 = await generateSmartTransformerResponse<TestResponse>(
        'count-transformer',
        'count prompt 2',
        TestSchema,
      );

      expect(result2).toEqual(mockResponse2);

      const stats = getTransformerStats('count-transformer');
      expect(stats.apiCalls).toBe(2);
    });
  });

  describe('getProviderOptimizedPrompt', () => {
    const basePrompt = 'Base prompt content';

    it('should optimize for OpenAI', () => {
      mockLLMService.getProviderInfo.mockReturnValueOnce({
        provider: 'openai',
        model: 'gpt-4',
      });

      const result = getProviderOptimizedPrompt(basePrompt);

      expect(result).toContain(basePrompt);
      expect(result).toContain('valid JSON only');
      expect(result).toContain('mathematical precision');
    });

    it('should optimize for Anthropic', () => {
      mockLLMService.getProviderInfo.mockReturnValueOnce({
        provider: 'anthropic',
        model: 'claude-3',
      });

      const result = getProviderOptimizedPrompt(basePrompt);

      expect(result).toContain(basePrompt);
      expect(result).toContain('Think step by step');
      expect(result).toContain('optimal solution');
    });

    it('should use explicit provider parameter', () => {
      const result = getProviderOptimizedPrompt(basePrompt, 'openai');

      expect(result).toContain('valid JSON only');
      expect(mockLLMService.getProviderInfo).not.toHaveBeenCalled();
    });

    it('should return base prompt for unknown providers', () => {
      mockLLMService.getProviderInfo.mockReturnValueOnce({
        provider: 'unknown',
        model: 'unknown-model',
      });

      const result = getProviderOptimizedPrompt(basePrompt);
      expect(result).toBe(basePrompt);
    });
  });

  describe('clearTransformerCache', () => {
    it('should clear cache for specific transformer', async () => {
      const mockResponse = { result: 'cacheable', value: 500 };
      mockGenerateObject.mockResolvedValue({
        object: mockResponse,
      });

      // Add something to cache
      await generateSmartTransformerResponse<TestResponse>(
        'clear-test-transformer',
        'clear test prompt',
        TestSchema,
      );

      let stats = getTransformerStats('clear-test-transformer');
      expect(stats.cacheSize).toBe(1);

      // Clear cache
      clearTransformerCache('clear-test-transformer');

      stats = getTransformerStats('clear-test-transformer');
      expect(stats.cacheSize).toBe(0);
    });

    it('should not affect other transformer caches', async () => {
      const mockResponse1 = { result: 'isolated-a', value: 600 };
      const mockResponse2 = { result: 'isolated-b', value: 700 };

      mockGenerateObject
        .mockResolvedValueOnce({ object: mockResponse1 })
        .mockResolvedValueOnce({ object: mockResponse2 });

      // Add to multiple caches
      await generateSmartTransformerResponse<TestResponse>(
        'clear-transformer-a',
        'clear test prompt a',
        TestSchema,
      );

      // Wait for rate limiting
      await vi.advanceTimersByTimeAsync(20000);

      await generateSmartTransformerResponse<TestResponse>(
        'clear-transformer-b',
        'clear test prompt b',
        TestSchema,
      );

      // Clear only one cache
      clearTransformerCache('clear-transformer-a');

      const statsA = getTransformerStats('clear-transformer-a');
      const statsB = getTransformerStats('clear-transformer-b');

      expect(statsA.cacheSize).toBe(0);
      expect(statsB.cacheSize).toBe(1);
    });
  });

  describe('getTransformerStats', () => {
    it('should return correct stats for new transformer', () => {
      const stats = getTransformerStats('new-transformer');

      expect(stats).toEqual({
        apiCalls: 0,
        cacheSize: 0,
        lastApiCall: undefined,
      });
    });

    it('should track stats after API calls', async () => {
      const mockResponse = { result: 'tracked', value: 700 };
      mockGenerateObject.mockResolvedValue({
        object: mockResponse,
      });

      const beforeTime = Date.now();
      vi.setSystemTime(beforeTime);

      await generateSmartTransformerResponse<TestResponse>(
        'stats-tracker-transformer',
        'stats test prompt',
        TestSchema,
      );

      const stats = getTransformerStats('stats-tracker-transformer');

      expect(stats.apiCalls).toBe(1);
      expect(stats.cacheSize).toBe(1);
      expect(stats.lastApiCall).toBe(beforeTime);
    });
  });

  describe('executeSmartTransformer', () => {
    it('should execute transformer with optimized prompt', async () => {
      const mockResponse = { result: 'executed', value: 800 };
      mockGenerateObject.mockResolvedValue({
        object: mockResponse,
      });

      mockLLMService.getProviderInfo.mockReturnValue({
        provider: 'openai',
        model: 'gpt-4',
      });

      const result = await executeSmartTransformer<TestResponse>(
        'execute-test-transformer',
        'execute base prompt',
        mockConfig,
        0.7,
      );

      expect(result).toEqual(mockResponse);

      // Should have called generateObject with optimized prompt
      const calledArgs = mockGenerateObject.mock.calls[0][0];
      expect(calledArgs.prompt).toContain('execute base prompt');
      expect(calledArgs.prompt).toContain('valid JSON only'); // OpenAI optimization
      expect(calledArgs.temperature).toBe(0.7);
      expect(calledArgs.schema).toBe(TestSchema);
    });

    it('should use default temperature when not provided', async () => {
      const mockResponse = { result: 'default-temp', value: 900 };
      mockGenerateObject.mockResolvedValue({
        object: mockResponse,
      });

      await executeSmartTransformer<TestResponse>(
        'default-transformer',
        'test prompt',
        mockConfig,
      );

      const calledArgs = mockGenerateObject.mock.calls[0][0];
      expect(calledArgs.temperature).toBe(0.5); // Default value
    });

    it('should apply provider optimization', async () => {
      const mockResponse = { result: 'anthropic-optimized', value: 1000 };
      mockGenerateObject.mockResolvedValue({
        object: mockResponse,
      });

      mockLLMService.getProviderInfo.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-3',
      });

      await executeSmartTransformer<TestResponse>(
        'anthropic-transformer',
        'base prompt',
        mockConfig,
      );

      const calledArgs = mockGenerateObject.mock.calls[0][0];
      expect(calledArgs.prompt).toContain('Think step by step');
    });

    it('should propagate errors from generateSmartTransformerResponse', async () => {
      const mockError = new Error('Execution failed');
      mockGenerateObject.mockRejectedValue(mockError);

      await expect(
        executeSmartTransformer<TestResponse>(
          'error-transformer',
          'failing prompt',
          mockConfig,
        ),
      ).rejects.toThrow(
        'error-transformer generation failed: Handled: Execution failed',
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle complex workflow with multiple transformers', async () => {
      const mockResponse1 = { result: 'transformer1', value: 100 };
      const mockResponse2 = { result: 'transformer2', value: 200 };

      mockGenerateObject
        .mockResolvedValueOnce({ object: mockResponse1 })
        .mockResolvedValueOnce({ object: mockResponse2 });

      // Execute two different transformers
      const result1 = await executeSmartTransformer<TestResponse>(
        'transformer-1',
        'prompt 1',
        mockConfig,
        0.3,
      );

      const result2 = await executeSmartTransformer<TestResponse>(
        'transformer-2',
        'prompt 2',
        mockConfig,
        0.8,
      );

      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);

      // Check independent stats
      const stats1 = getTransformerStats('transformer-1');
      const stats2 = getTransformerStats('transformer-2');

      expect(stats1.apiCalls).toBe(1);
      expect(stats1.cacheSize).toBe(1);
      expect(stats2.apiCalls).toBe(1);
      expect(stats2.cacheSize).toBe(1);
    });

    it('should maintain cache isolation between transformers', async () => {
      const mockResponse = { result: 'isolated', value: 300 };
      mockGenerateObject.mockResolvedValue({
        object: mockResponse,
      });

      // Same prompt but different transformers
      await generateSmartTransformerResponse<TestResponse>(
        'isolated-1',
        'same prompt',
        TestSchema,
      );

      await generateSmartTransformerResponse<TestResponse>(
        'isolated-2',
        'same prompt',
        TestSchema,
      );

      // Should make separate API calls since caches are isolated
      expect(mockGenerateObject).toHaveBeenCalledTimes(2);

      // But subsequent calls to same transformer should use cache
      await generateSmartTransformerResponse<TestResponse>(
        'isolated-1',
        'same prompt',
        TestSchema,
      );

      expect(mockGenerateObject).toHaveBeenCalledTimes(2); // No additional call
    });
  });
});
