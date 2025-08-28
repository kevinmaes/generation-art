import { describe, it, expect } from 'vitest';
import {
  transformerConfigs,
  getTransformer,
  getAllTransformers,
  getTransformersByCategory,
  getAllCategories,
  type TransformerId,
} from './transformers';
import type { GedcomDataWithMetadata } from '../../../shared/types';
import type { VisualParameterValues } from './visual-parameters';
import { initialEntityVisualMetadata } from './pipeline';
import { DEFAULT_TEST_CANVAS } from './test-utils';

describe('Transformers Registry', () => {
  it('should export transformerConfigs object', () => {
    expect(transformerConfigs).toBeDefined();
    expect(typeof transformerConfigs).toBe('object');
  });

  it('should have horizontal spread transformer', () => {
    const transformer = transformerConfigs['horizontal-spread'];
    expect(transformer).toBeDefined();
    expect(transformer.id).toBe('horizontal-spread');
    expect(transformer.name).toBe('Horizontal Spread');
    expect(typeof transformer.transform).toBe('function');
  });

  it('should get transformer by ID', () => {
    const transformer = getTransformer('horizontal-spread');
    expect(transformer).toBeDefined();
    expect(transformer.id).toBe('horizontal-spread');
  });

  it('should return undefined for non-existent transformer', () => {
    const transformer = getTransformer('non-existent' as TransformerId);
    expect(transformer).toBeUndefined();
  });

  it('should get all transformers', () => {
    const allTransformers = getAllTransformers();
    expect(Array.isArray(allTransformers)).toBe(true);
    expect(allTransformers.length).toBeGreaterThan(0);
    expect(allTransformers[0]).toHaveProperty('id');
    expect(allTransformers[0]).toHaveProperty('name');
    expect(allTransformers[0]).toHaveProperty('transform');
  });

  it('should get transformers by category', () => {
    const layoutTransformers = getTransformersByCategory('layout');
    expect(Array.isArray(layoutTransformers)).toBe(true);
    expect(layoutTransformers.length).toBeGreaterThan(0);
    expect(layoutTransformers[0].categories).toContain('layout');
  });

  it('should get all categories', () => {
    const categories = getAllCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain('layout');
    expect(categories).toContain('positioning');
  });

  it('should have valid transformer configurations', () => {
    const allTransformers = getAllTransformers();

    for (const transformer of allTransformers) {
      expect(transformer.id).toBeTruthy();
      expect(transformer.name).toBeTruthy();
      expect(transformer.description).toBeTruthy();
      expect(typeof transformer.transform).toBe('function');

      // Check that transformers have the new structure
      expect(transformer.availableDimensions).toBeDefined();
      expect(transformer.defaultPrimaryDimension).toBeDefined();
      expect(transformer.visualParameters).toBeDefined();
      expect(transformer.createTransformerInstance).toBeDefined();
    }
  });
});

