import { describe, it, expect } from 'vitest';
import { edgeOpacityTransform } from './edge-opacity';
import { createInitialCompleteVisualMetadata } from './pipeline';
import type { GedcomDataWithMetadata } from '../../../../shared/types';
import type { TransformerContext } from './types';

// Test data
const createTestData = (): GedcomDataWithMetadata => ({
  individuals: {
    I1: {
      id: 'I1',
      name: 'John Doe',
      gender: 'M',
      parents: [],
      spouses: ['I2'],
      children: ['I3'],
      siblings: [],
      metadata: {
        generation: 1,
        lifespan: 75,
        birthYear: 1950,
        relativeGenerationValue: 0.5,
      },
    },
    I2: {
      id: 'I2',
      name: 'Jane Doe',
      gender: 'F',
      parents: [],
      spouses: ['I1'],
      children: ['I3'],
      siblings: [],
      metadata: {
        generation: 1,
        lifespan: 80,
        birthYear: 1955,
        relativeGenerationValue: 0.5,
      },
    },
    I3: {
      id: 'I3',
      name: 'Child Doe',
      gender: 'M',
      parents: ['I1', 'I2'],
      spouses: [],
      children: [],
      siblings: [],
      metadata: {
        generation: 2,
        lifespan: 25,
        birthYear: 1980,
        relativeGenerationValue: 0.8,
      },
    },
  },
  families: {},
  metadata: {
    graphStructure: {
      totalIndividuals: 3,
      totalFamilies: 0,
      totalEdges: 2,
      maxGenerations: 2,
      minGenerations: 1,
      generationDistribution: { '1': 2, '2': 1 },
      averageGenerationsPerBranch: 1.5,
      disconnectedComponents: 1,
      largestComponentSize: 3,
      averageConnectionsPerIndividual: 1.33,
      connectivityDensity: 0.67,
      averageFamilySize: 2,
      largestFamilySize: 2,
      familySizeDistribution: { '2': 1 },
      childlessFamilies: 0,
      largeFamilies: 0,
      treeComplexity: 0.5,
      branchingFactor: 1.5,
      depthToBreadthRatio: 0.67,
    },
    temporalPatterns: {
      earliestBirthYear: 1950,
      latestBirthYear: 1980,
      timeSpan: 30,
      generationTimeSpans: {},
      averageLifespan: 60,
      lifespanDistribution: {},
      longestLifespan: 80,
      shortestLifespan: 25,
      lifespanVariance: 775,
      historicalPeriods: [],
      birthYearDistribution: {},
      deathYearDistribution: {},
      marriageYearDistribution: {},
      averageGenerationGap: 25,
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
        male: { count: 2, percentage: 66.7 },
        female: { count: 1, percentage: 33.3 },
        unknown: { count: 0, percentage: 0 },
      },
      ageDistribution: {},
      averageAgeAtDeath: 60,
      ageGroupDistribution: {},
      ageVariance: 775,
      averageChildrenPerFamily: 1,
      childlessFamilies: 0,
      largeFamilies: 0,
      familySizeVariance: 0,
      averageAgeAtMarriage: 25,
      marriageAgeDistribution: {},
      remarriageRate: 0,
      marriageAgeVariance: 0,
      averageChildrenPerWoman: 1,
      fertilityRate: 1,
      childbearingAgeRange: { min: 25, max: 25, average: 25 },
    },
    relationships: {
      relationshipTypeDistribution: {},
      averageRelationshipDistance: 1,
      relationshipDistanceDistribution: {},
      maxRelationshipDistance: 1,
      blendedFamilies: 0,
      stepRelationships: 0,
      adoptionRate: 0,
      multipleMarriages: 0,
      averageAncestorsPerGeneration: 2,
      missingAncestors: 0,
      ancestralCompleteness: 1,
      ancestralDepth: 2,
      averageSiblingsPerFamily: 0,
      onlyChildren: 1,
      largeSiblingGroups: 0,
      cousinRelationships: {
        firstCousins: 0,
        secondCousins: 0,
        thirdCousins: 0,
        distantCousins: 0,
      },
      keyConnectors: ['I1'],
      averageCentrality: 0.5,
      centralityDistribution: {},
    },
    edges: [
      {
        id: 'E1',
        sourceId: 'I1',
        targetId: 'I2',
        relationshipType: 'spouse',
        metadata: {
          relationshipStrength: 0.8,
          isDirectRelationship: true,
          familySize: 1,
          relationshipDuration: 30,
          overlapYears: 25,
          sameBirthCountry: true,
          sameDeathCountry: true,
        },
      },
      {
        id: 'E2',
        sourceId: 'I1',
        targetId: 'I3',
        relationshipType: 'parent-child',
        metadata: {
          relationshipStrength: 1.0,
          isDirectRelationship: true,
          familySize: 1,
          relationshipDuration: 25,
          overlapYears: 25,
          sameBirthCountry: true,
          sameDeathCountry: true,
        },
      },
    ],
    edgeAnalysis: {
      totalEdges: 2,
      parentChildEdges: 1,
      spouseEdges: 1,
      siblingEdges: 0,
      averageEdgeWeight: 0.9,
      edgeWeightDistribution: {},
      strongRelationships: 2,
      weakRelationships: 0,
      averageRelationshipDuration: 27.5,
      relationshipDurationDistribution: {},
      sameCountryRelationships: 2,
      crossCountryRelationships: 0,
      averageDistanceBetweenSpouses: 0,
    },
    summary: {
      totalIndividuals: 3,
      totalFamilies: 0,
      timeSpan: '1950-1980',
      geographicDiversity: 'Low',
      familyComplexity: 'Simple',
      averageLifespan: 60,
      maxGenerations: 2,
    },
  },
});

