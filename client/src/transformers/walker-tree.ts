/**
 * Walker's Algorithm Tree Layout Transformer
 *
 * This transformer implements Walker's algorithm for optimal tree positioning,
 * providing professional-quality genealogy tree layouts with proper spacing
 * and family clustering.
 */

import type {
  TransformerContext,
  CompleteVisualMetadata,
  VisualMetadata,
  VisualTransformerConfig,
} from './types';
import type { AugmentedIndividual, GraphData, GraphTraversalUtils } from '../../../shared/types';
import { createTransformerInstance } from './utils';

/**
 * Configuration for the Walker tree transformer
 */
export const walkerTreeConfig: VisualTransformerConfig = {
  id: 'walker-tree',
  name: 'Walker Tree Layout',
  description:
    'Advanced tree layout using Walker\'s algorithm for optimal positioning. Provides professional genealogy tree layouts with proper family clustering and spacing.',
  shortDescription: 'Professional tree layout with Walker\'s algorithm',
  transform: walkerTreeTransform,
  categories: ['layout', 'positioning', 'advanced'],
  availableDimensions: ['generation'],
  defaultPrimaryDimension: 'generation',
  visualParameters: [
    {
      name: 'nodeSpacing',
      type: 'range',
      defaultValue: 40,
      min: 20,
      max: 100,
      label: 'Node Spacing',
      description: 'Horizontal spacing between individual nodes',
    },
    {
      name: 'generationSpacing',
      type: 'range',
      defaultValue: 100,
      min: 60,
      max: 200,
      label: 'Generation Spacing',
      description: 'Vertical spacing between generations',
    },
    {
      name: 'spouseSpacing',
      type: 'range',
      defaultValue: 15,
      min: 5,
      max: 40,
      label: 'Spouse Spacing',
      description: 'Spacing between spouses in the same family',
    },
    {
      name: 'familySpacing',
      type: 'range',
      defaultValue: 80,
      min: 40,
      max: 150,
      label: 'Family Spacing',
      description: 'Spacing between different families',
    },
    {
      name: 'enableDebugging',
      type: 'boolean',
      defaultValue: false,
      label: 'Debug Mode',
      description: 'Show debugging information (bounding boxes, contours)',
    },
  ],
  getDefaults: () => ({
    nodeSpacing: 40,
    generationSpacing: 100,
    spouseSpacing: 15,
    familySpacing: 80,
    enableDebugging: false,
  }),
  createTransformerInstance: (params) =>
    createTransformerInstance(params, walkerTreeTransform, [
      { name: 'nodeSpacing', defaultValue: 40 },
      { name: 'generationSpacing', defaultValue: 100 },
      { name: 'spouseSpacing', defaultValue: 15 },
      { name: 'familySpacing', defaultValue: 80 },
      { name: 'enableDebugging', defaultValue: false },
    ]),
};

/**
 * Walker's algorithm node for layout calculations
 */
interface WalkerNode {
  id: string;
  individual: AugmentedIndividual;
  
  // Tree structure
  parent?: WalkerNode;
  children: WalkerNode[];
  leftSibling?: WalkerNode;
  rightSibling?: WalkerNode;
  
  // Walker's algorithm fields
  x: number;           // Final x position
  y: number;           // Final y position
  prelim: number;      // Preliminary x position
  mod: number;         // Modifier value
  shift: number;       // Shift value for subtree
  change: number;      // Change value for spacing
  thread?: WalkerNode; // Thread pointer for contour tracking
  ancestor: WalkerNode;// Ancestor pointer
  
  // Family clustering
  spouses: WalkerNode[];
  familyId?: string;
  isSpouseGroup: boolean;
  
  // Layout properties
  width: number;       // Node width
  height: number;      // Node height
  generation: number;  // Generation level
}

/**
 * Spacing configuration for the layout
 */
interface LayoutConfig {
  nodeSpacing: number;
  generationSpacing: number;
  spouseSpacing: number;
  familySpacing: number;
  enableDebugging: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Main Walker tree layout transform function
 */
export async function walkerTreeTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  console.log('🌳 WALKER TREE TRANSFORMER STARTING (Updated Version)');
  console.log('Context keys:', Object.keys(context));
  
