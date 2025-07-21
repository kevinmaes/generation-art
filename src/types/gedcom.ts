/**
 * Shared GEDCOM types used across the application
 * These types represent the core data structures for GEDCOM parsing and processing
 */

/**
 * Base individual type - used across parsing, augmentation, and metadata
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
 * Augmented individual with additional computed fields
 */
export interface AugmentedIndividual extends Individual {
  generation?: number | null;
  relativeGenerationValue?: number;
}
