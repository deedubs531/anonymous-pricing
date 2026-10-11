import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative paths, so the site works at a domain root or in a GitHub Pages subfolder.
  base: './',
  build: {
    rollupOptions: {
      // Two pages: the guide, and the two-account check at /app-check/.
      input: { main: 'index.html', appCheck: 'app-check/index.html' },
    },
  },
  test: {
    environment: 'jsdom',
  },
});
