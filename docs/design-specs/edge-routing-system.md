# Edge Routing System Design Specification

## Overview

This document specifies the design for a comprehensive, extensible edge routing system for the Generation Art application. The system enables transformers to define complex edge paths using segments, supports edge bundling for efficient rendering, and provides a clean separation between routing logic (in transformers) and rendering logic (in the canvas).

## Core Principles

1. **All edges are segment arrays** - Every edge consists of one or more segments, even simple direct connections
2. **Transformers own routing** - Each transformer calculates and defines all segments for its edges
3. **Renderer is dumb** - The renderer simply draws the segments it receives without routing logic
4. **Segments can be shared** - Multiple edges can reference the same segment (critical for family tree bus lines)
5. **Future-proof for curves** - Support multiple segment types including curves and arcs

## Data Structures

### Core Types

```typescript
// A point in 2D space
interface Point {
  x: number;
  y: number;
}

// Visual style properties
interface SegmentStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

// Each segment represents a drawable path element
interface EdgeSegment {
  id: string; // Unique identifier for sharing
  points: [Point, Point]; // Start and end points
  type: 'straight' | 'arc' | 'quadratic' | 'cubic';

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
interface Edge {
  id: string;
  segmentIds: string[]; // Ordered list of segment IDs

  // Override styles for this edge's use of the segments
  styleOverrides?: Record<string, SegmentStyle>;

  // Metadata
  relationshipType?: string; // e.g., "parent-child", "spouse"
  sourceNodeId?: string;
  targetNodeId?: string;
  bidirectional?: boolean;
}

// Edge layers define z-order through array position
interface EdgeLayer {
  name: string; // Semantic name: "background", "marriages", "parent-child", "debug"
  edges: Edge[]; // Edges in this layer
  visible?: boolean; // Can toggle layer visibility
  style?: SegmentStyle; // Default style for all edges in layer
}

// Complete routing output from a transformer
interface RoutingOutput {
  segments: Record<string, EdgeSegment>; // All unique segments
  layers: EdgeLayer[]; // Ordered layers (index = z-order)
}
```

## Edge Bundling Architecture

### Concept

Edge bundling allows multiple edges to share common segments, reducing visual clutter and emphasizing shared paths. This is particularly important for family trees where siblings share a common horizontal "bus" line.

### Implementation Example

```typescript
// Parent with 3 children - demonstrating segment sharing and layering
const routingOutput: RoutingOutput = {
  segments: {
    // Vertical drop from parent (SHARED by all edges)
    seg_p1_drop: {
      id: 'seg_p1_drop',
      points: [
        { x: 400, y: 100 },
        { x: 400, y: 150 },
      ],
      type: 'straight',
      label: 'parent_drop',
      shared: true,
    },

    // Horizontal bus connecting all children (SHARED)
    seg_sibling_bus: {
      id: 'seg_sibling_bus',
      points: [
        { x: 300, y: 150 },
        { x: 500, y: 150 },
      ],
      type: 'straight',
      style: { strokeWeight: 3, strokeColor: '#333' },
      label: 'sibling_bus',
      shared: true,
    },

    // Individual drops to each child (UNIQUE)
    seg_c1_drop: {
      id: 'seg_c1_drop',
      points: [
        { x: 300, y: 150 },
        { x: 300, y: 200 },
      ],
      type: 'straight',
      label: 'child_drop',
    },
    seg_c2_drop: {
      id: 'seg_c2_drop',
      points: [
        { x: 400, y: 150 },
        { x: 400, y: 200 },
      ],
      type: 'straight',
      label: 'child_drop',
    },
    seg_c3_drop: {
      id: 'seg_c3_drop',
      points: [
        { x: 500, y: 150 },
        { x: 500, y: 200 },
      ],
      type: 'straight',
      label: 'child_drop',
    },

    // Marriage line
    seg_marriage: {
      id: 'seg_marriage',
      points: [
        { x: 380, y: 100 },
        { x: 420, y: 100 },
      ],
      type: 'straight',
      style: { strokeWeight: 2, strokeColor: '#666' },
    },
  },

  // Layers define z-order through array position (first = back, last = front)
  layers: [
    {
      name: 'background',
      edges: [],
      style: { opacity: 0.3 },
    },
    {
      name: 'marriages',
      edges: [
        {
          id: 'edge_marriage',
          segmentIds: ['seg_marriage'],
          relationshipType: 'spouse',
          sourceNodeId: 'p1',
          targetNodeId: 'p2',
        },
      ],
      style: { strokeColor: '#666' },
    },
    {
      name: 'parent-child',
      edges: [
        {
          id: 'edge_p1_c1',
          segmentIds: ['seg_p1_drop', 'seg_sibling_bus', 'seg_c1_drop'],
          relationshipType: 'parent-child',
          sourceNodeId: 'p1',
          targetNodeId: 'c1',
        },
        {
          id: 'edge_p1_c2',
          segmentIds: ['seg_p1_drop', 'seg_sibling_bus', 'seg_c2_drop'],
          relationshipType: 'parent-child',
          sourceNodeId: 'p1',
          targetNodeId: 'c2',
        },
        {
          id: 'edge_p1_c3',
          segmentIds: ['seg_p1_drop', 'seg_sibling_bus', 'seg_c3_drop'],
          relationshipType: 'parent-child',
          sourceNodeId: 'p1',
          targetNodeId: 'c3',
        },
      ],
      style: { strokeColor: '#333' },
    },
    {
      name: 'debug',
      edges: [],
      visible: false, // Can be toggled for debugging
      style: { strokeColor: 'red', strokeStyle: 'dashed' },
    },
  ],
};
```

