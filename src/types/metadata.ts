/**
 * Shared metadata types used across the application
 * These types represent metadata structures for individuals, families, and trees
 */

import type { Individual, Family } from './gedcom';

/**
 * Individual metadata fields
 */
export interface IndividualMetadata {
  lifespan?: number;
  isAlive?: boolean;
  birthMonth?: number;
  zodiacSign?: string;
  // Add more individual metadata fields as needed
}

/**
 * Family metadata fields
 */
export interface FamilyMetadata {
  numberOfChildren?: number;
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
 * Individual with metadata attached
 */
export interface IndividualWithMetadata extends Individual {
  metadata: IndividualMetadata;
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
  individuals: IndividualWithMetadata[];
  families: FamilyWithMetadata[];
  metadata: TreeMetadata;
}
