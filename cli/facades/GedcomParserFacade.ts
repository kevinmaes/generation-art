import { ReadGed } from 'gedcom-ts';
import { SimpleGedcomParser } from '../parsers/SimpleGedcomParser';
import type { Individual, Family, GedcomData } from '../../shared/types';
import { createIndividualId, createFamilyId } from '../../shared/types';

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
      id: createIndividualId(person.id as string),
      name: person.name as string,
      birth: person.birth as { date?: string; place?: string },
      death: person.death as { date?: string; place?: string },
      parents: Array.isArray(person.parents)
        ? (person.parents as string[]).map((id) => createIndividualId(id))
        : [],
      spouses: Array.isArray(person.spouses)
        ? (person.spouses as string[]).map((id) => createIndividualId(id))
        : [],
      children: Array.isArray(person.children)
        ? (person.children as string[]).map((id) => createIndividualId(id))
        : [],
      siblings: Array.isArray(person.siblings)
        ? (person.siblings as string[]).map((id) => createIndividualId(id))
        : [],
    }));

    const families: Family[] = importedData.map((person) => ({
      id: createFamilyId(person.id as string),
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
      id: createIndividualId(ind.id),
      name: ind.name,
      birth: { date: ind.birthDate },
      death: { date: ind.deathDate },
      parents: [], // SimpleGedcomParser doesn't track parents
      spouses: [], // SimpleGedcomParser doesn't track spouses
      children: [], // SimpleGedcomParser doesn't track children
      siblings: [], // SimpleGedcomParser doesn't track siblings
    }));

    const families: Family[] = parsedData.families.map((fam) => ({
      id: createFamilyId(fam.id),
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
