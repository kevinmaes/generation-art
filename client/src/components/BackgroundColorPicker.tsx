/**
 * BackgroundColorPicker Component
 * 
 * Provides UI for selecting canvas background color with presets,
 * custom color input, and contrast preview.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useCanvasBackground } from '../hooks/useCanvasBackground';
import { getContrastRatio, meetsWCAGAA } from '../constants/colors';

interface BackgroundColorPickerProps {
  className?: string;
  showContrastInfo?: boolean;
  compact?: boolean;
}

export const BackgroundColorPicker: React.FC<BackgroundColorPickerProps> = ({
  className = '',
  showContrastInfo = true,
  compact = false,
}) => {
  const {
    backgroundColor,
    setBackgroundColor,
    presets,
    resetBackground,
    isValidHexColor,
  } = useCanvasBackground();

  const [customColor, setCustomColor] = useState(backgroundColor);
  const [colorError, setColorError] = useState<string | null>(null);

  // Handle preset color selection
  const handlePresetClick = useCallback((color: string) => {
    setBackgroundColor(color);
    setCustomColor(color);
    setColorError(null);
  }, [setBackgroundColor]);

  // Handle custom color input change
  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    
    if (color.startsWith('#')) {
      if (isValidHexColor(color)) {
        setBackgroundColor(color);
        setColorError(null);
      } else if (color.length > 1) {
        setColorError('Invalid hex color format');
      }
    }
  }, [setBackgroundColor, isValidHexColor]);

  // Handle color picker change
  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setBackgroundColor(color);
    setColorError(null);
  }, [setBackgroundColor]);

  // Get color name for accessibility
  const getColorName = useCallback((color: string): string => {
    const colorNames: Record<string, string> = {
      '#ffffff': 'White',
      '#000000': 'Black',
      '#f5f5f5': 'Light Gray',
      '#e0e0e0': 'Gray',
      '#424242': 'Dark Gray',
      '#1a237e': 'Navy',
      '#fffef7': 'Cream',
      '#0f0f1e': 'Midnight',
      '#2c2c2c': 'Charcoal',
    };
    return colorNames[color.toLowerCase()] || color;
  }, []);

  // Calculate contrast info
  const contrastInfo = useMemo(() => {
    if (!showContrastInfo) return null;

    const sampleForeground = '#333333'; // Sample text color
    const ratio = getContrastRatio(sampleForeground, backgroundColor);
    const meetsAA = meetsWCAGAA(sampleForeground, backgroundColor);
    
    return {
      ratio: ratio.toFixed(2),
      meetsAA,
      textColor: backgroundColor === '#000000' || backgroundColor === '#424242' || backgroundColor === '#1a237e' || backgroundColor === '#0f0f1e' || backgroundColor === '#2c2c2c' ? '#ffffff' : '#333333',
    };
  }, [backgroundColor, showContrastInfo]);

  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Canvas Background</label>
          
          {/* Preset Colors */}
          <div className="flex gap-1.5">
            {Object.entries(presets).map(([key, color]) => (
              <button
                key={key}
                onClick={() => handlePresetClick(color)}
                className={`w-7 h-7 rounded-md border-2 transition-all transform hover:scale-110 ${
                  backgroundColor === color 
                    ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Set background to ${getColorName(color)}`}
                title={getColorName(color)}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-2 ml-2">
            <div className="w-px h-6 bg-gray-300" />
            <label className="text-xs text-gray-500">Custom:</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={handleColorPickerChange}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors"
              aria-label="Select custom background color"
              title="Choose custom color"
            />
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#ffffff"
              className={`w-24 px-2 py-1 text-xs border rounded ${
                colorError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              aria-label="Enter custom hex color"
            />
          </div>
        </div>

        {/* Reset Button */}
        {backgroundColor !== presets.WHITE && (
          <button
            onClick={resetBackground}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Reset to white background"
          >
            Reset
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Canvas Background</h3>
        {backgroundColor !== presets.WHITE && (
          <button
            onClick={resetBackground}
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            aria-label="Reset to white background"
          >
            Reset to Default
          </button>
        )}
      </div>

      {/* Preset Colors */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-2">Presets</label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(presets).map(([key, color]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(color)}
              className={`relative h-10 rounded-lg border-2 transition-all transform hover:scale-105 ${
                backgroundColor === color 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Set background to ${getColorName(color)}`}
              title={getColorName(color)}
            >
              {backgroundColor === color && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-2">Custom Color</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#ffffff"
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                colorError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Enter custom hex color"
            />
            {colorError && (
              <p className="text-xs text-red-500 mt-1">{colorError}</p>
            )}
          </div>
          <input
            type="color"
            value={backgroundColor}
            onChange={handleColorPickerChange}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            aria-label="Open color picker"
          />
        </div>
      </div>

      {/* Contrast Preview */}
      {showContrastInfo && contrastInfo && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Contrast Preview</span>
            <span className={`font-medium ${contrastInfo.meetsAA ? 'text-green-600' : 'text-orange-600'}`}>
              {contrastInfo.meetsAA ? 'WCAG AA ✓' : 'Low Contrast'}
            </span>
          </div>
          <div 
            className="mt-2 p-3 rounded-md text-sm"
            style={{ 
              backgroundColor, 
              color: contrastInfo.textColor,
            }}
          >
            Sample text on background (Ratio: {contrastInfo.ratio}:1)
          </div>
        </div>
      )}
    </div>
  );
};