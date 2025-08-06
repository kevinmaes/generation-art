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
import type {
  AugmentedIndividual,
  GraphData,
  GraphTraversalUtils,
} from '../../../shared/types';
import { createTransformerInstance } from './utils';

/**
 * Configuration for the Walker tree transformer
 */
export const walkerTreeConfig: VisualTransformerConfig = {
  id: 'walker-tree',
  name: 'Walker Tree Layout',
  description:
    "Advanced tree layout using Walker's algorithm for optimal positioning. Provides professional genealogy tree layouts with proper family clustering and spacing.",
  shortDescription: "Professional tree layout with Walker's algorithm",
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
  x: number; // Final x position
  y: number; // Final y position
  prelim: number; // Preliminary x position
  mod: number; // Modifier value
  shift: number; // Shift value for subtree
  change: number; // Change value for spacing
  thread?: WalkerNode; // Thread pointer for contour tracking
  ancestor: WalkerNode; // Ancestor pointer

  // Enhanced contour tracking
  leftContour?: WalkerNode; // Leftmost descendant at each level
  rightContour?: WalkerNode; // Rightmost descendant at each level
  extremeLeft?: WalkerNode; // Extreme left node in subtree
  extremeRight?: WalkerNode; // Extreme right node in subtree
  msel: number; // Sum of modifiers for left extreme
  mser: number; // Sum of modifiers for right extreme

  // Family clustering
  spouses: WalkerNode[];
  familyId?: string;
  isSpouseGroup: boolean;

  // Layout properties
  width: number; // Node width
  height: number; // Node height
  generation: number; // Generation level
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
    graphKeys: graphData ? Object.keys(graphData) : 'none',
  });

  if (!hasGraphData) {
    console.warn(
      'Walker tree layout: No graph data available, falling back to basic layout',
    );
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
    sampleNodeChildren: walkerTree.nodes[0]?.children.length,
  });

  if (!walkerTree.root) {
    console.warn('Walker tree layout: No root node found');
    return { visualMetadata: {} };
  }

  // Apply Walker's algorithm
  executeWalkerAlgorithm(walkerTree.root, layoutConfig);

  console.log(
    '🧮 Walker algorithm completed. Sample positions:',
    walkerTree.nodes.slice(0, 3).map((n) => ({ id: n.id, x: n.x, y: n.y })),
  );

  // Convert Walker nodes to visual metadata
  const positions = extractPositions(walkerTree.nodes, layoutConfig);

  console.log('📍 Final extracted positions:', {
    totalPositions: Object.keys(positions).length,
    sample: Object.entries(positions)
      .slice(0, 3)
      .map(([id, pos]) => ({ id, x: pos.x, y: pos.y })),
  });

  // Build visual metadata
  const nodeMetadata: Record<string, VisualMetadata> = {};

  Object.entries(positions).forEach(([individualId, position]) => {
    nodeMetadata[individualId] = {
      x: position.x,
      y: position.y,
      width: 1.0, // Multiplier, not absolute width
      height: 1.0, // Multiplier, not absolute height
      size: Math.min(position.width, position.height), // Base size from position
      shape: 'square' as const,
      color: getNodeColor(
        individuals.find((i) => i.id === individualId)?.gender,
      ),
      strokeColor: '#000000',
      strokeWeight: 1,
      opacity: 1.0,
    };
  });

  // Generate family tree edges - override ALL existing edges for proper tree rendering
  const edgeMetadata = generateFamilyTreeEdges(
    walkerTree.nodes,
    positions,
    gedcomData,
  );

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
  config: LayoutConfig,
): { root: WalkerNode | null; nodes: WalkerNode[] } {
  const nodeMap = new Map<string, WalkerNode>();
  const nodes: WalkerNode[] = [];

  // Calculate generation density for adaptive sizing
  const generationCounts = new Map<number, number>();
  individuals.forEach((ind) => {
    const gen = ind.metadata.generation ?? 0;
    generationCounts.set(gen, (generationCounts.get(gen) ?? 0) + 1);
  });

  // Find max individuals in any generation
  const maxIndividualsInGeneration = Math.max(...generationCounts.values());

  // Calculate adaptive node size based on canvas width and max generation size
  const baseNodeSize = Math.min(
    60, // Max node size
    Math.max(
      15, // Min node size
      (config.canvasWidth * 0.7) / (maxIndividualsInGeneration * 1.5),
    ),
  );

  // Create Walker nodes for all individuals with adaptive sizing
  individuals.forEach((individual) => {
    const generation = individual.metadata.generation ?? 0;
    const genCount = generationCounts.get(generation) ?? 1;

    // Scale node size inversely with generation density
    const scaleFactor = Math.min(1.0, 10 / genCount); // Smaller nodes for crowded generations
    const nodeWidth = baseNodeSize * scaleFactor;
    const nodeHeight = nodeWidth * 0.67; // Maintain aspect ratio

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
      leftContour: undefined,
      rightContour: undefined,
      extremeLeft: undefined,
      extremeRight: undefined,
      msel: 0,
      mser: 0,
      isSpouseGroup: false,
      width: nodeWidth,
      height: nodeHeight,
      generation,
    };
    node.ancestor = node; // Self-reference for Walker's algorithm

    nodeMap.set(individual.id, node);
    nodes.push(node);
  });

  // Build parent-child relationships using graph utilities
  const traversalUtils = graphData.traversalUtils;

  console.log('🔗 Building parent-child relationships...');
  console.log(
    `📊 Generation distribution:`,
    Array.from(generationCounts.entries()),
  );
  console.log(`📏 Base node size: ${String(baseNodeSize)}px`);

  let totalChildren = 0;

  nodes.forEach((node, index) => {
    const children = traversalUtils.getChildren(node.id);
    node.children = children
      .map((child) => nodeMap.get(child.id))
      .filter(Boolean) as WalkerNode[];

    totalChildren += node.children.length;

    if (index < 3) {
      // Debug first few nodes
      console.log(
        `  Node ${node.id}: ${String(node.children.length)} children, size: ${String(node.width)}x${String(node.height)}`,
        node.children.map((c) => c.id),
      );
    }

    // Set parent references
    node.children.forEach((child) => {
      child.parent = node;
    });
  });

  console.log(
    `📊 Tree structure: ${String(totalChildren)} total parent-child relationships`,
  );
  console.log(
    `🌳 Nodes with children: ${String(nodes.filter((n) => n.children.length > 0).length)}/${String(nodes.length)}`,
  );

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
  const rootNodes = nodes.filter((node) => !node.parent);

  console.log('🔍 Root node selection:', {
    totalRoots: rootNodes.length,
    rootIds: rootNodes.slice(0, 5).map((n) => ({
      id: n.id,
      name: n.individual.name,
      children: n.children.length,
      generation: n.generation,
    })),
  });

  // Find the root with the most descendants for better tree layout
  const rootWithMostChildren = rootNodes.reduce<WalkerNode | null>(
    (best, current) =>
      current.children.length > (best?.children.length ?? -1) ? current : best,
    null,
  );

  const root =
    rootWithMostChildren ?? (rootNodes.length > 0 ? rootNodes[0] : null);

  console.log(
    '📍 Selected root:',
    root
      ? {
          id: root.id,
          name: root.individual.name,
          children: root.children.length,
          generation: root.generation,
        }
      : 'none',
  );

  return { root, nodes };
}

