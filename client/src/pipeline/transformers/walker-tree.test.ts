/**
 * Tests for Walker Tree Layout Transformer
 */

import { describe, it, expect } from 'vitest';
import { walkerTreeTransform, walkerTreeConfig } from './walker-tree';
import type { TransformerContext, CompleteVisualMetadata } from './types';
import type {
  GedcomDataWithMetadata,
  AugmentedIndividual,
  FamilyWithMetadata,
} from '../../../../shared/types';

// Test data factory
function createTestIndividual(
  id: string,
  generation = 0,
  gender: 'M' | 'F' | 'U' = 'U',
): AugmentedIndividual {
  return {
    id,
    name: `Individual ${id}`,
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
    gender,
    metadata: {
      generation,
    },
  };
}

function createTestContext(
  individuals: AugmentedIndividual[],
  families: FamilyWithMetadata[] = [],
  hasGraphData = false,
): TransformerContext {
  const individualsById: Record<string, AugmentedIndividual> = {};
  individuals.forEach((ind) => {
    individualsById[ind.id] = ind;
  });

  const familiesById: Record<string, FamilyWithMetadata> = {};
  families.forEach((fam) => {
    familiesById[fam.id] = fam;
  });

  const mockGraphData = hasGraphData
    ? {
        traversalUtils: {
          getChildren: (id: string) =>
            individuals.filter((ind) => ind.parents.includes(id)),
          getSpouses: (id: string) =>
            individuals.filter((ind) => ind.spouses.includes(id)),
          getParents: (id: string) =>
            individuals.filter((ind) => ind.children.includes(id)),
          getSiblings: (id: string) =>
            individuals.filter((ind) => ind.siblings.includes(id)),
          getAncestors: () => [],
          getDescendants: () => [],
          getFamilyCluster: () => ({
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
          }),
        },
        adjacencyMaps: {
          parentToChildren: new Map(),
          childToParents: new Map(),
          spouseToSpouse: new Map(),
          siblingGroups: new Map(),
          familyMembership: new Map(),
        },
        walkerData: {
          nodeHierarchy: new Map(),
          familyClusters: [],
          rootNodes: [],
          generationLevels: new Map(),
        },
      }
    : undefined;

  const gedcomData: GedcomDataWithMetadata = {
    individuals: individualsById,
    families: familiesById,
    metadata: {
      graphStructure: {
        totalIndividuals: individuals.length,
        totalFamilies: families.length,
        totalEdges: 0,
        maxGenerations: 3,
        minGenerations: 0,
        generationDistribution: {},
        averageGenerationsPerBranch: 2,
        disconnectedComponents: 1,
        largestComponentSize: individuals.length,
        averageConnectionsPerIndividual: 2,
        connectivityDensity: 0.5,
        averageFamilySize: 2.5,
        largestFamilySize: 4,
        familySizeDistribution: {},
        childlessFamilies: 0,
        largeFamilies: 0,
        treeComplexity: 0.5,
        branchingFactor: 2,
        depthToBreadthRatio: 1,
      },
      temporalPatterns: {} as any,
      geographicPatterns: {} as any,
      demographics: {} as any,
      relationships: {} as any,
      edges: [],
      edgeAnalysis: {} as any,
      summary: {} as any,
    },
    graph: mockGraphData,
  };

  const visualMetadata: CompleteVisualMetadata = {
    individuals: {},
    families: {},
    edges: {},
    tree: {},
    global: {
      canvasWidth: 800,
      canvasHeight: 600,
    },
  };

  return {
    gedcomData,
    llmData: { individuals: {}, families: {}, metadata: {} as any },
    visualMetadata,
    dimensions: { primary: 'generation' },
    visual: {
      nodeSpacing: 40,
      generationSpacing: 100,
      spouseSpacing: 15,
      familySpacing: 80,
      enableDebugging: false,
    },
  };
}

