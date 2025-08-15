/**
 * Edge Renderer
 *
 * Responsible for drawing edge segments to the canvas.
 * Handles segment caching, style application, and various segment types.
 * The renderer is "dumb" - it just draws what it's given without any routing logic.
 */

import type P5 from 'p5';
import type {
  EdgeSegment,
  RoutedEdge,
  EdgeLayer,
  RoutingOutput,
  SegmentStyle,
  LegacyEdgeFormat,
} from './types/edge-routing';
import { convertLegacyEdge } from './types/edge-routing';

// Module-level cache for performance optimization (optional)
const segmentPathCache = new Map<string, Path2D>();

/**
 * Main render function - draws all edges in the routing output
 */
export function renderEdgeRouting(
  routingOutput: RoutingOutput | null | undefined,
  p5: P5,
  options?: {
    debugMode?: boolean;
    useCache?: boolean;
  },
): void {
  if (!routingOutput) return;

  // Track which segments have been drawn this frame (for sharing)
  const drawnSegments = new Set<string>();

  // Draw layers in order (first = back, last = front)
  routingOutput.layers.forEach((layer) => {
    if (layer.visible === false) return; // Skip hidden layers

    renderLayer(layer, routingOutput.segments, drawnSegments, p5);
  });

  // Debug mode: draw segment endpoints and IDs
  if (options?.debugMode) {
    renderDebugInfo(routingOutput.segments, p5);
  }
}

/**
 * Render a single layer of edges
 */
function renderLayer(
  layer: EdgeLayer,
  segments: Record<string, EdgeSegment>,
  drawnSegments: Set<string>,
  p5: P5,
): void {
  layer.edges.forEach((edge) => {
    renderEdge(edge, segments, layer.style, drawnSegments, p5);
  });
}

/**
 * Render a single edge (collection of segments)
 */
function renderEdge(
  edge: RoutedEdge,
  segments: Record<string, EdgeSegment>,
  layerStyle: SegmentStyle | undefined,
  drawnSegments: Set<string>,
  p5: P5,
): void {
  edge.segmentIds.forEach((segmentId) => {
    // Skip if already drawn (for shared segments)
    if (drawnSegments.has(segmentId)) {
      return;
    }

    const segment = segments[segmentId];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!segment) {
      console.warn(`Segment not found: ${segmentId}`);
      return;
    }

    // Combine styles: segment default < layer style < edge override
    const style: SegmentStyle = {
      ...segment.style,
      ...layerStyle,
      ...edge.styleOverrides?.[segmentId],
    };

    drawSegment(segment, style, p5);
    drawnSegments.add(segmentId);
  });
}

/**
 * Draw a single segment
 */
