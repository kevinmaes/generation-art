/**
 * Shared type predicates for common type checks
 * Pure functions that help TypeScript narrow types
 */

/**
 * Type predicate to check if a value is a number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Type predicate to check if a value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Type predicate to check if a value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Type predicate to check if a value is a non-null number
 */
export const isNonNullNumber = (value: unknown): value is number => {
  return (
    value !== null &&
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value)
  );
};

/**
 * Type predicate to check if a value is a valid birth month (1-12)
 */
export const isBirthMonth = (value: unknown): value is number => {
  return (
    isNumber(value) && Number.isInteger(value) && value >= 1 && value <= 12
  );
};

/**
 * Type predicate to check if a value is a valid lifespan (non-negative)
 */
export const isLifespan = (value: unknown): value is number => {
  return isNumber(value) && value >= 0;
};

/**
 * Type predicate to check if a value is a valid normalized lifespan (0-1)
 */
export const isNormalizedLifespan = (value: unknown): value is number => {
  return isNumber(value) && value >= 0 && value <= 1;
};

/**
 * Type predicate to check if a value is a valid individual ID
 */
export const isIndividualId = (value: unknown): value is string => {
  return isString(value) && value.length > 0;
};

/**
 * Type predicate to check if a value is a valid date string
 */
export const isDateString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};
