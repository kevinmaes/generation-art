import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import {
  type ArtGeneratorProps,
  type AugmentedIndividual,
  getUniqueEdges,
  getIndividualCoord,
} from './helpers';

export function ArtGenerator({
  width = 1000,
  height = 800,
}: ArtGeneratorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AugmentedIndividual[] | null>(null);

  useEffect(() => {
    // Load the augmented JSON data
    fetch('/gedcom-public/kennedy/kennedy-augmented.json')
      .then((res) => res.json())
      .then((jsonData) => {
        console.log('Loaded augmented data:', jsonData);
        setData(jsonData);
      })
      .catch((err) => console.error('Error loading data:', err));
  }, []);

  useEffect(() => {
    if (!containerRef.current || !data) return;

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

    const p5Instance = new p5(sketch, containerRef.current);
    return () => {
      p5Instance.remove();
    };
  }, [width, height, data]);

  return <div ref={containerRef} />;
}
