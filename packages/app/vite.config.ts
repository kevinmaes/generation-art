import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, '../types'),
      '@utils': path.resolve(__dirname, '../utils'),
      '@cli': path.resolve(__dirname, '../cli'),
    },
  },
});
