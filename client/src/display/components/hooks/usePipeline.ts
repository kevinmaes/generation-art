import { useState, useCallback } from 'react';
import type { GedcomDataWithMetadata } from '../../../../../shared/types';
import {
  runPipeline,
  createSimplePipeline,
  type PipelineResult,
} from '../../../transformers/pipeline';
import { transformers } from '../../../transformers/transformers';

interface UsePipelineOptions {
  temperature?: number;
  seed?: string;
}

interface UsePipelineReturn {
  result: PipelineResult | null;
  error: string | null;
  isRunning: boolean;
  runPipeline: (
    gedcomData: GedcomDataWithMetadata,
    width: number,
    height: number,
    transformerIds?: string[],
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
      gedcomData: GedcomDataWithMetadata,
      width: number,
      height: number,
      transformerIds: string[] = Object.keys(transformers),
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

        const pipelineResult = await runPipeline(gedcomData, pipelineConfig);
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
