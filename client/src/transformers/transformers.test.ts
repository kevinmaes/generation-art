import { describe, it, expect } from 'vitest';
import {
  transformers,
  getTransformer,
  getAllTransformers,
  getTransformersByCategory,
  getAllCategories,
  type TransformerId,
} from './transformers';
import type { AppGedcomDataWithMetadata } from '../types/app-data';
import type { VisualParameterValues } from './visual-parameters';

describe('Transformers Registry', () => {
  it('should export transformers object', () => {
    expect(transformers).toBeDefined();
    expect(typeof transformers).toBe('object');
  });

  it('should have horizontal spread transformer', () => {
    const transformer = transformers['horizontal-spread'];
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
      expect(transformer.createRuntimeTransformerFunction).toBeDefined();
    }
  });
});

describe('Horizontal Spread Transformer', () => {
  it('should transform context with individuals', async () => {
    const transformer = getTransformer('horizontal-spread');
    expect(transformer).toBeDefined();

    const mockMetadata: AppGedcomDataWithMetadata = {
      individuals: new Map([
        [
          'I1' as any,
          {
            id: 'I1' as any,
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
        ],
      ]),
      families: new Map(),
      edges: new Map(),
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
      visualMetadata: {
        individuals: new Map([
          [
            'I1' as any,
            {
              x: 0,
              y: 250, // Set an initial y position to test preservation
              size: 20,
              scale: 1,
              color: '#cccccc',
              backgroundColor: '#ffffff',
              strokeColor: '#000000',
              opacity: 1,
              alpha: 1,
              shape: 'circle' as const,
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
          ],
        ]),
        families: new Map(),
        edges: new Map(),
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

    const runtimeTransformer = transformer.createRuntimeTransformerFunction({
      dimensions: { primary: 'generation' },
      visual: {
        primaryColor: '#4CAF50',
      },
    });
    const result = await runtimeTransformer(context);

    expect(result.visualMetadata).toBeDefined();
    expect(result.visualMetadata.individuals).toBeDefined();
    expect(result.visualMetadata.individuals?.size).toBe(1);
    const individualId = Array.from(
      result.visualMetadata.individuals?.keys() ?? [],
    )[0];
    const individualMetadata =
      result.visualMetadata.individuals?.get(individualId);
    expect(individualMetadata?.x).toBeDefined();
    // y position should be preserved from the initial context
    expect(individualMetadata?.y).toBe(250);
    // Size now includes temperature-based variation, so check it's within reasonable bounds
    expect(individualMetadata?.size).toBeGreaterThan(5);
    expect(individualMetadata?.size).toBeLessThan(50);
    expect(individualMetadata?.color).toBe('#4CAF50');
    expect(individualMetadata?.shape).toBe('circle');
  });

  it('should handle empty individuals array', async () => {
    const transformer = getTransformer('horizontal-spread');
    expect(transformer).toBeDefined();

    const mockMetadata: AppGedcomDataWithMetadata = {
      individuals: new Map(),
      families: new Map(),
      edges: new Map(),
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
      visualMetadata: {
        individuals: new Map(),
        families: new Map(),
        edges: new Map(),
        tree: {},
        global: {},
      },
      dimensions: { primary: 'generation' },
      visual: {} as VisualParameterValues,
    };

    const runtimeTransformer = transformer.createRuntimeTransformerFunction({
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

      const mockMetadata: AppGedcomDataWithMetadata = {
        individuals: new Map([
          [
            'I1' as any,
            {
              id: 'I1' as any,
              name: 'John Smith',
              parents: [],
              spouses: [],
              children: [],
              siblings: [],
              metadata: {
                generation: 1,
                relativeGenerationValue: 0.5,
              },
              gender: 'M' as any,
            },
          ],
        ]),
        families: new Map(),
        edges: new Map(),
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
          individuals: new Map([
            [
              'I1' as any,
              {
                x: 400, // Set an initial x position to test preservation
                y: 0,
                size: 20,
                scale: 1,
                color: '#cccccc',
                backgroundColor: '#ffffff',
                strokeColor: '#000000',
                opacity: 1,
                alpha: 1,
                shape: 'circle' as const,
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
            ],
          ]),
          families: new Map(),
          edges: new Map(),
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

      const runtimeTransformer = transformer.createRuntimeTransformerFunction({
        dimensions: { primary: 'generation' },
        visual: {
          primaryColor: '#4CAF50',
        },
      });
      const result = await runtimeTransformer(context);

      expect(result.visualMetadata).toBeDefined();
      expect(result.visualMetadata.individuals).toBeDefined();
      expect(result.visualMetadata.individuals?.size).toBe(1);
      const individualId = Array.from(
        result.visualMetadata.individuals?.keys() ?? [],
      )[0];
      const individualMetadata =
        result.visualMetadata.individuals?.get(individualId);
      // x position should be preserved from the initial context
      expect(individualMetadata?.x).toBe(400);
      expect(individualMetadata?.y).toBeDefined();
      // Size now includes temperature-based variation, so check it's within reasonable bounds
      expect(individualMetadata?.size).toBeGreaterThan(5);
      expect(individualMetadata?.size).toBeLessThan(50);
      expect(individualMetadata?.color).toBe('#4CAF50');
      expect(individualMetadata?.shape).toBe('circle');
    });
  });
});
