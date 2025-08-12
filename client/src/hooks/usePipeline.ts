import { useState, useCallback } from 'react';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';
import {
  runPipeline,
  createSimplePipeline,
  type PipelineResult,
} from '../transformers/pipeline';
import { type TransformerId } from '../transformers/transformers';
import { PIPELINE_DEFAULTS } from '../transformers/pipeline';

interface UsePipelineOptions {
  temperature?: number;
  seed?: string;
}

interface UsePipelineReturn {
  result: PipelineResult | null;
  error: string | null;
  isRunning: boolean;
  runPipeline: (
    fullData: GedcomDataWithMetadata,
    llmData: LLMReadyData,
    width: number,
    height: number,
    transformerIds?: TransformerId[],
  ) => Promise<PipelineResult>;
}

export function usePipeline(
  options: UsePipelineOptions = {},
): UsePipelineReturn {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runPipelineAsync = useCallback(
    async (
      fullData: GedcomDataWithMetadata,
      llmData: LLMReadyData,
      width: number,
      height: number,
      transformerIds: TransformerId[] = PIPELINE_DEFAULTS.TRANSFORMER_IDS,
    ): Promise<PipelineResult> => {
      setResult(null);
      setError(null);
      setIsRunning(true);

      try {
        const pipelineConfig = createSimplePipeline(transformerIds, {
          canvasWidth: width,
          canvasHeight: height,
          temperature: options.temperature ?? 0.5,
          seed: options.seed,
        });

        const pipelineResult = await runPipeline({
          fullData,
          llmData,
          config: pipelineConfig,
        });
        setResult(pipelineResult);
        return pipelineResult;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsRunning(false);
      }
    },
    [options.temperature, options.seed],
  );

  return { result, error, isRunning, runPipeline: runPipelineAsync };
}
