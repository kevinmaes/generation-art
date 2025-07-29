import {
  DEFAULT_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_OPACITY,
  DEFAULT_SHAPE,
  DEFAULT_STROKE_STYLE,
} from '../constants';

export interface VisualParameterConfig {
  id: string;
  label: string;
  description: string;
  type: 'select' | 'range' | 'number' | 'boolean' | 'color';
  category: 'Position' | 'Size' | 'Color' | 'Opacity' | 'Style' | 'General';
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue: string | number | boolean;
}

export const VISUAL_PARAMETERS: Record<string, VisualParameterConfig> = {
  // Position Parameters
  verticalPadding: {
    id: 'verticalPadding',
    label: 'Vertical Padding',
    description: 'Padding from top and bottom of canvas',
    type: 'range',
    category: 'Position',
    min: 10,
    max: 200,
    step: 5,
    defaultValue: 50,
  },
  horizontalPadding: {
    id: 'horizontalPadding',
    label: 'Horizontal Padding',
    description: 'Padding from left and right of canvas',
    type: 'range',
    category: 'Position',
    min: 10,
    max: 200,
    step: 5,
    defaultValue: 50,
  },
  spacing: {
    id: 'spacing',
    label: 'Spacing',
    description: 'General spacing between elements',
    type: 'select',
    category: 'Position',
    options: [
      { value: 'tight', label: 'Tight' },
      { value: 'compact', label: 'Compact' },
      { value: 'normal', label: 'Normal' },
      { value: 'loose', label: 'Loose' },
      { value: 'sparse', label: 'Sparse' },
    ],
    defaultValue: 'normal',
  },

  // Size Parameters
  nodeSize: {
    id: 'nodeSize',
    label: 'Node Size',
    description: 'Size of individual nodes',
    type: 'select',
    category: 'Size',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'extra-large', label: 'Extra Large' },
    ],
    defaultValue: 'medium',
  },
  edgeWidth: {
    id: 'edgeWidth',
    label: 'Edge Width',
    description: 'Width of relationship lines',
    type: 'select',
    category: 'Size',
    options: [
      { value: 'thin', label: 'Thin' },
      { value: 'normal', label: 'Normal' },
      { value: 'thick', label: 'Thick' },
      { value: 'bold', label: 'Bold' },
    ],
    defaultValue: 'normal',
  },

  // Color Parameters
  primaryColor: {
    id: 'primaryColor',
    label: 'Primary Color',
    description: 'Main color for nodes',
    type: 'color',
    category: 'Color',
    defaultValue: DEFAULT_COLOR,
  },
  secondaryColor: {
    id: 'secondaryColor',
    label: 'Secondary Color',
    description: 'Secondary color for edges',
    type: 'color',
    category: 'Color',
    defaultValue: DEFAULT_STROKE_COLOR,
  },
  colorScheme: {
    id: 'colorScheme',
    label: 'Color Scheme',
    description: 'Overall color scheme',
    type: 'select',
    category: 'Color',
    options: [
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'purple', label: 'Purple' },
      { value: 'orange', label: 'Orange' },
      { value: 'red', label: 'Red' },
      { value: 'grayscale', label: 'Grayscale' },
    ],
    defaultValue: 'blue',
  },

  // Opacity Parameters
  nodeOpacity: {
    id: 'nodeOpacity',
    label: 'Node Opacity',
    description: 'Opacity of individual nodes',
    type: 'range',
    category: 'Opacity',
    min: 0.1,
    max: 1.0,
    step: 0.1,
    defaultValue: DEFAULT_OPACITY,
  },
  edgeOpacity: {
    id: 'edgeOpacity',
    label: 'Edge Opacity',
    description: 'Opacity of relationship lines',
    type: 'range',
    category: 'Opacity',
    min: 0.1,
    max: 1.0,
    step: 0.1,
    defaultValue: DEFAULT_OPACITY,
  },

  // Style Parameters
  nodeShape: {
    id: 'nodeShape',
    label: 'Node Shape',
    description: 'Shape of individual nodes',
    type: 'select',
    category: 'Style',
    options: [
      { value: 'circle', label: 'Circle' },
      { value: 'square', label: 'Square' },
      { value: 'diamond', label: 'Diamond' },
      { value: 'triangle', label: 'Triangle' },
    ],
    defaultValue: DEFAULT_SHAPE,
  },
  edgeStyle: {
    id: 'edgeStyle',
    label: 'Edge Style',
    description: 'Style of relationship lines',
    type: 'select',
    category: 'Style',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'double', label: 'Double' },
    ],
    defaultValue: DEFAULT_STROKE_STYLE,
  },

  // General Parameters
  variationFactor: {
    id: 'variationFactor',
    label: 'Variation Factor',
    description: 'Amount of random variation to apply',
    type: 'range',
    category: 'General',
    min: 0,
    max: 1.0,
    step: 0.1,
    defaultValue: 0.2,
  },
  temperature: {
    id: 'temperature',
    label: 'Temperature',
    description: 'Randomness factor for non-deterministic behavior',
    type: 'range',
    category: 'General',
    min: 0,
    max: 1.0,
    step: 0.1,
    defaultValue: 0.5,
  },
} as const;

export type VisualParameterId = keyof typeof VISUAL_PARAMETERS;

// Type that maps parameter IDs to their actual value types
export type VisualParameterValues = {
  [K in VisualParameterId]: (typeof VISUAL_PARAMETERS)[K]['defaultValue'];
};

// Helper function to get parameters by category
export const getVisualParametersByCategory = (
  category: VisualParameterConfig['category'],
) => {
  return Object.values(VISUAL_PARAMETERS).filter(
    (param) => param.category === category,
  );
};

// Helper function to get parameters by type
export const getVisualParametersByType = (
  type: VisualParameterConfig['type'],
) => {
  return Object.values(VISUAL_PARAMETERS).filter(
    (param) => param.type === type,
  );
};

// Helper function to get parameter by ID
export const getVisualParameter = (
  id: VisualParameterId,
): VisualParameterConfig => {
  return VISUAL_PARAMETERS[id];
};
