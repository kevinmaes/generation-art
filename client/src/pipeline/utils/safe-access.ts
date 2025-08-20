/**
 * Type-safe utility functions for accessing potentially undefined data
 */

// Use any for now to avoid complex type casting issues
// TODO: Fix the type mismatch between interface definition and runtime usage
interface GedcomDataRuntime {
  individuals?: Record<string, unknown>;
  families?: Record<string, unknown>;
  metadata?: unknown;
}

/**
 * Safely get an individual from gedcomData with null check
 * @param gedcomData - The GEDCOM data object
 * @param individualId - The ID of the individual to retrieve
 * @returns The individual if found, undefined otherwise
 */
export function getIndividualSafe(gedcomData: unknown, individualId: string): unknown {
  if (!gedcomData || typeof gedcomData !== 'object') return undefined;
  const data = gedcomData as GedcomDataRuntime;
  return data.individuals?.[individualId];
}

/**
 * Safely get a family from gedcomData with null check
 * @param gedcomData - The GEDCOM data object
 * @param familyId - The ID of the family to retrieve
 * @returns The family if found, undefined otherwise
 */
export function getFamilySafe(gedcomData: unknown, familyId: string): unknown {
  if (!gedcomData || typeof gedcomData !== 'object') return undefined;
  const data = gedcomData as GedcomDataRuntime;
  return data.families?.[familyId];
}

/**
 * Type guard to check if an individual exists
 */
export function isValidIndividual<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Get a safe default value when accessing nested properties
 */
export function getSafeValue<T>(getValue: () => T, defaultValue: T): T {
  try {
    const value = getValue();
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
