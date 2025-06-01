import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

interface AugmentedIndividual {
	id: string;
	name: string;
	birthDate?: string;
	deathDate?: string;
	parents: string[];
	spouses: string[];
	children: string[];
	siblings: string[];
}

interface ArtGeneratorProps {
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

export function ArtGenerator({ width = 800, height = 600 }: ArtGeneratorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [data, setData] = useState<AugmentedIndividual[] | null>(null);

	useEffect(() => {
		// Load the augmented JSON data
		fetch('/gedcom-public/kennedy/kennedy-augmented.json')
			.then((res) => res.json())
			.then((jsonData) => {
				console.log('Loaded augmented data:', jsonData);
				setData(jsonData);
			})
			.catch((err) => console.error('Error loading data:', err));
	}, []);

	useEffect(() => {
		if (!containerRef.current || !data) return;

		const sketch = (p: p5) => {
			p.setup = () => {
				p.createCanvas(width, height);
				p.background(255);
			};

			p.draw = () => {
				p.background(255);

				// Draw edges (lines between connected individuals)
				const edges = getUniqueEdges(data);
				for (const [id1, id2] of edges) {
					const coord1 = getIndividualCoord(id1, width, height);
					const coord2 = getIndividualCoord(id2, width, height);
					p.stroke(100, 100, 255, 80);
					p.strokeWeight(2);
					p.line(coord1.x, coord1.y, coord2.x, coord2.y);
				}

				// Draw nodes (individuals)
				for (const ind of data) {
					const { x, y } = getIndividualCoord(ind.id, width, height);
					p.noStroke();
					p.fill(0, 0, 255, 100);
					p.circle(x, y, 30);
					// Uncomment to show names
					// p.fill(0);
					// p.textSize(12);
					// p.textAlign(p.CENTER);
					// p.text(ind.name, x, y + 25);
				}
			};
		};

		const p5Instance = new p5(sketch, containerRef.current);
		return () => {
			p5Instance.remove();
		};
	}, [width, height, data]);

	return <div ref={containerRef} />;
}
