import { createStoreHook } from '@xstate/store/react';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';

interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

type AppDataState =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: DualGedcomData; error: null }
  | { status: 'error'; data: null; error: string };

// Store configuration to be used by both createStore and createStoreHook
const storeConfig = {
  context: {
    status: 'idle',
    data: null,
    error: null,
  } as AppDataState,
  on: {
    startLoading: () =>
      ({
        status: 'loading',
        data: null,
        error: null,
      }) satisfies AppDataState,
    loadSuccess: (_: AppDataState, event: { data: DualGedcomData }) =>
      ({
        status: 'success',
        data: event.data,
        error: null,
      }) satisfies AppDataState,
    loadError: (_: AppDataState, event: { error: string }) =>
      ({
        status: 'error',
        data: null,
        error: event.error,
      }) satisfies AppDataState,
    reset: () =>
      ({
        status: 'idle',
        data: null,
        error: null,
      }) satisfies AppDataState,
  },
};

// Create the custom hook for the store
// This returns a hook that provides [selectedValue, store] tuple
export const useAppDataStore = createStoreHook(storeConfig);
