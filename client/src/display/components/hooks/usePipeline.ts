import { useState, useEffect, useCallback } from 'react';
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
  runPipeline: () => Promise<void>;
}

export function usePipeline(
  gedcomData: GedcomDataWithMetadata | undefined,
  width: number,
  height: number,
  options: UsePipelineOptions = {},
): UsePipelineReturn {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runPipelineAsync = useCallback(async () => {
    if (!gedcomData) return;

    setResult(null);
    setError(null);
    setIsRunning(true);

    try {
      const transformerIds = Object.keys(transformers);
      const pipelineConfig = createSimplePipeline(transformerIds, {
        canvasWidth: width,
        canvasHeight: height,
        temperature: options.temperature ?? 0.5,
        seed: options.seed,
      });

      const pipelineResult = await runPipeline(gedcomData, pipelineConfig);
      setResult(pipelineResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [gedcomData, width, height, options.temperature, options.seed]);

  useEffect(() => {
    void runPipelineAsync();
  }, [runPipelineAsync]);

  return { result, error, isRunning, runPipeline: runPipelineAsync };
}
