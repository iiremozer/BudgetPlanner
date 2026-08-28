import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages alt dizinden yayınlandığı için base yolu repo adıdır.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/BudgetPlanner/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
