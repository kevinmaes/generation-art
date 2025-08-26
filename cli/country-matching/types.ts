/**
 * Re-export shared country types for backward compatibility
 */
export type {
  MatchMethod,
  MatchResult,
  CountryMatchingData,
  CountryMatchingMap,
  PlaceWithCountry,
  ProcessingMetadata,
  UnresolvedLocation,
} from '../../shared/types/country.js';

export type { ISO2 } from '../../shared/types/iso2.js';
export { isISO2 } from '../../shared/types/iso2.js';