  const { gedcomData, visualMetadata, visual } = context;
  
  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );
  
  console.log('Walker tree: Found', individuals.length, 'individuals');

  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Extract layout configuration
  const layoutConfig: LayoutConfig = {
    nodeSpacing: (visual.nodeSpacing as number) ?? 40,
    generationSpacing: (visual.generationSpacing as number) ?? 100,
    spouseSpacing: (visual.spouseSpacing as number) ?? 15,
    familySpacing: (visual.familySpacing as number) ?? 80,
    enableDebugging: (visual.enableDebugging as boolean) ?? false,
    canvasWidth: visualMetadata.global.canvasWidth ?? 800,
    canvasHeight: visualMetadata.global.canvasHeight ?? 600,
  };

  // Check if we have enhanced graph data
  const graphData = gedcomData.graph;
  const hasGraphData = graphData?.traversalUtils != null;

  console.log('🔍 Graph data check:', {
    hasGraph: !!graphData,
    hasTraversalUtils: !!graphData?.traversalUtils,
    graphKeys: graphData ? Object.keys(graphData) : 'none'
  });

  if (!hasGraphData) {
    console.warn('Walker tree layout: No graph data available, falling back to basic layout');
    console.log('Debug - Available gedcomData keys:', Object.keys(gedcomData));
    console.log('Debug - Graph data:', graphData);
    console.log('Debug - Individual count:', individuals.length);
    console.log('Debug - Sample individual:', individuals[0]);
    return await fallbackLayout(individuals, layoutConfig, gedcomData);
  }

  console.log('✅ Using enhanced graph data path');

  // Build Walker tree structure from graph data
  const walkerTree = buildWalkerTree(individuals, graphData, layoutConfig);
  
  console.log('🏗️ Walker tree built:', {
    rootFound: !!walkerTree.root,
    totalNodes: walkerTree.nodes.length,
    rootId: walkerTree.root?.id,
    sampleNodeChildren: walkerTree.nodes[0]?.children.length
  });
  
  if (!walkerTree.root) {
    console.warn('Walker tree layout: No root node found');
    return { visualMetadata: {} };
  }

  // Apply Walker's algorithm
  executeWalkerAlgorithm(walkerTree.root, layoutConfig);
  
  console.log('🧮 Walker algorithm completed. Sample positions:', 
    walkerTree.nodes.slice(0, 3).map(n => ({ id: n.id, x: n.x, y: n.y }))
  );
  
  // Convert Walker nodes to visual metadata
  const positions = extractPositions(walkerTree.nodes, layoutConfig);
  
  console.log('📍 Final extracted positions:', {
    totalPositions: Object.keys(positions).length,
    sample: Object.entries(positions).slice(0, 3).map(([id, pos]) => ({ id, x: pos.x, y: pos.y }))
  });
  
  // Build visual metadata
  const nodeMetadata: Record<string, VisualMetadata> = {};
  
  Object.entries(positions).forEach(([individualId, position]) => {
    nodeMetadata[individualId] = {
      x: position.x,
      y: position.y,
      width: 1.0,  // Multiplier, not absolute width
      height: 1.0, // Multiplier, not absolute height
      size: Math.min(position.width, position.height), // Base size from position
      shape: 'square' as const,
      color: getNodeColor(individuals.find(i => i.id === individualId)?.gender),
      strokeColor: '#000000',
      strokeWeight: 1,
      opacity: 1.0,
    };
  });

  // Generate family tree edges - override ALL existing edges for proper tree rendering
  const edgeMetadata = generateFamilyTreeEdges(walkerTree.nodes, positions, gedcomData);

  // Add debugging metadata if enabled
  const debugMetadata = layoutConfig.enableDebugging 
    ? generateDebugMetadata(walkerTree.nodes, layoutConfig)
    : {};

  return {
    visualMetadata: {
      individuals: nodeMetadata,
      edges: edgeMetadata,
      ...debugMetadata,
    },
  };
}

/**
 * Build Walker tree structure from graph data
 */
