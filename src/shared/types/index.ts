/**
 * Centralized type exports
 * This file provides a single import point for all types used across the application
 */

// Core GEDCOM types
export type {
  Individual,
  Family,
  GedcomData,
  AugmentedIndividual,
  IndividualMetadata,
} from './gedcom';

// Metadata types
export type {
  FamilyMetadata,
  TreeMetadata,
  FamilyWithMetadata,
  GedcomDataWithMetadata,
} from './metadata';

// Type predicates
export { isNumber, isString, isBoolean, isBirthMonth } from './type-predicates';
