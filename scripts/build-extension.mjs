// Builds the browser extension for Chrome (also Edge and Brave) and Firefox:
//   extension/build/chrome/ and extension/build/firefox/  – unpacked, for "Load unpacked" / testing
//   dist/extension/who-pays-more-chrome.zip and -firefox.zip – downloadable from the site
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const out = 'extension/build/chrome';
rmSync('extension/build', { recursive: true, force: true });

for (const entry of ['content', 'background', 'popup', 'welcome']) {
  await build({
    configFile: false,
    logLevel: 'warn',
    define: { __API_URL__: JSON.stringify(process.env.API_URL ?? '') },
    build: {
      outDir: out,
      emptyOutDir: false,
      minify: true,
      lib: { entry: `extension/src/${entry}.ts`, formats: ['iife'], name: 'WhoPaysMore', fileName: () => `${entry}.js` },
    },
  });
}
for (const f of ['popup.html', 'welcome.html', 'page.css']) cpSync(`extension/src/${f}`, `${out}/${f}`);
cpSync('extension/icons', `${out}/icons`, { recursive: true });

const icons = { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' };
const manifest = {
  manifest_version: 3,
  name: 'Who Pays More: Price check',
  version,
  description: 'Shows when a store charges you more than a signed-out visitor, and (if you choose) adds the result to public totals.',
  homepage_url: 'https://deedubs531.github.io/anonymous-pricing/',
  icons,
  action: { default_popup: 'popup.html', default_icon: icons },
  permissions: ['storage'],
  host_permissions: ['http://*/*', 'https://*/*'],
  content_scripts: [{ matches: ['http://*/*', 'https://*/*'], js: ['content.js'], run_at: 'document_idle' }],
};
writeFileSync(`${out}/manifest.json`, JSON.stringify({ ...manifest, background: { service_worker: 'background.js' } }, null, 2));

const ff = 'extension/build/firefox';
cpSync(out, ff, { recursive: true });
writeFileSync(
  `${ff}/manifest.json`,
  JSON.stringify(
    {
      ...manifest,
      background: { scripts: ['background.js'] },
      browser_specific_settings: { gecko: { id: 'who-pays-more@deedubs531.github.io', strict_min_version: '115.0', data_collection_permissions: { required: ['none'], optional: ['websiteContent'] } } },
    },
    null,
    2,
  ),
);

mkdirSync('dist/extension', { recursive: true });
for (const target of ['chrome', 'firefox']) {
  const zip = `${process.cwd()}/dist/extension/who-pays-more-${target}.zip`;
  rmSync(zip, { force: true });
  execFileSync('zip', ['-qr', zip, '.'], { cwd: `extension/build/${target}` });
}
console.log('built extension/build/{chrome,firefox} and dist/extension/*.zip');
