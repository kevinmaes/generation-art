import { describe, it, expect } from 'vitest';
import { simpleTreeTransform } from './simple-tree';
import type { TransformerContext } from '../types';

// Mock GEDCOM data for testing a simple tree structure
const mockGedcomData = {
  individuals: {
    // Primary individual (generation 0)
    I0: {
      id: 'I0',
      name: 'Primary Individual',
      gender: 'M' as const,
      parents: ['I1', 'I2'],
      spouses: [],
      children: ['I-1'],
      siblings: [],
      metadata: {
        generation: 0,
        relativeGenerationValue: 0.5,
        lifespan: 70,
        birthYear: 1950,
      },
    },
    // Parents (generation 1)
    I1: {
      id: 'I1',
      name: 'Father',
      gender: 'M' as const,
      parents: ['I3', 'I4'],
      spouses: ['I2'],
      children: ['I0'],
      siblings: [],
      metadata: {
        generation: 1,
        relativeGenerationValue: 0.0,
        lifespan: 80,
        birthYear: 1920,
      },
    },
    I2: {
      id: 'I2',
      name: 'Mother',
      gender: 'F' as const,
      parents: ['I5', 'I6'],
      spouses: ['I1'],
      children: ['I0'],
      siblings: [],
      metadata: {
        generation: 1,
        relativeGenerationValue: 0.0,
        lifespan: 85,
        birthYear: 1922,
      },
    },
    // Grandparents (generation 2)
    I3: {
      id: 'I3',
      name: 'Paternal Grandfather',
      gender: 'M' as const,
      parents: [],
      spouses: ['I4'],
      children: ['I1'],
      siblings: [],
      metadata: {
        generation: 2,
        relativeGenerationValue: -0.5,
        lifespan: 75,
        birthYear: 1890,
      },
    },
    I4: {
      id: 'I4',
      name: 'Paternal Grandmother',
      gender: 'F' as const,
      parents: [],
      spouses: ['I3'],
      children: ['I1'],
      siblings: [],
      metadata: {
        generation: 2,
        relativeGenerationValue: -0.5,
        lifespan: 82,
        birthYear: 1892,
      },
    },
    I5: {
      id: 'I5',
      name: 'Maternal Grandfather',
      gender: 'M' as const,
      parents: [],
      spouses: ['I6'],
      children: ['I2'],
      siblings: [],
      metadata: {
        generation: 2,
        relativeGenerationValue: -0.5,
        lifespan: 78,
        birthYear: 1895,
      },
    },
    I6: {
      id: 'I6',
      name: 'Maternal Grandmother',
      gender: 'F' as const,
      parents: [],
      spouses: ['I5'],
      children: ['I2'],
      siblings: [],
      metadata: {
        generation: 2,
        relativeGenerationValue: -0.5,
        lifespan: 80,
        birthYear: 1898,
      },
    },
    // Child (generation -1, descendant)
    'I-1': {
      id: 'I-1',
      name: 'Child',
      gender: 'F' as const,
      parents: ['I0'],
      spouses: [],
      children: [],
      siblings: [],
      metadata: {
        generation: -1,
        relativeGenerationValue: 1.0,
        lifespan: 45,
        birthYear: 1980,
      },
    },
  },
  families: {
    F1: {
      id: 'F1',
      children: [],
      metadata: {
        numberOfChildren: 1,
      },
      husband: {
        id: 'I1',
        name: 'Father',
        gender: 'M' as const,
        parents: ['I3', 'I4'],
        spouses: ['I2'],
        children: ['I0'],
        siblings: [],
        metadata: {
          generation: 1,
          relativeGenerationValue: 0.0,
          lifespan: 80,
          birthYear: 1920,
        },
      },
      wife: {
        id: 'I2',
        name: 'Mother',
        gender: 'F' as const,
        parents: ['I5', 'I6'],
        spouses: ['I1'],
        children: ['I0'],
        siblings: [],
        metadata: {
          generation: 1,
          relativeGenerationValue: 0.0,
          lifespan: 85,
          birthYear: 1922,
        },
      },
    },
  },
  metadata: {
    graphStructure: {
      totalIndividuals: 8,
      totalFamilies: 1,
      totalEdges: 14,
      maxGenerations: 2,
      minGenerations: -1,
      generationDistribution: { '-1': 1, '0': 1, '1': 2, '2': 4 },
      averageGenerationsPerBranch: 2,
      disconnectedComponents: 1,
      largestComponentSize: 8,
      averageConnectionsPerIndividual: 1.75,
      connectivityDensity: 0.25,
      averageFamilySize: 3,
      largestFamilySize: 3,
      familySizeDistribution: { '3': 1 },
      childlessFamilies: 0,
      largeFamilies: 0,
      treeComplexity: 0.7,
      branchingFactor: 2,
      depthToBreadthRatio: 0.75,
    },
    temporalPatterns: {
      earliestBirthYear: 1890,
      latestBirthYear: 1980,
      timeSpan: 90,
      generationTimeSpans: {},
      averageLifespan: 74,
      lifespanDistribution: {
        '40-60': 0.125,
        '60-80': 0.5,
        '80+': 0.375,
      },
      longestLifespan: 85,
      shortestLifespan: 45,
      lifespanVariance: 12,
      historicalPeriods: [],
      birthYearDistribution: {},
      deathYearDistribution: {},
      marriageYearDistribution: {},
      averageGenerationGap: 28,
      generationGapVariance: 5,
    },
    geographicPatterns: {
      uniqueBirthPlaces: 0,
      uniqueDeathPlaces: 0,
      countriesRepresented: 0,
      statesProvincesRepresented: 0,
      birthPlaceDistribution: {},
      deathPlaceDistribution: {},
      countryDistribution: {},
      stateProvinceDistribution: {},
      countryPercentages: {},
      stateProvincePercentages: {},
      migrationPatterns: [],
      regions: [],
      geographicClusters: [],
      geographicDiversity: 0,
      averageDistanceBetweenBirthPlaces: 0,
    },
    demographics: {
      genderDistribution: {
        male: { count: 4, percentage: 50 },
        female: { count: 4, percentage: 50 },
        unknown: { count: 0, percentage: 0 },
      },
      ageDistribution: {},
      averageAgeAtDeath: 74,
      ageGroupDistribution: {},
      ageVariance: 12,
      averageChildrenPerFamily: 1.5,
      childlessFamilies: 0,
      largeFamilies: 0,
      familySizeVariance: 0.5,
      averageAgeAtMarriage: 25,
      marriageAgeDistribution: {},
      remarriageRate: 0,
      marriageAgeVariance: 5,
      averageChildrenPerWoman: 1,
      fertilityRate: 1,
      childbearingAgeRange: { min: 20, max: 30, average: 25 },
    },
    relationships: {
      relationshipTypeDistribution: { 'parent-child': 14 },
      averageRelationshipDistance: 1.5,
      relationshipDistanceDistribution: { 1: 14 },
      maxRelationshipDistance: 3,
      blendedFamilies: 0,
      stepRelationships: 0,
      adoptionRate: 0,
      multipleMarriages: 0,
      averageAncestorsPerGeneration: 2,
      missingAncestors: 0,
      ancestralCompleteness: 1.0,
      ancestralDepth: 2,
      averageSiblingsPerFamily: 0,
      onlyChildren: 8,
      largeSiblingGroups: 0,
      cousinRelationships: {
        firstCousins: 0,
        secondCousins: 0,
        thirdCousins: 0,
        distantCousins: 0,
      },
      keyConnectors: ['I0'],
      averageCentrality: 0.125,
      centralityDistribution: {},
    },
    summary: {
      totalIndividuals: 8,
      totalFamilies: 1,
      timeSpan: '90 years',
      geographicDiversity: 'unknown',
      familyComplexity: 'simple',
      averageLifespan: 74,
      maxGenerations: 2,
    },
    edges: [
      {
        id: 'E1',
        sourceId: 'I1',
        targetId: 'I0',
        relationshipType: 'parent-child' as const,
        metadata: {
          relationshipStrength: 1.0,
          isDirectRelationship: true,
          familySize: 3,
          sameBirthCountry: true,
          sameDeathCountry: true,
        },
      },
      {
        id: 'E2',
        sourceId: 'I2',
        targetId: 'I0',
        relationshipType: 'parent-child' as const,
        metadata: {
          relationshipStrength: 1.0,
          isDirectRelationship: true,
          familySize: 3,
          sameBirthCountry: true,
          sameDeathCountry: true,
        },
      },
      {
        id: 'E3',
        sourceId: 'I0',
        targetId: 'I-1',
        relationshipType: 'parent-child' as const,
        metadata: {
          relationshipStrength: 1.0,
          isDirectRelationship: true,
          familySize: 2,
          sameBirthCountry: true,
          sameDeathCountry: true,
        },
      },
      {
        id: 'E4',
        sourceId: 'I1',
        targetId: 'I2',
        relationshipType: 'spouse' as const,
        metadata: {
          relationshipStrength: 1.0,
          isDirectRelationship: true,
          familySize: 3,
          sameBirthCountry: true,
          sameDeathCountry: true,
        },
      },
    ],
    edgeAnalysis: {
      totalEdges: 4,
      parentChildEdges: 3,
      spouseEdges: 1,
      siblingEdges: 0,
      averageEdgeWeight: 1,
      edgeWeightDistribution: { '1.0': 4 },
      strongRelationships: 4,
      weakRelationships: 0,
      averageRelationshipDuration: 30,
      relationshipDurationDistribution: { '30': 4 },
      sameCountryRelationships: 4,
      crossCountryRelationships: 0,
      averageDistanceBetweenSpouses: 0,
    },
  },
};

