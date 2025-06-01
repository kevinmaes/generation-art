interface GedcomLine {
	level: number;
	tag: string;
	value: string;
	xref?: string;
}

interface Individual {
	id: string;
	name: string;
	birth?: { date?: string; place?: string };
	death?: { date?: string; place?: string };
}

interface Family {
	id: string;
	husband?: string;
	wife?: string;
	children: string[];
}

export class SimpleGedcomParser {
	private individuals: Map<string, Individual> = new Map();
	private families: Map<string, Family> = new Map();
	private currentIndividual?: Individual;
	private currentFamily?: Family;

	parse(gedcomText: string): { individuals: Individual[]; families: Family[] } {
		console.log('Starting to parse GEDCOM text...');

		// Normalize line endings and split into lines
		const normalizedText = gedcomText
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n');
		const lines = normalizedText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map((line) => this.parseLine(line));

		console.log('Total lines to process:', lines.length);

		let processedLines = 0;
		for (const line of lines) {
			if (!line) continue;
			processedLines++;

			if (processedLines <= 10) {
				console.log('Processing line:', line);
			}

			switch (line.tag) {
				case 'INDI':
					this.handleIndividual(line);
					break;
				case 'FAM':
					this.handleFamily(line);
					break;
				case 'NAME':
					this.handleName(line);
					break;
				case 'BIRT':
					this.handleBirth(line);
					break;
				case 'DEAT':
					this.handleDeath(line);
					break;
				case 'HUSB':
					this.handleHusband(line);
					break;
				case 'WIFE':
					this.handleWife(line);
					break;
				case 'CHIL':
					this.handleChild(line);
					break;
			}
		}

		console.log('Finished processing lines. Found:', {
			individuals: this.individuals.size,
			families: this.families.size,
		});

		return {
			individuals: Array.from(this.individuals.values()),
			families: Array.from(this.families.values()),
		};
	}

	private parseLine(line: string): GedcomLine | null {
		if (!line) return null;

		// Updated regex to handle more GEDCOM line formats
		const match = line.match(/^(\d+)\s+(?:@([^@]+)@\s+)?(\w+)(?:\s+(.+))?$/);
		if (!match) {
			console.log('Failed to parse line:', line);
			return null;
		}

		const [, level, xref, tag, value] = match;
		return {
			level: parseInt(level),
			tag,
			value: value || '',
			xref,
		};
	}

	private handleIndividual(line: GedcomLine) {
		if (line.xref) {
			console.log('Found individual:', line.xref);
			this.currentIndividual = {
				id: line.xref,
				name: '',
			};
			this.individuals.set(line.xref, this.currentIndividual);
		}
	}

	private handleFamily(line: GedcomLine) {
		if (line.xref) {
			console.log('Found family:', line.xref);
			this.currentFamily = {
				id: line.xref,
				children: [],
			};
			this.families.set(line.xref, this.currentFamily);
		}
	}

	private handleName(line: GedcomLine) {
		if (this.currentIndividual) {
			console.log(
				'Setting name for individual:',
				this.currentIndividual.id,
				line.value
			);
			this.currentIndividual.name = line.value;
		}
	}

	private handleBirth(line: GedcomLine) {
		if (this.currentIndividual) {
			console.log(
				'Setting birth for individual:',
				this.currentIndividual.id,
				line.value
			);
			this.currentIndividual.birth = { date: line.value };
		}
	}

	private handleDeath(line: GedcomLine) {
		if (this.currentIndividual) {
			console.log(
				'Setting death for individual:',
				this.currentIndividual.id,
				line.value
			);
			this.currentIndividual.death = { date: line.value };
		}
	}

	private handleHusband(line: GedcomLine) {
		if (this.currentFamily) {
			console.log(
				'Setting husband for family:',
				this.currentFamily.id,
				line.value
			);
			this.currentFamily.husband = line.value;
		}
	}

	private handleWife(line: GedcomLine) {
		if (this.currentFamily) {
			console.log(
				'Setting wife for family:',
				this.currentFamily.id,
				line.value
			);
			this.currentFamily.wife = line.value;
		}
	}

	private handleChild(line: GedcomLine) {
		if (this.currentFamily) {
			console.log('Adding child to family:', this.currentFamily.id, line.value);
			this.currentFamily.children.push(line.value);
		}
	}
}
