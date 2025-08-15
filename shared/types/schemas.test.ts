import { describe, it, expect } from 'vitest';
import {
  IndividualSchema,
  AugmentedIndividualSchema,
  FlexibleGedcomDataSchema,
  validateFlexibleGedcomData,
  safeValidateFlexibleGedcomData,
} from './schemas';

describe('Zod Schemas', () => {
  describe('IndividualSchema', () => {
    it('should validate a valid individual', () => {
      const validIndividual = {
        id: 'I1',
        name: 'John Doe',
        birth: { date: '1990-01-01', place: 'New York' },
        death: { date: '2020-01-01', place: 'Los Angeles' },
        parents: ['I2', 'I3'],
        spouses: ['I4'],
        children: ['I5'],
        siblings: ['I6'],
      };

      const result = IndividualSchema.safeParse(validIndividual);
      expect(result.success).toBe(true);
    });

    it('should reject invalid individual', () => {
      const invalidIndividual = {
        id: 'I1',
        // Missing required name field
        birth: { date: '1990-01-01' },
        parents: ['I2'],
        spouses: [],
        children: [],
        siblings: [],
      };

      const result = IndividualSchema.safeParse(invalidIndividual);
      expect(result.success).toBe(false);
    });
  });

  describe('AugmentedIndividualSchema', () => {
    it('should validate a valid augmented individual', () => {
      const validAugmentedIndividual = {
        id: 'I1',
        name: 'John Doe',
        parents: ['I2', 'I3'],
        spouses: ['I4'],
        children: ['I5'],
        siblings: ['I6'],
        metadata: {
          lifespan: 0.8,
          isAlive: false,
          birthMonth: 1,
          zodiacSign: 'Capricorn',
          generation: 2,
          relativeGenerationValue: 50,
        },
      };

      const result = AugmentedIndividualSchema.safeParse(
        validAugmentedIndividual,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('FlexibleGedcomDataSchema', () => {
    it('should validate GedcomDataWithMetadata format', () => {
      const validData = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'John Doe',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              lifespan: 0.8,
              isAlive: false,
            },
          },
        },
        families: {
          F1: {
            id: 'F1',
            children: [],
            metadata: {
              numberOfChildren: 0,
            },
          },
        },
        // metadata is optional and will be filled with defaults
      };

      const result = FlexibleGedcomDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate array format (enhanced individuals)', () => {
      const validArrayData = [
        {
          id: 'I1',
          name: 'John Doe',
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
          metadata: {
            lifespan: 0.8,
            isAlive: false,
          },
        },
      ];

      const result = FlexibleGedcomDataSchema.safeParse(validArrayData);
      expect(result.success).toBe(true);
    });

    it('should validate object format without metadata', () => {
      const validObjectData = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'John Doe',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              lifespan: 0.8,
              isAlive: false,
            },
          },
        },
        families: {
          F1: {
            id: 'F1',
            children: [],
            metadata: {
              numberOfChildren: 0,
            },
          },
        },
      };

      const result = FlexibleGedcomDataSchema.safeParse(validObjectData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateFlexibleGedcomData', () => {
    it('should transform array format to GedcomDataWithMetadata', () => {
      const arrayData = [
        {
          id: 'I1',
          name: 'John Doe',
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
          metadata: {
            lifespan: 0.8,
            isAlive: false,
          },
        },
      ];

      const result = validateFlexibleGedcomData(arrayData);
      expect(Object.keys(result.individuals)).toHaveLength(1);
      expect(result.individuals.I1).toEqual(arrayData[0]);
      expect(Object.keys(result.families)).toHaveLength(0);
      expect(result.metadata.graphStructure.totalIndividuals).toBe(1);
    });

    it('should handle object format without metadata', () => {
      const objectData = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'John Doe',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              lifespan: 0.8,
              isAlive: false,
            },
          },
        },
        families: {
          F1: {
            id: 'F1',
            children: [],
            metadata: {
              numberOfChildren: 0,
            },
          },
        },
      };

      const result = validateFlexibleGedcomData(objectData);
      expect(Object.keys(result.individuals)).toHaveLength(1);
      expect(result.individuals.I1).toEqual(objectData.individuals.I1);
      expect(Object.keys(result.families)).toHaveLength(1);
      expect(result.families.F1).toEqual(objectData.families.F1);
      expect(result.metadata.graphStructure.totalIndividuals).toBe(1);
    });
  });

  describe('safeValidateFlexibleGedcomData', () => {
    it('should return success for valid data', () => {
      const validData = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'John Doe',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              lifespan: 0.8,
              isAlive: false,
            },
          },
        },
        families: {},
        // metadata is optional and will be filled with defaults
      };

      const result = validateFlexibleGedcomData(validData);
      expect(Object.keys(result.individuals)).toHaveLength(1);
      expect(result.metadata.graphStructure.totalIndividuals).toBe(1);
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        individuals: 'not an array',
        families: [],
        metadata: {},
      };

      const result = safeValidateFlexibleGedcomData(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid input');
        // Check that the error contains details about the validation failure
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});
