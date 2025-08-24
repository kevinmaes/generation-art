import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  access,
  copyFile,
} from 'fs/promises';
import { join, basename, extname } from 'path';
import { SimpleGedcomParser } from '../parsers/SimpleGedcomParser';
import { processGedcomWithLLMOptimization } from '../metadata/llm-optimized-processing';
import type { Individual, Family } from '../../shared/types';
import { PerformanceTimer } from '../utils/performance-timer';
import { writeJsonStream } from '../utils/streaming-json-writer';

// Local interfaces that match SimpleGedcomParser output
interface ParsedIndividual {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
}

interface ParsedFamily {
  id: string;
  husband: string;
  wife: string;
  children: string[];
  marriageDate?: string;
}

interface ParsedGedcomData {
  individuals: ParsedIndividual[];
  families: ParsedFamily[];
}

interface BuildConfig {
  inputDirs: string[];
  outputDir: string;
  mediaDir: string;
}

// Convert parsed data to our shared types and build relationships
function convertAndBuildRelationships(data: ParsedGedcomData): {
  individuals: Individual[];
  families: Family[];
} {
  // Convert ParsedIndividual to Individual
  const individuals: Individual[] = data.individuals.map((parsed) => ({
    id: parsed.id,
    name: parsed.name,
    birth: parsed.birthDate ? { date: parsed.birthDate } : undefined,
    death: parsed.deathDate ? { date: parsed.deathDate } : undefined,
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
  }));

  // Build lookup for individuals
  const individualsById: Record<string, Individual> = {};
  individuals.forEach((ind) => {
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

  // Augment individuals with relationships
  const individualsWithRelationships: Individual[] = individuals.map((ind) => ({
    ...ind,
    parents: Array.from(parentsMap[ind.id] ?? new Set()),
    spouses: Array.from(spousesMap[ind.id] ?? new Set()),
    children: Array.from(childrenMap[ind.id] ?? new Set()),
    siblings: Array.from(siblingsMap[ind.id] ?? new Set()),
  }));

  // Convert families to our shared Family type
  const families: Family[] = data.families.map((fam) => ({
    id: fam.id,
    husband: fam.husband ? individualsById[fam.husband] : undefined,
    wife: fam.wife ? individualsById[fam.wife] : undefined,
    children: fam.children
      .map((childId) => individualsById[childId])
      .filter(Boolean),
  }));

  return { individuals: individualsWithRelationships, families };
}

// Helper function to find media directory
async function findMediaDirectory(
  inputDir: string,
  baseName: string,
): Promise<string | null> {
  const possibleMediaDirs = [
    join(inputDir, 'media'),
    join(inputDir, 'Media'),
    join(inputDir, `${baseName} media`),
    join(inputDir, `${baseName} Media`),
  ];

  for (const mediaDir of possibleMediaDirs) {
    try {
      await access(mediaDir);
      return mediaDir;
    } catch {
      // Directory doesn't exist, try next one
    }
  }
  return null;
}

async function buildGedcomFiles(
  config: BuildConfig,
  singleFilePath?: string,
): Promise<void> {
  const { inputDirs, outputDir, mediaDir } = config;
  console.log('\n🚀 Starting buildGedcomFiles...');
  console.log('  Config:', { inputDirs, outputDir, mediaDir, singleFilePath });

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(mediaDir, { recursive: true });

  let allGedcomFiles: { file: string; inputDir: string }[] = [];

  // Collect GEDCOM files from all input directories (recursively)
  async function scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip directories starting with underscore (archived)
          if (entry.name.startsWith('_')) {
            console.log(`  Skipping archived directory: ${fullPath}`);
            continue;
          }
          // Recursively scan subdirectories
          await scanDirectory(fullPath);
        } else if (entry.isFile() && extname(entry.name) === '.ged') {
          // Found a GEDCOM file
          const relativePath = fullPath.substring(0, fullPath.lastIndexOf('/'));
          allGedcomFiles.push({ file: entry.name, inputDir: relativePath });
        }
      }
    } catch (error) {
      console.log(`Error scanning directory ${dir}:`, error);
    }
  }

  // Scan each input directory recursively
  for (const inputDir of inputDirs) {
    try {
      await access(inputDir);
      await scanDirectory(inputDir);
    } catch {
      console.log(`Input directory ${inputDir} does not exist.`);
    }
  }

  if (singleFilePath) {
    // Check if the specified file exists at the full path
    try {
      await access(singleFilePath);
      const fileName = basename(singleFilePath);
      const inputDir = singleFilePath.replace(`/${fileName}`, '');

      // Verify it's a .ged file
      if (extname(fileName) !== '.ged') {
        console.log(`File ${singleFilePath} is not a .ged file`);
        return;
      }

      allGedcomFiles = [{ file: fileName, inputDir }];
      console.log(`Processing single GEDCOM file: ${singleFilePath}`);
    } catch {
      console.log(`File ${singleFilePath} not found`);
      return;
    }
  }

  if (allGedcomFiles.length === 0) {
    console.log('No GEDCOM files found in any input directory');
    console.log(
      'Please add .ged files to the examples/ or gedcom/ directories',
    );
    return;
  }

  console.log(
    `Found ${String(allGedcomFiles.length)} GEDCOM files to process:`,
  );
  allGedcomFiles.forEach(({ file, inputDir }) => {
    console.log(`  - ${inputDir}/${file}`);
  });
  console.log('');

  const overallTimer = new PerformanceTimer();
  overallTimer.start('Total Processing');

  for (const { file, inputDir } of allGedcomFiles) {
    const baseName = basename(file, '.ged');
    const inputPath = join(inputDir, file);
    const rawOutputPath = join(outputDir, `_${baseName}-raw.json`);
    const fullOutputPath = join(outputDir, `${baseName}.json`);
    const llmOutputPath = join(outputDir, `${baseName}-llm.json`);
    const statsOutputPath = join(outputDir, `${baseName}-stats.json`);

    console.log(`\nProcessing ${inputDir}/${file}...`);
    console.log('─'.repeat(50));
    const fileTimer = new PerformanceTimer();
    fileTimer.start('File Processing');

    try {
      // Read and parse GEDCOM
      fileTimer.start('File Reading');
      const gedcomText = await readFile(inputPath, 'utf-8');
      fileTimer.endAndLog('File Reading');

      fileTimer.start('GEDCOM Parsing');
      console.log('  🔍 Creating parser...');
      const parser = new SimpleGedcomParser();
      console.log('  🔍 Starting parse...');
      const parsedData = parser.parse(gedcomText);
      console.log(
        `  🔍 Parse complete: ${String(parsedData.individuals.length)} individuals`,
      );
      fileTimer.endAndLog('GEDCOM Parsing');

      // Write raw parsed JSON (intermediate file)
      fileTimer.start('Raw JSON Writing');
      // Use streaming for large files
      const useStreaming = parsedData.individuals.length > 1000;
      if (useStreaming) {
        console.log('  📊 Using stream-based writing for large dataset...');
        await writeJsonStream(rawOutputPath, parsedData, true);
      } else {
        await writeFile(rawOutputPath, JSON.stringify(parsedData, null, 2));
      }
      fileTimer.endAndLog('Raw JSON Writing');
      console.log(
        `  ✓ Generated _${baseName}-raw.json (${String(parsedData.individuals.length)} individuals, ${String(parsedData.families.length)} families)`,
      );

      // Generate LLM-optimized data
      fileTimer.start('Relationship Building');
      const { individuals, families } =
        convertAndBuildRelationships(parsedData);
      fileTimer.endAndLog('Relationship Building');

      fileTimer.start('LLM Optimization');
      console.log('  🤖 Starting LLM optimization...');
      const processingResult = processGedcomWithLLMOptimization(
        individuals,
        families,
      );
      console.log('  🤖 LLM optimization complete');
      fileTimer.endAndLog('LLM Optimization');

      // Write full data (for local operations)
      fileTimer.start('Full JSON Writing');
      const useStreamingForLarge = individuals.length > 1000;
      if (useStreamingForLarge) {
        console.log('  📊 Using stream-based writing for full data...');
        await writeJsonStream(fullOutputPath, processingResult.full, true);
      } else {
        await writeFile(
          fullOutputPath,
          JSON.stringify(processingResult.full, null, 2),
        );
      }
      fileTimer.endAndLog('Full JSON Writing');
      console.log(`  ✓ Generated ${baseName}.json (full data with metadata)`);

      // Write LLM-ready data (PII stripped)
      fileTimer.start('LLM JSON Writing');
      if (useStreamingForLarge) {
        console.log('  📊 Using stream-based writing for LLM data...');
        await writeJsonStream(llmOutputPath, processingResult.llm, true);
      } else {
        await writeFile(
          llmOutputPath,
          JSON.stringify(processingResult.llm, null, 2),
        );
      }
      fileTimer.endAndLog('LLM JSON Writing');
      console.log(
        `  ✓ Generated ${baseName}-llm.json (LLM-ready, PII stripped)`,
      );

      // Write processing statistics
      fileTimer.start('Stats JSON Writing');
      await writeFile(
        statsOutputPath,
        JSON.stringify(processingResult.stats, null, 2),
      );
      fileTimer.endAndLog('Stats JSON Writing');
      console.log(
        `  ✓ Generated ${baseName}-stats.json (processing statistics)`,
      );

      // Check for media directory with flexible naming
      fileTimer.start('Media Processing');
      const foundMediaDir = await findMediaDirectory(inputDir, baseName);
      if (foundMediaDir) {
        console.log(`  ℹ Found media directory: ${foundMediaDir}`);
        // Copy media files to generated/media/<baseName>/
        const destMediaDir = join(mediaDir, baseName);
        await mkdir(destMediaDir, { recursive: true });
        const mediaFiles = await readdir(foundMediaDir, {
          withFileTypes: true,
        });

        // Track media files by extension for summary
        const mediaStats: Record<string, number> = {};
        let totalCopied = 0;

        for (const entry of mediaFiles) {
          if (entry.isFile()) {
            const src = join(foundMediaDir, entry.name);
            const dest = join(destMediaDir, entry.name);
            await copyFile(src, dest);

            // Track file extension
            const ext = extname(entry.name).toLowerCase() || '.unknown';
            mediaStats[ext] = (mediaStats[ext] || 0) + 1;
            totalCopied++;
          }
        }

        // Show summary instead of individual files
        if (totalCopied > 0) {
          const summary = Object.entries(mediaStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([ext, count]) => `${String(count)} ${ext}`)
            .join(', ');
          console.log(
            `  ✓ Copied ${String(totalCopied)} media files: ${summary}`,
          );
        }
      } else {
        console.log(`  ℹ No media directory found for ${baseName}`);
      }
      fileTimer.endAndLog('Media Processing');

      fileTimer.endAndLog('File Processing');
      fileTimer.logSummary(`${baseName} Performance`);
    } catch (error) {
      console.error(
        `  ✗ Error processing ${file}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Generate manifest file with all processed GEDCOM datasets
  const datasets = [];
  for (const { file, inputDir } of allGedcomFiles) {
    const baseName = basename(file, '.ged');
    const statsPath = join(outputDir, `${baseName}-stats.json`);

    // Try to read stats for metadata
    let individualCount = 0;
    let familyCount = 0;
    let generationCount = 0;
    try {
      const statsContent = await readFile(statsPath, 'utf-8');
      const stats = JSON.parse(statsContent) as {
        individualCount?: number;
        familyCount?: number;
        individualsProcessed?: number;
        familiesProcessed?: number;
        generationCount?: number;
      };
      // Support both field names for backward compatibility
      individualCount =
        stats.individualCount ?? stats.individualsProcessed ?? 0;
      familyCount = stats.familyCount ?? stats.familiesProcessed ?? 0;
      generationCount = stats.generationCount ?? 0;
    } catch {
      // Stats file might not exist, use defaults
    }

    datasets.push({
      id: baseName,
      name: baseName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      fileName: baseName,
      sourcePath: `${inputDir}/${file}`,
      individualCount,
      familyCount,
      generationCount,
      hasLLMData: true,
      hasStats: true,
    });
  }

  const manifest = {
    version: '1.0',
    generated: new Date().toISOString(),
    datasets,
  };

  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(
    `\n  ✓ Generated manifest.json (${String(manifest.datasets.length)} datasets)`,
  );

  overallTimer.endAndLog('Total Processing');
  overallTimer.logSummary('Overall Build Performance');

  // Calculate total individuals and families processed
  let totalIndividuals = 0;
  let totalFamilies = 0;

  for (const dataset of manifest.datasets) {
    totalIndividuals += dataset.individualCount;
    totalFamilies += dataset.familyCount;
  }

  console.log('\nGEDCOM build complete!');
  console.log(
    `📊 Total processed: ${String(totalIndividuals)} individuals, ${String(totalFamilies)} families`,
  );
  console.log(`Generated files are in: ${outputDir}`);

  // Warning for slow operations
  const totalTime = overallTimer.getDurations().get('Total Processing') ?? 0;
  if (totalTime > 30000) {
    console.log('\n⚠️  Warning: Build took more than 30 seconds!');
    console.log(
      '    Consider implementing parallel processing for better performance.',
    );
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: BuildConfig = {
    inputDirs: ['examples', 'gedcom'],
    outputDir: 'client/public/generated/parsed',
    mediaDir: 'client/public/generated/media',
  };
  // Accept an optional filename argument
  const singleFile = process.argv[2];
  void buildGedcomFiles(config, singleFile);
}

export { buildGedcomFiles };
