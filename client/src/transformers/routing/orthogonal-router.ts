/**
 * Orthogonal Router
 *
 * Implements orthogonal (90-degree) edge routing for family tree visualizations.
 * Creates T-junctions for parent-child relationships and bus lines for siblings.
 */

import type {
  Point,
  EdgeSegment,
  RoutedEdge,
  EdgeLayer,
  RoutingOutput,
  OrthogonalRoutingConfig,
} from '../../display/types/edge-routing';
import { createStraightSegment } from '../../display/types/edge-routing';

export interface FamilyNode {
  id: string;
  position: Point;
  type: 'individual' | 'family';
  generation?: number;
}

export interface FamilyRelationship {
  sourceId: string;
  targetId: string;
  type: 'parent-child' | 'spouse' | 'sibling';
  familyId?: string;
}

/**
 * Default configuration for orthogonal routing
 */
export const DEFAULT_ORTHOGONAL_CONFIG: OrthogonalRoutingConfig = {
  preferredAngles: [0, 90, 180, 270],
  cornerStyle: 'sharp',
  minSegmentLength: 5,
  gridSnap: 1,
  dropDistance: 50,
  busOffset: 30,
  childSpacing: 20,
};

/**
 * Main orthogonal router class
 */
export class OrthogonalRouter {
  private config: OrthogonalRoutingConfig;
  private segments = new Map<string, EdgeSegment>();
  private edges = new Map<string, RoutedEdge>();

  constructor(config: Partial<OrthogonalRoutingConfig> = {}) {
    this.config = { ...DEFAULT_ORTHOGONAL_CONFIG, ...config };
  }

