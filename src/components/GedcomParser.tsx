import { useState, useEffect } from 'react';
import { ReadGed } from 'gedcom-ts';

export function GedcomParserComponent() {
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadAndParseGedcom() {
			try {
				setStatus('loading');
				setError(null);

				// Fetch the GEDCOM file
				const response = await fetch('/gedcom-public/kennedy/kennedy.ged');
				if (!response.ok) {
					throw new Error(
						`Failed to fetch GEDCOM file: ${response.statusText}`
					);
				}
				const gedcomText = await response.text();

				// Log the GEDCOM text length and a sample
				console.log('GEDCOM text length:', gedcomText.length);
				console.log('GEDCOM text sample:', gedcomText.substring(0, 200));

				// Check if the GEDCOM text starts with the expected header
				if (!gedcomText.startsWith('0 HEAD')) {
					throw new Error(
						'GEDCOM file does not start with the expected header.'
					);
				}

				// Preprocess the GEDCOM text to ensure it's formatted correctly
				const preprocessedGedcomText = gedcomText
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line.length > 0)
					.join('\n');

				// Parse the GEDCOM file
				let parser;
				try {
					parser = new ReadGed(preprocessedGedcomText);
					parser.peoples = []; // Initialize peoples as an empty array
					console.log('Parser after construction:', parser);
					console.log('Parser properties:', {
						peoples: parser.peoples,
						partnersMap: parser.partnersMap,
						childsMap: parser.childsMap,
					});
				} catch (parserError) {
					console.error('Error during parser construction:', parserError);
					throw parserError;
				}

				// Call import() and log the return value
				try {
					const importedData = parser.import();
					console.log('Imported data:', importedData);
				} catch (importError) {
					console.error('Error during import:', importError);
					throw importError;
				}

				setStatus('success');
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
				setStatus('error');
			}
		}

		loadAndParseGedcom();
	}, []);

	if (status === 'loading')
		return <div>Loading and parsing GEDCOM file...</div>;
	if (status === 'error') return <div>Error: {error}</div>;
	if (status === 'success')
		return <div>GEDCOM file parsed! Check the console for output.</div>;

	return null;
}
