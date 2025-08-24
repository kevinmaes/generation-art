import { createStoreHook } from '@xstate/store/react';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';

// Discriminated union state type for GEDCOM data loading
// Handles both single file (full only) and dual file (full + LLM) scenarios
export type GedcomDataState =
  | { status: 'idle'; fullData: null; llmData: null; error: null }
  | { status: 'loading'; fullData: null; llmData: null; error: null }
  | {
      status: 'success';
      fullData: GedcomDataWithMetadata;
      llmData: LLMReadyData;
      error: null;
    }
  | { status: 'error'; fullData: null; llmData: null; error: string };

// Create the custom hook for the unified GEDCOM store
// This handles both single and dual data loading scenarios
export const useGedcomStore = createStoreHook({
  context: {
    status: 'idle',
    fullData: null,
    llmData: null,
    error: null,
  } as GedcomDataState,
  on: {
    fetchStarted: () =>
      ({
        status: 'loading',
        fullData: null,
        llmData: null,
        error: null,
      }) satisfies GedcomDataState,
    fetchSucceeded: (
      _: GedcomDataState,
      event: { fullData: GedcomDataWithMetadata; llmData: LLMReadyData },
    ) =>
      ({
        status: 'success',
        fullData: event.fullData,
        llmData: event.llmData,
        error: null,
      }) satisfies GedcomDataState,
    fetchFailed: (_: GedcomDataState, event: { error: string }) =>
      ({
        status: 'error',
        fullData: null,
        llmData: null,
        error: event.error,
      }) satisfies GedcomDataState,
    refetch: (context: GedcomDataState) => {
      // Only allow refetch from error or success states
      if (context.status === 'error' || context.status === 'success') {
        return {
          status: 'loading',
          fullData: null,
          llmData: null,
          error: null,
        } satisfies GedcomDataState;
      }
      return context;
    },
  },
});