const mockLLMData = {
  individuals: {},
  families: {},
  metadata: mockGedcomData.metadata,
};

const mockVisualMetadata = {
  individuals: {
    I0: {},
    I1: {},
    I2: {},
    I3: {},
    I4: {},
    I5: {},
    I6: {},
    'I-1': {},
  },
  families: {},
  edges: {},
  tree: {},
  global: {
    canvasWidth: 800,
    canvasHeight: 600,
  },
};

describe('Simple Tree Layout Transformer', () => {
  describe('Basic functionality', () => {
    it('should position all individuals with x and y coordinates', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);

      // Should have position metadata for all individuals
      expect(result.visualMetadata.individuals).toBeDefined();
      const individuals = result.visualMetadata.individuals ?? {};

      // All individuals should have positions
      expect(Object.keys(individuals)).toHaveLength(8);

      Object.values(individuals).forEach((individual) => {
        expect(individual).toHaveProperty('x');
        expect(individual).toHaveProperty('y');
        expect(typeof individual.x).toBe('number');
        expect(typeof individual.y).toBe('number');
      });
    });

    it('should position primary individual near bottom center', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      const primaryPos = individuals.I0;
      expect(primaryPos).toBeDefined();

      // Primary should be in lower portion of canvas
      const canvasHeight = 600;
      expect(primaryPos.y).toBeGreaterThan(canvasHeight * 0.6); // Lower 40% of canvas
    });

    it('should arrange generations in ascending order from bottom to top', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      const childY = individuals['I-1'].y; // Generation -1 (descendant)
      const primaryY = individuals.I0.y; // Generation 0 (primary)
      const parentY = individuals.I1.y; // Generation 1 (parent)
      const grandparentY = individuals.I3.y; // Generation 2 (grandparent)

      // Ensure all Y positions are defined
      expect(childY).toBeDefined();
      expect(primaryY).toBeDefined();
      expect(parentY).toBeDefined();
      expect(grandparentY).toBeDefined();

      // Descendants should be below primary
      if (childY !== undefined && primaryY !== undefined) {
        expect(childY).toBeGreaterThan(primaryY);
      }

      // Primary should be below parents
      if (primaryY !== undefined && parentY !== undefined) {
        expect(primaryY).toBeGreaterThan(parentY);
      }

      // Parents should be below grandparents
      if (parentY !== undefined && grandparentY !== undefined) {
        expect(parentY).toBeGreaterThan(grandparentY);
      }
    });

    it('should set proper node visual properties', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      Object.values(individuals).forEach((individual) => {
        // Check node properties - size should be dynamically calculated
        expect(typeof individual.size).toBe('number');
        expect(individual.size).toBeGreaterThan(0);
        expect(individual.width).toBe(1.0);
        expect(individual.height).toBe(1.0);
        expect(individual.shape).toBe('square');
        // Color should be gender-based: blue (#4A90E2) for male, pink (#FF69B4) for female
        expect(['#4A90E2', '#FF69B4', '#9E9E9E']).toContain(individual.color);
        // Stroke color should be either black or a random couple color
        expect(typeof individual.strokeColor).toBe('string');
        expect(individual.strokeWeight).toBe(2);
        expect(individual.opacity).toBe(1);
      });
    });

    it('should create edge visual metadata with proper properties', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const edges = result.visualMetadata.edges ?? {};

      // Should have edges for all relationships in metadata
      expect(Object.keys(edges)).toHaveLength(4);

      // Check that we have both parent-child and spousal edges with different styling
      const parentChildEdges = Object.entries(edges).filter(([edgeId]) => {
        const edge = mockGedcomData.metadata.edges.find((e) => e.id === edgeId);
        return edge?.relationshipType === 'parent-child';
      });
      const spouseEdges = Object.entries(edges).filter(([edgeId]) => {
        const edge = mockGedcomData.metadata.edges.find((e) => e.id === edgeId);
        return edge?.relationshipType === 'spouse';
      });

      expect(parentChildEdges).toHaveLength(3);
      expect(spouseEdges).toHaveLength(1);

      // Check parent-child edges have standard styling
      parentChildEdges.forEach(([, edge]) => {
        expect(edge.strokeColor).toBe('#666');
        expect(edge.strokeWeight).toBe(1);
        expect(edge.strokeStyle).toBe('solid');
        expect(edge.opacity).toBe(0.8);
        expect(edge.curveType).toBe('straight');

        // Should have custom source/target positions
        expect(edge.custom).toBeDefined();
        expect(edge.custom).toHaveProperty('sourceX');
        expect(edge.custom).toHaveProperty('sourceY');
        expect(edge.custom).toHaveProperty('targetX');
        expect(edge.custom).toHaveProperty('targetY');
      });

      // Check spousal edges have thicker styling
      spouseEdges.forEach(([, edge]) => {
        expect(edge.strokeColor).toBe('#333');
        expect(edge.strokeWeight).toBe(4); // Thicker for couples
        expect(edge.strokeStyle).toBe('solid');
        expect(edge.opacity).toBe(0.8);
        expect(edge.curveType).toBe('straight');

        // Should have custom source/target positions
        expect(edge.custom).toBeDefined();
        expect(edge.custom).toHaveProperty('sourceX');
        expect(edge.custom).toHaveProperty('sourceY');
        expect(edge.custom).toHaveProperty('targetX');
        expect(edge.custom).toHaveProperty('targetY');
      });
    });
  });

  describe('Layout algorithm', () => {
    it('should handle single generation correctly', async () => {
      const singleGenData = {
        ...mockGedcomData,
        individuals: {
          I1: {
            id: 'I1',
            name: 'Only Individual',
            gender: 'M' as const,
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              generation: 0,
              relativeGenerationValue: 0.5,
            },
          },
        },
        metadata: {
          ...mockGedcomData.metadata,
          edges: [],
        },
      };

      const context: TransformerContext = {
        gedcomData: singleGenData,
        llmData: { ...mockLLMData, metadata: singleGenData.metadata },
        visualMetadata: {
          ...mockVisualMetadata,
          individuals: { I1: {} },
        },
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      const individual = individuals.I1;
      expect(individual).toBeDefined();
      expect(individual.x).toBeGreaterThan(350); // Should be reasonably centered
      expect(individual.x).toBeLessThan(450);
      expect(typeof individual.y).toBe('number');
    });

    it('should handle multiple individuals in same generation', async () => {
      const sameGenData = {
        ...mockGedcomData,
        individuals: {
          I1: {
            id: 'I1',
            name: 'Individual 1',
            gender: 'M' as const,
            parents: [],
            spouses: [],
            children: [],
            siblings: ['I2', 'I3'],
            metadata: { generation: 0, relativeGenerationValue: 0.33 },
          },
          I2: {
            id: 'I2',
            name: 'Individual 2',
            gender: 'F' as const,
            parents: [],
            spouses: [],
            children: [],
            siblings: ['I1', 'I3'],
            metadata: { generation: 0, relativeGenerationValue: 0.5 },
          },
          I3: {
            id: 'I3',
            name: 'Individual 3',
            gender: 'M' as const,
            parents: [],
            spouses: [],
            children: [],
            siblings: ['I1', 'I2'],
            metadata: { generation: 0, relativeGenerationValue: 0.67 },
          },
        },
        metadata: {
          ...mockGedcomData.metadata,
          edges: [],
        },
      };

      const context: TransformerContext = {
        gedcomData: sameGenData,
        llmData: { ...mockLLMData, metadata: sameGenData.metadata },
        visualMetadata: {
          ...mockVisualMetadata,
          individuals: { I1: {}, I2: {}, I3: {} },
        },
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      // All should be at same Y level
      expect(individuals.I1.y).toBe(individuals.I2.y);
      expect(individuals.I2.y).toBe(individuals.I3.y);

      // Should be spread horizontally
      if (
        individuals.I1.x !== undefined &&
        individuals.I2.x !== undefined &&
        individuals.I3.x !== undefined
      ) {
        expect(individuals.I1.x).toBeLessThan(individuals.I2.x);
        expect(individuals.I2.x).toBeLessThan(individuals.I3.x);
      }
    });

    it('should fit all generations within canvas bounds', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: mockVisualMetadata,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      const canvasWidth = 800;
      const canvasHeight = 600;
      const margin = 60;

      Object.values(individuals).forEach((individual) => {
        // X coordinates should be within canvas bounds
        expect(individual.x).toBeGreaterThanOrEqual(margin);
        expect(individual.x).toBeLessThanOrEqual(canvasWidth - margin);

        // Y coordinates should be within canvas bounds
        expect(individual.y).toBeGreaterThanOrEqual(margin);
        expect(individual.y).toBeLessThanOrEqual(canvasHeight - margin);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty individuals gracefully', async () => {
      const emptyData = {
        ...mockGedcomData,
        individuals: {},
        metadata: {
          ...mockGedcomData.metadata,
          edges: [],
        },
      };

      const context: TransformerContext = {
        gedcomData: emptyData,
        llmData: { ...mockLLMData, metadata: emptyData.metadata },
        visualMetadata: {
          ...mockVisualMetadata,
          individuals: {},
        },
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);

      // Should return empty result without error
      expect(result.visualMetadata).toEqual({});
    });

    it('should handle individuals with undefined generation', async () => {
      const undefinedGenData = {
        ...mockGedcomData,
        individuals: {
          I1: {
            id: 'I1',
            name: 'Individual without generation',
            gender: 'F' as const,
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              // generation is undefined
              relativeGenerationValue: 0.5,
            },
          },
        },
        metadata: {
          ...mockGedcomData.metadata,
          edges: [],
        },
      };

      const context: TransformerContext = {
        gedcomData: undefinedGenData,
        llmData: { ...mockLLMData, metadata: undefinedGenData.metadata },
        visualMetadata: {
          ...mockVisualMetadata,
          individuals: { I1: {} },
        },
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      // Should still position the individual (defaulting generation to 0)
      expect(individuals.I1).toBeDefined();
      expect(typeof individuals.I1.x).toBe('number');
      expect(typeof individuals.I1.y).toBe('number');
    });

    it('should handle missing canvas dimensions', async () => {
      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: {
          ...mockVisualMetadata,
          global: {}, // No canvas dimensions
        },
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      // Should use default dimensions and still position individuals
      expect(Object.keys(individuals)).toHaveLength(8);
      Object.values(individuals).forEach((individual) => {
        expect(typeof individual.x).toBe('number');
        expect(typeof individual.y).toBe('number');
      });
    });
  });

  describe('Data preservation', () => {
    it('should preserve existing visual metadata', async () => {
      const visualMetadataWithExisting = {
        ...mockVisualMetadata,
        individuals: {
          I0: { color: '#FF0000', custom: { existingProperty: 'test' } },
          I1: {},
          I2: {},
          I3: {},
          I4: {},
          I5: {},
          I6: {},
          'I-1': {},
        },
      };

      const context: TransformerContext = {
        gedcomData: mockGedcomData,
        llmData: mockLLMData,
        visualMetadata: visualMetadataWithExisting,
        dimensions: { primary: 'generation' },
        visual: {},
        temperature: 0.0,
      };

      const result = await simpleTreeTransform(context);
      const individuals = result.visualMetadata.individuals ?? {};

      // Should preserve existing custom property
      expect(individuals.I0.custom).toEqual({ existingProperty: 'test' });

      // Should override color based on gender but preserve custom
      expect(individuals.I0.color).toBe('#4A90E2'); // Blue for male I0
    });
  });
});
