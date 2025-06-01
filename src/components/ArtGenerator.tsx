import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

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

interface ArtGeneratorProps {
	width?: number;
	height?: number;
}

export function ArtGenerator({ width = 800, height = 600 }: ArtGeneratorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [data, setData] = useState<GedcomData | null>(null);

	useEffect(() => {
		// Load the JSON data
		fetch('/gedcom-public/kennedy/kennedy.json')
			.then((res) => res.json())
			.then((jsonData) => {
				console.log('Loaded data:', jsonData);
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

				// Hash function to map ID to (x, y)
				function hashToCoord(id: string, width: number, height: number) {
					let hash = 5381;
					for (let i = 0; i < id.length; i++) {
						hash = (hash << 5) + hash + id.charCodeAt(i);
					}
					// Use two different hashes for x and y
					const x = (((hash >>> 0) % 1000) / 1000) * width * 0.8 + width * 0.1;
					const y =
						((((hash * 31) >>> 0) % 1000) / 1000) * height * 0.8 + height * 0.1;
					return { x, y };
				}

				// Draw each individual as a circle
				data.individuals.forEach((individual) => {
					const { x, y } = hashToCoord(individual.id, width, height);

					// Draw circle
					p.fill(0, 0, 255, 100);
					p.noStroke();
					p.circle(x, y, 30);

					// Name (uncomment if needed)
					// p.fill(0);
					// p.textSize(12);
					// p.textAlign(p.CENTER);
					// p.text(individual.name, x, y + 25);
				});
			};
		};

		const p5Instance = new p5(sketch, containerRef.current);

		return () => {
			p5Instance.remove();
		};
	}, [width, height, data]);

	return <div ref={containerRef} />;
}
