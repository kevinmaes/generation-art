/**
 * Centralized type exports
 * This file provides a single import point for all types used by the cli and the client application
 * All types are now derived from Zod schemas for consistency and runtime validation
 */

// Zod schemas and derived types (source of truth)
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

  // Graph analysis schemas
  EdgeSchema,
  EdgeMetadataSchema,
  GraphStructureMetadataSchema,
  TemporalMetadataSchema,
  GeographicMetadataSchema,
  DemographicMetadataSchema,
  RelationshipMetadataSchema,
  EdgeAnalysisMetadataSchema,
  TreeSummarySchema,

  // Validation functions
  validateGedcomData,
  validateGedcomDataWithMetadata,
  validateFlexibleGedcomData,
  safeValidateGedcomData,
  safeValidateGedcomDataWithMetadata,
  safeValidateFlexibleGedcomData,

  // Derived types (inferred from schemas)
  type Individual,
  type Family,
  type GedcomData,
  type IndividualMetadata,
  type FamilyMetadata,
  type TreeMetadata,
  type AugmentedIndividual,
  type FamilyWithMetadata,
  type GedcomDataWithMetadata,

  // Graph analysis types
  type Edge,
  type EdgeMetadata,
  type GraphStructureMetadata,
  type TemporalMetadata,
  type GeographicMetadata,
  type DemographicMetadata,
  type RelationshipMetadata,
  type EdgeAnalysisMetadata,
  type TreeSummary,
} from './schemas';

// Type predicates
export { isNumber, isString, isBoolean, isBirthMonth } from './type-predicates';
