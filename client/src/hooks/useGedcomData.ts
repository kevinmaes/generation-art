import { useReducer, useEffect, useCallback, useRef } from 'react';
import { validateFlexibleGedcomData } from '../../../shared/types';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import { rebuildGraphData } from '../graph-rebuilder';

interface UseGedcomDataOptions {
  jsonFile: string;
  onDataLoaded?: (data: GedcomDataWithMetadata) => void;
  onError?: (error: string) => void;
}

interface UseGedcomDataReturn {
  data: GedcomDataWithMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Discriminated union state type
export type GedcomDataState =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: GedcomDataWithMetadata; error: null }
  | { status: 'error'; data: null; error: string };

// Action types for the reducer
export type GedcomDataAction =
  | { type: 'fetch_started' }
  | { type: 'fetch_succeeded'; payload: GedcomDataWithMetadata }
  | { type: 'fetch_failed'; payload: string }
  | { type: 'refetch' };

// Reducer function with exhaustive event handling
export function gedcomDataReducer(
  state: GedcomDataState,
  action: GedcomDataAction,
): GedcomDataState {
  switch (action.type) {
    case 'fetch_started':
      return { status: 'loading', data: null, error: null };
    
    case 'fetch_succeeded':
      return { status: 'success', data: action.payload, error: null };
    
    case 'fetch_failed':
      return { status: 'error', data: null, error: action.payload };
    
    case 'refetch':
      // Only allow refetch from error or success states
      if (state.status === 'error' || state.status === 'success') {
        return { status: 'loading', data: null, error: null };
      }
      return state;
    
    default:
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = action;
      return state;
  }
}

export function useGedcomData({
  jsonFile,
  onDataLoaded,
  onError,
}: UseGedcomDataOptions): UseGedcomDataReturn {
  // Initialize reducer with idle state
  const [state, dispatch] = useReducer(gedcomDataReducer, {
    status: 'idle',
    data: null,
    error: null,
  });

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

      // Use Zod validation to handle flexible data formats
      const validatedData = validateFlexibleGedcomData(jsonData);

      // Rebuild graph data since functions can't be serialized to JSON
      const dataWithGraph = rebuildGraphData(validatedData);

      dispatch({ type: 'fetch_succeeded', payload: dataWithGraph });
      onDataLoadedRef.current?.(dataWithGraph);
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

  // Return values compatible with existing API
  return {
    data: state.data,
    loading: state.status === 'loading',
    error: state.error,
    refetch,
  };
}