const createTestContext = (
  gedcomData: GedcomDataWithMetadata,
  dimensions: { primary: string; secondary?: string } = {
    primary: 'relationshipDensity',
  },
  visual: Record<string, any> = {},
): TransformerContext => {
  const visualMetadata = createInitialCompleteVisualMetadata(
    gedcomData,
    800,
    600,
  );

  // Add positions to individuals for distance calculations
  visualMetadata.individuals['I1'] = {
    ...visualMetadata.individuals['I1'],
    x: 100,
    y: 100,
  };
  visualMetadata.individuals['I2'] = {
    ...visualMetadata.individuals['I2'],
    x: 200,
    y: 200,
  };
  visualMetadata.individuals['I3'] = {
    ...visualMetadata.individuals['I3'],
    x: 150,
    y: 300,
  };

  return {
    gedcomData,
    llmData: {
      individuals: {},
      families: {},
      metadata: {
        graphStructure: {
          totalIndividuals: 3,
          totalFamilies: 0,
          totalEdges: 2,
          maxGenerations: 2,
          minGenerations: 1,
          generationDistribution: { '1': 2, '2': 1 },
          averageGenerationsPerBranch: 1.5,
          disconnectedComponents: 1,
          largestComponentSize: 3,
          averageConnectionsPerIndividual: 1.33,
          connectivityDensity: 0.67,
          averageFamilySize: 2,
          largestFamilySize: 2,
          familySizeDistribution: { '2': 1 },
          childlessFamilies: 0,
          largeFamilies: 0,
          treeComplexity: 0.5,
          branchingFactor: 1.5,
          depthToBreadthRatio: 0.67,
        },
        temporalPatterns: {
          earliestBirthYear: 1950,
          latestBirthYear: 1980,
          timeSpan: 30,
          generationTimeSpans: {},
          averageLifespan: 60,
          lifespanDistribution: {},
          longestLifespan: 80,
          shortestLifespan: 25,
          lifespanVariance: 775,
          historicalPeriods: [],
          birthYearDistribution: {},
          deathYearDistribution: {},
          marriageYearDistribution: {},
          averageGenerationGap: 25,
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
            male: { count: 2, percentage: 66.7 },
            female: { count: 1, percentage: 33.3 },
            unknown: { count: 0, percentage: 0 },
          },
          ageDistribution: {},
          averageAgeAtDeath: 60,
          ageGroupDistribution: {},
          ageVariance: 775,
          averageChildrenPerFamily: 1,
          childlessFamilies: 0,
          largeFamilies: 0,
          familySizeVariance: 0,
          averageAgeAtMarriage: 25,
          marriageAgeDistribution: {},
          remarriageRate: 0,
          marriageAgeVariance: 0,
          averageChildrenPerWoman: 1,
          fertilityRate: 1,
          childbearingAgeRange: { min: 25, max: 25, average: 25 },
        },
        relationships: {
          relationshipTypeDistribution: {},
          averageRelationshipDistance: 1,
          relationshipDistanceDistribution: {},
          maxRelationshipDistance: 1,
          blendedFamilies: 0,
          stepRelationships: 0,
          adoptionRate: 0,
          multipleMarriages: 0,
          averageAncestorsPerGeneration: 2,
          missingAncestors: 0,
          ancestralCompleteness: 1,
          ancestralDepth: 2,
          averageSiblingsPerFamily: 0,
          onlyChildren: 1,
          largeSiblingGroups: 0,
          cousinRelationships: {
            firstCousins: 0,
            secondCousins: 0,
            thirdCousins: 0,
            distantCousins: 0,
          },
          keyConnectors: ['I1'],
          averageCentrality: 0.5,
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
          totalIndividuals: 3,
          totalFamilies: 0,
          timeSpan: '1950-1980',
          geographicDiversity: 'Low',
          familyComplexity: 'Simple',
          averageLifespan: 60,
          maxGenerations: 2,
        },
      },
    },
    visualMetadata,
    temperature: 0.5,
    seed: 'test',
    canvasWidth: 800,
    canvasHeight: 600,
    dimensions,
    visual: {
      edgeOpacity: 0.7,
      edgeWidth: 2,
      secondaryColor: '#ff0000',
      variationFactor: 0.1,
      ...visual,
    },
  };
};

