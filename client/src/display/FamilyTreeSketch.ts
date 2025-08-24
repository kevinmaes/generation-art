/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type p5 from 'p5';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { CompleteVisualMetadata, VisualMetadata } from '../pipeline/types';
import { TRANSFORMERS, type TransformerId } from '../pipeline/transformers';
import { PIPELINE_DEFAULTS } from '../pipeline/pipeline';
import { DEFAULT_COLOR } from '../pipeline/constants';
import { renderEdgeRouting } from './edge-renderer';
import type { ShapeProfile } from '../../../shared/types';
import { resolveShapeGeometry } from './shapes/resolve';

export interface SketchConfig {
  width: number;
  height: number;
  showNames?: boolean;
  strokeWeight?: number;
  textSize?: number;
  nodeSize?: number;
  colors?: string[];
  // VisualTransformer pipeline configuration
  transformerIds?: TransformerId[];
  temperature?: number;
  seed?: string;
  // Visibility controls
  showIndividuals?: boolean;
  showRelations?: boolean;
  // Edge rendering
  debugEdgeRouting?: boolean;
}

export interface SketchProps {
  visualMetadata: CompleteVisualMetadata;
  config: SketchConfig;
  gedcomData: GedcomDataWithMetadata;
}

interface Point {
  x: number;
  y: number;
}

type CurveDrawFn = (
  p: p5,
  start: Point,
  end: Point,
  metadata: VisualMetadata,
) => void;

/**
 * Curve drawing functions for different edge types
 */
