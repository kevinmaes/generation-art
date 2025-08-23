import { useReducer, useEffect, useCallback, useRef } from 'react';
import { validateFlexibleGedcomData } from '../../../shared/types';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';
import { rebuildGraphData } from '../graph-rebuilder';

interface UseGedcomDataWithLLMOptions {
  baseFileName: string; // e.g., "kennedy" (without extension)
  onDataLoaded?: (data: {
    full: GedcomDataWithMetadata;
    llm: LLMReadyData;
  }) => void;
  onError?: (error: string) => void;
}

interface UseGedcomDataWithLLMReturn {
  fullData: GedcomDataWithMetadata | null;
  llmData: LLMReadyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Discriminated union state type for dual data loading
type DualGedcomDataState =
  | { status: 'idle'; fullData: null; llmData: null; error: null }
  | { status: 'loading'; fullData: null; llmData: null; error: null }
  | {
      status: 'success';
      fullData: GedcomDataWithMetadata;
      llmData: LLMReadyData;
      error: null;
    }
  | { status: 'error'; fullData: null; llmData: null; error: string };

// Action types for the reducer
type DualGedcomDataAction =
  | { type: 'fetch_started' }
  | {
      type: 'fetch_succeeded';
      payload: {
        fullData: GedcomDataWithMetadata;
        llmData: LLMReadyData;
      };
    }
  | { type: 'fetch_failed'; payload: string }
  | { type: 'refetch' };

// Reducer function with exhaustive event handling
function dualGedcomDataReducer(
  state: DualGedcomDataState,
  action: DualGedcomDataAction,
): DualGedcomDataState {
  switch (action.type) {
    case 'fetch_started':
      return { status: 'loading', fullData: null, llmData: null, error: null };

    case 'fetch_succeeded':
      return {
        status: 'success',
        fullData: action.payload.fullData,
        llmData: action.payload.llmData,
        error: null,
      };

    case 'fetch_failed':
      return {
        status: 'error',
        fullData: null,
        llmData: null,
        error: action.payload,
      };

    case 'refetch': {
      // Only allow refetch from error or success states
      if (state.status === 'error' || state.status === 'success') {
        return {
          status: 'loading',
          fullData: null,
          llmData: null,
          error: null,
        };
      }
      return state;
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = action;
      // This variable is used for compile-time exhaustiveness checking
      void _exhaustiveCheck;
      return state;
    }
  }
}

export function useGedcomDataWithLLM({
  baseFileName,
  onDataLoaded,
  onError,
}: UseGedcomDataWithLLMOptions): UseGedcomDataWithLLMReturn {
  // Initialize reducer with idle state
  const [state, dispatch] = useReducer(dualGedcomDataReducer, {
    status: 'idle',
    fullData: null,
    llmData: null,
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
    if (!baseFileName) return;

    dispatch({ type: 'fetch_started' });

    try {
      // Load full data
      const fullResponse = await fetch(
        `/generated/parsed/${baseFileName}.json`,
      );
      if (!fullResponse.ok) {
        throw new Error(`Full data file not found: ${baseFileName}.json`);
      }

      // Load LLM data
      const llmResponse = await fetch(
        `/generated/parsed/${baseFileName}-llm.json`,
      );
      if (!llmResponse.ok) {
        throw new Error(`LLM data file not found: ${baseFileName}-llm.json`);
      }

      // Parse both responses
      const fullJsonData = (await fullResponse.json()) as unknown;
      const llmJsonData = (await llmResponse.json()) as unknown;

      // Validate full data
      const validatedFullData = validateFlexibleGedcomData(fullJsonData);

      // Rebuild graph data since functions can't be serialized to JSON
      const fullDataWithGraph = rebuildGraphData(validatedFullData);

      // Validate LLM data (should match LLMReadyData structure)
      const validatedLlmData = llmJsonData as LLMReadyData;

      dispatch({
        type: 'fetch_succeeded',
        payload: {
          fullData: fullDataWithGraph,
          llmData: validatedLlmData,
        },
      });

      onDataLoadedRef.current?.({
        full: fullDataWithGraph,
        llm: validatedLlmData,
      });
    } catch (err) {
      let errorMessage: string;

      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = `Network error: Unable to load data for ${baseFileName}`;
      } else if (err instanceof SyntaxError) {
        errorMessage = `Invalid JSON format in data files for ${baseFileName}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred while loading data';
      }

      dispatch({ type: 'fetch_failed', payload: errorMessage });
      onErrorRef.current?.(errorMessage);
    }
  }, [baseFileName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    dispatch({ type: 'refetch' });
    void loadData();
  }, [loadData]);

  // Return values compatible with existing API
  return {
    fullData: state.fullData,
    llmData: state.llmData,
    loading: state.status === 'loading',
    error: state.error,
    refetch,
  };
}
