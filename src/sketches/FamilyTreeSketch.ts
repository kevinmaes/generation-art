import p5 from 'p5';
import { getUniqueEdges, getIndividualCoord } from '../components/helpers';
import type { AugmentedIndividual } from '../components/types';

export interface SketchConfig {
  width: number;
  height: number;
  showNames?: boolean;
  strokeWeight?: number;
  textSize?: number;
  nodeSize?: number;
  colors?: string[];
}

export interface SketchOptions {
  config: SketchConfig;
  familyData: AugmentedIndividual[];
}

/**
 * Create a sketch function for the given configuration
 */
function createSketch(options: SketchOptions): (p: p5) => void {
  const { config, familyData } = options;
  const {
    width,
    height,
    showNames = false,
    strokeWeight = 0.2,
    textSize = 5,
    nodeSize = 10,
    colors = ['#0000ff', '#ffff00'],
  } = config;

  return (p: p5) => {
    p.setup = () => {
      console.log(`🎨 Sketch setup - dimensions: ${width} × ${height}`);

      p.createCanvas(width, height, p.P2D);
      p.pixelDensity(1);
      p.background(255);
    };

    p.draw = () => {
      p.background(255);

      // Draw edges (lines between connected individuals)
      const edges = getUniqueEdges(familyData);
      for (const [id1, id2] of edges) {
        const coord1 = getIndividualCoord(id1, width, height);
        const coord2 = getIndividualCoord(id2, width, height);

        const strokeColor = p.color('#ccc');
        p.stroke(strokeColor);
        p.strokeWeight(strokeWeight);
        p.line(coord1.x, coord1.y, coord2.x, coord2.y);
      }

      // Draw nodes (individuals)
      for (const ind of familyData) {
        const { x, y } = getIndividualCoord(ind.id, width, height);

        p.noStroke();
        const opacity = ind.relativeGenerationValue ?? 100;
        const lerpAmount = (ind.relativeGenerationValue ?? 100) / 100;
        const color = p.lerpColor(
          p.color(colors[0]),
          p.color(colors[1]),
          lerpAmount,
        );
        color.setAlpha(opacity);
        p.fill(color);

        const size = Math.min(
          nodeSize,
          nodeSize + (ind.relativeGenerationValue ?? 0) * (nodeSize / 2),
        );
        p.circle(x, y, size);

        // Show names if enabled
        if (showNames) {
          p.fill(0);
          p.textSize(textSize);
          p.textAlign(p.CENTER);
          p.text(ind.name, x, y + size + textSize);
        }
      }
    };
  };
}

/**
 * Create a web-optimized sketch
 */
export function createWebSketch(
  familyData: AugmentedIndividual[],
  width: number,
  height: number,
) {
  return createSketch({
    config: {
      width,
      height,
      showNames: true,
      strokeWeight: 0.2,
      textSize: 5,
      nodeSize: 10,
    },
    familyData,
  });
}

/**
 * Create a print-optimized sketch
 */
export function createPrintSketch(
  familyData: AugmentedIndividual[],
  width: number,
  height: number,
) {
  return createSketch({
    config: {
      width,
      height,
      showNames: true,
      strokeWeight: 0.5,
      textSize: 12,
      nodeSize: 24,
    },
    familyData,
  });
}
