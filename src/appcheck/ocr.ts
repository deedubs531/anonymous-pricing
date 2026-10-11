// Reads the text in a screenshot on this device. Nothing is uploaded: the OCR engine and its
// English data are served with the site from /ocr/ (see scripts/copy-ocr.mjs) and run in the browser.
import type { Worker } from 'tesseract.js';

let worker: Promise<Worker> | undefined;
let progress: (p: number) => void = () => {};

function getWorker(): Promise<Worker> {
  worker ??= import('tesseract.js').then(({ createWorker, OEM, PSM }) => {
    // This page is /app-check/, so the shared OCR files are one level up.
    const root = new URL('../ocr/', document.baseURI).href;
    return createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: `${root}worker.min.js`,
      corePath: root,
      langPath: root,
      workerBlobURL: false,
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') progress(m.progress);
      },
    }).then(async (w) => {
      // Sparse text: app screens are scattered labels and prices, not paragraphs. Reading them
      // as a block merges a ride's name with the line under it.
      await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      return w;
    });
  });
  return worker;
}

/** The text in an image, line by line. */
export async function readText(image: Blob, onProgress: (p: number) => void = () => {}): Promise<string> {
  progress = onProgress;
  const w = await getWorker();
  const { data } = await w.recognize(image);
  return data.text;
}