const CURVE_RENDERERS: Record<string, CurveDrawFn> = {
  straight: (p, start, end) => {
    p.line(start.x, start.y, end.x, end.y);
  },

  'bezier-quad': (p, start, end, metadata) => {
    const controlPoints = metadata.controlPoints ?? [];
    if (controlPoints.length >= 1) {
      const cp = controlPoints[0];
      // Convert quadratic bezier to cubic bezier using mathematical conversion
      // For quadratic: P(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
      // Convert to cubic: CP1 = P₀ + 2/3(P₁ - P₀), CP2 = P₂ + 2/3(P₁ - P₂)
      const cp1x = start.x + (2 / 3) * (cp.x - start.x);
      const cp1y = start.y + (2 / 3) * (cp.y - start.y);
      const cp2x = end.x + (2 / 3) * (cp.x - end.x);
      const cp2y = end.y + (2 / 3) * (cp.y - end.y);

      p.noFill();
      p.bezier(start.x, start.y, cp1x, cp1y, cp2x, cp2y, end.x, end.y);
    } else {
      // Fallback to straight line
      p.line(start.x, start.y, end.x, end.y);
    }
  },

  'bezier-cubic': (p, start, end, metadata) => {
    const controlPoints = metadata.controlPoints ?? [];
    if (controlPoints.length >= 2) {
      const [cp1, cp2] = controlPoints;
      p.noFill();
      p.bezier(start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    } else {
      // Fallback to straight line
      p.line(start.x, start.y, end.x, end.y);
    }
  },

  arc: (p, start, end, metadata) => {
    const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const radius = metadata.arcRadius ?? distance / 2;
    const intensity = metadata.curveIntensity ?? 0.5;

    if (intensity === 0 || radius === 0) {
      p.line(start.x, start.y, end.x, end.y);
      return;
    }

    // Calculate arc center perpendicular to line
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpX = (-dy / distance) * radius * intensity;
    const perpY = (dx / distance) * radius * intensity;

    const centerX = midX + perpX;
    const centerY = midY + perpY;

    // Calculate control points for bezier arc approximation
    const angle1 = Math.atan2(start.y - centerY, start.x - centerX);
    const angle2 = Math.atan2(end.y - centerY, end.x - centerX);

    // Bezier control points for arc approximation (magic number 0.552 for circle approximation)
    const cp1 = {
      x: start.x + Math.cos(angle1 + Math.PI / 2) * radius * 0.552,
      y: start.y + Math.sin(angle1 + Math.PI / 2) * radius * 0.552,
    };
    const cp2 = {
      x: end.x + Math.cos(angle2 - Math.PI / 2) * radius * 0.552,
      y: end.y + Math.sin(angle2 - Math.PI / 2) * radius * 0.552,
    };

    p.noFill();
    p.bezier(start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
  },

  step: (p, start, end, metadata) => {
    const intensity = metadata.curveIntensity ?? 0.5;
    const midX = start.x + (end.x - start.x) * intensity;

    p.line(start.x, start.y, midX, start.y);
    p.line(midX, start.y, midX, end.y);
    p.line(midX, end.y, end.x, end.y);
  },

  's-curve': (p, start, end, metadata) => {
    const intensity = metadata.curveIntensity ?? 0.5;
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const cp1 = {
      x: start.x + dx * 0.25,
      y: start.y + dy * 0.25 + intensity * 50,
    };
    const cp2 = {
      x: start.x + dx * 0.75,
      y: start.y + dy * 0.75 - intensity * 50,
    };

    p.noFill();
    p.bezier(start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
  },

  catenary: (p, start, end, metadata) => {
    const intensity = metadata.curveIntensity ?? 0.5;
    const segments = 20;
    const sag = intensity * 100; // How much the curve sags

    if (intensity === 0 || sag === 0) {
      p.line(start.x, start.y, end.x, end.y);
      return;
    }

    p.noFill();
    p.beginShape();
    p.vertex(start.x, start.y);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = start.x + (end.x - start.x) * t;
      const catenaryY = sag * (Math.cosh((t - 0.5) * 3) - 1);
      const y = start.y + (end.y - start.y) * t + catenaryY;
      p.vertex(x, y);
    }

    p.vertex(end.x, end.y);
    p.endShape();
  },
};

/**
 * Draw an edge with the appropriate curve type
 */
function drawEdge(
  p: p5,
  start: Point,
  end: Point,
  metadata: VisualMetadata,
): void {
  const curveType = metadata.curveType ?? 'straight';
  const renderer = CURVE_RENDERERS[curveType] ?? CURVE_RENDERERS.straight;
  renderer(p, start, end, metadata);
}

/**
 * Enhanced P5 sketch with parameter update methods
 */
export interface EnhancedP5 extends p5 {
  setShowIndividuals: (show: boolean) => void;
  setShowRelations: (show: boolean) => void;
  getVisibleCounts: () => { individuals: number; relations: number };
}

/**
 * Create a sketch function for the given configuration
 */
function createSketch(props: SketchProps): (p: p5) => void {
  const { config, gedcomData, visualMetadata } = props;
  const {
    width,
    height,
    showNames = false,
    strokeWeight: _strokeWeight = 0.2,
    transformerIds = PIPELINE_DEFAULTS.TRANSFORMER_IDS,
    temperature = 0.5,
    seed,
    showIndividuals = true,
    showRelations = true,
    debugEdgeRouting = false,
  } = config;

  return (p: p5) => {
    // Internal state for display parameters
    let currentShowIndividuals = showIndividuals;
    let currentShowRelations = showRelations;
    let visibleIndividualsCount = 0;
    let visibleRelationsCount = 0;

    // Add update methods to the p5 instance
    (p as EnhancedP5).setShowIndividuals = (show: boolean) => {
      currentShowIndividuals = show;
      // Trigger redraw
      p.redraw();
    };

    (p as EnhancedP5).setShowRelations = (show: boolean) => {
      currentShowRelations = show;
      // Trigger redraw
      p.redraw();
    };

    (p as EnhancedP5).getVisibleCounts = () => {
      return {
        individuals: visibleIndividualsCount,
        relations: visibleRelationsCount,
      };
    };
    p.setup = () => {
      p.createCanvas(width, height, p.P2D);
      p.pixelDensity(1);
      p.background(255);
      p.noLoop(); // Only redraw when explicitly called
    };

    p.draw = () => {
      p.background(255);

      // Debug logging
      console.log('Drawing with visual metadata:', {
        individualCount: Object.keys(visualMetadata.individuals).length,
        edgeCount: Object.keys(visualMetadata.edges).length,
        sampleIndividual: Object.values(visualMetadata.individuals)[0],
      });

      // IMPORTANT: Draw edges FIRST (they will be in the background)
      // Draw edges before nodes so that nodes appear on top
      visibleRelationsCount = 0; // Reset count before drawing
      if (currentShowRelations) {
        // Check if we have routing output (orthogonal edges)

        if (visualMetadata.routing) {
          // Use the functional edge renderer for advanced routing
          console.log('📐 Rendering orthogonal edges');
          // Count the actual edges (relations) that will be rendered
          // Each layer contains edges, count all visible edges
          let edgeCount = 0;
          visualMetadata.routing.layers.forEach((layer) => {
            if (layer.visible !== false) {
              // Default is visible
              edgeCount += layer.edges.length;
            }
          });
          visibleRelationsCount = edgeCount;

          renderEdgeRouting(visualMetadata.routing, p, {
            debugMode: debugEdgeRouting,
          });
        } else {
          // Fall back to legacy edge drawing
          for (const edge of gedcomData.metadata.edges) {
            // Skip edges that don't have visual metadata (filtered out by transformers)
            const edgeMetadata = visualMetadata.edges[edge.id];
            if (!edgeMetadata) {
              continue;
            }

            const coord1 = getIndividualCoord(
              edge.sourceId,
              width,
              height,
              visualMetadata,
            );
            const coord2 = getIndividualCoord(
              edge.targetId,
              width,
              height,
              visualMetadata,
            );

            // Skip edges where coordinates couldn't be found
            if (!coord1 || !coord2) {
              continue;
            }

            // Skip edges marked as hidden or with opacity 0
            if (edgeMetadata.hidden || edgeMetadata.opacity === 0) {
              continue;
            }

            // Count this edge as visible (it will be drawn)
            visibleRelationsCount++;

            const strokeColor = p.color(
              edgeMetadata.strokeColor ??
                visualMetadata.global.defaultEdgeColor ??
                '#ccc',
            );
            const opacity = edgeMetadata.opacity ?? 0.8;
            const weight =
              edgeMetadata.strokeWeight ??
              visualMetadata.global.defaultEdgeWeight ??
              1;

            strokeColor.setAlpha(opacity * 255);
            p.stroke(strokeColor);
            p.strokeWeight(weight);

            // Draw edge with appropriate curve type
            drawEdge(p, coord1, coord2, edgeMetadata);
          }
        }
      }

      // Draw nodes (individuals) AFTER edges so they appear on top
      visibleIndividualsCount = 0; // Reset count before drawing
      if (currentShowIndividuals) {
        const individuals = Object.values(gedcomData.individuals);

        // Debug: Track statistics
        let debugLogged = false;
        let totalWithCoords = 0;
        let offCanvas = 0;
        let transparent = 0;

        for (const ind of individuals) {
          const individualMetadata = visualMetadata.individuals[ind.id];

          // Skip individuals that don't have visual metadata from transformers
          if (
            individualMetadata?.x === undefined ||
            individualMetadata?.y === undefined
          ) {
            continue;
          }

          totalWithCoords++;

          // Get all visual properties first
          const x = individualMetadata.x;
          const y = individualMetadata.y;
          const size =
            individualMetadata?.size ??
            visualMetadata.global.defaultNodeSize ??
            20;
          const opacity = individualMetadata?.opacity ?? 0.8;

          // Check if individual is actually on canvas (within bounds)
          const margin = size / 2;
          const isOnCanvas =
            x >= -margin &&
            x <= p.width + margin &&
            y >= -margin &&
            y <= p.height + margin;

          // Check if actually visible (not transparent)
          const isVisible = opacity > 0;

          // Track why individuals are skipped
          if (!isOnCanvas) {
            offCanvas++;
            continue;
          }
          if (!isVisible) {
            transparent++;
            continue;
          }

          // Count this individual as actually visible and drawn
          visibleIndividualsCount++;

          // Debug first few visible individuals
          if (!debugLogged && visibleIndividualsCount <= 3) {
            console.log('Visible individual:', {
              count: visibleIndividualsCount,
              id: ind.id,
              position: { x, y },
              canvasBounds: { width: p.width, height: p.height },
              isOnCanvas,
              opacity,
            });
            if (visibleIndividualsCount === 3) {
              debugLogged = true;
            }
          }
          // Get remaining visual properties
          const width = individualMetadata?.width ?? 1.0;
          const height = individualMetadata?.height ?? 1.0;
          const scale = individualMetadata?.scale ?? 1.0;
          const rotation = individualMetadata?.rotation ?? 0;
          const color =
            individualMetadata?.color ??
            visualMetadata.global.defaultNodeColor ??
            DEFAULT_COLOR;
          const shape =
            individualMetadata?.shape ??
            visualMetadata.global.defaultNodeShape ??
            'circle';

          // Shape geometry: prefer shapeProfile if present
          const shapeProfile: ShapeProfile | undefined =
            individualMetadata?.shapeProfile as unknown as
              | ShapeProfile
              | undefined;
          // opacity already declared above
          const strokeColor = individualMetadata?.strokeColor ?? '#000000'; // Default to black stroke
          const strokeWeight = individualMetadata?.strokeWeight ?? 0;
          const strokeOpacity = individualMetadata?.strokeOpacity ?? 1;

          // Calculate final dimensions
          const finalWidth = size * width;
          const finalHeight = size * height;

          const pColor = p.color(color);
          pColor.setAlpha(opacity * 255);
          p.fill(pColor);

          // Debug first few individuals only
          // if (Math.random() < 0.01) {
          //   // Only log ~1% of individuals
          //   console.log('Sample individual rendering:', {
          //     id: ind.id,
          //     x,
          //     y,
          //     size: finalWidth,
          //     finalHeight: finalHeight,
          //     color,
          //     opacity,
          //     shape,
          //   });
          // }

          // Apply stroke if specified
          if (strokeWeight > 0 && strokeOpacity > 0) {
            const pStrokeColor = p.color(strokeColor);
            pStrokeColor.setAlpha(strokeOpacity * 255);
            p.stroke(pStrokeColor);
            p.strokeWeight(strokeWeight);
          } else {
            p.noStroke();
          }

          // Apply transformations
          p.push();
          p.translate(x, y);
          p.rotate(rotation);
          p.scale(scale);

          // Render shape geometry when available, else fallback to legacy shapes
          if (shapeProfile) {
            // Debug: Log shape profile rendering
            // if (Math.random() < 0.1) {
            //   // Log ~10% of shape profiles to avoid spam
            //   console.log('Rendering shape profile:', {
            //     id: ind.id,
            //     kind: shapeProfile.kind,
            //     shape,
            //     params: shapeProfile.params,
            //   });
            // }
            let profile: ShapeProfile | undefined;
            try {
              const needsSize =
                !shapeProfile.size ||
                (shapeProfile.size.width ?? 0) <= 0 ||
                (shapeProfile.size.height ?? 0) <= 0;
              profile = {
                kind: shapeProfile.kind ?? 'circle',
                size: needsSize
                  ? { width: finalWidth, height: finalHeight }
                  : shapeProfile.size,
                seed: shapeProfile.seed,
                params: shapeProfile.params,
                detail: shapeProfile.detail ?? { maxVertices: 128 },
              };
              const geometry = resolveShapeGeometry(profile);
              p.beginShape();
              const poly = geometry.polygon;
              for (let i = 0; i < poly.length; i += 2) {
                p.vertex(poly[i], poly[i + 1]);
              }
              p.endShape(p.CLOSE);
            } catch (error) {
              // Log error and fallback to circle if geometry fails
              console.error('Shape profile rendering error:', error, {
                individualId: ind.id,
                profile: profile,
                shapeProfile: shapeProfile,
              });
              p.ellipse(0, 0, finalWidth, finalHeight);
            }
          } else {
            // Debug: Log legacy shape fallback
            // if (Math.random() < 0.1) {
            //   // Log ~10% to avoid spam
            //   console.log('Using legacy shape rendering:', {
            //     id: ind.id,
            //     shape,
            //     hasShapeProfile: !!shapeProfile,
            //   });
            // }
            if (shape === 'circle') {
              p.ellipse(0, 0, finalWidth, finalHeight);
            } else if (shape === 'square') {
              p.rectMode(p.CENTER);
              p.rect(0, 0, finalWidth, finalHeight);
            } else if (shape === 'triangle') {
              p.triangle(
                0,
                -finalHeight / 2,
                -finalWidth / 2,
                finalHeight / 2,
                finalWidth / 2,
                finalHeight / 2,
              );
            } else if (shape === 'hexagon') {
              p.beginShape();
              for (let i = 0; i < 6; i++) {
                const angle = (p.TWO_PI / 6) * i;
                const vx = (finalWidth / 2) * p.cos(angle);
                const vy = (finalHeight / 2) * p.sin(angle);
                p.vertex(vx, vy);
              }
              p.endShape(p.CLOSE);
            } else if (shape === 'star') {
              p.beginShape();
              for (let i = 0; i < 10; i++) {
                const angle = (p.TWO_PI / 10) * i;
                const radius = i % 2 === 0 ? finalWidth / 2 : finalWidth / 4;
                const vx = radius * p.cos(angle);
                const vy = radius * p.sin(angle);
                p.vertex(vx, vy);
              }
              p.endShape(p.CLOSE);
            }
          }

          p.pop();

          // Check for labels in custom metadata (from transformers like walker-tree)
          const customMetadata = individualMetadata?.custom as
            | {
                label?: string;
                labelOffsetY?: number;
                labelSize?: number;
              }
            | undefined;
          const customLabel = customMetadata?.label;
          const labelOffsetY = customMetadata?.labelOffsetY ?? size * 0.7;
          const labelSize = customMetadata?.labelSize ?? size * 0.3;

          if (customLabel) {
            // Render label from transformer metadata with background for visibility
            console.log(
              `✍️ Drawing label for ${ind.id}: "${customLabel}" at (${String(x)}, ${String(y + labelOffsetY)})`,
            );

            // Set up text properties
            p.textSize(labelSize);
            p.textAlign(p.CENTER, p.CENTER);

            // Measure text for background
            const textWidth = p.textWidth(customLabel);
            const textHeight = labelSize;
            const padding = 4;

            // Draw semi-transparent white background
            p.push();
            p.noStroke();
            p.fill(255, 255, 255, 230); // White with high opacity
            p.rectMode(p.CENTER);
            p.rect(
              x,
              y + labelOffsetY,
              textWidth + padding * 2,
              textHeight + padding,
              2,
            );
            p.pop();

            // Draw text in black
            p.fill(0);
            p.text(customLabel, x, y + labelOffsetY);
          } else if (showNames && ind.name) {
            // Fallback to showNames config option
            const fallbackSize = Math.max(12, size * 0.3);
            const fallbackOffsetY = Math.max(20, size * 0.7);

            console.log(
              `✍️ Drawing name for ${ind.id}: "${ind.name}" at (${String(x)}, ${String(y + fallbackOffsetY)})`,
            );

            p.textSize(fallbackSize);
            p.textAlign(p.CENTER, p.CENTER);

            // Measure text for background
            const textWidth = p.textWidth(ind.name);
            const textHeight = fallbackSize;
            const padding = 4;

            // Draw semi-transparent white background
            p.push();
            p.noStroke();
            p.fill(255, 255, 255, 230); // White with high opacity
            p.rectMode(p.CENTER);
            p.rect(
              x,
              y + fallbackOffsetY,
              textWidth + padding * 2,
              textHeight + padding,
              2,
            );
            p.pop();

            // Draw text
            p.fill(0);
            p.text(ind.name, x, y + fallbackOffsetY);
          }
        }

        // Log summary once per draw cycle
        if (totalWithCoords > 0) {
          console.log('Individual visibility summary:', {
            totalInDataset: individuals.length,
            withCoordinates: totalWithCoords,
            offCanvas,
            transparent,
            actuallyVisible: visibleIndividualsCount,
            canvasSize: { width: p.width, height: p.height },
          });
        }
      }

      p.fill(100);
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.text(`Pipeline: ${transformerIds.join(', ')}`, 10, 20);
      p.text(`Temperature: ${String(temperature)}`, 10, 35);
      if (seed) {
        p.text(`Seed: ${seed}`, 10, 50);
      }

      // Debug info
      p.text(
        `Individuals: ${String(Object.keys(visualMetadata.individuals).length)}`,
        10,
        65,
      );
      p.text(
        `With positions: ${String(Object.values(visualMetadata.individuals).filter((i) => i.x !== undefined && i.y !== undefined).length)}`,
        10,
        80,
      );
    };
  };
}

/**
 * Create a web-optimized sketch
 */
export function createWebSketch(
  gedcomData: GedcomDataWithMetadata,
  width: number,
  height: number,
  options?: Partial<SketchConfig>,
  visualMetadata?: CompleteVisualMetadata,
): (p: p5) => void {
  const config: SketchConfig = {
    width,
    height,
    showNames: false,
    strokeWeight: 0.2,
    textSize: 5,
    nodeSize: 10,
    colors: ['#0000ff', '#ffff00'],
    transformerIds: [
      TRANSFORMERS.HORIZONTAL_SPREAD.ID,
      TRANSFORMERS.VERTICAL_SPREAD.ID,
    ],
    temperature: 0.5,
    showIndividuals: true,
    showRelations: true,
    ...options,
  };

  // Use provided visual metadata or create initial structure
  const finalVisualMetadata: CompleteVisualMetadata =
    visualMetadata ??
    (() => {
      // Initialize edge visual metadata from actual edge data
      const edges: Record<string, VisualMetadata> = {};
      gedcomData.metadata.edges.forEach((edge) => {
        edges[edge.id] = {
          strokeColor: '#ccc',
          strokeWeight: config.strokeWeight,
          strokeStyle: 'solid',
          opacity: 1.0,
          group: 'edges',
          layer: 1,
          priority: 0,
        };
      });

      return {
        individuals: {},
        families: {},
        edges,
        tree: {
          backgroundColor: '#ffffff',
          group: 'tree',
          layer: 0,
          priority: 0,
        },
        global: {
          canvasWidth: width,
          canvasHeight: height,
          backgroundColor: '#ffffff',
          defaultNodeSize: config.nodeSize,
          defaultEdgeWeight: config.strokeWeight,
          defaultNodeColor: config.colors?.[0] ?? '#0000ff',
          defaultEdgeColor: '#ccc',
          defaultNodeShape: 'circle',
          defaultEdgeStyle: 'solid',
        },
      };
    })();

  return createSketch({
    config,
    gedcomData,
    visualMetadata: finalVisualMetadata,
  });
}

/**
 * Create a print-optimized sketch
 */
export function createPrintSketch(
  gedcomData: GedcomDataWithMetadata,
  width: number,
  height: number,
  options?: Partial<SketchConfig>,
): (p: p5) => void {
  const config: SketchConfig = {
    width,
    height,
    showNames: true,
    strokeWeight: 1,
    textSize: 12,
    nodeSize: 20,
    colors: ['#000000', '#666666'],
    transformerIds: PIPELINE_DEFAULTS.TRANSFORMER_IDS,
    temperature: 0.3,
    showIndividuals: true,
    showRelations: true,
    ...options,
  };

  // Create initial complete visual metadata structure
  const visualMetadata: CompleteVisualMetadata = {
    individuals: {},
    families: {},
    edges: {},
    tree: {
      backgroundColor: '#ffffff',
      group: 'tree',
      layer: 0,
      priority: 0,
    },
    global: {
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor: '#ffffff',
      defaultNodeSize: config.nodeSize,
      defaultEdgeWeight: config.strokeWeight,
      defaultNodeColor: config.colors?.[0] ?? '#000000',
      defaultEdgeColor: '#ccc',
      defaultNodeShape: 'circle',
      defaultEdgeStyle: 'solid',
    },
  };

  return createSketch({ config, gedcomData, visualMetadata });
}

/**
 * Get individual coordinates from visual metadata
 */
function getIndividualCoord(
  individualId: string,
  _canvasWidth: number,
  _canvasHeight: number,
  visualMetadata: CompleteVisualMetadata,
): Point | undefined {
  const metadata = visualMetadata.individuals[individualId];
  if (metadata?.x !== undefined && metadata?.y !== undefined) {
    return { x: metadata.x, y: metadata.y };
  }
  return undefined;
}
