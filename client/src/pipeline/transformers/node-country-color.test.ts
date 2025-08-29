import { describe, it, expect } from 'vitest';
import { nodeCountryColorTransform } from './node-country-color';
import type { TransformerContext, CompleteVisualMetadata } from '../types';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
  AugmentedIndividual,
} from '../../../../shared/types';

// Create minimal test data with specific countries
function createTestData(): {
  gedcomData: GedcomDataWithMetadata;
  llmData: LLMReadyData;
  visualMetadata: CompleteVisualMetadata;
} {
  const individual1 = {
    id: 'I1',
    name: 'Test Individual 1',
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
    familiesAsSpouse: [],
    familiesAsChild: [],
    metadata: {
      generation: 0,
    },
    birth: {
      date: '1917-05-29',
      place: 'Brookline, Massachusetts',
      country: {
        iso2: 'US' as const,
        confidence: 1.0,
        method: 'exact' as const,
      },
    },
  } as unknown as AugmentedIndividual;

  const individual2 = {
    id: 'I2',
    name: 'Test Individual 2',
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
    familiesAsSpouse: [],
    familiesAsChild: [],
    metadata: {
      generation: 0,
    },
    birth: {
      date: '1920-07-15',
      place: 'Dublin',
      country: {
        iso2: 'IE' as const,
        confidence: 1.0,
        method: 'exact' as const,
      },
    },
  } as unknown as AugmentedIndividual;

  const individual3 = {
    id: 'I3',
    name: 'Test Individual 3',
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
    familiesAsSpouse: [],
    familiesAsChild: [],
    metadata: {
      generation: 1,
    },
    // No birth country data
    birth: {
      date: '1958-03-21',
      place: 'Unknown',
    },
  } as unknown as AugmentedIndividual;

  const gedcomData = {
    individuals: {
      I1: individual1,
      I2: individual2,
      I3: individual3,
    },
    families: {},
  } as unknown as GedcomDataWithMetadata;

  const llmData: LLMReadyData = {} as any; // Simplified for testing

  const visualMetadata: CompleteVisualMetadata = {
    individuals: {
      I1: {
        x: 100,
        y: 100,
        size: 20,
        color: '#000000',
        opacity: 0.8,
        shape: 'circle',
      },
      I2: {
        x: 200,
        y: 100,
        size: 20,
        color: '#000000',
        opacity: 0.8,
        shape: 'circle',
      },
      I3: {
        x: 150,
        y: 200,
        size: 20,
        color: '#000000',
        opacity: 0.8,
        shape: 'circle',
      },
    },
    families: {},
    edges: {},
    tree: {},
    global: {},
  };

  return { gedcomData, llmData, visualMetadata };
}

