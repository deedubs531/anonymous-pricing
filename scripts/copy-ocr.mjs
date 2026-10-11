// Serves the OCR engine and English data with the site, so screenshots are read on the phone
// without contacting any other server.
import { copyFileSync, mkdirSync } from 'node:fs';

const out = 'dist/ocr';
mkdirSync(out, { recursive: true });
const files = {
  'node_modules/tesseract.js/dist/worker.min.js': 'worker.min.js',
  // The engine picks one of these depending on what the phone's browser supports.
  'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js': 'tesseract-core-lstm.wasm.js',
  'node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js': 'tesseract-core-simd-lstm.wasm.js',
  'node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js': 'tesseract-core-relaxedsimd-lstm.wasm.js',
  'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz': 'eng.traineddata.gz',
};
for (const [from, to] of Object.entries(files)) copyFileSync(from, `${out}/${to}`);
console.log(`copied OCR files to ${out}/`);
