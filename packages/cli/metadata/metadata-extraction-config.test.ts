import { describe, it, expect } from 'vitest';
import {
  calculateLifespan,
  normalizeLifespan,
  isIndividualAlive,
  extractBirthMonth,
  calculateZodiacSign,
  countFamilyChildren,
  getMetadataFieldsByScope,
  getMetadataFieldsRequiringMasking,
} from './metadata-extraction-config';

describe('metadataExtractionConfig - Pure Functions', () => {
  describe('calculateLifespan', () => {
    it('should calculate lifespan correctly', () => {
      const lifespan = calculateLifespan('1990-06-15', '2020-03-02');
      expect(lifespan).toBe(30);
    });

    it('should return null for invalid dates', () => {
      const lifespan = calculateLifespan('invalid-date', '2020-03-02');
      expect(lifespan).toBeNull();
    });

    it('should handle edge cases', () => {
      const lifespan = calculateLifespan('2020-01-01', '2020-12-31');
      expect(lifespan).toBe(0); // Same year
    });
  });

  describe('normalizeLifespan', () => {
    it('should normalize lifespan relative to max', () => {
      const individuals = [
        {
          id: '1',
          name: 'Person 1',
          birth: { date: '1990-01-01' },
          death: { date: '2020-01-01' },
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
        }, // 30 years
        {
          id: '2',
          name: 'Person 2',
          birth: { date: '1990-01-01' },
          death: { date: '2010-01-01' },
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
        }, // 20 years
        {
          id: '3',
          name: 'Person 3',
          birth: { date: '1990-01-01' },
          death: { date: '2030-01-01' },
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
        }, // 40 years
      ];

      const normalized = normalizeLifespan(30, individuals);
      expect(normalized).toBe(0.75); // 30/40 = 0.75
    });

    it('should handle empty array', () => {
      const normalized = normalizeLifespan(30, []);
      expect(normalized).toBe(0);
    });
  });

  describe('isIndividualAlive', () => {
    it('should return true when no death date', () => {
      const individual = {
        id: '1',
        name: 'Person',
        death: undefined,
        parents: [],
        spouses: [],
        children: [],
        siblings: [],
      };
      expect(isIndividualAlive(individual)).toBe(true);
    });

    it('should return false when death date exists', () => {
      const individual = {
        id: '1',
        name: 'Person',
        death: { date: '2020-01-01' },
        parents: [],
        spouses: [],
        children: [],
        siblings: [],
      };
      expect(isIndividualAlive(individual)).toBe(false);
    });
  });

  describe('extractBirthMonth', () => {
    it('should extract birth month correctly', () => {
      const month = extractBirthMonth('1990-06-15');
      expect(month).toBe(6);
    });

    it('should return null for invalid date', () => {
      const month = extractBirthMonth('invalid-date');
      expect(month).toBeNull();
    });
  });

  describe('calculateZodiacSign', () => {
    it('should calculate zodiac sign correctly', () => {
      const sign = calculateZodiacSign('1990-06-15');
      expect(sign).toBe('Gemini');
    });

    it('should return null for invalid date', () => {
      const sign = calculateZodiacSign('invalid-date');
      expect(sign).toBeNull();
    });

    it('should handle different zodiac signs', () => {
      expect(calculateZodiacSign('1990-01-15')).toBe('Capricorn');
      expect(calculateZodiacSign('1990-03-21')).toBe('Aries');
      expect(calculateZodiacSign('1990-07-15')).toBe('Cancer');
      expect(calculateZodiacSign('1990-12-25')).toBe('Capricorn');
    });
  });

  describe('countFamilyChildren', () => {
    it('should count children correctly', () => {
      const family = {
        id: 'F1',
        children: [
          {
            id: '1',
            name: 'Child 1',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
          },
          {
            id: '2',
            name: 'Child 2',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
          },
          {
            id: '3',
            name: 'Child 3',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
          },
        ],
      };
      expect(countFamilyChildren(family)).toBe(3);
    });

    it('should return 0 for no children', () => {
      const family = { id: 'F1', children: [] };
      expect(countFamilyChildren(family)).toBe(0);
    });

    it('should handle undefined children', () => {
      const family = { id: 'F1', children: [] };
      expect(countFamilyChildren(family)).toBe(0);
    });
  });

  describe('getMetadataFieldsByScope', () => {
    it('should return individual fields', () => {
      const fields = getMetadataFieldsByScope('individual');
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.every((field) => field.scope === 'individual')).toBe(true);
    });

    it('should return family fields', () => {
      const fields = getMetadataFieldsByScope('family');
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.every((field) => field.scope === 'family')).toBe(true);
    });

    it('should return tree fields', () => {
      const fields = getMetadataFieldsByScope('tree');
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.every((field) => field.scope === 'tree')).toBe(true);
    });
  });

  describe('getMetadataFieldsRequiringMasking', () => {
    it('should return only fields that require masking', () => {
      const fields = getMetadataFieldsRequiringMasking();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.every((field) => field.requiresMasking)).toBe(true);
    });
  });
});
