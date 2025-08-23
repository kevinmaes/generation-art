import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { AugmentedIndividual } from '../components/types';
import {
  gedcomDataReducer,
  initialState,
  getLoadingState,
  getErrorState,
} from './gedcomDataReducer';

interface UseGedcomDataOptions {
  jsonFile: string;
  onDataLoaded?: (data: AugmentedIndividual[]) => void;
  onError?: (error: string) => void;
}

interface UseGedcomDataReturn {
  data: AugmentedIndividual[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGedcomData({
  jsonFile,
  onDataLoaded,
  onError,
}: UseGedcomDataOptions): UseGedcomDataReturn {
  const [state, dispatch] = useReducer(gedcomDataReducer, initialState);

  // Store callbacks in refs to avoid dependency issues
  const onDataLoadedRef = useRef(onDataLoaded);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const loadData = useCallback(async () => {
    if (!jsonFile) return;

    dispatch({ type: 'fetch_started' });

    try {
      const response = await fetch(jsonFile);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Family data file not found: ${jsonFile}`);
        } else {
          throw new Error(
            `HTTP ${String(response.status)}: ${response.statusText}`,
          );
        }
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(
          `Expected JSON but got ${contentType ?? 'unknown content type'}`,
        );
      }

      const jsonData = (await response.json()) as unknown;

      // Validate the data structure
      if (!Array.isArray(jsonData)) {
        throw new Error(
          'Invalid data format: expected an array of individuals',
        );
      }

      // Basic validation of individual structure
      const isValidIndividual = (
        item: unknown,
      ): item is AugmentedIndividual => {
        return (
          item !== null &&
          typeof item === 'object' &&
          'id' in item &&
          'name' in item &&
          typeof (item as AugmentedIndividual).id === 'string' &&
          typeof (item as AugmentedIndividual).name === 'string'
        );
      };

      if (!jsonData.every(isValidIndividual)) {
        throw new Error(
          'Invalid data format: individuals missing required fields',
        );
      }

      dispatch({ type: 'fetch_succeeded', payload: jsonData });
      onDataLoadedRef.current?.(jsonData);
    } catch (err) {
      let errorMessage: string;

      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = `Network error: Unable to load data from ${jsonFile}`;
      } else if (err instanceof SyntaxError) {
        errorMessage = `Invalid JSON format in ${jsonFile}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred while loading data';
      }

      dispatch({ type: 'fetch_failed', payload: errorMessage });
      onErrorRef.current?.(errorMessage);
    }
  }, [jsonFile]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    dispatch({ type: 'refetch' });
    void loadData();
  }, [loadData]);

  // Derive the API-compatible values from the reducer state
  const data = state.data;
  const loading = getLoadingState(state);
  const error = getErrorState(state);

  return { data, loading, error, refetch };
}
