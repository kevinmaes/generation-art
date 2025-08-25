export type MatchMethod =
  | 'exact'
  | 'alias'
  | 'pattern'
  | 'region'
  | 'fuzzy'
  | 'historical';

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

export interface CountryMatchingData {
  canonical: string;
  iso3: string;
  aliases: string[];
  patterns: string[];
  regions?: string[];
  historicalNames?: Record<string, [number, number]>;
}

export type CountryMatchingMap = Record<string, CountryMatchingData>;

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