### Benefits of Segment Sharing

1. **Visual Clarity**: Shared paths are rendered once, reducing clutter
2. **Performance**: Fewer draw calls for shared segments
3. **Semantic Meaning**: Shared segments represent actual relationships (e.g., sibling groups)
4. **Style Consistency**: Shared segments automatically have consistent styling

## Routing Strategies

Different transformers can implement different routing strategies based on their visualization needs:

### Orthogonal Routing (Family Trees)

```typescript
interface OrthogonalRoutingConfig {
  preferredAngles: number[]; // [0, 90, 180, 270] for right angles
  cornerStyle: 'sharp' | 'rounded';
  minSegmentLength: number; // Avoid tiny segments
  gridSnap?: number; // Snap to grid for alignment

  // Family tree specific
  dropDistance: number; // Vertical distance before horizontal
  busOffset: number; // Distance below parents for sibling bus
  childSpacing: number; // Horizontal space between siblings
}
```

### Organic Routing (Network Graphs)

```typescript
interface OrganicRoutingConfig {
  curveType: 'quadratic' | 'cubic';
  tension: number; // 0-1, how tight the curves are
  avoidNodes: boolean; // Route around nodes
  bundleThreshold: number; // Distance to trigger bundling
}
```

### Radial Routing (Circular Layouts)

```typescript
interface RadialRoutingConfig {
  centerPoint: Point;
  arcDirection: 'clockwise' | 'counterclockwise' | 'shortest';
  innerRadius: number; // Minimum radius for routing
  outerRadius: number; // Maximum radius for routing
}
```

### Direct Routing (Simple)

```typescript
interface DirectRoutingConfig {
  // No configuration needed - just connect points directly
  // Results in single-segment edges
}
```

## Family Tree Specific Patterns

### T-Junction Pattern

Connects parent(s) to multiple children with a T-shaped junction:

```typescript
function createTJunction(
  parent: Point,
  children: Point[],
  config: OrthogonalRoutingConfig,
): RoutingOutput {
  const segments: Record<string, EdgeSegment> = {};
  const edges: Record<string, Edge> = {};

  // Calculate bus position
  const busY = parent.y + config.dropDistance;
  const childrenXs = children.map((c) => c.x);
  const busStartX = Math.min(...childrenXs);
  const busEndX = Math.max(...childrenXs);

  // Create shared segments
  const parentDropId = `drop_${parent.x}_${parent.y}_${busY}`;
  const busId = `bus_${busStartX}_${busY}_${busEndX}`;

  segments[parentDropId] = {
    id: parentDropId,
    points: [
      { x: parent.x, y: parent.y },
      { x: parent.x, y: busY },
    ],
    type: 'straight',
    shared: true,
  };

  segments[busId] = {
    id: busId,
    points: [
      { x: busStartX, y: busY },
      { x: busEndX, y: busY },
    ],
    type: 'straight',
    shared: true,
    style: { strokeWeight: 3 },
  };

  // Create individual child drops and edges
  children.forEach((child, index) => {
    const childDropId = `drop_${child.x}_${busY}_${child.y}`;
    segments[childDropId] = {
      id: childDropId,
      points: [
        { x: child.x, y: busY },
        { x: child.x, y: child.y },
      ],
      type: 'straight',
    };

    edges[`parent_child_${index}`] = {
      id: `parent_child_${index}`,
      segmentIds: [parentDropId, busId, childDropId],
      relationshipType: 'parent-child',
    };
  });

  return { segments, edges };
}
```

