/**
 * Shared GEDCOM types used across the application
 * These types represent the core data structures for GEDCOM parsing and processing
 */

/**
 * Base individual type - contains only raw GEDCOM data
 * All properties are directly extracted from GEDCOM tags
 */
export interface Individual {
  id: string;
  name: string;
  birth?: { date?: string; place?: string };
  death?: { date?: string; place?: string };
  parents: string[];
  spouses: string[];
  children: string[];
  siblings: string[];
}

/**
 * Base family type - used across parsing, augmentation, and metadata
 */
export interface Family {
  id: string;
  husband?: Individual;
  wife?: Individual;
  children: Individual[];
}

/**
 * Base GEDCOM data structure
 */
export interface GedcomData {
  individuals: Individual[];
  families: Family[];
}

/**
 * Augmented individual with metadata
 * Extends Individual with a metadata property containing all computed/transformed data
 * The metadata property contains no PII and is safe for external systems like LLMs
 */
export interface AugmentedIndividual extends Individual {
  metadata: IndividualMetadata;
}

/**
 * Individual metadata - contains only non-PII computed/transformed data
 * Safe for external systems like LLMs
 */
export interface IndividualMetadata {
  lifespan?: number;
  isAlive?: boolean;
  birthMonth?: number;
  zodiacSign?: string;
  generation?: number | null;
  relativeGenerationValue?: number;
}
