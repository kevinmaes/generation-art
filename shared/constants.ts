// Canvas dimensions and print settings
export const CANVAS_DIMENSIONS = {
  // Web display dimensions (square for radial designs)
  WEB: {
    WIDTH: 1000,
    HEIGHT: 1000,
  },
  // Print dimensions (high resolution for printing, also square)
  PRINT: {
    WIDTH: 2400,
    HEIGHT: 2400,
  },
} as const;

// Aspect ratio (should be consistent between web and print)
export const ASPECT_RATIO =
  CANVAS_DIMENSIONS.WEB.WIDTH / CANVAS_DIMENSIONS.WEB.HEIGHT; // 1.0 (square)

// Print settings
export const PRINT_SETTINGS = {
  // Scale factor for print resolution (how much larger print is than web)
  SCALE_FACTOR: CANVAS_DIMENSIONS.PRINT.WIDTH / CANVAS_DIMENSIONS.WEB.WIDTH, // 2.4
  // DPI for print calculations
  DPI: 300,
  // File naming
  WEB_FILENAME: 'family-tree-art-web',
  PRINT_FILENAME: 'family-tree-art-print',
} as const;

// Validate that aspect ratios match
export const validateAspectRatios = (): boolean => {
  const webRatio = CANVAS_DIMENSIONS.WEB.WIDTH / CANVAS_DIMENSIONS.WEB.HEIGHT;
  const printRatio =
    CANVAS_DIMENSIONS.PRINT.WIDTH / CANVAS_DIMENSIONS.PRINT.HEIGHT;
  return Math.abs(webRatio - printRatio) < 0.01; // Allow small floating point differences
};

// Export file types
export const EXPORT_FORMATS = {
  PNG: 'png',
  JPG: 'jpg',
} as const;
