# Genealogy Tree Layout Implementation

Implement a genealogy tree layout system with automatic scaling to fit a fixed canvas size.

## Core Requirements

**Canvas Constraints:**

- Fixed width and height (no scrolling/panning)
- All nodes must be visible and readable
- Automatic scaling based on tree size and complexity

**Layout Algorithm:**

1. **Family Clustering:** Group spouses side-by-side, center parents over children
2. **Walker's Node Positioning:** Use modified Walker algorithm for tree layout
3. **Automatic Scaling:** Calculate scale factor to fit all content in canvas
4. **Connection Routing:** Use orthogonal lines for parent-child and spouse relationships

## Spacing Configuration

```typescript
const BASE_SPACING = {
  spouse: 15, // Gap between spouses
  sibling: 60, // Gap between siblings
  generation: 120, // Vertical gap between generations
  familyGroup: 100, // Gap between different families
  nodeWidth: 150, // Width per person node
  nodeHeight: 80, // Height per person node
  connectorOffset: 20, // Space for connection lines
  padding: 30, // Canvas edge padding
};
```

## Scaling Strategy

1. **Calculate tree bounds:** Determine total width/height needed with base spacing
2. **Compute scale factors:**
   - `scaleX = (canvasWidth - 2*padding) / totalTreeWidth`
   - `scaleY = (canvasHeight - 2*padding) / totalTreeHeight`
   - `finalScale = Math.min(scaleX, scaleY, 1.0)` // Never scale up
3. **Apply scaling:** Multiply all spacing and size values by finalScale
4. **Center tree:** Position scaled tree in center of canvas

## Layout Steps

1. **Parse relationships:** Build parent-child and spouse relationships
2. **Create family clusters:** Group spouses and their children
3. **Assign generation levels:** Use breadth-first traversal from primary person
4. **Apply Walker positioning:** Calculate initial x,y coordinates
5. **Adjust for family cohesion:** Move spouses closer, center parents over children
6. **Calculate bounding box:** Find min/max x,y coordinates
7. **Apply scaling:** Scale all coordinates and sizes to fit canvas
8. **Render nodes and connectors:** Draw rectangles for people, lines for relationships

## Connection Rules

- **Spouse connectors:** Horizontal line between adjacent spouses
- **Parent-child connectors:** Vertical line from parent(s) down to horizontal line above children, then vertical lines to each child
- **Multiple spouses:** Handle complex family structures with clear visual separation

## Node Rendering

- **Person boxes:** Rectangle with name, dates if available
- **Minimum readable size:** Ensure text remains legible after scaling
- **Color coding:** Optional - different colors for different family lines
- **Gender indicators:** Optional visual cues

## Edge Cases to Handle

- **Single parents:** Center single parent over children
- **Childless couples:** Position spouses together without child connectors
- **Multiple marriages:** Show multiple spouse relationships clearly
- **Adoptions/step-relationships:** Optional different line styles
- **Large families:** Ensure sibling groups don't become too compressed

## Implementation Notes

Implement this using TypeScript with Canvas API or SVG for rendering. Focus on clean, readable family tree visualization that automatically scales to fit any canvas size while maintaining genealogical layout conventions.

## Current Implementation Status

This guide was added to help improve the existing simple-tree transformer. Key areas for enhancement:

- [ ] Implement Walker's algorithm for better tree positioning
- [ ] Add proper orthogonal connectors instead of straight lines
- [ ] Enhance family clustering to center parents over children
- [ ] Improve scaling strategy with proper bounds calculation
- [ ] Add minimum readable size constraints
- [ ] Handle complex family structures (multiple marriages, adoptions)
