import type { Family, Individual } from '../../shared/types';
import { calculateGeneration, extractYear } from './graph-analysis';

/**
 * Configuration for extracting and transforming metadata from GEDCOM data
 * Based on the GEDCOM_Visual_Metadata_Fields.csv specification
 * Functional programming approach with pure functions
 */

export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'float'
  | 'integer';
export type PiiLevel = 'none' | 'low' | 'high' | 'critical';
export type MetadataScope =
  | 'individual'
  | 'family'
  | 'tree'
  | 'relationship'
  | 'cluster';

export interface MetadataFieldConfig {
  /** The field name in the metadata object */
  fieldName: string;
  /** What category this metadata belongs to */
  category: string;
  /** Where this metadata should be stored */
  scope: MetadataScope;
  /** The data type of the transformed value */
  dataType: DataType;
  /** Whether this field contains PII and what level */
  piiLevel: PiiLevel;
  /** Description of what this field represents */
  description: string;
  /** GEDCOM tags/sources this field is derived from */
  gedcomSources: string[];
  /** Transformation function to apply to raw data */
  transform?: (context: TransformationContext) => unknown;
  /** Whether this field should be masked for PII protection */
  requiresMasking: boolean;
  /** Custom masking function if needed */
  maskFunction?: (value: unknown) => unknown;
  /** Example value for documentation */
  exampleValue?: unknown;
  /** Validation function to ensure data quality */
  validate?: (value: unknown) => boolean;
}

export interface TransformationContext {
  individual?: Individual;
  family?: Family;
  allIndividuals?: Individual[];
  allFamilies?: Family[];
  rootIndividual?: Individual;
}

/**
 * Pure function to calculate lifespan from birth and death dates
 */
export const calculateLifespan = (
  birthDate: string,
  deathDate: string,
): number | null => {
  const birth = new Date(birthDate);
  const death = new Date(deathDate);

  if (isNaN(birth.getTime()) || isNaN(death.getTime())) return null;

  return death.getFullYear() - birth.getFullYear();
};

/**
 * Pure function to normalize lifespan relative to max lifespan in dataset
 */
export const normalizeLifespan = (
  lifespan: number,
  allIndividuals: Individual[],
): number => {
  const maxLifespan = Math.max(
    ...allIndividuals
      .filter((ind) => ind.birth?.date && ind.death?.date)
      .map((ind) => {
        const birthDate = ind.birth?.date;
        const deathDate = ind.death?.date;
        if (!birthDate || !deathDate) return null;
        return calculateLifespan(birthDate, deathDate);
      })
      .filter((age): age is number => age !== null && age >= 0),
  );

  return maxLifespan > 0 ? lifespan / maxLifespan : 0;
};

/**
 * Pure function to determine if individual is alive
 */
export const isIndividualAlive = (individual: Individual): boolean => {
  return !individual.death?.date;
};

/**
 * Pure function to extract birth month from date
 */
export const extractBirthMonth = (birthDate: string): number | null => {
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return null;
  return date.getMonth() + 1; // JavaScript months are 0-indexed
};

/**
 * Pure function to calculate zodiac sign from birth date
 */
