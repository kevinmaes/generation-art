import { ReadGed } from 'gedcom-ts';
import { SimpleGedcomParser } from '../parsers/SimpleGedcomParser';

// Define specific types for individuals and families
export interface Individual {
  id: string;
  name: string;
  birth?: { date?: string; place?: string };
  death?: { date?: string; place?: string };
}

export interface Family {
  id: string;
  husband?: Individual;
  wife?: Individual;
  children: Individual[];
}

// Define a type for the parsed GEDCOM data
export interface GedcomData {
  individuals: Individual[];
  families: Family[];
}

// Facade Interface
export interface GedcomParserFacade {
  parse(gedcomText: string): GedcomData;
}

// Concrete Implementation for gedcom-ts
export class GedcomTsParserFacade implements GedcomParserFacade {
  parse(gedcomText: string): GedcomData {
    const parser = new ReadGed(gedcomText);
    parser.peoples = []; // Initialize peoples as an empty array
    const importedData = parser.import() as unknown as Record<
      string,
      unknown
    >[];

    // Map importedData to GedcomData
    const individuals: Individual[] = importedData.map((person) => ({
      id: person.id as string,
      name: person.name as string,
      birth: person.birth as { date?: string; place?: string },
      death: person.death as { date?: string; place?: string },
    }));

    const families: Family[] = importedData.map((person) => ({
      id: person.id as string,
      husband: person.husband as Individual,
      wife: person.wife as Individual,
      children: person.children as Individual[],
    }));

    return { individuals, families };
  }
}

// Concrete Implementation for SimpleGedcomParser
export class SimpleGedcomParserFacade implements GedcomParserFacade {
  parse(gedcomText: string): GedcomData {
    const parser = new SimpleGedcomParser();
    const parsedData = parser.parse(gedcomText);

    // Convert the parsed data to match our GedcomData interface
    const individuals: Individual[] = parsedData.individuals.map((ind) => ({
      id: ind.id,
      name: ind.name,
      birth: { date: ind.birthDate },
      death: { date: ind.deathDate },
    }));

    const families: Family[] = parsedData.families.map((fam) => ({
      id: fam.id,
      husband: fam.husband
        ? individuals.find((ind) => ind.id === fam.husband)
        : undefined,
      wife: fam.wife
        ? individuals.find((ind) => ind.id === fam.wife)
        : undefined,
      children: fam.children
        .map((childId) => individuals.find((ind) => ind.id === childId))
        .filter((ind): ind is Individual => ind !== undefined),
    }));

    return { individuals, families };
  }
}

// Factory to instantiate the appropriate facade
export function createGedcomParser(type: string): GedcomParserFacade {
  switch (type) {
    case 'gedcom-ts':
      return new GedcomTsParserFacade();
    case 'simple':
      return new SimpleGedcomParserFacade();
    default:
      throw new Error(`Unsupported parser type: ${type}`);
  }
}
