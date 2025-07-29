/**
 * Shared metadata types used across the application
 * These types represent metadata structures for families and trees
 * Individual metadata is now part of the AugmentedIndividual type
 */

import type { Family, AugmentedIndividual } from './gedcom';

/**
 * Edge representation for graph analysis
 */
export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: 'parent-child' | 'spouse' | 'sibling';
  familyId?: string;
  metadata: EdgeMetadata;
}

/**
 * Edge metadata for analysis
 */
export interface EdgeMetadata {
  // Relationship strength indicators
  relationshipStrength: number; // 0-1 scale
  isDirectRelationship: boolean;

  // Temporal properties
  relationshipDuration?: number; // Years
  overlapYears?: number; // Years both individuals were alive

  // Family context
  familySize: number; // Number of children in family
  birthOrder?: number; // For siblings

  // Geographic context
  sameBirthCountry: boolean;
  sameDeathCountry: boolean;

  // Custom computed properties
  custom?: Record<string, unknown>;
}

/**
 * Graph structure analysis metadata
 */
export interface GraphStructureMetadata {
  // Tree topology
  totalIndividuals: number;
  totalFamilies: number;
  totalEdges: number;

  // Generation analysis
  maxGenerations: number;
  minGenerations: number;
  generationDistribution: Record<number, number>;
  averageGenerationsPerBranch: number;

  // Connectivity analysis
  disconnectedComponents: number;
  largestComponentSize: number;
  averageConnectionsPerIndividual: number;
  connectivityDensity: number; // 0-1 scale

  // Family structure
  averageFamilySize: number;
  largestFamilySize: number;
  familySizeDistribution: Record<number, number>;
  childlessFamilies: number;
  largeFamilies: number; // 5+ children

  // Tree complexity
  treeComplexity: number; // 0-1 scale based on branching, depth, etc.
  branchingFactor: number; // Average children per family
  depthToBreadthRatio: number;
}

/**
 * Temporal analysis metadata
 */
export interface TemporalMetadata {
  // Time span analysis
  earliestBirthYear: number;
  latestBirthYear: number;
  timeSpan: number;

  // Generation timing
  generationTimeSpans: Record<
    number,
    {
      earliest: number;
      latest: number;
      span: number;
      averageBirthYear: number;
    }
  >;

  // Life expectancy analysis
  averageLifespan: number;
  lifespanDistribution: Record<string, number>;
  longestLifespan: number;
  shortestLifespan: number;
  lifespanVariance: number;

  // Historical periods
  historicalPeriods: {
    period: string;
    count: number;
    percentage: number;
    years: { start: number; end: number };
  }[];

  // Temporal patterns
  birthYearDistribution: Record<number, number>;
  deathYearDistribution: Record<number, number>;
  marriageYearDistribution: Record<number, number>;

  // Generation gaps
  averageGenerationGap: number;
  generationGapVariance: number;
}

/**
 * Geographic analysis metadata
 */
export interface GeographicMetadata {
  // Location diversity
  uniqueBirthPlaces: number;
  uniqueDeathPlaces: number;
  countriesRepresented: number;
  statesProvincesRepresented: number;

  // Geographic distribution
  birthPlaceDistribution: Record<string, number>;
  deathPlaceDistribution: Record<string, number>;
  countryDistribution: Record<string, number>;
  stateProvinceDistribution: Record<string, number>;

  // Percentage calculations
  countryPercentages: Record<string, number>; // % of individuals born in each country
  stateProvincePercentages: Record<string, number>;

  // Migration patterns
  migrationPatterns: {
    fromCountry: string;
    toCountry: string;
    count: number;
    percentage: number;
  }[];

  // Regional analysis
  regions: {
    region: string;
    countries: string[];
    count: number;
    percentage: number;
  }[];

  // Geographic clustering
  geographicClusters: {
    clusterId: string;
    center: { lat: number; lng: number };
    radius: number;
    individuals: string[];
    count: number;
  }[];

  // Geographic diversity metrics
  geographicDiversity: number; // 0-1 scale
  averageDistanceBetweenBirthPlaces: number;
}

/**
 * Demographic analysis metadata
 */
export interface DemographicMetadata {
  // Gender analysis
  genderDistribution: {
    male: { count: number; percentage: number };
    female: { count: number; percentage: number };
    unknown: { count: number; percentage: number };
  };

