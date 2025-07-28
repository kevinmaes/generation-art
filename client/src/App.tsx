import React, { useState, useEffect } from 'react';
import { FramedArtwork } from './display/components/FramedArtwork';
import { PipelineManager } from './display/components/pipeline-ui/PipelineManager';
import { CANVAS_DIMENSIONS } from '../../shared/constants';
import { validateFlexibleGedcomData } from '../../shared/types';
import type { GedcomDataWithMetadata, LLMReadyData } from '../../shared/types';
import type { PipelineResult } from './transformers/pipeline';
import { runPipeline, createSimplePipeline } from './transformers/pipeline';
import { useGedcomDataWithLLM } from './data-loading/hooks/useGedcomDataWithLLM';
import './App.css';

// Type for the complete dual-data structure
interface DualGedcomData {
  full: GedcomDataWithMetadata;
  llm: LLMReadyData;
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
  const [activeTransformerIds, setActiveTransformerIds] = useState<string[]>([
    'horizontal-spread-by-generation',
    'vertical-spread',
    'node-opacity',
    'edge-opacity',
  ]);
  const [transformerParameters, setTransformerParameters] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [lastRunParameters, setLastRunParameters] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [lastRunTransformerIds, setLastRunTransformerIds] = useState<string[]>(
    [],
  );
  const [currentDataset, setCurrentDataset] = useState<string>('kennedy');

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

  // Check for autoLoad parameter and load Kennedy data automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoLoad = urlParams.get('autoLoad');

    if (autoLoad === 'true' && currentView === 'file-select' && !dualData) {
      console.log('🔄 Auto-loading Kennedy family tree data...');
      setCurrentDataset('kennedy');
      setCurrentView('artwork');
    }
  }, [currentView, dualData]);

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
      setLastRunTransformerIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadKennedy = () => {
    setCurrentDataset('kennedy');
    setCurrentView('artwork');
    setError(null);
    setPipelineResult(null);
    setLastRunTransformerIds([]);
    // The hook will automatically load the data
  };

  const handleTransformerSelect = (transformerId: string) => {
    // This is now just for selection, not for adding/removing
    console.log('Selected transformer:', transformerId);
  };

  const handleAddTransformer = (transformerId: string) => {
    if (!activeTransformerIds.includes(transformerId)) {
      setActiveTransformerIds([...activeTransformerIds, transformerId]);
    }
  };

  const handleRemoveTransformer = (transformerId: string) => {
    setActiveTransformerIds(
      activeTransformerIds.filter((id) => id !== transformerId),
    );
  };

  const handleParameterChange = (
    transformerId: string,
    parameters: Record<string, unknown>,
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
    try {
      const pipelineConfig = createSimplePipeline(activeTransformerIds, {
        canvasWidth: minWidth,
        canvasHeight: minHeight,
        temperature: 0.5,
      });

      const result = await runPipeline({
        fullData: dualData.full,
        llmData: dualData.llm,
        config: pipelineConfig,
      });
      setPipelineResult(result);
      setLastRunTransformerIds([...activeTransformerIds]);
      setLastRunParameters({ ...transformerParameters });
    } catch (err) {
      console.error('Pipeline execution failed:', err);
      setError(
        err instanceof Error ? err.message : 'Pipeline execution failed',
      );
    } finally {
      setIsVisualizing(false);
    }
  };

  const handlePipelineResult = (result: PipelineResult | null) => {
    setPipelineResult(result);
    // Don't update activeTransformerIds from pipeline results
    // The user's current transformer selection should be preserved
  };

  // Check if pipeline has been modified since last run
  const isPipelineModified = () => {
    if (lastRunTransformerIds.length === 0) {
      return true; // Never run, so consider it modified
    }
    if (lastRunTransformerIds.length !== activeTransformerIds.length) {
      return true; // Different number of transformers
    }
    // Check if any transformer IDs are different
    const transformersChanged = !lastRunTransformerIds.every(
      (id, index) => id === activeTransformerIds[index],
    );

    // Check if any parameters have changed
    const parametersChanged = activeTransformerIds.some((transformerId) => {
      const currentParams = transformerParameters[transformerId];
      const lastParams = lastRunParameters[transformerId];

      const hasCurrentParams = transformerId in transformerParameters;
      const hasLastParams = transformerId in lastRunParameters;

      if (!hasCurrentParams && !hasLastParams) return false;
      if (!hasCurrentParams || !hasLastParams) return true;

      return !Object.keys(currentParams).every(
        (key) => currentParams[key] === lastParams[key],
      );
    });

    return transformersChanged || parametersChanged;
  };

  return (
    <div
      className="min-h-screen w-full bg-gray-100 flex items-center justify-center"
      style={{ minWidth, minHeight }}
    >
      <div
        className="flex flex-col justify-center items-center w-full h-full"
        style={{ minWidth, minHeight }}
      >
        <div
          className="max-w-7xl w-full flex flex-col items-center"
          style={{ minWidth }}
        >
          <div className="pt-12 pb-8 text-center">
            <h1 className="text-5xl font-extrabold mb-3 text-gray-800 tracking-tight drop-shadow-sm">
              Generation Art
            </h1>
            <p className="text-lg text-gray-500 mb-4">
              Visualizing family trees through generative art
            </p>
            {currentView === 'artwork' && (
              <button
                onClick={() => {
                  setCurrentView('file-select');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-2"
              >
                Load Different File
              </button>
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
                onPipelineResult={handlePipelineResult}
              />
              <div className="mb-8">
                <PipelineManager
                  pipelineResult={pipelineResult}
                  activeTransformerIds={activeTransformerIds}
                  dualData={dualData}
                  onTransformerSelect={handleTransformerSelect}
                  onAddTransformer={handleAddTransformer}
                  onRemoveTransformer={handleRemoveTransformer}
                  onParameterChange={handleParameterChange}
                  onVisualize={() => {
                    void handleVisualize();
                  }}
                  isVisualizing={isVisualizing}
                  hasData={!!dualData}
                  isPipelineModified={isPipelineModified()}
                />
              </div>
            </>
          ) : (
            <div
              className="flex flex-col items-center justify-center w-full"
              style={{ minWidth, minHeight }}
            >
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
                  {/* Quick Load Kennedy Button */}
                  <div className="text-center">
                    <div className="text-gray-500 mb-2">or</div>
                    <button
                      onClick={() => {
                        handleLoadKennedy();
                      }}
                      disabled={isLoading}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading
                        ? 'Loading...'
                        : 'Load Kennedy Family Tree (Development)'}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Quick development option - loads the Kennedy family data
                    </p>
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
    </div>
  );
}

export default App;