describe('Horizontal Spread Transformer', () => {
  it('should transform context with individuals', async () => {
    const transformer = getTransformer('horizontal-spread');
    expect(transformer).toBeDefined();

    const mockMetadata: GedcomDataWithMetadata = {
      individuals: {
        I1: {
          id: 'I1',
          name: 'John Doe',
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
      families: {},
      metadata: {
        graphStructure: {
          totalIndividuals: 1,
          totalFamilies: 0,
          totalEdges: 0,
          maxGenerations: 0,
          minGenerations: 0,
          generationDistribution: {},
          averageGenerationsPerBranch: 0,
          disconnectedComponents: 1,
          largestComponentSize: 1,
          averageConnectionsPerIndividual: 0,
          connectivityDensity: 0,
          averageFamilySize: 0,
          largestFamilySize: 0,
          familySizeDistribution: {},
          childlessFamilies: 0,
          largeFamilies: 0,
          treeComplexity: 0,
          branchingFactor: 0,
          depthToBreadthRatio: 0,
        },
        temporalPatterns: {
          earliestBirthYear: 0,
          latestBirthYear: 0,
          timeSpan: 0,
          generationTimeSpans: {},
          averageLifespan: 0,
          lifespanDistribution: {},
          longestLifespan: 0,
          shortestLifespan: 0,
          lifespanVariance: 0,
          historicalPeriods: [],
          birthYearDistribution: {},
          deathYearDistribution: {},
          marriageYearDistribution: {},
          averageGenerationGap: 0,
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
            male: { count: 0, percentage: 0 },
            female: { count: 0, percentage: 0 },
            unknown: { count: 0, percentage: 0 },
          },
          ageDistribution: {},
          averageAgeAtDeath: 0,
          ageGroupDistribution: {},
          ageVariance: 0,
          averageChildrenPerFamily: 0,
          childlessFamilies: 0,
          largeFamilies: 0,
          familySizeVariance: 0,
          averageAgeAtMarriage: 0,
          marriageAgeDistribution: {},
          remarriageRate: 0,
          marriageAgeVariance: 0,
          averageChildrenPerWoman: 0,
          fertilityRate: 0,
          childbearingAgeRange: { min: 0, max: 0, average: 0 },
        },
        relationships: {
          relationshipTypeDistribution: {},
          averageRelationshipDistance: 0,
          relationshipDistanceDistribution: {},
          maxRelationshipDistance: 0,
          blendedFamilies: 0,
          stepRelationships: 0,
          adoptionRate: 0,
          multipleMarriages: 0,
          averageAncestorsPerGeneration: 0,
          missingAncestors: 0,
          ancestralCompleteness: 0,
          ancestralDepth: 0,
          averageSiblingsPerFamily: 0,
          onlyChildren: 0,
          largeSiblingGroups: 0,
          cousinRelationships: {
            firstCousins: 0,
            secondCousins: 0,
            thirdCousins: 0,
            distantCousins: 0,
          },
          keyConnectors: [],
          averageCentrality: 0,
          centralityDistribution: {},
        },
        edges: [],
        edgeAnalysis: {
          totalEdges: 0,
          parentChildEdges: 0,
          spouseEdges: 0,
          siblingEdges: 0,
          averageEdgeWeight: 0,
          edgeWeightDistribution: {},
          strongRelationships: 0,
          weakRelationships: 0,
          averageRelationshipDuration: 0,
          relationshipDurationDistribution: {},
          sameCountryRelationships: 0,
          crossCountryRelationships: 0,
          averageDistanceBetweenSpouses: 0,
        },
        summary: {
          totalIndividuals: 1,
          totalFamilies: 0,
          timeSpan: 'Unknown',
          geographicDiversity: 'Unknown',
          familyComplexity: 'Unknown',
          averageLifespan: 0,
          maxGenerations: 0,
        },
      },
    };

    const context = {
      gedcomData: mockMetadata,
      llmData: {
        individuals: {},
        families: {},
        metadata: mockMetadata.metadata,
      },
      canvas: DEFAULT_TEST_CANVAS,
      visualMetadata: {
        individuals: {
          I1: {
            x: 0,
            y: 250, // Set an initial y position to test preservation
            size: 20,
            scale: 1,
            color: initialEntityVisualMetadata.color,
            backgroundColor: initialEntityVisualMetadata.backgroundColor,
            strokeColor: initialEntityVisualMetadata.strokeColor,
            opacity: initialEntityVisualMetadata.opacity,
            alpha: initialEntityVisualMetadata.alpha,
            shape: initialEntityVisualMetadata.shape,
            strokeWeight: 1,
            strokeStyle: 'solid' as const,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            rotation: 0,
            rotationSpeed: 0,
            group: 'default',
            layer: 0,
            priority: 0,
            custom: {},
          },
        },
        families: {},
        edges: {},
        tree: {},
        global: {
          canvasWidth: 1000,
          canvasHeight: 800,
          defaultNodeSize: 20,
          defaultNodeColor: '#4CAF50',
          defaultNodeShape: 'circle' as const,
        },
      },
      dimensions: { primary: 'generation' },
      visual: {
        primaryColor: '#4CAF50',
      } as VisualParameterValues,
    };

    const runtimeTransformer = transformer.createTransformerInstance({
      dimensions: { primary: 'generation' },
      visual: {
        primaryColor: '#4CAF50',
      },
    });
    const result = await runtimeTransformer(context);

    expect(result.visualMetadata).toBeDefined();
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
      1,
    );
    const individualId = Object.keys(
      result.visualMetadata.individuals ?? {},
    )[0];
    const individualMetadata =
      result.visualMetadata.individuals?.[individualId];
    expect(individualMetadata?.x).toBeDefined();
    // y position should be preserved from the initial context
    expect(individualMetadata?.y).toBe(250);
    // Horizontal spread should only set x position, not size, color, or shape
    expect(individualMetadata?.size).toBe(20); // Should preserve initial size
    expect(individualMetadata?.color).toBe(initialEntityVisualMetadata.color); // Should preserve initial color
    expect(individualMetadata?.shape).toBe(initialEntityVisualMetadata.shape); // Should preserve initial shape
  });

  it('should handle empty individuals array', async () => {
    const transformer = getTransformer('horizontal-spread');
    expect(transformer).toBeDefined();

    const mockMetadata: GedcomDataWithMetadata = {
      individuals: {},
      families: {},
      metadata: {
        graphStructure: {
          totalIndividuals: 0,
          totalFamilies: 0,
          totalEdges: 0,
          maxGenerations: 0,
          minGenerations: 0,
          generationDistribution: {},
          averageGenerationsPerBranch: 0,
          disconnectedComponents: 0,
          largestComponentSize: 0,
          averageConnectionsPerIndividual: 0,
          connectivityDensity: 0,
          averageFamilySize: 0,
          largestFamilySize: 0,
          familySizeDistribution: {},
          childlessFamilies: 0,
          largeFamilies: 0,
          treeComplexity: 0,
          branchingFactor: 0,
          depthToBreadthRatio: 0,
        },
        temporalPatterns: {
          earliestBirthYear: 0,
          latestBirthYear: 0,
          timeSpan: 0,
          generationTimeSpans: {},
          averageLifespan: 0,
          lifespanDistribution: {},
          longestLifespan: 0,
          shortestLifespan: 0,
          lifespanVariance: 0,
          historicalPeriods: [],
          birthYearDistribution: {},
          deathYearDistribution: {},
          marriageYearDistribution: {},
          averageGenerationGap: 0,
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
            male: { count: 0, percentage: 0 },
            female: { count: 0, percentage: 0 },
            unknown: { count: 0, percentage: 0 },
          },
          ageDistribution: {},
          averageAgeAtDeath: 0,
          ageGroupDistribution: {},
          ageVariance: 0,
          averageChildrenPerFamily: 0,
          childlessFamilies: 0,
          largeFamilies: 0,
          familySizeVariance: 0,
          averageAgeAtMarriage: 0,
          marriageAgeDistribution: {},
          remarriageRate: 0,
          marriageAgeVariance: 0,
          averageChildrenPerWoman: 0,
          fertilityRate: 0,
          childbearingAgeRange: { min: 0, max: 0, average: 0 },
        },
        relationships: {
          relationshipTypeDistribution: {},
          averageRelationshipDistance: 0,
          relationshipDistanceDistribution: {},
          maxRelationshipDistance: 0,
          blendedFamilies: 0,
          stepRelationships: 0,
          adoptionRate: 0,
          multipleMarriages: 0,
          averageAncestorsPerGeneration: 0,
          missingAncestors: 0,
          ancestralCompleteness: 0,
          ancestralDepth: 0,
          averageSiblingsPerFamily: 0,
          onlyChildren: 0,
          largeSiblingGroups: 0,
          cousinRelationships: {
            firstCousins: 0,
            secondCousins: 0,
            thirdCousins: 0,
            distantCousins: 0,
          },
          keyConnectors: [],
          averageCentrality: 0,
          centralityDistribution: {},
        },
        edges: [],
        edgeAnalysis: {
          totalEdges: 0,
          parentChildEdges: 0,
          spouseEdges: 0,
          siblingEdges: 0,
          averageEdgeWeight: 0,
          edgeWeightDistribution: {},
          strongRelationships: 0,
          weakRelationships: 0,
          averageRelationshipDuration: 0,
          relationshipDurationDistribution: {},
          sameCountryRelationships: 0,
          crossCountryRelationships: 0,
          averageDistanceBetweenSpouses: 0,
        },
        summary: {
          totalIndividuals: 0,
          totalFamilies: 0,
          timeSpan: 'Unknown',
          geographicDiversity: 'Unknown',
          familyComplexity: 'Unknown',
          averageLifespan: 0,
          maxGenerations: 0,
        },
      },
    };

    const context = {
      gedcomData: mockMetadata,
      llmData: {
        individuals: {},
        families: {},
        metadata: mockMetadata.metadata,
      },
      canvas: DEFAULT_TEST_CANVAS,
      visualMetadata: {
        individuals: {},
        families: {},
        edges: {},
        tree: {},
        global: {},
      },
      dimensions: { primary: 'generation' },
      visual: {} as VisualParameterValues,
    };

    const runtimeTransformer = transformer.createTransformerInstance({
      dimensions: { primary: 'generation' },
      visual: {},
    });
    const result = await runtimeTransformer(context);

    expect(result.visualMetadata).toEqual({});
  });

  describe('Vertical Spread Transformer', () => {
    it('should transform context with individuals and preserve x position', async () => {
      const transformer = getTransformer('vertical-spread');
      expect(transformer).toBeDefined();

      const mockMetadata: GedcomDataWithMetadata = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'John Smith',
            parents: [],
            spouses: [],
            children: [],
            siblings: [],
            metadata: {
              generation: 1,
              relativeGenerationValue: 0.5,
            },
            gender: 'M',
          },
        },
        families: {},
        metadata: {
          graphStructure: {
            totalIndividuals: 1,
            totalFamilies: 0,
            totalEdges: 0,
            maxGenerations: 1,
            minGenerations: 1,
            generationDistribution: { '1': 1 },
            averageGenerationsPerBranch: 1,
            disconnectedComponents: 1,
            largestComponentSize: 1,
            averageConnectionsPerIndividual: 0,
            connectivityDensity: 0,
            averageFamilySize: 0,
            largestFamilySize: 0,
            familySizeDistribution: {},
            childlessFamilies: 0,
            largeFamilies: 0,
            treeComplexity: 0,
            branchingFactor: 0,
            depthToBreadthRatio: 0,
          },
          temporalPatterns: {
            earliestBirthYear: 0,
            latestBirthYear: 0,
            timeSpan: 0,
            generationTimeSpans: {
              '1': { earliest: 0, latest: 0, span: 0, averageBirthYear: 0 },
            },
            averageLifespan: 0,
            lifespanDistribution: {},
            longestLifespan: 0,
            shortestLifespan: 0,
            lifespanVariance: 0,
            historicalPeriods: [],
            birthYearDistribution: {},
            deathYearDistribution: {},
            marriageYearDistribution: {},
            averageGenerationGap: 0,
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
              male: { count: 0, percentage: 0 },
              female: { count: 0, percentage: 0 },
              unknown: { count: 0, percentage: 0 },
            },
            ageDistribution: {},
            averageAgeAtDeath: 0,
            ageGroupDistribution: {},
            ageVariance: 0,
            averageChildrenPerFamily: 0,
            childlessFamilies: 0,
            largeFamilies: 0,
            familySizeVariance: 0,
            averageAgeAtMarriage: 0,
            marriageAgeDistribution: {},
            remarriageRate: 0,
            marriageAgeVariance: 0,
            averageChildrenPerWoman: 0,
            fertilityRate: 0,
            childbearingAgeRange: { min: 0, max: 0, average: 0 },
          },
          relationships: {
            relationshipTypeDistribution: {},
            averageRelationshipDistance: 0,
            relationshipDistanceDistribution: {},
            maxRelationshipDistance: 0,
            blendedFamilies: 0,
            stepRelationships: 0,
            adoptionRate: 0,
            multipleMarriages: 0,
            averageAncestorsPerGeneration: 0,
            missingAncestors: 0,
            ancestralCompleteness: 0,
            ancestralDepth: 0,
            averageSiblingsPerFamily: 0,
            onlyChildren: 0,
            largeSiblingGroups: 0,
            cousinRelationships: {
              firstCousins: 0,
              secondCousins: 0,
              thirdCousins: 0,
              distantCousins: 0,
            },
            keyConnectors: [],
            averageCentrality: 0,
            centralityDistribution: {},
          },
          edges: [],
          edgeAnalysis: {
            totalEdges: 0,
            parentChildEdges: 0,
            spouseEdges: 0,
            siblingEdges: 0,
            averageEdgeWeight: 0,
            edgeWeightDistribution: {},
            strongRelationships: 0,
            weakRelationships: 0,
            averageRelationshipDuration: 0,
            relationshipDurationDistribution: {},
            sameCountryRelationships: 0,
            crossCountryRelationships: 0,
            averageDistanceBetweenSpouses: 0,
          },
          summary: {
            totalIndividuals: 1,
            totalFamilies: 0,
            timeSpan: 'Unknown',
            geographicDiversity: 'Unknown',
            familyComplexity: 'Unknown',
            averageLifespan: 0,
            maxGenerations: 1,
          },
        },
      };

      const context = {
        gedcomData: mockMetadata,
        llmData: {
          individuals: {},
          families: {},
          metadata: mockMetadata.metadata,
        },
        visualMetadata: {
          individuals: {
            I1: {
              x: 400, // Set an initial x position to test preservation
              y: 0,
              size: 20,
              scale: 1,
              color: initialEntityVisualMetadata.color,
              backgroundColor: initialEntityVisualMetadata.backgroundColor,
              strokeColor: initialEntityVisualMetadata.strokeColor,
              opacity: initialEntityVisualMetadata.opacity,
              alpha: initialEntityVisualMetadata.alpha,
              shape: initialEntityVisualMetadata.shape,
              strokeWeight: 1,
              strokeStyle: 'solid' as const,
              velocity: { x: 0, y: 0 },
              acceleration: { x: 0, y: 0 },
              rotation: 0,
              rotationSpeed: 0,
              group: 'default',
              layer: 0,
              priority: 0,
              custom: {},
            },
          },
          families: {},
          edges: {},
          tree: {},
          global: {
            canvasWidth: 1000,
            canvasHeight: 800,
            defaultNodeSize: 20,
            defaultNodeColor: '#4CAF50',
            defaultNodeShape: 'circle' as const,
          },
        },
        dimensions: { primary: 'generation' },
        visual: {
          primaryColor: '#4CAF50',
        } as VisualParameterValues,
      };

      const runtimeTransformer = transformer.createTransformerInstance({
        dimensions: { primary: 'generation' },
        visual: {
          primaryColor: '#4CAF50',
        },
      });
      const result = await runtimeTransformer({
        ...context,
        canvas: DEFAULT_TEST_CANVAS,
      });

      expect(result.visualMetadata).toBeDefined();
      expect(result.visualMetadata.individuals).toBeDefined();
      expect(Object.keys(result.visualMetadata.individuals ?? {})).toHaveLength(
        1,
      );
      const individualId = Object.keys(
        result.visualMetadata.individuals ?? {},
      )[0];
      const individualMetadata =
        result.visualMetadata.individuals?.[individualId];
      // x position should be preserved from the initial context
      expect(individualMetadata?.x).toBe(400);
      expect(individualMetadata?.y).toBeDefined();
      // Vertical spread should only set y position, not size, color, or shape
      expect(individualMetadata?.size).toBe(20); // Should preserve initial size
      expect(individualMetadata?.color).toBe(initialEntityVisualMetadata.color); // Should preserve initial color
      expect(individualMetadata?.shape).toBe(initialEntityVisualMetadata.shape); // Should preserve initial shape
    });
  });
});
