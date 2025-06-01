import { ReadGed } from 'gedcom-ts';

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
	parse(gedcomText: string): Promise<GedcomData>;
}

// Concrete Implementation for gedcom-ts
export class GedcomTsParserFacade implements GedcomParserFacade {
	async parse(gedcomText: string): Promise<GedcomData> {
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

// Factory to instantiate the appropriate facade
export class GedcomParserFactory {
	static createParser(type: string): GedcomParserFacade {
		switch (type) {
			case 'gedcom-ts':
				return new GedcomTsParserFacade();
			// Add cases for other parser libraries
			default:
				throw new Error(`Unsupported parser type: ${type}`);
		}
	}
}