### Marriage Bracket Pattern

Connects spouses with a bracket or line:

```typescript
function createMarriageBracket(
  spouse1: Point,
  spouse2: Point,
  style: 'straight' | 'bracket' | 'curved',
): EdgeSegment[] {
  switch (style) {
    case 'straight':
      return [
        {
          id: `marriage_${spouse1.x}_${spouse2.x}`,
          points: [spouse1, spouse2],
          type: 'straight',
          style: { strokeWeight: 2, strokeStyle: 'solid' },
        },
      ];

    case 'bracket':
      const midY = (spouse1.y + spouse2.y) / 2 - 10;
      return [
        {
          id: `marriage_bracket_1`,
          points: [
            { x: spouse1.x, y: spouse1.y },
            { x: spouse1.x, y: midY },
          ],
          type: 'straight',
        },
        {
          id: `marriage_bracket_2`,
          points: [
            { x: spouse1.x, y: midY },
            { x: spouse2.x, y: midY },
          ],
          type: 'straight',
        },
        {
          id: `marriage_bracket_3`,
          points: [
            { x: spouse2.x, y: midY },
            { x: spouse2.x, y: spouse2.y },
          ],
          type: 'straight',
        },
      ];

    case 'curved':
      const control = {
        x: (spouse1.x + spouse2.x) / 2,
        y: Math.min(spouse1.y, spouse2.y) - 20,
      };
      return [
        {
          id: `marriage_curve`,
          points: [spouse1, spouse2],
          type: 'quadratic',
          controlPoints: [control],
          style: { strokeWeight: 2 },
        },
      ];
  }
}
```

## Renderer Implementation

The renderer becomes significantly simpler with this architecture:

```typescript
class EdgeRenderer {
  private drawnSegments = new Set<string>();

  render(routingOutput: RoutingOutput, p5: P5): void {
    // Reset for new frame
    this.drawnSegments.clear();

    // Sort edges by priority for z-ordering
    const sortedEdges = Object.values(routingOutput.edges).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0),
    );

    // Draw edges (segments are drawn only once)
    sortedEdges.forEach((edge) => {
      this.renderEdge(edge, routingOutput.segments, p5);
    });
  }

  private renderEdge(
    edge: Edge,
    segments: Record<string, EdgeSegment>,
    p5: P5,
  ): void {
    edge.segmentIds.forEach((segmentId) => {
      if (!this.drawnSegments.has(segmentId)) {
        const segment = segments[segmentId];
        if (segment) {
          this.drawSegment(segment, edge.styleOverrides?.[segmentId], p5);
          this.drawnSegments.add(segmentId);
        }
      }
    });
  }

  private drawSegment(
    segment: EdgeSegment,
    styleOverride: SegmentStyle | undefined,
    p5: P5,
  ): void {
    const style = { ...segment.style, ...styleOverride };

    // Apply style
    p5.stroke(style.strokeColor || '#000');
    p5.strokeWeight(style.strokeWeight || 1);

    if (style.strokeStyle === 'dashed') {
      p5.drawingContext.setLineDash([5, 5]);
    } else if (style.strokeStyle === 'dotted') {
      p5.drawingContext.setLineDash([2, 2]);
    }

    // Draw based on type
    const [start, end] = segment.points;

    switch (segment.type) {
      case 'straight':
        p5.line(start.x, start.y, end.x, end.y);
        break;

      case 'quadratic':
        if (segment.controlPoints && segment.controlPoints.length >= 1) {
          const cp = segment.controlPoints[0];
          p5.bezier(start.x, start.y, cp.x, cp.y, cp.x, cp.y, end.x, end.y);
        }
        break;

      case 'cubic':
        if (segment.controlPoints && segment.controlPoints.length >= 2) {
          const [cp1, cp2] = segment.controlPoints;
          p5.bezier(start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
        }
        break;

      case 'arc':
        // TODO: Implement arc rendering
        break;
    }

    // Reset line dash
    p5.drawingContext.setLineDash([]);
  }
}
```

## Migration Strategy

### Phase 1: Update Types

1. Add new types to shared types
2. Extend existing EdgeMetadata to support both old and new format
3. Add type guards to detect format

### Phase 2: Update Renderer

1. Implement new EdgeRenderer class
2. Add fallback for old single-segment edges
3. Test with mock data

### Phase 3: Update Transformers

1. Start with walker-tree transformer
2. Implement orthogonal routing for family trees
3. Gradually update other transformers

