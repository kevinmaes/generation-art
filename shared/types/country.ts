/**
 * Shared country-related types used by both CLI and client
 */

/**
 * Country matching methods
 */
export type MatchMethod =
  | 'exact'
  | 'alias'
  | 'pattern'
  | 'region'
  | 'fuzzy'
  | 'historical';

/**
 * Result of country matching operation
 */
export interface MatchResult {
  iso2: string | null;
  confidence: number;
  method: MatchMethod;
  details?: {
    originalInput: string;
    matchedValue?: string;
    historicalYear?: number;
    alternativeMatches?: {
      iso2: string;
      confidence: number;
      reason: string;
    }[];
  };
}

/**
 * Country matching data structure for lookups
 */
export interface CountryMatchingData {
  canonical: string;
  iso3: string;
  aliases: string[];
  patterns: string[];
  regions?: string[];
  historicalNames?: Record<string, [number, number]>;
}

/**
 * Map of ISO2 codes to country matching data
 */
export type CountryMatchingMap = Record<string, CountryMatchingData>;

/**
 * Place with extracted country information
 */
export interface PlaceWithCountry {
  original: string;
  country?: {
    iso2: string;
    confidence: number;
    method: MatchMethod;
    matchedOn?: string;
    alternatives?: {
      iso2: string;
      confidence: number;
      reason: string;
    }[];
  };
}

/**
 * Country color information from flag data
 */
export interface CountryColorInfo {
  hex: string;
  oklch: number[];
  name: string;
  proportion: number;
}

/**
 * Complete color palette for a country's flag
 */
export interface CountryColors {
  primary: CountryColorInfo;
  secondary?: CountryColorInfo;
  tertiary?: CountryColorInfo;
  quaternary?: CountryColorInfo;
}

/**
 * Map of ISO2 codes to country colors
 */
export type CountryColorMap = Record<string, CountryColors>;

/**
 * Processing metadata for country matching operations
 */
export interface ProcessingMetadata {
  totalLocations: number;
  matched: {
    high: number; // >= 0.9
    medium: number; // 0.7-0.9
    low: number; // 0.5-0.7
    unmatched: number; // < 0.5
  };
  methods: Record<MatchMethod | 'unmatched', number>;
}

/**
 * Unresolved location that couldn't be matched to a country
 */
export interface UnresolvedLocation {
  original: string;
  individualId?: string;
  eventType?: string;
  context?: {
    year?: number;
    parentBirth?: string;
    spouseBirth?: string;
  };
  bestGuess?: {
    iso2: string;
    confidence: number;
  };
}