function buildWalkerTree(
  individuals: AugmentedIndividual[],
  graphData: GraphData,
  config: LayoutConfig
): { root: WalkerNode | null; nodes: WalkerNode[] } {
  const nodeMap = new Map<string, WalkerNode>();
  const nodes: WalkerNode[] = [];

  // Create Walker nodes for all individuals
  individuals.forEach((individual) => {
    const node: WalkerNode = {
      id: individual.id,
      individual,
      children: [],
      spouses: [],
      x: 0,
      y: 0,
      prelim: 0,
      mod: 0,
      shift: 0,
      change: 0,
      ancestor: null as any, // Will be set to self
      isSpouseGroup: false,
      width: 60, // Default node width
      height: 40, // Default node height
      generation: individual.metadata.generation ?? 0,
    };
    node.ancestor = node; // Self-reference for Walker's algorithm
    
    nodeMap.set(individual.id, node);
    nodes.push(node);
  });

  // Build parent-child relationships using graph utilities
  const traversalUtils = graphData.traversalUtils;
  
  console.log('🔗 Building parent-child relationships...');
  let totalChildren = 0;
  
  nodes.forEach((node, index) => {
    const children = traversalUtils.getChildren(node.id);
    node.children = children
      .map(child => nodeMap.get(child.id))
      .filter(Boolean) as WalkerNode[];
    
    totalChildren += node.children.length;
    
    if (index < 3) { // Debug first few nodes
      console.log(`  Node ${node.id}: ${String(node.children.length)} children`, 
        node.children.map(c => c.id));
    }
    
    // Set parent references
    node.children.forEach(child => {
      child.parent = node;
    });
  });
  
  console.log(`📊 Tree structure: ${String(totalChildren)} total parent-child relationships`);
  console.log(`🌳 Nodes with children: ${String(nodes.filter(n => n.children.length > 0).length)}/${String(nodes.length)}`);

  // Build sibling relationships
  nodes.forEach((node) => {
    if (node.parent) {
      const siblings = node.parent.children;
      const index = siblings.indexOf(node);
      
      if (index > 0) {
        node.leftSibling = siblings[index - 1];
      }
      if (index < siblings.length - 1) {
        node.rightSibling = siblings[index + 1];
      }
    }
  });

  // Handle spouse relationships and family clustering
  buildFamilyClusters(nodes, traversalUtils, config);

  // Find root nodes (nodes with no parents)
  const rootNodes = nodes.filter(node => !node.parent);
  
  console.log('🔍 Root node selection:', {
    totalRoots: rootNodes.length,
    rootIds: rootNodes.slice(0, 5).map(n => ({
      id: n.id, 
      name: n.individual.name,
      children: n.children.length,
      generation: n.generation
    }))
  });
  
  // Find the root with the most descendants for better tree layout
  const rootWithMostChildren = rootNodes.reduce<WalkerNode | null>((best, current) => 
    current.children.length > (best?.children.length ?? -1) ? current : best, null
  );
  
  const root = rootWithMostChildren ?? (rootNodes.length > 0 ? rootNodes[0] : null);
  
  console.log('📍 Selected root:', root ? {
    id: root.id,
    name: root.individual.name,
    children: root.children.length,
    generation: root.generation
  } : 'none');

  return { root, nodes };
}

/**
 * Build family clusters and handle spouse positioning
 */
function buildFamilyClusters(
  nodes: WalkerNode[],
  traversalUtils: GraphTraversalUtils,
  _config: LayoutConfig
): void {
  
  nodes.forEach((node) => {
    const spouses = traversalUtils.getSpouses(node.id);
    node.spouses = spouses
      .map(spouse => nodes.find(n => n.id === spouse.id))
      .filter(Boolean) as WalkerNode[];
  });

  // Create family clusters for proper positioning
  const familyClusters: WalkerNode[][] = [];
  const processedNodes = new Set<string>();

  nodes.forEach((node) => {
    if (processedNodes.has(node.id)) return;

    const familyCluster = [node];
    processedNodes.add(node.id);

    // Add all spouses to the same family cluster
    node.spouses.forEach(spouse => {
      if (!processedNodes.has(spouse.id)) {
        familyCluster.push(spouse);
        processedNodes.add(spouse.id);
        // Set family ID for grouping
        spouse.familyId = node.familyId || `family_${node.id}`;
      }
    });

    // Set family ID for the main node if not already set
    if (!node.familyId) {
      node.familyId = `family_${node.id}`;
    }
    
    // Apply family ID to all members
    familyCluster.forEach(member => {
      member.familyId = node.familyId;
    });

    if (familyCluster.length > 1) {
      familyClusters.push(familyCluster);
      
      // Adjust sibling relationships within family clusters
      // Spouses should be treated as siblings for positioning
      for (let i = 0; i < familyCluster.length - 1; i++) {
        const current = familyCluster[i];
        const next = familyCluster[i + 1];
        current.rightSibling = next;
        next.leftSibling = current;
      }
    }
  });

  // Optimize spouse positioning within clusters
  familyClusters.forEach(cluster => {
    if (cluster.length === 2) {
      // For spouse pairs, ensure they're positioned optimally
      const [spouse1, spouse2] = cluster;
      
      // Prefer positioning based on gender or alphabetical order
      const shouldSwap = (spouse1.individual.gender === 'F' && spouse2.individual.gender === 'M') ||
                        (spouse1.individual.gender === spouse2.individual.gender && 
                         spouse1.individual.name > spouse2.individual.name);
      
      if (shouldSwap && spouse1.leftSibling === spouse2) {
        // Swap sibling relationships
        spouse1.leftSibling = undefined;
        spouse1.rightSibling = spouse2;
        spouse2.leftSibling = spouse1;
        spouse2.rightSibling = undefined;
      }
    }
  });
}

