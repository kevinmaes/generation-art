import { useState, useEffect } from 'react';

export function GedcomParserComponent() {
	const [gedcomContent, setGedcomContent] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadGedcom() {
			try {
				setLoading(true);
				setError(null);

				// Fetch the GEDCOM file
				const response = await fetch('/gedcom-public/kennedy/kennedy.ged');
				if (!response.ok) {
					throw new Error(
						`Failed to fetch GEDCOM file: ${response.statusText}`
					);
				}

				const text = await response.text();
				setGedcomContent(text);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		}

		loadGedcom();
	}, []);

	if (loading) return <div>Loading GEDCOM file...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!gedcomContent) return <div>No content loaded</div>;

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">GEDCOM File Content</h1>
			<pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
				{gedcomContent}
			</pre>
		</div>
	);
}