function drawSegment(segment: EdgeSegment, style: SegmentStyle, p5: P5): void {
  const [start, end] = segment.points;
  if (isNaN(start.x) || isNaN(start.y) || isNaN(end.x) || isNaN(end.y)) {
    console.warn('Invalid segment coordinates:', { start, end, segment });
    return;
  }

  // Apply style
  p5.push(); // Save current style

  const strokeColor = style.strokeColor ?? '#000000';
  const strokeWeight = style.strokeWeight ?? 1;
  const opacity = style.opacity ?? 1;

  // Apply opacity to stroke color
  if (opacity < 1 && p5.drawingContext instanceof CanvasRenderingContext2D) {
    p5.drawingContext.globalAlpha = opacity;
  }

  p5.stroke(strokeColor);
  p5.strokeWeight(strokeWeight);
  p5.noFill();

  // Apply line style
  if (p5.drawingContext instanceof CanvasRenderingContext2D) {
    if (style.strokeStyle === 'dashed') {
      p5.drawingContext.setLineDash([5, 5]);
    } else if (style.strokeStyle === 'dotted') {
      p5.drawingContext.setLineDash([2, 2]);
    } else {
      p5.drawingContext.setLineDash([]);
    }
  }

  // Apply line cap and join
  if (style.lineCap === 'round') {
    p5.strokeCap(p5.ROUND);
  } else if (style.lineCap === 'square') {
    p5.strokeCap(p5.SQUARE);
  }

  if (style.lineJoin === 'round') {
    p5.strokeJoin(p5.ROUND);
  } else if (style.lineJoin === 'bevel') {
    p5.strokeJoin(p5.BEVEL);
  } else if (style.lineJoin === 'miter') {
    p5.strokeJoin(p5.MITER);
  }

  // Draw based on segment type
  switch (segment.type) {
    case 'straight':
      p5.line(start.x, start.y, end.x, end.y);
      break;

    case 'quadratic':
      if (segment.controlPoints && segment.controlPoints.length >= 1) {
        const cp = segment.controlPoints[0];
        p5.beginShape();
        p5.vertex(start.x, start.y);
        p5.quadraticVertex(cp.x, cp.y, end.x, end.y);
        p5.endShape();
      } else {
        // Fallback to straight line if control points missing
        p5.line(start.x, start.y, end.x, end.y);
      }
      break;

    case 'cubic':
      if (segment.controlPoints && segment.controlPoints.length >= 2) {
        const [cp1, cp2] = segment.controlPoints;
        p5.bezier(start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
      } else {
        // Fallback to straight line if control points missing
        p5.line(start.x, start.y, end.x, end.y);
      }
      break;

    case 'arc':
      if (segment.radius !== undefined) {
        // Calculate arc parameters
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const chord = Math.sqrt(dx * dx + dy * dy);

        // Ensure radius is at least half the chord length
        const radius = Math.max(segment.radius, chord / 2);

        // Calculate arc center
        const angle = Math.atan2(dy, dx);
        const perpAngle =
          angle + (segment.clockwise ? -Math.PI / 2 : Math.PI / 2);

        // Distance from chord midpoint to arc center
        const h = Math.sqrt(radius * radius - (chord / 2) * (chord / 2));
        const centerX = midX + h * Math.cos(perpAngle);
        const centerY = midY + h * Math.sin(perpAngle);

        // Calculate start and end angles
        const startAngle = Math.atan2(start.y - centerY, start.x - centerX);
        const endAngle = Math.atan2(end.y - centerY, end.x - centerX);

        // Draw arc
        p5.arc(
          centerX,
          centerY,
          radius * 2,
          radius * 2,
          startAngle,
          endAngle,
          p5.OPEN,
        );
      } else {
        // Fallback to straight line if radius missing
        p5.line(start.x, start.y, end.x, end.y);
      }
      break;

    default:
      // Unknown segment type - draw as straight line
      console.warn(`Unknown segment type: ${String(segment.type)}`);
      p5.line(start.x, start.y, end.x, end.y);
  }

  p5.pop(); // Restore previous style
}

/**
 * Render debug information
 */
function renderDebugInfo(segments: Record<string, EdgeSegment>, p5: P5): void {
  p5.push();
  p5.textSize(8);
  p5.textAlign(p5.CENTER, p5.CENTER);
  p5.noStroke();

  Object.values(segments).forEach((segment) => {
    const [start, end] = segment.points;

    // Draw endpoints
    p5.fill(255, 0, 0);
    p5.circle(start.x, start.y, 4);
    p5.circle(end.x, end.y, 4);

    // Draw segment label if present
    if (segment.label) {
      p5.fill(0, 0, 255);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      p5.text(segment.label, midX, midY - 10);
    }

    // Show if segment is shared
    if (segment.shared) {
      p5.fill(0, 128, 0);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      p5.text('SHARED', midX, midY + 10);
    }
  });

  p5.pop();
}

/**
 * Clear the segment cache (call when data changes significantly)
 */
export function clearSegmentCache(): void {
  segmentPathCache.clear();
}

/**
 * Render legacy edge format (for backward compatibility)
 */
export function renderLegacyEdge(edge: LegacyEdgeFormat, p5: P5): void {
  const routingOutput = convertLegacyEdge(edge);
  renderEdgeRouting(routingOutput, p5);
}

/**
 * Batch render legacy edges
 */
export function renderLegacyEdges(edges: LegacyEdgeFormat[], p5: P5): void {
  // Convert all edges to routing outputs and merge
  const allSegments: Record<string, EdgeSegment> = {};
  const allEdges: RoutedEdge[] = [];

  edges.forEach((edge, index) => {
    const output = convertLegacyEdge(edge);
    Object.assign(allSegments, output.segments);

    // Give each edge a unique ID
    output.layers[0].edges.forEach((routedEdge) => {
      allEdges.push({
        ...routedEdge,
        id: `legacy_edge_${String(index)}`,
      });
    });
  });

  const mergedOutput: RoutingOutput = {
    segments: allSegments,
    layers: [
      {
        name: 'legacy',
        edges: allEdges,
      },
    ],
  };

  renderEdgeRouting(mergedOutput, p5);
}
