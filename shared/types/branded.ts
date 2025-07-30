/**
 * Branded types for stronger type safety
 *
 * These types use TypeScript's branded type pattern to ensure that
 * strings representing IDs cannot be accidentally mixed with regular strings
 */

/**
 * Branded type for Individual IDs
 * This ensures that individual IDs are distinct from regular strings at the type level
 */
export type IndividualId = string & { __brand: 'IndividualId' };

/**
 * Branded type for Family IDs
 */
export type FamilyId = string & { __brand: 'FamilyId' };

/**
 * Branded type for Edge IDs
 */
export type EdgeId = string & { __brand: 'EdgeId' };

/**
 * Type guard to check if a string is a valid IndividualId
 */
export function isIndividualId(id: string): id is IndividualId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid FamilyId
 */
export function isFamilyId(id: string): id is FamilyId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Type guard to check if a string is a valid EdgeId
 */
export function isEdgeId(id: string): id is EdgeId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Helper to create an IndividualId from a string
 * This should be used when creating IDs from parsed data
 */
export function createIndividualId(id: string): IndividualId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid individual ID');
  }
  return id as IndividualId;
}

/**
 * Helper to create a FamilyId from a string
 */
export function createFamilyId(id: string): FamilyId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid family ID');
  }
  return id as FamilyId;
}

/**
 * Helper to create an EdgeId from a string
 */
export function createEdgeId(id: string): EdgeId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid edge ID');
  }
  return id as EdgeId;
}

/**
 * Helper to create an EdgeId from source and target IDs
 */
export function createEdgeIdFromPair(
  sourceId: IndividualId,
  targetId: IndividualId,
): EdgeId {
  // Sort to ensure consistent edge IDs regardless of direction
  const [first, second] = [sourceId, targetId].sort();
  return createEdgeId(`${first}|${second}`);
}
