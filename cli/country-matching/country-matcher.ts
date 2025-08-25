import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  CountryMatchingMap,
  MatchResult,
  PlaceWithCountry,
  ProcessingMetadata,
  UnresolvedLocation,
} from './types.js';

export class CountryMatcher {
  private countryData: CountryMatchingMap;
  private iso3ToIso2 = new Map<string, string>();
  private aliasToIso2 = new Map<string, string>();
  private regionToIso2 = new Map<string, string>();
  private processingStats!: ProcessingMetadata;
  private unresolvedLocations: UnresolvedLocation[] = [];

  constructor(dataPath?: string) {
    const path =
      dataPath ?? join(process.cwd(), 'cli/data/country-matching.json');
    const rawData = readFileSync(path, 'utf-8');
    this.countryData = JSON.parse(rawData) as CountryMatchingMap;

    this.buildLookupMaps();
    this.resetStats();
  }

  private buildLookupMaps(): void {
    for (const [iso2, data] of Object.entries(this.countryData)) {
      // Build ISO3 to ISO2 map
      this.iso3ToIso2.set(data.iso3, iso2);
      this.iso3ToIso2.set(data.iso3.toLowerCase(), iso2);

      // Build alias map
      for (const alias of data.aliases) {
        this.aliasToIso2.set(alias.toLowerCase(), iso2);
      }

      // Build region map
      if (data.regions) {
        for (const region of data.regions) {
          this.regionToIso2.set(region.toLowerCase(), iso2);
        }
      }
    }
  }

  private resetStats(): void {
    this.processingStats = {
      totalLocations: 0,
      matched: {
        high: 0,
        medium: 0,
        low: 0,
        unmatched: 0,
      },
      methods: {
        exact: 0,
        alias: 0,
        pattern: 0,
        region: 0,
        fuzzy: 0,
        historical: 0,
        unmatched: 0,
      },
    };
    this.unresolvedLocations = [];
  }

  public matchCountry(
    input: string,
    year?: number,
    _context?: unknown,
  ): MatchResult {
    if (!input || input.trim() === '') {
      return { iso2: null, confidence: 0, method: 'fuzzy' };
    }

    const normalizedInput = input.trim();

    // 1. Check exact ISO match (confidence: 1.0)
    const exactMatch = this.checkExactISO(normalizedInput);
    if (exactMatch) {
      return exactMatch;
    }

    // 2. Check aliases (confidence: 0.95)
    const aliasMatch = this.checkAlias(normalizedInput);
    if (aliasMatch) {
      return aliasMatch;
    }

    // 3. Pattern matching for "City, Country" format (confidence: 0.90)
    const patternMatch = this.checkPattern(normalizedInput);
    if (patternMatch) {
      return patternMatch;
    }

    // 4. Region/state/city matching (confidence: 0.85)
    const regionMatch = this.checkRegion(normalizedInput);
    if (regionMatch) {
      return regionMatch;
    }

    // 5. Historical matching with year context (confidence: 0.75)
    if (year) {
      const historicalMatch = this.checkHistorical(normalizedInput, year);
      if (historicalMatch) {
        return historicalMatch;
      }
    }

    // 6. Check partial string matching (confidence: 0.85)
    // This comes after pattern, region, and historical matching to avoid intercepting more specific matches
    const partialMatch = this.checkPartialMatch(normalizedInput);
    if (partialMatch) {
      return partialMatch;
    }

    // 7. Fuzzy matching (confidence: 0.60)
    const fuzzyMatch = this.checkFuzzy(normalizedInput);
    if (fuzzyMatch && fuzzyMatch.confidence >= 0.5) {
      return fuzzyMatch;
    }

    // 8. No match found
    return {
      iso2: null,
      confidence: 0,
      method: 'fuzzy',
      details: {
        originalInput: normalizedInput,
      },
    };
  }

  private checkExactISO(input: string): MatchResult | null {
    const upperInput = input.toUpperCase();

    // Check ISO2
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.countryData[upperInput]) {
      return {
        iso2: upperInput,
        confidence: 1.0,
        method: 'exact',
        details: {
          originalInput: input,
          matchedValue: upperInput,
        },
      };
    }

