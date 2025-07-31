/**
 * Type guards and validation utilities for transformers
 * These ensure runtime safety when accessing GEDCOM data
 */

/**
 * Validates that a transformer context has all required data
 */
export function isValidTransformerContext(
  context: any,
): boolean {
  // All fields are required in TransformerContext, so this is just a type guard
  return !!(context?.gedcomData && context?.visualMetadata && context?.dimensions);
}

/**
 * Gets an individual with proper error handling and logging
 */
export function getIndividualOrThrow(
  gedcomData: any,
  individualId: string,
  transformerName: string,
): any {
  const individual = gedcomData.individuals?.[individualId];
  if (!individual) {
    throw new Error(
      `${transformerName}: Individual '${individualId}' not found in GEDCOM data. ` +
      `Available IDs: ${Object.keys(gedcomData.individuals || {}).slice(0, 5).join(', ')}...`
    );
  }
  return individual;
}

/**
 * Gets an individual with fallback behavior (returns undefined instead of throwing)
 */
export function getIndividualOrWarn(
  gedcomData: any,
  individualId: string,
  transformerName: string,
): any {
  const individual = gedcomData.individuals?.[individualId];
  if (!individual) {
    console.warn(
      `${transformerName}: Individual '${individualId}' not found. ` +
      `This may indicate corrupted data or invalid references.`
    );
    return undefined;
  }
  return individual;
}

/**
 * Safely gets a numeric metadata value with fallback
 */
export function getNumericMetadata(
  individual: any,
  field: string,
  fallback = 0,
): number {
  if (!individual?.metadata) return fallback;
  const value = individual.metadata[field];
  return typeof value === 'number' ? value : fallback;
}

/**
 * Validates edge references exist in the data
 */
export function validateEdgeReferences(
  gedcomData: any,
  sourceId: string,
  targetId: string,
  edgeId: string,
): boolean {
  const hasSource = sourceId in (gedcomData.individuals || {});
  const hasTarget = targetId in (gedcomData.individuals || {});
  
  if (!hasSource || !hasTarget) {
    console.error(
      `Edge '${edgeId}' references invalid individuals: ` +
      `source '${sourceId}' (${hasSource ? 'exists' : 'missing'}), ` +
      `target '${targetId}' (${hasTarget ? 'exists' : 'missing'})`
    );
    return false;
  }
  
  return true;
}