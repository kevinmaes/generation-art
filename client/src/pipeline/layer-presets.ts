/**
 * Layer Preset Definitions
 *
 * Provides pre-configured layer effect combinations that produce
 * meaningful visual results without requiring users to understand
 * the technical parameters.
 */

export interface LayerPreset {
  id: string;
  label: string;
  description: string;
  layerCount: number;
  layerOffset: number;
  layerOpacityFalloff: number;
}

export const LAYER_PRESETS: Record<string, LayerPreset> = {
  flat: {
    id: 'flat',
    label: 'Flat',
    description: 'Single layer with no depth',
    layerCount: 1,
    layerOffset: 0,
    layerOpacityFalloff: 0,
  },
  shadow: {
    id: 'shadow',
    label: 'Shadow',
    description: 'Subtle drop shadow effect',
    layerCount: 3,
    layerOffset: 3,
    layerOpacityFalloff: 0.4,
  },
  echo: {
    id: 'echo',
    label: 'Echo',
    description: 'Motion blur or ghosting effect',
    layerCount: 5,
    layerOffset: 5,
    layerOpacityFalloff: 0.25,
  },
  stack: {
    id: 'stack',
    label: 'Stack',
    description: 'Bold, thick appearance',
    layerCount: 8,
    layerOffset: 1,
    layerOpacityFalloff: 0.1,
  },
  cascade: {
    id: 'cascade',
    label: 'Cascade',
    description: 'Dramatic waterfall effect',
    layerCount: 10,
    layerOffset: 4,
    layerOpacityFalloff: 0.15,
  },
};

export type LayerPresetId = keyof typeof LAYER_PRESETS;

export function getLayerPreset(id: LayerPresetId): LayerPreset {
  return LAYER_PRESETS[id];
}

export function getLayerPresetOptions() {
  return Object.values(LAYER_PRESETS).map((preset) => ({
    value: preset.id,
    label: preset.label,
  }));
}