describe('Edge Opacity Transformer', () => {
  it('should calculate edge opacity based on relationship density dimension', async () => {
    const testData = createTestData();
    const context = createTestContext(testData, {
      primary: 'relationshipDensity',
    });

    const result = await edgeOpacityTransform(context);

    expect(result.visualMetadata.edges).toBeDefined();

    const spouseEdge = result.visualMetadata.edges?.['E1'];
    const parentChildEdge = result.visualMetadata.edges?.['E2'];

    expect(spouseEdge?.opacity).toBeGreaterThan(0.1);
    expect(parentChildEdge?.opacity).toBeGreaterThan(0.1);
    // Parent-child relationships should generally have higher opacity than spouse
    expect(parentChildEdge?.opacity).toBeGreaterThanOrEqual(
      (spouseEdge?.opacity ?? 0) * 0.8,
    );
  });

  it('should calculate edge opacity based on generation distance dimension', async () => {
    const testData = createTestData();
    const context = createTestContext(testData, { primary: 'generation' });

    const result = await edgeOpacityTransform(context);

    const spouseEdge = result.visualMetadata.edges?.['E1']; // Same generation
    const parentChildEdge = result.visualMetadata.edges?.['E2']; // Different generations

    expect(spouseEdge?.opacity).toBeGreaterThan(0.1);
    expect(parentChildEdge?.opacity).toBeGreaterThan(0.1);
    // Same generation should have higher opacity than different generations
    expect(spouseEdge?.opacity).toBeGreaterThan(parentChildEdge?.opacity ?? 0);
  });

  it('should calculate edge opacity based on combined children count dimension', async () => {
    const testData = createTestData();
    const context = createTestContext(testData, { primary: 'childrenCount' });

    const result = await edgeOpacityTransform(context);

    const edges = result.visualMetadata.edges;
    expect(edges?.['E1']?.opacity).toBeGreaterThan(0.1);
    expect(edges?.['E2']?.opacity).toBeGreaterThan(0.1);
  });

  it('should calculate edge opacity based on average lifespan dimension', async () => {
    const testData = createTestData();
    const context = createTestContext(testData, { primary: 'lifespan' });

    const result = await edgeOpacityTransform(context);

    const edges = result.visualMetadata.edges;
    expect(edges?.['E1']?.opacity).toBeGreaterThan(0.1);
    expect(edges?.['E2']?.opacity).toBeGreaterThan(0.1);
    // Edge between longer-lived individuals should have higher opacity
    expect(edges?.['E1']?.opacity).toBeGreaterThan(edges?.['E2']?.opacity ?? 0);
  });

  it('should respect primary and secondary dimension weights', async () => {
    const testData = createTestData();
    const context = createTestContext(testData, {
      primary: 'relationshipDensity',
      secondary: 'generation',
    });

    const result = await edgeOpacityTransform(context);

    const edges = result.visualMetadata.edges;
    expect(edges?.['E1']?.opacity).toBeGreaterThan(0.1);
    expect(edges?.['E2']?.opacity).toBeGreaterThan(0.1);
    // Should be influenced by both dimensions
  });

  it('should factor in edge length (longer edges more transparent)', async () => {
    const testData = createTestData();
    const context = createTestContext(testData);

    // Create edges with very different lengths
    context.visualMetadata.individuals['I1'] = {
      ...context.visualMetadata.individuals['I1'],
      x: 0,
      y: 0,
    };
    context.visualMetadata.individuals['I2'] = {
      ...context.visualMetadata.individuals['I2'],
      x: 10,
      y: 10,
    }; // Short edge
    context.visualMetadata.individuals['I3'] = {
      ...context.visualMetadata.individuals['I3'],
      x: 700,
      y: 500,
    }; // Long edge

    const result = await edgeOpacityTransform(context);

    const shortEdge = result.visualMetadata.edges?.['E1'];
    const longEdge = result.visualMetadata.edges?.['E2'];

    expect(shortEdge?.opacity).toBeGreaterThan(0.1);
    expect(longEdge?.opacity).toBeGreaterThan(0.1);
    // Shorter edges should generally be more opaque
    expect(shortEdge?.opacity).toBeGreaterThanOrEqual(longEdge?.opacity ?? 0);
  });

  it('should calculate edge width based on relationship type', async () => {
    const testData = createTestData();
    const context = createTestContext(testData);

    const result = await edgeOpacityTransform(context);

    const spouseEdge = result.visualMetadata.edges?.['E1'];
    const parentChildEdge = result.visualMetadata.edges?.['E2'];

    expect(spouseEdge?.strokeWeight).toBeGreaterThan(0);
    expect(parentChildEdge?.strokeWeight).toBeGreaterThan(0);
    // Parent-child should be thicker than spouse
    expect(parentChildEdge?.strokeWeight).toBeGreaterThan(
      spouseEdge?.strokeWeight ?? 0,
    );
  });

  it('should apply secondary color from visual parameters', async () => {
    const testData = createTestData();
    const context = createTestContext(
      testData,
      { primary: 'generation' },
      {
        secondaryColor: '#00ff00',
      },
    );

    const result = await edgeOpacityTransform(context);

    const edges = result.visualMetadata.edges;
    expect(edges?.['E1']?.strokeColor).toBe('#00ff00');
    expect(edges?.['E2']?.strokeColor).toBe('#00ff00');
  });

  it('should calculate opacity within valid range (0.1 to 1.0)', async () => {
    const testData = createTestData();
    const context = createTestContext(testData);

    const result = await edgeOpacityTransform(context);

    const edges = result.visualMetadata.edges;
    for (const edgeId of Object.keys(edges || {})) {
      const opacity = edges?.[edgeId]?.opacity;
      expect(opacity).toBeGreaterThanOrEqual(0.1);
      expect(opacity).toBeLessThanOrEqual(1.0);
    }
  });

  it('should preserve existing visual metadata except opacity, width, and color', async () => {
    const testData = createTestData();
    const context = createTestContext(testData);

    // Add some existing metadata
    context.visualMetadata.edges['E1'] = {
      ...context.visualMetadata.edges['E1'],
      custom: { someData: 'preserved' },
      layer: 5,
    };

    const result = await edgeOpacityTransform(context);

    const edge = result.visualMetadata.edges?.['E1'];
    expect(edge?.custom).toEqual({ someData: 'preserved' });
    expect(edge?.layer).toBe(5);
    // But opacity, strokeWeight, and strokeColor should be updated
    expect(edge?.opacity).toBeDefined();
    expect(edge?.strokeWeight).toBeDefined();
    expect(edge?.strokeColor).toBeDefined();
  });

  it('should handle empty edge data gracefully', async () => {
    const testData = createTestData();
    testData.metadata.edges = [];
    const context = createTestContext(testData);

    const result = await edgeOpacityTransform(context);

    expect(result.visualMetadata).toEqual({});
  });

  it('should handle invalid edge references gracefully', async () => {
    const testData = createTestData();
    testData.metadata.edges = [
      {
        id: 'E_INVALID',
        sourceId: 'NONEXISTENT',
        targetId: 'ALSO_NONEXISTENT',
        relationshipType: 'spouse',
        metadata: {
          relationshipStrength: 0.5,
          isDirectRelationship: true,
          familySize: 0,
          relationshipDuration: 0,
          overlapYears: 0,
          sameBirthCountry: false,
          sameDeathCountry: false,
        },
      },
    ];
    const context = createTestContext(testData);

    const result = await edgeOpacityTransform(context);

    const edge = result.visualMetadata.edges?.['E_INVALID'];
    expect(edge?.opacity).toBe(0.1); // Very low opacity for invalid edges
  });

  it('should respect edge opacity parameter ranges', async () => {
    const testData = createTestData();

    // Test with very transparent setting
    const transparentContext = createTestContext(
      testData,
      { primary: 'generation' },
      {
        edgeOpacity: 0.2,
      },
    );
    const transparentResult = await edgeOpacityTransform(transparentContext);

    // Test with fully opaque setting
    const opaqueContext = createTestContext(
      testData,
      { primary: 'generation' },
      {
        edgeOpacity: 1.0,
      },
    );
    const opaqueResult = await edgeOpacityTransform(opaqueContext);

    const transparentEdge = transparentResult.visualMetadata.edges?.['E1'];
    const opaqueEdge = opaqueResult.visualMetadata.edges?.['E1'];

    expect(transparentEdge?.opacity).toBeLessThan(opaqueEdge?.opacity ?? 1);
  });
});
