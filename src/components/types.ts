/**
 * Augmented individual data type
 * Includes additional fields for graph visualization or art generation
 */
export interface AugmentedIndividual {
  id: string;
  name: string;
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
