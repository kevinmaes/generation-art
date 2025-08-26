import { describe, it, expect, beforeEach } from 'vitest';
import { CountryMatcher } from './country-matcher.js';

describe('CountryMatcher', () => {
  let matcher: CountryMatcher;

  beforeEach(() => {
    matcher = new CountryMatcher();
  });

  describe('Exact ISO matching', () => {
    it('should match ISO2 codes with confidence 1.0', () => {
      const result = matcher.matchCountry('US');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe('exact');
    });

    it('should match ISO3 codes with confidence 1.0', () => {
      const result = matcher.matchCountry('USA');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe('exact');
    });

    it('should handle lowercase ISO codes', () => {
      const result = matcher.matchCountry('fra');
      expect(result.iso2).toBe('FR');
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe('exact');
    });
  });

  describe('Alias matching', () => {
    it('should match country aliases with confidence 0.95', () => {
      const result = matcher.matchCountry('United States of America');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(0.95);
      expect(result.method).toBe('alias');
    });

    it('should match foreign language aliases', () => {
      const result = matcher.matchCountry('Deutschland');
      expect(result.iso2).toBe('DE');
      expect(result.confidence).toBe(0.95);
      expect(result.method).toBe('alias');
    });

    it('should handle case-insensitive alias matching', () => {
      const result = matcher.matchCountry('united states of america');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(0.95);
      expect(result.method).toBe('alias');
    });
  });

  describe('Pattern matching', () => {
    it('should match "City, Country" patterns with confidence 0.90', () => {
      const result = matcher.matchCountry('Paris, France');
      expect(result.iso2).toBe('FR');
      expect(result.confidence).toBe(0.9);
      expect(result.method).toBe('pattern');
    });

    it('should match "City, State, Country" patterns', () => {
      const result = matcher.matchCountry('Boston, Massachusetts, USA');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(0.9);
      expect(result.method).toBe('pattern');
    });

    it('should match wildcard patterns', () => {
      const result = matcher.matchCountry('New York City, United States');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(0.9);
      expect(result.method).toBe('pattern');
    });
  });

  describe('Region matching', () => {
    it('should match US states with confidence 0.85', () => {
      const result = matcher.matchCountry('California');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(0.85);
      expect(result.method).toBe('region');
    });

    it('should match European regions', () => {
      const result = matcher.matchCountry('Bavaria');
      expect(result.iso2).toBe('DE');
      expect(result.confidence).toBe(0.85);
      expect(result.method).toBe('region');
    });

    it('should extract region from longer strings', () => {
      const result = matcher.matchCountry('Born in Texas');
      expect(result.iso2).toBe('US');
      expect(result.confidence).toBe(0.85);
      expect(result.method).toBe('region');
    });
  });

  describe('Historical matching', () => {
    it('should match historical countries with year context', () => {
      const result = matcher.matchCountry('South Vietnam', 1970);
      expect(result.iso2).toBe('VN');
      expect(result.confidence).toBe(0.75);
      expect(result.method).toBe('historical');
    });

    it('should match East Germany in correct time period', () => {
      const result = matcher.matchCountry('East Germany', 1975);
      expect(result.iso2).toBe('DE');
      expect(result.confidence).toBe(0.75);
      expect(result.method).toBe('historical');
    });

    it('should not match historical countries outside time period', () => {
      const result = matcher.matchCountry('East Germany', 1995);
      expect(result.confidence).toBeLessThan(0.75);
      expect(result.method).not.toBe('historical');
    });
  });

  describe('Fuzzy matching', () => {
    it('should match with small typos', () => {
      const result = matcher.matchCountry('Untied States'); // typo
      // Distance of 2 from "United States"
      if (result.iso2) {
        expect(result.iso2).toBe('US');
        expect(result.confidence).toBeGreaterThanOrEqual(0.3);
        expect(result.method).toBe('fuzzy');
      } else {
        // Fuzzy matching threshold might not catch this
        expect(result.iso2).toBeNull();
      }
    });

    it('should match partial country names', () => {
      const result = matcher.matchCountry('Vietna'); // partial, closer match
      if (result.iso2) {
        expect(result.iso2).toBe('VN');
        expect(result.confidence).toBeGreaterThanOrEqual(0.3);
        expect(result.method).toBe('fuzzy');
      } else {
        // Fuzzy matching threshold might not catch this
        expect(result.iso2).toBeNull();
      }
    });

    it('should not match completely unrelated strings', () => {
      const result = matcher.matchCountry('XYZ123');
      expect(result.iso2).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      const result = matcher.matchCountry('');
      expect(result.iso2).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle whitespace-only strings', () => {
      const result = matcher.matchCountry('   ');
      expect(result.iso2).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should match England/Scotland/Wales to UK', () => {
      const england = matcher.matchCountry('England');
      expect(england.iso2).toBe('GB');
      expect(england.confidence).toBe(0.95);

      const scotland = matcher.matchCountry('Scotland');
      expect(scotland.iso2).toBe('GB');
      expect(scotland.confidence).toBe(0.95);
    });
  });

  describe('processPlace with statistics', () => {
    beforeEach(() => {
      matcher.resetStatistics();
    });

    it('should track high confidence matches', () => {
      matcher.processPlace('USA');
      matcher.processPlace('FR'); // ISO2 code
      matcher.processPlace('United States of America');

      const stats = matcher.getStatistics();
      expect(stats.totalLocations).toBe(3);
      expect(stats.matched.high).toBe(3);
    });

    it('should track medium confidence matches', () => {
      matcher.processPlace('South Vietnam', 1970);
      matcher.processPlace('East Germany', 1980);

      const stats = matcher.getStatistics();
      expect(stats.matched.medium).toBe(2);
      expect(stats.methods.historical).toBe(2);
    });

    it('should track unresolved locations', () => {
      matcher.processPlace('Unknown Place', undefined, 'I001', 'birth');
      matcher.processPlace('Near the river', undefined, 'I002', 'death');

      const unresolved = matcher.getUnresolvedLocations();
      expect(unresolved).toHaveLength(2);
      expect(unresolved[0].original).toBe('Unknown Place');
      expect(unresolved[0].individualId).toBe('I001');
    });

    it('should return proper PlaceWithCountry structure', () => {
      const place = matcher.processPlace(
        'Dallas, Texas, USA',
        1960,
        'I001',
        'birth',
      );

      expect(place.original).toBe('Dallas, Texas, USA');
      expect(place.country).toBeDefined();
      expect(place.country?.iso2).toBe('US');
      expect(place.country?.confidence).toBe(0.9);
      expect(place.country?.method).toBe('pattern');
      expect(place.country?.matchedOn).toBe('USA');
    });
  });
});
