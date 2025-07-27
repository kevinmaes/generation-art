/**
 * Centralized type exports
 * This file provides a single import point for all types used by the cli and the client application
 */

// Zod schemas and derived types (preferred for runtime validation)
export {
  // Schemas
  IndividualSchema,
  FamilySchema,
  GedcomDataSchema,
  IndividualMetadataSchema,
  FamilyMetadataSchema,
  TreeMetadataSchema,
  AugmentedIndividualSchema,
  FamilyWithMetadataSchema,
  GedcomDataWithMetadataSchema,
  EnhancedIndividualArraySchema,
  FlexibleGedcomDataSchema,

  // Validation functions
  validateGedcomData,
  validateGedcomDataWithMetadata,
  validateFlexibleGedcomData,
  safeValidateGedcomData,
  safeValidateGedcomDataWithMetadata,
  safeValidateFlexibleGedcomData,

  // Derived types
  type Individual,
  type Family,
  type GedcomData,
  type IndividualMetadata,
  type FamilyMetadata,
  type TreeMetadata,
  type AugmentedIndividual,
  type FamilyWithMetadata,
  type GedcomDataWithMetadata,
} from './schemas';

// Legacy type exports (for backward compatibility)
export type {
  Individual as LegacyIndividual,
  Family as LegacyFamily,
  GedcomData as LegacyGedcomData,
  AugmentedIndividual as LegacyAugmentedIndividual,
  IndividualMetadata as LegacyIndividualMetadata,
} from './gedcom';

export type {
  FamilyMetadata as LegacyFamilyMetadata,
  TreeMetadata as LegacyTreeMetadata,
  FamilyWithMetadata as LegacyFamilyWithMetadata,
  GedcomDataWithMetadata as LegacyGedcomDataWithMetadata,
} from './metadata';

// Type predicates
export { isNumber, isString, isBoolean, isBirthMonth } from './type-predicates';
