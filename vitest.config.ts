import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'client/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'cli/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'shared/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'client/src/types/',
        'cli/types/',
        'shared/types/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/types.ts',
      ],
    },
  },
});
