import React, { useState, useCallback } from 'react';
import { IndividualSelector } from './IndividualSelector';
import { ArtGenerator } from './ArtGenerator';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { PipelineResult } from '../transformers/pipeline';
import { runPipeline, createSimplePipeline } from '../transformers/pipeline';
import { CANVAS_DIMENSIONS } from '../../../shared/constants';

interface FocusedTreeViewerProps {
  gedcomData: GedcomDataWithMetadata;
  llmData: any; // LLMReadyData
}

export function FocusedTreeViewer({
  gedcomData,
  llmData,
}: FocusedTreeViewerProps): React.ReactElement {
  const [selectedIndividualId, setSelectedIndividualId] = useState<string | null>(null);
  const [generationsBefore, setGenerationsBefore] = useState(2);
  const [generationsAfter, setGenerationsAfter] = useState(2);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [showIndividuals, setShowIndividuals] = useState(true);
  const [showRelations, setShowRelations] = useState(true);

  // Create filtered GEDCOM data based on selection
  const getFilteredData = useCallback((): GedcomDataWithMetadata => {
    if (!selectedIndividualId) {
      return gedcomData; // Return full data if no focus
    }

    const focusIndividual = gedcomData.individuals[selectedIndividualId];
    if (!focusIndividual) {
      return gedcomData; // Return full data if individual not found
    }

    const focusGeneration = focusIndividual.metadata?.generation ?? 0;
    const minGeneration = focusGeneration - generationsBefore;
    const maxGeneration = focusGeneration + generationsAfter;

    // Filter individuals based on generation range
    const filteredIndividuals: typeof gedcomData.individuals = {};
    Object.entries(gedcomData.individuals).forEach(([id, individual]) => {
      if (individual) {
        const gen = individual.metadata?.generation ?? 0;
        if (gen >= minGeneration && gen <= maxGeneration) {
          filteredIndividuals[id] = individual;
        }
      }
    });

    // Filter families to only include those with at least one member in the filtered set
    const filteredFamilies: typeof gedcomData.families = {};
    Object.entries(gedcomData.families).forEach(([id, family]) => {
      if (family) {
        const hasFilteredMember = 
          (family.husband && filteredIndividuals[family.husband.id]) ||
          (family.wife && filteredIndividuals[family.wife.id]) ||
          family.children.some(child => filteredIndividuals[child.id]);
        
        if (hasFilteredMember) {
          filteredFamilies[id] = family;
        }
      }
    });

    // Filter edges to only include those between filtered individuals
    const filteredEdges = gedcomData.metadata.edges.filter(edge => 
      filteredIndividuals[edge.sourceId] && filteredIndividuals[edge.targetId]
    );

    // Return filtered data structure
    return {
      ...gedcomData,
      individuals: filteredIndividuals,
      families: filteredFamilies,
      metadata: {
        ...gedcomData.metadata,
        edges: filteredEdges,
      },
    };
  }, [gedcomData, selectedIndividualId, generationsBefore, generationsAfter]);

  const handleVisualize = async () => {
    setIsVisualizing(true);
    try {
      const filteredData = getFilteredData();
      
      // Use walker-tree transformer for better tree layout
      const pipelineConfig = createSimplePipeline(['walker-tree'], {
        canvasWidth: CANVAS_DIMENSIONS.WEB.WIDTH,
        canvasHeight: CANVAS_DIMENSIONS.WEB.HEIGHT,
        temperature: 0.5,
        transformerParameters: {
          'walker-tree': {
            dimensions: { primary: 'generation' },
            visual: {
              showLabels: true,
              enableDebugging: false,
              nodeSpacing: 60,
              generationSpacing: 120,
              useOrthogonalRouting: true,
            },
          },
        },
      });

      const result = await runPipeline({
        fullData: filteredData,
        llmData: llmData,
        config: pipelineConfig,
      });

      setPipelineResult(result);
    } catch (error) {
      console.error('Visualization failed:', error);
    } finally {
      setIsVisualizing(false);
    }
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Left panel: Individual selector */}
      <div className="w-96 flex-shrink-0">
        <IndividualSelector
          gedcomData={gedcomData}
          onIndividualSelect={setSelectedIndividualId}
          onGenerationRangeChange={(before, after) => {
            setGenerationsBefore(before);
            setGenerationsAfter(after);
          }}
          selectedIndividualId={selectedIndividualId}
          generationsBefore={generationsBefore}
          generationsAfter={generationsAfter}
        />

        {/* Visualization controls */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Display Options</h3>
          
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={showIndividuals}
              onChange={(e) => setShowIndividuals(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show individuals</span>
          </label>

          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={showRelations}
              onChange={(e) => setShowRelations(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show relationships</span>
          </label>

          <button
            onClick={handleVisualize}
            disabled={isVisualizing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isVisualizing ? 'Generating...' : 'Generate visualization'}
          </button>
        </div>
      </div>

      {/* Right panel: Tree visualization */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Tree Visualization</h2>
          <ArtGenerator
            gedcomData={getFilteredData()}
            pipelineResult={pipelineResult}
            showIndividuals={showIndividuals}
            showRelations={showRelations}
            isVisualizing={isVisualizing}
          />
        </div>
      </div>
    </div>
  );
}