/**
 * Execute Walker's algorithm for optimal tree positioning
 */
function executeWalkerAlgorithm(root: WalkerNode, config: LayoutConfig): void {
  // First pass: Assign preliminary positions
  firstWalk(root, config);
  
  // Second pass: Assign final positions
  secondWalk(root, 0, 0, config);
}

/**
 * First walk: Assign preliminary positions (post-order traversal)
 */
function firstWalk(node: WalkerNode, config: LayoutConfig): void {
  if (node.children.length === 0) {
    // Leaf node
    if (node.leftSibling) {
      node.prelim = node.leftSibling.prelim + getNodeDistance(node.leftSibling, node, config);
    } else {
      node.prelim = 0;
    }
  } else {
    // Internal node - process children first
    node.children.forEach(child => firstWalk(child, config));
    
    const leftmost = node.children[0];
    const rightmost = node.children[node.children.length - 1];
    const midpoint = (leftmost.prelim + rightmost.prelim) / 2;

    if (node.leftSibling) {
      node.prelim = node.leftSibling.prelim + getNodeDistance(node.leftSibling, node, config);
      node.mod = node.prelim - midpoint;
      apportion(node, config);
    } else {
      node.prelim = midpoint;
    }
  }
}

/**
 * Second walk: Assign final positions (pre-order traversal)
 */
function secondWalk(node: WalkerNode, modSum: number, level: number, config: LayoutConfig): void {
  node.x = node.prelim + modSum;
  node.y = level * config.generationSpacing;
  
  node.children.forEach(child => {
    secondWalk(child, modSum + node.mod, level + 1, config);
  });
}

/**
 * Apportion: Resolve conflicts between subtrees
 */
function apportion(node: WalkerNode, config: LayoutConfig): void {
  let leftmost = node.children[0];
  let neighbor = leftmost.leftSibling;
  
  if (!neighbor) return;

  let compareDepth = 1;
  const maxDepth = 10; // Limit depth to prevent infinite loops
  
  while (leftmost && neighbor && compareDepth <= maxDepth) {
    // Calculate separation needed
    const leftContour = leftmost.prelim + leftmost.mod;
    const rightContour = neighbor.prelim + neighbor.mod;
    const separation = rightContour - leftContour + getNodeDistance(neighbor, leftmost, config);
    
    if (separation > 0) {
      // Move subtree to the right
      moveSubtree(ancestor(neighbor, node), node, separation);
    }
    
    compareDepth++;
    
    // Move to next level
    if (leftmost.children.length === 0) {
      const nextLeftmost = getLeftmost(node, compareDepth);
      if (!nextLeftmost) break;
      leftmost = nextLeftmost;
    } else {
      leftmost = leftmost.children[0];
    }
    
    if (neighbor.children.length === 0) {
      const nextNeighbor = getLeftmost(neighbor, compareDepth);
      if (!nextNeighbor) break;
      neighbor = nextNeighbor;
    } else {
      neighbor = neighbor.children[neighbor.children.length - 1];
    }
  }
}

/**
 * Move subtree to resolve conflicts
 */
function moveSubtree(wl: WalkerNode, wr: WalkerNode, shift: number): void {
  if (!wl.parent || !wr.parent || wl.parent !== wr.parent) return;
  
  const siblings = wl.parent.children;
  const leftIndex = siblings.indexOf(wl);
  const rightIndex = siblings.indexOf(wr);
  
  if (leftIndex === -1 || rightIndex === -1 || leftIndex >= rightIndex) return;
  
  const subtrees = rightIndex - leftIndex;
  wr.change -= shift / subtrees;
  wr.shift += shift;
  wl.change += shift / subtrees;
  wr.prelim += shift;
  wr.mod += shift;
}

/**
 * Get distance between two adjacent nodes
 */
