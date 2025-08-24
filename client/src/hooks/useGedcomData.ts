import { useEffect, useCallback, useRef } from 'react';
import { validateFlexibleGedcomData } from '../../../shared/types';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import { rebuildGraphData } from '../graph-rebuilder';
import {
  useFamilyTreeStore,
  familyTreeStore,
} from '../stores/family-tree.store';

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

// Re-export types from store for backward compatibility
export type { FamilyTreeState as GedcomDataState } from '../stores/family-tree.store';

export function useGedcomData({
  jsonFile,
  onDataLoaded,
  onError,
}: UseGedcomDataOptions): UseGedcomDataReturn {
  // Use family tree store for state management
  const [state] = useFamilyTreeStore((state) => state.context);
  const store = familyTreeStore;

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

    store.send({ type: 'fetchStarted' });

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

      // For single file loading, set llmData to empty structure
      store.send({
        type: 'fetchSucceeded',
        fullData: dataWithGraph,
        llmData: {
          individuals: {},
          families: {},
          metadata: dataWithGraph.metadata,
        },
      });
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

      store.send({ type: 'fetchFailed', error: errorMessage });
      onErrorRef.current?.(errorMessage);
    }
  }, [jsonFile, store]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    store.send({ type: 'refetch' });
    void loadData();
  }, [loadData, store]);

  // Return values compatible with existing API
  // Map fullData to data for backward compatibility
  return {
    data: state.fullData,
    loading: state.status === 'loading',
    error: state.error,
    refetch,
  };
}
