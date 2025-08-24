import { createStoreHook } from '@xstate/store/react';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';

// Discriminated union state type for dual data loading
export type DualGedcomDataState =
  | { status: 'idle'; fullData: null; llmData: null; error: null }
  | { status: 'loading'; fullData: null; llmData: null; error: null }
  | {
      status: 'success';
      fullData: GedcomDataWithMetadata;
      llmData: LLMReadyData;
      error: null;
    }
  | { status: 'error'; fullData: null; llmData: null; error: string };

// Create the custom hook for the store managing dual GEDCOM data loading
export const useGedcomDataWithLLMStore = createStoreHook({
  context: {
    status: 'idle',
    fullData: null,
    llmData: null,
    error: null,
  } as DualGedcomDataState,
  on: {
    fetchStarted: () =>
      ({
        status: 'loading',
        fullData: null,
        llmData: null,
        error: null,
      }) satisfies DualGedcomDataState,

    fetchSucceeded: (
      _: DualGedcomDataState,
      event: { fullData: GedcomDataWithMetadata; llmData: LLMReadyData },
    ) =>
      ({
        status: 'success',
        fullData: event.fullData,
        llmData: event.llmData,
        error: null,
      }) satisfies DualGedcomDataState,

    fetchFailed: (_: DualGedcomDataState, event: { error: string }) =>
      ({
        status: 'error',
        fullData: null,
        llmData: null,
        error: event.error,
      }) satisfies DualGedcomDataState,

    refetch: (context: DualGedcomDataState) => {
      // Only allow refetch from error or success states
      if (context.status === 'error' || context.status === 'success') {
        return {
          status: 'loading',
          fullData: null,
          llmData: null,
          error: null,
        } satisfies DualGedcomDataState;
      }
      return context;
    },
  },
});
