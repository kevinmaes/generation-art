import { useState, useCallback } from 'react';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../shared/types';
import {
  runPipeline,
  createSimplePipeline,
  type PipelineResult,
} from '../pipeline/pipeline';
import { type TransformerId } from '../pipeline/transformers';
import { PIPELINE_DEFAULTS } from '../pipeline/pipeline';
import type { VisualParameterValues } from '../pipeline/visual-parameters';

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
    transformerParameters?: Record<
      string,
      {
        dimensions: { primary?: string; secondary?: string };
        visual: VisualParameterValues;
      }
    >,
    transformerActiveStates?: Record<string, boolean>,
    primaryIndividualId?: string,
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
      transformerParameters?: Record<
        string,
        {
          dimensions: { primary?: string; secondary?: string };
          visual: VisualParameterValues;
        }
      >,
      transformerActiveStates?: Record<string, boolean>,
      primaryIndividualId?: string,
    ): Promise<PipelineResult> => {
      setResult(null);
      setError(null);
      setIsRunning(true);

      try {
        console.log(
          '[DEBUG] usePipeline - transformerActiveStates:',
          transformerActiveStates,
        );
        console.log(
          '[DEBUG] usePipeline - primaryIndividualId:',
          primaryIndividualId,
        );

        const pipelineConfig = createSimplePipeline(transformerIds, {
          canvasWidth: width,
          canvasHeight: height,
          temperature: options.temperature ?? 0.5,
          seed: options.seed,
          transformerParameters,
          transformerActiveStates,
          primaryIndividualId,
        });

        console.log(
          '[DEBUG] usePipeline - created config:',
          pipelineConfig.transformers.map((t) => ({
            type: t.type,
            instanceId: t.instanceId,
            isActive: t.isActive,
          })),
        );

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
