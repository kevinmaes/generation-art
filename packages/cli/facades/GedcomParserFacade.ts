import { ReadGed } from 'gedcom-ts';
import { SimpleGedcomParser } from '../parsers/SimpleGedcomParser';
import type { Individual, Family, GedcomData } from '@generation-art/types';

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
    const individualsArray: Individual[] = importedData.map((person) => ({
      id: person.id as string,
      name: person.name as string,
      birth: person.birth as { date?: string; place?: string },
      death: person.death as { date?: string; place?: string },
      parents: Array.isArray(person.parents)
        ? (person.parents as string[])
        : [],
      spouses: Array.isArray(person.spouses)
        ? (person.spouses as string[])
        : [],
      children: Array.isArray(person.children)
        ? (person.children as string[])
        : [],
      siblings: Array.isArray(person.siblings)
        ? (person.siblings as string[])
        : [],
    }));

    const familiesArray: Family[] = importedData.map((person) => ({
      id: person.id as string,
      husband: undefined, // Will be resolved later
      wife: undefined, // Will be resolved later
      children: [], // Will be resolved later
    }));

    // Convert arrays to ID-keyed objects
    const individuals: Record<string, Individual> = {};
    individualsArray.forEach((individual) => {
      individuals[individual.id] = individual;
    });

    const families: Record<string, Family> = {};
    familiesArray.forEach((family) => {
      families[family.id] = family;
    });

    return { individuals, families };
  }
}

// Concrete Implementation for SimpleGedcomParser
export class SimpleGedcomParserFacade implements GedcomParserFacade {
  parse(gedcomText: string): GedcomData {
    const parser = new SimpleGedcomParser();
    const parsedData = parser.parse(gedcomText);

    // Convert the parsed data to match our GedcomData interface
    const individualsArray: Individual[] = parsedData.individuals.map(
      (ind) => ({
        id: ind.id,
        name: ind.name,
        birth: { date: ind.birthDate },
        death: { date: ind.deathDate },
        parents: [], // SimpleGedcomParser doesn't track parents
        spouses: [], // SimpleGedcomParser doesn't track spouses
        children: [], // SimpleGedcomParser doesn't track children
        siblings: [], // SimpleGedcomParser doesn't track siblings
      }),
    );

    const familiesArray: Family[] = parsedData.families.map((fam) => ({
      id: fam.id,
      husband: fam.husband
        ? individualsArray.find((ind) => ind.id === fam.husband)
        : undefined,
      wife: fam.wife
        ? individualsArray.find((ind) => ind.id === fam.wife)
        : undefined,
      children: fam.children
        .map((childId) => individualsArray.find((ind) => ind.id === childId))
        .filter((ind): ind is Individual => ind !== undefined),
    }));

    // Convert arrays to ID-keyed objects
    const individuals: Record<string, Individual> = {};
    individualsArray.forEach((individual) => {
      individuals[individual.id] = individual;
    });

    const families: Record<string, Family> = {};
    familiesArray.forEach((family) => {
      families[family.id] = family;
    });

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
