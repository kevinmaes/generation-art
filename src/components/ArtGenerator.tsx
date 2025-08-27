import { useEffect, useRef, useCallback, useState } from 'react';
import p5 from 'p5';
import { createWebSketch } from '../sketches/FamilyTreeSketch';
import { useGedcomData } from '../hooks/useGedcomData';
import { SpiralControls } from './SpiralControls';
import type { SpiralType, LayoutMode } from '../utils/SpiralLayoutTransformer';

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 800;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  jsonFile?: string;
  onExportReady?: (p5Instance: p5) => void;
  showControls?: boolean;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  jsonFile,
  onExportReady,
  showControls = false,
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  
  // Spiral configuration state
  const [spiralConfig, setSpiralConfig] = useState({
    spiralType: 'archimedean' as SpiralType,
    layoutMode: 'primary-center' as LayoutMode,
    spiralTightness: 1.0,
    nodeSpacing: 30,
    spacingGrowth: 'linear' as 'linear' | 'exponential' | 'logarithmic',
    primaryIndividualId: undefined as string | undefined,
  });

  const handleError = useCallback((errorMessage: string) => {
    console.error('Failed to load family data:', errorMessage);
  }, []);

  const { data, loading, error, refetch } = useGedcomData({
    jsonFile: jsonFile ?? '',
    onError: handleError,
  });

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Clean up previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    const sketch = createWebSketch(data, width, height);

    p5InstanceRef.current = new p5(sketch, containerRef.current);

    // Call onExportReady with the p5 instance once it's created
    if (onExportReady) {
      onExportReady(p5InstanceRef.current);
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [width, height, data, onExportReady, spiralConfig]); // Add spiralConfig dependency

  // Handle spiral configuration changes
  const handleSpiralConfigChange = useCallback((updates: any) => {
    setSpiralConfig(prev => ({ ...prev, ...updates }));
  }, []);

  if (!jsonFile) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">
            No JSON file provided
          </div>
          <p className="text-gray-400 text-sm">
            Please specify a JSON file to load family data
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading family data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg mb-2">Failed to load data</div>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 text-lg">No data available</div>
        </div>
      </div>
    );
  }

  const availableIndividuals = data?.map(ind => ({ id: ind.id, name: ind.name })) || [];

  return (
    <div className="w-full">
      {showControls && data && (
        <div className="mb-4">
          <SpiralControls
            spiralType={spiralConfig.spiralType}
            layoutMode={spiralConfig.layoutMode}
            spiralTightness={spiralConfig.spiralTightness}
            nodeSpacing={spiralConfig.nodeSpacing}
            spacingGrowth={spiralConfig.spacingGrowth}
            primaryIndividualId={spiralConfig.primaryIndividualId}
            availableIndividuals={availableIndividuals}
            onConfigChange={handleSpiralConfigChange}
          />
        </div>
      )}
      <div key={`p5-container-${jsonFile}`} ref={containerRef} />
    </div>
  );
}
