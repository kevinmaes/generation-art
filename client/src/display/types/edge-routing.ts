/**
 * Edge Routing System Types
 *
 * This module defines the types for the comprehensive edge routing system
 * that enables transformers to define complex edge paths using segments,
 * supports edge bundling, and provides separation between routing logic
 * (in transformers) and rendering logic (in the canvas).
 */

// Core geometric types
export interface Point {
  x: number;
  y: number;
}

// Visual style properties for segments
export interface SegmentStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

// Segment types
export type SegmentType = 'straight' | 'arc' | 'quadratic' | 'cubic';

// Each segment represents a drawable path element
export interface EdgeSegment {
  id: string; // Unique identifier for sharing
  points: [Point, Point]; // Start and end points
  type: SegmentType;

  // Type-specific properties
  controlPoints?: Point[]; // For quadratic/cubic curves
  radius?: number; // For arcs
  clockwise?: boolean; // For arcs

  // Visual properties (can be overridden per edge)
  style?: SegmentStyle;

  // Metadata for debugging/visualization
  label?: string; // e.g., "sibling_bus", "parent_drop"
  shared?: boolean; // Indicates if this segment is shared
}

// An edge is a collection of segments forming a complete path
export interface RoutedEdge {
  id: string;
  segmentIds: string[]; // Ordered list of segment IDs

  // Override styles for this edge's use of the segments
  styleOverrides?: Record<string, SegmentStyle>;

  // Metadata
  relationshipType?: 'parent-child' | 'spouse' | 'sibling' | (string & {});
  sourceNodeId?: string;
  targetNodeId?: string;
  bidirectional?: boolean;
}

// Edge layers define z-order through array position
export interface EdgeLayer {
  name: string; // Semantic name: "background", "marriages", "parent-child", "debug"
  edges: RoutedEdge[]; // Edges in this layer
  visible?: boolean; // Can toggle layer visibility
  style?: SegmentStyle; // Default style for all edges in layer
}

// Complete routing output from a transformer
export interface RoutingOutput {
  segments: Record<string, EdgeSegment>; // All unique segments
  layers: EdgeLayer[]; // Ordered layers (index = z-order)
}

// Routing configuration types for different strategies
export interface OrthogonalRoutingConfig {
  preferredAngles: number[]; // [0, 90, 180, 270] for right angles
  cornerStyle: 'sharp' | 'rounded';
  minSegmentLength: number; // Avoid tiny segments
  gridSnap?: number; // Snap to grid for alignment

  // Family tree specific
  dropDistance: number; // Vertical distance before horizontal
  busOffset: number; // Distance below parents for sibling bus
  childSpacing: number; // Horizontal space between siblings
}

export interface OrganicRoutingConfig {
  curveType: 'quadratic' | 'cubic';
  tension: number; // 0-1, how tight the curves are
  avoidNodes: boolean; // Route around nodes
  bundleThreshold: number; // Distance to trigger bundling
}

export interface RadialRoutingConfig {
  centerPoint: Point;
  arcDirection: 'clockwise' | 'counterclockwise' | 'shortest';
  innerRadius: number; // Minimum radius for routing
  outerRadius: number; // Maximum radius for routing
}

export type DirectRoutingConfig = Record<string, never>;

// Union type for all routing configs
export type RoutingConfig =
  | OrthogonalRoutingConfig
  | OrganicRoutingConfig
  | RadialRoutingConfig
  | DirectRoutingConfig;

// Helper functions for segment ID generation
export function generateSegmentId(segment: Omit<EdgeSegment, 'id'>): string {
  const [start, end] = segment.points;
  const typePrefix = segment.type.charAt(0); // 's' for straight, 'a' for arc, etc.

  // For straight segments: "s_x1_y1_x2_y2"
  if (segment.type === 'straight') {
    return `${typePrefix}_${String(Math.round(start.x))}_${String(Math.round(start.y))}_${String(Math.round(end.x))}_${String(Math.round(end.y))}`;
  }

  // For curves: include control points
  if (segment.controlPoints && segment.controlPoints.length > 0) {
    const cpString = segment.controlPoints
      .map((cp) => `${String(Math.round(cp.x))}_${String(Math.round(cp.y))}`)
      .join('_');
    return `${typePrefix}_${String(Math.round(start.x))}_${String(Math.round(start.y))}_${cpString}_${String(Math.round(end.x))}_${String(Math.round(end.y))}`;
  }

  // For arcs: include radius and direction
  if (segment.type === 'arc' && segment.radius !== undefined) {
    return `${typePrefix}_${String(Math.round(start.x))}_${String(Math.round(start.y))}_${String(Math.round(end.x))}_${String(Math.round(end.y))}_r${String(Math.round(segment.radius))}_${segment.clockwise ? 'cw' : 'ccw'}`;
  }

  return `${typePrefix}_${String(Math.round(start.x))}_${String(Math.round(start.y))}_${String(Math.round(end.x))}_${String(Math.round(end.y))}`;
}

