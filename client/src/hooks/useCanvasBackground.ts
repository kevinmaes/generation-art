/**
 * useCanvasBackground Hook
 *
 * Simplified hook for managing canvas background color.
 * Provides a focused API for background color management
 * while leveraging the broader CanvasSettingsContext.
 */

import { useMemo, useCallback } from 'react';
import { useCanvasSettings } from './useCanvasSettings';
import {
  CANVAS_COLORS,
  meetsWCAGAA,
  meetsWCAGAAA,
  type ContrastMode,
} from '../constants/colors';

export interface UseCanvasBackgroundReturn {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  presets: typeof CANVAS_COLORS.PRESETS;
  resetBackground: () => void;
  ensureContrast: (foreground: string, minRatio?: number) => string;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  checkWCAGCompliance: (foreground: string) => {
    aa: boolean;
    aaa: boolean;
    ratio: number;
  };
  isValidHexColor: (color: string) => boolean;
}

/**
 * Hook for managing canvas background color with contrast utilities
 */
export const useCanvasBackground = (): UseCanvasBackgroundReturn => {
  const { settings, updateSettings, ensureContrast, checkContrast } =
    useCanvasSettings();

  // Validate hex color format
  const isValidHexColorInner = useCallback((color: string): boolean => {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
  }, []);

  // Set background color
  const setBackgroundColor = useCallback(
    (color: string) => {
      // Basic hex color validation
      if (isValidHexColorInner(color)) {
        updateSettings({ backgroundColor: color });
      } else {
        console.warn(`Invalid hex color: ${color}`);
      }
    },
    [updateSettings, isValidHexColorInner],
  );

  // Reset background to default
  const resetBackground = useCallback(() => {
    updateSettings({ backgroundColor: CANVAS_COLORS.DEFAULT });
  }, [updateSettings]);

  // Set contrast mode
  const setContrastMode = useCallback(
    (mode: ContrastMode) => {
      updateSettings({ contrastMode: mode });
    },
    [updateSettings],
  );

  // Check WCAG compliance for a foreground color
  const checkWCAGCompliance = useCallback(
    (foreground: string) => {
      const ratio = checkContrast(foreground);
      return {
        aa: meetsWCAGAA(foreground, settings.backgroundColor),
        aaa: meetsWCAGAAA(foreground, settings.backgroundColor),
        ratio,
      };
    },
    [settings.backgroundColor, checkContrast],
  );

  return useMemo(
    () => ({
      backgroundColor: settings.backgroundColor,
      setBackgroundColor,
      presets: CANVAS_COLORS.PRESETS,
      resetBackground,
      ensureContrast,
      contrastMode: settings.contrastMode,
      setContrastMode,
      checkWCAGCompliance,
      isValidHexColor: isValidHexColorInner,
    }),
    [
      settings.backgroundColor,
      settings.contrastMode,
      setBackgroundColor,
      resetBackground,
      ensureContrast,
      setContrastMode,
      checkWCAGCompliance,
      isValidHexColorInner,
    ],
  );
};

// Utility function exported separately for use outside of React components
export function isValidHexColor(color: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
}
