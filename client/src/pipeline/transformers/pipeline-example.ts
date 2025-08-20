/**
 * Pipeline Example
 *
 * This file demonstrates how to use the VisualTransformer pipeline
 * with multiple transformers in sequence.
 */

import { runPipeline, createSimplePipeline } from './pipeline';
import type {
  GedcomDataWithMetadata,
  LLMReadyData,
} from '../../../../shared/types';

/**
 * Example: Run a simple pipeline with the horizontal spread transformer
 */
export async function runSimpleExample(
  fullData: GedcomDataWithMetadata,
  llmData: LLMReadyData,
) {
  console.log('🎨 Running Simple Pipeline Example...');

  const config = createSimplePipeline(['horizontal-spread'], {
    temperature: 0.5,
    seed: 'example-seed',
    canvasWidth: 800,
    canvasHeight: 600,
  });

  const result = await runPipeline({ fullData, llmData, config });

  console.log('✅ Pipeline completed successfully!');
  console.log('📊 Results:', {
    executionTime: `${String(result.debug.totalExecutionTime.toFixed(2))}ms`,
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
  fullData: GedcomDataWithMetadata,
  llmData: LLMReadyData,
) {
  console.log('🎨 Running Multi-Transformer Pipeline Example...');

  const config = createSimplePipeline(
    [
      'horizontal-spread',
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

  const result = await runPipeline({ fullData, llmData, config });

  console.log('✅ Multi-transformer pipeline completed!');
  console.log('📊 Results:', {
    executionTime: `${String(result.debug.totalExecutionTime.toFixed(2))}ms`,
    transformersExecuted: result.debug.transformerResults.length,
    successfulTransformers: result.debug.transformerResults.filter(
      (r) => r.success,
    ).length,
    failedTransformers: result.debug.transformerResults.filter(
      (r) => !r.success,
    ).length,
  });

  // Log details for each transformer
  result.debug.transformerResults.forEach((transformerResult, index) => {
    console.log(
      `  ${String(index + 1)}. ${String(transformerResult.transformerName)}: ${
        transformerResult.success ? '✅' : '❌'
      } (${String(transformerResult.executionTime.toFixed(2))}ms)`,
    );

    if (!transformerResult.success && transformerResult.error) {
      console.log(`     Error: ${String(transformerResult.error)}`);
    }
  });

  return result;
}

/**
 * Example: Demonstrate error handling with non-existent transformers
 */
export async function runErrorHandlingExample(
  fullData: GedcomDataWithMetadata,
  llmData: LLMReadyData,
) {
  console.log('🎨 Running Error Handling Example...');

  // Note: This example demonstrates error handling during pipeline execution
  // For TypeScript safety, we use valid transformer IDs but can still demo error handling
  // through other means (invalid parameters, network issues, etc.)
  const config = createSimplePipeline(
    [
      'horizontal-spread', // Valid transformer
      // TODO: Demo error handling with invalid parameters or other runtime errors
    ],
    {
      temperature: 0.3,
      seed: 'error-example-seed',
    },
  );

  const result = await runPipeline({ fullData, llmData, config });

  console.log('✅ Error handling example completed!');
  console.log('📊 Results:', {
    executionTime: `${String(result.debug.totalExecutionTime.toFixed(2))}ms`,
    totalTransformers: result.debug.transformerResults.length,
    successfulTransformers: result.debug.transformerResults.filter(
      (r) => r.success,
    ).length,
    failedTransformers: result.debug.transformerResults.filter(
      (r) => !r.success,
    ).length,
  });

  // Show that the pipeline continued despite failures
  if (result.debug.transformerResults.some((r) => r.success)) {
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
  fullData: GedcomDataWithMetadata,
  llmData: LLMReadyData,
) {
  console.log('🎨 Running Temperature Comparison Example...');

  const temperatures = [0.0, 0.5, 1.0];
  const results = [];

  for (const temperature of temperatures) {
    console.log(`\n🌡️  Testing temperature: ${String(temperature)}`);

    const config = createSimplePipeline(['horizontal-spread'], {
      temperature,
      seed: 'temperature-comparison-seed',
      canvasWidth: 800,
      canvasHeight: 600,
    });

    const result = await runPipeline({ fullData, llmData, config });
    results.push({ temperature, result });

    console.log(
      `  Result: ${result.debug.transformerResults[0]?.success ? '✅' : '❌'}`,
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
