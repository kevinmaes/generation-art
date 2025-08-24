import React, {
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { validateFlexibleGedcomData } from '../../../shared/types';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import { rebuildGraphData } from '../graph-rebuilder';
import { useFamilyTreeStore, familyTreeStore } from '../stores/family-tree.store';
import {
  FamilyDataContext,
  type FamilyDataContextValue,
} from './familyDataContextDefinition';

interface FamilyDataProviderProps {
  jsonFile: string;
  children: ReactNode;
  onDataLoaded?: (data: GedcomDataWithMetadata) => void;
  onError?: (error: string) => void;
}

export function FamilyDataProvider({
  jsonFile,
  children,
  onDataLoaded,
  onError,
}: FamilyDataProviderProps): React.ReactElement {
  // Use family tree store directly
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

  // Construct the context value from store state
  const contextValue = useMemo<FamilyDataContextValue>(() => {
    switch (state.status) {
      case 'loading':
        return {
          type: 'loading',
          data: null,
          error: null,
          refetch,
        };
      case 'error':
        return {
          type: 'error',
          data: null,
          error: state.error,
          refetch,
        };
      case 'success':
        return {
          type: 'success',
          data: state.fullData,
          error: null,
          refetch,
        };
      case 'idle':
      default:
        return {
          type: 'idle',
          data: null,
          error: null,
          refetch,
        };
    }
  }, [state, refetch]);

  return (
    <FamilyDataContext.Provider value={contextValue}>
      {children}
    </FamilyDataContext.Provider>
  );
}
