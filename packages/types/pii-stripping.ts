import type {
  GedcomDataWithMetadata,
  AugmentedIndividual,
  FamilyWithMetadata,
} from './index';

/**
 * Anonymized individual data with PII stripped
 * Derived from AugmentedIndividual by:
 * - Omit name (will be replaced with anonymous identifier)
 * - Omit birth.place and death.place (location data)
 * - Omit birth.date and death.date (replaced with year-only)
 * - Add birth.year and death.year for year-only data
 */
export interface AnonymizedIndividual
  extends Omit<AugmentedIndividual, 'name' | 'birth' | 'death'> {
  name: string; // Anonymized: "Individual_I1" or "Person_2_3"
  birth?: {
    year?: number; // Only year, no month/day
  };
  death?: {
    year?: number; // Only year, no month/day
  };
}

/**
 * Anonymized family data with PII stripped
 * Derived from FamilyWithMetadata by using AnonymizedIndividual for members
 */
export interface AnonymizedFamily
  extends Omit<FamilyWithMetadata, 'husband' | 'wife' | 'children'> {
  husband?: AnonymizedIndividual;
  wife?: AnonymizedIndividual;
  children: AnonymizedIndividual[];
}

/**
 * Complete anonymized GEDCOM data structure
 * Derived from GedcomDataWithMetadata by using AnonymizedIndividual and AnonymizedFamily
 */
export interface AnonymizedGedcomData
  extends Omit<GedcomDataWithMetadata, 'individuals' | 'families'> {
  individuals: Record<string, AnonymizedIndividual>;
  families: Record<string, AnonymizedFamily>;
}

/**
 * Configuration for PII stripping behavior
 */
export interface PIIStrippingConfig {
  /** Replace names with this pattern */
  namePattern?: 'individual_id' | 'person_generation_index';
  /** Whether to keep birth/death years */
  keepYears?: boolean;
  /** Whether to normalize lifespan values */
  normalizeLifespan?: boolean;
  /** Whether to strip all location data */
  stripLocations?: boolean;
}

/**
 * Result of PII stripping operation
 */
export interface PIIStrippingResult {
  /** The anonymized data */
  anonymizedData: AnonymizedGedcomData;
  /** Statistics about what was stripped */
  strippingStats: {
    namesStripped: number;
    datesStripped: number;
    locationsStripped: number;
    individualsProcessed: number;
    familiesProcessed: number;
  };
  /** Any warnings or issues encountered */
  warnings: string[];
}
