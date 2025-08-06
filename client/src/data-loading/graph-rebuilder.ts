/**
 * Client-side graph data rebuilding utilities
 * Rebuilds graph data from serialized JSON since functions can't be serialized
 */

import type {
  AugmentedIndividual,
  FamilyWithMetadata,
  GraphData,
  GraphAdjacencyMaps,
  GraphTraversalUtils,
  WalkerTreeData,
  GedcomDataWithMetadata,
} from '../../../shared/types';

/**
 * Build adjacency maps for O(1) graph lookups
 */
function buildAdjacencyMaps(
  _individuals: Record<string, AugmentedIndividual>,
  families: Record<string, FamilyWithMetadata>,
): GraphAdjacencyMaps {
  const parentToChildren = new Map<string, string[]>();
  const childToParents = new Map<string, string[]>();
  const spouseToSpouse = new Map<string, string[]>();
  const siblingGroups = new Map<string, string[]>();
  const familyMembership = new Map<string, string[]>();

  // Process each family to build adjacency maps
  Object.values(families).forEach((family) => {
    if (!family.id) return; // Skip invalid families
    const familyId = family.id;

    // Parent-child relationships
    if (family.husband) {
      const husbandId = family.husband.id;
      const childIds = family.children.map((child) => child.id);

      parentToChildren.set(husbandId, [
        ...(parentToChildren.get(husbandId) ?? []),
        ...childIds,
      ]);

      // Add family membership
      const husbandFamilies = familyMembership.get(husbandId) ?? [];
      familyMembership.set(husbandId, [...husbandFamilies, familyId]);

      // Set children's parent references
      childIds.forEach((childId) => {
        const parents = childToParents.get(childId) ?? [];
        childToParents.set(childId, [...parents, husbandId]);

        // Add family membership for children
        const childFamilies = familyMembership.get(childId) ?? [];
        familyMembership.set(childId, [...childFamilies, familyId]);
      });
    }

    if (family.wife) {
      const wifeId = family.wife.id;
      const childIds = family.children.map((child) => child.id);

      parentToChildren.set(wifeId, [
        ...(parentToChildren.get(wifeId) ?? []),
        ...childIds,
      ]);

      // Add family membership
      const wifeFamilies = familyMembership.get(wifeId) ?? [];
      familyMembership.set(wifeId, [...wifeFamilies, familyId]);

      // Set children's parent references
      childIds.forEach((childId) => {
        const parents = childToParents.get(childId) ?? [];
        childToParents.set(childId, [...parents, wifeId]);

        // Add family membership for children
        const childFamilies = familyMembership.get(childId) ?? [];
        familyMembership.set(childId, [...childFamilies, familyId]);
      });
    }

    // Spouse relationships
    if (family.husband && family.wife) {
      const husbandId = family.husband.id;
      const wifeId = family.wife.id;

      spouseToSpouse.set(husbandId, [
        ...(spouseToSpouse.get(husbandId) ?? []),
        wifeId,
      ]);
      spouseToSpouse.set(wifeId, [
        ...(spouseToSpouse.get(wifeId) ?? []),
        husbandId,
      ]);
    }

    // Sibling relationships
    if (family.children.length > 1) {
      const childIds = family.children.map((child) => child.id);
      childIds.forEach((childId) => {
        const siblings = childIds.filter((id) => id !== childId);
        siblingGroups.set(childId, [
          ...(siblingGroups.get(childId) ?? []),
          ...siblings,
        ]);
      });
    }
  });

  return {
    parentToChildren,
    childToParents,
    spouseToSpouse,
    siblingGroups,
    familyMembership,
  };
}

/**
 * Create traversal utilities that use adjacency maps for O(1) lookups
 */
function createTraversalUtils(
  individuals: Record<string, AugmentedIndividual>,
  adjacencyMaps: GraphAdjacencyMaps,
): GraphTraversalUtils {
  const { parentToChildren, childToParents, spouseToSpouse, siblingGroups } =
    adjacencyMaps;

  const getIndividuals = (ids: string[]): AugmentedIndividual[] => {
    return ids
      .map((id) => individuals[id])
      .filter(Boolean);
  };

  return {
    getParents: (individualId: string): AugmentedIndividual[] => {
      const parentIds = childToParents.get(individualId) ?? [];
      return getIndividuals(parentIds);
    },

    getChildren: (individualId: string): AugmentedIndividual[] => {
      const childIds = parentToChildren.get(individualId) ?? [];
      return getIndividuals(childIds);
    },

    getSpouses: (individualId: string): AugmentedIndividual[] => {
      const spouseIds = spouseToSpouse.get(individualId) ?? [];
      return getIndividuals(spouseIds);
    },

    getSiblings: (individualId: string): AugmentedIndividual[] => {
      const siblingIds = siblingGroups.get(individualId) ?? [];
      return getIndividuals(siblingIds);
    },

    getAncestors: (
      individualId: string,
      maxLevels?: number,
    ): AugmentedIndividual[] => {
      const ancestors: AugmentedIndividual[] = [];
      const visited = new Set<string>();
      const queue: { id: string; level: number }[] = [
        { id: individualId, level: 0 },
      ];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) break;

        const { id, level } = current;

        if (visited.has(id) || (maxLevels && level >= maxLevels)) continue;
        visited.add(id);

        const parentIds = childToParents.get(id) ?? [];
        parentIds.forEach((parentId: string) => {
          const parent = individuals[parentId];
          if (!visited.has(parentId)) {
            ancestors.push(parent);
            queue.push({ id: parentId, level: level + 1 });
          }
        });
      }

      return ancestors;
    },

    getDescendants: (
      individualId: string,
      maxLevels?: number,
    ): AugmentedIndividual[] => {
      const descendants: AugmentedIndividual[] = [];
      const visited = new Set<string>();
      const queue: { id: string; level: number }[] = [
        { id: individualId, level: 0 },
      ];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) break;

        const { id, level } = current;

        if (visited.has(id) || (maxLevels && level >= maxLevels)) continue;
        visited.add(id);

        const childIds = parentToChildren.get(id) ?? [];
        childIds.forEach((childId: string) => {
          const child = individuals[childId];
          if (!visited.has(childId)) {
            descendants.push(child);
            queue.push({ id: childId, level: level + 1 });
          }
        });
      }

      return descendants;
    },

    getFamilyCluster: (individualId: string) => {
      return {
        parents: (childToParents.get(individualId) ?? [])
          .map((id: string) => individuals[id])
          .filter(Boolean),
        spouses: (spouseToSpouse.get(individualId) ?? [])
          .map((id: string) => individuals[id])
          .filter(Boolean),
        children: (parentToChildren.get(individualId) ?? [])
          .map((id: string) => individuals[id])
          .filter(Boolean),
        siblings: (siblingGroups.get(individualId) ?? [])
          .map((id: string) => individuals[id])
          .filter(Boolean),
      };
    },
  };
}