export const calculateZodiacSign = (birthDate: string): string | null => {
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Zodiac sign date ranges (month, day)
  const zodiacRanges = [
    { sign: 'Capricorn', start: [1, 1], end: [1, 19] },
    { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
    { sign: 'Pisces', start: [2, 19], end: [3, 20] },
    { sign: 'Aries', start: [3, 21], end: [4, 19] },
    { sign: 'Taurus', start: [4, 20], end: [5, 20] },
    { sign: 'Gemini', start: [5, 21], end: [6, 20] },
    { sign: 'Cancer', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', start: [9, 23], end: [10, 22] },
    { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
    { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
    { sign: 'Capricorn', start: [12, 22], end: [12, 31] },
  ];

  for (const range of zodiacRanges) {
    const [startMonth, startDay] = range.start;
    const [endMonth, endDay] = range.end;

    if (startMonth === endMonth) {
      // Same month range
      if (month === startMonth && day >= startDay && day <= endDay) {
        return range.sign;
      }
    } else {
      // Cross-month range (like Dec 22 - Jan 19 for Capricorn)
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (month > startMonth && month < endMonth)
      ) {
        return range.sign;
      }
    }
  }

  return 'Capricorn'; // Default fallback
};

/**
 * Pure function to count children in a family
 */
export const countFamilyChildren = (family: Family): number => {
  return family.children.length;
};

/**
 * Metadata extraction configuration based on GEDCOM_Visual_Metadata_Fields.csv
 * Starting with birth/death/lifespan focused fields as requested
 */
export const metadataExtractionConfig: Record<string, MetadataFieldConfig> = {
  // Individual-level metadata
  lifespan: {
    fieldName: 'lifespan',
    category: 'Individual',
    scope: 'individual',
    dataType: 'float',
    piiLevel: 'high',
    description:
      'Years between BIRT and DEAT, normalized relative to max lifespan',
    gedcomSources: ['BIRT.DATE', 'DEAT.DATE'],
    requiresMasking: true,
    exampleValue: 0.75,
    transform: (context: TransformationContext) => {
      const { individual, allIndividuals } = context;
      const birthDate = individual?.birth?.date;
      const deathDate = individual?.death?.date;

      if (!birthDate || !deathDate || !allIndividuals) return null;

      const lifespan = calculateLifespan(birthDate, deathDate);
      if (lifespan === null) return null;

      return normalizeLifespan(lifespan, allIndividuals);
    },
  },

  isAlive: {
    fieldName: 'isAlive',
    category: 'Individual',
    scope: 'individual',
    dataType: 'boolean',
    piiLevel: 'high',
    description: 'Whether the individual is alive based on absence of DEAT',
    gedcomSources: ['DEAT'],
    requiresMasking: true,
    exampleValue: true,
    transform: (context: TransformationContext) => {
      const { individual } = context;
      if (!individual) return null;
      return isIndividualAlive(individual);
    },
  },

  birthMonth: {
    fieldName: 'birthMonth',
    category: 'Individual',
    scope: 'individual',
    dataType: 'integer',
    piiLevel: 'low',
    description: 'Month from BIRT date (1-12)',
    gedcomSources: ['BIRT.DATE'],
    requiresMasking: false,
    exampleValue: 6,
    transform: (context: TransformationContext) => {
      const { individual } = context;
      if (!individual?.birth?.date) return null;
      return extractBirthMonth(individual.birth.date);
    },
  },

  zodiacSign: {
    fieldName: 'zodiacSign',
    category: 'Individual',
    scope: 'individual',
    dataType: 'string',
    piiLevel: 'none',
    description: 'Western zodiac sign derived from birth date',
    gedcomSources: ['BIRT.DATE'],
    requiresMasking: false,
    exampleValue: 'Gemini',
    transform: (context: TransformationContext) => {
      const { individual } = context;
      if (!individual?.birth?.date) return null;
      return calculateZodiacSign(individual.birth.date);
    },
  },

  relativeGenerationValue: {
    fieldName: 'relativeGenerationValue',
    category: 'Individual',
    scope: 'individual',
    dataType: 'float',
    piiLevel: 'none',
    description: 'Relative position within generation (0-1 normalized)',
    gedcomSources: ['INDI', 'FAM'],
    requiresMasking: false,
    exampleValue: 0.75,
    transform: (context: TransformationContext) => {
      const { individual, allIndividuals, allFamilies } = context;
      if (!individual || !allIndividuals || !allFamilies) return null;

      // Calculate generation for this individual
      const generation = calculateGeneration(
        individual,
        allIndividuals,
        allFamilies,
      );

      // Find all individuals in the same generation
      const sameGenerationIndividuals = allIndividuals.filter((ind) => {
        const indGeneration = calculateGeneration(
          ind,
          allIndividuals,
          allFamilies,
        );
        return indGeneration === generation;
      });

      if (sameGenerationIndividuals.length <= 1) return 0.5; // Center if alone in generation

      // Sort individuals in same generation by some criteria (e.g., birth year, name)
      // For now, use array index as a simple approach
      const sortedIndividuals = sameGenerationIndividuals.sort((a, b) => {
        // Try to sort by birth year first
        const aYear = a.birth?.date ? (extractYear(a.birth.date) ?? 0) : 0;
        const bYear = b.birth?.date ? (extractYear(b.birth.date) ?? 0) : 0;
        if (aYear !== bYear) return aYear - bYear;

        // Fallback to name sorting
        return a.name.localeCompare(b.name);
      });

      // Find position of current individual in sorted list
      const position = sortedIndividuals.findIndex(
        (ind) => ind.id === individual.id,
      );
      if (position === -1) return 0.5;

      // Normalize to 0-1 range
      return position / (sortedIndividuals.length - 1);
    },
  },

  // Family-level metadata
  numberOfChildren: {
    fieldName: 'numberOfChildren',
    category: 'Family',
    scope: 'family',
    dataType: 'integer',
    piiLevel: 'none',
    description: 'Count of CHIL records in the family',
    gedcomSources: ['CHIL'],
    requiresMasking: false,
    exampleValue: 3,
    transform: (context: TransformationContext) => {
      const { family } = context;
      if (!family) return null;
      return countFamilyChildren(family);
    },
  },

  // Tree-level metadata
  totalIndividuals: {
    fieldName: 'totalIndividuals',
    category: 'Tree',
    scope: 'tree',
    dataType: 'integer',
    piiLevel: 'none',
    description: 'Count of INDI records in the entire tree',
    gedcomSources: ['INDI'],
    requiresMasking: false,
    exampleValue: 1523,
    transform: (context: TransformationContext) => {
      return context.allIndividuals?.length ?? 0;
    },
  },

  depthOfTree: {
    fieldName: 'depthOfTree',
    category: 'Tree',
    scope: 'tree',
    dataType: 'integer',
    piiLevel: 'none',
    description: 'Maximum generation distance from root',
    gedcomSources: ['INDI', 'FAM'],
    requiresMasking: false,
    exampleValue: 7,
    transform: (context: TransformationContext) => {
      // For now, return a simple calculation based on number of individuals
      // This will be enhanced when generation calculation is implemented
      if (!context.allIndividuals) return 0;
      return Math.ceil(Math.log2(context.allIndividuals.length + 1));
    },
  },
};

/**
 * Pure function to get all metadata fields for a specific scope
 */
export const getMetadataFieldsByScope = (
  scope: MetadataScope,
): MetadataFieldConfig[] => {
  return Object.values(metadataExtractionConfig).filter(
    (config) => config.scope === scope,
  );
};

/**
 * Pure function to get all metadata fields that require PII masking
 */
export const getMetadataFieldsRequiringMasking = (): MetadataFieldConfig[] => {
  return Object.values(metadataExtractionConfig).filter(
    (config) => config.requiresMasking,
  );
};
