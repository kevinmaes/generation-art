/**
 * XState store for managing country color data
 * Handles loading state, caching, and error handling
 */

import { createStore } from '@xstate/store';
import type { CountryColors, CountryColorMap } from '../../../shared/types';
import countryColorsData from '../../../shared/data/country-colors.json';

/**
 * Store state type
 */
export type CountryColorsState =
  | { status: 'idle'; countryColors: CountryColorMap; error: null }
  | { status: 'loading'; countryColors: CountryColorMap; error: null }
  | { status: 'loaded'; countryColors: CountryColorMap; error: null }
  | { status: 'error'; countryColors: CountryColorMap; error: string };

/**
 * Initial state - we can load immediately since data is imported
 */
const initialState: CountryColorsState = {
  status: 'idle',
  countryColors: {},
  error: null,
};

/**
 * Create the XState store for country colors
 */
export const countryColorsStore = createStore({
  context: initialState as CountryColorsState,
  on: {
    load: (context) => {
      // If already loaded, return unchanged
      if (context.status === 'loaded') {
        return context;
      }

      try {
        // Load country colors data
        const data = countryColorsData as unknown as CountryColorMap;
        return {
          status: 'loaded',
          countryColors: data,
          error: null,
        } satisfies CountryColorsState;
      } catch (error) {
        return {
          status: 'error',
          countryColors: {},
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load country colors',
        } satisfies CountryColorsState;
      }
    },
    reset: () => initialState,
  },
});

/**
 * Selectors for accessing store data
 */
export const countryColorsSelectors = {
  /**
   * Get the full country colors map
   */
  getCountryColors: (state: CountryColorsState) => state.countryColors,

  /**
   * Get colors for a specific country
   */
  getCountryColorsByIso2: (
    state: CountryColorsState,
    iso2: string,
  ): CountryColors | null => {
    if (!iso2) return null;
    const upperIso2 = iso2.toUpperCase();
    return state.countryColors[upperIso2] ?? null;
  },

  /**
   * Get primary color for a country
   */
  getPrimaryColor: (state: CountryColorsState, iso2: string): string | null => {
    const colors = countryColorsSelectors.getCountryColorsByIso2(state, iso2);
    return colors?.primary.hex ?? null;
  },

  /**
   * Get secondary color for a country (or fallback to darker primary)
   */
  getSecondaryColor: (
    state: CountryColorsState,
    iso2: string,
  ): string | null => {
    const colors = countryColorsSelectors.getCountryColorsByIso2(state, iso2);

    // If there's a secondary color, use it
    if (colors?.secondary?.hex) {
      return colors.secondary.hex;
    }

    // If no secondary, create a darker shade of primary
    if (colors?.primary.hex) {
      return darkenColor(colors.primary.hex, 0.2);
    }

    return null;
  },

  /**
   * Check if data is loaded
   */
  isLoaded: (state: CountryColorsState) => state.status === 'loaded',

  /**
   * Get any error
   */
  getError: (state: CountryColorsState) => state.error,

  /**
   * Get the loading status
   */
  getStatus: (state: CountryColorsState) => state.status,
};

/**
 * Helper function to darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor((num >> 16) * (1 - percent));
  const g = Math.floor(((num >> 8) & 0x00ff) * (1 - percent));
  const b = Math.floor((num & 0x0000ff) * (1 - percent));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Initialize the store on first import
 * Since the data is imported statically, we can load it immediately
 */
countryColorsStore.send({ type: 'load' });
