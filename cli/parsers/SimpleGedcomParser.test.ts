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

  it('should not confuse CHAN dates with birth dates', () => {
    const gedcomText = `0 HEAD
0 @I1@ INDI
1 NAME John /Smith/
1 BIRT
2 DATE 15 MAY 1920
2 PLAC Boston, MA
1 CHAN
2 DATE 27 SEP 2014
3 TIME 08:05:03
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    expect(result.individuals).toHaveLength(1);
    const individual = result.individuals[0];
    expect(individual.birthDate).toBe('15 MAY 1920');
    expect(individual.birthPlace).toBe('Boston, MA');
    // CHAN date should NOT overwrite birth date
    expect(individual.birthDate).not.toBe('27 SEP 2014');
  });

  it('should not confuse _CRE dates with event dates', () => {
    const gedcomText = `0 HEAD
0 @I1@ INDI
1 NAME Jane /Doe/
1 BIRT
2 DATE 10 JUN 1925
2 PLAC New York, NY
1 _CRE
2 DATE 15 OCT 2020
3 TIME 14:30:00
1 DEAT
2 DATE 5 MAR 2010
2 PLAC Los Angeles, CA
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    const individual = result.individuals[0];
    expect(individual.birthDate).toBe('10 JUN 1925');
    expect(individual.birthPlace).toBe('New York, NY');
    expect(individual.deathDate).toBe('5 MAR 2010');
    expect(individual.deathPlace).toBe('Los Angeles, CA');
    // _CRE date should not affect birth or death dates
    expect(individual.birthDate).not.toBe('15 OCT 2020');
  });

  it('should isolate event state between individuals', () => {
    const gedcomText = `0 HEAD
0 @I1@ INDI
1 NAME Person One
1 BIRT
2 DATE 1 JAN 1900
0 @I2@ INDI
1 NAME Person Two
2 DATE 15 MAR 1950
2 PLAC Random Place
1 DEAT
2 DATE 20 DEC 2000
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    expect(result.individuals).toHaveLength(2);

    const person1 = result.individuals[0];
    expect(person1.birthDate).toBe('1 JAN 1900');

    const person2 = result.individuals[1];
    // Random DATE without event context should not set birth date
    expect(person2.birthDate).toBeUndefined();
    expect(person2.birthPlace).toBeUndefined();
    expect(person2.deathDate).toBe('20 DEC 2000');
  });

  it('should handle multiple events with metadata in between', () => {
    const gedcomText = `0 HEAD
0 @I1@ INDI
1 NAME Complex /Person/
1 BIRT
2 DATE 5 APR 1920
2 PLAC Chicago, IL
1 NOTE Some note about the person
2 DATE 2020
1 OCCU Engineer
2 DATE 1945
1 DEAT  
2 DATE 10 NOV 1995
2 PLAC Miami, FL
1 CHAN
2 DATE 1 JAN 2024
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    const individual = result.individuals[0];
    expect(individual.birthDate).toBe('5 APR 1920');
    expect(individual.birthPlace).toBe('Chicago, IL');
    expect(individual.deathDate).toBe('10 NOV 1995');
    expect(individual.deathPlace).toBe('Miami, FL');
    // None of the other dates should overwrite birth or death
    expect(individual.birthDate).not.toBe('2020');
    expect(individual.birthDate).not.toBe('1945');
    expect(individual.deathDate).not.toBe('1 JAN 2024');
  });

  it('should not confuse level 2 CHAN dates under BIRT', () => {
    const gedcomText = `0 HEAD
0 @I1@ INDI
1 NAME Test /Person/
1 BIRT
2 DATE 15 JUL 1974
2 PLAC Ho Chi Minh City, Vietnam
2 _COR
3 _LAD 10
3 _LAM 45
2 CHAN
3 DATE 27 SEP 2014
4 TIME 08:05:03
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    const individual = result.individuals[0];
    // Birth date should be preserved as 1974, not overwritten by CHAN date
    expect(individual.birthDate).toBe('15 JUL 1974');
    expect(individual.birthPlace).toBe('Ho Chi Minh City, Vietnam');
    // CHAN date at level 3 should NOT overwrite birth date
    expect(individual.birthDate).not.toBe('27 SEP 2014');
  });

  it('should reset event state when encountering level 0 or 1 tags', () => {
    const gedcomText = `0 HEAD
0 @I1@ INDI
1 NAME Test /Person/
1 BIRT
2 DATE 1 JAN 1920
1 RESI
2 DATE 1950
2 ADDR 123 Main St
1 DEAT
2 DATE 31 DEC 1999
0 @I2@ INDI
1 NAME Another /Person/
2 DATE 15 JUN 1930
0 TRLR`;

    const parser = new SimpleGedcomParser();
    const result = parser.parse(gedcomText);

    const person1 = result.individuals[0];
    expect(person1.birthDate).toBe('1 JAN 1920');
    expect(person1.deathDate).toBe('31 DEC 1999');
    // RESI DATE should not affect birth or death
    expect(person1.birthDate).not.toBe('1950');

    const person2 = result.individuals[1];
    // Stray DATE should not be treated as death date from previous person
    expect(person2.deathDate).toBeUndefined();
    expect(person2.birthDate).toBeUndefined();
  });
});
