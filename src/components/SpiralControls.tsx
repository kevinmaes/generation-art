import React from 'react';
import { updateSpiralConfig, clearPositionCache } from './helpers';
import type { SpiralType, LayoutMode } from '../utils/SpiralLayoutTransformer';

export interface SpiralControlsProps {
  spiralType: SpiralType;
  layoutMode: LayoutMode;
  spiralTightness: number;
  nodeSpacing: number;
  spacingGrowth: 'linear' | 'exponential' | 'logarithmic';
  primaryIndividualId?: string;
  availableIndividuals?: Array<{ id: string; name: string }>;
  onConfigChange?: (config: any) => void;
}

export function SpiralControls({
  spiralType,
  layoutMode,
  spiralTightness,
  nodeSpacing,
  spacingGrowth,
  primaryIndividualId,
  availableIndividuals = [],
  onConfigChange,
}: SpiralControlsProps): React.ReactElement {

  const handleConfigChange = (updates: any) => {
    // Update the global spiral configuration
    updateSpiralConfig(updates);
    
    // Clear position cache to force recalculation
    clearPositionCache();
    
    // Notify parent component
    if (onConfigChange) {
      onConfigChange(updates);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Spiral Layout Controls</h3>
      
      {/* Spiral Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Spiral Type
        </label>
        <select
          value={spiralType}
          onChange={(e) => handleConfigChange({ spiralType: e.target.value as SpiralType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="archimedean">Archimedean (Uniform spacing)</option>
          <option value="logarithmic">Logarithmic (Exponential growth)</option>
          <option value="galaxy">Galaxy (Multi-arm spiral)</option>
          <option value="fermat">Fermat's (Optimal packing)</option>
        </select>
      </div>

      {/* Layout Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Layout Mode
        </label>
        <select
          value={layoutMode}
          onChange={(e) => handleConfigChange({ layoutMode: e.target.value as LayoutMode })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="primary-center">Primary Individual at Center</option>
          <option value="oldest-center">Oldest Generation at Center</option>
          <option value="youngest-center">Youngest Generation at Center</option>
        </select>
      </div>

      {/* Primary Individual Selection (only show for primary-center mode) */}
      {layoutMode === 'primary-center' && availableIndividuals.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Individual
          </label>
          <select
            value={primaryIndividualId || ''}
            onChange={(e) => handleConfigChange({ primaryIndividualId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Auto-select (most connected)</option>
            {availableIndividuals.map((individual) => (
              <option key={individual.id} value={individual.id}>
                {individual.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Spiral Tightness */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Spiral Tightness: {spiralTightness.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={spiralTightness}
          onChange={(e) => handleConfigChange({ spiralTightness: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Tight (0.1)</span>
          <span>Loose (2.0)</span>
        </div>
      </div>

      {/* Node Spacing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Node Spacing: {nodeSpacing}px
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={nodeSpacing}
          onChange={(e) => handleConfigChange({ nodeSpacing: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Close (10px)</span>
          <span>Far (100px)</span>
        </div>
      </div>

      {/* Spacing Growth */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Spacing Growth
        </label>
        <select
          value={spacingGrowth}
          onChange={(e) => handleConfigChange({ spacingGrowth: e.target.value as 'linear' | 'exponential' | 'logarithmic' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="linear">Linear (even spacing)</option>
          <option value="exponential">Exponential (spread outward)</option>
          <option value="logarithmic">Logarithmic (pack inward)</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          handleConfigChange({
            spiralType: 'archimedean',
            layoutMode: 'primary-center',
            spiralTightness: 1.0,
            nodeSpacing: 30,
            spacingGrowth: 'linear',
          });
        }}
        className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
      >
        Reset to Defaults
      </button>

      {/* Information */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Spiral Types:</p>
        <ul className="space-y-1">
          <li><strong>Archimedean:</strong> Uniform spacing, classic spiral</li>
          <li><strong>Logarithmic:</strong> Exponential growth, natural spirals</li>
          <li><strong>Galaxy:</strong> Multiple arms, resembles galaxies</li>
          <li><strong>Fermat's:</strong> Optimal packing, efficient use of space</li>
        </ul>
      </div>
    </div>
  );
}