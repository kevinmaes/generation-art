/**
 * Smart Transformer Types
 *
 * Defines the configuration structure for smart transformers that use LLM
 */

import type { z } from 'zod';
import type { TransformerContext } from './types';

/**
 * Configuration for properties to extract from visualMetadata for LLM processing
 */
export interface LLMPropertyConfig {
  properties: string[]; // Property names to extract
  required?: string[]; // Properties that must be present in response
}

/**
 * Smart transformer configuration that defines:
 * - What properties to send to the LLM
 * - How to validate the LLM response
 * - How to generate prompts
 */
export interface SmartTransformerConfig {
  // Properties to extract from visualMetadata for LLM
  llmProperties: {
    individuals?: LLMPropertyConfig;
    edges?: LLMPropertyConfig;
    global?: LLMPropertyConfig;
  };

  // Zod schema for validating LLM response
  responseSchema: z.ZodType<any>;

  // Transformer-specific prompt components
  prompt: {
    // Main task description for the LLM
    taskDescription: string;

    // Example of expected output format
    outputExample: string;

    // Generate transformer-specific guidance
    getSpecificGuidance: (context: TransformerContext) => string;

    // Optional: style-specific instructions
    getStyleInstructions?: (
      style: string,
      context: TransformerContext,
    ) => string;
  };

  // Optional: custom extraction/merging if default logic doesn't suffice
  customExtractor?: (metadata: TransformerContext['visualMetadata']) => any;
  customMerger?: (
    llmResponse: any,
    originalMetadata: TransformerContext['visualMetadata'],
  ) => TransformerContext['visualMetadata'];
}

/**
 * Generic prompt data structure for building prompts
 */
export interface GenericPromptData {
  taskDescription: string;
  canvasInfo: string;
  temperature: number;
  treeStructure: string;
  connections: string;
  currentState: string;
  outputFormat: string;
  specificGuidance: string;
  styleInstructions?: string;
}
