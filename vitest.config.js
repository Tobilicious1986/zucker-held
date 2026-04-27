import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      '**/.claude/**',
      '**/node_modules/**',
      '**/_deleted/**',
      '**/dist/**',
      '**/.next/**',
      '**/target/**',
    ],
  },
});