/**
 * Build family clusters and handle spouse positioning
 */
function buildFamilyClusters(
  nodes: WalkerNode[],
  traversalUtils: GraphTraversalUtils,
  _config: LayoutConfig,
): void {
  nodes.forEach((node) => {
    const spouses = traversalUtils.getSpouses(node.id);
    node.spouses = spouses
      .map((spouse) => nodes.find((n) => n.id === spouse.id))
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
    node.spouses.forEach((spouse) => {
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
    familyCluster.forEach((member) => {
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
  familyClusters.forEach((cluster) => {
    if (cluster.length === 2) {
      // For spouse pairs, ensure they're positioned optimally
      const [spouse1, spouse2] = cluster;

      // Prefer positioning based on gender or alphabetical order
      const shouldSwap =
        (spouse1.individual.gender === 'F' &&
          spouse2.individual.gender === 'M') ||
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
 * First walk: Assign preliminary positions with enhanced contour tracking
 */
function firstWalk(node: WalkerNode, config: LayoutConfig): void {
  if (node.children.length === 0) {
    // Leaf node - set up contours
    node.extremeLeft = node;
    node.extremeRight = node;
    node.msel = 0;
    node.mser = 0;

    if (node.leftSibling) {
      node.prelim =
        node.leftSibling.prelim +
        getNodeDistance(node.leftSibling, node, config);
    } else {
      node.prelim = 0;
    }
  } else {
    // Internal node - process children with contour tracking
    let defaultAncestor = node.children[0];

    node.children.forEach((child) => {
      firstWalk(child, config);
      defaultAncestor = apportion(child, defaultAncestor, config);
    });

    executeShifts(node);

    const leftmost = node.children[0];
    const rightmost = node.children[node.children.length - 1];
    const midpoint = (leftmost.prelim + rightmost.prelim) / 2;

    // Set up extreme nodes for contour tracking
    node.extremeLeft = leftmost.extremeLeft;
    node.extremeRight = rightmost.extremeRight;
    node.msel = leftmost.msel;
    node.mser = rightmost.mser;

    if (node.leftSibling) {
      node.prelim =
        node.leftSibling.prelim +
        getNodeDistance(node.leftSibling, node, config);
      node.mod = node.prelim - midpoint;
    } else {
      node.prelim = midpoint;
    }
  }
}

/**
 * Second walk: Assign final positions (pre-order traversal)
 */
function secondWalk(
  node: WalkerNode,
  modSum: number,
  level: number,
  config: LayoutConfig,
): void {
  node.x = node.prelim + modSum;
  node.y = level * config.generationSpacing;

  node.children.forEach((child) => {
    secondWalk(child, modSum + node.mod, level + 1, config);
  });
}

/**
 * Enhanced apportion with thread-based contour tracking
 */
function apportion(
  node: WalkerNode,
  defaultAncestor: WalkerNode,
  config: LayoutConfig,
): WalkerNode {
  const leftSibling = node.leftSibling;

  if (!leftSibling) return defaultAncestor;

  // Initialize contour traversal pointers
  let vir = node; // Inside right contour
  let vor = node; // Outside right contour
  let vil = leftSibling; // Inside left contour
  let vol = leftSibling.extremeLeft || leftSibling; // Outside left contour

  let sir = node.mod; // Sum of modifiers, inside right
  let sor = node.mod; // Sum of modifiers, outside right
  let sil = vil.mod; // Sum of modifiers, inside left
  let sol = vol.mod; // Sum of modifiers, outside left

  // Traverse contours until one is exhausted
  while (vil.extremeRight && vir.extremeLeft) {
    vil = vil.extremeRight;
    vir = vir.extremeLeft;
    vol = nextLeft(vol);
    vor = nextRight(vor);

    vor.ancestor = node;

    const shift =
      vil.prelim + sil - (vir.prelim + sir) + getNodeDistance(vil, vir, config);

    if (shift > 0) {
      moveSubtree(ancestorSibling(vil, node, defaultAncestor), node, shift);
      sir += shift;
      sor += shift;
    }

    sil += vil.mod;
    sir += vir.mod;
    sol += vol.mod;
    sor += vor.mod;
  }

  // Set threads for efficient contour traversal
  if (vil.extremeRight && !vor.extremeRight) {
    vor.thread = vil.extremeRight;
    vor.mod += sil - sor;
  }

  if (vir.extremeLeft && !vol.extremeLeft) {
    vol.thread = vir.extremeLeft;
    vol.mod += sir - sol;
    defaultAncestor = node;
  }

  return defaultAncestor;
}

/**
 * Move subtree to resolve conflicts
 */
function moveSubtree(wl: WalkerNode, wr: WalkerNode, shift: number): void {
  const subtrees = nodeNumber(wr) - nodeNumber(wl);
  if (subtrees > 0) {
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.prelim += shift;
    wr.mod += shift;
  }
}

/**
 * Get the position number of a node among its siblings
 */
function nodeNumber(node: WalkerNode): number {
  if (!node.parent) return 0;
  return node.parent.children.indexOf(node) + 1;
}

/**
 * Execute shifts to finalize positions after apportion
 */
function executeShifts(node: WalkerNode): void {
  let shift = 0;
  let change = 0;

  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    child.prelim += shift;
    child.mod += shift;
    change += child.change;
    shift += child.shift + change;
  }
}

/**
 * Find the next node on the left contour
 */
function nextLeft(node: WalkerNode): WalkerNode {
  if (node.children.length > 0) {
    return node.children[0];
  }
  return node.thread || node;
}

/**
 * Find the next node on the right contour
 */
function nextRight(node: WalkerNode): WalkerNode {
  if (node.children.length > 0) {
    return node.children[node.children.length - 1];
  }
  return node.thread || node;
}

/**
 * Find the ancestor for moving subtrees
 */
function ancestorSibling(
  vil: WalkerNode,
  node: WalkerNode,
  defaultAncestor: WalkerNode,
): WalkerNode {
  if (node.parent?.children.includes(vil.ancestor)) {
    return vil.ancestor;
  }
  return defaultAncestor;
}

/**
 * Get distance between two adjacent nodes
 */
function getNodeDistance(
  left: WalkerNode,
  right: WalkerNode,
  config: LayoutConfig,
): number {
  const baseDistance = (left.width + right.width) / 2;

  // For very small nodes (crowded generations), use tighter spacing
  const minNodeSize = Math.min(left.width, right.width);
  const spacingMultiplier = minNodeSize < 20 ? 0.3 : 1.0;

  // Check if nodes are spouses (should be closer)
  if (areSpouses(left, right)) {
    return Math.max(config.spouseSpacing * spacingMultiplier, baseDistance + 2);
  }

  // Check if nodes are from different families (need more space)
  if (left.familyId && right.familyId && left.familyId !== right.familyId) {
    return Math.max(
      config.familySpacing * spacingMultiplier,
      baseDistance + 10,
    );
  }

  // Check if they're siblings from the same parent
  if (areSiblings(left, right)) {
    return Math.max(
      config.nodeSpacing * 0.5 * spacingMultiplier,
      baseDistance + 5,
    );
  }

  // Default spacing for unrelated nodes in same generation
  // Tighter spacing for crowded generations
  return Math.max(config.nodeSpacing * spacingMultiplier, baseDistance + 8);
}

/**
 * Check if two nodes are spouses
 */
function areSpouses(left: WalkerNode, right: WalkerNode): boolean {
  return (
    left.spouses.some((spouse) => spouse.id === right.id) ||
    right.spouses.some((spouse) => spouse.id === left.id)
  );
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
    case 'M':
      return '#4A90E2'; // Blue for males
    case 'F':
      return '#FF69B4'; // Pink for females
    default:
      return '#9E9E9E'; // Gray for unknown
  }
}

/**
 * Generate family tree edge metadata for proper tree rendering
 */
function generateFamilyTreeEdges(
  nodes: WalkerNode[],
  positions: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >,
  gedcomData: {
    metadata: {
      edges: {
        id: string;
        sourceId: string;
        targetId: string;
        relationshipType: string;
      }[];
    };
  },
): Record<string, VisualMetadata> {
  const edges: Record<string, VisualMetadata> = {};

  // First, reset ALL existing edges to prevent curves/transforms from other transformers
  gedcomData.metadata.edges.forEach((edge) => {
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
        if (
          !edges[edgeId] &&
          !Object.values(edges).some(
            (e) =>
              e.custom?.sourceX === parentPos.x &&
              e.custom?.sourceY === parentPos.y &&
              e.custom?.targetX === childPos.x &&
              e.custom?.targetY === childPos.y,
          )
        ) {
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
      if (node.id < spouse.id) {
        // Avoid duplicates
        const node1Pos = positions[node.id];
        const node2Pos = positions[spouse.id];

        if (node1Pos && node2Pos) {
          const edgeId = `walker_sp_${node.id}_${spouse.id}`;
          // Only add if we don't already have this edge from GEDCOM data
          if (
            !edges[edgeId] &&
            !Object.values(edges).some(
              (e) =>
                (e.custom?.sourceX === node1Pos.x &&
                  e.custom?.sourceY === node1Pos.y &&
                  e.custom?.targetX === node2Pos.x &&
                  e.custom?.targetY === node2Pos.y) ||
                (e.custom?.sourceX === node2Pos.x &&
                  e.custom?.sourceY === node2Pos.y &&
                  e.custom?.targetX === node1Pos.x &&
                  e.custom?.targetY === node1Pos.y),
            )
          ) {
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

// Removed legacy ancestor and getLeftmost functions - replaced with contour-based traversal

/**
 * Extract final positions from Walker nodes
 */
function extractPositions(
  nodes: WalkerNode[],
  config: LayoutConfig,
): Record<string, { x: number; y: number; width: number; height: number }> {
  const positions: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {};

  if (nodes.length === 0) return positions;

  // Find bounds to center the tree
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
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

  const offsetX =
    horizontalMargin + (availableWidth - scaledTreeWidth) / 2 - minX * scale;
  const offsetY =
    verticalMargin + (availableHeight - scaledTreeHeight) / 2 - minY * scale;

  nodes.forEach((node) => {
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
  config: LayoutConfig,
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
  const generations = new Set(nodes.map((node) => node.generation));
  generations.forEach((generation) => {
    const genNodes = nodes.filter((n) => n.generation === generation);
    if (genNodes.length === 0) return;

    const minX = Math.min(...genNodes.map((n) => n.x - n.width / 2));
    const maxX = Math.max(...genNodes.map((n) => n.x + n.width / 2));
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
  gedcomData: {
    metadata: {
      edges: {
        id: string;
        sourceId: string;
        targetId: string;
        relationshipType: string;
      }[];
    };
  },
): Promise<{ visualMetadata: Partial<CompleteVisualMetadata> }> {
  console.log('Walker fallback layout starting with:', {
    individualCount: individuals.length,
    config: config,
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
    console.log(
      'All individuals in single generation, creating artificial layout',
    );
    const singleGen = Object.keys(generationGroups)[0];
    const allIndividuals = generationGroups[parseInt(singleGen)];
    generationGroups = {}; // Reset

    // Create multiple generations with reasonable number per row
    const individualsPerGeneration = Math.ceil(
      Math.sqrt(allIndividuals.length),
    ); // Square-ish layout
    let currentGeneration = 0;

    for (let i = 0; i < allIndividuals.length; i += individualsPerGeneration) {
      const slice = allIndividuals.slice(i, i + individualsPerGeneration);
      generationGroups[currentGeneration] = slice;
      currentGeneration++;
    }

    minGeneration = 0;
    maxGeneration = currentGeneration - 1;
  }

  const positions: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {};

  console.log('Generation groups:', {
    groups: Object.keys(generationGroups).map((gen) => ({
      generation: gen,
      count: generationGroups[parseInt(gen)].length,
    })),
    minGeneration,
    maxGeneration,
  });

  // Calculate adaptive node size based on the largest generation
  const maxIndividualsInGeneration = Math.max(
    ...Object.values(generationGroups).map((g) => g.length),
  );

  // Calculate node size to fit the largest generation
  const horizontalMargin = 100;
  const availableWidth = config.canvasWidth - 2 * horizontalMargin;
  const minNodeSize = 15;
  const maxNodeSize = 60;
  const minSpacing = 5;

  // Calculate node size that will fit all nodes in the largest generation
  let nodeSize = maxNodeSize;
  if (maxIndividualsInGeneration > 1) {
    const maxPossibleWidth = availableWidth / maxIndividualsInGeneration;
    nodeSize = Math.min(
      maxNodeSize,
      Math.max(minNodeSize, maxPossibleWidth - minSpacing),
    );
  }

  console.log('Adaptive sizing:', {
    maxIndividualsInGeneration,
    calculatedNodeSize: nodeSize,
    availableWidth,
  });

  // Calculate positions by generation with proper tree layout
  Object.entries(generationGroups).forEach(([genStr, genIndividuals]) => {
    const generation = parseInt(genStr);
    const generationIndex = generation - minGeneration;

    // Handle very large generations by creating multiple rows
    const maxNodesPerRow = Math.floor(availableWidth / (nodeSize + minSpacing));
    const needsMultipleRows = genIndividuals.length > maxNodesPerRow;

    if (needsMultipleRows) {
      // Split into multiple rows
      const numRows = Math.ceil(genIndividuals.length / maxNodesPerRow);
      const nodesPerRow = Math.ceil(genIndividuals.length / numRows);

      console.log(
        `Generation ${String(generation)} needs ${String(numRows)} rows:`,
        {
          totalNodes: genIndividuals.length,
          maxNodesPerRow,
          nodesPerRow,
        },
      );

      for (let row = 0; row < numRows; row++) {
        const rowStart = row * nodesPerRow;
        const rowEnd = Math.min(rowStart + nodesPerRow, genIndividuals.length);
        const rowIndividuals = genIndividuals.slice(rowStart, rowEnd);

        const baseY =
          100 +
          generationIndex * config.generationSpacing +
          row * (nodeSize + 10);
        const rowWidth =
          rowIndividuals.length * (nodeSize + minSpacing) - minSpacing;
        const startX = horizontalMargin + (availableWidth - rowWidth) / 2;

        rowIndividuals.forEach((individual, index) => {
          const x = startX + index * (nodeSize + minSpacing) + nodeSize / 2;

          positions[individual.id] = {
            x,
            y: baseY,
            width: nodeSize,
            height: nodeSize * 0.67,
          };

          nodeMetadata[individual.id] = {
            x,
            y: baseY,
            width: 1.0,
            height: 1.0,
            size: nodeSize,
            shape: 'square' as const,
            color: getNodeColor(individual.gender),
            strokeColor: '#000000',
            strokeWeight: 1,
            opacity: 1.0,
          };
        });
      }
    } else {
      // Single row for smaller generations
      const baseY = 100 + generationIndex * config.generationSpacing;
      const totalNodesWidth =
        genIndividuals.length * (nodeSize + minSpacing) - minSpacing;
      const startX = horizontalMargin + (availableWidth - totalNodesWidth) / 2;

      genIndividuals.forEach((individual, index) => {
        const x = startX + index * (nodeSize + minSpacing) + nodeSize / 2;

        positions[individual.id] = {
          x,
          y: baseY,
          width: nodeSize,
          height: nodeSize * 0.67,
        };

        nodeMetadata[individual.id] = {
          x,
          y: baseY,
          width: 1.0,
          height: 1.0,
          size: nodeSize,
          shape: 'square' as const,
          color: getNodeColor(individual.gender),
          strokeColor: '#000000',
          strokeWeight: 1,
          opacity: 1.0,
        };
      });
    }
  });

  // Generate straight-line edges for fallback layout too
  const edgeMetadata: Record<string, VisualMetadata> = {};
  gedcomData.metadata.edges.forEach((edge) => {
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
    sampleIndividual: Object.values(nodeMetadata)[0],
  });

  // Add a small delay to satisfy async requirement
  await new Promise((resolve) => setTimeout(resolve, 0));

  return {
    visualMetadata: {
      individuals: nodeMetadata,
      edges: edgeMetadata,
    },
  };
}
