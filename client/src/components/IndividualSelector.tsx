import React, { useMemo, useState, useEffect } from 'react';
import type { AugmentedIndividual, GedcomDataWithMetadata } from '../../../shared/types';

interface IndividualSelectorProps {
  gedcomData: GedcomDataWithMetadata;
  onIndividualSelect: (individualId: string | null) => void;
  onGenerationRangeChange: (before: number, after: number) => void;
  selectedIndividualId?: string | null;
  generationsBefore?: number;
  generationsAfter?: number;
}

export function IndividualSelector({
  gedcomData,
  onIndividualSelect,
  onGenerationRangeChange,
  selectedIndividualId = null,
  generationsBefore = 2,
  generationsAfter = 2,
}: IndividualSelectorProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [localGenerationsBefore, setLocalGenerationsBefore] = useState(generationsBefore);
  const [localGenerationsAfter, setLocalGenerationsAfter] = useState(generationsAfter);
  const [showAll, setShowAll] = useState(true);

  // Get all individuals as an array sorted by name
  const individuals = useMemo(() => {
    const individualsArray = Object.values(gedcomData.individuals).filter(
      (ind): ind is AugmentedIndividual => ind != null
    );
    
    // Sort by name for easier finding
    return individualsArray.sort((a, b) => {
      const nameA = a.name ?? a.id;
      const nameB = b.name ?? b.id;
      return nameA.localeCompare(nameB);
    });
  }, [gedcomData]);

  // Filter individuals based on search term
  const filteredIndividuals = useMemo(() => {
    if (!searchTerm) return individuals;
    
    const lowerSearch = searchTerm.toLowerCase();
    return individuals.filter(ind => {
      const name = ind.name ?? ind.id;
      return name.toLowerCase().includes(lowerSearch);
    });
  }, [individuals, searchTerm]);

  // Get selected individual details
  const selectedIndividual = useMemo(() => {
    if (!selectedIndividualId) return null;
    return gedcomData.individuals[selectedIndividualId];
  }, [selectedIndividualId, gedcomData]);

  // Update parent when generation range changes
  useEffect(() => {
    onGenerationRangeChange(localGenerationsBefore, localGenerationsAfter);
  }, [localGenerationsBefore, localGenerationsAfter, onGenerationRangeChange]);

  // Calculate statistics about the filtered tree
  const treeStats = useMemo(() => {
    if (!selectedIndividual || showAll) {
      return {
        totalIndividuals: individuals.length,
        filteredIndividuals: individuals.length,
        generations: new Set(individuals.map(ind => ind.metadata?.generation ?? 0)).size,
      };
    }

    // Calculate which individuals would be included based on generation range
    const selectedGen = selectedIndividual.metadata?.generation ?? 0;
    const minGen = selectedGen - localGenerationsBefore;
    const maxGen = selectedGen + localGenerationsAfter;
    
    const includedIndividuals = individuals.filter(ind => {
      const gen = ind.metadata?.generation ?? 0;
      return gen >= minGen && gen <= maxGen;
    });

    return {
      totalIndividuals: individuals.length,
      filteredIndividuals: includedIndividuals.length,
      generations: new Set(includedIndividuals.map(ind => ind.metadata?.generation ?? 0)).size,
    };
  }, [selectedIndividual, individuals, localGenerationsBefore, localGenerationsAfter, showAll]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Focus on Individual</h2>
        
        {/* Show All / Focus Toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => {
                setShowAll(e.target.checked);
                if (e.target.checked) {
                  onIndividualSelect(null);
                }
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show entire tree</span>
          </label>
        </div>

        {/* Individual Search and Selection */}
        {!showAll && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Individual
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Individual List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Individual ({filteredIndividuals.length} matches)
              </label>
              <select
                value={selectedIndividualId || ''}
                onChange={(e) => onIndividualSelect(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={5}
              >
                <option value="">-- None Selected --</option>
                {filteredIndividuals.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.name ?? ind.id} 
                    {ind.metadata?.birthYear && ` (b. ${ind.metadata.birthYear})`}
                    {ind.metadata?.generation !== undefined && ` - Gen ${ind.metadata.generation}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Individual Info */}
            {selectedIndividual && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <h3 className="font-medium text-blue-900">
                  {selectedIndividual.name ?? selectedIndividual.id}
                </h3>
                <div className="text-sm text-blue-700 mt-1">
                  <div>Generation: {selectedIndividual.metadata?.generation ?? 'Unknown'}</div>
                  {selectedIndividual.metadata?.birthYear && (
                    <div>Born: {selectedIndividual.metadata.birthYear}</div>
                  )}
                  {selectedIndividual.metadata?.deathYear && (
                    <div>Died: {selectedIndividual.metadata.deathYear}</div>
                  )}
                  {selectedIndividual.birth?.place && (
                    <div>Birth Place: {selectedIndividual.birth.place}</div>
                  )}
                </div>
              </div>
            )}

            {/* Generation Range Controls */}
            {selectedIndividual && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generations Before: {localGenerationsBefore}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={localGenerationsBefore}
                    onChange={(e) => setLocalGenerationsBefore(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generations After: {localGenerationsAfter}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={localGenerationsAfter}
                    onChange={(e) => setLocalGenerationsAfter(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Tree Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tree Statistics</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Total Individuals: {treeStats.totalIndividuals}</div>
            <div>Visible Individuals: {treeStats.filteredIndividuals}</div>
            <div>Generations: {treeStats.generations}</div>
            {!showAll && selectedIndividual && (
              <div className="text-blue-600 mt-2">
                Showing {Math.round((treeStats.filteredIndividuals / treeStats.totalIndividuals) * 100)}% of tree
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}