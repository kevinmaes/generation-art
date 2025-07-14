import { readdir, readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, basename, extname } from 'path';
import { SimpleGedcomParser } from '../parsers/SimpleGedcomParser';

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

interface BuildConfig {
  inputDir: string;
  outputDir: string;
  mediaDir: string;
}

// Extract augmentation logic from the existing script
function augmentIndividuals(data: GedcomData): AugmentedIndividual[] {
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
      parentsMap[childId] = new Set();
      parentsMap[childId].add(fam.husband);
      parentsMap[childId].add(fam.wife);
    }
    // Parents
    if (fam.husband) {
      childrenMap[fam.husband] ??= new Set();
      fam.children.forEach((childId) => childrenMap[fam.husband].add(childId));
      if (fam.wife) {
        spousesMap[fam.husband] ??= new Set();
        spousesMap[fam.husband].add(fam.wife);
      }
    }
    if (fam.wife) {
      childrenMap[fam.wife] ??= new Set();
      fam.children.forEach((childId) => childrenMap[fam.wife].add(childId));
      if (fam.husband) {
        spousesMap[fam.wife] ??= new Set();
        spousesMap[fam.wife].add(fam.husband);
      }
    }
  }

  // Build siblings
  const siblingsMap: Record<string, Set<string>> = {};
  for (const fam of data.families) {
    for (const childId of fam.children) {
      siblingsMap[childId] ??= new Set();
      fam.children.forEach((sibId) => {
        if (sibId !== childId) siblingsMap[childId].add(sibId);
      });
    }
  }

  // Augment individuals
  const augmented: AugmentedIndividual[] = data.individuals.map((ind) => ({
    ...ind,
    parents: Array.from(parentsMap[ind.id] ?? new Set()),
    spouses: Array.from(spousesMap[ind.id] ?? new Set()),
    children: Array.from(childrenMap[ind.id] ?? new Set()),
    siblings: Array.from(siblingsMap[ind.id] ?? new Set()),
  }));

  // Assign generation numbers to individuals
  function assignGenerations(
    individuals: AugmentedIndividual[],
    primaryId: string,
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
      const id = queue.shift() ?? '';
      const gen = genMap[id];
      const ind = individualsById[id];
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

  // Assign relativeGenerationValue (opacity) based on generation distance
  function assignRelativeGenerationValue(
    individuals: AugmentedIndividual[],
  ): void {
    // Filter out individuals without a generation
    const gens = individuals
      .map((ind) => ind.generation)
      .filter((g) => g !== null && g !== undefined);
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

  // Find a primary individual (first one with children or first one available)
  const primaryIndividual =
    augmented.find((ind) => ind.children.length > 0) ?? augmented[0];
  const PRIMARY_ID = primaryIndividual?.id ?? 'I1';

  assignGenerations(augmented, PRIMARY_ID);
  assignRelativeGenerationValue(augmented);

  return augmented;
}

async function buildGedcomFiles(
  config: BuildConfig,
  singleFile?: string,
): Promise<void> {
  const { inputDir, outputDir, mediaDir } = config;

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(mediaDir, { recursive: true });

  try {
    // Check if input directory exists
    try {
      await access(inputDir);
    } catch {
      console.log(`Input directory ${inputDir} does not exist. Creating it...`);
      await mkdir(inputDir, { recursive: true });
      console.log(
        `Created ${inputDir}. Please add your GEDCOM files to this directory.`,
      );
      return;
    }

    let gedcomFiles: string[] = [];
    if (singleFile) {
      // Only process the specified file
      gedcomFiles = [singleFile];
      console.log(`Processing single GEDCOM file: ${singleFile}`);
    } else {
      // Process all .ged files
      const files = await readdir(inputDir);
      gedcomFiles = files.filter((file) => extname(file) === '.ged');
      if (gedcomFiles.length === 0) {
        console.log(`No GEDCOM files found in ${inputDir}`);
        console.log(`Please add .ged files to the ${inputDir} directory`);
        return;
      }
      console.log(`Found ${gedcomFiles.length} GEDCOM files to process:`);
      gedcomFiles.forEach((file) => console.log(`  - ${file}`));
      console.log('');
    }

    for (const file of gedcomFiles) {
      const baseName = basename(file, '.ged');
      const inputPath = join(inputDir, file);
      const outputPath = join(outputDir, `${baseName}.json`);
      const augmentedPath = join(outputDir, `${baseName}-augmented.json`);

      console.log(`Processing ${file}...`);

      try {
        // Read and parse GEDCOM
        const gedcomText = await readFile(inputPath, 'utf-8');
        const parser = new SimpleGedcomParser();
        const parsedData = parser.parse(gedcomText);

        // Write parsed JSON
        await writeFile(outputPath, JSON.stringify(parsedData, null, 2));
        console.log(
          `  ✓ Generated ${baseName}.json (${parsedData.individuals.length} individuals, ${parsedData.families.length} families)`,
        );

        // Generate augmented data
        const augmentedData = augmentIndividuals(parsedData);
        await writeFile(augmentedPath, JSON.stringify(augmentedData, null, 2));
        console.log(`  ✓ Generated ${baseName}-augmented.json`);

        // Check for media directory
        const mediaDirPath = join(inputDir, `${baseName} Media`);
        try {
          await access(mediaDirPath);
          console.log(`  ℹ Found media directory: ${baseName} Media`);
          // TODO: Copy media files to generated/media if needed
        } catch {
          // No media directory, that's fine
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${file}:`, error);
      }
    }

    console.log('\nGEDCOM build complete!');
    console.log(`Generated files are in: ${outputDir}`);
  } catch (error) {
    console.error('Error building GEDCOM files:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: BuildConfig = {
    inputDir: 'gedcom',
    outputDir: 'generated/parsed',
    mediaDir: 'generated/media',
  };
  // Accept an optional filename argument
  const singleFile = process.argv[2];
  buildGedcomFiles(config, singleFile);
}

export { buildGedcomFiles };