  /**
   * Route all relationships with orthogonal paths
   */
  route(
    nodes: FamilyNode[],
    relationships: FamilyRelationship[],
  ): RoutingOutput {
    console.log('🎯 OrthogonalRouter.route() called with:', {
      nodeCount: nodes.length,
      relationshipCount: relationships.length,
      sampleNodes: nodes
        .slice(0, 3)
        .map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })),
    });

    // Clear previous routing
    this.segments.clear();
    this.edges.clear();

    // Group relationships by type for different routing strategies
    const parentChildRels = relationships.filter(
      (r) => r.type === 'parent-child',
    );
    const spouseRels = relationships.filter((r) => r.type === 'spouse');
    const siblingRels = relationships.filter((r) => r.type === 'sibling');

    console.log('📦 Relationships by type:', {
      parentChild: parentChildRels.length,
      spouse: spouseRels.length,
      sibling: siblingRels.length,
    });

    // Create a node lookup map
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Route different relationship types
    const parentChildEdges = this.routeParentChildRelationships(
      parentChildRels,
      nodeMap,
    );
    const spouseEdges = this.routeSpouseRelationships(spouseRels, nodeMap);
    const siblingEdges = this.routeSiblingRelationships(siblingRels, nodeMap);

    // Create layers with proper z-ordering
    // Parent-child connections should be drawn first (background)
    // Then marriages/spouse connections on top for visibility
    const layers: EdgeLayer[] = [
      {
        name: 'parent-child',
        edges: parentChildEdges,
        style: {
          strokeColor: '#333333',
          strokeWeight: 2,
        },
      },
      {
        name: 'marriages',
        edges: spouseEdges,
        style: {
          strokeColor: '#333333', // Same color as parent-child for consistency
          strokeWeight: 2,
        },
      },
      {
        name: 'siblings',
        edges: siblingEdges,
        style: {
          strokeColor: '#999999',
          strokeWeight: 1,
          strokeStyle: 'dashed',
        },
      },
    ];

    // Convert segments map to object
    const segmentsObject: Record<string, EdgeSegment> = {};
    this.segments.forEach((segment, id) => {
      segmentsObject[id] = segment;
    });

    const result = {
      segments: segmentsObject,
      layers,
    };

    console.log('✅ OrthogonalRouter.route() returning:', {
      segmentCount: Object.keys(segmentsObject).length,
      layerCount: layers.length,
      layers: layers.map((l) => ({ name: l.name, edgeCount: l.edges.length })),
    });

    return result;
  }

  /**
   * Route parent-child relationships with T-junctions
   */
  private routeParentChildRelationships(
    relationships: FamilyRelationship[],
    nodeMap: Map<string, FamilyNode>,
  ): RoutedEdge[] {
    // Group children by their family (both parents) for proper T-junction creation
    const familyToChildren = new Map<string, Set<string>>();
    const familyToParents = new Map<string, Set<string>>();
    const childToFamily = new Map<string, string>();

    relationships.forEach((rel) => {
      const familyId = rel.familyId || `family_${rel.sourceId}`;

      // Track children for this family
      if (!familyToChildren.has(familyId)) {
        familyToChildren.set(familyId, new Set());
      }
      const childrenSet = familyToChildren.get(familyId);
      if (childrenSet) {
        childrenSet.add(rel.targetId);
      }

      // Track parents for this family
      if (!familyToParents.has(familyId)) {
        familyToParents.set(familyId, new Set());
      }
      const parentsSet = familyToParents.get(familyId);
      if (parentsSet) {
        parentsSet.add(rel.sourceId);
      }

      // Map child to family for deduplication
      childToFamily.set(rel.targetId, familyId);
    });

    const edges: RoutedEdge[] = [];
    const processedChildren = new Set<string>();

    // Create T-junctions for each family group
    familyToChildren.forEach((childIds, familyId) => {
      const parentIds = familyToParents.get(familyId) || new Set();
      const parentNodes = Array.from(parentIds)
        .map((id) => nodeMap.get(id))
        .filter((node): node is FamilyNode => node !== undefined);

      const childNodes = Array.from(childIds)
        .filter((id) => !processedChildren.has(id)) // Avoid duplicate processing
        .map((id) => nodeMap.get(id))
        .filter((node): node is FamilyNode => node !== undefined);

      if (childNodes.length === 0 || parentNodes.length === 0) return;

      // Mark children as processed
      childIds.forEach((id) => processedChildren.add(id));

      // Create T-junction from parent(s) to children
      const tjunctionEdges = this.createFamilyTJunction(
        parentNodes,
        childNodes,
        familyId,
      );

      edges.push(...tjunctionEdges);
    });

    return edges;
  }

  /**
   * Create a T-junction connecting parent(s) to multiple children
   * Handles both single parent and two-parent families
   */
  private createFamilyTJunction(
    parents: FamilyNode[],
    children: FamilyNode[],
    familyId: string,
  ): RoutedEdge[] {
    const edges: RoutedEdge[] = [];

    // Sort children by x position for cleaner layout
    children.sort((a, b) => a.position.x - b.position.x);

    // Calculate the connection point for parents
    let parentConnectionX: number;
    let parentConnectionY: number;

    if (parents.length === 2) {
      // Two parents: connect from midpoint between them at parent level
      parentConnectionX = (parents[0].position.x + parents[1].position.x) / 2;
      // Connect from the parent level (marriage line will be drawn separately)
      parentConnectionY = parents[0].position.y;
    } else {
      // Single parent: connect directly from parent
      parentConnectionX = parents[0].position.x;
      parentConnectionY = parents[0].position.y;
    }

    // Calculate bus position (horizontal line connecting to all children)
    // Position the bus midway between parents and children
    const childrenY = Math.min(...children.map((c) => c.position.y));
    const parentY = Math.max(...parents.map((p) => p.position.y));
    const busY = parentY + (childrenY - parentY) / 2;

    const childrenX = children.map((c) => c.position.x);
    const busStartX = Math.min(...childrenX);
    const busEndX = Math.max(...childrenX);

    // Create vertical drop from parent connection point to children's bus
    const parentDropSegment = createStraightSegment(
      { x: parentConnectionX, y: parentConnectionY },
      { x: parentConnectionX, y: busY },
      {
        label: `parent_drop_${familyId}`,
        shared: true,
        style: {
          strokeWeight: 2,
        },
      },
    );
    this.segments.set(parentDropSegment.id, parentDropSegment);

    // Create horizontal bus segment only if there are multiple children
    if (children.length > 1) {
      const busSegment = createStraightSegment(
        { x: busStartX, y: busY },
        { x: busEndX, y: busY },
        {
          label: `sibling_bus_${familyId}`,
          shared: true,
          style: {
            strokeWeight: 2,
          },
        },
      );
      this.segments.set(busSegment.id, busSegment);

      // Create individual drops for each child
      children.forEach((child, index) => {
        const childDropSegment = createStraightSegment(
          { x: child.position.x, y: busY },
          child.position,
          {
            label: `child_drop_${familyId}_${String(index)}`,
            style: {
              strokeWeight: 2,
            },
          },
        );
        this.segments.set(childDropSegment.id, childDropSegment);

        // Create edges for each parent-child relationship
        parents.forEach((parent) => {
          const edge: RoutedEdge = {
            id: `parent_child_${parent.id}_${child.id}`,
            segmentIds: [
              parentDropSegment.id,
              busSegment.id,
              childDropSegment.id,
            ],
            relationshipType: 'parent-child',
            sourceNodeId: parent.id,
            targetNodeId: child.id,
          };
          edges.push(edge);
        });
      });
    } else if (children.length === 1) {
      // Single child: direct vertical line from parent connection to child
      const child = children[0];
      const childDropSegment = createStraightSegment(
        { x: parentConnectionX, y: parentConnectionY },
        child.position,
        {
          label: `child_drop_${familyId}_0`,
          style: {
            strokeWeight: 2,
          },
        },
      );
      this.segments.set(childDropSegment.id, childDropSegment);

      // Create edges for each parent-child relationship
      parents.forEach((parent) => {
        const edge: RoutedEdge = {
          id: `parent_child_${parent.id}_${child.id}`,
          segmentIds: [childDropSegment.id],
          relationshipType: 'parent-child',
          sourceNodeId: parent.id,
          targetNodeId: child.id,
        };
        edges.push(edge);
      });
    }

    return edges;
  }

  /**
   * Route spouse relationships
   */
  private routeSpouseRelationships(
    relationships: FamilyRelationship[],
    nodeMap: Map<string, FamilyNode>,
  ): RoutedEdge[] {
    const edges: RoutedEdge[] = [];

    relationships.forEach((rel) => {
      const source = nodeMap.get(rel.sourceId);
      const target = nodeMap.get(rel.targetId);

      if (!source || !target) return;

      // Create marriage connection (straight line or bracket)
      const marriageSegments = this.createMarriageConnection(source, target);

      marriageSegments.forEach((segment) => {
        this.segments.set(segment.id, segment);
      });

      const edge: RoutedEdge = {
        id: `spouse_${rel.sourceId}_${rel.targetId}`,
        segmentIds: marriageSegments.map((s) => s.id),
        relationshipType: 'spouse',
        sourceNodeId: rel.sourceId,
        targetNodeId: rel.targetId,
        bidirectional: true,
      };

      edges.push(edge);
    });

    return edges;
  }

  /**
   * Create marriage connection between spouses
   */
  private createMarriageConnection(
    spouse1: FamilyNode,
    spouse2: FamilyNode,
  ): EdgeSegment[] {
    const segments: EdgeSegment[] = [];

    // Simple horizontal line between spouses at their level
    if (Math.abs(spouse1.position.y - spouse2.position.y) < 5) {
      // Spouses are at same height - simple horizontal line
      const marriageSegment = createStraightSegment(
        spouse1.position,
        spouse2.position,
        {
          label: 'marriage_line',
          style: {
            strokeWeight: 2,
          },
        },
      );
      segments.push(marriageSegment);
    } else {
      // Spouses at different heights - create L-shaped connection
      const midY = (spouse1.position.y + spouse2.position.y) / 2;

      // Vertical segment from spouse1 to middle height
      const seg1 = createStraightSegment(
        spouse1.position,
        { x: spouse1.position.x, y: midY },
        {
          label: 'marriage_connector_1',
          style: {
            strokeWeight: 2,
          },
        },
      );

      // Horizontal segment at middle height
      const seg2 = createStraightSegment(
        { x: spouse1.position.x, y: midY },
        { x: spouse2.position.x, y: midY },
        {
          label: 'marriage_line',
          style: {
            strokeWeight: 2,
          },
        },
      );

      // Vertical segment from middle height to spouse2
      const seg3 = createStraightSegment(
        { x: spouse2.position.x, y: midY },
        spouse2.position,
        {
          label: 'marriage_connector_2',
          style: {
            strokeWeight: 2,
          },
        },
      );

      segments.push(seg1, seg2, seg3);
    }

    return segments;
  }

  /**
   * Route sibling relationships
   */
  private routeSiblingRelationships(
    relationships: FamilyRelationship[],
    nodeMap: Map<string, FamilyNode>,
  ): RoutedEdge[] {
    // Sibling relationships are already visually represented by the horizontal bus line
    // in the T-junction created for parent-child relationships.
    // We don't need additional visual elements for siblings.
    // Return empty array to avoid redundant dotted lines.
    return [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrthogonalRoutingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
