/**
 * Integration functions to add metadata to existing augmentation pipeline
 * Functional programming approach
 */

import { transformGedcomDataWithMetadata } from './transformation-pipeline';
import type {
  Individual,
  Family,
  AugmentedIndividual,
} from '../../shared/types';

/**
 * Pure function to add metadata to already augmented individuals
 * This can be used as a post-processing step in the existing pipeline
 */
export const addMetadataToAugmentedIndividuals = (
  augmentedIndividuals: Individual[],
  families: Family[],
  rootIndividual?: Individual,
): AugmentedIndividual[] => {
  const result = transformGedcomDataWithMetadata(
    augmentedIndividuals,
    families,
    rootIndividual,
  );
  return result.individuals;
};

/**
 * Pure function to create a simple metadata summary for an individual
 * Useful for debugging or quick inspection
 */
export const createMetadataSummary = (
  individual: AugmentedIndividual,
): Record<string, unknown> => {
  const summary: Record<string, unknown> = {
    id: individual.id,
    name: individual.name,
    hasMetadata: Object.keys(individual.metadata).length > 0,
    metadataFields: Object.keys(individual.metadata),
    metadataValues: individual.metadata,
  };

  return summary;
};

/**
 * Pure function to filter individuals by metadata criteria
 * Example: find all living individuals, or individuals born in a specific month
 */
export const filterIndividualsByMetadata = (
  individuals: AugmentedIndividual[],
  criteria: Partial<Record<keyof AugmentedIndividual['metadata'], unknown>>,
): AugmentedIndividual[] => {
  return individuals.filter((individual) => {
    return Object.entries(criteria).every(([key, value]) => {
      return (
        individual.metadata[key as keyof AugmentedIndividual['metadata']] ===
        value
      );
    });
  });
};

/**
 * Pure function to get metadata statistics across all individuals
 */
export const getMetadataStatistics = (
  individuals: AugmentedIndividual[],
): Record<string, unknown> => {
  const stats: Record<string, unknown> = {};

  // Count individuals with each metadata field
  const fieldCounts: Record<string, number> = {};
  const fieldValues: Record<string, unknown[]> = {};

  individuals.forEach((individual) => {
    Object.entries(individual.metadata).forEach(([field, value]) => {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      if (!(field in fieldValues)) {
        fieldValues[field] = [];
      }
      fieldValues[field].push(value);
    });
  });

  stats.fieldCounts = fieldCounts;
  stats.fieldValues = fieldValues;

  // Calculate some basic statistics
  if (fieldValues.lifespan.length > 0) {
    const lifespans = fieldValues.lifespan.filter(
      (v): v is number => typeof v === 'number',
    );
    if (lifespans.length > 0) {
      stats.lifespanStats = {
        min: Math.min(...lifespans),
        max: Math.max(...lifespans),
        avg:
          lifespans.reduce((a: number, b: number) => a + b, 0) /
          lifespans.length,
      };
    }
  }

  if (fieldValues.isAlive.length > 0) {
    const aliveCount = fieldValues.isAlive.filter((v) => v === true).length;
    stats.aliveCount = aliveCount;
    stats.deadCount = fieldValues.isAlive.length - aliveCount;
  }

  if (fieldValues.birthMonth.length > 0) {
    const monthCounts: Record<number, number> = {};
    fieldValues.birthMonth.forEach((month) => {
      if (typeof month === 'number') {
        monthCounts[month] = (monthCounts[month] ?? 0) + 1;
      }
    });
    stats.birthMonthDistribution = monthCounts;
  }

  return stats;
};
