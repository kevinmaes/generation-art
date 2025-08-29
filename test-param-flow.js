// Test script to verify parameter flow
// Run this in the browser console after loading the app

// 1. Check if node-country-color transformer exists
const transformer = window.transformerConfigs?.['node-country-color'];
console.log('Transformer config:', transformer);

// 2. Check default visual parameters
if (transformer) {
  console.log('Visual parameters:');
  transformer.visualParameters.forEach((param) => {
    console.log(`  ${param.name}: ${param.defaultValue}`);
  });
}

// 3. Test createTransformerInstance
if (transformer && transformer.createTransformerInstance) {
  const testParams = {
    dimensions: { primary: 'generation' },
    visual: {
      strokeMode: 'darker',
      layerMode: 'multi',
      colorIntensity: 0.5,
    },
  };

  console.log('Testing createTransformerInstance with:', testParams);
  const instance = transformer.createTransformerInstance(testParams);
  console.log('Instance created:', typeof instance);
}

console.log('Test complete - check debug logs above');
