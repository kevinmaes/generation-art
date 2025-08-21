/**
 * Type guards and validation utilities for transformers
 * These ensure runtime safety when accessing GEDCOM data
 */

interface ContextLike {
  gedcomData?: unknown;
  visualMetadata?: unknown;
  dimensions?: unknown;
}

interface GedcomDataLike {
  individuals?: Record<string, unknown>;
}

interface IndividualLike {
  metadata?: Record<string, unknown>;
}

/**
 * Validates that a transformer context has all required data
 */
export function isValidTransformerContext(context: unknown): boolean {
  // All fields are required in TransformerContext, so this is just a type guard
  const ctx = context as ContextLike;
  return !!(ctx.gedcomData && ctx.visualMetadata && ctx.dimensions);
}

/**
 * Gets an individual with proper error handling and logging
 */
export function getIndividualOrThrow(
  gedcomData: unknown,
  individualId: string,
  transformerName: string,
): unknown {
  const data = gedcomData as GedcomDataLike;
  const individual = data.individuals?.[individualId];
  if (!individual) {
    throw new Error(
      `${transformerName}: Individual '${individualId}' not found in GEDCOM data. ` +
        `Available IDs: ${Object.keys(data.individuals ?? {})
          .slice(0, 5)
          .join(', ')}...`,
    );
  }
  return individual;
}

/**
 * Gets an individual with fallback behavior (returns undefined instead of throwing)
 */
export function getIndividualOrWarn(
  gedcomData: unknown,
  individualId: string,
  transformerName: string,
): unknown {
  const data = gedcomData as GedcomDataLike;
  const individual = data.individuals?.[individualId];
  if (!individual) {
    console.warn(
      `${transformerName}: Individual '${individualId}' not found. ` +
        `This may indicate corrupted data or invalid references.`,
    );
    return undefined;
  }
  return individual;
}

/**
 * Safely gets a numeric metadata value with fallback
 */
export function getNumericMetadata(
  individual: unknown,
  field: string,
  fallback = 0,
): number {
  const ind = individual as IndividualLike;
  if (!ind.metadata) return fallback;
  const value = ind.metadata[field];
  return typeof value === 'number' ? value : fallback;
}

/**
 * Validates edge references exist in the data
 */
export function validateEdgeReferences(
  gedcomData: unknown,
  sourceId: string,
  targetId: string,
  edgeId: string,
): boolean {
  const data = gedcomData as GedcomDataLike;
  const hasSource = sourceId in (data.individuals ?? {});
  const hasTarget = targetId in (data.individuals ?? {});

  if (!hasSource || !hasTarget) {
    console.error(
      `Edge '${edgeId}' references invalid individuals: ` +
        `source '${sourceId}' (${hasSource ? 'exists' : 'missing'}), ` +
        `target '${targetId}' (${hasTarget ? 'exists' : 'missing'})`,
    );
    return false;
  }

  return true;
}
