#!/usr/bin/env tsx

/**
 * Generate a complete GEDCOM file with all ancestors for 16 generations
 * This creates a perfectly symmetrical family tree for testing
 */

import fs from 'fs';
import path from 'path';

// Configuration
const MAX_GENERATIONS = 8; // 8 generations = 255 individuals for complete testing
const OUTPUT_FILE = path.join(
  process.cwd(),
  'examples/01-fan-chart-complete/01-fan-chart-complete.ged'
);

// Helper to generate birth year based on generation
function getBirthYear(generation: number): number {
  // Assume 25 years per generation, starting from 1990
  return 1990 - (generation * 25);
}

// Helper to generate a unique name based on position
function generateName(generation: number, position: number, isMale: boolean): string {
  if (generation === 0) {
    return 'Center /Person/';
  }
  
  // Create a path string showing the lineage
  // Convert position to binary to determine paternal/maternal path
  let pathStr = '';
  let pos = position;
  for (let g = generation - 1; g >= 0; g--) {
    const isPaternal = (pos % 2) === 0;
    pathStr = (isPaternal ? 'P' : 'M') + pathStr;
    pos = Math.floor(pos / 2);
  }
  
  const role = isMale ? 'Father' : 'Mother';
  return `G${String(generation)} /${pathStr}-${role}/`;
}

// Generate GEDCOM header
function generateHeader(): string {
  return `0 HEAD
1 CHAR UTF-8
1 SOUR Generation Art Fan Chart Test
2 NAME Fan Chart Test - ${String(MAX_GENERATIONS)} Generations Complete (No Missing Ancestors)
2 VERS 3.0
1 DATE 17 JAN 2025
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 SUBM @SUB1@
0 @SUB1@ SUBM
1 NAME Test Submitter
`;
}

// Generate individual record
function generateIndividual(id: number, generation: number, position: number): string {
  const isMale = position % 2 === 0; // Even positions are male (fathers)
  const name = generateName(generation, position, isMale);
  const birthYear = getBirthYear(generation);
  
  let record = `0 @I${String(id)}@ INDI\n`;
  record += `1 NAME ${name}\n`;
  
  // Parse name for given and surname
  const nameRegex = /(\w+)\s+\/(.+)\//;
  const match = nameRegex.exec(name);
  if (match) {
    record += `2 GIVN ${match[1]}\n`;
    record += `2 SURN ${match[2]}\n`;
  }
  
  record += `1 SEX ${isMale ? 'M' : 'F'}\n`;
  record += `1 BIRT\n`;
  record += `2 DATE ${String(Math.floor(Math.random() * 28) + 1)} ${
    ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][
      Math.floor(Math.random() * 12)
    ]
  } ${String(birthYear)}\n`;
  
  // Add family links
  if (generation < MAX_GENERATIONS - 1) {
    // Has parents
    const familyId = Math.floor((id - 1) / 2) + 1;
    record += `1 FAMC @F${String(familyId)}@\n`;
  }
  
  if (generation > 0) {
    // Has children (is a parent)
    const childFamilyId = id;
    record += `1 FAMS @F${String(childFamilyId)}@\n`;
  }
  
  if (generation === 0) {
    record += `1 NOTE Center person for complete fan chart testing\n`;
  }
  
  return record;
}

// Generate family record
function generateFamily(familyId: number, husbandId: number, wifeId: number, childId: number): string {
  let record = `0 @F${String(familyId)}@ FAM\n`;
  record += `1 HUSB @I${String(husbandId)}@\n`;
  record += `1 WIFE @I${String(wifeId)}@\n`;
  record += `1 CHIL @I${String(childId)}@\n`;
  
  // Add marriage date
  const generation = Math.floor(Math.log2(husbandId + 1));
  const marriageYear = getBirthYear(generation) + 25; // Married at ~25
  record += `1 MARR\n`;
  record += `2 DATE ${String(Math.floor(Math.random() * 28) + 1)} ${
    ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][
      Math.floor(Math.random() * 12)
    ]
  } ${String(marriageYear)}\n`;
  
  return record;
}

// Main generation function
function generateCompleteGedcom(): void {
  console.log(`Generating complete GEDCOM with ${String(MAX_GENERATIONS)} generations...`);
  
  let gedcom = generateHeader();
  
  // Calculate total individuals: 2^n - 1 for n generations
  const totalIndividuals = Math.pow(2, MAX_GENERATIONS) - 1;
  console.log(`Total individuals to generate: ${String(totalIndividuals)}`);
  
  // Generate individuals by generation
  let individualId = 1;
  
  for (let generation = 0; generation < MAX_GENERATIONS; generation++) {
    const individualsInGeneration = Math.pow(2, generation);
    console.log(`Generating generation ${String(generation)}: ${String(individualsInGeneration)} individuals`);
    
    for (let position = 0; position < individualsInGeneration; position++) {
      gedcom += '\n' + generateIndividual(individualId, generation, position);
      individualId++;
    }
  }
  
  // Generate families (all except the last generation)
  console.log('\nGenerating family records...');
  let familyId = 1;
  
  for (let childId = 1; childId <= totalIndividuals; childId++) {
    const generation = Math.floor(Math.log2(childId + 1));
    
    if (generation < MAX_GENERATIONS - 1) {
      // This individual has parents
      const firstParentId = Math.pow(2, generation + 1) + (childId - Math.pow(2, generation)) * 2;
      const husbandId = firstParentId;
      const wifeId = firstParentId + 1;
      
      gedcom += '\n' + generateFamily(familyId, husbandId, wifeId, childId);
      familyId++;
    }
  }
  
  // Add trailer
  gedcom += '\n0 TRLR\n';
  
  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(OUTPUT_FILE, gedcom);
  console.log(`\n✅ Generated ${OUTPUT_FILE}`);
  console.log(`   - Generations: ${String(MAX_GENERATIONS)}`);
  console.log(`   - Individuals: ${String(totalIndividuals)}`);
  console.log(`   - Families: ${String(familyId - 1)}`);
}

// Run the generator
generateCompleteGedcom();