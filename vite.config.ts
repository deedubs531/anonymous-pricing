import { defineConfig } from 'vitest/config';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

export default defineConfig({
  // Relative paths, so the site works at a domain root or in a GitHub Pages subfolder.
  base: './',
  // Where shared checks go (see shared/config.ts); empty unless set when building.
  define: { __API_URL__: JSON.stringify(env.API_URL ?? '') },
  build: {
    rollupOptions: {
      // Pages: the guide, the two-account check at /app-check/ and the findings at /dashboard/.
      input: { main: 'index.html', appCheck: 'app-check/index.html', dashboard: 'dashboard/index.html' },
    },
  },
  test: {
    environment: 'jsdom',
  },
});
