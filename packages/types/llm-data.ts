import type { GedcomDataWithMetadata, TreeMetadata } from './index';
import type { AnonymizedIndividual, AnonymizedFamily } from './pii-stripping';

/**
 * LLM-ready data structure containing anonymized individuals/families
 * and safe aggregate metadata for LLM consumption
 */
export interface LLMReadyData {
  /** Anonymized individual data with PII stripped */
  individuals: Record<string, AnonymizedIndividual>;

  /** Anonymized family data with PII stripped */
  families: Record<string, AnonymizedFamily>;

  /** Safe aggregate metadata (no individual PII) */
  metadata: TreeMetadata;
}

/**
 * Complete GEDCOM data with both full and LLM-ready versions
 * CLI generates this dual structure for optimal transformer performance
 */
export interface GedcomDataWithLLMOptimization {
  /** Full data for local transformer operations */
  full: GedcomDataWithMetadata;

  /** Pre-formatted data ready for LLM calls */
  llm: LLMReadyData;
}

/**
 * Statistics about CLI processing including PII stripping
 */
export interface CLIProcessingStats {
  /** Number of individuals processed */
  individualsProcessed: number;

  /** Number of families processed */
  familiesProcessed: number;

  /** PII stripping statistics */
  piiStrippingStats: {
    namesStripped: number;
    datesStripped: number;
    locationsStripped: number;
    individualsProcessed: number;
    familiesProcessed: number;
    warnings: string[];
  };

  /** Total processing time in milliseconds */
  processingTime: number;

  /** Memory usage statistics */
  memoryUsage: {
    fullDataSize: number; // bytes
    llmDataSize: number; // bytes
    totalSize: number; // bytes
  };
}

/**
 * Complete result from CLI processing
 */
export interface CLIProcessingResult {
  /** Full data with metadata for local operations */
  full: GedcomDataWithMetadata;

  /** LLM-ready data with PII stripped */
  llm: LLMReadyData;

  /** Processing statistics and performance metrics */
  stats: CLIProcessingStats;
}
