/**
 * Tests for Generic LLM Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getProviderModel,
  validateApiKeys,
  getProviderInfo,
  createCacheKey,
  handleLLMError,
  llmService,
} from './llm-service';

// Mock the AI SDK modules
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockReturnValue((model: string) => ({
    modelId: model,
    provider: 'openai',
  })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn().mockReturnValue((model: string) => ({
    modelId: model,
    provider: 'anthropic',
  })),
}));

describe('LLM Service', () => {
  // Store original env values
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Reset env before each test
    Object.assign(import.meta.env, originalEnv);
  });

  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('getProviderModel', () => {
    it('should return OpenAI model when provider is openai', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
      import.meta.env.VITE_OPENAI_API_KEY = 'test-key';
      import.meta.env.VITE_OPENAI_MODEL = 'gpt-4';

      const model = getProviderModel();
      expect(model).toEqual({
        modelId: 'gpt-4',
        provider: 'openai',
      });
    });

    it('should use default OpenAI model when not specified', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
      import.meta.env.VITE_OPENAI_API_KEY = 'test-key';
      delete import.meta.env.VITE_OPENAI_MODEL;

      const model = getProviderModel();
      expect(model).toEqual({
        modelId: 'gpt-4o-mini',
        provider: 'openai',
      });
    });

    it('should return Anthropic model when provider is anthropic', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'anthropic';
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-key';
      import.meta.env.VITE_ANTHROPIC_MODEL = 'claude-3-opus';

      const model = getProviderModel();
      expect(model).toEqual({
        modelId: 'claude-3-opus',
        provider: 'anthropic',
      });
    });

    it('should throw error when OpenAI API key is missing', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
      delete import.meta.env.VITE_OPENAI_API_KEY;

      expect(() => getProviderModel()).toThrow('OpenAI API key not found');
    });

    it('should throw error when Anthropic API key is missing', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'anthropic';
      delete import.meta.env.VITE_ANTHROPIC_API_KEY;

      expect(() => getProviderModel()).toThrow('Anthropic API key not found');
    });

    it('should throw error for unsupported provider', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'unsupported';

      expect(() => getProviderModel()).toThrow(
        'Unsupported LLM provider: unsupported',
      );
    });

    it('should default to openai when provider not specified', () => {
      delete import.meta.env.VITE_LLM_PROVIDER;
      import.meta.env.VITE_OPENAI_API_KEY = 'test-key';

      const model = getProviderModel();
      expect(model.provider).toBe('openai');
    });
  });

  describe('validateApiKeys', () => {
    it('should return valid for OpenAI with API key', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
      import.meta.env.VITE_OPENAI_API_KEY = 'test-key';

      const result = validateApiKeys();
      expect(result).toEqual({
        valid: true,
        missing: [],
        provider: 'openai',
      });
    });

    it('should return missing keys for OpenAI without API key', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
      delete import.meta.env.VITE_OPENAI_API_KEY;

      const result = validateApiKeys();
      expect(result).toEqual({
        valid: false,
        missing: ['VITE_OPENAI_API_KEY'],
        provider: 'openai',
      });
    });

    it('should return valid for Anthropic with API key', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'anthropic';
      import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-key';

      const result = validateApiKeys();
      expect(result).toEqual({
        valid: true,
        missing: [],
        provider: 'anthropic',
      });
    });

    it('should return missing keys for Anthropic without API key', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'anthropic';
      delete import.meta.env.VITE_ANTHROPIC_API_KEY;

      const result = validateApiKeys();
      expect(result).toEqual({
        valid: false,
        missing: ['VITE_ANTHROPIC_API_KEY'],
        provider: 'anthropic',
      });
    });

    it('should handle unknown provider', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'unknown';

      const result = validateApiKeys();
      expect(result).toEqual({
        valid: false,
        missing: ['Unknown provider: unknown'],
        provider: 'unknown',
      });
    });
  });

  describe('getProviderInfo', () => {
    it('should return OpenAI provider info', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
      import.meta.env.VITE_OPENAI_MODEL = 'gpt-4';
      import.meta.env.VITE_LLM_MAX_TOKENS = '3000';

      const info = getProviderInfo();
      expect(info).toEqual({
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 3000,
      });
    });

    it('should return Anthropic provider info', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'anthropic';
      import.meta.env.VITE_ANTHROPIC_MODEL = 'claude-3-opus';
      import.meta.env.VITE_LLM_MAX_TOKENS = '4000';

      const info = getProviderInfo();
      expect(info).toEqual({
        provider: 'anthropic',
        model: 'claude-3-opus',
        maxTokens: 4000,
      });
    });

    it('should use default values when not specified', () => {
      delete import.meta.env.VITE_LLM_PROVIDER;
      delete import.meta.env.VITE_OPENAI_MODEL;
      delete import.meta.env.VITE_LLM_MAX_TOKENS;

      const info = getProviderInfo();
      expect(info).toEqual({
        provider: 'openai',
        model: 'gpt-4o-mini',
        maxTokens: 2000,
      });
    });
  });

  describe('createCacheKey', () => {
    it('should create consistent hash for same inputs', () => {
      const key1 = createCacheKey('test prompt', 0.5);
      const key2 = createCacheKey('test prompt', 0.5);
      expect(key1).toBe(key2);
    });

    it('should create different hash for different prompts', () => {
      const key1 = createCacheKey('prompt 1', 0.5);
      const key2 = createCacheKey('prompt 2', 0.5);
      expect(key1).not.toBe(key2);
    });

    it('should create different hash for different parameters', () => {
      const key1 = createCacheKey('test prompt', 0.5);
      const key2 = createCacheKey('test prompt', 0.7);
      expect(key1).not.toBe(key2);
    });

    it('should handle multiple parameters', () => {
      const key1 = createCacheKey('prompt', 0.5, 'param1', 100);
      const key2 = createCacheKey('prompt', 0.5, 'param1', 100);
      const key3 = createCacheKey('prompt', 0.5, 'param1', 200);

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should handle empty parameters', () => {
      const key1 = createCacheKey('prompt');
      const key2 = createCacheKey('prompt');
      expect(key1).toBe(key2);
    });

    it('should convert all parameters to strings', () => {
      const key1 = createCacheKey('prompt', 123, 'true', 'null');
      const key2 = createCacheKey('prompt', '123', 'true', 'null');
      expect(key1).toBe(key2);
    });
  });

  describe('handleLLMError', () => {
    beforeEach(() => {
      import.meta.env.VITE_LLM_PROVIDER = 'openai';
    });

    it('should handle network/fetch errors for OpenAI', () => {
      const error = new Error('Failed to fetch from API');
      const result = handleLLMError(error);
      expect(result.message).toBe(
        'Network error connecting to OpenAI. Check your API key and internet connection.',
      );
    });

    it('should handle network/fetch errors for Anthropic', () => {
      import.meta.env.VITE_LLM_PROVIDER = 'anthropic';
      const error = new Error('Failed to fetch from API');
      const result = handleLLMError(error);
      expect(result.message).toBe(
        'Network error connecting to Anthropic. Check your API key and internet connection.',
      );
    });

    it('should handle rate limit errors', () => {
      const error = new Error('429 Too Many Requests');
      const result = handleLLMError(error);
      expect(result.message).toBe(
        'API rate limit hit. For OpenAI free tier: wait 60+ seconds (3 requests/minute) or add payment method for higher limits.',
      );
    });

    it('should handle authentication errors', () => {
      const error = new Error('401 Unauthorized');
      const result = handleLLMError(error);
      expect(result.message).toBe(
        'API authentication failed. Please check your API key configuration.',
      );
    });

    it('should return original error for unknown errors', () => {
      const error = new Error('Some other error');
      const result = handleLLMError(error);
      expect(result).toBe(error);
    });

    it('should handle non-Error objects', () => {
      const result = handleLLMError('string error');
      expect(result.message).toBe('Unknown LLM error occurred');
    });

    it('should handle null/undefined', () => {
      const result = handleLLMError(null);
      expect(result.message).toBe('Unknown LLM error occurred');
    });
  });

  describe('llmService namespace', () => {
    it('should export all functions', () => {
      expect(llmService.getProviderModel).toBe(getProviderModel);
      expect(llmService.validateApiKeys).toBe(validateApiKeys);
      expect(llmService.getProviderInfo).toBe(getProviderInfo);
      expect(llmService.createCacheKey).toBe(createCacheKey);
      expect(llmService.handleLLMError).toBe(handleLLMError);
    });
  });
});
