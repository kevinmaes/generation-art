/**
 * Functional metadata transformation pipeline
 * Pure functions for extracting and transforming metadata from GEDCOM data
 */

import { getMetadataFieldsByScope } from './metadata-extraction-config';
import type {
  MetadataFieldConfig,
  TransformationContext,
} from './metadata-extraction-config';
import type {
  IndividualMetadata,
  FamilyMetadata,
  TreeMetadata,
  IndividualWithMetadata,
  FamilyWithMetadata,
  GedcomDataWithMetadata,
  Family,
  Individual,
} from '../types';

/**
 * PII Masking utilities - pure functions
 */

/**
 * Pure function to mask a lifespan value (0-1 normalized)
 */
export const maskLifespan = (value: number): number => {
  // Add small random noise to mask exact values
  const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
  return Math.max(0, Math.min(1, value + noise));
};

/**
 * Pure function to mask a boolean value (for isAlive)
 */
export const maskBoolean = (value: boolean): boolean => {
  // For now, return the original value
  // In a real implementation, you might want to add noise or use a different strategy
  return value;
};

/**
 * Pure function to mask a birth month (1-12)
 */
export const maskBirthMonth = (value: number): number => {
  // Add small random noise, keeping within 1-12 range
  const noise = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  return Math.max(1, Math.min(12, value + noise));
};

/**
 * Pure function to mask a value based on field configuration
 */
export const maskValue = (
  value: unknown,
  fieldConfig: MetadataFieldConfig,
): unknown => {
  if (!fieldConfig.requiresMasking) return value;

  if (fieldConfig.maskFunction) {
    return fieldConfig.maskFunction(value);
  }

  // Default masking based on data type
  switch (fieldConfig.dataType) {
    case 'float':
      if (fieldConfig.fieldName === 'lifespan' && typeof value === 'number') {
        return maskLifespan(value);
      }
      break;
    case 'boolean':
      if (fieldConfig.fieldName === 'isAlive' && typeof value === 'boolean') {
        return maskBoolean(value);
      }
      break;
    case 'integer':
      if (fieldConfig.fieldName === 'birthMonth' && typeof value === 'number') {
        return maskBirthMonth(value);
      }
      break;
  }

  return value;
};

/**
 * Pure function to validate a value using field configuration
 */
