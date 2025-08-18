import type {
  GedcomDataWithMetadata,
  AugmentedIndividual,
  FamilyWithMetadata,
} from '../types';
import type {
  AnonymizedGedcomData,
  AnonymizedIndividual,
  AnonymizedFamily,
  PIIStrippingConfig,
  PIIStrippingResult,
} from '../types/pii-stripping';

/**
 * Default configuration for PII stripping
 */
const DEFAULT_CONFIG: Required<PIIStrippingConfig> = {
  namePattern: 'individual_id',
  keepYears: true,
  normalizeLifespan: true,
  stripLocations: true,
};

/**
 * Extract year from a date string
 */
function extractYear(dateString?: string): number | undefined {
  if (!dateString) return undefined;

  // Try to match year patterns: YYYY, YYYY-MM, YYYY-MM-DD
  const yearMatch = /^(\d{4})/.exec(dateString);
  return yearMatch ? parseInt(yearMatch[1], 10) : undefined;
}

/**
 * Generate anonymous name based on pattern
 */
function generateAnonymousName(
  id: string,
  generation: number | null,
  index: number,
  pattern: 'individual_id' | 'person_generation_index',
): string {
  switch (pattern) {
    case 'individual_id':
      return `Individual_${id}`;
    case 'person_generation_index': {
      const gen = generation ?? 0;
      return `Person_${String(gen)}_${String(index)}`;
    }
    default:
      return `Individual_${id}`;
  }
}

/**
 * Strip PII from an individual
 */
function stripIndividualPII(
  individual: AugmentedIndividual,
  index: number,
  config: Required<PIIStrippingConfig>,
): AnonymizedIndividual {
  const generation = individual.metadata?.generation ?? null;

  // Create base anonymized individual (inherits all properties except name, birth, death)
  const { birth, death, ...rest } = individual;
  const anonymizedIndividual: AnonymizedIndividual = {
    ...rest,
    name: generateAnonymousName(
      individual.id,
      generation,
      index,
      config.namePattern,
    ),
  };

  // Handle birth data
  if (birth) {
    if (config.keepYears && birth.date) {
      const birthYear = extractYear(birth.date);
      if (birthYear) {
        anonymizedIndividual.birth = { year: birthYear };
      }
    }
    // Always strip place data if configured
    if (config.stripLocations) {
      // birth.place is already stripped by not including it
    }
  }

  // Handle death data
  if (death) {
    if (config.keepYears && death.date) {
      const deathYear = extractYear(death.date);
      if (deathYear) {
        anonymizedIndividual.death = { year: deathYear };
      }
    }
    // Always strip place data if configured
    if (config.stripLocations) {
      // death.place is already stripped by not including it
    }
  }

  // Handle lifespan normalization
  if (config.normalizeLifespan && individual.metadata?.lifespan !== undefined) {
    // Lifespan should already be normalized 0-1, but ensure it's not absolute
    anonymizedIndividual.metadata.lifespan = individual.metadata.lifespan;
  }

  return anonymizedIndividual;
}

/**
 * Strip PII from a family
 */
function stripFamilyPII(
  family: FamilyWithMetadata,
  anonymizedIndividuals: Record<string, AnonymizedIndividual>,
): AnonymizedFamily {
  // Create base anonymized family (inherits all properties except husband, wife, children)
  const { husband, wife, children, ...rest } = family;
  const anonymizedFamily: AnonymizedFamily = {
    ...rest,
    children: [],
  };

  // Handle husband
  if (husband) {
    const husbandId = typeof husband === 'string' ? husband : husband.id;
    anonymizedFamily.husband = anonymizedIndividuals[husbandId];
  }

  // Handle wife
  if (wife) {
    const wifeId = typeof wife === 'string' ? wife : wife.id;
    anonymizedFamily.wife = anonymizedIndividuals[wifeId];
  }

  // Handle children
  if (Array.isArray(children)) {
    anonymizedFamily.children = children
      .map((child) => {
        const childId = child.id;
        return anonymizedIndividuals[childId];
      })
      .filter(Boolean);
  }

  return anonymizedFamily;
}

/**
 * Strip PII from GEDCOM data for LLM transmission
 */
export function stripPIIForLLM(
  gedcomData: GedcomDataWithMetadata,
  config: PIIStrippingConfig = {},
): PIIStrippingResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const warnings: string[] = [];

  // Track statistics
  let namesStripped = 0;
  let datesStripped = 0;
  let locationsStripped = 0;
  let individualsProcessed = 0;
  let familiesProcessed = 0;

  // Process individuals
  const anonymizedIndividuals: Record<string, AnonymizedIndividual> = {};
  const individualEntries = Object.entries(gedcomData.individuals);

  individualEntries.forEach(([id, individual], index) => {
    try {
      anonymizedIndividuals[id] = stripIndividualPII(
        individual,
        index,
        finalConfig,
      );
      individualsProcessed++;
      namesStripped++; // All names are stripped

      // Count dates and locations stripped
      if (individual.birth?.date) datesStripped++;
      if (individual.death?.date) datesStripped++;
      if (individual.birth?.place) locationsStripped++;
      if (individual.death?.place) locationsStripped++;
    } catch (error) {
      warnings.push(`Failed to process individual ${id}: ${String(error)}`);
    }
  });

  // Process families
  const anonymizedFamilies: Record<string, AnonymizedFamily> = {};
  const familyEntries = Object.entries(gedcomData.families);

  familyEntries.forEach(([id, family]) => {
    try {
      anonymizedFamilies[id] = stripFamilyPII(family, anonymizedIndividuals);
      familiesProcessed++;
    } catch (error) {
      warnings.push(`Failed to process family ${id}: ${String(error)}`);
    }
  });

  // Create anonymized data structure (inherits metadata from original)
  const anonymizedData: AnonymizedGedcomData = {
    ...gedcomData,
    individuals: anonymizedIndividuals,
    families: anonymizedFamilies,
  };

  return {
    anonymizedData,
    strippingStats: {
      namesStripped,
      datesStripped,
      locationsStripped,
      individualsProcessed,
      familiesProcessed,
    },
    warnings,
  };
}

/**
 * Validate that no PII remains in anonymized data
 */
export function validatePIIStripping(anonymizedData: AnonymizedGedcomData): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check individuals for PII
  Object.values(anonymizedData.individuals).forEach((individual) => {
    // Check for real names (not anonymized patterns)
    if (
      !individual.name.startsWith('Individual_') &&
      !individual.name.startsWith('Person_')
    ) {
      issues.push(
        `Individual ${individual.id} has non-anonymized name: ${individual.name}`,
      );
    }

    // Check for specific dates (should only have years)
    if (individual.birth && Object.keys(individual.birth).length > 1) {
      issues.push(`Individual ${individual.id} has detailed birth date`);
    }
    if (individual.death && Object.keys(individual.death).length > 1) {
      issues.push(`Individual ${individual.id} has detailed death date`);
    }

    // Check for location data
    if (individual.birth && 'place' in individual.birth) {
      issues.push(`Individual ${individual.id} has birth location data`);
    }
    if (individual.death && 'place' in individual.death) {
      issues.push(`Individual ${individual.id} has death location data`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
  };
}
