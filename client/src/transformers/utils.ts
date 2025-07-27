/**
 * Transformer utilities
 */

/**
 * Convert a transformer name to a slugified ID
 * e.g., "Horizontal Spread by Generation" -> "horizontal-spread-by-generation"
 */
export function slugifyTransformerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate that a transformer ID is valid
 */
export function isValidTransformerId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id) && id.length > 0;
}

/**
 * Generate a unique transformer ID from a name
 */
export function generateTransformerId(name: string): string {
  const slug = slugifyTransformerName(name);

  if (!isValidTransformerId(slug)) {
    throw new Error(
      `Invalid transformer name: "${name}" - cannot generate valid ID`,
    );
  }

  return slug;
}
