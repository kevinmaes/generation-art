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
  NodeVisualMetadata,
  NodeVisualLayer,
  VisualTransformerConfig,
} from '../types';
import type {
  AugmentedIndividual,
  CountryColorMap,
  CountryColors,
  ISO2,
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
    {
      name: 'layerMode',
      label: 'Layer Mode',
      type: 'select',
      defaultValue: 'single',
      options: [
        { value: 'single', label: 'Single layer (fill + stroke)' },
        { value: 'multi', label: 'Multiple layers (flag colors)' },
      ],
      description: 'How to apply country colors',
    },
    {
      name: 'useNewLayerSystem',
      label: 'Use new layer system',
      type: 'boolean',
      defaultValue: false,
      description: 'Use the new layer-based rendering system',
    },
  ],
  createTransformerInstance: (params) =>
    createTransformerInstance(params, nodeCountryColorTransform, []),
  multiInstance: false,
};

/**
 * Get primary color for a country ISO2 code
 */
function getCountryPrimaryColor(iso2: ISO2 | null): string | null {
  if (!iso2) return null;

  const countryData = (countryColors as unknown as CountryColorMap)[iso2];

  return countryData?.primary?.hex || null;
}

/**
 * Get secondary color for a country ISO2 code
 */
function getCountrySecondaryColor(iso2: ISO2 | null): string | null {
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
 * Get all colors for a country ISO2 code
 */
function getCountryColors(iso2: ISO2 | null): CountryColors | null {
  if (!iso2) return null;

  return (countryColors as unknown as CountryColorMap)[iso2] || null;
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
  const { gedcomData, visualMetadata, visual } = context;

  // Extract visual parameters
  const layerMode = (visual.layerMode as string) || 'single';
  const useNewLayerSystem = (visual.useNewLayerSystem as boolean) || false;
  const colorIntensity = (visual.colorIntensity as number) || 0.8;
  const fallbackColor = (visual.fallbackColor as string) || '#808080';

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual): individual is AugmentedIndividual =>
      individual !== null && individual !== undefined,
  );

  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Create updated individual visual metadata
  const updatedIndividuals: Record<string, NodeVisualMetadata> = {};

  // Apply color calculations to each individual
  individuals.forEach((individual) => {
    const currentMetadata = visualMetadata.individuals?.[individual.id] ?? {};

    // Get country ISO codes
    const birthCountryIso2 = individual.birth?.country?.iso2 || null;
    const deathCountryIso2 = individual.death?.country?.iso2 || null;
    const countryIso2 = birthCountryIso2 || deathCountryIso2;

    // Get country colors
    const countryColorsData = getCountryColors(countryIso2);

    if (useNewLayerSystem && layerMode === 'multi' && countryColorsData) {
      // Create multiple layers with different flag colors
      const layers: NodeVisualLayer[] = [];

      // Ensure we have existing layers or create new ones
      const existingLayers = currentMetadata.nodeLayers || [];

      // Get up to 4 flag colors
      const flagColors = [
        countryColorsData.primary?.hex,
        countryColorsData.secondary?.hex,
        countryColorsData.tertiary?.hex,
        countryColorsData.quaternary?.hex,
      ].filter(Boolean) as string[];

      if (flagColors.length > 0) {
        // If we have existing layers, update their colors
        // Otherwise create new layers
        const layerCount = Math.max(
          existingLayers.length,
          Math.min(flagColors.length, 3),
        );

        for (let i = 0; i < layerCount; i++) {
          const existingLayer = existingLayers[i];
          const flagColor = flagColors[i % flagColors.length];
          const adjustedColor = applyColorIntensity(flagColor, colorIntensity);
          const layerOpacity = 0.9 - i * 0.2; // More visible opacity differences

          layers.push({
            shape: existingLayer?.shape || currentMetadata.shape,
            shapeProfile:
              existingLayer?.shapeProfile || currentMetadata.shapeProfile,
            fill: {
              color: adjustedColor,
              opacity: layerOpacity,
            },
            stroke:
              i === 0 && existingLayer?.stroke
                ? existingLayer.stroke
                : undefined,
            offset: {
              x: i * 8, // Increased offset for better visibility
              y: i * 8, // Increased offset for better visibility
            },
            source: 'node-country-color',
          });
        }
      } else {
        // No country colors, use fallback
        layers.push({
          shape: currentMetadata.shape,
          shapeProfile: currentMetadata.shapeProfile,
          fill: {
            color: fallbackColor,
            opacity: 0.8,
          },
          offset: { x: 0, y: 0 },
          source: 'node-country-color',
        });
      }

      updatedIndividuals[individual.id] = {
        ...currentMetadata,
        nodeLayers: layers,
      };
    } else {
      // Use traditional single-layer approach
      const calculatedColors = calculateNodeColors(context, individual.id);

      if (useNewLayerSystem) {
        // Create a single layer with the calculated colors
        const layers: NodeVisualLayer[] = currentMetadata.nodeLayers || [];

        // Update or add the country color layer
        const countryColorLayer: NodeVisualLayer = {
          shape: currentMetadata.shape,
          shapeProfile: currentMetadata.shapeProfile,
          fill: {
            color: calculatedColors.color,
            opacity: currentMetadata.opacity ?? 0.8,
          },
          stroke: calculatedColors.strokeColor
            ? {
                color: calculatedColors.strokeColor,
                weight: 2,
                opacity: 1,
              }
            : undefined,
          offset: { x: 0, y: 0 },
          source: 'node-country-color',
        };

        // Replace or add our layer
        const otherLayers = layers.filter(
          (l) => l.source !== 'node-country-color',
        );

        updatedIndividuals[individual.id] = {
          ...currentMetadata,
          nodeLayers: [...otherLayers, countryColorLayer],
        };
      } else {
        // Legacy approach - just update color properties
        updatedIndividuals[individual.id] = {
          ...currentMetadata,
          color: calculatedColors.color,
          strokeColor: calculatedColors.strokeColor,
          strokeWeight: calculatedColors.strokeColor ? 2 : 0,
        };
      }
    }
  });

  // Small delay to simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1));

  return {
    visualMetadata: {
      individuals: updatedIndividuals,
    },
  };
}
