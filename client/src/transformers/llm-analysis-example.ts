import type { TransformerContext, VisualMetadata } from './types';
import { stripPIIForLLM } from '../../../shared/utils/pii-stripping';

/**
 * Example transformer that demonstrates PII stripping for LLM calls
 *
 * This transformer shows the pattern for:
 * 1. Keeping original data for local operations
 * 2. Stripping PII for LLM transmission
 * 3. Using LLM analysis to modify visual metadata
 */
export function llmAnalysisExampleTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<VisualMetadata> }> {
  const { gedcomData } = context;

  // Strip PII for LLM calls
  const { anonymizedData, strippingStats } = stripPIIForLLM(gedcomData);

  console.log('PII Stripping Stats:', strippingStats);

  // Example LLM prompt using anonymized data
  const llmPrompt = `
Analyze this family tree structure and suggest visual properties:

Tree Statistics:
- Total Individuals: ${String(anonymizedData.metadata.graphStructure.totalIndividuals)}
- Total Families: ${String(anonymizedData.metadata.graphStructure.totalFamilies)}
- Max Generations: ${String(anonymizedData.metadata.graphStructure.maxGenerations)}
- Gender Distribution: ${JSON.stringify(anonymizedData.metadata.demographics.genderDistribution)}

Temporal Patterns:
- Earliest Birth Year: ${String(anonymizedData.metadata.temporalPatterns.earliestBirthYear)}
- Latest Birth Year: ${String(anonymizedData.metadata.temporalPatterns.latestBirthYear)}

Family Structure:
${Object.values(anonymizedData.families)
  .map((family) => `- Family ${family.id}: ${family.children.length} children`)
  .join('\n')}

Based on this analysis, suggest:
1. A color scheme that reflects the family structure
2. Node sizes that represent generation depth
3. Visual layout that emphasizes family relationships
4. Opacity levels that show temporal patterns

Return your suggestions as JSON with properties: color, size, opacity, layout
`;

  // In a real implementation, this would call an actual LLM API
  // const llmResponse = await callLLM({
  //   prompt: llmPrompt,
  //   data: anonymizedData // Only anonymized data sent to LLM
  // });

  // For this example, we'll simulate an LLM response
  const simulatedLLMResponse = {
    color: '#4A90E2', // Blue for family unity
    size: 15, // Medium size for good visibility
    opacity: 0.8, // High opacity for strong presence
    layout: 'hierarchical', // Emphasize family structure
  };

  // Use LLM analysis to modify visual metadata
  return Promise.resolve({
    visualMetadata: {
      color: simulatedLLMResponse.color,
      size: simulatedLLMResponse.size,
      opacity: simulatedLLMResponse.opacity,
      // Additional properties based on LLM analysis
      strokeColor: '#2C3E50',
      strokeWeight: 2,
      shape: 'circle',
    },
  });
}

/**
 * Example of a more sophisticated LLM analysis transformer
 */
export function advancedLLMAnalysisTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<VisualMetadata> }> {
  const { gedcomData } = context;

  // Strip PII with custom configuration
  const { anonymizedData } = stripPIIForLLM(gedcomData, {
    namePattern: 'person_generation_index',
    keepYears: true,
    normalizeLifespan: true,
    stripLocations: true,
  });

  // Analyze family complexity
  const familyComplexity =
    Object.values(anonymizedData.families).reduce((total, family) => {
      return total + family.children.length;
    }, 0) / Object.keys(anonymizedData.families).length;

  // Analyze temporal spread
  const temporalSpread =
    anonymizedData.metadata.temporalPatterns.latestBirthYear -
    anonymizedData.metadata.temporalPatterns.earliestBirthYear;

  // Analyze gender balance
  const genderBalance =
    anonymizedData.metadata.demographics.genderDistribution.male.percentage /
    100;

  // Generate visual properties based on analysis
  const visualProperties = {
    // Color based on family complexity
    color: familyComplexity > 3 ? '#E74C3C' : '#27AE60',

    // Size based on temporal spread
    size: Math.min(20, Math.max(8, temporalSpread / 10)),

    // Opacity based on gender balance
    opacity: 0.5 + genderBalance * 0.5,

    // Shape based on generation depth
    shape:
      anonymizedData.metadata.graphStructure.maxGenerations > 4
        ? 'square'
        : 'circle',
  };

  return Promise.resolve({
    visualMetadata: visualProperties,
  });
}
