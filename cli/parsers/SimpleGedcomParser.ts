interface GedcomLine {
  level: number;
  tag: string;
  value: string;
  xref?: string;
}

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

export class SimpleGedcomParser {
  private individuals = new Map<string, Individual>();
  private families = new Map<string, Family>();
  private currentIndividual?: Individual;
  private currentFamily?: Family;
  private currentEvent?: 'BIRT' | 'DEAT' | 'MARR';
  private debug = false; // Set to true for verbose logging

  parse(gedcomText: string): { individuals: Individual[]; families: Family[] } {
    if (this.debug) console.log('Starting to parse GEDCOM text...');

    // Normalize line endings and split into lines
    const normalizedText = gedcomText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    const lines = normalizedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => this.parseLine(line));

    // Only show line count for files over 1000 lines
    if (lines.length > 1000) {
      console.log(`  📝 Parsing ${String(lines.length)} lines...`);
    }

    let processedLines = 0;
    for (const line of lines) {
      if (!line) continue;
      processedLines++;

      if (this.debug && processedLines <= 10) {
        console.log('Processing line:', line);
      }

      switch (line.tag) {
        case 'INDI':
          this.handleIndividual(line);
          break;
        case 'FAM':
          this.handleFamily(line);
          break;
        case 'NAME':
          this.handleName(line);
          break;
        case 'BIRT':
          this.currentEvent = 'BIRT';
          break;
        case 'DEAT':
          this.currentEvent = 'DEAT';
          break;
        case 'MARR':
          this.currentEvent = 'MARR';
          break;
        case 'DATE':
          this.handleDate(line);
          break;
        case 'HUSB':
          this.handleHusband(line);
          break;
        case 'WIFE':
          this.handleWife(line);
          break;
        case 'CHIL':
          this.handleChild(line);
          break;
      }
    }

    // Always show final counts
    console.log(
      `  ✓ Parsed ${String(this.individuals.size)} individuals and ${String(this.families.size)} families`
    );

    return {
      individuals: Array.from(this.individuals.values()),
      families: Array.from(this.families.values()),
    };
  }

  private parseLine(line: string): GedcomLine | null {
    if (!line) return null;

    // Updated regex to handle more GEDCOM line formats
    const match = /^(\d+)\s+(?:@([^@]+)@\s+)?(\w+)(?:\s+(.+))?$/.exec(line);
    if (!match) {
      console.log('Failed to parse line:', line);
      return null;
    }

    const [, level, xref, tag, value] = match;
    return {
      level: parseInt(level),
      tag,
      value: value || '',
      xref,
    };
  }

  private handleIndividual(line: GedcomLine) {
    if (line.xref) {
      if (this.debug) console.log('Found individual:', line.xref);
      this.currentIndividual = {
        id: line.xref,
        name: '',
      };
      this.individuals.set(line.xref, this.currentIndividual);
    }
  }

  private handleFamily(line: GedcomLine) {
    if (line.xref) {
      if (this.debug) console.log('Found family:', line.xref);
      this.currentFamily = {
        id: line.xref,
        husband: '',
        wife: '',
        children: [],
      };
      this.families.set(line.xref, this.currentFamily);
    }
  }

  private handleName(line: GedcomLine) {
    if (this.currentIndividual) {
      if (this.debug) {
        console.log(
          'Setting name for individual:',
          this.currentIndividual.id,
          line.value,
        );
      }
      // Remove slashes and clean up name format
      const cleanName = line.value.replace(/\//g, '').trim();
      this.currentIndividual.name = cleanName;
    }
  }

  private handleDate(line: GedcomLine) {
    if (!line.value) return;

    if (this.currentIndividual) {
      if (this.currentEvent === 'BIRT') {
        if (this.debug) {
          console.log(
            'Setting birth date for individual:',
            this.currentIndividual.id,
            line.value,
          );
        }
        this.currentIndividual.birthDate = line.value;
      } else if (this.currentEvent === 'DEAT') {
        if (this.debug) {
          console.log(
            'Setting death date for individual:',
            this.currentIndividual.id,
            line.value,
          );
        }
        this.currentIndividual.deathDate = line.value;
      }
    }

    if (this.currentFamily && this.currentEvent === 'MARR') {
      if (this.debug) {
        console.log(
          'Setting marriage date for family:',
          this.currentFamily.id,
          line.value,
        );
      }
      this.currentFamily.marriageDate = line.value;
    }
  }

  private handleHusband(line: GedcomLine) {
    if (this.currentFamily && line.value) {
      if (this.debug) {
        console.log(
          'Setting husband for family:',
          this.currentFamily.id,
          line.value,
        );
      }
      // Remove @ symbols from reference
      const cleanRef = line.value.replace(/@/g, '');
      this.currentFamily.husband = cleanRef;
    }
  }

  private handleWife(line: GedcomLine) {
    if (this.currentFamily && line.value) {
      if (this.debug) {
        console.log(
          'Setting wife for family:',
          this.currentFamily.id,
          line.value,
        );
      }
      // Remove @ symbols from reference
      const cleanRef = line.value.replace(/@/g, '');
      this.currentFamily.wife = cleanRef;
    }
  }

  private handleChild(line: GedcomLine) {
    if (this.currentFamily && line.value) {
      if (this.debug) {
        console.log('Adding child to family:', this.currentFamily.id, line.value);
      }
      // Remove @ symbols from reference
      const cleanRef = line.value.replace(/@/g, '');
      this.currentFamily.children.push(cleanRef);
    }
  }
}
