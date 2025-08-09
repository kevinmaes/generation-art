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
import {
  createStraightSegment,
} from '../../display/types/edge-routing';

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
    relationships: FamilyRelationship[]
  ): RoutingOutput {
    // Clear previous routing
    this.segments.clear();
    this.edges.clear();
    
    // Group relationships by type for different routing strategies
    const parentChildRels = relationships.filter(r => r.type === 'parent-child');
    const spouseRels = relationships.filter(r => r.type === 'spouse');
    const siblingRels = relationships.filter(r => r.type === 'sibling');
    
    // Create a node lookup map
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Route different relationship types
    const parentChildEdges = this.routeParentChildRelationships(parentChildRels, nodeMap);
    const spouseEdges = this.routeSpouseRelationships(spouseRels, nodeMap);
    const siblingEdges = this.routeSiblingRelationships(siblingRels, nodeMap);
    
    // Create layers with proper z-ordering
    const layers: EdgeLayer[] = [
      {
        name: 'marriages',
        edges: spouseEdges,
        style: {
          strokeColor: '#666666',
          strokeWeight: 2,
        }
      },
      {
        name: 'parent-child',
        edges: parentChildEdges,
        style: {
          strokeColor: '#333333',
          strokeWeight: 2,
        }
      },
      {
        name: 'siblings',
        edges: siblingEdges,
        style: {
          strokeColor: '#999999',
          strokeWeight: 1,
          strokeStyle: 'dashed',
        }
      }
    ];
    
    // Convert segments map to object
    const segmentsObject: Record<string, EdgeSegment> = {};
    this.segments.forEach((segment, id) => {
      segmentsObject[id] = segment;
    });
    
    return {
      segments: segmentsObject,
      layers
    };
  }
  
  /**
   * Route parent-child relationships with T-junctions
   */
  private routeParentChildRelationships(
    relationships: FamilyRelationship[],
    nodeMap: Map<string, FamilyNode>
  ): RoutedEdge[] {
    // Group children by their parents for T-junction creation
    const parentToChildren = new Map<string, FamilyRelationship[]>();
    
    relationships.forEach(rel => {
      const existing = parentToChildren.get(rel.sourceId) || [];
      existing.push(rel);
      parentToChildren.set(rel.sourceId, existing);
    });
    
    const edges: RoutedEdge[] = [];
    
    // Create T-junctions for each parent
    parentToChildren.forEach((childRels, parentId) => {
      const parentNode = nodeMap.get(parentId);
      if (!parentNode) return;
      
      const childNodes = childRels
        .map(rel => nodeMap.get(rel.targetId))
        .filter((node): node is FamilyNode => node !== undefined);
      
      if (childNodes.length === 0) return;
      
      // Create T-junction
      const tjunctionEdges = this.createTJunction(
        parentNode,
        childNodes,
        childRels[0].familyId
      );
      
      edges.push(...tjunctionEdges);
    });
    
    return edges;
  }
  
  /**
   * Create a T-junction connecting a parent to multiple children
   */
  private createTJunction(
    parent: FamilyNode,
    children: FamilyNode[],
    _familyId?: string
  ): RoutedEdge[] {
    const edges: RoutedEdge[] = [];
    
    // Calculate bus position
    const busY = parent.position.y + this.config.dropDistance;
    const childrenX = children.map(c => c.position.x);
    const busStartX = Math.min(...childrenX) - this.config.childSpacing;
    const busEndX = Math.max(...childrenX) + this.config.childSpacing;
    
    // Create parent drop segment (shared by all children)
    const parentDropSegment = createStraightSegment(
      parent.position,
      { x: parent.position.x, y: busY },
      {
        label: 'parent_drop',
        shared: true
      }
    );
    this.segments.set(parentDropSegment.id, parentDropSegment);
    
    // Create horizontal bus segment (shared by all children)
    const busSegment = createStraightSegment(
      { x: busStartX, y: busY },
      { x: busEndX, y: busY },
      {
        label: 'sibling_bus',
        shared: true,
        style: {
          strokeWeight: 3
        }
      }
    );
    this.segments.set(busSegment.id, busSegment);
    
    // If parent X is outside bus range, add horizontal segment
    if (parent.position.x < busStartX || parent.position.x > busEndX) {
      const busConnectionX = parent.position.x < busStartX ? busStartX : busEndX;
      const horizontalSegment = createStraightSegment(
        { x: parent.position.x, y: busY },
        { x: busConnectionX, y: busY },
        {
          label: 'parent_horizontal',
          shared: true
        }
      );
      this.segments.set(horizontalSegment.id, horizontalSegment);
    }
    
    // Create individual drops for each child
    children.forEach((child, index) => {
      // Create child drop segment
      const childDropSegment = createStraightSegment(
        { x: child.position.x, y: busY },
        child.position,
        {
          label: `child_drop_${index}`
        }
      );
      this.segments.set(childDropSegment.id, childDropSegment);
      
      // Create edge connecting parent to child through bus
      const edge: RoutedEdge = {
        id: `parent_child_${parent.id}_${child.id}`,
        segmentIds: [
          parentDropSegment.id,
          busSegment.id,
          childDropSegment.id
        ],
        relationshipType: 'parent-child',
        sourceNodeId: parent.id,
        targetNodeId: child.id
      };
      
      edges.push(edge);
    });
    
    return edges;
  }
  
  /**
   * Route spouse relationships
   */
  private routeSpouseRelationships(
    relationships: FamilyRelationship[],
    nodeMap: Map<string, FamilyNode>
  ): RoutedEdge[] {
    const edges: RoutedEdge[] = [];
    
    relationships.forEach(rel => {
      const source = nodeMap.get(rel.sourceId);
      const target = nodeMap.get(rel.targetId);
      
      if (!source || !target) return;
      
      // Create marriage connection (straight line or bracket)
      const marriageSegments = this.createMarriageConnection(source, target);
      
      marriageSegments.forEach(segment => {
        this.segments.set(segment.id, segment);
      });
      
      const edge: RoutedEdge = {
        id: `spouse_${rel.sourceId}_${rel.targetId}`,
        segmentIds: marriageSegments.map(s => s.id),
        relationshipType: 'spouse',
        sourceNodeId: rel.sourceId,
        targetNodeId: rel.targetId,
        bidirectional: true
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
    spouse2: FamilyNode
  ): EdgeSegment[] {
    const segments: EdgeSegment[] = [];
    
    // Simple horizontal line between spouses
    if (Math.abs(spouse1.position.y - spouse2.position.y) < 5) {
      // Spouses are at same height - direct horizontal line
      const segment = createStraightSegment(
        spouse1.position,
        spouse2.position,
        {
          label: 'marriage_line',
          style: {
            strokeWeight: 2
          }
        }
      );
      segments.push(segment);
    } else {
      // Spouses at different heights - create bracket
      const midY = (spouse1.position.y + spouse2.position.y) / 2;
      
      // Vertical segment from spouse1
      const seg1 = createStraightSegment(
        spouse1.position,
        { x: spouse1.position.x, y: midY },
        { label: 'marriage_bracket_1' }
      );
      
      // Horizontal segment
      const seg2 = createStraightSegment(
        { x: spouse1.position.x, y: midY },
        { x: spouse2.position.x, y: midY },
        { label: 'marriage_bracket_2' }
      );
      
      // Vertical segment to spouse2
      const seg3 = createStraightSegment(
        { x: spouse2.position.x, y: midY },
        spouse2.position,
        { label: 'marriage_bracket_3' }
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
    nodeMap: Map<string, FamilyNode>
  ): RoutedEdge[] {
    const edges: RoutedEdge[] = [];
    
    // Group siblings by family
    const familySiblings = new Map<string, Set<string>>();
    
    relationships.forEach(rel => {
      const familyId = rel.familyId || 'unknown';
      if (!familySiblings.has(familyId)) {
        familySiblings.set(familyId, new Set());
      }
      familySiblings.get(familyId)!.add(rel.sourceId);
      familySiblings.get(familyId)!.add(rel.targetId);
    });
    
    // Create sibling connectors for each family
    familySiblings.forEach((siblingIds, familyId) => {
      const siblings = Array.from(siblingIds)
        .map(id => nodeMap.get(id))
        .filter((node): node is FamilyNode => node !== undefined)
        .sort((a, b) => a.position.x - b.position.x);
      
      if (siblings.length < 2) return;
      
      // Create a subtle connector line below siblings
      const connectorY = Math.max(...siblings.map(s => s.position.y)) + 20;
      const startX = siblings[0].position.x;
      const endX = siblings[siblings.length - 1].position.x;
      
      const connectorSegment = createStraightSegment(
        { x: startX, y: connectorY },
        { x: endX, y: connectorY },
        {
          label: `sibling_connector_${familyId}`,
          shared: true,
          style: {
            strokeWeight: 1,
            strokeStyle: 'dashed',
            opacity: 0.5
          }
        }
      );
      
      this.segments.set(connectorSegment.id, connectorSegment);
      
      // Create drops from each sibling to the connector
      siblings.forEach((sibling, index) => {
        const dropSegment = createStraightSegment(
          sibling.position,
          { x: sibling.position.x, y: connectorY },
          {
            label: `sibling_drop_${index}`,
            style: {
              strokeWeight: 1,
              strokeStyle: 'dotted',
              opacity: 0.3
            }
          }
        );
        
        this.segments.set(dropSegment.id, dropSegment);
        
        // Create edge for this sibling connection
        const edge: RoutedEdge = {
          id: `sibling_${familyId}_${sibling.id}`,
          segmentIds: [dropSegment.id, connectorSegment.id],
          relationshipType: 'sibling',
          sourceNodeId: sibling.id
        };
        
        edges.push(edge);
      });
    });
    
    return edges;
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrthogonalRoutingConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
}