import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative paths, so the site works at a domain root or in a GitHub Pages subfolder.
  base: './',
  test: {
    environment: 'jsdom',
  },
});
