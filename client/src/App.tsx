import React, { useState, useEffect, useMemo } from 'react';
import {
  familyTreeStore,
  useFamilyTreeStore,
} from './stores/family-tree.store';
import { useEventListener } from 'usehooks-ts';
import { FramedArtwork } from './components/FramedArtwork';
import { PipelinePanel } from './components/pipeline/PipelinePanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GedcomSelector } from './components/GedcomSelector';
import { CANVAS_DIMENSIONS } from '../../shared/constants';
import {
  validateFlexibleGedcomData,
  type LLMReadyData,
} from '../../shared/types';
import { rebuildGraphData } from './graph-rebuilder';
import type { PipelineResult } from './pipeline/pipeline';
import {
  runPipeline,
  createSimplePipeline,
  PIPELINE_DEFAULTS,
} from './pipeline/pipeline';
import {
  transformerConfigs,
  type TransformerId,
} from './pipeline/transformers';
import type { VisualParameterValues } from './pipeline/visual-parameters';
import { getTransformerParameterKey } from './utils/pipeline-index';
import './App.css';

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
  // Use family tree store for data state
  const [familyTreeState] = useFamilyTreeStore();

  // Debug state changes
  useEffect(() => {
    console.log('🔄 Family tree state changed:', familyTreeState.status);
  }, [familyTreeState.status]);

  // Derive boolean flags from the state
  const isFamilyTreeLoading = familyTreeState.status === 'loading';
  const isFamilyTreeSuccess = familyTreeState.status === 'success';
  const isFamilyTreeError = familyTreeState.status === 'error';

  // Create dual data structure from store state using useMemo
  const familyTreeData = useMemo(() => {
    return familyTreeState.status === 'success'
      ? { full: familyTreeState.fullData, llm: familyTreeState.llmData }
      : null;
  }, [familyTreeState]);

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
  const [primaryIndividualId, setPrimaryIndividualId] = useState<
    string | undefined
  >(undefined);

  const [currentDataset, setCurrentDataset] = useState<string>('');
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);

  const minWidth = CANVAS_DIMENSIONS.WEB.WIDTH;
  const minHeight = CANVAS_DIMENSIONS.WEB.HEIGHT;

  // Load GEDCOM data when dataset changes
  useEffect(() => {
    if (!currentDataset) return;

    const loadData = async () => {
      console.log('📊 Loading dataset:', currentDataset);
      familyTreeStore.send({ type: 'fetchStarted' });

      try {
        // Load full data
        const fullResponse = await fetch(
          `/generated/parsed/${currentDataset}.json`,
        );
        if (!fullResponse.ok) {
          throw new Error(
            `Failed to load full data: ${String(fullResponse.status)}`,
          );
        }
        const fullData = (await fullResponse.json()) as unknown;

        // Validate full data (throws if invalid)
        const validatedFullData = validateFlexibleGedcomData(fullData);

        // Load LLM data
        const llmResponse = await fetch(
          `/generated/parsed/${currentDataset}-llm.json`,
        );
        if (!llmResponse.ok) {
          throw new Error(
            `Failed to load LLM data: ${String(llmResponse.status)}`,
          );
        }
        const llmData = (await llmResponse.json()) as LLMReadyData;

        console.log('✅ Data loaded successfully');
        
        // Rebuild graph data for efficient traversal
        const fullDataWithGraph = rebuildGraphData(validatedFullData);
        
        familyTreeStore.send({
          type: 'fetchSucceeded',
          fullData: fullDataWithGraph,
          llmData,
        });

        // Switch to artwork view when data loads successfully
        setCurrentView('artwork');
        console.log('✅ Switched to artwork view');
      } catch (error) {
        console.error('❌ Error loading data:', error);
        familyTreeStore.send({
          type: 'fetchFailed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    void loadData();
  }, [currentDataset]);

  // Development: Auto-select Rafi (I12406240) when data loads
  useEffect(() => {
    if (isFamilyTreeSuccess && !primaryIndividualId && familyTreeData) {
      const targetId = 'I12406240';

      if (targetId in familyTreeData.full.individuals) {
        console.log('🎯 Auto-selecting Raphael Ophir Maes:', targetId);
        setPrimaryIndividualId(targetId);
      }
    }
  }, [isFamilyTreeSuccess, familyTreeData, primaryIndividualId]);

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
            !isFamilyTreeSuccess &&
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
  }, [currentView, isFamilyTreeSuccess, currentDataset]);

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

    familyTreeStore.send({ type: 'fetchStarted' });
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;

      // Use Zod validation instead of manual type checking
      const validatedData = validateFlexibleGedcomData(data);
      
      // Rebuild graph data for efficient traversal
      const fullDataWithGraph = rebuildGraphData(validatedData);

      // For uploaded files, create a minimal dual-data structure
      // (LLM data will be null since we don't have pre-processed LLM data)
      const newDualData = {
        full: fullDataWithGraph,
        llm: {
          individuals: {},
          families: {},
          metadata: fullDataWithGraph.metadata,
        },
      };
      familyTreeStore.send({
        type: 'fetchSucceeded',
        fullData: newDualData.full,
        llmData: newDualData.llm,
      });
      setCurrentView('artwork');
      // Clear any previous pipeline result when loading new data
      setPipelineResult(null);
      // Clear primary individual so the useEffect can auto-select
      setPrimaryIndividualId(undefined);
    } catch (err) {
      familyTreeStore.send({
        type: 'fetchFailed',
        error: err instanceof Error ? err.message : 'Failed to load file',
      });
    }
  };

  const handleLoadDataset = (datasetId: string) => {
    setCurrentDataset(datasetId);
    setCurrentView('artwork');
    // Set loading state when switching datasets
    familyTreeStore.send({ type: 'fetchStarted' });
    setPipelineResult(null);
    // Clear primary individual when switching datasets so auto-select can work
    setPrimaryIndividualId(undefined);
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
    if (!isFamilyTreeSuccess) {
      console.error('Cannot visualize: data not loaded');
      return;
    }

    // const dualData = familyTreeData.full;

    if (!familyTreeData) {
      console.error('Cannot visualize: data is null');
      return;
    }

    if (!primaryIndividualId) {
      console.error('Please select a primary individual before generating art');
      return;
    }

    setIsVisualizing(true);
    setPipelineProgress(null);
    try {
      const pipelineConfig = createSimplePipeline(activeTransformerIds, {
        canvasWidth: minWidth,
        canvasHeight: minHeight,
        temperature: 0.5,
        primaryIndividualId,
        transformerParameters,
      });

      const result = await runPipeline({
        fullData: familyTreeData.full,
        llmData: familyTreeData.llm,
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
      console.error(
        'Pipeline execution failed:',
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setIsVisualizing(false);
      setPipelineProgress(null);
    }
  };

  const canShowArtwork =
    currentView === 'artwork' && isFamilyTreeSuccess && familyTreeData;

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
          {canShowArtwork ? (
            <>
              <FramedArtwork
                title="Family Tree Visualization"
                subtitle="Generative visualization of family connections and generations"
                width={minWidth}
                height={minHeight}
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
                primaryIndividualId={primaryIndividualId}
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
                {isFamilyTreeError && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {familyTreeState.error}
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
                        disabled={isFamilyTreeLoading}
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
                      disabled={isFamilyTreeLoading}
                    />
                  </div>
                  {/* Loading Indicator */}
                  {isFamilyTreeLoading && (
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
          primaryIndividualId={primaryIndividualId}
          onPrimaryIndividualChange={setPrimaryIndividualId}
          onTransformerSelect={handleTransformerSelect}
          onAddTransformer={handleAddTransformer}
          onRemoveTransformer={handleRemoveTransformer}
          onReorderTransformers={handleReorderTransformers}
          onParameterChange={handleParameterChange}
          onVisualize={() => {
            void handleVisualize();
          }}
          isVisualizing={isVisualizing}
          hasData={isFamilyTreeSuccess}
          lastRunParameters={lastRunParameters}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
