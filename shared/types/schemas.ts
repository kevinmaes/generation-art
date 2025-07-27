import { z } from 'zod';

/**
 * Zod schemas for shared types
 * These provide runtime validation and can be used to derive TypeScript types
 */

// Base schemas
export const IndividualSchema = z.object({
  id: z.string(),
  name: z.string(),
  birth: z
    .object({
      date: z.string().optional(),
      place: z.string().optional(),
    })
    .optional(),
  death: z
    .object({
      date: z.string().optional(),
      place: z.string().optional(),
    })
    .optional(),
  parents: z.array(z.string()),
  spouses: z.array(z.string()),
  children: z.array(z.string()),
  siblings: z.array(z.string()),
});

export const FamilySchema = z.object({
  id: z.string(),
  husband: IndividualSchema.optional(),
  wife: IndividualSchema.optional(),
  children: z.array(IndividualSchema),
});

export const GedcomDataSchema = z.object({
  individuals: z.array(IndividualSchema),
  families: z.array(FamilySchema),
});

// Metadata schemas
export const IndividualMetadataSchema = z.object({
  lifespan: z.number().min(0).max(1).optional(),
  isAlive: z.boolean().optional(),
  birthMonth: z.number().min(1).max(12).optional(),
  zodiacSign: z.string().optional(),
  generation: z.number().nullable().optional(),
  relativeGenerationValue: z.number().min(0).max(100).optional(),
});

export const FamilyMetadataSchema = z.object({
  numberOfChildren: z.number().min(0),
});

export const TreeMetadataSchema = z.object({
  totalIndividuals: z.number().min(0).optional(),
  depthOfTree: z.number().min(0).optional(),
});

// Augmented schemas
export const AugmentedIndividualSchema = IndividualSchema.extend({
  metadata: IndividualMetadataSchema,
});

export const FamilyWithMetadataSchema = FamilySchema.extend({
  metadata: FamilyMetadataSchema,
});

export const GedcomDataWithMetadataSchema = z.object({
  individuals: z.array(AugmentedIndividualSchema),
  families: z.array(FamilyWithMetadataSchema),
  metadata: TreeMetadataSchema,
});

// Alternative format for enhanced data (array of individuals)
export const EnhancedIndividualArraySchema = z.array(AugmentedIndividualSchema);

// Union schema for flexible input validation
export const FlexibleGedcomDataSchema = z.union([
  GedcomDataWithMetadataSchema,
  z.object({
    individuals: z.array(AugmentedIndividualSchema),
    families: z.array(FamilyWithMetadataSchema),
  }),
  EnhancedIndividualArraySchema,
]);

// Type exports derived from schemas
export type Individual = z.infer<typeof IndividualSchema>;
export type Family = z.infer<typeof FamilySchema>;
export type GedcomData = z.infer<typeof GedcomDataSchema>;
export type IndividualMetadata = z.infer<typeof IndividualMetadataSchema>;
export type FamilyMetadata = z.infer<typeof FamilyMetadataSchema>;
export type TreeMetadata = z.infer<typeof TreeMetadataSchema>;
export type AugmentedIndividual = z.infer<typeof AugmentedIndividualSchema>;
export type FamilyWithMetadata = z.infer<typeof FamilyWithMetadataSchema>;
export type GedcomDataWithMetadata = z.infer<
  typeof GedcomDataWithMetadataSchema
>;

// Validation functions
export const validateGedcomData = (data: unknown): GedcomData => {
  return GedcomDataSchema.parse(data);
};

export const validateGedcomDataWithMetadata = (
  data: unknown,
): GedcomDataWithMetadata => {
  return GedcomDataWithMetadataSchema.parse(data);
};

export const validateFlexibleGedcomData = (
  data: unknown,
): GedcomDataWithMetadata => {
  const parsed = FlexibleGedcomDataSchema.parse(data);

  // Handle different formats
  if (Array.isArray(parsed)) {
    // Enhanced format: array of individuals
    return {
      individuals: parsed,
      families: [],
      metadata: {
        totalIndividuals: parsed.length,
      },
    };
  } else if ('individuals' in parsed && 'families' in parsed) {
    // Check if it has metadata
    if ('metadata' in parsed) {
      return parsed;
    } else {
      // Raw format: add empty metadata
      return {
        ...parsed,
        metadata: {
          totalIndividuals: parsed.individuals.length,
        },
      };
    }
  }

  throw new Error('Invalid data format');
};

// Safe parsing functions that return results instead of throwing
export const safeValidateGedcomData = (data: unknown) => {
  return GedcomDataSchema.safeParse(data);
};

export const safeValidateGedcomDataWithMetadata = (data: unknown) => {
  return GedcomDataWithMetadataSchema.safeParse(data);
};

export const safeValidateFlexibleGedcomData = (data: unknown) => {
  return FlexibleGedcomDataSchema.safeParse(data);
};
