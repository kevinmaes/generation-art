/**
 * Shared metadata types used across the application
 * These types represent metadata structures for families and trees
 * Individual metadata is now part of the AugmentedIndividual type
 */

import type { Family, AugmentedIndividual } from './gedcom';

/**
 * Family metadata fields
 */
export interface FamilyMetadata {
  numberOfChildren: number;
  // Add more family metadata fields as needed
}

/**
 * Tree metadata fields
 */
export interface TreeMetadata {
  totalIndividuals?: number;
  depthOfTree?: number;
  // Add more tree metadata fields as needed
}

/**
 * Family with metadata attached
 */
export interface FamilyWithMetadata extends Family {
  metadata: FamilyMetadata;
}

/**
 * Complete GEDCOM data with metadata
 */
export interface GedcomDataWithMetadata {
  individuals: AugmentedIndividual[];
  families: FamilyWithMetadata[];
  metadata: TreeMetadata;
}
