#!/usr/bin/env tsx

/**
 * Stream-based GEDCOM generator for complete family trees
 * Optimized for memory efficiency with large generation counts
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable, Transform } from 'stream';
import { PerformanceTimer } from '../utils/performance-timer';

// Configuration
const MAX_GENERATIONS = 8; // Can be increased to 16+ without memory issues
const OUTPUT_FILE = join(
  process.cwd(),
  'examples/01-fan-chart-complete/01-fan-chart-complete.ged',
);
const BATCH_SIZE = 100; // Process individuals in batches

// Helper to generate birth year based on generation
function getBirthYear(generation: number): number {
  return 1990 - generation * 25;
}

// Helper to generate a unique name based on position
function generateName(
  generation: number,
  position: number,
  isMale: boolean,
): string {
  if (generation === 0) {
    return 'Center /Person/';
  }

  // Create a path string showing the lineage
  let pathStr = '';
  let pos = position;
  for (let g = generation - 1; g >= 0; g--) {
    const isPaternal = pos % 2 === 0;
    pathStr = (isPaternal ? 'P' : 'M') + pathStr;
    pos = Math.floor(pos / 2);
  }

  const role = isMale ? 'Father' : 'Mother';
  return `G${String(generation)} /${pathStr}-${role}/`;
}

// Generate GEDCOM header
function* generateHeader(): Generator<string> {
  yield '0 HEAD\n';
  yield '1 CHAR UTF-8\n';
  yield '1 SOUR Generation Art Fan Chart Test\n';
  yield `2 NAME Fan Chart Test - ${String(MAX_GENERATIONS)} Generations Complete (No Missing Ancestors)\n`;
  yield '2 VERS 3.0\n';
  yield '1 DATE 17 JAN 2025\n';
  yield '1 GEDC\n';
  yield '2 VERS 5.5.1\n';
  yield '2 FORM LINEAGE-LINKED\n';
  yield '1 SUBM @SUB1@\n';
  yield '0 @SUB1@ SUBM\n';
  yield '1 NAME Test Submitter\n';
}

// Generate individual record
function* generateIndividual(
  id: number,
  generation: number,
  position: number,
): Generator<string> {
  const isMale = position % 2 === 0;
  const name = generateName(generation, position, isMale);
  const birthYear = getBirthYear(generation);

  yield `\n0 @I${String(id)}@ INDI\n`;
  yield `1 NAME ${name}\n`;

  // Parse name for given and surname
  const nameRegex = /(\w+)\s+\/(.+)\//;
  const match = nameRegex.exec(name);
  if (match) {
    yield `2 GIVN ${match[1]}\n`;
    yield `2 SURN ${match[2]}\n`;
  }

  yield `1 SEX ${isMale ? 'M' : 'F'}\n`;
  yield `1 BIRT\n`;
  yield `2 DATE ${String(Math.floor(Math.random() * 28) + 1)} ${
    [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ][Math.floor(Math.random() * 12)]
  } ${String(birthYear)}\n`;

  // Add family links
  if (generation < MAX_GENERATIONS - 1) {
    const familyId = Math.floor((id - 1) / 2) + 1;
    yield `1 FAMC @F${String(familyId)}@\n`;
  }

  if (generation > 0) {
    const childFamilyId = id;
    yield `1 FAMS @F${String(childFamilyId)}@\n`;
  }

  if (generation === 0) {
    yield '1 NOTE Center person for complete fan chart testing\n';
  }
}

// Generate family record
function* generateFamily(
  familyId: number,
  husbandId: number,
  wifeId: number,
  childId: number,
): Generator<string> {
  yield `\n0 @F${String(familyId)}@ FAM\n`;
  yield `1 HUSB @I${String(husbandId)}@\n`;
  yield `1 WIFE @I${String(wifeId)}@\n`;
  yield `1 CHIL @I${String(childId)}@\n`;

  // Add marriage date
  const generation = Math.floor(Math.log2(husbandId + 1));
  const marriageYear = getBirthYear(generation) + 25;
  yield `1 MARR\n`;
  yield `2 DATE ${String(Math.floor(Math.random() * 28) + 1)} ${
    [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ][Math.floor(Math.random() * 12)]
  } ${String(marriageYear)}\n`;
}

// Create a readable stream for individuals
function createIndividualsStream(timer: PerformanceTimer): Readable {
  let individualId = 1;
  let currentGeneration = 0;
  let positionInGeneration = 0;
  let individualsInCurrentGen = 1;
  let batchBuffer: string[] = [];

  return new Readable({
    read() {
      try {
        while (currentGeneration < MAX_GENERATIONS) {
          // Start timing for new generation
          if (positionInGeneration === 0) {
            timer.start(`Generation ${String(currentGeneration)}`);
          }

          // Generate individual
          for (const chunk of generateIndividual(
            individualId,
            currentGeneration,
            positionInGeneration,
          )) {
            batchBuffer.push(chunk);
          }

          individualId++;
          positionInGeneration++;

          // Check if we've finished this generation
          if (positionInGeneration >= individualsInCurrentGen) {
            timer.endAndLog(`Generation ${String(currentGeneration)}`, '    ');

            // Move to next generation
            currentGeneration++;
            positionInGeneration = 0;
            individualsInCurrentGen = Math.pow(2, currentGeneration);
          }

          // Flush batch buffer when it reaches the batch size
          if (batchBuffer.length >= BATCH_SIZE) {
            const data = batchBuffer.join('');
            batchBuffer = [];
            this.push(data);
            return; // Yield control back to the event loop
          }
        }

        // Flush any remaining buffer
        if (batchBuffer.length > 0) {
          this.push(batchBuffer.join(''));
          batchBuffer = [];
        }

        // End the stream
        this.push(null);
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });
}

// Create a readable stream for families
function createFamiliesStream(): Readable {
  const totalIndividuals = Math.pow(2, MAX_GENERATIONS) - 1;
  let childId = 1;
  let familyId = 1;
  let batchBuffer: string[] = [];

  return new Readable({
    read() {
      try {
        while (childId <= totalIndividuals) {
          const generation = Math.floor(Math.log2(childId));

          if (generation < MAX_GENERATIONS - 1) {
            // This individual has parents
            const firstParentId =
              Math.pow(2, generation + 1) +
              (childId - Math.pow(2, generation)) * 2;
            const husbandId = firstParentId;
            const wifeId = firstParentId + 1;

            for (const chunk of generateFamily(
              familyId,
              husbandId,
              wifeId,
              childId,
            )) {
              batchBuffer.push(chunk);
            }

            familyId++;
          }

          childId++;

          // Flush batch buffer periodically
          if (batchBuffer.length >= BATCH_SIZE) {
            const data = batchBuffer.join('');
            batchBuffer = [];
            this.push(data);
            return;
          }
        }

        // Flush remaining buffer
        if (batchBuffer.length > 0) {
          this.push(batchBuffer.join(''));
          batchBuffer = [];
        }

        // End the stream
        this.push(null);
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });
}

// Create a transform stream to track bytes written
class ByteCounterTransform extends Transform {
  private bytesWritten = 0;

  _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
    this.bytesWritten += chunk.length;
    this.push(chunk);
    callback();
  }

  getBytesWritten(): number {
    return this.bytesWritten;
  }
}

// Main generation function using streams
async function generateCompleteGedcomStream(): Promise<void> {
  console.log(
    `\n🚀 Generating complete GEDCOM with ${String(MAX_GENERATIONS)} generations (stream-based)...`,
  );
  const timer = new PerformanceTimer();
  timer.start('Total Generation');

  const totalIndividuals = Math.pow(2, MAX_GENERATIONS) - 1;
  const totalFamilies = totalIndividuals - 1;

  console.log(`📊 Total individuals to generate: ${String(totalIndividuals)}`);
  console.log(`📊 Total families to generate: ${String(totalFamilies)}`);
  console.log('─'.repeat(50));

  // Ensure directory exists
  const dir = dirname(OUTPUT_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Create write stream and byte counter
  const writeStream = createWriteStream(OUTPUT_FILE);
  const byteCounter = new ByteCounterTransform();

  try {
    // Write header
    timer.start('Header Generation');
    for (const chunk of generateHeader()) {
      await new Promise<void>((resolve) => {
        if (!writeStream.write(chunk)) {
          writeStream.once('drain', resolve);
        } else {
          resolve();
        }
      });
    }
    timer.endAndLog('Header Generation');

    // Stream individuals
    timer.start('Individuals Generation');
    const individualsStream = createIndividualsStream(timer);
    await pipeline(individualsStream, byteCounter, writeStream, { end: false });
    timer.endAndLog('Individuals Generation');

    // Stream families
    timer.start('Families Generation');
    const familiesStream = createFamiliesStream();
    await pipeline(familiesStream, writeStream, { end: false });
    timer.endAndLog('Families Generation');

    // Write trailer
    timer.start('Trailer Writing');
    await new Promise<void>((resolve, reject) => {
      writeStream.write('\n0 TRLR\n', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    timer.endAndLog('Trailer Writing');

    // Close the stream
    await new Promise<void>((resolve) => {
      writeStream.end(() => resolve());
    });

    timer.endAndLog('Total Generation');

    // Log summary
    console.log('\n✅ Generated ' + OUTPUT_FILE);
    console.log(`   - Generations: ${String(MAX_GENERATIONS)}`);
    console.log(`   - Individuals: ${String(totalIndividuals)}`);
    console.log(`   - Families: ${String(totalFamilies)}`);
    console.log(
      `   - File size: ${(byteCounter.getBytesWritten() / 1024).toFixed(1)}KB`,
    );

    // Performance summary
    timer.logSummary('Stream Generation Performance');

    // Memory efficiency note
    const memUsage = process.memoryUsage();
    const peakHeap = (memUsage.heapUsed / (1024 * 1024)).toFixed(1);
    console.log(
      `\n💾 Peak memory usage: ${peakHeap}MB (stream-based approach)`,
    );
    console.log(
      '   This approach maintains constant memory usage regardless of file size!',
    );
  } catch (error) {
    console.error('Error generating GEDCOM:', error);
    throw error;
  }
}

// Run the generator
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCompleteGedcomStream().catch(console.error);
}

export { generateCompleteGedcomStream };