### Phase 4: Optimization

1. Implement segment caching
2. Add segment merging for collinear segments
3. Performance profiling

## Design Decisions

Based on architectural analysis and requirements, the following decisions have been made:

### 1. Segment ID Generation

**Decision**: Use deterministic IDs based on segment content (coordinates + type)

**Implementation**:

```typescript
function generateSegmentId(segment: Omit<EdgeSegment, 'id'>): string {
  const [start, end] = segment.points;
  const typePrefix = segment.type.charAt(0); // 's' for straight, 'a' for arc, etc.

  // For straight segments: "s_x1_y1_x2_y2"
  if (segment.type === 'straight') {
    return `${typePrefix}_${start.x}_${start.y}_${end.x}_${end.y}`;
  }

  // For curves: include control points
  if (segment.controlPoints && segment.controlPoints.length > 0) {
    const cpString = segment.controlPoints
      .map((cp) => `${cp.x}_${cp.y}`)
      .join('_');
    return `${typePrefix}_${start.x}_${start.y}_${cpString}_${end.x}_${end.y}`;
  }

  // For arcs: include radius and direction
  if (segment.type === 'arc') {
    return `${typePrefix}_${start.x}_${start.y}_${end.x}_${end.y}_r${segment.radius}_${segment.clockwise ? 'cw' : 'ccw'}`;
  }

  return `${typePrefix}_${start.x}_${start.y}_${end.x}_${end.y}`;
}
```

**Benefits**:

- Automatic segment sharing detection
- No need for transformers to manage IDs
- Consistent across renders
- Cache-friendly

### 2. Z-Order Management

**Decision**: Use the layered system as already implemented

The design already uses a layer-based system with array indices determining z-order. This provides:

- Semantic meaning through layer names
- Clear visual hierarchy
- Easy debugging by toggling layer visibility
- Consistent rendering order

### 3. Segment Merging

**Decision**: Implement collinear segment merging as an optimization pass

**Implementation Strategy**:

```typescript
function mergeCollinearSegments(segments: EdgeSegment[]): EdgeSegment[] {
  // Only merge consecutive straight segments that are collinear
  const merged: EdgeSegment[] = [];
  let current: EdgeSegment | null = null;

  for (const segment of segments) {
    if (!current) {
      current = segment;
      continue;
    }

    if (canMerge(current, segment)) {
      // Extend current segment to include next segment's endpoint
      current = {
        ...current,
        points: [current.points[0], segment.points[1]],
        id: generateSegmentId({
          ...current,
          points: [current.points[0], segment.points[1]],
        }),
      };
    } else {
      merged.push(current);
      current = segment;
    }
  }

  if (current) merged.push(current);
  return merged;
}

function canMerge(seg1: EdgeSegment, seg2: EdgeSegment): boolean {
  if (seg1.type !== 'straight' || seg2.type !== 'straight') return false;

  // Check if endpoint of seg1 matches startpoint of seg2
  const [, end1] = seg1.points;
  const [start2] = seg2.points;
  if (end1.x !== start2.x || end1.y !== start2.y) return false;

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
```

**When to Apply**:

- After initial routing calculation
- Before rendering (cached result)
- Optional based on performance needs

### 4. Performance Optimization

**Decision**: Implement multi-level caching strategy

**Cache Levels**:

1. **Segment Cache**: Cache rendered segments by ID (Phase 4)
2. **Route Cache**: Cache complete routing outputs per transformer state
3. **Draw Call Cache**: For static views, cache entire canvas state

**Implementation Plan**:

```typescript
class SegmentCache {
  private cache = new Map<string, Path2D>();
  private maxSize = 1000;

  get(segment: EdgeSegment): Path2D | null {
    return this.cache.get(segment.id) || null;
  }

  set(segment: EdgeSegment, path: Path2D): void {
    if (this.cache.size >= this.maxSize) {
      // LRU eviction
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(segment.id, path);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## Success Criteria

1. All transformers can define multi-segment edges
2. Family tree shows proper T-junctions and sibling buses
3. Shared segments are rendered only once
4. Renderer code is simpler and more maintainable
5. System supports future segment types without breaking changes
6. Performance is equal or better than current implementation

## References

- [D3.js Edge Bundling](https://observablehq.com/@d3/hierarchical-edge-bundling)
- [Orthogonal Edge Routing](https://www.yworks.com/products/yfiles/documentation/edge-routing)
- [Family Tree Edge Patterns](https://www.familytreedna.com/learn/family-tree/)