/**
 * Build Walker's algorithm support data
 */
function buildWalkerTreeData(
  individuals: Record<string, AugmentedIndividual>,
  families: Record<string, FamilyWithMetadata>,
  adjacencyMaps: GraphAdjacencyMaps,
): WalkerTreeData {
  const { childToParents, parentToChildren } = adjacencyMaps;

  // Find root nodes (individuals with no parents)
  const rootNodes = Object.keys(individuals).filter((id) => {
    const parents = childToParents.get(id) ?? [];
    return parents.length === 0;
  });

  // Build node hierarchy
  const nodeHierarchy = new Map<
    string,
    {
      parent?: string;
      children: string[];
      leftSibling?: string;
      rightSibling?: string;
      depth: number;
    }
  >();

  // BFS to calculate depths and build hierarchy
  const queue: { id: string; depth: number; parent?: string }[] = rootNodes.map(
    (id) => ({ id, depth: 0 }),
  );
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { id, depth, parent } = current;

    if (visited.has(id)) continue;
    visited.add(id);

    const children = parentToChildren.get(id) ?? [];

    nodeHierarchy.set(id, {
      parent,
      children,
      depth,
      // Sibling order will be set later
    });

    // Add children to queue
    children.forEach((childId: string) => {
      queue.push({ id: childId, depth: depth + 1, parent: id });
    });
  }

  // Set sibling relationships
  nodeHierarchy.forEach((node, _nodeId) => {
    node.children.forEach((childId, index) => {
      const childNode = nodeHierarchy.get(childId);
      if (childNode) {
        if (index > 0) {
          childNode.leftSibling = node.children[index - 1];
        }
        if (index < node.children.length - 1) {
          childNode.rightSibling = node.children[index + 1];
        }
        nodeHierarchy.set(childId, childNode);
      }
    });
  });

  // Group by generations
  const generationLevels = new Map<number, string[]>();
  Object.entries(individuals).forEach(([id, individual]) => {
    const generation = individual.metadata.generation ?? 0;
    const currentLevel = generationLevels.get(generation) ?? [];
    generationLevels.set(generation, [...currentLevel, id]);
  });

  // Build family clusters
  const familyClusters = Object.values(families).map((family) => {
    const parents = [];
    const spouseOrder = [];

    if (family.husband) {
      parents.push(family.husband.id);
      spouseOrder.push(family.husband.id);
    }
    if (family.wife) {
      parents.push(family.wife.id);
      spouseOrder.push(family.wife.id);
    }

    const children = family.children.map((child) => child.id);

    // Determine generation (use first parent's generation if available)
    const firstParent = family.husband ?? family.wife;
    const generation = firstParent
      ? (firstParent as AugmentedIndividual).metadata.generation ?? 0
      : 0;

    return {
      id: family.id,
      parents,
      children,
      spouseOrder,
      generation,
    };
  });

  return {
    nodeHierarchy,
    familyClusters,
    rootNodes,
    generationLevels,
  };
}

/**
 * Build complete graph data structure (client-side)
 */
function buildGraphData(
  individuals: Record<string, AugmentedIndividual>,
  families: Record<string, FamilyWithMetadata>,
): GraphData {
  const adjacencyMaps = buildAdjacencyMaps(individuals, families);
  const traversalUtils = createTraversalUtils(individuals, adjacencyMaps);
  const walkerData = buildWalkerTreeData(individuals, families, adjacencyMaps);

  return {
    adjacencyMaps,
    traversalUtils,
    walkerData,
  };
}

/**
 * Rebuild graph data for a GedcomDataWithMetadata object
 * Call this after loading serialized data to restore the graph utilities
 */
export function rebuildGraphData(
  data: GedcomDataWithMetadata,
): GedcomDataWithMetadata {
  try {
    // Skip if graph data already exists (shouldn't happen but safety check)
    if (data.graph?.traversalUtils) {
      return data;
    }

    // Validate input data
    if (typeof data.individuals !== 'object') {
      console.warn(
        'rebuildGraphData: Invalid individuals data, skipping graph rebuilding',
      );
      return data;
    }

    if (typeof data.families !== 'object') {
      console.warn(
        'rebuildGraphData: Invalid families data, using empty families',
      );
      data.families = {};
    }

    // Build graph data from the existing individuals and families
    const graphData = buildGraphData(data.individuals, data.families);

    // Return new object with graph data
    return {
      ...data,
      graph: graphData,
    };
  } catch (error) {
    console.error('Error rebuilding graph data:', error);
    // Return original data if rebuilding fails
    return data;
  }
}
