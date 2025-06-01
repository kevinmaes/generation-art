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

// Pure function to calculate coordinates for an individual
export function getIndividualCoord(id: string, width: number, height: number) {
	let hash = 5381;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) + hash + id.charCodeAt(i);
	}
	const x = (((hash >>> 0) % 1000) / 1000) * width * 0.8 + width * 0.1;
	const y = ((((hash * 31) >>> 0) % 1000) / 1000) * height * 0.8 + height * 0.1;
	return { x, y };
}

// Pure function to generate unique edges between individuals
export function getUniqueEdges(
	individuals: AugmentedIndividual[]
): [string, string][] {
	const edges = new Set<string>();
	const result: [string, string][] = [];
	for (const ind of individuals) {
		const connections = new Set([
			...ind.parents,
			...ind.spouses,
			...ind.children,
			...ind.siblings,
		]);
		for (const relId of connections) {
			if (relId === ind.id) continue;
			const key = [ind.id, relId].sort().join('|');
			if (!edges.has(key)) {
				edges.add(key);
				result.push([ind.id, relId]);
			}
		}
	}
	return result;
}
