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

export interface ArtGeneratorProps {
  width?: number;
  height?: number;
}
