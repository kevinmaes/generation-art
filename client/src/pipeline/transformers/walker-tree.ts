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
  NodeVisualMetadata,
  EdgeVisualMetadata,
  VisualTransformerConfig,
} from '../types';
import type {
  AugmentedIndividual,
  GraphData,
  GraphTraversalUtils,
  GedcomDataWithMetadata,
  Edge,
} from '../../../../shared/types';
import type { RoutingOutput } from '../../display/types/edge-routing';
import { createTransformerInstance } from '../utils';
import {
  OrthogonalRouter,
  type FamilyNode,
  type FamilyRelationship,
} from '../routing/orthogonal-router';

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
  multiInstance: true,
  visualParameters: [
    {
      name: 'nodeSpacing',
      type: 'range',
      defaultValue: 60,
      min: 30,
      max: 150,
      label: 'Node spacing px',
      description: 'Horizontal spacing between individual nodes',
      unit: 'px',
    },
    {
      name: 'generationSpacing',
      type: 'range',
      defaultValue: 150,
      min: 80,
      max: 300,
      label: 'Generation spacing px',
      description: 'Vertical spacing between generations',
      unit: 'px',
    },
    {
      name: 'spouseSpacing',
      type: 'range',
      defaultValue: 30,
      min: 10,
      max: 60,
      label: 'Spouse spacing px',
      description: 'Spacing between spouses in the same family',
      unit: 'px',
    },
    {
      name: 'familySpacing',
      type: 'range',
      defaultValue: 80,
      min: 40,
      max: 150,
      label: 'Family spacing px',
      description: 'Spacing between different families',
      unit: 'px',
    },
    {
      name: 'enableDebugging',
      type: 'boolean',
      defaultValue: false,
      label: 'Debug Mode',
      description: 'Show debugging information (bounding boxes, contours)',
    },
    {
      name: 'showLabels',
      type: 'boolean',
      defaultValue: false,
      label: 'Show Individual Names',
      description: 'Display names of individuals on the nodes',
    },
    {
      name: 'minLabelSize',
      type: 'range',
      defaultValue: 12,
      label: 'Minimum label size px',
      description: 'Minimum font size for labels (pixels)',
      min: 8,
      max: 24,
      step: 1,
      unit: 'px',
    },
    {
      name: 'useOrthogonalRouting',
      type: 'boolean',
      defaultValue: true,
      label: 'Orthogonal Edge Routing',
      description:
        'Use 90-degree edges with T-junctions for family connections',
    },
  ],
  getDefaults: () => ({
    nodeSpacing: 60,
    generationSpacing: 150,
    spouseSpacing: 30,
    familySpacing: 80,
    enableDebugging: false,
    showLabels: false,
    minLabelSize: 12,
    useOrthogonalRouting: true,
  }),
  createTransformerInstance: (params) =>
    createTransformerInstance(params, walkerTreeTransform, [
      { name: 'nodeSpacing', defaultValue: 60 },
      { name: 'generationSpacing', defaultValue: 150 },
      { name: 'spouseSpacing', defaultValue: 30 },
      { name: 'familySpacing', defaultValue: 80 },
      { name: 'enableDebugging', defaultValue: false },
      { name: 'showLabels', defaultValue: false },
      { name: 'minLabelSize', defaultValue: 12 },
      { name: 'useOrthogonalRouting', defaultValue: true },
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
  number: number; // Node number (index among siblings)

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
  showLabels: boolean;
  minLabelSize: number;
  useOrthogonalRouting: boolean;
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

  // Debug log the visual parameters
  console.log('📊 Visual parameters received:', {
    showLabels: visual.showLabels,
    enableDebugging: visual.enableDebugging,
    allVisualParams: visual,
  });

  const individuals = Object.values(gedcomData.individuals).filter(
    (individual) => individual !== null && individual !== undefined,
  );

  console.log('Walker tree: Found', individuals.length, 'individuals');

  if (individuals.length === 0) {
    return { visualMetadata: {} };
  }

  // Extract layout configuration
  const layoutConfig: LayoutConfig = {
    nodeSpacing: (visual.nodeSpacing as number) ?? 60,
    generationSpacing: (visual.generationSpacing as number) ?? 150,
    spouseSpacing: (visual.spouseSpacing as number) ?? 30,
    familySpacing: (visual.familySpacing as number) ?? 80,
    enableDebugging: (visual.enableDebugging as boolean) ?? false,
    showLabels: (visual.showLabels as boolean) ?? false,
    minLabelSize: (visual.minLabelSize as number) ?? 12,
    useOrthogonalRouting: (visual.useOrthogonalRouting as boolean) ?? true,
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

  // Handle multiple disconnected trees (forest)
  const processedNodes = new Set<string>();
  const treesToProcess: WalkerNode[] = [];

  // Start with the main root if found
  if (walkerTree.root) {
    treesToProcess.push(walkerTree.root);
  }

  // Find all other roots (nodes without parents that haven't been processed)
  walkerTree.nodes.forEach((node) => {
    if (
      !node.parent &&
      !processedNodes.has(node.id) &&
      node !== walkerTree.root
    ) {
      treesToProcess.push(node);
    }
  });

  if (treesToProcess.length === 0) {
    console.warn('Walker tree layout: No root nodes found');
    return { visualMetadata: {} };
  }

  console.log(
    `🌳 Processing ${String(treesToProcess.length)} separate family tree(s)`,
  );

  // Process each tree separately
  let treeOffset = 0;
  const treeSpacing = 200; // Horizontal spacing between separate trees

  treesToProcess.forEach((root, treeIndex) => {
    console.log(
      `🚀 Processing tree ${String(treeIndex + 1)}/${String(treesToProcess.length)}, root:`,
      root.id,
    );

    try {
      // Apply Walker's algorithm to this tree
      executeWalkerAlgorithm(root, layoutConfig);

      // Mark all nodes in this tree as processed
      const markProcessed = (node: WalkerNode) => {
        if (processedNodes.has(node.id)) return;
        processedNodes.add(node.id);
        node.children.forEach((child) => markProcessed(child));
      };
      markProcessed(root);

      // Adjust positions for this tree (offset horizontally if multiple trees)
      if (treeIndex > 0) {
        const adjustPositions = (node: WalkerNode) => {
          node.x += treeOffset;
          node.children.forEach((child) => adjustPositions(child));
        };
        adjustPositions(root);

        // Calculate width of this tree for next offset
        const treeNodes: WalkerNode[] = [];
        const collectNodes = (node: WalkerNode) => {
          treeNodes.push(node);
          node.children.forEach((child) => collectNodes(child));
        };
        collectNodes(root);

        const maxX = Math.max(...treeNodes.map((n) => n.x));
        treeOffset = maxX + treeSpacing;
      }

      console.log(`✅ Tree ${String(treeIndex + 1)} processed successfully`);
    } catch (error) {
      console.error(
        `❌ Error processing tree ${String(treeIndex + 1)}:`,
        error,
      );
    }
  });

  console.log(
    '🧮 All trees processed. Sample positions:',
    walkerTree.nodes.slice(0, 3).map((n) => ({ id: n.id, x: n.x, y: n.y })),
  );

  // Convert Walker nodes to visual metadata
  let positions: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  try {
    positions = extractPositions(walkerTree.nodes, layoutConfig);

    console.log('📍 Final extracted positions:', {
      totalPositions: Object.keys(positions).length,
      sample: Object.entries(positions)
        .slice(0, 3)
        .map(([id, pos]) => ({ id, x: pos.x, y: pos.y })),
    });
  } catch (error) {
    console.error('❌ Error extracting positions:', error);
    return { visualMetadata: {} };
  }

  // Build visual metadata
  const nodeMetadata: Record<string, NodeVisualMetadata> = {};

  Object.entries(positions).forEach(([individualId, position]) => {
    const individual = individuals.find((i) => i.id === individualId);
    const shouldAddLabel = layoutConfig.showLabels && individual;

    // Debug logging for first few individuals
    if (Object.keys(nodeMetadata).length < 3) {
      console.log(`🏷️ Creating metadata for ${individualId}:`, {
        showLabels: layoutConfig.showLabels,
        hasIndividual: !!individual,
        individualName: individual?.name,
        willAddLabel: shouldAddLabel,
      });
    }

    nodeMetadata[individualId] = {
      x: position.x,
      y: position.y,
      width: 1.0, // Multiplier, not absolute width
      height: 1.0, // Multiplier, not absolute height
      size: Math.min(position.width, position.height), // Base size from position
      shape: 'square' as const,
      color: getNodeColor(individual?.gender),
      strokeColor: '#000000',
      strokeWeight: 1,
      opacity: 1.0,
      // Add label information when showLabels is enabled
      ...(shouldAddLabel
        ? {
            custom: {
              label: individual.name || individual.id,
              labelOffsetY: Math.max(20, position.height * 0.7), // Minimum 20px offset
              labelSize: Math.max(
                layoutConfig.minLabelSize,
                Math.min(position.width, position.height) * 0.3,
              ), // Use configurable minimum
            },
          }
        : {}),
    };

    // Debug log the result for first individual
    if (Object.keys(nodeMetadata).length === 1) {
      console.log(
        '🏷️ First node metadata created:',
        nodeMetadata[individualId],
      );
    }
  });

  // Generate routing output based on configuration
  let routingOutput: RoutingOutput | undefined;
  let edgeMetadata: Record<string, EdgeVisualMetadata> = {};

  console.log('🔄 Edge routing configuration:', {
    useOrthogonalRouting: layoutConfig.useOrthogonalRouting,
    visualParams: visual,
    layoutConfig,
  });

  if (layoutConfig.useOrthogonalRouting) {
    // Use orthogonal routing for edges
    console.log('✅ Using orthogonal routing for edges');
    try {
      routingOutput = generateOrthogonalRouting(
        walkerTree.nodes,
        positions,
        gedcomData,
        layoutConfig,
      );
      console.log('📐 Orthogonal routing generated:', {
        hasRouting: !!routingOutput,
        segmentCount: routingOutput
          ? Object.keys(routingOutput.segments).length
          : 0,
        layerCount: routingOutput ? routingOutput.layers.length : 0,
        layers: routingOutput?.layers.map((l) => ({
          name: l.name,
          edgeCount: l.edges.length,
        })),
      });
    } catch (error) {
      console.error('❌ Error generating orthogonal routing:', error);
      // Fall back to legacy edges
      edgeMetadata = generateFamilyTreeEdges(
        walkerTree.nodes,
        positions,
        gedcomData,
      );
    }
  } else {
    // Use legacy straight-line edges
    console.log('📉 Using legacy straight-line edges');
    edgeMetadata = generateFamilyTreeEdges(
      walkerTree.nodes,
      positions,
      gedcomData,
    );
  }

  // Add debugging metadata if enabled
  const debugMetadata = layoutConfig.enableDebugging
    ? generateDebugMetadata(walkerTree.nodes, layoutConfig)
    : {};

  return {
    visualMetadata: {
      individuals: nodeMetadata,
      edges: layoutConfig.useOrthogonalRouting ? {} : edgeMetadata, // Only include legacy edges if not using orthogonal
      routing: routingOutput, // New routing output for orthogonal edges
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
  // Increase base node size for better visibility
  const baseNodeSize = Math.min(
    80, // Max node size (increased from 60)
    Math.max(
      20, // Min node size (increased from 15)
      (config.canvasWidth * 0.8) / (maxIndividualsInGeneration * 1.2),
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
      number: 1, // Default, will be set based on sibling order
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

  // First pass: establish parent-child relationships
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
  });

  // Second pass: set parent references and node numbers
  // This needs to be done after all children arrays are populated
  nodes.forEach((node) => {
    node.children.forEach((child, index) => {
      // Only set parent if not already set (handles multiple parents)
      if (!child.parent) {
        child.parent = node;
      }
      child.number = index + 1; // 1-based indexing for Walker's algorithm
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

  // Find root nodes - these should be the oldest ancestors (no parents)
  // In genealogy, we want to start from the oldest known ancestors
  let rootNodes = nodes.filter((node) => !node.parent);

  // If everyone has parents (circular reference issue), find the earliest generation
  if (rootNodes.length === 0) {
    const generationNumbers = Array.from(generationCounts.keys()).sort(
      (a, b) => a - b,
    );
    if (generationNumbers.length > 0) {
      const earliestGen = generationNumbers[0];
      rootNodes = nodes.filter((n) => n.generation === earliestGen);
    }
  }

  // Further filter to only include roots that have descendants
  // This avoids isolated individuals being roots
  const rootsWithDescendants = rootNodes.filter((n) => n.children.length > 0);
  if (rootsWithDescendants.length > 0) {
    rootNodes = rootsWithDescendants;
  }

  console.log('🔍 Root node selection:', {
    totalRoots: rootNodes.length,
    rootIds: rootNodes.slice(0, 10).map((n) => ({
      id: n.id,
      name: n.individual.name,
      children: n.children.length,
      generation: n.generation,
      hasParent: !!n.parent,
    })),
  });

  // Log a warning if we have too many roots (indicates disconnected trees)
  if (rootNodes.length > 5) {
    console.warn(
      '⚠️ Multiple root nodes detected - this indicates multiple family branches:',
      {
        rootCount: rootNodes.length,
        message:
          'Consider focusing on a single family branch or using a different layout',
      },
    );
  }

  // Find the root with the most descendants for better tree layout
  // Count all descendants, not just immediate children
  const countDescendants = (node: WalkerNode): number => {
    const visited = new Set<string>();
    const queue = [node];
    let count = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current.id)) continue;
      visited.add(current.id);
      count++;
      queue.push(...current.children);
    }

    return count - 1; // Don't count the node itself
  };

  const rootWithMostDescendants = rootNodes.reduce<WalkerNode | null>(
    (best, current) => {
      const currentCount = countDescendants(current);
      const bestCount = best ? countDescendants(best) : -1;
      return currentCount > bestCount ? current : best;
    },
    null,
  );

  const root =
    rootWithMostDescendants ?? (rootNodes.length > 0 ? rootNodes[0] : null);

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
  // Create a map for quick node lookup
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  nodes.forEach((node) => {
    const spouses = traversalUtils.getSpouses(node.id);
    node.spouses = spouses
      .map((spouse) => nodeMap.get(spouse.id))
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

      // Position based on traditional convention: male on left, female on right
      // If same gender, use alphabetical order
      const shouldSwap =
        (spouse1.individual.gender === 'F' &&
          spouse2.individual.gender === 'M') ||
        (spouse1.individual.gender === spouse2.individual.gender &&
          spouse1.individual.name > spouse2.individual.name);

      if (shouldSwap) {
        // Swap their positions in the cluster
        cluster[0] = spouse2;
        cluster[1] = spouse1;
      }
    }

    // Ensure spouses share children
    cluster.forEach((member, idx) => {
      if (idx > 0) {
        // Merge children lists for spouses
        const allChildren = new Set<WalkerNode>();
        cluster.forEach((spouse) => {
          spouse.children.forEach((child) => allChildren.add(child));
        });
        member.children = Array.from(allChildren);
      }
    });
  });
}

/**
 * Execute Walker's algorithm for optimal tree positioning
 */
function executeWalkerAlgorithm(root: WalkerNode, config: LayoutConfig): void {
  console.log('🚀 Starting Walker algorithm execution...');
  try {
    // First pass: Assign preliminary positions
    firstWalk(root, config);
    console.log('✅ First walk completed');

    // Second pass: Assign final positions
    secondWalk(root, 0, 0, config);
    console.log('✅ Second walk completed');

    // Third pass: Center parent couples over their children
    centerParentCouples(root, config);
    console.log('✅ Parent centering completed');
  } catch (error) {
    console.error('❌ Walker algorithm execution failed:', error);
    throw error;
  }
}

/**
 * Center parent couples over their children and ensure proper spouse spacing
 */
function centerParentCouples(node: WalkerNode, config: LayoutConfig): void {
  // Process all nodes in the tree
  const queue: WalkerNode[] = [node];
  const processedFamilies = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    // Add children to queue for processing
    queue.push(...current.children);

    // If this node has children and a spouse, center them as a couple
    if (current.children.length > 0 && current.spouses.length > 0) {
      const familyId = current.familyId || `${current.id}_family`;

      // Skip if we've already processed this family
      if (processedFamilies.has(familyId)) continue;
      processedFamilies.add(familyId);

      // Find all parents (current node and spouses)
      const parents = [current, ...current.spouses];

      // First, ensure proper spacing between spouses
      parents.sort((a, b) => a.x - b.x); // Sort by x position

      // Calculate desired spouse positions with proper spacing
      const totalSpouseWidth = parents.reduce((sum, p) => sum + p.width, 0);
      const totalSpacing = (parents.length - 1) * config.spouseSpacing;
      const totalWidth = totalSpouseWidth + totalSpacing;

      // Get all children positions
      const childrenXPositions = current.children.map((child) => child.x);
      const leftmostChildX = Math.min(...childrenXPositions);
      const rightmostChildX = Math.max(...childrenXPositions);
      const childrenCenterX = (leftmostChildX + rightmostChildX) / 2;

      // Position parents centered over children with proper spacing
      let currentX = childrenCenterX - totalWidth / 2;

      parents.forEach((parent, index) => {
        // Position this parent
        parent.x = currentX + parent.width / 2;

        // Move to next position
        currentX += parent.width;
        if (index < parents.length - 1) {
          currentX += config.spouseSpacing;
        }
      });

      console.log(
        `👥 Positioned family ${familyId}: parents=${parents.map((p) => `${p.id}(x=${p.x.toFixed(1)})`).join(', ')}, childrenCenter=${childrenCenterX.toFixed(1)}`,
      );
    }
  }
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
  // Add extra padding at the top and increase spacing
  node.y = 100 + level * config.generationSpacing;

  node.children.forEach((child) => {
    secondWalk(child, modSum + node.mod, level + 1, config);
  });
}

// Removed duplicate Walker algorithm helper functions - using the complete implementations above

// Removed first duplicate getNodeDistance function - keeping the one below with areSpouses helper

// Removed unused areSpouses and areSiblings helper functions

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
  gedcomData: GedcomDataWithMetadata,
): Record<string, EdgeVisualMetadata> {
  const edges: Record<string, EdgeVisualMetadata> = {};

  // First, reset ALL existing edges to prevent curves/transforms from other transformers
  gedcomData.metadata.edges.forEach((edge) => {
    const sourcePos = positions[edge.sourceId];
    const targetPos = positions[edge.targetId];

    if (sourcePos && targetPos) {
      edges[edge.id] = {
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
          // Store the midpoint for potential later use
          midX: (sourcePos.x + targetPos.x) / 2,
          midY: (sourcePos.y + targetPos.y) / 2,
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
              // Store the midpoint for potential later use
              midX: (parentPos.x + childPos.x) / 2,
              midY: (parentPos.y + childPos.y) / 2,
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
                // Store the midpoint for potential later use
                midX: (node1Pos.x + node2Pos.x) / 2,
                midY: (node1Pos.y + node2Pos.y) / 2,
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
 * Generate orthogonal routing for family tree edges
 */
function generateOrthogonalRouting(
  nodes: WalkerNode[],
  positions: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >,
  gedcomData: any,
  config: LayoutConfig,
): RoutingOutput {
  // Convert Walker nodes to FamilyNodes for the router
  const familyNodes: FamilyNode[] = nodes.map((node) => ({
    id: node.id,
    position: {
      x: positions[node.id].x,
      y: positions[node.id].y,
    },
    type: 'individual' as const,
    generation: node.generation,
  }));

  console.log('🔄 Converting nodes to FamilyNodes:', {
    nodeCount: familyNodes.length,
    sampleNodes: familyNodes.slice(0, 3).map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      generation: n.generation,
    })),
  });

  // Extract relationships from the Walker tree structure and GEDCOM data
  const relationships: FamilyRelationship[] = [];

  console.log('📊 Building relationships from Walker tree...');

  // Parent-child relationships from Walker tree
  nodes.forEach((node) => {
    node.children.forEach((child) => {
      relationships.push({
        sourceId: node.id,
        targetId: child.id,
        type: 'parent-child',
        familyId: node.familyId,
      });
    });

    // Spouse relationships
    node.spouses.forEach((spouse) => {
      // Only add once (avoid duplicates)
      if (node.id < spouse.id) {
        relationships.push({
          sourceId: node.id,
          targetId: spouse.id,
          type: 'spouse',
          familyId: node.familyId,
        });
      }
    });

    // Sibling relationships (if we want to show them)
    if (node.leftSibling) {
      relationships.push({
        sourceId: node.leftSibling.id,
        targetId: node.id,
        type: 'sibling',
        familyId: node.familyId,
      });
    }
  });

  // Also add relationships from GEDCOM metadata if available
  if (gedcomData.metadata.edges) {
    const edges: Edge[] = gedcomData.metadata.edges;
    edges.forEach((edge: Edge) => {
      // Check if we already have this relationship from the Walker tree
      const exists = relationships.some(
        (rel) =>
          (rel.sourceId === edge.sourceId && rel.targetId === edge.targetId) ||
          (rel.sourceId === edge.targetId && rel.targetId === edge.sourceId),
      );

      if (!exists && positions[edge.sourceId] && positions[edge.targetId]) {
        let relType: 'parent-child' | 'spouse' | 'sibling' = 'parent-child';
        if (edge.relationshipType === 'spouse') relType = 'spouse';
        else if (edge.relationshipType === 'sibling') relType = 'sibling';

        relationships.push({
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          type: relType,
          familyId: edge.familyId,
        });
      }
    });
  }

  console.log('🔗 Total relationships extracted:', {
    total: relationships.length,
    byType: {
      'parent-child': relationships.filter((r) => r.type === 'parent-child')
        .length,
      spouse: relationships.filter((r) => r.type === 'spouse').length,
      sibling: relationships.filter((r) => r.type === 'sibling').length,
    },
    sampleRelationships: relationships.slice(0, 5).map((r) => ({
      from: r.sourceId,
      to: r.targetId,
      type: r.type,
    })),
  });

  // Create orthogonal router with configuration
  const router = new OrthogonalRouter({
    dropDistance: config.generationSpacing * 0.4, // 40% of generation spacing for drop
    busOffset: config.generationSpacing * 0.3, // 30% for bus position
    childSpacing: config.nodeSpacing * 0.5, // Half node spacing for child drops
    minSegmentLength: 5,
    gridSnap: 1,
    preferredAngles: [0, 90, 180, 270],
    cornerStyle: 'sharp',
  });

  console.log('🛠️ Router configuration:', {
    dropDistance: config.generationSpacing * 0.4,
    busOffset: config.generationSpacing * 0.3,
    childSpacing: config.nodeSpacing * 0.5,
  });

  // Generate the routing
  const routingOutput = router.route(familyNodes, relationships);

  // Sample a few segments for debugging
  const sampleSegments = Object.entries(routingOutput.segments)
    .slice(0, 5)
    .map(([id, segment]) => ({
      id,
      type: segment.type,
      points: segment.points.map((p) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      })),
      style: segment.style,
    }));

  console.log('✅ Routing output generated:', {
    segmentCount: Object.keys(routingOutput.segments).length,
    layerCount: routingOutput.layers.length,
    layers: routingOutput.layers.map((l) => ({
      name: l.name,
      edgeCount: l.edges.length,
      sampleEdges: l.edges.slice(0, 2).map((e) => ({
        id: e.id,
        segments: e.segmentIds.length,
      })),
    })),
    sampleSegments,
  });

  return routingOutput;
}

/**
 * Apportion function for Walker's algorithm
 * Handles the spacing between subtrees using thread and ancestor tracking
 */
function apportion(
  node: WalkerNode,
  defaultAncestor: WalkerNode,
  config: LayoutConfig,
): WalkerNode {
  if (node.leftSibling) {
    let vInnerLeft = node;
    let vOuterLeft = node;
    let vInnerRight = node.leftSibling;
    let vOuterRight = vInnerLeft.leftSibling || vInnerLeft;

    let sInnerLeft = vInnerLeft.mod;
    let sOuterLeft = vOuterLeft.mod;
    let sInnerRight = vInnerRight.mod;
    let sOuterRight = vOuterRight.mod;

    while (nextRight(vInnerRight) && nextLeft(vInnerLeft)) {
      const nextInnerRight = nextRight(vInnerRight);
      const nextInnerLeft = nextLeft(vInnerLeft);
      const nextOuterRight = nextLeft(vOuterRight);
      const nextOuterLeft = nextRight(vOuterLeft);

      if (
        !nextInnerRight ||
        !nextInnerLeft ||
        !nextOuterRight ||
        !nextOuterLeft
      ) {
        break;
      }

      vInnerRight = nextInnerRight;
      vInnerLeft = nextInnerLeft;
      vOuterRight = nextOuterRight;
      vOuterLeft = nextOuterLeft;

      vOuterLeft.ancestor = node;

      const shift =
        vInnerRight.prelim +
        sInnerRight -
        (vInnerLeft.prelim + sInnerLeft) +
        getNodeDistance(vInnerRight, vInnerLeft, config);

      if (shift > 0) {
        moveSubtree(ancestor(vInnerRight, node, defaultAncestor), node, shift);
        sInnerLeft += shift;
        sOuterLeft += shift;
      }

      sInnerRight += vInnerRight.mod;
      sInnerLeft += vInnerLeft.mod;
      sOuterRight += vOuterRight.mod;
      sOuterLeft += vOuterLeft.mod;
    }

    if (nextRight(vInnerRight) && !nextRight(vOuterLeft)) {
      vOuterLeft.thread = nextRight(vInnerRight);
      vOuterLeft.mod += sInnerRight - sOuterLeft;
    }

    if (nextLeft(vInnerLeft) && !nextLeft(vOuterRight)) {
      vOuterRight.thread = nextLeft(vInnerLeft);
      vOuterRight.mod += sInnerLeft - sOuterRight;
      defaultAncestor = node;
    }
  }
  return defaultAncestor;
}

/**
 * Get the ancestor of a node for the apportion algorithm
 */
function ancestor(
  vil: WalkerNode,
  node: WalkerNode,
  defaultAncestor: WalkerNode,
): WalkerNode {
  if (vil.ancestor?.parent === node.parent) {
    return vil.ancestor;
  }
  return defaultAncestor;
}

/**
 * Move a subtree by the given shift amount
 */
function moveSubtree(wm: WalkerNode, wp: WalkerNode, shift: number): void {
  const subtrees = wp.number - wm.number;
  if (subtrees !== 0) {
    wp.change -= shift / subtrees;
    wp.shift += shift;
    wm.change += shift / subtrees;
    wp.prelim += shift;
    wp.mod += shift;
  }
}

/**
 * Execute shifts for all children of a node
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
 * Get the next node on the left contour
 */
function nextLeft(node: WalkerNode): WalkerNode | undefined {
  if (node.children.length > 0) {
    return node.children[0];
  }
  return node.thread;
}

/**
 * Get the next node on the right contour
 */
function nextRight(node: WalkerNode): WalkerNode | undefined {
  if (node.children.length > 0) {
    return node.children[node.children.length - 1];
  }
  return node.thread;
}

/**
 * Calculate the distance between two nodes
 */
function getNodeDistance(
  left: WalkerNode,
  right: WalkerNode,
  config: LayoutConfig,
): number {
  // Check if nodes are spouses
  const areSpouses =
    left.spouses.includes(right) || right.spouses.includes(left);

  if (areSpouses) {
    // Use spouse spacing for married couples
    return config.spouseSpacing + (left.width + right.width) / 2;
  }

  // Base spacing for siblings or unrelated nodes
  let distance = config.nodeSpacing;

  // Add extra space if either node has spouses (for family groups)
  if (left.spouses.length > 0 || right.spouses.length > 0) {
    distance += config.familySpacing * 0.3;
  }

  // Account for node widths
  distance += (left.width + right.width) / 2;

  return distance;
}

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

  // Calculate margins - increase for better spacing
  const horizontalMargin = Math.max(80, config.canvasWidth * 0.15);
  const verticalMargin = Math.max(80, config.canvasHeight * 0.15);

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

  // Center horizontally and position vertically with good top margin
  const offsetX =
    horizontalMargin + (availableWidth - scaledTreeWidth) / 2 - minX * scale;
  // Don't center vertically - start from top with margin
  const offsetY = verticalMargin - minY * scale;

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

  const debugElements: Record<string, NodeVisualMetadata> = {};

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
    families?: Record<string, any>;
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
  const nodeMetadata: Record<string, NodeVisualMetadata> = {};

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

  // Build family groups within each generation using edges
  const familyGroups: Record<number, AugmentedIndividual[][]> = {};

  Object.entries(generationGroups).forEach(([genStr, genIndividuals]) => {
    const generation = parseInt(genStr);
    const genFamilies: AugmentedIndividual[][] = [];
    const processed = new Set<string>();

    // Try to group by spouse relationships first
    genIndividuals.forEach((individual) => {
      if (processed.has(individual.id)) return;

      const familyGroup: AugmentedIndividual[] = [individual];
      processed.add(individual.id);

      // Find spouses in the same generation
      const spouseEdges = gedcomData.metadata.edges.filter(
        (edge) =>
          edge.relationshipType === 'spouse' &&
          (edge.sourceId === individual.id || edge.targetId === individual.id),
      );

      spouseEdges.forEach((edge) => {
        const spouseId =
          edge.sourceId === individual.id ? edge.targetId : edge.sourceId;
        const spouse = genIndividuals.find((ind) => ind.id === spouseId);
        if (spouse && !processed.has(spouse.id)) {
          familyGroup.push(spouse);
          processed.add(spouse.id);
        }
      });

      // Add siblings who are not yet processed
      individual.siblings?.forEach((siblingId) => {
        const sibling = genIndividuals.find((ind) => ind.id === siblingId);
        if (sibling && !processed.has(sibling.id)) {
          familyGroup.push(sibling);
          processed.add(sibling.id);
        }
      });

      genFamilies.push(familyGroup);
    });

    familyGroups[generation] = genFamilies;
  });

  console.log(
    'Family groups per generation:',
    Object.entries(familyGroups).map(([gen, families]) => ({
      generation: gen,
      familyCount: families.length,
      familySizes: families.map((f) => f.length),
    })),
  );

  // Calculate positions by generation with family clustering
  Object.entries(familyGroups).forEach(([genStr, genFamilies]) => {
    const generation = parseInt(genStr);
    const generationIndex = generation - minGeneration;
    const allIndividuals = genFamilies.flat();

    // Handle very large generations by creating multiple rows
    const maxNodesPerRow = Math.floor(availableWidth / (nodeSize + minSpacing));
    const needsMultipleRows = allIndividuals.length > maxNodesPerRow;

    if (needsMultipleRows) {
      // Split families across multiple rows, keeping families together
      const familiesPerRow: AugmentedIndividual[][][] = [[]];
      let currentRowWidth = 0;
      let currentRow = 0;

      genFamilies.forEach((family) => {
        const familyWidth =
          family.length * (nodeSize + minSpacing) + config.familySpacing;

        if (
          currentRowWidth + familyWidth > availableWidth &&
          familiesPerRow[currentRow].length > 0
        ) {
          currentRow++;
          familiesPerRow[currentRow] = [];
          currentRowWidth = 0;
        }

        familiesPerRow[currentRow].push(family);
        currentRowWidth += familyWidth;
      });

      console.log(
        `Generation ${String(generation)} needs ${String(familiesPerRow.length)} rows:`,
        {
          totalNodes: allIndividuals.length,
          totalFamilies: genFamilies.length,
          rowDistribution: familiesPerRow.map((r) => r.map((f) => f.length)),
        },
      );

      for (let row = 0; row < familiesPerRow.length; row++) {
        const rowFamilies = familiesPerRow[row];

        const baseY =
          100 +
          generationIndex * config.generationSpacing +
          row * (nodeSize + 20);

        // Calculate total width including family spacing
        const totalFamilyWidths = rowFamilies.reduce(
          (sum, family) =>
            sum + family.length * (nodeSize + minSpacing) - minSpacing,
          0,
        );
        const totalFamilySpacing =
          (rowFamilies.length - 1) * config.familySpacing;
        const totalRowWidth = totalFamilyWidths + totalFamilySpacing;

        let currentX = horizontalMargin + (availableWidth - totalRowWidth) / 2;

        // Position each family with spacing between them
        rowFamilies.forEach((family) => {
          family.forEach((individual, index) => {
            const x = currentX + index * (nodeSize + minSpacing) + nodeSize / 2;

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
              // Add label information when showLabels is enabled
              ...(config.showLabels
                ? {
                    custom: {
                      label: individual.name || individual.id,
                      labelOffsetY: Math.max(20, nodeSize * 0.7), // Minimum 20px offset
                      labelSize: Math.max(config.minLabelSize, nodeSize * 0.3), // Use configurable minimum
                    },
                  }
                : {}),
            };
          });

          // Move to next family position
          currentX +=
            family.length * (nodeSize + minSpacing) -
            minSpacing +
            config.familySpacing;
        });
      }
    } else {
      // Single row for smaller generations with family clustering
      const baseY = 100 + generationIndex * config.generationSpacing;

      // Calculate total width including family spacing
      const totalFamilyWidths = genFamilies.reduce(
        (sum, family) =>
          sum + family.length * (nodeSize + minSpacing) - minSpacing,
        0,
      );
      const totalFamilySpacing = Math.max(
        0,
        (genFamilies.length - 1) * config.familySpacing,
      );
      const totalRowWidth = totalFamilyWidths + totalFamilySpacing;

      let currentX = horizontalMargin + (availableWidth - totalRowWidth) / 2;

      // Position each family with spacing between them
      genFamilies.forEach((family) => {
        family.forEach((individual, index) => {
          const x = currentX + index * (nodeSize + minSpacing) + nodeSize / 2;

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
            // Add label information when showLabels is enabled
            ...(config.showLabels
              ? {
                  custom: {
                    label: individual.name || individual.id,
                    labelOffsetY: Math.max(20, nodeSize * 0.7), // Minimum 20px offset
                    labelSize: Math.max(config.minLabelSize, nodeSize * 0.3), // Use configurable minimum
                  },
                }
              : {}),
          };
        });

        // Move to next family position
        currentX +=
          family.length * (nodeSize + minSpacing) -
          minSpacing +
          config.familySpacing;
      });
    }
  });

  // Generate straight-line edges for fallback layout too
  const edgeMetadata: Record<string, EdgeVisualMetadata> = {};
  gedcomData.metadata.edges.forEach((edge) => {
    const sourcePos = positions[edge.sourceId];
    const targetPos = positions[edge.targetId];

    if (sourcePos && targetPos) {
      edgeMetadata[edge.id] = {
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
          // Store the midpoint for potential later use
          midX: (sourcePos.x + targetPos.x) / 2,
          midY: (sourcePos.y + targetPos.y) / 2,
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
