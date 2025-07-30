/**
 * Pipeline Example
 *
 * This file demonstrates how to use the VisualTransformer pipeline
 * with multiple transformers in sequence.
 */

import { runPipeline, createSimplePipeline } from './pipeline';
import { HORIZONTAL_SPREAD } from './transformers';
import type { AppGedcomDataWithMetadata } from '../types/app-data';

/**
 * Example: Run a simple pipeline with the horizontal spread transformer
 */
export async function runSimpleExample(metadata: AppGedcomDataWithMetadata) {
  console.log('🎨 Running Simple Pipeline Example...');

  const config = createSimplePipeline([HORIZONTAL_SPREAD.ID], {
    temperature: 0.5,
    seed: 'example-seed',
    canvasWidth: 800,
    canvasHeight: 600,
  });

  const result = await runPipeline({
    fullData: metadata,
    llmData: {
      individuals: {},
      families: {},
      metadata: metadata.metadata,
    },
    config,
  });

  console.log('✅ Pipeline completed successfully!');
  console.log('📊 Results:', {
    executionTime: `${result.debug.totalExecutionTime.toFixed(2)}ms`,
    transformersExecuted: result.debug.transformerResults.length,
    finalVisualMetadata: result.visualMetadata,
  });

  return result;
}

/**
 * Example: Run a pipeline with multiple transformers
 * (This will work once we add more transformers)
 */
export async function runMultiTransformerExample(
  metadata: AppGedcomDataWithMetadata,
) {
  console.log('🎨 Running Multi-Transformer Pipeline Example...');

  const config = createSimplePipeline(
    [
      HORIZONTAL_SPREAD.ID,
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

  const result = await runPipeline({
    fullData: metadata,
    llmData: {
      individuals: {},
      families: {},
      metadata: metadata.metadata,
    },
    config,
  });

  console.log('✅ Multi-transformer pipeline completed!');
  console.log('📊 Results:', {
    executionTime: `${result.debug.totalExecutionTime.toFixed(2)}ms`,
    transformersExecuted: result.debug.transformerResults.length,
    successfulTransformers: result.debug.transformerResults.filter(
      (r) => r.success,
    ).length,
    failedTransformers: result.debug.transformerResults.filter(
      (r) => !r.success,
    ).length,
  });

  // Log details for each transformer
  result.debug.transformerResults.forEach(
    (transformerResult, index: number) => {
      console.log(
        `  ${String(index + 1)}. ${transformerResult.transformerName}: ${
          transformerResult.success ? '✅' : '❌'
        } (${transformerResult.executionTime.toFixed(2)}ms)`,
      );

      if (!transformerResult.success && transformerResult.error) {
        console.log(`     Error: ${transformerResult.error}`);
      }
    },
  );

  return result;
}

/**
 * Example: Demonstrate graceful handling of edge cases
 */
export async function runEdgeCaseExample(metadata: AppGedcomDataWithMetadata) {
  console.log('🎨 Running Edge Case Example...');

  // Create empty dataset to test transformer resilience
  const emptyMetadata: AppGedcomDataWithMetadata = {
    individuals: new Map(),
    families: new Map(),
    edges: new Map(),
    metadata: metadata.metadata, // Keep metadata structure but empty data
  };

  const config = createSimplePipeline([HORIZONTAL_SPREAD.ID], {
    temperature: 0.3,
    seed: 'edge-case-seed',
    canvasWidth: 800,
    canvasHeight: 600,
  });

  const result = await runPipeline({
    fullData: emptyMetadata,
    llmData: {
      individuals: {},
      families: {},
      metadata: emptyMetadata.metadata,
    },
    config,
  });

  console.log('✅ Edge case example completed!');
  console.log('📊 Results:', {
    executionTime: `${result.debug.totalExecutionTime.toFixed(2)}ms`,
    totalTransformers: result.debug.transformerResults.length,
    successfulTransformers: result.debug.transformerResults.filter(
      (r) => r.success,
    ).length,
    failedTransformers: result.debug.transformerResults.filter(
      (r) => !r.success,
    ).length,
  });

  // Show how transformers handle empty datasets
  if (result.debug.transformerResults.some((r) => r.success)) {
    console.log('✅ Transformers handled empty dataset gracefully');
  } else {
    console.log('⚠️ Transformers may need better empty data handling');
  }

  return result;
}

/**
 * Example: Compare different temperature settings
 */
export async function runTemperatureComparisonExample(
  metadata: AppGedcomDataWithMetadata,
) {
  console.log('🎨 Running Temperature Comparison Example...');

  const temperatures = [0.0, 0.5, 1.0];
  const results = [];

  for (const temperature of temperatures) {
    console.log(`\n🌡️  Testing temperature: ${String(temperature)}`);

    const config = createSimplePipeline([HORIZONTAL_SPREAD.ID], {
      temperature,
      seed: 'temperature-comparison-seed',
      canvasWidth: 800,
      canvasHeight: 600,
    });

    const result = await runPipeline({
      fullData: metadata,
      llmData: {
        individuals: {},
        families: {},
        metadata: metadata.metadata,
      },
      config,
    });
    results.push({ temperature, result });

    console.log(
      `  Result: ${result.debug.transformerResults[0].success ? '✅' : '❌'}`,
    );
  }

  console.log('\n📊 Temperature Comparison Summary:');
  results.forEach(({ temperature, result }) => {
    console.log(
      `  Temperature ${String(temperature)}: ${result.debug.transformerResults[0]?.success ? 'Success' : 'Failed'}`,
    );
  });

  return results;
}
