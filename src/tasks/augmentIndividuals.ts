import { readFileSync, writeFileSync } from 'fs';

interface Individual {
	id: string;
	name: string;
	birthDate?: string;
	deathDate?: string;
}

interface Family {
	id: string;
	husband: string;
	wife: string;
	children: string[];
	marriageDate?: string;
}

interface GedcomData {
	individuals: Individual[];
	families: Family[];
}

interface AugmentedIndividual extends Individual {
	parents: string[];
	spouses: string[];
	children: string[];
	siblings: string[];
}

// Get input/output file paths from command line
const inputPath = process.argv[2];
const outputPath =
	process.argv[3] || inputPath.replace('.json', '-augmented.json');

if (!inputPath) {
	console.error(
		'Usage: tsx src/tasks/augmentIndividuals.ts <input.json> [output.json]'
	);
	process.exit(1);
}

const raw = readFileSync(inputPath, 'utf-8');
const data: GedcomData = JSON.parse(raw);

// Build lookup for individuals
const individualsById: Record<string, Individual> = {};
data.individuals.forEach((ind) => {
	individualsById[ind.id] = ind;
});

// Build parent/child/spouse relationships
const parentsMap: Record<string, Set<string>> = {};
const childrenMap: Record<string, Set<string>> = {};
const spousesMap: Record<string, Set<string>> = {};

for (const fam of data.families) {
	// Children
	for (const childId of fam.children) {
		if (!parentsMap[childId]) parentsMap[childId] = new Set();
		if (fam.husband) parentsMap[childId].add(fam.husband);
		if (fam.wife) parentsMap[childId].add(fam.wife);
	}
	// Parents
	if (fam.husband) {
		if (!childrenMap[fam.husband]) childrenMap[fam.husband] = new Set();
		fam.children.forEach((childId) => childrenMap[fam.husband].add(childId));
		if (fam.wife) {
			if (!spousesMap[fam.husband]) spousesMap[fam.husband] = new Set();
			spousesMap[fam.husband].add(fam.wife);
		}
	}
	if (fam.wife) {
		if (!childrenMap[fam.wife]) childrenMap[fam.wife] = new Set();
		fam.children.forEach((childId) => childrenMap[fam.wife].add(childId));
		if (fam.husband) {
			if (!spousesMap[fam.wife]) spousesMap[fam.wife] = new Set();
			spousesMap[fam.wife].add(fam.husband);
		}
	}
}

// Build siblings
const siblingsMap: Record<string, Set<string>> = {};
for (const fam of data.families) {
	for (const childId of fam.children) {
		if (!siblingsMap[childId]) siblingsMap[childId] = new Set();
		fam.children.forEach((sibId) => {
			if (sibId !== childId) siblingsMap[childId].add(sibId);
		});
	}
}

// Augment individuals
const augmented: AugmentedIndividual[] = data.individuals.map((ind) => ({
	...ind,
	parents: Array.from(parentsMap[ind.id] || []),
	spouses: Array.from(spousesMap[ind.id] || []),
	children: Array.from(childrenMap[ind.id] || []),
	siblings: Array.from(siblingsMap[ind.id] || []),
}));

console.time('Execution Time');
writeFileSync(outputPath, JSON.stringify(augmented, null, 2));
console.log(`Augmented data written to ${outputPath}`);
console.timeEnd('Execution Time');