    // Check ISO3
    const iso2FromIso3 = this.iso3ToIso2.get(input.toLowerCase());
    if (iso2FromIso3) {
      return {
        iso2: iso2FromIso3,
        confidence: 1.0,
        method: 'exact',
        details: {
          originalInput: input,
          matchedValue: input.toUpperCase(),
        },
      };
    }

    return null;
  }

  private checkAlias(input: string): MatchResult | null {
    const lowerInput = input.toLowerCase();
    const iso2 = this.aliasToIso2.get(lowerInput);

    if (iso2) {
      return {
        iso2,
        confidence: 0.95,
        method: 'alias',
        details: {
          originalInput: input,
          matchedValue: input,
        },
      };
    }

    return null;
  }

  private checkPartialMatch(input: string): MatchResult | null {
    const lowerInput = input.toLowerCase();

    // Skip partial matching for known historical terms
    const historicalPrefixes = [
      'east ',
      'west ',
      'north ',
      'south ',
      'soviet ',
      'former ',
    ];
    if (historicalPrefixes.some((prefix) => lowerInput.startsWith(prefix))) {
      return null;
    }

    let bestMatch: {
      iso2: string;
      matchedValue: string;
      length: number;
    } | null = null;

    // Check if input contains any country canonical name or alias
    // Prioritize longer matches to avoid false positives like "US" in "Russia"
    for (const [iso2, data] of Object.entries(this.countryData)) {
      // Check canonical name with word boundaries
      const canonicalLower = data.canonical.toLowerCase();
      if (this.containsAsWord(lowerInput, canonicalLower)) {
        if (!bestMatch || canonicalLower.length > bestMatch.length) {
          bestMatch = {
            iso2,
            matchedValue: data.canonical,
            length: canonicalLower.length,
          };
        }
      }

      // Check aliases with word boundaries
      for (const alias of data.aliases) {
        const aliasLower = alias.toLowerCase();
        if (this.containsAsWord(lowerInput, aliasLower)) {
          if (!bestMatch || aliasLower.length > bestMatch.length) {
            bestMatch = {
              iso2,
              matchedValue: alias,
              length: aliasLower.length,
            };
          }
        }
      }
    }

    if (bestMatch) {
      return {
        iso2: bestMatch.iso2,
        confidence: 0.85,
        method: 'pattern',
        details: {
          originalInput: input,
          matchedValue: bestMatch.matchedValue,
        },
      };
    }

    return null;
  }

  private containsAsWord(text: string, word: string): boolean {
    // Check if word appears with word boundaries (spaces, commas, start/end of string)
    const regex = new RegExp(
      `(^|[,\\s])(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})($|[,\\s])`,
      'i',
    );
    return regex.test(text);
  }

  private checkPattern(input: string): MatchResult | null {
    // Common patterns: "City, State, Country" or "City, Country"
    const parts = input.split(',').map((p) => p.trim());

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];

      // Check if last part is a country
      const countryMatch =
        this.checkExactISO(lastPart) ?? this.checkAlias(lastPart);

      if (countryMatch) {
        return {
          ...countryMatch,
          confidence: 0.9,
          method: 'pattern',
          details: {
            originalInput: input,
            matchedValue: lastPart,
          },
        };
      }

      // Check patterns in country data
      for (const [iso2, data] of Object.entries(this.countryData)) {
        for (const pattern of data.patterns) {
          if (this.matchesPattern(input, pattern)) {
            return {
              iso2,
              confidence: 0.9,
              method: 'pattern',
              details: {
                originalInput: input,
                matchedValue: pattern,
              },
            };
          }
        }
      }
    }

    return null;
  }

  private matchesPattern(input: string, pattern: string): boolean {
    // Convert pattern like "*, USA" to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/,/g, '\\s*,\\s*');

    const regex = new RegExp(regexPattern, 'i');
    return regex.test(input);
  }

  private checkRegion(input: string): MatchResult | null {
    const lowerInput = input.toLowerCase();

    // Direct region lookup
    const iso2 = this.regionToIso2.get(lowerInput);
    if (iso2) {
      return {
        iso2,
        confidence: 0.85,
        method: 'region',
        details: {
          originalInput: input,
          matchedValue: input,
        },
      };
    }

    // Check if input contains a region
    const parts = input.split(/[,\s]+/);
    for (const part of parts) {
      const regionIso2 = this.regionToIso2.get(part.toLowerCase());
      if (regionIso2) {
        return {
          iso2: regionIso2,
          confidence: 0.85,
          method: 'region',
          details: {
            originalInput: input,
            matchedValue: part,
          },
        };
      }
    }

    return null;
  }

  private checkHistorical(input: string, year: number): MatchResult | null {
    const lowerInput = input.toLowerCase();

    for (const [iso2, data] of Object.entries(this.countryData)) {
      if (data.historicalNames) {
        for (const [historicalName, [startYear, endYear]] of Object.entries(
          data.historicalNames,
        )) {
          if (
            lowerInput.includes(historicalName.toLowerCase()) &&
            year >= startYear &&
            year <= endYear
          ) {
            return {
              iso2,
              confidence: 0.75,
              method: 'historical',
              details: {
                originalInput: input,
                matchedValue: historicalName,
                historicalYear: year,
              },
            };
          }
        }
      }
    }

    return null;
  }

  private checkFuzzy(input: string): MatchResult | null {
    const lowerInput = input.toLowerCase();
    let bestMatch: { iso2: string; distance: number; matched: string } | null =
      null;

    // Check against canonical names and aliases
    for (const [iso2, data] of Object.entries(this.countryData)) {
      const candidates = [data.canonical, ...data.aliases];

      for (const candidate of candidates) {
        const distance = this.levenshteinDistance(
          lowerInput,
          candidate.toLowerCase(),
        );

        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { iso2, distance, matched: candidate };
        }
      }
    }

    if (bestMatch && bestMatch.distance <= 3) {
      const confidence = Math.max(0.3, 0.6 - bestMatch.distance * 0.1);
      return {
        iso2: bestMatch.iso2,
        confidence,
        method: 'fuzzy',
        details: {
          originalInput: input,
          matchedValue: bestMatch.matched,
        },
      };
    }

    return null;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  public processPlace(
    originalPlace: string,
    year?: number,
    individualId?: string,
    eventType?: string,
  ): PlaceWithCountry {
    this.processingStats.totalLocations++;

    const matchResult = this.matchCountry(originalPlace, year);

    // Update statistics
    if (matchResult.iso2) {
      if (matchResult.confidence >= 0.9) {
        this.processingStats.matched.high++;
      } else if (matchResult.confidence >= 0.7) {
        this.processingStats.matched.medium++;
      } else if (matchResult.confidence >= 0.5) {
        this.processingStats.matched.low++;
      } else {
        this.processingStats.matched.unmatched++;
      }
      this.processingStats.methods[matchResult.method]++;
    } else {
      this.processingStats.matched.unmatched++;
      this.processingStats.methods.unmatched++;

      // Track unresolved location
      this.unresolvedLocations.push({
        original: originalPlace,
        individualId,
        eventType,
        context: { year },
      });
    }

    const place: PlaceWithCountry = {
      original: originalPlace,
    };

    if (matchResult.iso2) {
      place.country = {
        iso2: matchResult.iso2,
        confidence: matchResult.confidence,
        method: matchResult.method,
        matchedOn: matchResult.details?.matchedValue,
      };

      if (matchResult.details?.alternativeMatches) {
        place.country.alternatives = matchResult.details.alternativeMatches;
      }
    }

    return place;
  }

  public getStatistics(): ProcessingMetadata {
    return { ...this.processingStats };
  }

  public getUnresolvedLocations(): UnresolvedLocation[] {
    return [...this.unresolvedLocations];
  }

  public resetStatistics(): void {
    this.resetStats();
  }
}
