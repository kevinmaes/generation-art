import { useEffect, useRef } from 'react';
import p5 from 'p5';

interface ArtGeneratorProps {
	width?: number;
	height?: number;
}

export function ArtGenerator({ width = 800, height = 600 }: ArtGeneratorProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const sketch = (p: p5) => {
			p.setup = () => {
				p.createCanvas(width, height);
				p.background(255);
			};

			p.draw = () => {
				// Example: Draw a circle that follows the mouse
				p.fill(0, 0, 255, 50);
				p.noStroke();
				p.circle(p.mouseX, p.mouseY, 50);
			};
		};

		const p5Instance = new p5(sketch, containerRef.current);

		return () => {
			p5Instance.remove();
		};
	}, [width, height]);

	return <div ref={containerRef} />;
}