function getNodeDistance(left: WalkerNode, right: WalkerNode, config: LayoutConfig): number {
  const baseDistance = (left.width + right.width) / 2;
  
  // Check if nodes are spouses (should be closer)
  if (areSpouses(left, right)) {
    return Math.max(config.spouseSpacing, baseDistance * 1.2);
  }
  
  // Check if nodes are from different families (need more space)
  if (left.familyId && right.familyId && left.familyId !== right.familyId) {
    return Math.max(config.familySpacing, baseDistance * 2.5);
  }
  
  // Check if they're siblings from the same parent
  if (areSiblings(left, right)) {
    return Math.max(config.nodeSpacing * 0.8, baseDistance * 1.5);
  }
  
  // Default spacing for unrelated nodes
  return Math.max(config.nodeSpacing, baseDistance * 2.0);
}

/**
 * Check if two nodes are spouses
 */
function areSpouses(left: WalkerNode, right: WalkerNode): boolean {
  return left.spouses.some(spouse => spouse.id === right.id) ||
         right.spouses.some(spouse => spouse.id === left.id);
}

/**
 * Check if two nodes are siblings (same parents)
 */
function areSiblings(left: WalkerNode, right: WalkerNode): boolean {
  return left.parent === right.parent && left.parent !== undefined;
}

/**
 * Get color for node based on gender
 */
function getNodeColor(gender?: 'M' | 'F' | 'U'): string {
  switch (gender) {
    case 'M': return '#4A90E2'; // Blue for males
    case 'F': return '#FF69B4'; // Pink for females
    default: return '#9E9E9E'; // Gray for unknown
  }
}

/**
 * Generate family tree edge metadata for proper tree rendering
 */
function generateFamilyTreeEdges(
  nodes: WalkerNode[],
  positions: Record<string, { x: number; y: number; width: number; height: number }>,
  gedcomData: { metadata: { edges: { id: string; sourceId: string; targetId: string; relationshipType: string }[] } }
): Record<string, VisualMetadata> {
  const edges: Record<string, VisualMetadata> = {};

  // First, reset ALL existing edges to prevent curves/transforms from other transformers
  gedcomData.metadata.edges.forEach(edge => {
    const sourcePos = positions[edge.sourceId];
    const targetPos = positions[edge.targetId];
    
    if (sourcePos && targetPos) {
      edges[edge.id] = {
        x: (sourcePos.x + targetPos.x) / 2,
        y: (sourcePos.y + targetPos.y) / 2,
        strokeColor: edge.relationshipType === 'spouse' ? '#333333' : '#666666',
        strokeWeight: edge.relationshipType === 'spouse' ? 3 : 2,
        opacity: 0.8,
        // Explicitly override any curve settings
        curveType: 'straight' as const,
        curveIntensity: 0,
        controlPoints: undefined,
        arcRadius: undefined,
        custom: {
          sourceX: sourcePos.x,
          sourceY: sourcePos.y,
          targetX: targetPos.x,
          targetY: targetPos.y,
          edgeType: edge.relationshipType,
        },
      };
    }
  });

  // Then add any additional Walker-specific edges
  nodes.forEach((node) => {
    // Parent-child edges (if not already covered)
    node.children.forEach((child) => {
      const parentPos = positions[node.id];
      const childPos = positions[child.id];
      
      if (parentPos && childPos) {
        const edgeId = `walker_pc_${node.id}_${child.id}`;
        // Only add if we don't already have this edge from GEDCOM data
        if (!edges[edgeId] && !Object.values(edges).some(e => 
          e.custom?.sourceX === parentPos.x && e.custom?.sourceY === parentPos.y &&
          e.custom?.targetX === childPos.x && e.custom?.targetY === childPos.y
        )) {
          edges[edgeId] = {
            x: (parentPos.x + childPos.x) / 2,
            y: (parentPos.y + childPos.y) / 2,
            strokeColor: '#666666',
            strokeWeight: 2,
            opacity: 0.8,
            curveType: 'straight' as const,
            curveIntensity: 0,
            controlPoints: undefined,
            arcRadius: undefined,
            custom: {
              sourceX: parentPos.x,
              sourceY: parentPos.y,
              targetX: childPos.x,
              targetY: childPos.y,
              edgeType: 'parent-child',
            },
          };
        }
      }
    });

    // Spouse edges (if not already covered)
    node.spouses.forEach((spouse) => {
      if (node.id < spouse.id) { // Avoid duplicates
        const node1Pos = positions[node.id];
        const node2Pos = positions[spouse.id];
        
        if (node1Pos && node2Pos) {
          const edgeId = `walker_sp_${node.id}_${spouse.id}`;
          // Only add if we don't already have this edge from GEDCOM data
          if (!edges[edgeId] && !Object.values(edges).some(e => 
            (e.custom?.sourceX === node1Pos.x && e.custom?.sourceY === node1Pos.y &&
             e.custom?.targetX === node2Pos.x && e.custom?.targetY === node2Pos.y) ||
            (e.custom?.sourceX === node2Pos.x && e.custom?.sourceY === node2Pos.y &&
             e.custom?.targetX === node1Pos.x && e.custom?.targetY === node1Pos.y)
          )) {
            edges[edgeId] = {
              x: (node1Pos.x + node2Pos.x) / 2,
              y: (node1Pos.y + node2Pos.y) / 2,
              strokeColor: '#333333',
              strokeWeight: 3,
              opacity: 0.9,
              curveType: 'straight' as const,
              curveIntensity: 0,
              controlPoints: undefined,
              arcRadius: undefined,
              custom: {
                sourceX: node1Pos.x,
                sourceY: node1Pos.y,
                targetX: node2Pos.x,
                targetY: node2Pos.y,
                edgeType: 'spouse',
              },
            };
          }
        }
      }
    });
  });

  return edges;
}