// Helper to create a straight segment
export function createStraightSegment(
  start: Point,
  end: Point,
  options?: {
    style?: SegmentStyle;
    label?: string;
    shared?: boolean;
  },
): EdgeSegment {
  const segment: Omit<EdgeSegment, 'id'> = {
    points: [start, end],
    type: 'straight',
    ...options,
  };

  return {
    ...segment,
    id: generateSegmentId(segment),
  };
}

// Helper to create a quadratic curve segment
export function createQuadraticSegment(
  start: Point,
  end: Point,
  controlPoint: Point,
  options?: {
    style?: SegmentStyle;
    label?: string;
    shared?: boolean;
  },
): EdgeSegment {
  const segment: Omit<EdgeSegment, 'id'> = {
    points: [start, end],
    type: 'quadratic',
    controlPoints: [controlPoint],
    ...options,
  };

  return {
    ...segment,
    id: generateSegmentId(segment),
  };
}

// Helper to create a cubic curve segment
export function createCubicSegment(
  start: Point,
  end: Point,
  controlPoint1: Point,
  controlPoint2: Point,
  options?: {
    style?: SegmentStyle;
    label?: string;
    shared?: boolean;
  },
): EdgeSegment {
  const segment: Omit<EdgeSegment, 'id'> = {
    points: [start, end],
    type: 'cubic',
    controlPoints: [controlPoint1, controlPoint2],
    ...options,
  };

  return {
    ...segment,
    id: generateSegmentId(segment),
  };
}

// Helper to create an arc segment
export function createArcSegment(
  start: Point,
  end: Point,
  radius: number,
  clockwise = true,
  options?: {
    style?: SegmentStyle;
    label?: string;
    shared?: boolean;
  },
): EdgeSegment {
  const segment: Omit<EdgeSegment, 'id'> = {
    points: [start, end],
    type: 'arc',
    radius,
    clockwise,
    ...options,
  };

  return {
    ...segment,
    id: generateSegmentId(segment),
  };
}

// Helper to merge collinear segments
export function mergeCollinearSegments(segments: EdgeSegment[]): EdgeSegment[] {
  if (segments.length < 2) return segments;

  const merged: EdgeSegment[] = [];
  let current: EdgeSegment | null = null;

  for (const segment of segments) {
    if (!current) {
      current = segment;
      continue;
    }

    if (canMerge(current, segment)) {
      // Extend current segment to include next segment's endpoint
      current = createStraightSegment(current.points[0], segment.points[1], {
        style: current.style,
        label: current.label,
        shared: current.shared ?? segment.shared,
      });
    } else {
      merged.push(current);
      current = segment;
    }
  }

  if (current) merged.push(current);
  return merged;
}

// Check if two segments can be merged
function canMerge(seg1: EdgeSegment, seg2: EdgeSegment): boolean {
  if (seg1.type !== 'straight' || seg2.type !== 'straight') return false;

  // Check if endpoint of seg1 matches startpoint of seg2
  const [, end1] = seg1.points;
  const [start2] = seg2.points;
  if (
    Math.abs(end1.x - start2.x) > 0.001 ||
    Math.abs(end1.y - start2.y) > 0.001
  )
    return false;

  // Check if segments are collinear (same slope)
  const [start1] = seg1.points;
  const [, end2] = seg2.points;

  const dx1 = end1.x - start1.x;
  const dy1 = end1.y - start1.y;
  const dx2 = end2.x - start2.x;
  const dy2 = end2.y - start2.y;

  // Check for collinearity using cross product
  return Math.abs(dx1 * dy2 - dy1 * dx2) < 0.001;
}

// Backward compatibility types (to be deprecated)
export interface LegacyEdgeFormat {
  source: Point;
  target: Point;
  style?: SegmentStyle;
}

// Convert legacy edge to new format
export function convertLegacyEdge(edge: LegacyEdgeFormat): RoutingOutput {
  const segment = createStraightSegment(edge.source, edge.target, {
    style: edge.style,
  });

  return {
    segments: {
      [segment.id]: segment,
    },
    layers: [
      {
        name: 'default',
        edges: [
          {
            id: `edge_${segment.id}`,
            segmentIds: [segment.id],
          },
        ],
      },
    ],
  };
}
