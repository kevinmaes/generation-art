import { useEffect, useRef, useState, useCallback } from 'react';
import p5 from 'p5';
import { getUniqueEdges, getIndividualCoord } from './helpers';
import type { AugmentedIndividual } from './types';
import { GedcomLoader } from './GedcomLoader';

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 800;

interface ArtGeneratorProps {
  width?: number;
  height?: number;
  familyName?: string;
}

export function ArtGenerator({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  familyName = 'kennedy',
}: ArtGeneratorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AugmentedIndividual[] | null>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  // Stabilize the callback to prevent infinite loops
  const handleDataLoaded = useCallback((newData: AugmentedIndividual[]) => {
    setData(newData);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Failed to load family data:', error);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Clean up previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(width, height);
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

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [width, height, data]);

  return (
    <div>
      <GedcomLoader
        familyName={familyName}
        onDataLoaded={handleDataLoaded}
        onError={handleError}
      />
      {data && <div key={`p5-container-${familyName}`} ref={containerRef} />}
    </div>
  );
}
