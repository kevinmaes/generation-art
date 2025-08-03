/**
 * Tests for Smart Transformer Utilities
 *
 * Comprehensive tests for all utility functions in smart-transformer-utils.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  extractLLMProperties,
  mergeLLMResponse,
  buildTreeStructureDescription,
  buildConnectionsDescription,
  buildCurrentStateDescription,
  getTemperatureInstructions,
  buildGenericPrompt,
  buildSmartTransformerPrompt,
} from './smart-transformer-utils';
import type {
  SmartTransformerConfig,
  GenericPromptData,
} from '../transformers/smart-transformer-types';
import type { TransformerContext } from '../transformers/types';
import type { LLMReadyData } from '../../../shared/types/llm-data';

// Mock data for testing
const mockVisualMetadata = {
  individuals: {
    'person1': {
      x: 100,
      y: 200,
      rotation: 0,
      color: '#ff0000',
      custom: {
        generation: 1,
        importance: 0.8,
      },
    },
    'person2': {
      x: 300,
      y: 400,
      rotation: 45,
      color: '#00ff00',
      custom: {
        generation: 2,
        importance: 0.6,
      },
    },
  },
  edges: {
    'edge1': {
      color: '#000000',
      custom: {
        controlPoints: [{ x: 150, y: 250 }, { x: 200, y: 300 }],
        strength: 0.7,
      },
    },
    'edge2': {
      color: '#0000ff',
      custom: {
        strength: 0.9,
      },
    },
  },
  families: {},
  tree: {},
  global: {
    canvasWidth: 1000,
    canvasHeight: 800,
    backgroundColor: '#ffffff',
  },
};

const mockLLMData = {
  individuals: {
    'person1': {
      id: 'person1',
      name: 'Person One',
      parents: [],
      children: ['person2'],
      spouses: [],
      siblings: [],
      metadata: {
        generation: 1,
        birthYear: 1950,
      },
    },
    'person2': {
      id: 'person2',
      name: 'Person Two',
      parents: ['person1'],
      children: [],
      spouses: [],
      siblings: [],
      metadata: {
        generation: 2,
        birthYear: 1980,
      },
    },
  },
  families: {},
  metadata: {
    graphStructure: {
      totalIndividuals: 2,
      totalFamilies: 0,
      totalEdges: 1,
      maxGenerations: 2,
      minGenerations: 1,
      generationDistribution: { '1': 1, '2': 1 },
      averageGenerationsPerBranch: 2,
      treeComplexity: 0.5,
      averageFamilySize: 1.5,
      maxDepth: 2,
      averageDepth: 1.5,
      breadthVariance: 0.5,
      symmetryScore: 1,
      isolatedNodes: 0,
      multipleRootNodes: 1,
      cyclicRelationships: 0,
      depthToBreadthRatio: 2,
    },
    temporalPatterns: {
      earliestBirthYear: 1950,
      latestBirthYear: 1980,
      timeSpan: 30,
      generationTimeSpans: {},
      averageGenerationSpan: 30,
      averageLifespan: 0,
      ageAtDeathDistribution: {},
      birthYearDistribution: {},
      deathYearDistribution: {},
      generationLifespanVariation: {},
      generationGapVariance: 0,
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
      migrationPatterns: {},
      averageDistanceBetweenBirthPlaces: 0,
    },
    demographics: {
      genderDistribution: { 
        male: { count: 0, percentage: 0 }, 
        female: { count: 0, percentage: 0 }, 
        unknown: { count: 2, percentage: 100 } 
      },
      averageLifespan: 0,
    },
    relationships: {
      relationshipTypeDistribution: {},
      averageRelationshipDistance: 0,
      relationshipDistanceDistribution: {},
      maxRelationshipDistance: 0,
      centralityDistribution: {},
    },
    edges: [],
    edgeAnalysis: {
      totalEdges: 1,
      edgeTypeDistribution: {},
      averageNodeDegree: 1,
      maxNodeDegree: 1,
      minNodeDegree: 1,
      nodesDegreeDistribution: {},
      averagePathLength: 1,
      graphDensity: 0.5,
      clusteringCoefficient: 0,
      transitivity: 0,
      centrality: {},
    },
    dataQuality: {
      completenessScore: 0.5,
      consistencyScore: 1,
      missingDataPercentage: 0.5,
    },
    summary: {
      totalIndividuals: 2,
      totalFamilies: 0,
      timeSpan: '30 years',
      geographicDiversity: 'Unknown',
      familyComplexity: 'Simple',
      averageLifespan: 0,
      maxGenerations: 2,
    },
  },
} as LLMReadyData;

const mockConfig: SmartTransformerConfig = {
  llmProperties: {
    individuals: {
      properties: ['x', 'y', 'rotation', 'custom.generation'],
      required: ['x', 'y'],
    },
    edges: {
      properties: ['controlPoints'],
    },
    global: {
      properties: ['canvasWidth', 'canvasHeight'],
    },
  },
  responseSchema: z.object({
    individuals: z.record(z.string(), z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      rotation: z.number().optional(),
    })),
  }),
  prompt: {
    taskDescription: 'Test task description',
    outputExample: '{"individuals": {"id1": {"x": 100, "y": 200}}}',
    getSpecificGuidance: (_context) => 'Test guidance',
    getStyleInstructions: (style, _context) => `Style: ${style}`,
  },
};

describe('Smart Transformer Utils', () => {
  describe('extractLLMProperties', () => {
    it('should extract specified individual properties', () => {
      const result = extractLLMProperties(mockVisualMetadata, mockConfig);

      expect(result.individuals).toBeDefined();
      expect(result.individuals['person1']).toEqual({
        x: 100,
        y: 200,
        rotation: 0,
        'custom.generation': 1,
      });
      expect(result.individuals['person2']).toEqual({
        x: 300,
        y: 400,
        rotation: 45,
        'custom.generation': 2,
      });
    });

    it('should extract edge control points', () => {
      const result = extractLLMProperties(mockVisualMetadata, mockConfig);

      expect(result.edges).toBeDefined();
      expect(result.edges['edge1']).toEqual({
        controlPoints: [{ x: 150, y: 250 }, { x: 200, y: 300 }],
      });
      expect(result.edges['edge2']).toBeUndefined(); // No controlPoints
    });

    it('should extract global properties', () => {
      const result = extractLLMProperties(mockVisualMetadata, mockConfig);

      expect(result.global).toBeDefined();
      expect(result.global).toEqual({
        canvasWidth: 1000,
        canvasHeight: 800,
      });
    });

    it('should handle missing properties gracefully', () => {
      const configWithMissingProps: SmartTransformerConfig = {
        ...mockConfig,
        llmProperties: {
          individuals: {
            properties: ['x', 'y', 'nonexistent'],
          },
        },
      };

      const result = extractLLMProperties(mockVisualMetadata, configWithMissingProps);
      expect(result.individuals['person1']).toEqual({
        x: 100,
        y: 200,
      });
    });

    it('should use custom extractor when provided', () => {
      const customConfig: SmartTransformerConfig = {
        ...mockConfig,
        customExtractor: (_metadata) => ({ custom: 'data' }),
      };

      const result = extractLLMProperties(mockVisualMetadata, customConfig);
      expect(result).toEqual({ custom: 'data' });
    });

    it('should handle empty metadata', () => {
      const emptyMetadata = {
        individuals: {},
        edges: {},
        families: {},
        tree: {},
        global: {},
      };

      const result = extractLLMProperties(emptyMetadata, mockConfig);
      expect(result.individuals).toEqual({});
      expect(result.edges).toBeUndefined(); // No edges config properties match, so edges is not included
      expect(result.global).toEqual({});
    });
  });

  describe('mergeLLMResponse', () => {
    const mockLLMResponse = {
      individuals: {
        'person1': { x: 150, y: 250 },
        'person2': { rotation: 90 },
      },
      edges: {
        'edge1': { controlPoints: [{ x: 100, y: 100 }] },
      },
      global: {
        backgroundColor: '#f0f0f0',
      },
    };

    it('should merge individual properties correctly', () => {
      const result = mergeLLMResponse(mockLLMResponse, mockVisualMetadata, mockConfig);

      expect(result.individuals['person1']).toEqual({
        x: 150, // Updated
        y: 250, // Updated
        rotation: 0, // Preserved
        color: '#ff0000', // Preserved
        custom: {
          generation: 1,
          importance: 0.8,
        },
      });

      expect(result.individuals['person2']).toEqual({
        x: 300, // Preserved
        y: 400, // Preserved
        rotation: 90, // Updated
        color: '#00ff00', // Preserved
        custom: {
          generation: 2,
          importance: 0.6,
        },
      });
    });

    it('should merge edge control points correctly', () => {
      const result = mergeLLMResponse(mockLLMResponse, mockVisualMetadata, mockConfig);

      expect(result.edges['edge1']).toEqual({
        color: '#000000', // Preserved
        custom: {
          controlPoints: [{ x: 100, y: 100 }], // Updated
          strength: 0.7, // Preserved
        },
      });
    });

    it('should merge global properties', () => {
      const result = mergeLLMResponse(mockLLMResponse, mockVisualMetadata, mockConfig);

      expect(result.global).toEqual({
        canvasWidth: 1000, // Preserved
        canvasHeight: 800, // Preserved
        backgroundColor: '#f0f0f0', // Updated
      });
    });

    it('should preserve families and tree', () => {
      const result = mergeLLMResponse(mockLLMResponse, mockVisualMetadata, mockConfig);

      expect(result.families).toEqual({});
      expect(result.tree).toEqual({});
    });

    it('should use custom merger when provided', () => {
      const customConfig: SmartTransformerConfig = {
        ...mockConfig,
        customMerger: (_response, original) => ({ ...original, custom: true } as any),
      };

      const result = mergeLLMResponse(mockLLMResponse, mockVisualMetadata, customConfig);
      expect(result).toEqual({ ...mockVisualMetadata, custom: true });
    });

    it('should handle empty LLM response', () => {
      const emptyResponse = {};
      const result = mergeLLMResponse(emptyResponse, mockVisualMetadata, mockConfig);

      expect(result).toEqual(mockVisualMetadata);
    });
  });

  describe('buildTreeStructureDescription', () => {
    it('should build correct tree structure description', () => {
      const result = buildTreeStructureDescription(mockLLMData);

      expect(result).toBe(
        '- Total Individuals: 2\n- Generations: 2\n- Tree Complexity: 0.5\n- Average Family Size: 1.5'
      );
    });

    it('should handle missing metadata gracefully', () => {
      const incompleteData = {
        ...mockLLMData,
        metadata: {
          ...mockLLMData.metadata,
          graphStructure: {
            ...mockLLMData.metadata.graphStructure,
            totalIndividuals: 5,
            maxGenerations: 3,
            treeComplexity: undefined as any,
            averageFamilySize: null as any,
          },
        },
      };

      const result = buildTreeStructureDescription(incompleteData);
      expect(result).toContain('Total Individuals: 5');
      expect(result).toContain('Generations: 3');
    });
  });

  describe('buildConnectionsDescription', () => {
    it('should build connections description with sampling', () => {
      const result = buildConnectionsDescription(mockLLMData, 2);

      expect(result).toContain('person1: Gen 1, 0p, 1c');
      expect(result).toContain('person2: Gen 2, 1p, 0c');
    });

    it('should prioritize root nodes', () => {
      const largeData = {
        individuals: {
          'root1': {
            id: 'root1',
            name: 'Root One',
            parents: [],
            children: ['child1', 'child2'],
            spouses: [],
            siblings: [],
            metadata: { generation: 1 },
          },
          'child1': {
            id: 'child1',
            name: 'Child One',
            parents: ['root1'],
            children: [],
            spouses: [],
            siblings: ['child2'],
            metadata: { generation: 2 },
          },
          'child2': {
            id: 'child2',
            name: 'Child Two',
            parents: ['root1'],
            children: [],
            spouses: [],
            siblings: ['child1'],
            metadata: { generation: 2 },
          },
          'isolated': {
            id: 'isolated',
            name: 'Isolated',
            parents: [],
            children: [],
            spouses: [],
            siblings: [],
            metadata: { generation: 1 },
          },
        },
        families: {},
        metadata: mockLLMData.metadata,
      };

      const result = buildConnectionsDescription(largeData, 2);
      expect(result).toContain('root1'); // Should include root with children
      expect(result).toContain('... (2 more)'); // Should show truncation
    });

    it('should handle missing generation data', () => {
      const dataWithMissingGen = {
        individuals: {
          'person1': {
            id: 'person1',
            name: 'Person',
            parents: [],
            children: [],
            spouses: [],
            siblings: [],
            metadata: {},
          },
        },
        families: {},
        metadata: mockLLMData.metadata,
      };

      const result = buildConnectionsDescription(dataWithMissingGen);
      expect(result).toContain('Gen ?');
    });
  });

  describe('buildCurrentStateDescription', () => {
    it('should describe existing data', () => {
      const extractedData = {
        individuals: { person1: {}, person2: {} },
        edges: { edge1: {} },
        global: { width: 1000 },
      };

      const result = buildCurrentStateDescription(extractedData);
      expect(result).toBe('Existing data (individuals: 2, edges: 1, global: 1)');
    });

    it('should handle no existing data', () => {
      const emptyData = {};
      const result = buildCurrentStateDescription(emptyData);
      expect(result).toBe('No existing data');
    });

    it('should handle partial data', () => {
      const partialData = {
        individuals: { person1: {} },
        edges: {},
      };

      const result = buildCurrentStateDescription(partialData);
      expect(result).toBe('Existing data (individuals: 1, edges: 0)');
    });
  });

  describe('getTemperatureInstructions', () => {
    it('should return strict instructions for low temperature', () => {
      const result = getTemperatureInstructions(0.2);
      expect(result).toContain('strict mathematical rules');
      expect(result).toContain('Temperature 0.2');
    });

    it('should return balanced instructions for medium temperature', () => {
      const result = getTemperatureInstructions(0.5);
      expect(result).toContain('Balance structure with natural variation');
      expect(result).toContain('Temperature 0.5');
    });

    it('should return creative instructions for high temperature', () => {
      const result = getTemperatureInstructions(0.8);
      expect(result).toContain('organic, artistic output');
      expect(result).toContain('Temperature 0.8');
    });
  });

  describe('buildGenericPrompt', () => {
    const mockPromptData: GenericPromptData = {
      taskDescription: 'Test task',
      canvasInfo: '1000x800',
      temperature: 0.5,
      treeStructure: 'Tree structure info',
      connections: 'Connection info',
      currentState: 'Current state info',
      outputFormat: '{"example": "format"}',
      specificGuidance: 'Specific guidance',
      styleInstructions: 'Style instructions',
    };

    it('should build complete prompt with all sections', () => {
      const result = buildGenericPrompt(mockPromptData);

      expect(result).toContain('Test task');
      expect(result).toContain('Canvas: 1000x800');
      expect(result).toContain('Temperature 0.5');
      expect(result).toContain('Tree structure info');
      expect(result).toContain('Connection info');
      expect(result).toContain('Current state info');
      expect(result).toContain('Specific guidance');
      expect(result).toContain('Style instructions');
      expect(result).toContain('Output Requirements:');
      expect(result).toContain('{"example": "format"}');
    });

    it('should build prompt without style instructions', () => {
      const dataWithoutStyle = { ...mockPromptData };
      delete dataWithoutStyle.styleInstructions;

      const result = buildGenericPrompt(dataWithoutStyle);
      expect(result).not.toContain('Style instructions');
      expect(result).toContain('Output Requirements:');
    });
  });

  describe('buildSmartTransformerPrompt', () => {
    const mockContext: TransformerContext = {
      gedcomData: { individuals: {}, metadata: {} } as any,
      llmData: mockLLMData,
      visualMetadata: mockVisualMetadata,
      dimensions: { primary: 'x', secondary: 'y' },
      visual: {
        layoutStyle: 'tree',
        spacing: 'normal',
      },
      temperature: 0.7,
    };

    it('should build complete prompt using config', () => {
      const result = buildSmartTransformerPrompt(mockContext, mockConfig);

      expect(result).toContain('Test task description');
      expect(result).toContain('Canvas: 1000x800');
      expect(result).toContain('Temperature 0.7');
      expect(result).toContain('Total Individuals: 2');
      expect(result).toContain('Test guidance');
      expect(result).toContain('Style: tree');
    });

    it('should handle missing canvas dimensions', () => {
      const contextWithoutCanvas = {
        ...mockContext,
        visualMetadata: {
          ...mockVisualMetadata,
          global: {},
        },
      };

      const result = buildSmartTransformerPrompt(contextWithoutCanvas, mockConfig);
      expect(result).toContain('Canvas: 1000x800'); // Should use defaults
    });

    it('should handle missing layout style', () => {
      const contextWithoutStyle = {
        ...mockContext,
        visual: {},
      };

      const configWithoutStyle = {
        ...mockConfig,
        prompt: {
          ...mockConfig.prompt,
          getStyleInstructions: undefined,
        },
      };

      const result = buildSmartTransformerPrompt(contextWithoutStyle, configWithoutStyle);
      expect(result).not.toContain('Style:');
    });

    it('should use default temperature when not provided', () => {
      const contextWithoutTemp = {
        ...mockContext,
        temperature: undefined,
      };

      const result = buildSmartTransformerPrompt(contextWithoutTemp, mockConfig);
      expect(result).toContain('Temperature 0.5'); // Default
    });
  });
});