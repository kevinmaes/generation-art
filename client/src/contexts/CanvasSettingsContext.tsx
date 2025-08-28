/**
 * Canvas Settings Context
 * 
 * Provides canvas configuration including background color, contrast mode,
 * and utility functions for color adjustments. This context ensures all
 * components and transformers have access to canvas settings.
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CANVAS_COLORS,
  getContrastColor as getContrastColorUtil,
  adjustColorForBackground,
  ensureStrokeContrast,
  getContrastRatio,
} from '../constants/colors';

export interface CanvasSettings {
  backgroundColor: string;
  contrastMode: 'auto' | 'high' | 'normal';
  gridEnabled?: boolean;
  padding?: number;
}

interface CanvasSettingsContextValue {
  settings: CanvasSettings;
  updateSettings: (partial: Partial<CanvasSettings>) => void;
  resetSettings: () => void;
  getContrastColor: (color?: string) => string;
  ensureContrast: (foreground: string, minRatio?: number) => string;
  ensureStroke: (stroke: string, fill: string, minRatio?: number) => string;
  checkContrast: (foreground: string, background?: string) => number;
}

const defaultSettings: CanvasSettings = {
  backgroundColor: CANVAS_COLORS.DEFAULT,
  contrastMode: 'auto',
  gridEnabled: false,
  padding: 0,
};

// eslint-disable-next-line react-refresh/only-export-components
export const CanvasSettingsContext = createContext<CanvasSettingsContextValue | null>(null);

export const CanvasSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<CanvasSettings>(() => {
    try {
      const saved = localStorage.getItem('canvas-settings');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CanvasSettings>;
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load canvas settings from localStorage:', error);
    }
    return defaultSettings;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('canvas-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save canvas settings to localStorage:', error);
    }
  }, [settings]);

  // Update partial settings
  const updateSettings = useCallback((partial: Partial<CanvasSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  // Get contrasting color for text/elements on current background
  const getContrastColor = useCallback((color?: string) => {
    const bg = color ?? settings.backgroundColor;
    return getContrastColorUtil(bg);
  }, [settings.backgroundColor]);

  // Ensure foreground color has sufficient contrast with background
  const ensureContrast = useCallback((foreground: string, minRatio?: number) => {
    // Adjust minimum ratio based on contrast mode
    let targetRatio = minRatio ?? 4.5; // WCAG AA default
    
    if (settings.contrastMode === 'high') {
      targetRatio = Math.max(targetRatio, 7.0); // WCAG AAA
    } else if (settings.contrastMode === 'normal') {
      targetRatio = Math.max(targetRatio, 3.0); // Minimum for large text
    }

    return adjustColorForBackground(
      foreground,
      settings.backgroundColor,
      targetRatio
    );
  }, [settings.backgroundColor, settings.contrastMode]);

  // Ensure stroke color is visible against both fill and background
  const ensureStroke = useCallback((stroke: string, fill: string, minRatio?: number) => {
    return ensureStrokeContrast(
      stroke,
      fill,
      settings.backgroundColor,
      minRatio ?? 3.0
    );
  }, [settings.backgroundColor]);

  // Check contrast ratio between foreground and background
  const checkContrast = useCallback((foreground: string, background?: string) => {
    return getContrastRatio(foreground, background ?? settings.backgroundColor);
  }, [settings.backgroundColor]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    getContrastColor,
    ensureContrast,
    ensureStroke,
    checkContrast,
  }), [
    settings,
    updateSettings,
    resetSettings,
    getContrastColor,
    ensureContrast,
    ensureStroke,
    checkContrast,
  ]);

  return (
    <CanvasSettingsContext.Provider value={value}>
      {children}
    </CanvasSettingsContext.Provider>
  );
};

