import React, { useState, useEffect } from 'react';
import { useEventListener } from 'usehooks-ts';
import { FramedArtwork } from './components/FramedArtwork';
import { PipelinePanel } from './components/pipeline/PipelinePanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GedcomSelector } from './components/GedcomSelector';
import { CANVAS_DIMENSIONS } from '../../shared/constants';
import { validateFlexibleGedcomData } from '../../shared/types';
import type { GedcomDataWithMetadata, LLMReadyData } from '../../shared/types';
import type { PipelineResult } from './transformers/pipeline';
import {
  runPipeline,
  createSimplePipeline,
  PIPELINE_DEFAULTS,
} from './transformers/pipeline';
import {
  transformerConfigs,
  type TransformerId,
} from './transformers/transformers';
import type { VisualParameterValues } from './transformers/visual-parameters';
import { getTransformerParameterKey } from './utils/pipeline-index';
import { useGedcomDataWithLLM } from './hooks/useGedcomDataWithLLM';
import './App.css';

// Type for the complete dual-data structure
interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
}

// Type for manifest structure
interface GedcomManifest {
  version: string;
  generated: string;
  datasets: {
    id: string;
    name: string;
    fileName?: string;
    description?: string;
    individualCount?: number;
    familyCount?: number;
    generationCount?: number;
    sourcePath?: string;
  }[];
}

