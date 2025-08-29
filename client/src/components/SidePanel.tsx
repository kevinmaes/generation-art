import React from 'react';
import { useSelectedIndividual } from '../hooks/useSelectedIndividual';
import { usePrimaryIndividual } from '../hooks/usePrimaryIndividual';
import type { GedcomDataWithMetadata } from '../../../shared/types';

interface SidePanelProps {
  gedcomData: GedcomDataWithMetadata | null;
  fanChartMode?: 'ancestors' | 'descendants';
  onFanChartModeChange?: (mode: 'ancestors' | 'descendants') => void;
  onVisualize?: () => void;
  hasFanChart?: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  gedcomData,
  fanChartMode = 'ancestors',
  onFanChartModeChange,
  onVisualize,
}) => {
  const { selectedIndividualId, setSelectedIndividualId } =
    useSelectedIndividual();
  const { primaryIndividualId, setPrimaryIndividualId } =
    usePrimaryIndividual();

  if (!selectedIndividualId || !gedcomData) {
    return null;
  }

  const individual = gedcomData.individuals[selectedIndividualId];

  const isPrimary = selectedIndividualId === primaryIndividualId;

  // Extract birth information
  const birthYear =
    individual.birth?.date?.match(/\d{4}/)?.[0] ?? individual.birth?.date;
  const birthCountry = individual.birth?.country?.iso2;

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto"
      onClick={(e) => {
        // Prevent clicks within the panel from propagating to the canvas
        e.stopPropagation();
      }}
    >
      <div className="p-6">
        {/* Close button */}
        <button
          onClick={() => setSelectedIndividualId(null)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Name */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {individual.name || 'Unknown'}
          </h2>
        </div>

        {/* Birth Info */}
        <div className="mb-4">
          {birthYear && (
            <p className="text-sm text-gray-600 mb-2">Born {birthYear}</p>
          )}
          {birthCountry && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{birthCountry}</span>
              <img
                src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${birthCountry.toLowerCase()}.svg`}
                alt={`${birthCountry} flag`}
                className="w-5 h-auto rounded-sm shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <button
              onClick={() => {
                if (onFanChartModeChange && fanChartMode !== 'ancestors') {
                  onFanChartModeChange('ancestors');
                  if (onVisualize) {
                    setTimeout(() => onVisualize(), 100);
                  }
                }
              }}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                fanChartMode === 'ancestors'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Ancestors
            </button>
            <button
              onClick={() => {
                if (onFanChartModeChange && fanChartMode !== 'descendants') {
                  onFanChartModeChange('descendants');
                  if (onVisualize) {
                    setTimeout(() => onVisualize(), 100);
                  }
                }
              }}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                fanChartMode === 'descendants'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Descendants
            </button>
          </div>
        </div>

        {/* Individual ID (development mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-50 rounded">
            <span className="text-xs font-mono text-gray-500">
              ID: {individual.id}
            </span>
          </div>
        )}

        {/* Primary Individual Button */}
        <div className="mb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(
                'Button clicked! Setting primary individual to:',
                selectedIndividualId,
              );
              console.log('Current primary:', primaryIndividualId);
              setPrimaryIndividualId(selectedIndividualId);
              console.log('setPrimaryIndividualId called');
            }}
            disabled={isPrimary}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isPrimary
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isPrimary
              ? 'Current Primary Individual'
              : 'Set as primary individual'}
          </button>
        </div>
      </div>
    </div>
  );
};
