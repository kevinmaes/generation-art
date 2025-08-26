/**
 * Hook to load and manage country color data using XState store
 * Provides country color lookup and loading state
 */

import { useEffect, useCallback } from 'react';
import { useSelector } from '@xstate/store/react';
import type { CountryColors, CountryColorMap } from '../../../shared/types';
import {
  countryColorsStore,
  countryColorsSelectors,
} from '../stores/country-colors.store';

interface UseCountryColorsReturn {
  countryColors: CountryColorMap;
  getCountryColors: (iso2: string) => CountryColors | null;
  getPrimaryColor: (iso2: string) => string | null;
  getSecondaryColor: (iso2: string) => string | null;
  isLoaded: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

/**
 * Hook to manage country color data with XState store
 */
export function useCountryColors(): UseCountryColorsReturn {
  // Select data from the XState store
  const state = useSelector(countryColorsStore, (snapshot) => snapshot.context);

  // Ensure data is loaded on mount
  useEffect(() => {
    if (state.status === 'idle') {
      countryColorsStore.send({ type: 'load' });
    }
  }, [state.status]);

  // Get full color data for a country
  const getCountryColors = useCallback((iso2: string): CountryColors | null => {
    return countryColorsSelectors.getCountryColorsByIso2(
      countryColorsStore.getSnapshot().context,
      iso2,
    );
  }, []);

  // Get primary color for a country
  const getPrimaryColor = useCallback((iso2: string): string | null => {
    return countryColorsSelectors.getPrimaryColor(
      countryColorsStore.getSnapshot().context,
      iso2,
    );
  }, []);

  // Get secondary color for a country
  const getSecondaryColor = useCallback((iso2: string): string | null => {
    return countryColorsSelectors.getSecondaryColor(
      countryColorsStore.getSnapshot().context,
      iso2,
    );
  }, []);

  return {
    countryColors: state.countryColors,
    getCountryColors,
    getPrimaryColor,
    getSecondaryColor,
    isLoaded: state.status === 'loaded',
    error: state.error,
    status: state.status,
  };
}