/**
 * Find ancestor node for conflict resolution
 */
function ancestor(node: WalkerNode, defaultAncestor: WalkerNode): WalkerNode {
  if (node.ancestor && node.ancestor.parent === defaultAncestor.parent) {
    return node.ancestor;
  }
  return defaultAncestor;
}

/**
 * Get leftmost descendant at a specific depth
 */
function getLeftmost(node: WalkerNode, depth: number): WalkerNode | null {
  if (depth <= 1) return node;
  if (node.children.length === 0) return null;
  
  return getLeftmost(node.children[0], depth - 1);
}

/**
 * Extract final positions from Walker nodes
 */
function extractPositions(
  nodes: WalkerNode[],
  config: LayoutConfig
): Record<string, { x: number; y: number; width: number; height: number }> {
  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
  
  if (nodes.length === 0) return positions;
  
  // Find bounds to center the tree
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  nodes.forEach(node => {
    const nodeLeft = node.x - node.width / 2;
    const nodeRight = node.x + node.width / 2;
    const nodeTop = node.y - node.height / 2;
    const nodeBottom = node.y + node.height / 2;
    
    minX = Math.min(minX, nodeLeft);
    maxX = Math.max(maxX, nodeRight);
    minY = Math.min(minY, nodeTop);
    maxY = Math.max(maxY, nodeBottom);
  });
  
  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;
  
  // Calculate margins (10% of canvas size or minimum of 50px)
  const horizontalMargin = Math.max(50, config.canvasWidth * 0.1);
  const verticalMargin = Math.max(50, config.canvasHeight * 0.1);
  
  // Calculate available space
  const availableWidth = config.canvasWidth - 2 * horizontalMargin;
  const availableHeight = config.canvasHeight - 2 * verticalMargin;
  
  // Calculate scaling if needed (but prefer not to scale)
  let scaleX = 1;
  let scaleY = 1;
  
  if (treeWidth > availableWidth) {
    scaleX = availableWidth / treeWidth;
  }
  if (treeHeight > availableHeight) {
    scaleY = availableHeight / treeHeight;
  }
  
  // Use the smaller scale to maintain aspect ratio
  const scale = Math.min(scaleX, scaleY, 1); // Never scale up
  
  // Calculate centering offsets
  const scaledTreeWidth = treeWidth * scale;
  const scaledTreeHeight = treeHeight * scale;
  
  const offsetX = horizontalMargin + (availableWidth - scaledTreeWidth) / 2 - minX * scale;
  const offsetY = verticalMargin + (availableHeight - scaledTreeHeight) / 2 - minY * scale;
  
  nodes.forEach(node => {
    positions[node.id] = {
      x: node.x * scale + offsetX,
      y: node.y * scale + offsetY,
      width: node.width * scale,
      height: node.height * scale,
    };
  });
  
  return positions;
}

/**
 * Generate debugging metadata
 */
