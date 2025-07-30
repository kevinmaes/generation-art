/**
 * Example usage of the metadata system
 * Shows how to integrate with the existing augmentation pipeline
 */

import { addMetadataToAugmentedIndividuals } from './integration';
import type {
  Individual,
  Family,
  AugmentedIndividual,
} from '../../shared/types';

/**
 * Example: How to add metadata to the existing augmentIndividuals function
 * This can be added as a final step in the build-gedcom.ts script
 */
export const exampleAddMetadataToExistingPipeline = (
  augmentedIndividuals: Individual[],
  families: Family[],
): AugmentedIndividual[] => {
  console.log('Adding metadata to individuals...');

  // Add metadata to individuals
  const individualsWithMetadata = addMetadataToAugmentedIndividuals(
    augmentedIndividuals,
    families,
  );

  console.log(
    `Added metadata to ${String(individualsWithMetadata.length)} individuals`,
  );

  // Example: Check what metadata was added
  const sampleIndividual = individualsWithMetadata[0];
  // if (sampleIndividual) {
  console.log('Sample individual metadata:', {
    id: sampleIndividual.id,
    name: sampleIndividual.name,
    metadata: sampleIndividual.metadata,
  });
  // }

  return individualsWithMetadata;
};

/**
 * Example: How to use the metadata in the art generation
 * This could be integrated into the FamilyTreeSketch
 */
export const exampleUseMetadataInArtGeneration = (
  individualsWithMetadata: AugmentedIndividual[],
) => {
  // Example: Use lifespan for node size
  const nodeSizes = individualsWithMetadata.map((individual) => {
    const lifespan = individual.metadata.lifespan;
    if (typeof lifespan === 'number' && isFinite(lifespan)) {
      // Normalize lifespan to node size (0.1 to 1.0)
      return 0.1 + lifespan * 0.9;
    }
    return 0.5; // Default size
  });

  // Example: Use birth month for color
  const nodeColors = individualsWithMetadata.map((individual) => {
    const birthMonth = individual.metadata.birthMonth;
    if (
      typeof birthMonth === 'number' &&
      Number.isInteger(birthMonth) &&
      birthMonth >= 1 &&
      birthMonth <= 12
    ) {
      // Map month to hue (0-360)
      return (birthMonth - 1) * 30;
    }
    return 0; // Default color
  });

  // Example: Use isAlive for opacity
  const nodeOpacities = individualsWithMetadata.map((individual) => {
    const isAlive = individual.metadata.isAlive;
    if (typeof isAlive === 'boolean') {
      return isAlive ? 1.0 : 0.6; // Living people more opaque
    }
    return 0.8; // Default opacity
  });

  return {
    nodeSizes,
    nodeColors,
    nodeOpacities,
  };
};

/**
 * Example: How to filter individuals by metadata
 */
export const exampleFilterByMetadata = (
  individualsWithMetadata: AugmentedIndividual[],
) => {
  // Find all living individuals
  const livingIndividuals = individualsWithMetadata.filter(
    (ind) => ind.metadata.isAlive === true,
  );

  // Find individuals born in summer (June, July, August)
  const summerBirths = individualsWithMetadata.filter((ind) => {
    const birthMonth = ind.metadata.birthMonth;
    return (
      typeof birthMonth === 'number' &&
      Number.isInteger(birthMonth) &&
      birthMonth >= 1 &&
      birthMonth <= 12 &&
      birthMonth >= 6 &&
      birthMonth <= 8
    );
  });

  // Find individuals with long lifespans (top 25%)
  const lifespans = individualsWithMetadata
    .map((ind) => ind.metadata.lifespan)
    .filter(
      (val): val is number =>
        typeof val === 'number' && !isNaN(val) && isFinite(val),
    )
    .sort((a, b) => b - a);

  const top25Percentile = lifespans[Math.floor(lifespans.length * 0.25)];
  const longLivedIndividuals = individualsWithMetadata.filter((ind) => {
    const lifespan = ind.metadata.lifespan;
    return (
      typeof lifespan === 'number' &&
      !isNaN(lifespan) &&
      isFinite(lifespan) &&
      typeof top25Percentile === 'number' &&
      lifespan >= top25Percentile
    );
  });

  return {
    living: livingIndividuals,
    summerBirths,
    longLived: longLivedIndividuals,
  };
};
