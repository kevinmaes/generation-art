import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createWebSketch } from '../FamilyTreeSketch';
import { CANVAS_DIMENSIONS } from '../../../../shared/constants';
import type { GedcomDataWithMetadata } from '../../../../shared/types';

const DEFAULT_WIDTH = CANVAS_DIMENSIONS.WEB.WIDTH;
const DEFAULT_HEIGHT = CANVAS_DIMENSIONS.WEB.HEIGHT;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  gedcomData?: GedcomDataWithMetadata;
  onExportReady?: (p5Instance: p5) => void;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  gedcomData,
  onExportReady,
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current || !gedcomData) return;

    // Clean up previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    const sketch = createWebSketch(gedcomData, width, height);

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
  }, [width, height, gedcomData, onExportReady]);

  if (!gedcomData) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{
          width: `${String(width || DEFAULT_WIDTH)}px`,
          height: `${String(height || DEFAULT_HEIGHT)}px`,
        }}
      >
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">
            No GEDCOM data provided
          </div>
          <p className="text-gray-400 text-sm">
            Please provide GEDCOM data to generate artwork
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`p5-container-${String(gedcomData.individuals.length)}`}
      ref={containerRef}
      style={{
        width: `${String(width || DEFAULT_WIDTH)}px`,
        height: `${String(height || DEFAULT_HEIGHT)}px`,
      }}
    />
  );
}
