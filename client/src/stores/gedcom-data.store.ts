import { createStoreHook } from '@xstate/store/react';
import type { GedcomDataWithMetadata } from '../../../shared/types';

export type GedcomDataState =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: GedcomDataWithMetadata; error: null }
  | { status: 'error'; data: null; error: string };

// Store configuration for GEDCOM data loading
const storeConfig = {
  context: {
    status: 'idle',
    data: null,
    error: null,
  } as GedcomDataState,
  on: {
    fetchStarted: () =>
      ({
        status: 'loading',
        data: null,
        error: null,
      }) satisfies GedcomDataState,
    
    fetchSucceeded: (_: GedcomDataState, event: { data: GedcomDataWithMetadata }) =>
      ({
        status: 'success',
        data: event.data,
        error: null,
      }) satisfies GedcomDataState,
    
    fetchFailed: (_: GedcomDataState, event: { error: string }) =>
      ({
        status: 'error',
        data: null,
        error: event.error,
      }) satisfies GedcomDataState,
    
    refetch: (context: GedcomDataState) => {
      // Only allow refetch from error or success states
      if (context.status === 'error' || context.status === 'success') {
        return {
          status: 'loading',
          data: null,
          error: null,
        } satisfies GedcomDataState;
      }
      return context;
    },
  },
};

// Create the custom hook for the store
export const useGedcomDataStore = createStoreHook(storeConfig);