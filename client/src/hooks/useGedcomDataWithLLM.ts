import { useState, useEffect, useCallback, useRef } from 'react';
import { validateFlexibleGedcomData } from '../../../shared/types';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';

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
  const [fullData, setFullData] = useState<GedcomDataWithMetadata | null>(null);
  const [llmData, setLlmData] = useState<LLMReadyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setLoading(true);
    setError(null);

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

      // Validate LLM data (should match LLMReadyData structure)
      const validatedLlmData = llmJsonData as LLMReadyData;

      setFullData(validatedFullData);
      setLlmData(validatedLlmData);

      onDataLoadedRef.current?.({
        full: validatedFullData,
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

      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [baseFileName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    void loadData();
  }, [loadData]);

  return { fullData, llmData, loading, error, refetch };
}
