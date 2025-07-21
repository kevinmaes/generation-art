/**
 * Shared types index
 * Export all shared types from a single location
 */

// Core GEDCOM types
export type {
  Individual,
  Family,
  GedcomData,
  AugmentedIndividual,
} from './gedcom';

// Metadata types
export type {
  IndividualMetadata,
  FamilyMetadata,
  TreeMetadata,
  IndividualWithMetadata,
  FamilyWithMetadata,
  GedcomDataWithMetadata,
} from './metadata';

// Type predicates
export {
  isNumber,
  isString,
  isBoolean,
  isNonNullNumber,
  isBirthMonth,
  isLifespan,
  isNormalizedLifespan,
  isIndividualId,
  isDateString,
} from './type-predicates';
