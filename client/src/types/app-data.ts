/**
 * App-specific data types that use Maps and Sets for better type safety and performance
 * These are converted from the serialized JSON data after Zod validation
 */

import type { 
  Individual as BaseIndividual,
  Family as BaseFamily,
  AugmentedIndividual as BaseAugmentedIndividual,
  GedcomDataWithMetadata as BaseGedcomDataWithMetadata,
  Edge,
  TreeMetadata,
  IndividualId,
  FamilyId,
  EdgeId,
} from '../../../shared/types';

/**
 * App Individual - uses Sets for relationship arrays for O(1) lookups
 */
export interface AppIndividual extends Omit<BaseIndividual, 'parents' | 'spouses' | 'children' | 'siblings'> {
  parents: Set<IndividualId>;
  spouses: Set<IndividualId>;
  children: Set<IndividualId>;
  siblings: Set<IndividualId>;
}

/**
 * App AugmentedIndividual - includes metadata and uses Sets
 */
export interface AppAugmentedIndividual extends Omit<BaseAugmentedIndividual, 'parents' | 'spouses' | 'children' | 'siblings'> {
  parents: Set<IndividualId>;
  spouses: Set<IndividualId>;
  children: Set<IndividualId>;
  siblings: Set<IndividualId>;
}

/**
 * App Family - references individuals directly for easier access
 */
export interface AppFamily extends Omit<BaseFamily, 'children'> {
  children: AppIndividual[];
}

/**
 * App GEDCOM data structure using Maps for O(1) lookups by ID
 */
export interface AppGedcomDataWithMetadata {
  individuals: Map<IndividualId, AppAugmentedIndividual>;
  families: Map<FamilyId, AppFamily>;
  edges: Map<EdgeId, Edge>;
  metadata: TreeMetadata;
}

/**
 * Convert serialized Individual to App Individual with Sets
 */
export function convertToAppIndividual(individual: BaseIndividual): AppIndividual {
  return {
    ...individual,
    parents: new Set(individual.parents),
    spouses: new Set(individual.spouses),
    children: new Set(individual.children),
    siblings: new Set(individual.siblings),
  };
}

/**
 * Convert serialized AugmentedIndividual to App AugmentedIndividual with Sets
 */
export function convertToAppAugmentedIndividual(individual: BaseAugmentedIndividual): AppAugmentedIndividual {
  return {
    ...individual,
    parents: new Set(individual.parents),
    spouses: new Set(individual.spouses),
    children: new Set(individual.children),
    siblings: new Set(individual.siblings),
  };
}

/**
 * Convert serialized GedcomDataWithMetadata to App version using Maps and Sets
 */
export function convertToAppGedcomData(data: BaseGedcomDataWithMetadata): AppGedcomDataWithMetadata {
  // Convert individuals to Map with Sets for relationships
  const individualsMap = new Map<IndividualId, AppAugmentedIndividual>();
  Object.entries(data.individuals).forEach(([id, individual]) => {
    individualsMap.set(id as IndividualId, convertToAppAugmentedIndividual(individual));
  });

  // Convert families to Map
  const familiesMap = new Map<FamilyId, AppFamily>();
  Object.entries(data.families).forEach(([id, family]) => {
    // Convert family children to reference actual individual objects
    const children = family.children.map(child => {
      const appIndividual = individualsMap.get(child.id);
      if (!appIndividual) {
        throw new Error(`Family ${id} references unknown child ${child.id}`);
      }
      return appIndividual;
    });

    familiesMap.set(id as FamilyId, {
      ...family,
      children,
    });
  });

  // Convert edges to Map
  const edgesMap = new Map<EdgeId, Edge>();
  data.metadata.edges.forEach(edge => {
    edgesMap.set(edge.id, edge);
  });

  return {
    individuals: individualsMap,
    families: familiesMap,
    edges: edgesMap,
    metadata: data.metadata,
  };
}

/**
 * Helper functions for common operations with the App data structure
 */
export class AppGedcomHelpers {
  constructor(private data: AppGedcomDataWithMetadata) {}

  /**
   * Get individual by ID with guaranteed existence check
   */
  getIndividual(id: IndividualId): AppAugmentedIndividual {
    const individual = this.data.individuals.get(id);
    if (!individual) {
      throw new Error(`Individual ${id} not found`);
    }
    return individual;
  }

  /**
   * Check if individual has relationship with another
   */
  hasRelationship(id1: IndividualId, id2: IndividualId): boolean {
    const individual = this.data.individuals.get(id1);
    if (!individual) return false;

    return individual.parents.has(id2) ||
           individual.spouses.has(id2) ||
           individual.children.has(id2) ||
           individual.siblings.has(id2);
  }

  /**
   * Get all descendants of an individual
   */
  getDescendants(id: IndividualId): Set<IndividualId> {
    const descendants = new Set<IndividualId>();
    const visited = new Set<IndividualId>();
    
    const collectDescendants = (currentId: IndividualId) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const individual = this.data.individuals.get(currentId);
      if (!individual) return;

      individual.children.forEach(childId => {
        descendants.add(childId);
        collectDescendants(childId);
      });
    };

    collectDescendants(id);
    return descendants;
  }

  /**
   * Get all ancestors of an individual
   */
  getAncestors(id: IndividualId): Set<IndividualId> {
    const ancestors = new Set<IndividualId>();
    const visited = new Set<IndividualId>();
    
    const collectAncestors = (currentId: IndividualId) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const individual = this.data.individuals.get(currentId);
      if (!individual) return;

      individual.parents.forEach(parentId => {
        ancestors.add(parentId);
        collectAncestors(parentId);
      });
    };

    collectAncestors(id);
    return ancestors;
  }
}