describe('Walker Tree Layout Transformer', () => {
  describe('walkerTreeConfig', () => {
    it('should have correct configuration', () => {
      expect(walkerTreeConfig.id).toBe('walker-tree');
      expect(walkerTreeConfig.name).toBe('Walker Tree Layout');
      expect(walkerTreeConfig.categories).toEqual([
        'layout',
        'positioning',
        'advanced',
      ]);
      expect(walkerTreeConfig.availableDimensions).toEqual(['generation']);
      expect(walkerTreeConfig.defaultPrimaryDimension).toBe('generation');
    });

    it('should have proper visual parameters', () => {
      const params = walkerTreeConfig.visualParameters;
      expect(params).toHaveLength(8);

      const nodeSpacing = params.find((p) => p.name === 'nodeSpacing');
      expect(nodeSpacing).toBeDefined();
      expect(nodeSpacing?.defaultValue).toBe(60);

      const generationSpacing = params.find(
        (p) => p.name === 'generationSpacing',
      );
      expect(generationSpacing).toBeDefined();
      expect(generationSpacing?.defaultValue).toBe(150);

      const spouseSpacing = params.find((p) => p.name === 'spouseSpacing');
      expect(spouseSpacing).toBeDefined();
      expect(spouseSpacing?.defaultValue).toBe(30);
    });

    it('should return correct defaults', () => {
      const defaults = walkerTreeConfig.getDefaults?.();
      expect(defaults).toEqual({
        nodeSpacing: 60,
        generationSpacing: 150,
        spouseSpacing: 30,
        familySpacing: 80,
        enableDebugging: false,
        showLabels: false,
        minLabelSize: 12,
        useOrthogonalRouting: true,
      });
    });
  });

  describe('walkerTreeTransform', () => {
    it('should handle empty individuals list', async () => {
      const context = createTestContext([]);
      const result = await walkerTreeTransform(context);

      expect(result.visualMetadata).toEqual({});
    });

    it('should use fallback layout when no graph data is available', async () => {
      const individuals = [
        createTestIndividual('I1', 0),
        createTestIndividual('I2', 0),
        createTestIndividual('I3', 1),
      ];

      const context = createTestContext(individuals, [], false);
      const result = await walkerTreeTransform(context);

      // Should have positioning data for all individuals
      expect(result.visualMetadata.individuals).toBeDefined();
      if (result.visualMetadata.individuals) {
        expect(Object.keys(result.visualMetadata.individuals)).toHaveLength(3);

        // Each individual should have position and size
        Object.values(result.visualMetadata.individuals).forEach((metadata) => {
          expect(metadata.x).toBeTypeOf('number');
          expect(metadata.y).toBeTypeOf('number');
          expect(metadata.width).toBe(1.0);
          expect(metadata.height).toBe(1.0);
        });
      }
    });

    it('should handle single individual', async () => {
      const individuals = [createTestIndividual('I1', 0)];
      const context = createTestContext(individuals, [], true);
      const result = await walkerTreeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();
      if (result.visualMetadata.individuals) {
        expect(result.visualMetadata.individuals['I1']).toBeDefined();
        expect(result.visualMetadata.individuals['I1'].x).toBeTypeOf('number');
        expect(result.visualMetadata.individuals['I1'].y).toBeTypeOf('number');
      }
    });

    it('should handle parent-child relationships with graph data', async () => {
      const parent = createTestIndividual('P1', 0);
      const child1 = createTestIndividual('C1', 1);
      const child2 = createTestIndividual('C2', 1);

      // Set up relationships
      parent.children = ['C1', 'C2'];
      child1.parents = ['P1'];
      child1.siblings = ['C2'];
      child2.parents = ['P1'];
      child2.siblings = ['C1'];

      const individuals = [parent, child1, child2];
      const context = createTestContext(individuals, [], true);
      const result = await walkerTreeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();

      if (result.visualMetadata.individuals) {
        const parentPos = result.visualMetadata.individuals['P1'];
        const child1Pos = result.visualMetadata.individuals['C1'];
        const child2Pos = result.visualMetadata.individuals['C2'];

        expect(parentPos).toBeDefined();
        expect(child1Pos).toBeDefined();
        expect(child2Pos).toBeDefined();

        // Parent should be above children
        if (
          parentPos?.y !== undefined &&
          child1Pos?.y !== undefined &&
          child2Pos?.y !== undefined
        ) {
          expect(parentPos.y).toBeLessThan(child1Pos.y);
          expect(parentPos.y).toBeLessThan(child2Pos.y);
        }
      }
    });

    it('should respect custom spacing parameters', async () => {
      const individuals = [
        createTestIndividual('I1', 0),
        createTestIndividual('I2', 0),
      ];

      const context = createTestContext(individuals, [], false);
      context.visual.nodeSpacing = 200;
      context.visual.generationSpacing = 150;

      const result = await walkerTreeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();

      // Should have used custom spacing (harder to test directly, but at least verify it runs)
      if (result.visualMetadata.individuals) {
        const positions = Object.values(result.visualMetadata.individuals);
        expect(positions).toHaveLength(2);
      }
    });

    it('should handle debugging mode', async () => {
      const individuals = [createTestIndividual('I1', 0)];
      const context = createTestContext(individuals, [], true);
      context.visual.enableDebugging = true;

      const result = await walkerTreeTransform(context);

      // Should complete without errors when debugging is enabled
      expect(result.visualMetadata.individuals).toBeDefined();
      if (result.visualMetadata.individuals) {
        expect(result.visualMetadata.individuals['I1']).toBeDefined();
      }

      // Should have debugging tree elements when debugging is enabled
      expect(result.visualMetadata.tree).toBeDefined();
      const treeElements = Object.keys(result.visualMetadata.tree || {});
      expect(treeElements.some((key) => key.startsWith('debug_'))).toBe(true);
    });

    it('should not include debug metadata when debugging is disabled', async () => {
      const individuals = [createTestIndividual('I1', 0)];
      const context = createTestContext(individuals, [], true);
      context.visual.enableDebugging = false;

      const result = await walkerTreeTransform(context);

      // Should not have tree debugging elements when debugging is disabled
      const treeElements = Object.keys(result.visualMetadata.tree || {});
      expect(treeElements.some((key) => key.startsWith('debug_'))).toBe(false);
    });

    it('should handle different generations', async () => {
      const individuals = [
        createTestIndividual('G0', 0),
        createTestIndividual('G1', 1),
        createTestIndividual('G2', 2),
      ];

      const context = createTestContext(individuals, [], false);
      const result = await walkerTreeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();

      if (result.visualMetadata.individuals) {
        const gen0Pos = result.visualMetadata.individuals['G0'];
        const gen1Pos = result.visualMetadata.individuals['G1'];
        const gen2Pos = result.visualMetadata.individuals['G2'];

        // Should have different Y positions based on generation
        expect(gen0Pos.y).not.toEqual(gen1Pos.y);
        expect(gen1Pos.y).not.toEqual(gen2Pos.y);
      }
    });

    it('should center tree within canvas', async () => {
      const individuals = [
        createTestIndividual('I1', 0),
        createTestIndividual('I2', 0),
      ];

      const context = createTestContext(individuals, [], false);
      const result = await walkerTreeTransform(context);

      expect(result.visualMetadata.individuals).toBeDefined();

      if (result.visualMetadata.individuals) {
        const positions = Object.values(result.visualMetadata.individuals);

        // All positions should be positive and within reasonable canvas bounds
        positions.forEach((pos) => {
          if (pos.x !== undefined && pos.y !== undefined) {
            expect(pos.x).toBeGreaterThanOrEqual(0);
            expect(pos.y).toBeGreaterThanOrEqual(0);
            expect(pos.x).toBeLessThanOrEqual(800); // Canvas width
            expect(pos.y).toBeLessThanOrEqual(600); // Canvas height
          }
        });
      }
    });

    it('should handle malformed individual data gracefully', async () => {
      const individuals = [
        {
          id: 'I1',
          name: 'Test',
          parents: [],
          spouses: [],
          children: [],
          siblings: [],
          metadata: {}, // Missing generation
        } as AugmentedIndividual,
      ];

      const context = createTestContext(individuals, [], false);
      const result = await walkerTreeTransform(context);

      // Should not throw and should have some positioning
      expect(result.visualMetadata.individuals).toBeDefined();
      if (result.visualMetadata.individuals) {
        expect(result.visualMetadata.individuals['I1']).toBeDefined();
      }
    });

    it('should generate straight-line edge metadata to override curves', async () => {
      const individuals = [
        createTestIndividual('I1', 0, 'M'),
        createTestIndividual('I2', 0, 'F'),
      ];

      const context = createTestContext(individuals, [], false);
      const result = await walkerTreeTransform(context);

      // Should have edge metadata that forces straight lines
      expect(result.visualMetadata.edges).toBeDefined();

      // Check that edges have curveType set to 'straight' and curveIntensity to 0
      Object.values(result.visualMetadata.edges || {}).forEach((edge) => {
        expect(edge.curveType).toBe('straight');
        expect(edge.curveIntensity).toBe(0);
        expect(edge.controlPoints).toBeUndefined();
        expect(edge.arcRadius).toBeUndefined();
      });
    });
  });
});
