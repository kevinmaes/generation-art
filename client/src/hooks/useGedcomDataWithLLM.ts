import { useEffect, useCallback, useRef } from 'react';
import { validateFlexibleGedcomData } from '../../../shared/types';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';
import { rebuildGraphData } from '../graph-rebuilder';
import { useGedcomDataWithLLMStore } from '../stores/gedcom-data-with-llm.store';

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

export function useGedcomDataWithLLM({
  baseFileName,
  onDataLoaded,
  onError,
}: UseGedcomDataWithLLMOptions): UseGedcomDataWithLLMReturn {
  // Use XState store for state management
  const [state, store] = useGedcomDataWithLLMStore((state) => state.context);

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

    store.send({ type: 'fetchStarted' });

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

      store.send({
        type: 'fetchSucceeded',
        fullData: fullDataWithGraph,
        llmData: validatedLlmData,
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

      store.send({ type: 'fetchFailed', error: errorMessage });
      onErrorRef.current?.(errorMessage);
    }
  }, [baseFileName, store]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    store.send({ type: 'refetch' });
    void loadData();
  }, [loadData, store]);

  // Return values compatible with existing API
  return {
    fullData: state.fullData,
    llmData: state.llmData,
    loading: state.status === 'loading',
    error: state.error,
    refetch,
  };
}
