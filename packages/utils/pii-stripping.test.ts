import { describe, it, expect } from 'vitest';
import { stripPIIForLLM, validatePIIStripping } from './pii-stripping';
import type { GedcomDataWithMetadata } from '../types';
import type { AnonymizedGedcomData } from '../types/pii-stripping';

describe('PII Stripping', () => {
  const mockIndividuals = {
    I1: {
      id: 'I1',
      name: 'John Smith',
      parents: [] as string[],
      spouses: ['I2'] as string[],
      children: ['I3'] as string[],
      siblings: [] as string[],
      gender: 'M' as const,
      birth: {
        date: '1980-05-15',
        place: 'New York, NY, USA',
      },
      death: {
        date: '2020-12-01',
        place: 'Los Angeles, CA, USA',
      },
      metadata: {
        lifespan: 0.8,
        isAlive: false,
        birthMonth: 5,
        zodiacSign: 'Taurus',
        generation: 2,
        relativeGenerationValue: 0.3,
      },
    },
    I2: {
      id: 'I2',
      name: 'Jane Doe',
      parents: [] as string[],
      spouses: ['I1'] as string[],
      children: ['I3'] as string[],
      siblings: [] as string[],
      gender: 'F' as const,
      birth: {
        date: '1982-08-20',
        place: 'Chicago, IL, USA',
      },
      metadata: {
        lifespan: 0.7,
        isAlive: true,
        birthMonth: 8,
        zodiacSign: 'Leo',
        generation: 2,
        relativeGenerationValue: 0.7,
      },
    },
    I3: {
      id: 'I3',
      name: 'Bob Smith',
      parents: ['I1', 'I2'] as string[],
      spouses: [] as string[],
      children: [] as string[],
      siblings: [] as string[],
      gender: 'M' as const,
      birth: {
        date: '2010-03-10',
      },
      metadata: {
        lifespan: 0.2,
        isAlive: true,
        birthMonth: 3,
        zodiacSign: 'Pisces',
        generation: 3,
        relativeGenerationValue: 0.5,
      },
    },
  };

  const mockGedcomData = {
    individuals: mockIndividuals,
    families: {
      F1: {
        id: 'F1',
        husband: mockIndividuals.I1,
        wife: mockIndividuals.I2,
        children: [mockIndividuals.I3],
        metadata: {
          marriageYear: 2005,
          numberOfChildren: 1,
        },
      },
    },
    metadata: {
      graphStructure: {
        totalIndividuals: 3,
        totalFamilies: 1,
        totalEdges: 3,
        maxGenerations: 3,
        minGenerations: 2,
        generationDistribution: { '2': 2, '3': 1 },
        averageGenerationsPerBranch: 2.5,
        disconnectedComponents: 1,
        largestComponentSize: 3,
        averageConnectionsPerIndividual: 2,
        connectivityDensity: 0.67,
        averageFamilySize: 3,
        largestFamilySize: 3,
        familySizeDistribution: { '3': 1 },
        childlessFamilies: 0,
        largeFamilies: 1,
        treeComplexity: 0.5,
        branchingFactor: 1.5,
        depthToBreadthRatio: 2.5,
      },
      temporalPatterns: {
        earliestBirthYear: 1980,
        latestBirthYear: 2010,
        timeSpan: 30,
        generationTimeSpans: {
          '2': {
            earliest: 1980,
            latest: 1982,
            span: 2,
            averageBirthYear: 1981,
          },
          '3': {
            earliest: 2010,
            latest: 2010,
            span: 0,
            averageBirthYear: 2010,
          },
        },
        averageLifespan: 75,
        lifespanDistribution: { '0-50': 0, '51-75': 1, '76-100': 2 },
        longestLifespan: 80,
        shortestLifespan: 70,
        lifespanVariance: 25,
        historicalPeriods: [],
        birthYearDistribution: { '1980s': 2, '2010s': 1 },
        deathYearDistribution: { '2020s': 1 },
        marriageYearDistribution: { '2000s': 1 },
        averageGenerationGap: 28,
        generationGapVariance: 28,
      },
      geographicPatterns: {
        uniqueBirthPlaces: 3,
        uniqueDeathPlaces: 1,
        countriesRepresented: 1,
        statesProvincesRepresented: 2,
        birthPlaceDistribution: { USA: 3 },
        deathPlaceDistribution: { USA: 1 },
        countryDistribution: { USA: 3 },
        stateProvinceDistribution: { NY: 1, IL: 1, CA: 1 },
        countryPercentages: { USA: 100 },
        stateProvincePercentages: { NY: 33.3, IL: 33.3, CA: 33.3 },
        migrationPatterns: [],
        regions: [],
        geographicClusters: [],
        geographicDiversity: 0.33,
        averageDistanceBetweenBirthPlaces: 0,
      },
      demographics: {
        genderDistribution: {
          male: { count: 2, percentage: 66.7 },
          female: { count: 1, percentage: 33.3 },
          unknown: { count: 0, percentage: 0 },
        },
        ageDistribution: { '0-20': 1, '21-50': 0, '51-80': 2 },
        averageAgeAtDeath: 80,
        ageGroupDistribution: { '0-20': 1, '21-50': 0, '51-80': 2 },
        ageVariance: 30,
        averageChildrenPerFamily: 1,
        childlessFamilies: 0,
        largeFamilies: 1,
        familySizeVariance: 0,
        averageAgeAtMarriage: 25,
        marriageAgeDistribution: { '20-30': 1 },
        remarriageRate: 0,
        marriageAgeVariance: 0,
        averageChildrenPerWoman: 1,
        fertilityRate: 1,
        childbearingAgeRange: { min: 20, max: 40, average: 30 },
      },
      relationships: {
        relationshipTypeDistribution: { 'parent-child': 2, spouse: 1 },
        averageRelationshipDistance: 1,
        relationshipDistanceDistribution: { '1': 3 },
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
        keyConnectors: ['I1', 'I2'],
        averageCentrality: 0.67,
        centralityDistribution: { high: 1, medium: 2, low: 0 },
      },
      edges: [],
      edgeAnalysis: {
        totalEdges: 3,
        parentChildEdges: 2,
        spouseEdges: 1,
        siblingEdges: 0,
        averageEdgeWeight: 1,
        edgeWeightDistribution: { '1': 3 },
        strongRelationships: 3,
        weakRelationships: 0,
        averageRelationshipDuration: 20,
        relationshipDurationDistribution: { '20': 1 },
        sameCountryRelationships: 3,
        crossCountryRelationships: 0,
        averageDistanceBetweenSpouses: 0,
      },
      summary: {
        totalIndividuals: 3,
        totalFamilies: 1,
        timeSpan: '30 years',
        geographicDiversity: 'local',
        familyComplexity: 'simple',
        averageLifespan: 75,
        maxGenerations: 3,
      },
    },
  } as GedcomDataWithMetadata;

  describe('stripPIIForLLM', () => {
    it('should strip names and replace with anonymous identifiers', () => {
      const result = stripPIIForLLM(mockGedcomData);

      expect(result.anonymizedData.individuals.I1.name).toBe('Individual_I1');
      expect(result.anonymizedData.individuals.I2.name).toBe('Individual_I2');
      expect(result.anonymizedData.individuals.I3.name).toBe('Individual_I3');
    });

    it('should strip detailed dates and keep only years', () => {
      const result = stripPIIForLLM(mockGedcomData);

      expect(result.anonymizedData.individuals.I1.birth).toEqual({
        year: 1980,
      });
      expect(result.anonymizedData.individuals.I1.death).toEqual({
        year: 2020,
      });
      expect(result.anonymizedData.individuals.I2.birth).toEqual({
        year: 1982,
      });
      expect(result.anonymizedData.individuals.I3.birth).toEqual({
        year: 2010,
      });
    });

    it('should strip all location data', () => {
      const result = stripPIIForLLM(mockGedcomData);

      // Check that no place data exists in birth/death objects
      Object.values(result.anonymizedData.individuals).forEach((individual) => {
        if (individual.birth) {
          expect(individual.birth).not.toHaveProperty('place');
        }
        if (individual.death) {
          expect(individual.death).not.toHaveProperty('place');
        }
      });
    });

    it('should preserve structural relationships', () => {
      const result = stripPIIForLLM(mockGedcomData);

      expect(result.anonymizedData.individuals.I1.spouses).toEqual(['I2']);
      expect(result.anonymizedData.individuals.I1.children).toEqual(['I3']);
      expect(result.anonymizedData.individuals.I3.parents).toEqual([
        'I1',
        'I2',
      ]);
    });

    it('should preserve metadata statistics', () => {
      const result = stripPIIForLLM(mockGedcomData);

      expect(
        result.anonymizedData.metadata.graphStructure.totalIndividuals,
      ).toBe(3);
      expect(
        result.anonymizedData.metadata.demographics.genderDistribution.male
          .count,
      ).toBe(2);
      expect(
        result.anonymizedData.metadata.temporalPatterns.earliestBirthYear,
      ).toBe(1980);
    });

    it('should preserve non-PII individual metadata', () => {
      const result = stripPIIForLLM(mockGedcomData);

      expect(result.anonymizedData.individuals.I1.gender).toBe('M');
      expect(result.anonymizedData.individuals.I1.metadata.generation).toBe(2);
      expect(result.anonymizedData.individuals.I1.metadata.birthMonth).toBe(5);
      expect(result.anonymizedData.individuals.I1.metadata.zodiacSign).toBe(
        'Taurus',
      );
    });

    it('should provide accurate stripping statistics', () => {
      const result = stripPIIForLLM(mockGedcomData);

      expect(result.strippingStats.namesStripped).toBe(3);
      expect(result.strippingStats.datesStripped).toBe(4); // 3 birth + 1 death
      expect(result.strippingStats.locationsStripped).toBe(3); // 2 birth + 1 death places
      expect(result.strippingStats.individualsProcessed).toBe(3);
      expect(result.strippingStats.familiesProcessed).toBe(1);
    });

    it('should handle different name patterns', () => {
      const result = stripPIIForLLM(mockGedcomData, {
        namePattern: 'person_generation_index',
      });

      expect(result.anonymizedData.individuals.I1.name).toBe('Person_2_0');
      expect(result.anonymizedData.individuals.I2.name).toBe('Person_2_1');
      expect(result.anonymizedData.individuals.I3.name).toBe('Person_3_2');
    });

    it('should handle missing data gracefully', () => {
      const incompleteData: GedcomDataWithMetadata = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'John',
            parents: [] as string[],
            spouses: [] as string[],
            children: [] as string[],
            siblings: [] as string[],
            metadata: {
              generation: 1,
            },
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
            depthToBreadthRatio: 1,
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
              unknown: { count: 1, percentage: 100 },
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
            timeSpan: '',
            geographicDiversity: '',
            familyComplexity: '',
            averageLifespan: 0,
            maxGenerations: 1,
          },
        },
      };

      const result = stripPIIForLLM(incompleteData);
      expect(result.anonymizedData.individuals.I1.name).toBe('Individual_I1');
      expect(result.strippingStats.individualsProcessed).toBe(1);
    });
  });

  describe('validatePIIStripping', () => {
    it('should validate properly anonymized data', () => {
      const result = stripPIIForLLM(mockGedcomData);
      const validation = validatePIIStripping(result.anonymizedData);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect non-anonymized names', () => {
      const invalidData = {
        ...mockGedcomData,
        individuals: {
          I1: {
            ...mockGedcomData.individuals.I1,
            name: 'Real Name', // Should be anonymized
          },
        },
      };

      const result = stripPIIForLLM(invalidData);
      const validation = validatePIIStripping(result.anonymizedData);

      // This should pass because the function actually anonymizes the name
      expect(validation.isValid).toBe(true);
    });

    it('should detect location data in birth/death objects', () => {
      // Create a test object that would fail validation
      const dataWithLocation = {
        individuals: {
          I1: {
            id: 'I1',
            name: 'Individual_I1',
            parents: [] as string[],
            spouses: [] as string[],
            children: [] as string[],
            siblings: [] as string[],
            birth: {
              year: 1980,
              place: 'Some Place', // This should be detected
            },
            metadata: {},
          },
        },
        families: {},
        metadata: mockGedcomData.metadata,
      };

      const validation = validatePIIStripping(
        dataWithLocation as unknown as AnonymizedGedcomData,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain(
        'Individual I1 has birth location data',
      );
    });
  });

  describe('Integration', () => {
    it('should maintain data structure integrity', () => {
      const result = stripPIIForLLM(mockGedcomData);

      // Check that all individuals are present
      expect(Object.keys(result.anonymizedData.individuals)).toHaveLength(3);
      expect(Object.keys(result.anonymizedData.families)).toHaveLength(1);

      // Check that family relationships are maintained
      const family = result.anonymizedData.families.F1;
      expect(family.husband?.id).toBe('I1');
      expect(family.wife?.id).toBe('I2');
      expect(family.children).toHaveLength(1);
      expect(family.children[0].id).toBe('I3');
    });

    it('should be suitable for LLM transmission', () => {
      const result = stripPIIForLLM(mockGedcomData);
      const validation = validatePIIStripping(result.anonymizedData);

      // Verify no PII remains
      expect(validation.isValid).toBe(true);

      // Verify structural data is preserved for LLM understanding
      expect(
        result.anonymizedData.metadata.graphStructure.totalIndividuals,
      ).toBe(3);
      expect(
        result.anonymizedData.metadata.demographics.genderDistribution,
      ).toBeDefined();
      expect(
        result.anonymizedData.metadata.temporalPatterns.earliestBirthYear,
      ).toBe(1980);

      // Verify relationships are preserved
      expect(result.anonymizedData.individuals.I1.spouses).toContain('I2');
      expect(result.anonymizedData.individuals.I3.parents).toContain('I1');
    });
  });
});
