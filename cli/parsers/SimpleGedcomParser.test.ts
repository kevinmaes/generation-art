import { describe, it, expect } from 'vitest';
import { SimpleGedcomParser } from './SimpleGedcomParser';

describe('SimpleGedcomParser', () => {
  it('should parse a simple GEDCOM file with one individual', () => {
    const gedcomText = `0 HEAD
1 GEDC
2 VERS 5.5.5
0 @I1@ INDI
1 NAME John /Smith/
1 BIRT
2 DATE 1 JAN 1900
1 DEAT
2 DATE 1 JAN 1980
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    expect(result.individuals).toHaveLength(1);
    expect(result.families).toHaveLength(0);

    const individual = result.individuals[0];
    expect(individual.id).toBe('I1');
    expect(individual.name).toBe('John Smith');
    expect(individual.birthDate).toBe('1 JAN 1900');
    expect(individual.deathDate).toBe('1 JAN 1980');
  });

  it('should parse a GEDCOM file with a family', () => {
    const gedcomText = `0 HEAD
1 GEDC
2 VERS 5.5.5
0 @I1@ INDI
1 NAME John /Smith/
0 @I2@ INDI
1 NAME Jane /Doe/
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 MARR
2 DATE 1 JAN 1920
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    expect(result.individuals).toHaveLength(2);
    expect(result.families).toHaveLength(1);

    const family = result.families[0];
    expect(family.id).toBe('F1');
    expect(family.husband).toBe('I1');
    expect(family.wife).toBe('I2');
    expect(family.marriageDate).toBe('1 JAN 1920');
  });

  it('should handle empty GEDCOM file', () => {
    const parser = new SimpleGedcomParser();
    const result = parser.parse('');

    expect(result.individuals).toHaveLength(0);
    expect(result.families).toHaveLength(0);
  });

  it('should handle malformed GEDCOM lines', () => {
    const gedcomText = `0 HEAD
1 GEDC
2 VERS 5.5.5
invalid line
0 @I1@ INDI
1 NAME John /Smith/
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    expect(result.individuals).toHaveLength(1);
    expect(result.families).toHaveLength(0);
  });
});
