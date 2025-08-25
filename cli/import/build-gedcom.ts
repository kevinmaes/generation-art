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
import { CountryMatcher } from '../country-matching/country-matcher';
import type { UnresolvedLocation, ProcessingMetadata } from '../country-matching/types';

// Local interfaces that match SimpleGedcomParser output
interface ParsedIndividual {
  id: string;
  name: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
}

interface ParsedFamily {
  id: string;
  husband: string;
  wife: string;
  children: string[];
  marriageDate?: string;
  marriagePlace?: string;
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
function convertAndBuildRelationships(
  data: ParsedGedcomData,
  countryMatcher: CountryMatcher,
): {
  individuals: Individual[];
  families: Family[];
  countryStats: {
    totalLocations: number;
    matched: {
      high: number;
      medium: number;
      low: number;
      unmatched: number;
    };
    methods: Record<string, number>;
    unresolvedLocations: UnresolvedLocation[];
  };
} {
  // Convert ParsedIndividual to Individual with country matching
  const individuals: Individual[] = data.individuals.map((parsed) => {
    const birthCountry = parsed.birthPlace
      ? countryMatcher.processPlace(
          parsed.birthPlace,
          undefined,
          parsed.id,
          'birth',
        )
      : undefined;

    const deathCountry = parsed.deathPlace
      ? countryMatcher.processPlace(
          parsed.deathPlace,
          undefined,
          parsed.id,
          'death',
        )
      : undefined;

    return {
      id: parsed.id,
      name: parsed.name,
      birth:
        parsed.birthDate || parsed.birthPlace
          ? {
              date: parsed.birthDate,
              place: parsed.birthPlace,
              country: birthCountry?.country,
            }
          : undefined,
      death:
        parsed.deathDate || parsed.deathPlace
          ? {
              date: parsed.deathDate,
              place: parsed.deathPlace,
              country: deathCountry?.country,
            }
          : undefined,
      parents: [],
      spouses: [],
      children: [],
      siblings: [],
    };
  });

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

  const countryStats = countryMatcher.getStatistics();
  const unresolvedLocations = countryMatcher.getUnresolvedLocations();

  return {
    individuals: individualsWithRelationships,
    families,
    countryStats: {
      ...countryStats,
      unresolvedLocations,
    },
  };
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

  // If a single file is specified, only process that file
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
  } else {
    // Otherwise, scan all input directories
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
            const relativePath = fullPath.substring(
              0,
              fullPath.lastIndexOf('/'),
            );
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

    console.log(`\nProcessing ${inputDir}/${file}`);
    console.log('─'.repeat(50));
    const fileTimer = new PerformanceTimer();
    fileTimer.start('File Processing');

    try {
      // Read and parse GEDCOM
      fileTimer.start('File Reading');
      const gedcomText = await readFile(inputPath, 'utf-8');
      fileTimer.endAndLog('File Reading');

      fileTimer.start('GEDCOM Parsing');
      const parser = new SimpleGedcomParser();
      const parsedData = parser.parse(gedcomText);
      fileTimer.endAndLog('GEDCOM Parsing');

      // Write raw parsed JSON (intermediate file)
      fileTimer.start('Raw JSON Writing');
      // Use streaming for large files
      const useStreaming = parsedData.individuals.length > 1000;
      if (useStreaming) {
        await writeJsonStream(rawOutputPath, parsedData, true);
      } else {
        await writeFile(rawOutputPath, JSON.stringify(parsedData, null, 2));
      }
      fileTimer.endAndLog('Raw JSON Writing');
      console.log(
        `  Generated _${baseName}-raw.json (${parsedData.individuals.length.toLocaleString()} individuals, ${parsedData.families.length.toLocaleString()} families)`,
      );

      // Initialize country matcher
      const countryMatcher = new CountryMatcher();

      // Generate LLM-optimized data
      fileTimer.start('Relationship Building & Country Matching');
      const { individuals, families, countryStats } =
        convertAndBuildRelationships(parsedData, countryMatcher);
      fileTimer.endAndLog('Relationship Building & Country Matching');

      // Log country matching statistics
      if (countryStats.totalLocations > 0) {
        const totalMatched =
          countryStats.matched.high +
          countryStats.matched.medium +
          countryStats.matched.low;
        const matchRate = (
          (totalMatched / countryStats.totalLocations) *
          100
        ).toFixed(1);

        console.log(`\n  Country Matching Statistics:`);
        console.log(
          `     Total locations: ${countryStats.totalLocations.toLocaleString()}`,
        );
        console.log(`     Match rate: ${matchRate}%`);
        console.log(`     Confidence breakdown:`);
        console.log(
          `       • High (≥90%): ${countryStats.matched.high.toLocaleString()}`,
        );
        console.log(
          `       • Medium (70-89%): ${countryStats.matched.medium.toLocaleString()}`,
        );
        console.log(
          `       • Low (50-69%): ${countryStats.matched.low.toLocaleString()}`,
        );
        console.log(
          `       • Unmatched (<50%): ${countryStats.matched.unmatched.toLocaleString()}`,
        );

        console.log(`     Matching methods used:`);
        if (countryStats.methods.exact > 0) {
          console.log(
            `       • Exact ISO: ${countryStats.methods.exact.toLocaleString()}`,
          );
        }
        if (countryStats.methods.alias > 0) {
          console.log(
            `       • Alias: ${countryStats.methods.alias.toLocaleString()}`,
          );
        }
        if (countryStats.methods.pattern > 0) {
          console.log(
            `       • Pattern: ${countryStats.methods.pattern.toLocaleString()}`,
          );
        }
        if (countryStats.methods.region > 0) {
          console.log(
            `       • Region: ${countryStats.methods.region.toLocaleString()}`,
          );
        }
        if (countryStats.methods.historical > 0) {
          console.log(
            `       • Historical: ${countryStats.methods.historical.toLocaleString()}`,
          );
        }
        if (countryStats.methods.fuzzy > 0) {
          console.log(
            `       • Fuzzy: ${countryStats.methods.fuzzy.toLocaleString()}`,
          );
        }

        if (countryStats.unresolvedLocations.length > 0) {
          console.log(`     Sample unresolved locations (first 3):`);
          countryStats.unresolvedLocations.slice(0, 3).forEach((loc) => {
            console.log(`       • "${loc.original}"`);
          });
        }
      }

      fileTimer.start('LLM Optimization');
      const processingResult = processGedcomWithLLMOptimization(
        individuals,
        families,
      );
      fileTimer.endAndLog('LLM Optimization');

      // Write full data (for local operations)
      fileTimer.start('Full JSON Writing');
      const useStreamingForLarge = individuals.length > 1000;
      if (useStreamingForLarge) {
        await writeJsonStream(fullOutputPath, processingResult.full, true);
      } else {
        await writeFile(
          fullOutputPath,
          JSON.stringify(processingResult.full, null, 2),
        );
      }
      fileTimer.endAndLog('Full JSON Writing');
      console.log(`  Generated ${baseName}.json (full data with metadata)`);

      // Write LLM-ready data (PII stripped)
      fileTimer.start('LLM JSON Writing');
      if (useStreamingForLarge) {
        await writeJsonStream(llmOutputPath, processingResult.llm, true);
      } else {
        await writeFile(
          llmOutputPath,
          JSON.stringify(processingResult.llm, null, 2),
        );
      }
      fileTimer.endAndLog('LLM JSON Writing');
      console.log(
        `  Generated ${baseName}-llm.json (LLM-ready, PII stripped)`,
      );

      // Write processing statistics with country data
      fileTimer.start('Stats JSON Writing');
      const enhancedStats: unknown = {
        ...processingResult.stats,
        countryMatching: countryStats,
      };
      await writeFile(statsOutputPath, JSON.stringify(enhancedStats, null, 2));
      fileTimer.endAndLog('Stats JSON Writing');
      console.log(
        `  Generated ${baseName}-stats.json (processing statistics)`,
      );

      // Check for media directory with flexible naming
      fileTimer.start('Media Processing');
      const foundMediaDir = await findMediaDirectory(inputDir, baseName);
      if (foundMediaDir) {
        console.log(`  Found media directory: ${foundMediaDir.split('/').pop() ?? foundMediaDir}`);
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
            `  ✅ Copied ${String(totalCopied)} media files: ${summary}`,
          );
        }
      } else {
        console.log(`  ℹ️  No media directory found for ${baseName}`);
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
    `\n📄 Generated manifest.json (${String(manifest.datasets.length)} datasets)`,
  );