function generateDebugMetadata(
  nodes: WalkerNode[],
  config: LayoutConfig
): Partial<CompleteVisualMetadata> {
  if (!config.enableDebugging) return {};

  const debugElements: Record<string, VisualMetadata> = {};
  
  // Generate bounding boxes for each node
  nodes.forEach((node) => {
    const boundingBoxId = `debug_bbox_${node.id}`;
    debugElements[boundingBoxId] = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      strokeColor: '#ff0000', // Red for bounding boxes
      strokeWeight: 1,
      strokeStyle: 'dashed' as const,
      color: 'transparent',
      opacity: 0.5,
      shape: 'square' as const,
    };

    // Add labels with node information
    const labelId = `debug_label_${node.id}`;
    debugElements[labelId] = {
      x: node.x,
      y: node.y - node.height / 2 - 15,
      size: 10,
      color: '#0000ff', // Blue for labels
      opacity: 0.8,
      custom: {
        text: `${node.individual.name}\nGen: ${String(node.generation)}\nX: ${String(node.x.toFixed(1))}, Y: ${String(node.y.toFixed(1))}`,
      },
    };

    // Show family relationships with colored lines
    if (node.spouses.length > 0) {
      node.spouses.forEach((spouse) => {
        const spouseLineId = `debug_spouse_${node.id}_${spouse.id}`;
        debugElements[spouseLineId] = {
          x: (node.x + spouse.x) / 2,
          y: (node.y + spouse.y) / 2,
          strokeColor: '#00ff00', // Green for spouse relationships
          strokeWeight: 2,
          opacity: 0.7,
          custom: {
            sourceX: node.x,
            sourceY: node.y,
            targetX: spouse.x,
            targetY: spouse.y,
          },
        };
      });
    }

    // Show parent-child relationships
    if (node.parent) {
      const parentLineId = `debug_parent_${node.id}`;
      debugElements[parentLineId] = {
        x: (node.x + node.parent.x) / 2,
        y: (node.y + node.parent.y) / 2,
        strokeColor: '#ff8800', // Orange for parent-child relationships  
        strokeWeight: 1,
        opacity: 0.6,
        custom: {
          sourceX: node.parent.x,
          sourceY: node.parent.y,
          targetX: node.x,
          targetY: node.y,
        },
      };
    }

    // Show sibling connections
    if (node.rightSibling) {
      const siblingLineId = `debug_sibling_${node.id}_${node.rightSibling.id}`;
      debugElements[siblingLineId] = {
        x: (node.x + node.rightSibling.x) / 2,
        y: (node.y + node.rightSibling.y) / 2,
        strokeColor: '#8800ff', // Purple for sibling relationships
        strokeWeight: 1,
        strokeStyle: 'dotted' as const,
        opacity: 0.4,
        custom: {
          sourceX: node.x,
          sourceY: node.y,
          targetX: node.rightSibling.x,
          targetY: node.rightSibling.y,
        },
      };
    }
  });

  // Add generation level indicators
  const generations = new Set(nodes.map(node => node.generation));
  generations.forEach((generation) => {
    const genNodes = nodes.filter(n => n.generation === generation);
    if (genNodes.length === 0) return;

    const minX = Math.min(...genNodes.map(n => n.x - n.width / 2));
    const maxX = Math.max(...genNodes.map(n => n.x + n.width / 2));
    const avgY = genNodes.reduce((sum, n) => sum + n.y, 0) / genNodes.length;

    const genLineId = `debug_generation_${String(generation)}`;
    debugElements[genLineId] = {
      x: (minX + maxX) / 2,
      y: avgY,
      strokeColor: '#cccccc', // Gray for generation lines
      strokeWeight: 1,
      opacity: 0.3,
      custom: {
        sourceX: minX - 20,
        sourceY: avgY,
        targetX: maxX + 20,
        targetY: avgY,
      },
    };

    // Generation labels
    const genLabelId = `debug_gen_label_${String(generation)}`;
    debugElements[genLabelId] = {
      x: minX - 40,
      y: avgY,
      size: 12,
      color: '#666666',
      opacity: 0.8,
      custom: {
        text: `Gen ${String(generation)}`,
      },
    };
  });

  return {
    tree: debugElements,
  };
}

/**
 * Fallback layout when graph data is not available
 */
