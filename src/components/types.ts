import type { Individual } from '../facades/GedcomParserFacade';

/**
 * Augmented individual data type, extends the Individual type from the GedcomParserFacade
 * Includes additional fields for graph visualization or art generation
 */
export interface AugmentedIndividual extends Individual {
  birth: {
    date?: string;
    place?: string;
  };
  death: {
    date?: string;
    place?: string;
  };
  parents: string[];
  spouses: string[];
  children: string[];
  siblings: string[];
  relativeGenerationValue?: number;
}
