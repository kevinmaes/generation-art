/**
 * Node Country Color Transformer
 *
 * Colors nodes based on the countries associated with individuals:
 * - Fill color: Birth country's primary flag color
 * - Stroke color: Birth country's secondary flag color (or death country's primary if different)
 *
 * Uses country flag colors from the country-colors.json data.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from '../types';
import type {
  AugmentedIndividual,
  CountryColorMap,
} from '../../../../shared/types';
import { getIndividualOrWarn } from '../utils/transformer-guards';
import { createTransformerInstance } from '../utils';
import countryColors from '../../../../shared/data/country-colors.json';

/**
 * Configuration for the node country color transformer
 */
export const nodeCountryColorConfig: VisualTransformerConfig = {
  id: 'node-country-color',
  name: 'Node Country Color',
  description:
    'Colors nodes with birth country flag colors - primary for fill, secondary for stroke.',
  shortDescription: 'Country flag colors',
  transform: nodeCountryColorTransform,
  categories: ['color', 'geographic'],
  availableDimensions: [],
  defaultPrimaryDimension: 'generation',
  visualParameters: [
    {
      name: 'strokeMode',
      label: 'Stroke Color',
      type: 'select',
      defaultValue: 'secondary',
      options: [
        { value: 'secondary', label: 'Secondary flag color' },
        { value: 'death', label: 'Death country color' },
        { value: 'darker', label: 'Darker shade of fill' },
        { value: 'none', label: 'No stroke' },
      ],
    },
    {
      name: 'fallbackColor',
      label: 'Fallback Color',
      type: 'color',
      defaultValue: '#808080',
    },
    {
      name: 'colorIntensity',
      label: 'Color Intensity',
      type: 'range',
      min: 0.3,
      max: 1.0,
      step: 0.1,
      defaultValue: 0.8,
    },
  ],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, nodeCountryColorTransform, []),
  multiInstance: false,
};

/**
 * Get primary color for a country ISO2 code
 */
function getCountryPrimaryColor(iso2: string | null): string | null {
  if (!iso2) return null;

  const countryData = (countryColors as unknown as CountryColorMap)[iso2];

  return countryData?.primary?.hex || null;
}

/**
 * Get secondary color for a country ISO2 code
 */
function getCountrySecondaryColor(iso2: string | null): string | null {
  if (!iso2) return null;

  const countryData = (countryColors as unknown as CountryColorMap)[iso2];

  // Return secondary if available, otherwise return a darker shade of primary
  if (countryData?.secondary?.hex) {
    return countryData.secondary.hex;
  }

  if (countryData?.primary?.hex) {
    return darkenColor(countryData.primary.hex, 0.2);
  }

  return null;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor((num >> 16) * (1 - percent));
  const g = Math.floor(((num >> 8) & 0x00ff) * (1 - percent));
  const b = Math.floor((num & 0x0000ff) * (1 - percent));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Apply color intensity to a hex color
 */
function applyColorIntensity(color: string, intensity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Blend with gray (#808080) based on intensity
  const gray = 128;
  const adjustedR = Math.round(gray + (r - gray) * intensity);
  const adjustedG = Math.round(gray + (g - gray) * intensity);
  const adjustedB = Math.round(gray + (b - gray) * intensity);

  return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate node colors (fill and stroke) based on country associations
 */
function calculateNodeColors(
  context: TransformerContext,
  individualId: string,
): { color: string; strokeColor?: string } {
  const { gedcomData, visual } = context;

  // Find the individual
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Node country color transformer',
  ) as AugmentedIndividual | null;

  const fallbackColor = (visual.fallbackColor as string) || '#808080';
  const strokeMode = (visual.strokeMode as string) || 'secondary';
  const colorIntensity = (visual.colorIntensity as number) || 0.8;

  if (!individual) {
    return { color: fallbackColor };
  }

  // Get country ISO codes from pre-processed data (added by CLI)
  const birthCountryIso2 = individual.birth?.country?.iso2 || null;
  const deathCountryIso2 = individual.death?.country?.iso2 || null;

  // Get primary color from birth country (or death if no birth)
  const countryIso2 = birthCountryIso2 || deathCountryIso2;
  let fillColor = getCountryPrimaryColor(countryIso2);

  if (!fillColor) {
    return { color: fallbackColor };
  }

  // Apply color intensity to fill
  fillColor = applyColorIntensity(fillColor, colorIntensity);

  // Determine stroke color based on mode
  let strokeColor: string | undefined;

  switch (strokeMode) {
    case 'secondary': {
      // Use secondary color from birth country
      const secondaryColor = getCountrySecondaryColor(birthCountryIso2);
      strokeColor = secondaryColor || undefined;
      break;
    }
    case 'death': {
      // Use primary color from death country if different from birth
      if (deathCountryIso2 && deathCountryIso2 !== birthCountryIso2) {
        const deathColor = getCountryPrimaryColor(deathCountryIso2);
        strokeColor = deathColor || undefined;
      } else {
        const secondaryColor = getCountrySecondaryColor(birthCountryIso2);
        strokeColor = secondaryColor || undefined;
      }
      break;
    }
    case 'darker':
      // Use a darker shade of the fill color
      strokeColor = darkenColor(fillColor, 0.3);
      break;
    case 'none':
      // No stroke
      strokeColor = undefined;
      break;
    default: {
      const defaultSecondary = getCountrySecondaryColor(birthCountryIso2);
      strokeColor = defaultSecondary || undefined;
    }
  }

  // Apply intensity to stroke color if present
  if (strokeColor) {
    strokeColor = applyColorIntensity(strokeColor, colorIntensity);
  }

  return { color: fillColor, strokeColor };
}

/**
 * Node country color transform function
 * Applies country-based colors to all individuals
 */
export async function nodeCountryColorTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  const { gedcomData, visualMetadata } = context;

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual): individual is AugmentedIndividual =>
      individual !== null && individual !== undefined,
  );

  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, VisualMetadata> = {};

  // Apply color calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};
    const calculatedColors = calculateNodeColors(context, individual.id);

    // Preserve existing visual metadata and update colors
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      color: calculatedColors.color,
      strokeColor: calculatedColors.strokeColor,
      strokeWeight: calculatedColors.strokeColor ? 2 : 0, // Add stroke weight if there's a stroke color
    };
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
