import { useEffect, useRef, useCallback } from 'react';
import p5 from 'p5';
import { getUniqueEdges, getIndividualCoord } from './helpers';
import { useGedcomData } from '../hooks/useGedcomData';

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 800;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  jsonFile?: string;
  onExportReady?: (p5Instance: p5) => void;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  jsonFile,
  onExportReady,
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

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

    const sketch = (p: p5) => {
      p.setup = () => {
        // Debug: Log the intended dimensions
        console.log(`🎨 Intended canvas dimensions: ${width} × ${height}`);

        // Create canvas with explicit renderer and pixel density
        p.createCanvas(width, height, p.P2D);
        p.pixelDensity(1);

        // Debug: Log the actual canvas dimensions
        console.log(`🎨 Actual canvas dimensions: ${p.width} × ${p.height}`);

        p.background(255);
      };

      p.draw = () => {
        p.background(255);

        // Draw edges (lines between connected individuals)
        const edges = getUniqueEdges(data);
        for (const [id1, id2] of edges) {
          const coord1 = getIndividualCoord(id1, width, height);
          const coord2 = getIndividualCoord(id2, width, height);
          const strokeColor = p.color('#ccc');
          p.stroke(strokeColor);
          p.strokeWeight(0.2);
          p.line(coord1.x, coord1.y, coord2.x, coord2.y);
        }

        // Draw nodes (individuals)
        for (const ind of data) {
          const { x, y } = getIndividualCoord(ind.id, width, height);
          p.noStroke();
          // Use relativeGenerationValue for opacity (default to 100 if missing)
          const opacity = ind.relativeGenerationValue ?? 100;
          const colors = ['#0000ff', '#ffff00'];
          const lerpAmount = (ind.relativeGenerationValue ?? 100) / 100;
          const color = p.lerpColor(
            p.color(colors[0]),
            p.color(colors[1]),
            lerpAmount,
          );
          color.setAlpha(opacity);

          p.fill(color);

          const maxSize = 10;
          const size = Math.min(
            maxSize,
            10 + (ind.relativeGenerationValue ?? 0) * 5,
          );

          p.circle(x, y, size);

          // Uncomment to show names
          p.fill(0);
          p.textSize(5);
          p.textAlign(p.CENTER);
          p.text(ind.name, x, y + 25);
        }
      };
    };

    p5InstanceRef.current = new p5(sketch, containerRef.current);

    // Call onExportReady with the p5 instance once it's created
    if (onExportReady && p5InstanceRef.current) {
      onExportReady(p5InstanceRef.current);
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [width, height, data, onExportReady]);

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

  return <div key={`p5-container-${jsonFile}`} ref={containerRef} />;
}