  // Age analysis
  ageDistribution: Record<string, number>;
  averageAgeAtDeath: number;
  ageGroupDistribution: Record<string, number>;
  ageVariance: number;

  // Family dynamics
  averageChildrenPerFamily: number;
  childlessFamilies: number;
  largeFamilies: number; // 5+ children
  familySizeVariance: number;

  // Marriage patterns
  averageAgeAtMarriage: number;
  marriageAgeDistribution: Record<string, number>;
  remarriageRate: number;
  marriageAgeVariance: number;

  // Fertility analysis
  averageChildrenPerWoman: number;
  fertilityRate: number;
  childbearingAgeRange: { min: number; max: number; average: number };
}

/**
 * Relationship analysis metadata
 */
export interface RelationshipMetadata {
  // Relationship types
  relationshipTypeDistribution: Record<string, number>;

  // Connection strength
  averageRelationshipDistance: number;
  relationshipDistanceDistribution: Record<number, number>;
  maxRelationshipDistance: number;

  // Family complexity
  blendedFamilies: number;
  stepRelationships: number;
  adoptionRate: number;
  multipleMarriages: number;

  // Ancestral patterns
  averageAncestorsPerGeneration: number;
  missingAncestors: number;
  ancestralCompleteness: number; // 0-1 scale
  ancestralDepth: number;

  // Sibling patterns
  averageSiblingsPerFamily: number;
  onlyChildren: number;
  largeSiblingGroups: number; // 5+ siblings

  // Cousin relationships
  cousinRelationships: {
    firstCousins: number;
    secondCousins: number;
    thirdCousins: number;
    distantCousins: number;
  };

  // Relationship centrality
  keyConnectors: string[]; // Individual IDs with most connections
  averageCentrality: number;
  centralityDistribution: Record<string, number>;
}

/**
 * Edge analysis metadata
 */
export interface EdgeAnalysisMetadata {
  // Edge types and counts
  totalEdges: number;
  parentChildEdges: number;
  spouseEdges: number;
  siblingEdges: number;

  // Edge properties
  averageEdgeWeight: number;
  edgeWeightDistribution: Record<string, number>;

  // Relationship strength
  strongRelationships: number; // High-weight edges
  weakRelationships: number; // Low-weight edges

  // Temporal edge properties
  averageRelationshipDuration: number;
  relationshipDurationDistribution: Record<string, number>;

  // Geographic edge properties
  sameCountryRelationships: number;
  crossCountryRelationships: number;
  averageDistanceBetweenSpouses: number;
}

/**
 * Tree summary for quick access
 */
export interface TreeSummary {
  totalIndividuals: number;
  totalFamilies: number;
  timeSpan: string;
  geographicDiversity: string;
  familyComplexity: string;
  averageLifespan: number;
  maxGenerations: number;
}

/**
 * Family metadata fields
 */
export interface FamilyMetadata {
  // Basic metadata
  numberOfChildren: number;

  // Graph-based fields
  familyComplexity?: number;
  blendedFamily?: boolean;
  remarriage?: boolean;
  generation?: number;

  // Geographic fields
  sameCountryParents?: boolean;
  crossCountryMarriage?: boolean;

  // Temporal fields
  marriageYear?: number;
  averageChildAge?: number;
  childSpacing?: number[];
}

/**
 * Enhanced tree metadata with comprehensive analysis
 */
export interface TreeMetadata {
  // Graph structure
  graphStructure: GraphStructureMetadata;

  // Temporal patterns
  temporalPatterns: TemporalMetadata;

  // Geographic patterns
  geographicPatterns: GeographicMetadata;

  // Demographics
  demographics: DemographicMetadata;

  // Relationships
  relationships: RelationshipMetadata;

  // Edges
  edges: Edge[];
  edgeAnalysis: EdgeAnalysisMetadata;

  // Summary statistics for quick access
  summary: TreeSummary;
}

/**
 * Family with metadata attached
 */
export interface FamilyWithMetadata extends Family {
  metadata: FamilyMetadata;
}

/**
 * Complete GEDCOM data with metadata
 */
export interface GedcomDataWithMetadata {
  individuals: AugmentedIndividual[];
  families: FamilyWithMetadata[];
  metadata: TreeMetadata;
}
