/**
 * Tests for graph analysis functions
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeGraphStructure,
  analyzeTemporalPatterns,
  analyzeGeographicPatterns,
  analyzeDemographics,
  analyzeRelationships,
  generateEdges,
  analyzeEdges,
  generateTreeSummary,
} from './graph-analysis';
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

describe('Graph Analysis Functions', () => {
  it('should analyze graph structure correctly', () => {
    const result = analyzeGraphStructure(mockIndividuals, mockFamilies);

    expect(result.totalIndividuals).toBe(3);
    expect(result.totalFamilies).toBe(1);
    expect(result.maxGenerations).toBeGreaterThanOrEqual(0);
    expect(result.treeComplexity).toBeGreaterThanOrEqual(0);
    expect(result.treeComplexity).toBeLessThanOrEqual(1);
  });

  it('should analyze temporal patterns correctly', () => {
    const result = analyzeTemporalPatterns(mockIndividuals, mockFamilies);

    expect(result.earliestBirthYear).toBe(1980);
    expect(result.latestBirthYear).toBe(2012);
    expect(result.timeSpan).toBe(32);
    expect(result.averageLifespan).toBeGreaterThanOrEqual(0);
  });

  it('should analyze geographic patterns correctly', () => {
    const result = analyzeGeographicPatterns(mockIndividuals);

    expect(result.uniqueBirthPlaces).toBe(2);
    expect(result.countriesRepresented).toBe(1);
    expect(result.countryPercentages.USA).toBe(100);
    expect(result.geographicDiversity).toBeGreaterThanOrEqual(0);
  });

  it('should analyze demographics correctly', () => {
    const result = analyzeDemographics(mockIndividuals, mockFamilies);

    expect(result.genderDistribution.male.count).toBe(2);
    expect(result.genderDistribution.female.count).toBe(1);
    expect(result.averageChildrenPerFamily).toBe(2);
  });

  it('should analyze relationships correctly', () => {
    const result = analyzeRelationships(mockIndividuals, mockFamilies);

    expect(result.relationshipTypeDistribution['parent-child']).toBeGreaterThan(
      0,
    );
    expect(result.averageSiblingsPerFamily).toBeGreaterThanOrEqual(0);
  });

  it('should generate edges correctly', () => {
    const edges = generateEdges(mockIndividuals, mockFamilies);

    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].relationshipType).toBeDefined();
    expect(edges[0].sourceId).toBeDefined();
    expect(edges[0].targetId).toBeDefined();
  });

  it('should analyze edges correctly', () => {
    const edges = generateEdges(mockIndividuals, mockFamilies);
    const result = analyzeEdges(edges);

    expect(result.totalEdges).toBe(edges.length);
    expect(result.parentChildEdges).toBeGreaterThanOrEqual(0);
  });

  it('should generate tree summary correctly', () => {
    const graphStructure = analyzeGraphStructure(mockIndividuals, mockFamilies);
    const temporalPatterns = analyzeTemporalPatterns(
      mockIndividuals,
      mockFamilies,
    );
    const geographicPatterns = analyzeGeographicPatterns(mockIndividuals);
    const demographics = analyzeDemographics(mockIndividuals, mockFamilies);
    const relationships = analyzeRelationships(mockIndividuals, mockFamilies);

    const summary = generateTreeSummary(
      graphStructure,
      temporalPatterns,
      geographicPatterns,
      demographics,
      relationships,
    );

    expect(summary.totalIndividuals).toBe(3);
    expect(summary.totalFamilies).toBe(1);
    expect(summary.timeSpan).toBeDefined();
    expect(summary.geographicDiversity).toBeDefined();
  });
});
