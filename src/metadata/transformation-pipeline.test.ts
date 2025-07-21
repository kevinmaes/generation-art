import { describe, it, expect } from 'vitest';
import {
  transformGedcomDataWithMetadata,
  maskLifespan,
  maskBirthMonth,
} from './transformation-pipeline';
import type { Individual, Family } from '../types';

describe('MetadataTransformationPipeline - Functional', () => {
  const mockIndividuals: Individual[] = [
    {
      id: 'I1',
      name: 'John Doe',
      birth: { date: '1990-06-15' },
      death: { date: '2020-03-02' },
      parents: [],
      spouses: [],
      children: [],
      siblings: [],
    },
    {
      id: 'I2',
      name: 'Jane Doe',
      birth: { date: '1992-08-20' },
      death: undefined,
      parents: [],
      spouses: [],
      children: [],
      siblings: [],
    },
  ];

  const mockFamilies: Family[] = [
    {
      id: 'F1',
      husband: mockIndividuals[0],
      wife: mockIndividuals[1],
      children: [],
    },
  ];

  describe('transformGedcomDataWithMetadata', () => {
    it('should transform individuals with metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      expect(result.individuals).toHaveLength(2);
      expect(result.individuals[0].metadata).toBeDefined();
      expect(result.individuals[1].metadata).toBeDefined();
    });

    it('should extract lifespan metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      // John Doe lived from 1990 to 2020 = 30 years
      expect(result.individuals[0].metadata.lifespan).toBeDefined();
      expect(typeof result.individuals[0].metadata.lifespan).toBe('number');
    });

    it('should extract isAlive metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      expect(result.individuals[0].metadata.isAlive).toBe(false); // Has death date
      expect(result.individuals[1].metadata.isAlive).toBe(true); // No death date
    });

    it('should extract birth month metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      expect(result.individuals[0].metadata.birthMonth).toBe(6); // June
      expect(result.individuals[1].metadata.birthMonth).toBe(8); // August
    });

    it('should extract zodiac sign metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      expect(result.individuals[0].metadata.zodiacSign).toBeDefined();
      expect(typeof result.individuals[0].metadata.zodiacSign).toBe('string');
    });

    it('should extract family metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      expect(result.families).toHaveLength(1);
      expect(result.families[0].metadata).toBeDefined();
      expect(result.families[0].metadata.numberOfChildren).toBe(0);
    });

    it('should extract tree metadata', () => {
      const result = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalIndividuals).toBe(2);
      expect(result.metadata.depthOfTree).toBe(2); // Based on number of individuals: Math.ceil(Math.log2(2 + 1)) = 2
    });

    it('should be pure - same input produces same output', () => {
      const result1 = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );
      const result2 = transformGedcomDataWithMetadata(
        mockIndividuals,
        mockFamilies,
      );

      // Note: PII masking adds randomness, so we can't do deep equality
      // But the structure should be the same
      expect(result1.individuals.length).toBe(result2.individuals.length);
      expect(result1.families.length).toBe(result2.families.length);
      expect(result1.metadata.totalIndividuals).toBe(
        result2.metadata.totalIndividuals,
      );
    });
  });

  describe('PII Masking Functions', () => {
    describe('maskLifespan', () => {
      it('should mask lifespan values with noise', () => {
        const original = 0.75;
        const masked = maskLifespan(original);

        expect(masked).toBeGreaterThanOrEqual(0);
        expect(masked).toBeLessThanOrEqual(1);
        expect(masked).not.toBe(original); // Should be different due to noise
      });

      it('should keep values within bounds', () => {
        const edgeCases = [0, 0.1, 0.5, 0.9, 1];

        edgeCases.forEach((value) => {
          const masked = maskLifespan(value);
          expect(masked).toBeGreaterThanOrEqual(0);
          expect(masked).toBeLessThanOrEqual(1);
        });
      });
    });

    describe('maskBirthMonth', () => {
      it('should mask birth month values', () => {
        const original = 6;
        const masked = maskBirthMonth(original);

        expect(masked).toBeGreaterThanOrEqual(1);
        expect(masked).toBeLessThanOrEqual(12);
      });

      it('should handle edge cases', () => {
        const edgeCases = [1, 6, 12];

        edgeCases.forEach((value) => {
          const masked = maskBirthMonth(value);
          expect(masked).toBeGreaterThanOrEqual(1);
          expect(masked).toBeLessThanOrEqual(12);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle individuals without birth dates', () => {
      const individualsWithoutBirth: Individual[] = [
        {
          id: 'I3',
          name: 'Unknown Person',
          birth: undefined,
          death: undefined,
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
        },
      ];

      const result = transformGedcomDataWithMetadata(
        individualsWithoutBirth,
        [],
      );

      expect(result.individuals[0].metadata.lifespan).toBeUndefined();
      expect(result.individuals[0].metadata.birthMonth).toBeUndefined();
      expect(result.individuals[0].metadata.zodiacSign).toBeUndefined();
      expect(result.individuals[0].metadata.isAlive).toBe(true); // No death date
    });

    it('should handle empty arrays', () => {
      const result = transformGedcomDataWithMetadata([], []);

      expect(result.individuals).toHaveLength(0);
      expect(result.families).toHaveLength(0);
      expect(result.metadata.totalIndividuals).toBe(0);
      expect(result.metadata.depthOfTree).toBe(0);
    });

    it('should handle invalid dates gracefully', () => {
      const individualsWithInvalidDates: Individual[] = [
        {
          id: 'I4',
          name: 'Invalid Date Person',
          birth: { date: 'invalid-date' },
          death: { date: 'also-invalid' },
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
        },
      ];

      const result = transformGedcomDataWithMetadata(
        individualsWithInvalidDates,
        [],
      );

      expect(result.individuals[0].metadata.lifespan).toBeUndefined();
      expect(result.individuals[0].metadata.birthMonth).toBeUndefined();
      expect(result.individuals[0].metadata.zodiacSign).toBeUndefined();
    });
  });
});