export const validateValue = (
  value: unknown,
  fieldConfig: MetadataFieldConfig,
): boolean => {
  if (value === null || value === undefined) return false;

  if (fieldConfig.validate) {
    return fieldConfig.validate(value);
  }

  // Basic type validation
  switch (fieldConfig.dataType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
    case 'float':
    case 'integer':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
};

/**
 * Pure function to extract metadata for an individual
 */
export const extractIndividualMetadata = (
  individual: Individual,
  context: Omit<TransformationContext, 'individual'>,
): IndividualMetadata => {
  const metadata: IndividualMetadata = {};

  // Get individual-level metadata fields
  const individualFields = getMetadataFieldsByScope('individual');

  for (const fieldConfig of individualFields) {
    try {
      // Create context with individual
      const individualContext: TransformationContext = {
        ...context,
        individual,
      };

      // Transform the raw data
      let value: unknown = null;
      if (fieldConfig.transform) {
        value = fieldConfig.transform(individualContext);
      }

      // Validate the value
      if (
        value !== null &&
        value !== undefined &&
        !validateValue(value, fieldConfig)
      ) {
        console.warn(`Validation failed for ${fieldConfig.fieldName}:`, value);
        continue;
      }

      // Apply PII masking if required
      if (value !== null && value !== undefined) {
        value = maskValue(value, fieldConfig);
      }

      // Store the value
      if (value !== null && value !== undefined) {
        (metadata as Record<string, unknown>)[fieldConfig.fieldName] = value;
      }
    } catch (error) {
      console.warn(
        `Error extracting metadata for ${fieldConfig.fieldName}:`,
        error,
      );
    }
  }

  return metadata;
};

/**
 * Pure function to extract metadata for a family
 */
export const extractFamilyMetadata = (
  family: Family,
  context: Omit<TransformationContext, 'family'>,
): FamilyMetadata => {
  const metadata: FamilyMetadata = {};

  // Get family-level metadata fields
  const familyFields = getMetadataFieldsByScope('family');

  for (const fieldConfig of familyFields) {
    try {
      // Create context with family
      const familyContext: TransformationContext = {
        ...context,
        family,
      };

      // Transform the raw data
      let value: unknown = null;
      if (fieldConfig.transform) {
        value = fieldConfig.transform(familyContext);
      }

      // Validate the value
      if (
        value !== null &&
        value !== undefined &&
        !validateValue(value, fieldConfig)
      ) {
        console.warn(`Validation failed for ${fieldConfig.fieldName}:`, value);
        continue;
      }

      // Apply PII masking if required
      if (value !== null && value !== undefined) {
        value = maskValue(value, fieldConfig);
      }

      // Store the value
      if (value !== null && value !== undefined) {
        (metadata as Record<string, unknown>)[fieldConfig.fieldName] = value;
      }
    } catch (error) {
      console.warn(
        `Error extracting metadata for ${fieldConfig.fieldName}:`,
        error,
      );
    }
  }

  return metadata;
};

/**
 * Pure function to extract metadata for the entire tree
 */
export const extractTreeMetadata = (
  context: Omit<TransformationContext, 'individual' | 'family'>,
): TreeMetadata => {
  const metadata: TreeMetadata = {};

  // Get tree-level metadata fields
  const treeFields = getMetadataFieldsByScope('tree');

  for (const fieldConfig of treeFields) {
    try {
      // Transform the raw data
      let value: unknown = null;
      if (fieldConfig.transform) {
        value = fieldConfig.transform(context);
      }

      // Validate the value
      if (
        value !== null &&
        value !== undefined &&
        !validateValue(value, fieldConfig)
      ) {
        console.warn(`Validation failed for ${fieldConfig.fieldName}:`, value);
        continue;
      }

      // Apply PII masking if required
      if (value !== null && value !== undefined) {
        value = maskValue(value, fieldConfig);
      }

      // Store the value
      if (value !== null && value !== undefined) {
        (metadata as Record<string, unknown>)[fieldConfig.fieldName] = value;
      }
    } catch (error) {
      console.warn(
        `Error extracting metadata for ${fieldConfig.fieldName}:`,
        error,
      );
    }
  }

  return metadata;
};

/**
 * Pure function to transform individuals with metadata
 */
export const transformIndividualsWithMetadata = (
  individuals: Individual[],
  context: Omit<TransformationContext, 'individual' | 'family'>,
): IndividualWithMetadata[] => {
  return individuals.map((individual) => {
    const metadata = extractIndividualMetadata(individual, context);

    return {
      ...individual,
      metadata,
    };
  });
};

/**
 * Pure function to transform families with metadata
 */
export const transformFamiliesWithMetadata = (
  families: Family[],
  individualsWithMetadata: IndividualWithMetadata[],
  context: Omit<TransformationContext, 'individual' | 'family'>,
): FamilyWithMetadata[] => {
  // Create lookup for individuals with metadata
  const individualsById = new Map<string, IndividualWithMetadata>();
  individualsWithMetadata.forEach((ind) => {
    individualsById.set(ind.id, ind);
  });

  return families.map((family) => {
    const metadata = extractFamilyMetadata(family, context);

    return {
      id: family.id,
      husband: family.husband
        ? individualsById.get(family.husband.id)
        : undefined,
      wife: family.wife ? individualsById.get(family.wife.id) : undefined,
      children: family.children
        .map((child) => individualsById.get(child.id))
        .filter((ind): ind is IndividualWithMetadata => ind !== undefined),
      metadata,
    };
  });
};

/**
 * Main transformation function - pure function
 */
export const transformGedcomDataWithMetadata = (
  individuals: Individual[],
  families: Family[],
  rootIndividual?: Individual,
): GedcomDataWithMetadata => {
  // Create transformation context
  const context: Omit<TransformationContext, 'individual' | 'family'> = {
    allIndividuals: individuals,
    allFamilies: families,
    rootIndividual,
  };

  // Transform individuals with metadata
  const individualsWithMetadata = transformIndividualsWithMetadata(
    individuals,
    context,
  );

  // Transform families with metadata
  const familiesWithMetadata = transformFamiliesWithMetadata(
    families,
    individualsWithMetadata,
    context,
  );

  // Extract tree-level metadata
  const treeMetadata = extractTreeMetadata(context);

  return {
    individuals: individualsWithMetadata,
    families: familiesWithMetadata,
    metadata: treeMetadata,
  };
};
