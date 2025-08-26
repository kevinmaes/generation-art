/**
 * Node Country Color Transformer
 *
 * Colors nodes based on the countries associated with individuals:
 * - Birth country (primary)
 * - Death country (secondary)
 * - Marriage country (tertiary)
 *
 * Uses country flag colors from the country-colors.json data.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from '../types';
import type { AugmentedIndividual } from '../../../../shared/types';
import { getIndividualOrWarn } from '../utils/transformer-guards';
import { createTransformerInstance } from '../utils';
import countryColors from '../../../../shared/data/country-colors.json';

interface CountryColor {
  primary: {
    hex: string;
    oklch: number[];
    name: string;
    proportion: number;
  };
  secondary?: {
    hex: string;
    oklch: number[];
    name: string;
    proportion: number;
  };
  tertiary?: {
    hex: string;
    oklch: number[];
    name: string;
    proportion: number;
  };
  quaternary?: {
    hex: string;
    oklch: number[];
    name: string;
    proportion: number;
  };
}

/**
 * Configuration for the node country color transformer
 */
export const nodeCountryColorConfig: VisualTransformerConfig = {
  id: 'node-country-color',
  name: 'Node Country Color',
  description:
    'Colors nodes based on their birth or death country using flag colors.',
  shortDescription: 'Color by country',
  transform: nodeCountryColorTransform,
  categories: ['color', 'geographic'],
  availableDimensions: [],
  defaultPrimaryDimension: 'generation',
  visualParameters: [
    {
      name: 'colorMode',
      label: 'Color Mode',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { value: 'primary', label: 'Primary Flag Color' },
        { value: 'blend', label: 'Blend Flag Colors' },
        { value: 'gradient', label: 'Flag Gradient' },
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
 * Extract ISO2 country code from a place string
 * This is a simplified version - in production, you'd use CountryMatcher
 */
function extractCountryFromPlace(place?: string): string | null {
  if (!place) return null;

  // For now, use a simple mapping for common patterns
  // In production, integrate with CountryMatcher class
  const countryPatterns: Record<string, string> = {
    USA: 'US',
    'United States': 'US',
    England: 'GB',
    'United Kingdom': 'GB',
    UK: 'GB',
    France: 'FR',
    Germany: 'DE',
    Ireland: 'IE',
    Canada: 'CA',
    Australia: 'AU',
    'New Zealand': 'NZ',
    Italy: 'IT',
    Spain: 'ES',
    Netherlands: 'NL',
    Belgium: 'BE',
    Switzerland: 'CH',
    Austria: 'AT',
    Poland: 'PL',
    Russia: 'RU',
    China: 'CN',
    Japan: 'JP',
    India: 'IN',
    Brazil: 'BR',
    Mexico: 'MX',
    Argentina: 'AR',
  };

  // Check if place contains any known country
  const upperPlace = place.toUpperCase();
  for (const [pattern, iso2] of Object.entries(countryPatterns)) {
    if (upperPlace.includes(pattern.toUpperCase())) {
      return iso2;
    }
  }

  // Check if the last part after comma might be a country
  const parts = place.split(',');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    for (const [pattern, iso2] of Object.entries(countryPatterns)) {
      if (lastPart.toUpperCase() === pattern.toUpperCase()) {
        return iso2;
      }
    }
  }

  return null;
}

/**
 * Get color for a country ISO2 code
 */
function getCountryColor(
  iso2: string | null,
  colorMode: string,
): string | null {
  if (!iso2) return null;

  const countryData = (
    countryColors as unknown as Record<string, CountryColor>
  )[iso2];
  if (!countryData) return null;

  switch (colorMode) {
    case 'blend': {
      // Blend primary and secondary colors if available
      if (countryData.secondary) {
        const primary = countryData.primary.hex;
        const secondary = countryData.secondary.hex;
        return blendColors(primary, secondary, 0.5);
      }
      return countryData.primary.hex;
    }
    case 'gradient': {
      // For gradient mode, return primary color (gradient would be applied in rendering)
      return countryData.primary.hex;
    }
    case 'primary':
    default:
      return countryData.primary.hex;
  }
}

/**
 * Blend two hex colors
 */
function blendColors(color1: string, color2: string, ratio: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
 * Calculate node color based on country associations
 */
function calculateNodeColor(
  context: TransformerContext,
  individualId: string,
): string {
  const { gedcomData, visual } = context;

  // Find the individual
  const individual = getIndividualOrWarn(
    gedcomData,
    individualId,
    'Node country color transformer',
  ) as AugmentedIndividual | null;

  if (!individual) {
    return (visual.fallbackColor as string) || '#808080';
  }

  const colorMode = (visual.colorMode as string) || 'primary';
  const colorIntensity = (visual.colorIntensity as number) || 0.8;
  const fallbackColor = (visual.fallbackColor as string) || '#808080';

  // Try to extract country from birth place first, then death place
  let countryIso2: string | null = null;

  // Primary: Check birth place
  const birthPlace = individual.birth?.place;
  countryIso2 = extractCountryFromPlace(birthPlace);

  // Fallback: Check death place if birth didn't yield a country
  if (!countryIso2) {
    const deathPlace = individual.death?.place;
    countryIso2 = extractCountryFromPlace(deathPlace);
  }

  // Get color for the country
  let color = getCountryColor(countryIso2, colorMode);

  if (!color) {
    return fallbackColor;
  }

  // Apply color intensity
  color = applyColorIntensity(color, colorIntensity);

  return color;
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
    const calculatedColor = calculateNodeColor(context, individual.id);

    // Preserve existing visual metadata and update color
    updatedIndividuals[individual.id] = {
      ...currentMetadata,
      color: calculatedColor,
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
