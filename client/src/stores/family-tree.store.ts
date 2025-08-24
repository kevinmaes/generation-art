import * as React from 'react';
import { createStore } from '@xstate/store';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';

// Discriminated union state type for family tree data loading
// Handles both single file (full only) and dual file (full + LLM) scenarios
export type FamilyTreeState =
  | { status: 'idle'; fullData: null; llmData: null; error: null }
  | { status: 'loading'; fullData: null; llmData: null; error: null }
  | {
      status: 'success';
      fullData: GedcomDataWithMetadata;
      llmData: LLMReadyData;
      error: null;
    }
  | { status: 'error'; fullData: null; llmData: null; error: string };

// Store configuration for family tree data
const familyTreeStoreConfig = {
  context: {
    status: 'idle',
    fullData: null,
    llmData: null,
    error: null,
  } as FamilyTreeState,
  on: {
    fetchStarted: () =>
      ({
        status: 'loading',
        fullData: null,
        llmData: null,
        error: null,
      }) satisfies FamilyTreeState,
    fetchSucceeded: (
      _: FamilyTreeState,
      event: { fullData: GedcomDataWithMetadata; llmData: LLMReadyData },
    ) =>
      ({
        status: 'success',
        fullData: event.fullData,
        llmData: event.llmData,
        error: null,
      }) satisfies FamilyTreeState,
    fetchFailed: (_: FamilyTreeState, event: { error: string }) =>
      ({
        status: 'error',
        fullData: null,
        llmData: null,
        error: event.error,
      }) satisfies FamilyTreeState,
    refetch: (context: FamilyTreeState) => {
      // Only allow refetch from error or success states
      if (context.status === 'error' || context.status === 'success') {
        return {
          status: 'loading',
          fullData: null,
          llmData: null,
          error: null,
        } satisfies FamilyTreeState;
      }
      return context;
    },
  },
};

// Create singleton store instance
export const familyTreeStore = createStore(familyTreeStoreConfig);

// Create hook that uses the singleton store instance
export const useFamilyTreeStore = () => {
  const [snapshot, setSnapshot] = React.useState(() =>
    familyTreeStore.getSnapshot(),
  );

  React.useEffect(() => {
    const subscription = familyTreeStore.subscribe(() => {
      setSnapshot(familyTreeStore.getSnapshot());
    });
    return () => subscription.unsubscribe();
  }, []);

  // Return just the context (the actual state)
  return [snapshot.context, familyTreeStore.send] as const;
};
