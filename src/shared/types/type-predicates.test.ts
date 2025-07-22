import { describe, it, expect } from 'vitest';
import {
  isNumber,
  isString,
  isBoolean,
  isNonNullNumber,
  isBirthMonth,
  isLifespan,
  isNormalizedLifespan,
  isIndividualId,
  isDateString,
} from './type-predicates';

describe('Type Predicates', () => {
  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber(-Infinity)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('42')).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('42')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(42)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(42)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean({})).toBe(false);
      expect(isBoolean([])).toBe(false);
    });
  });

  describe('isNonNullNumber', () => {
    it('should return true for valid non-null numbers', () => {
      expect(isNonNullNumber(42)).toBe(true);
      expect(isNonNullNumber(0)).toBe(true);
      expect(isNonNullNumber(-1)).toBe(true);
      expect(isNonNullNumber(3.14)).toBe(true);
    });

    it('should return false for null and invalid numbers', () => {
      expect(isNonNullNumber(null)).toBe(false);
      expect(isNonNullNumber(NaN)).toBe(false);
      expect(isNonNullNumber(Infinity)).toBe(false);
    });
  });

  describe('isBirthMonth', () => {
    it('should return true for valid birth months', () => {
      expect(isBirthMonth(1)).toBe(true);
      expect(isBirthMonth(6)).toBe(true);
      expect(isBirthMonth(12)).toBe(true);
    });

    it('should return false for invalid birth months', () => {
      expect(isBirthMonth(0)).toBe(false);
      expect(isBirthMonth(13)).toBe(false);
      expect(isBirthMonth(-1)).toBe(false);
      expect(isBirthMonth(3.5)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isBirthMonth('6')).toBe(false);
      expect(isBirthMonth(null)).toBe(false);
      expect(isBirthMonth(undefined)).toBe(false);
    });
  });

  describe('isLifespan', () => {
    it('should return true for valid lifespans', () => {
      expect(isLifespan(0)).toBe(true);
      expect(isLifespan(42)).toBe(true);
      expect(isLifespan(100)).toBe(true);
    });

    it('should return false for negative lifespans', () => {
      expect(isLifespan(-1)).toBe(false);
      expect(isLifespan(-10)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isLifespan('42')).toBe(false);
      expect(isLifespan(null)).toBe(false);
      expect(isLifespan(undefined)).toBe(false);
    });
  });

  describe('isNormalizedLifespan', () => {
    it('should return true for valid normalized lifespans', () => {
      expect(isNormalizedLifespan(0)).toBe(true);
      expect(isNormalizedLifespan(0.5)).toBe(true);
      expect(isNormalizedLifespan(1)).toBe(true);
    });

    it('should return false for out-of-range values', () => {
      expect(isNormalizedLifespan(-0.1)).toBe(false);
      expect(isNormalizedLifespan(1.1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNormalizedLifespan('0.5')).toBe(false);
      expect(isNormalizedLifespan(null)).toBe(false);
      expect(isNormalizedLifespan(undefined)).toBe(false);
    });
  });

  describe('isIndividualId', () => {
    it('should return true for valid individual IDs', () => {
      expect(isIndividualId('I123')).toBe(true);
      expect(isIndividualId('individual-1')).toBe(true);
      expect(isIndividualId('a')).toBe(true);
    });

    it('should return false for empty strings and non-strings', () => {
      expect(isIndividualId('')).toBe(false);
      expect(isIndividualId(123)).toBe(false);
      expect(isIndividualId(null)).toBe(false);
      expect(isIndividualId(undefined)).toBe(false);
    });
  });

  describe('isDateString', () => {
    it('should return true for valid date strings', () => {
      expect(isDateString('2023-01-01')).toBe(true);
      expect(isDateString('1990-06-15')).toBe(true);
      expect(isDateString('2023-12-31')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isDateString('invalid-date')).toBe(false);
      expect(isDateString('2023-13-01')).toBe(false);
      expect(isDateString('2023-00-01')).toBe(false);
      expect(isDateString('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isDateString(123)).toBe(false);
      expect(isDateString(null)).toBe(false);
      expect(isDateString(undefined)).toBe(false);
    });
  });
});
