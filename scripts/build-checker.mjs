// Builds the price check into two files in dist/:
//   price-check.js       – runs immediately (the bookmarklet's code)
//   price-check.user.js  – userscript for the Userscripts app (iPhone Safari), Tampermonkey or Violentmonkey
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'vite';

const SITE = 'https://deedubs531.github.io/anonymous-pricing/';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

async function bundle(entry, fileName) {
  await build({
    configFile: false,
    logLevel: 'warn',
    define: { __API_URL__: JSON.stringify(process.env.API_URL ?? '') },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      minify: true,
      lib: { entry, formats: ['iife'], name: 'WhoPaysMore', fileName: () => fileName },
    },
  });
}

await bundle('checker/bookmarklet.ts', 'price-check.js');
await bundle('checker/userscript.ts', 'price-check.body.js');

const header = `// ==UserScript==
// @name         Who Pays More: Price check
// @namespace    ${SITE}
// @version      ${version}
// @description  Compares the price you see with what a signed-out visitor sees on the same connection.
// @match        *://*/*
// @run-at       document-idle
// @noframes
// @grant        none
// @homepageURL  ${SITE}
// @downloadURL  ${SITE}price-check.user.js
// @updateURL    ${SITE}price-check.user.js
// ==/UserScript==
`;
writeFileSync('dist/price-check.user.js', header + readFileSync('dist/price-check.body.js', 'utf8'));
const { rmSync } = await import('node:fs');
rmSync('dist/price-check.body.js');
console.log('built dist/price-check.js and dist/price-check.user.js');
