/**
 * Centralized color constants for the Generation Art application.
 * All colors used throughout the app should be defined here.
 */

// Canvas contrast mode options
export type ContrastMode = 'auto' | 'high' | 'normal';

// Canvas background colors (ordered from lightest to darkest)
export const CANVAS_COLORS = {
  DEFAULT: '#ffffff',
  PRESETS: {
    WHITE: '#ffffff',
    CREAM: '#fffef7',
    LIGHT_GRAY: '#f5f5f5',
    GRAY: '#e0e0e0',
    DARK_GRAY: '#424242',
    CHARCOAL: '#2c2c2c',
    NAVY: '#1a237e',
    MIDNIGHT: '#0f0f1e',
    BLACK: '#000000',
  },
} as const;

// Node status colors
export const NODE_STATUS_COLORS = {
  ALIVE: '#4caf50',
  DECEASED: '#9e9e9e',
  UNKNOWN: '#808080',
} as const;

// Zodiac sign colors
export const ZODIAC_COLORS: Record<string, string> = {
  Aries: '#ff5722',
  Taurus: '#4caf50',
  Gemini: '#ffc107',
  Cancer: '#2196f3',
  Leo: '#ff9800',
  Virgo: '#9c27b0',
  Libra: '#e91e63',
  Scorpio: '#795548',
  Sagittarius: '#607d8b',
  Capricorn: '#3f51b5',
  Aquarius: '#00bcd4',
  Pisces: '#8bc34a',
} as const;

// Monthly colors (January = index 0)
export const MONTHLY_COLORS = [
  '#ff5722', // January
  '#e91e63', // February
  '#9c27b0', // March
  '#673ab7', // April
  '#3f51b5', // May
  '#2196f3', // June
  '#03a9f4', // July
  '#00bcd4', // August
  '#009688', // September
  '#4caf50', // October
  '#8bc34a', // November
  '#cddc39', // December
] as const;

// Edge relationship colors
export const EDGE_COLORS = {
  PARENT_CHILD: '#2196f3',
  SPOUSE: '#e91e63',
  SIBLING: '#ff9800',
  DEFAULT: '#9e9e9e',
  DEFAULT_STROKE: '#000000',
} as const;

// Fallback colors
export const FALLBACK_COLORS = {
  NODE: '#808080',
  EDGE: '#9e9e9e',
  TEXT: '#333333',
} as const;

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.0 formula
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const sRGB = [r, g, b].map((val) => {
    const channel = val / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 * WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if a color is considered "dark"
 */
export function isColorDark(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.5;
}

/**
 * Get a contrasting color (black or white) for text on a given background
 */
export function getContrastColor(backgroundColor: string): string {
  return isColorDark(backgroundColor) ? '#ffffff' : '#000000';
}

/**
 * Adjust a color to ensure minimum contrast with background
 * @param color - The color to adjust
 * @param backgroundColor - The background color
 * @param minContrast - Minimum contrast ratio (default 4.5 for WCAG AA)
 * @returns Adjusted color that meets contrast requirements
 */
export function adjustColorForBackground(
  color: string,
  backgroundColor: string,
  minContrast = 4.5,
): string {
  const currentContrast = getContrastRatio(color, backgroundColor);

  // If contrast is already sufficient, return original color
  if (currentContrast >= minContrast) {
    return color;
  }

  // Determine if we should lighten or darken the color
  const backgroundIsDark = isColorDark(backgroundColor);
  const { r, g, b } = hexToRgb(color);

  // Adjust color by stepping towards white or black
  let adjustedR = r;
  let adjustedG = g;
  let adjustedB = b;
  let step = 0;

  while (step < 100) {
    // Increase step
    step += 5;

    if (backgroundIsDark) {
      // Lighten the color
      adjustedR = Math.min(255, r + step * 2);
      adjustedG = Math.min(255, g + step * 2);
      adjustedB = Math.min(255, b + step * 2);
    } else {
      // Darken the color
      adjustedR = Math.max(0, r - step * 2);
      adjustedG = Math.max(0, g - step * 2);
      adjustedB = Math.max(0, b - step * 2);
    }

    const adjustedHex = rgbToHex(adjustedR, adjustedG, adjustedB);
    const newContrast = getContrastRatio(adjustedHex, backgroundColor);

    if (newContrast >= minContrast) {
      return adjustedHex;
    }
  }

  // If we can't achieve the desired contrast, return black or white
  return getContrastColor(backgroundColor);
}

/**
 * Ensure stroke color has good contrast with both fill and background
 */
export function ensureStrokeContrast(
  strokeColor: string,
  fillColor: string,
  backgroundColor: string,
  minContrast = 3.0,
): string {
  // Ensure stroke is visible against both fill and background
  const fillContrast = getContrastRatio(strokeColor, fillColor);
  const bgContrast = getContrastRatio(strokeColor, backgroundColor);

  // If stroke has good contrast with both, return as is
  if (fillContrast >= minContrast && bgContrast >= minContrast) {
    return strokeColor;
  }

  // Try to find a color that works with both
  // Start with pure black or white based on average luminance
  const avgLuminance =
    (getRelativeLuminance(fillColor) + getRelativeLuminance(backgroundColor)) /
    2;

  const candidateColor = avgLuminance > 0.5 ? '#000000' : '#ffffff';

  // Check if this works
  const candidateFillContrast = getContrastRatio(candidateColor, fillColor);
  const candidateBgContrast = getContrastRatio(candidateColor, backgroundColor);

  if (
    candidateFillContrast >= minContrast &&
    candidateBgContrast >= minContrast
  ) {
    return candidateColor;
  }

  // If not, prioritize contrast with fill color
  return adjustColorForBackground(strokeColor, fillColor, minContrast);
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const darkenedR = Math.floor(r * (1 - percent));
  const darkenedG = Math.floor(g * (1 - percent));
  const darkenedB = Math.floor(b * (1 - percent));
  return rgbToHex(darkenedR, darkenedG, darkenedB);
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const lightenedR = Math.min(255, Math.floor(r + (255 - r) * percent));
  const lightenedG = Math.min(255, Math.floor(g + (255 - g) * percent));
  const lightenedB = Math.min(255, Math.floor(b + (255 - b) * percent));
  return rgbToHex(lightenedR, lightenedG, lightenedB);
}

/**
 * Check if a color meets WCAG AA standards for normal text
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  largeText = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Check if a color meets WCAG AAA standards for normal text
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  largeText = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7.0;
}