function App(): React.ReactElement {
  const [dualData, setDualData] = useState<DualGedcomData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'file-select' | 'artwork'>(
    'file-select',
  );
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(
    null,
  );
  const [activeTransformerIds, setActiveTransformerIds] = useState<
    TransformerId[]
  >(PIPELINE_DEFAULTS.TRANSFORMER_IDS);
  const [transformerParameters, setTransformerParameters] = useState<
    Record<
      string,
      {
        dimensions: { primary?: string; secondary?: string };
        visual: VisualParameterValues;
      }
    >
  >({});
  const [lastRunParameters, setLastRunParameters] = useState<
    Record<
      string,
      {
        dimensions: { primary?: string; secondary?: string };
        visual: VisualParameterValues;
      }
    >
  >({});
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<{
    current: number;
    total: number;
    transformerName: string;
  } | null>(null);

  const [currentDataset, setCurrentDataset] = useState<string>('');
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);

  const minWidth = CANVAS_DIMENSIONS.WEB.WIDTH;
  const minHeight = CANVAS_DIMENSIONS.WEB.HEIGHT;

  // Use the new hook for loading both full and LLM data
  useGedcomDataWithLLM({
    baseFileName: currentDataset,
    onDataLoaded: (data) => {
      setDualData(data);
    },
    onError: (error) => {
      setError(error);
    },
  });

  // Load manifest to get available datasets
  useEffect(() => {
    const loadManifest = async () => {
      try {
        const response = await fetch('/generated/parsed/manifest.json');
        if (response.ok) {
          const manifest = (await response.json()) as GedcomManifest;
          const datasetIds = manifest.datasets.map((d) => d.id);
          setAvailableDatasets(datasetIds);

          // Auto-load first dataset if none selected
          if (
            currentView === 'file-select' &&
            !dualData &&
            !currentDataset &&
            datasetIds.length > 0
          ) {
            console.log(
              `🔄 Auto-loading first available dataset: ${datasetIds[0]}`,
            );
            setCurrentDataset(datasetIds[0]);
            setCurrentView('artwork');
          }
        }
      } catch (err) {
        console.error('Failed to load manifest:', err);
      }
    };

    void loadManifest();
  }, [currentView, dualData, currentDataset]);

  // Handle keyboard shortcut for pipeline modal
  useEventListener('keydown', (event) => {
    // Handle Cmd+D or Ctrl+D
    if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
      event.preventDefault(); // Prevent browser bookmark
      setIsPipelineModalOpen((prev) => !prev);
    }
  });

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;

      // Use Zod validation instead of manual type checking
      const validatedData = validateFlexibleGedcomData(data);

      // For uploaded files, create a minimal dual-data structure
      // (LLM data will be null since we don't have pre-processed LLM data)
      setDualData({
        full: validatedData,
        llm: {
          individuals: {},
          families: {},
          metadata: validatedData.metadata,
        },
      });
      setCurrentView('artwork');
      // Clear any previous pipeline result when loading new data
      setPipelineResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDataset = (datasetId: string) => {
    setCurrentDataset(datasetId);
    setCurrentView('artwork');
    setError(null);
    setPipelineResult(null);
    // The hook will automatically load the data
  };

  const handleTransformerSelect = (transformerId: string) => {
    // This is now just for selection, not for adding/removing
    console.log('Selected transformer:', transformerId);
  };

  const handleAddTransformer = (transformerId: TransformerId) => {
    if (!activeTransformerIds.includes(transformerId)) {
      setActiveTransformerIds([...activeTransformerIds, transformerId]);
    }
  };

  const handleRemoveTransformer = (transformerId: string) => {
    setActiveTransformerIds(
      activeTransformerIds.filter((id) => id !== transformerId),
    );
  };

  const handleReorderTransformers = (newOrder: TransformerId[]) => {
    setActiveTransformerIds(newOrder);
  };

  const handleParameterChange = (
    transformerId: string,
    parameters: {
      dimensions: { primary?: string; secondary?: string };
      visual: VisualParameterValues;
    },
  ) => {
    setTransformerParameters((prev) => ({
      ...prev,
      [transformerId]: parameters,
    }));
  };

  const handleVisualize = async () => {
    if (!dualData) {
      setError('Data is required for visualization');
      return;
    }

    setIsVisualizing(true);
    setPipelineProgress(null);
    try {
      const pipelineConfig = createSimplePipeline(activeTransformerIds, {
        canvasWidth: minWidth,
        canvasHeight: minHeight,
        temperature: 0.5,
        transformerParameters,
      });

      const result = await runPipeline({
        fullData: dualData.full,
        llmData: dualData.llm,
        config: pipelineConfig,
        onProgress: (current, total, transformerName) => {
          setPipelineProgress({ current, total, transformerName });
        },
      });
      setPipelineResult(result);

      // Update lastRunParameters with current transformerParameters after successful pipeline run
      // Ensure we capture the actual parameters used, including defaults for transformers without explicit parameters
      const actualParametersUsed: Record<
        string,
        {
          dimensions: { primary?: string; secondary?: string };
          visual: VisualParameterValues;
        }
      > = {};
      activeTransformerIds.forEach((transformerId, index) => {
        const transformer = transformerConfigs[transformerId];
        // Use compound ID for variance transformers
        const parameterKey = getTransformerParameterKey(
          activeTransformerIds,
          index,
        );
        actualParametersUsed[parameterKey] = transformerParameters[
          parameterKey
        ] ?? {
          dimensions: {
            primary: transformer.defaultPrimaryDimension,
            secondary: transformer.defaultSecondaryDimension,
          },
          visual: {},
        };
      });

      setLastRunParameters(actualParametersUsed);
    } catch (err) {
      console.error('Pipeline execution failed:', err);
      setError(
        err instanceof Error ? err.message : 'Pipeline execution failed',
      );
    } finally {
      setIsVisualizing(false);
      setPipelineProgress(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="w-full flex flex-col items-center" style={{ minWidth }}>
          <div className="pt-12 pb-8 text-center">
            <h1 className="text-5xl font-extrabold mb-3 text-gray-800 tracking-tight drop-shadow-sm">
              Generation Art
            </h1>
            <p className="text-lg text-gray-500 mb-4">
              Visualizing family trees through generative art
            </p>
            {currentView === 'artwork' && (
              <div className="flex flex-col items-center gap-3">
                {currentDataset && (
                  <div className="text-sm text-gray-600">
                    Current dataset:{' '}
                    <span className="font-semibold">{currentDataset}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentView('file-select');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Load from file
                  </button>
                  <button
                    onClick={() => {
                      if (availableDatasets.length > 0) {
                        const currentIndex =
                          availableDatasets.indexOf(currentDataset);
                        const nextIndex =
                          (currentIndex + 1) % availableDatasets.length;
                        handleLoadDataset(availableDatasets[nextIndex]);
                      }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    disabled={availableDatasets.length === 0}
                  >
                    Switch dataset
                  </button>
                </div>
              </div>
            )}
          </div>
          {currentView === 'artwork' && dualData ? (
            <>
              <FramedArtwork
                title="Family Tree Visualization"
                subtitle="Generative visualization of family connections and generations"
                width={minWidth}
                height={minHeight}
                gedcomData={dualData.full}
                pipelineResult={pipelineResult}
                className="mb-8"
                onOpenPipelineClick={() => {
                  setIsPipelineModalOpen(true);
                }}
                onVisualize={() => {
                  void handleVisualize();
                }}
                isVisualizing={isVisualizing}
                pipelineProgress={pipelineProgress}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-full px-4">
              <div
                className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl flex flex-col justify-center"
                style={{
                  minWidth: Math.min(800, minWidth),
                  minHeight: minHeight * 0.8,
                }}
              >
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Load Family Tree Data
                </h2>
                {error && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-blue-600 hover:text-blue-500">
                          Choose a JSON file
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={(event) => {
                          void handleFileSelect(event);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Select a CLI-processed JSON file from the generated folder
                    </p>
                  </div>
                  {/* GEDCOM Dataset Selector */}
                  <div className="flex flex-col items-center">
                    <div className="text-gray-500 mb-4">
                      or load a pre-processed dataset
                    </div>
                    <GedcomSelector
                      onSelect={handleLoadDataset}
                      currentDataset={currentDataset}
                      disabled={isLoading}
                    />
                  </div>
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <p className="mt-2 text-gray-600">Processing file...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Panel */}
      <ErrorBoundary>
        <PipelinePanel
          isOpen={isPipelineModalOpen}
          onClose={() => {
            setIsPipelineModalOpen(false);
          }}
          pipelineResult={pipelineResult}
          activeTransformerIds={activeTransformerIds}
          dualData={dualData}
          onTransformerSelect={handleTransformerSelect}
          onAddTransformer={handleAddTransformer}
          onRemoveTransformer={handleRemoveTransformer}
          onReorderTransformers={handleReorderTransformers}
          onParameterChange={handleParameterChange}
          onVisualize={() => {
            void handleVisualize();
          }}
          isVisualizing={isVisualizing}
          hasData={!!dualData}
          lastRunParameters={lastRunParameters}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