  overallTimer.endAndLog('Total Processing');
  overallTimer.logSummary('Overall Build Performance');

  // Calculate total individuals and families processed
  let totalIndividuals = 0;
  let totalFamilies = 0;
  let totalLocations = 0;
  let totalMatchedLocations = 0;
  let totalHighConfidence = 0;
  let totalMediumConfidence = 0;
  let totalLowConfidence = 0;
  let totalUnmatched = 0;

  for (const dataset of manifest.datasets) {
    totalIndividuals += dataset.individualCount;
    totalFamilies += dataset.familyCount;

    // Read stats file for country matching data
    try {
      const statsPath = join(outputDir, `${dataset.fileName}-stats.json`);
      const statsData = JSON.parse(await readFile(statsPath, 'utf-8')) as {
        countryMatching?: ProcessingMetadata & { unresolvedLocations: UnresolvedLocation[] };
      };
      if (statsData.countryMatching) {
        const cm = statsData.countryMatching;
        totalLocations += cm.totalLocations;
        totalHighConfidence += cm.matched.high;
        totalMediumConfidence += cm.matched.medium;
        totalLowConfidence += cm.matched.low;
        totalUnmatched += cm.matched.unmatched;
        totalMatchedLocations +=
          cm.matched.high + cm.matched.medium + cm.matched.low;
      }
    } catch {
      // Stats file may not exist for all datasets
    }
  }

  console.log('\n✅ GEDCOM build complete!');
  console.log(
    `Total processed: ${totalIndividuals.toLocaleString()} individuals, ${totalFamilies.toLocaleString()} families`,
  );

  // Only show overall country matching summary when processing multiple files
  if (totalLocations > 0 && manifest.datasets.length > 1) {
    const overallMatchRate = (
      (totalMatchedLocations / totalLocations) *
      100
    ).toFixed(1);
    console.log('\n\nOverall Country Matching Summary:');
    console.log(`   Locations processed: ${totalLocations.toLocaleString()}`);
    console.log(`   Overall match rate: ${overallMatchRate}%`);
    console.log(
      `   High confidence: ${totalHighConfidence.toLocaleString()} (${((totalHighConfidence / totalLocations) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Medium confidence: ${totalMediumConfidence.toLocaleString()} (${((totalMediumConfidence / totalLocations) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Low confidence: ${totalLowConfidence.toLocaleString()} (${((totalLowConfidence / totalLocations) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Unmatched: ${totalUnmatched.toLocaleString()} (${((totalUnmatched / totalLocations) * 100).toFixed(1)}%)`,
    );
  }

  console.log(`\nGenerated files are in: ${outputDir}`);

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
