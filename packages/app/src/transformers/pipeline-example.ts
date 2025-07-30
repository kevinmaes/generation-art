/**
 * Pipeline Example
 *
 * This file demonstrates how to use the VisualTransformer pipeline
 * with multiple transformers in sequence.
 */

import { runPipeline, createSimplePipeline } from './pipeline';
import type { GedcomDataWithMetadata } from '@generation-art/types';

/**
 * Example: Run a simple pipeline with the horizontal spread transformer
 */
export async function runSimpleExample(metadata: GedcomDataWithMetadata) {
  console.log('🎨 Running Simple Pipeline Example...');

  const config = createSimplePipeline(['horizontal-spread-by-generation'], {
    temperature: 0.5,
    seed: 'example-seed',
    canvasWidth: 800,
    canvasHeight: 600,
  });

  const result = await runPipeline(metadata, config);

  console.log('✅ Pipeline completed successfully!');
  console.log('📊 Results:', {
    executionTime: `${result.executionTime.toFixed(2)}ms`,
    transformersExecuted: result.transformerResults.length,
    finalVisualMetadata: result.visualMetadata,
  });

  return result;
}

/**
 * Example: Run a pipeline with multiple transformers
 * (This will work once we add more transformers)
 */
export async function runMultiTransformerExample(
  metadata: GedcomDataWithMetadata,
) {
  console.log('🎨 Running Multi-Transformer Pipeline Example...');

  const config = createSimplePipeline(
    [
      'horizontal-spread-by-generation',
      // 'color-by-generation',        // Future transformer
      // 'size-by-lifespan',          // Future transformer
    ],
    {
      temperature: 0.7,
      seed: 'multi-example-seed',
      canvasWidth: 1200,
      canvasHeight: 800,
    },
  );

  const result = await runPipeline(metadata, config);

  console.log('✅ Multi-transformer pipeline completed!');
  console.log('📊 Results:', {
    executionTime: `${result.executionTime.toFixed(2)}ms`,
    transformersExecuted: result.transformerResults.length,
    successfulTransformers: result.transformerResults.filter((r) => r.success)
      .length,
    failedTransformers: result.transformerResults.filter((r) => !r.success)
      .length,
  });

  // Log details for each transformer
  result.transformerResults.forEach((transformerResult, index) => {
    console.log(
      `  ${String(index + 1)}. ${transformerResult.transformerName}: ${
        transformerResult.success ? '✅' : '❌'
      } (${transformerResult.executionTime.toFixed(2)}ms)`,
    );

    if (!transformerResult.success && transformerResult.error) {
      console.log(`     Error: ${transformerResult.error}`);
    }
  });

  return result;
}

/**
 * Example: Demonstrate error handling with non-existent transformers
 */
export async function runErrorHandlingExample(
  metadata: GedcomDataWithMetadata,
) {
  console.log('🎨 Running Error Handling Example...');

  const config = createSimplePipeline(
    [
      'non-existent-transformer-1',
      'horizontal-spread-by-generation', // This should still work
      'non-existent-transformer-2',
    ],
    {
      temperature: 0.3,
      seed: 'error-example-seed',
    },
  );

  const result = await runPipeline(metadata, config);

  console.log('✅ Error handling example completed!');
  console.log('📊 Results:', {
    executionTime: `${result.executionTime.toFixed(2)}ms`,
    totalTransformers: result.transformerResults.length,
    successfulTransformers: result.transformerResults.filter((r) => r.success)
      .length,
    failedTransformers: result.transformerResults.filter((r) => !r.success)
      .length,
  });

  // Show that the pipeline continued despite failures
  if (result.transformerResults.some((r) => r.success)) {
    console.log(
      '✅ Pipeline continued execution despite some transformer failures',
    );
  }

  return result;
}

/**
 * Example: Compare different temperature settings
 */
export async function runTemperatureComparisonExample(
  metadata: GedcomDataWithMetadata,
) {
  console.log('🎨 Running Temperature Comparison Example...');

  const temperatures = [0.0, 0.5, 1.0];
  const results = [];

  for (const temperature of temperatures) {
    console.log(`\n🌡️  Testing temperature: ${String(temperature)}`);

    const config = createSimplePipeline(['horizontal-spread-by-generation'], {
      temperature,
      seed: 'temperature-comparison-seed',
      canvasWidth: 800,
      canvasHeight: 600,
    });

    const result = await runPipeline(metadata, config);
    results.push({ temperature, result });

    console.log(
      `  Result: ${result.transformerResults[0].success ? '✅' : '❌'}`,
    );
  }

  console.log('\n📊 Temperature Comparison Summary:');
  results.forEach(({ temperature, result }) => {
    console.log(
      `  Temperature ${String(temperature)}: ${result.transformerResults[0].success ? 'Success' : 'Failed'}`,
    );
  });

  return results;
}