async function fallbackLayout(
  individuals: AugmentedIndividual[],
  config: LayoutConfig,
  gedcomData: { metadata: { edges: { id: string; sourceId: string; targetId: string; relationshipType: string }[] } }
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  console.log('Walker fallback layout starting with:', {
    individualCount: individuals.length,
    config: config
  });
  
  // Generation-based tree layout as fallback (even without graph utilities)
  const nodeMetadata: Record<string, VisualMetadata> = {};
  
  // Group by generation
  let generationGroups: Record<number, AugmentedIndividual[]> = {};
  let minGeneration = Number.MAX_SAFE_INTEGER;
  let maxGeneration = Number.MIN_SAFE_INTEGER;
  
  individuals.forEach((individual) => {
    const generation = individual.metadata?.generation ?? 0;
    if (!generationGroups[generation]) {
      generationGroups[generation] = [];
    }
    generationGroups[generation].push(individual);
    minGeneration = Math.min(minGeneration, generation);
    maxGeneration = Math.max(maxGeneration, generation);
  });
  
  // If all individuals are in one generation, spread them across multiple rows
  if (Object.keys(generationGroups).length === 1 && individuals.length > 10) {
    console.log('All individuals in single generation, creating artificial layout');
    const singleGen = Object.keys(generationGroups)[0];
    const allIndividuals = generationGroups[parseInt(singleGen)];
    generationGroups = {}; // Reset
    
    // Create multiple generations with reasonable number per row
    const individualsPerGeneration = Math.ceil(Math.sqrt(allIndividuals.length)); // Square-ish layout
    let currentGeneration = 0;
    
    for (let i = 0; i < allIndividuals.length; i += individualsPerGeneration) {
      const slice = allIndividuals.slice(i, i + individualsPerGeneration);
      generationGroups[currentGeneration] = slice;
      currentGeneration++;
    }
    
    minGeneration = 0;
    maxGeneration = currentGeneration - 1;
  }
  
  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
  
  console.log('Generation groups:', {
    groups: Object.keys(generationGroups).map(gen => ({
      generation: gen,
      count: generationGroups[parseInt(gen)].length
    })),
    minGeneration,
    maxGeneration
  });

  // Calculate positions by generation with proper tree layout
  Object.entries(generationGroups).forEach(([genStr, genIndividuals]) => {
    const generation = parseInt(genStr);
    const generationIndex = generation - minGeneration;
    
    const baseY = 100 + generationIndex * config.generationSpacing;
    
    console.log(`Processing generation ${String(generation)}:`, {
      generationIndex,
      baseY,
      individualCount: genIndividuals.length,
      individuals: genIndividuals.map(i => i.id)
    });
    
    // Center individuals horizontally within each generation
    const totalWidth = config.canvasWidth - 200; // 100px margin on each side
    const spacing = genIndividuals.length > 1 ? totalWidth / (genIndividuals.length - 1) : 0;
    const startX = genIndividuals.length === 1 ? config.canvasWidth / 2 : 100;
    
    genIndividuals.forEach((individual, index) => {
      const x = genIndividuals.length === 1 ? startX : startX + index * spacing;
      
      console.log(`  Individual ${individual.id} (${String(index)}): x=${String(x)}, y=${String(baseY)}`);
      
      positions[individual.id] = {
        x,
        y: baseY,
        width: 60,
        height: 40,
      };
      
      nodeMetadata[individual.id] = {
        x,
        y: baseY,
        width: 1.0,  // Multiplier, not absolute width
        height: 1.0, // Multiplier, not absolute height
        size: 60,    // Base size
        shape: 'square' as const,
        color: getNodeColor(individual.gender),
        strokeColor: '#000000',
        strokeWeight: 1,
        opacity: 1.0,
      };
    });
  });
  
  // Generate straight-line edges for fallback layout too
  const edgeMetadata: Record<string, VisualMetadata> = {};
  gedcomData.metadata.edges.forEach(edge => {
    const sourcePos = positions[edge.sourceId];
    const targetPos = positions[edge.targetId];
    
    if (sourcePos && targetPos) {
      edgeMetadata[edge.id] = {
        x: (sourcePos.x + targetPos.x) / 2,
        y: (sourcePos.y + targetPos.y) / 2,
        strokeColor: edge.relationshipType === 'spouse' ? '#333333' : '#666666',
        strokeWeight: edge.relationshipType === 'spouse' ? 3 : 2,
        opacity: 0.8,
        curveType: 'straight' as const,
        curveIntensity: 0,
        controlPoints: undefined,
        arcRadius: undefined,
        custom: {
          sourceX: sourcePos.x,
          sourceY: sourcePos.y,
          targetX: targetPos.x,
          targetY: targetPos.y,
          edgeType: edge.relationshipType,
        },
      };
    }
  });
  
  console.log('Walker fallback layout result:', {
    individualCount: Object.keys(nodeMetadata).length,
    edgeCount: Object.keys(edgeMetadata).length,
    sampleIndividual: Object.values(nodeMetadata)[0]
  });

  // Add a small delay to satisfy async requirement
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { 
    visualMetadata: { 
      individuals: nodeMetadata,
      edges: edgeMetadata,
    } 
  };
}