/**
 * Integration tests for comprehensive metadata analysis
 */

import { describe, it, expect } from 'vitest';
import { transformGedcomDataWithComprehensiveAnalysis } from './transformation-pipeline';
import type { Individual, Family } from '../../shared/types/gedcom';

// Mock data for testing
const mockIndividuals: Individual[] = [
  {
    id: 'I1',
    name: 'John Doe',
    gender: 'M',
    birth: { date: '1980-01-01', place: 'New York, USA' },
    death: { date: '2020-01-01', place: 'Los Angeles, USA' },
    parents: [],
    spouses: ['F1'],
    children: ['I2', 'I3'],
    siblings: [],
  },
  {
    id: 'I2',
    name: 'Jane Doe',
    gender: 'F',
    birth: { date: '2010-01-01', place: 'Los Angeles, USA' },
    parents: ['I1'],
    spouses: [],
    children: [],
    siblings: ['I3'],
  },
  {
    id: 'I3',
    name: 'Bob Doe',
    gender: 'M',
    birth: { date: '2012-01-01', place: 'Los Angeles, USA' },
    parents: ['I1'],
    spouses: [],
    children: [],
    siblings: ['I2'],
  },
];

const mockFamilies: Family[] = [
  {
    id: 'F1',
    husband: mockIndividuals[0],
    wife: undefined,
    children: [mockIndividuals[1], mockIndividuals[2]],
  },
];

describe('Comprehensive Analysis Integration', () => {
  it('should process GEDCOM data with comprehensive analysis', () => {
    const result = transformGedcomDataWithComprehensiveAnalysis(
      mockIndividuals,
      mockFamilies,
    );

    // Verify the structure (now ID-keyed objects)
    expect(Object.keys(result.individuals)).toHaveLength(3);
    expect(Object.keys(result.families)).toHaveLength(1);
    expect(result.metadata).toBeDefined();

    // Verify graph structure analysis
    expect(result.metadata.graphStructure).toBeDefined();
    expect(result.metadata.graphStructure.totalIndividuals).toBe(3);
    expect(result.metadata.graphStructure.totalFamilies).toBe(1);
    expect(
      result.metadata.graphStructure.treeComplexity,
    ).toBeGreaterThanOrEqual(0);

    // Verify temporal patterns
    expect(result.metadata.temporalPatterns).toBeDefined();
    expect(
      result.metadata.temporalPatterns.earliestBirthYear,
    ).toBeGreaterThanOrEqual(0);
    expect(result.metadata.temporalPatterns.timeSpan).toBeGreaterThanOrEqual(0);

    // Verify geographic patterns
    expect(result.metadata.geographicPatterns).toBeDefined();
    expect(
      result.metadata.geographicPatterns.countriesRepresented,
    ).toBeGreaterThanOrEqual(0);
    expect(result.metadata.geographicPatterns.countryPercentages).toBeDefined();

    // Verify demographics
    expect(result.metadata.demographics).toBeDefined();
    expect(result.metadata.demographics.genderDistribution).toBeDefined();
    expect(result.metadata.demographics.genderDistribution.male.count).toBe(2);
    expect(result.metadata.demographics.genderDistribution.female.count).toBe(
      1,
    );

    // Verify relationships
    expect(result.metadata.relationships).toBeDefined();
    expect(
      result.metadata.relationships.relationshipTypeDistribution,
    ).toBeDefined();

    // Verify edges
    expect(result.metadata.edges).toBeDefined();
    expect(result.metadata.edges.length).toBeGreaterThan(0);
    expect(result.metadata.edgeAnalysis).toBeDefined();

    // Verify summary
    expect(result.metadata.summary).toBeDefined();
    expect(result.metadata.summary.totalIndividuals).toBe(3);
    expect(result.metadata.summary.totalFamilies).toBe(1);
    expect(result.metadata.summary.timeSpan).toBeDefined();
  });

  it('should enhance individual metadata with graph data', () => {
    const result = transformGedcomDataWithComprehensiveAnalysis(
      mockIndividuals,
      mockFamilies,
    );

    const enhancedIndividual = result.individuals.I1;

    // Verify enhanced metadata fields
    expect(enhancedIndividual.metadata.generation).toBeDefined();
    expect(enhancedIndividual.metadata.centrality).toBeDefined();
    expect(enhancedIndividual.metadata.relationshipCount).toBeDefined();
    expect(enhancedIndividual.metadata.birthCountry).toBeDefined();
    expect(enhancedIndividual.metadata.birthYear).toBeDefined();
  });

  it('should enhance family metadata with graph data', () => {
    const result = transformGedcomDataWithComprehensiveAnalysis(
      mockIndividuals,
      mockFamilies,
    );

    const enhancedFamily = result.families.F1;

    // Verify enhanced metadata fields
    expect(enhancedFamily.metadata.numberOfChildren).toBe(2);
    expect(enhancedFamily.metadata.familyComplexity).toBeDefined();
    expect(enhancedFamily.metadata.generation).toBeDefined();
  });
});