describe('Node Country Color Transformer', () => {
  it('should apply country flag colors with default settings', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const context: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#808080',
        colorIntensity: 0.8,
        layerMode: 'single',
      },
    };

    const result = await nodeCountryColorTransform(context);

    // Check that US individual gets US colors
    const i1Metadata = result.visualMetadata.individuals?.I1;
    expect(i1Metadata).toBeDefined();
    expect(i1Metadata?.nodeLayers).toBeDefined();
    expect(i1Metadata?.nodeLayers).toHaveLength(1);

    const i1Layer = i1Metadata?.nodeLayers?.[0];
    expect(i1Layer).toBeDefined();
    expect(i1Layer?.fill?.color).toBeDefined();
    expect(i1Layer?.fill?.color).not.toBe('#808080'); // Not fallback
    expect(i1Layer?.stroke?.color).toBeDefined(); // Should have stroke

    // Check that Ireland individual gets IE colors
    const i2Metadata = result.visualMetadata.individuals?.I2;
    expect(i2Metadata).toBeDefined();
    expect(i2Metadata?.nodeLayers).toBeDefined();
    expect(i2Metadata?.nodeLayers).toHaveLength(1);

    const i2Layer = i2Metadata?.nodeLayers?.[0];
    expect(i2Layer).toBeDefined();
    expect(i2Layer?.fill?.color).toBeDefined();
    expect(i2Layer?.fill?.color).not.toBe('#808080'); // Not fallback
    expect(i2Layer?.stroke?.color).toBeDefined(); // Should have stroke

    // Check that individual without country gets fallback
    const i3Metadata = result.visualMetadata.individuals?.I3;
    expect(i3Metadata).toBeDefined();
    expect(i3Metadata?.nodeLayers).toBeDefined();
    expect(i3Metadata?.nodeLayers).toHaveLength(1);

    const i3Layer = i3Metadata?.nodeLayers?.[0];
    expect(i3Layer).toBeDefined();
    expect(i3Layer?.fill?.color).toBe('#808080'); // Fallback color
  });

  it('should apply darker stroke when strokeMode is "darker"', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const context: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'darker',
        fallbackColor: '#808080',
        colorIntensity: 0.8,
        layerMode: 'single',
      },
    };

    const result = await nodeCountryColorTransform(context);

    const i1Metadata = result.visualMetadata.individuals?.I1;
    const i1Layer = i1Metadata?.nodeLayers?.[0];
    expect(i1Layer).toBeDefined();

    expect(i1Layer?.stroke?.color).toBeDefined();
    // Stroke should be darker than fill
    const fillColor = i1Layer?.fill?.color || '';
    const strokeColor = i1Layer?.stroke?.color || '';

    // Parse RGB values from hex
    const fillRgb = parseInt(fillColor.slice(1), 16);
    const strokeRgb = parseInt(strokeColor.slice(1), 16);

    // Stroke should be darker (lower RGB values)
    expect(strokeRgb).toBeLessThan(fillRgb);
  });

  it('should have no stroke when strokeMode is "none"', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const context: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'none',
        fallbackColor: '#808080',
        colorIntensity: 0.8,
        layerMode: 'single',
      },
    };

    const result = await nodeCountryColorTransform(context);

    const i1Metadata = result.visualMetadata.individuals?.I1;
    const i1Layer = i1Metadata?.nodeLayers?.[0];
    expect(i1Layer).toBeDefined();

    expect(i1Layer?.stroke).toBeUndefined();
  });

  it('should apply multiple layers when layerMode is "multi"', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const context: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#808080',
        colorIntensity: 0.8,
        layerMode: 'multi',
      },
    };

    const result = await nodeCountryColorTransform(context);

    // US flag should have multiple colors
    const i1Metadata = result.visualMetadata.individuals?.I1;
    expect(i1Metadata?.nodeLayers).toBeDefined();
    // US flag has red, white, and blue
    const nodeLayersLength = i1Metadata?.nodeLayers?.length ?? 0;
    expect(nodeLayersLength).toBeGreaterThan(1);

    // Each layer should have different scales (for concentric circles)
    const layers = i1Metadata?.nodeLayers ?? [];
    const scales = layers.map((l) => l.scale || 1);

    // Scales should be in descending order (largest to smallest)
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('should apply color intensity correctly', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const contextLowIntensity: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#808080',
        colorIntensity: 0.3,
        layerMode: 'single',
      },
    };

    const contextHighIntensity: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#808080',
        colorIntensity: 1.0,
        layerMode: 'single',
      },
    };

    const resultLow = await nodeCountryColorTransform(contextLowIntensity);
    const resultHigh = await nodeCountryColorTransform(contextHighIntensity);

    const i1LayerLow =
      resultLow.visualMetadata.individuals?.I1?.nodeLayers?.[0];
    const i1LayerHigh =
      resultHigh.visualMetadata.individuals?.I1?.nodeLayers?.[0];

    // Both should have colors
    expect(i1LayerLow).toBeDefined();
    expect(i1LayerHigh).toBeDefined();
    expect(i1LayerLow?.fill?.color).toBeDefined();
    expect(i1LayerHigh?.fill?.color).toBeDefined();

    // Low intensity color should be closer to gray (#808080) than high intensity
    // This is a simplified check - actual implementation blends with gray
    expect(i1LayerLow?.fill?.color).not.toBe(i1LayerHigh?.fill?.color);
  });

  it('should use custom fallback color when provided', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const context: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#FF0000', // Red fallback
        colorIntensity: 0.8,
        layerMode: 'single',
      },
    };

    const result = await nodeCountryColorTransform(context);

    // Individual without country should get the custom fallback
    const i3Metadata = result.visualMetadata.individuals?.I3;
    const i3Layer = i3Metadata?.nodeLayers?.[0];
    expect(i3Layer).toBeDefined();

    expect(i3Layer?.fill?.color).toBe('#FF0000');
  });

  it('should preserve existing metadata when applying colors', async () => {
    const { gedcomData, llmData, visualMetadata } = createTestData();

    const context: TransformerContext = {
      gedcomData,
      llmData,
      visualMetadata,
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#808080',
        colorIntensity: 0.8,
        layerMode: 'single',
      },
    };

    const result = await nodeCountryColorTransform(context);

    // Check that position and size are preserved
    const i1Metadata = result.visualMetadata.individuals?.I1;
    expect(i1Metadata?.x).toBe(100);
    expect(i1Metadata?.y).toBe(100);
    expect(i1Metadata?.size).toBe(20);
    expect(i1Metadata?.shape).toBe('circle');
  });

  it('should handle empty data gracefully', async () => {
    const context: TransformerContext = {
      gedcomData: {
        individuals: {},
        families: {},
      } as GedcomDataWithMetadata,
      llmData: {} as any,
      visualMetadata: {
        individuals: {},
        families: {},
        edges: {},
        tree: {},
        global: {},
      },
      dimensions: { primary: 'generation' },
      visual: {
        strokeMode: 'secondary',
        fallbackColor: '#808080',
        colorIntensity: 0.8,
        layerMode: 'single',
      },
    };

    const result = await nodeCountryColorTransform(context);

    expect(result.visualMetadata).toEqual({});
  });
});
