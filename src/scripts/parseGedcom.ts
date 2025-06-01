import { readFileSync, writeFileSync } from 'fs';
import { SimpleGedcomParser } from '../parsers/SimpleGedcomParser';

// Get the file path from command line arguments
const filePath = process.argv[2];
if (!filePath) {
	console.error('Please provide a GEDCOM file path');
	process.exit(1);
}

try {
	// Read the GEDCOM file
	console.log(`Reading GEDCOM file: ${filePath}`);
	const gedcomText = readFileSync(filePath, 'utf-8');

	// Parse the GEDCOM file
	console.log('Parsing GEDCOM file...');
	const parser = new SimpleGedcomParser();
	const result = parser.parse(gedcomText);

	// Write the result to a JSON file
	const outputPath = filePath.replace('.ged', '.json');
	console.log(`Writing results to: ${outputPath}`);
	writeFileSync(outputPath, JSON.stringify(result, null, 2));

	// Print summary
	console.log('\nParsing complete!');
	console.log(
		`Found ${result.individuals.length} individuals and ${result.families.length} families`
	);
} catch (error) {
	console.error('Error:', error);
	process.exit(1);
}
