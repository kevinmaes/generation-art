import type { TransformerContext, VisualMetadata } from './types';

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
  const { llmData } = context;

  console.log('🔍 LLM Analysis Example: Analyzing anonymized data...');
  console.log(
    `📊 Processing ${String(Object.keys(llmData.individuals).length)} anonymized individuals`,
  );

  const llmPrompt = `
Analyze this family tree structure and suggest visual properties:
Tree Statistics:
- Total Individuals: ${String(llmData.metadata.graphStructure.totalIndividuals)}
- Gender Distribution: ${JSON.stringify(llmData.metadata.demographics.genderDistribution)}
- Geographic Patterns: ${JSON.stringify(llmData.metadata.geographicPatterns.countryDistribution)}
- Temporal Span: ${String(llmData.metadata.temporalPatterns.timeSpan)} years
`;

  console.log('🤖 Simulating LLM call with prompt:', llmPrompt);

  // Simulate LLM response (in real implementation, this would call an LLM API)
  const simulatedLLMResponse = {
    color: '#4A90E2',
    size: 15,
    opacity: 0.8,
    layout: 'hierarchical',
  };

  return Promise.resolve({
    visualMetadata: {
      color: simulatedLLMResponse.color,
      size: simulatedLLMResponse.size,
      opacity: simulatedLLMResponse.opacity,
      strokeColor: '#2C3E50',
      strokeWeight: 2,
      shape: 'circle' as VisualMetadata['shape'],
    },
  });
}

/**
 * Example of a more sophisticated LLM analysis transformer
 */
export function advancedLLMAnalysisTransform(
  context: TransformerContext,
): Promise<{ visualMetadata: Partial<VisualMetadata> }> {
  const { llmData, gedcomData } = context;

  console.log('🧠 Advanced LLM Analysis: Using both full and LLM data...');

  // Use full data for local calculations
  const totalIndividuals = gedcomData.individuals.size;
  const averageAge =
    Array.from(gedcomData.individuals.values())
      .map((ind) => ind.metadata.lifespan ?? 0)
      .reduce((sum, age) => sum + age, 0) / totalIndividuals;

  // Use LLM data for external analysis
  const llmPrompt = `
Advanced family tree analysis:
- Tree complexity: ${String(llmData.metadata.graphStructure.treeComplexity)}
- Average family size: ${String(llmData.metadata.graphStructure.averageFamilySize)}
- Geographic diversity: ${String(Object.keys(llmData.metadata.geographicPatterns.countryDistribution).length)} countries
- Temporal patterns: ${String(Object.keys(llmData.metadata.temporalPatterns.generationTimeSpans).length)} generation time spans
`;

  console.log('🤖 Simulating advanced LLM call:', llmPrompt);

  // Simulate LLM response based on analysis
  const visualProperties = {
    color: averageAge > 0.7 ? '#E74C3C' : '#27AE60', // Red for older trees, green for younger
    size: Math.max(8, Math.min(20, totalIndividuals / 10)), // Size based on tree size
    opacity: 0.75,
    shape: 'square' as VisualMetadata['shape'],
  };

  return Promise.resolve({ visualMetadata: visualProperties });
}
