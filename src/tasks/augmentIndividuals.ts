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
	generation?: number | null;
	relativeGenerationValue?: number;
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

// Assign generation numbers to individuals
function assignGenerations(
	individuals: AugmentedIndividual[],
	primaryId: string
): void {
	const genMap: Record<string, number> = {};
	const queue: string[] = [];
	genMap[primaryId] = 0;
	queue.push(primaryId);
	const individualsById: Record<string, AugmentedIndividual> = {};
	individuals.forEach((ind) => {
		individualsById[ind.id] = ind;
	});

	while (queue.length > 0) {
		const id = queue.shift()!;
		const gen = genMap[id];
		const ind = individualsById[id];
		if (!ind) continue;
		for (const parentId of ind.parents) {
			if (!(parentId in genMap)) {
				genMap[parentId] = gen - 1;
				queue.push(parentId);
			}
		}
		for (const childId of ind.children) {
			if (!(childId in genMap)) {
				genMap[childId] = gen + 1;
				queue.push(childId);
			}
		}
		for (const spouseId of ind.spouses) {
			if (!(spouseId in genMap)) {
				genMap[spouseId] = gen;
				queue.push(spouseId);
			}
		}
	}
	// Assign generation to each individual
	for (const ind of individuals) {
		ind.generation = genMap[ind.id] ?? null;
	}
}

// After augmenting individuals, assign generations
// You may want to set this to the ID of John F Kennedy or another primary individual
const PRIMARY_ID = 'I3124430248'; // TODO: Set to the actual primary individual's ID
assignGenerations(augmented, PRIMARY_ID);

// Assign relativeGenerationValue (opacity) based on generation distance
function assignRelativeGenerationValue(individuals: AugmentedIndividual[]) {
	// Filter out individuals without a generation
	const gens = individuals
		.map((ind) => ind.generation)
		.filter((g) => g !== null && g !== undefined) as number[];
	if (gens.length === 0) return;
	const minGen = Math.min(...gens);
	const maxGen = Math.max(...gens);
	const maxAbsGen = Math.max(Math.abs(minGen), Math.abs(maxGen));

	for (const ind of individuals) {
		if (ind.generation === null || ind.generation === undefined) {
			ind.relativeGenerationValue = 10;
			continue;
		}
		if (maxAbsGen === 0) {
			ind.relativeGenerationValue = 100;
		} else {
			// Linear interpolation: 0 -> 100, farthest -> 10
			const rel = Math.abs(ind.generation) / maxAbsGen;
			ind.relativeGenerationValue = Math.round(100 - rel * 90);
		}
	}
}

assignRelativeGenerationValue(augmented);

console.time('Execution Time');
writeFileSync(outputPath, JSON.stringify(augmented, null, 2));
console.log(`Augmented data written to ${outputPath}`);
console.timeEnd('Execution Time');
