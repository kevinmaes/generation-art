export interface DimensionConfig {
  id: string;
  label: string;
  description: string;
  dataSource:
    | 'Individual'
    | 'Individual metadata'
    | 'Family'
    | 'Family metadata'
    | 'Edge metadata'
    | 'Global metadata';
  category:
    | 'Time-Based'
    | 'Family Structure'
    | 'Geographic'
    | 'Social/Cultural'
    | 'Relationship';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  implementationStatus: 'Implemented' | 'Planned' | 'Future';
}

export const DIMENSIONS: Record<string, DimensionConfig> = {
  // P0 - High Priority, Already Implemented
  generation: {
    id: 'generation',
    label: 'Generation',
    description: "Individual's generation depth from root ancestor",
    dataSource: 'Individual metadata',
    category: 'Family Structure',
    priority: 'P0',
    implementationStatus: 'Implemented',
  },
  birthYear: {
    id: 'birthYear',
    label: 'Birth Year',
    description: 'Year of birth extracted from birth date',
    dataSource: 'Individual',
    category: 'Time-Based',
    priority: 'P0',
    implementationStatus: 'Implemented',
  },
  childrenCount: {
    id: 'childrenCount',
    label: 'Children Count',
    description: 'Number of children the individual has',
    dataSource: 'Individual',
    category: 'Family Structure',
    priority: 'P0',
    implementationStatus: 'Implemented',
  },

  // P1 - High Priority, Planned
  lifespan: {
    id: 'lifespan',
    label: 'Lifespan',
    description: 'Age at death or current age if living',
    dataSource: 'Individual metadata',
    category: 'Time-Based',
    priority: 'P1',
    implementationStatus: 'Implemented',
  },
  nameLength: {
    id: 'nameLength',
    label: 'Name Length',
    description: "Length of individual's full name",
    dataSource: 'Individual',
    category: 'Social/Cultural',
    priority: 'P1',
    implementationStatus: 'Planned',
  },
  distanceFromRoot: {
    id: 'distanceFromRoot',
    label: 'Distance from Root',
    description: 'Number of generations from the root ancestor',
    dataSource: 'Individual metadata',
    category: 'Family Structure',
    priority: 'P1',
    implementationStatus: 'Planned',
  },
  ageAtFirstMarriage: {
    id: 'ageAtFirstMarriage',
    label: 'Age at First Marriage',
    description: 'Age when individual first married',
    dataSource: 'Individual',
    category: 'Social/Cultural',
    priority: 'P1',
    implementationStatus: 'Planned',
  },
  birthOrder: {
    id: 'birthOrder',
    label: 'Birth Order',
    description: 'Position among siblings (1st, 2nd, etc.)',
    dataSource: 'Individual metadata',
    category: 'Family Structure',
    priority: 'P1',
    implementationStatus: 'Planned',
  },
  marriageCount: {
    id: 'marriageCount',
    label: 'Marriage Count',
    description: 'Number of marriages the individual had',
    dataSource: 'Individual',
    category: 'Social/Cultural',
    priority: 'P1',
    implementationStatus: 'Planned',
  },

  // P2 - Medium Priority, Future
  nameAlphabetical: {
    id: 'nameAlphabetical',
    label: 'Name Alphabetical',
    description: 'Alphabetical position of name within generation',
    dataSource: 'Individual',
    category: 'Social/Cultural',
    priority: 'P2',
    implementationStatus: 'Future',
  },
  siblingPosition: {
    id: 'siblingPosition',
    label: 'Sibling Position',
    description: 'Position among siblings in family',
    dataSource: 'Family metadata',
    category: 'Family Structure',
    priority: 'P2',
    implementationStatus: 'Future',
  },
  birthLocationLong: {
    id: 'birthLocationLong',
    label: 'Birth Location (Longitude)',
    description: 'Longitude of birth location',
    dataSource: 'Individual',
    category: 'Geographic',
    priority: 'P2',
    implementationStatus: 'Future',
  },
  birthLocationLat: {
    id: 'birthLocationLat',
    label: 'Birth Location (Latitude)',
    description: 'Latitude of birth location',
    dataSource: 'Individual',
    category: 'Geographic',
    priority: 'P2',
    implementationStatus: 'Future',
  },
  familyBranch: {
    id: 'familyBranch',
    label: 'Family Branch',
    description: 'Which major family branch the individual belongs to',
    dataSource: 'Family metadata',
    category: 'Family Structure',
    priority: 'P2',
    implementationStatus: 'Future',
  },

  // P3 - Low Priority, Future
  titleStatus: {
    id: 'titleStatus',
    label: 'Title/Status',
    description: 'Noble titles, professions, or social status',
    dataSource: 'Individual',
    category: 'Social/Cultural',
    priority: 'P3',
    implementationStatus: 'Future',
  },
  migrationDistance: {
    id: 'migrationDistance',
    label: 'Migration Distance',
    description: 'Distance migrated from birthplace',
    dataSource: 'Individual',
    category: 'Geographic',
    priority: 'P3',
    implementationStatus: 'Future',
  },
  relationshipDensity: {
    id: 'relationshipDensity',
    label: 'Relationship Density',
    description: 'Number of connections to other individuals',
    dataSource: 'Edge metadata',
    category: 'Relationship',
    priority: 'P3',
    implementationStatus: 'Future',
  },
} as const;

export type DimensionId = keyof typeof DIMENSIONS;

// Helper function to get available dimensions by priority
export const getDimensionsByPriority = (
  priority: DimensionConfig['priority'],
) => {
  return Object.values(DIMENSIONS).filter((dim) => dim.priority === priority);
};

// Helper function to get implemented dimensions
export const getImplementedDimensions = () => {
  return Object.values(DIMENSIONS).filter(
    (dim) => dim.implementationStatus === 'Implemented',
  );
};

// Helper function to get dimensions by category
export const getDimensionsByCategory = (
  category: DimensionConfig['category'],
) => {
  return Object.values(DIMENSIONS).filter((dim) => dim.category === category);
};
