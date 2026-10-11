// Finds prices in text read from an app screenshot, with the words next to each one.
import { parsePrice } from '../../checker/extract';

export interface PriceCandidate {
  amount: number;
  /** Words on the same line (or the line above), e.g. "UberX" or "Subtotal". */
  label: string;
}

// "$24.80", "$ 1,024.50", "S24.80" (OCR often reads $ as S) or a bare "24.80".
const AMOUNT = /(?:[$S]\s?)?(\d{1,4}(?:,\d{3})*[.,]\d{2})(?!\d)/g;

const AMOUNT_TEST = /\d[.,]\d{2}(?!\d)/;
const hasWords = (s: string) => /\p{L}{2,}/u.test(s);

function cleanLabel(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s'&+-]/gu, ' ')
    .replace(/\b\d+\s?(min|mins|minutes?)(\s+away)?\b/gi, '')
    .replace(/\b\d{1,2}\s?[:.]?\s?\d{2}\s?(am|pm)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findPrices(text: string): PriceCandidate[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const found: PriceCandidate[] = [];
  lines.forEach((line, i) => {
    for (const m of line.matchAll(AMOUNT)) {
      const amount = parsePrice(m[1]);
      if (amount === undefined) continue;
      // The words on the price's own line, else the nearest line above that has some
      // (screenshots are often read as "UberX", "4 min away · 9:52 PM", "$24.80").
      let label = cleanLabel(line.replace(m[0], ' '));
      for (let j = i - 1; !hasWords(label) && j >= Math.max(0, i - 3); j--) {
        if (!AMOUNT_TEST.test(lines[j])) label = cleanLabel(lines[j]);
      }
      if (!hasWords(label)) label = '';
      if (!found.some((f) => f.amount === amount && f.label === label)) found.push({ amount, label });
    }
  });
  return found;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The candidate most likely to be the one to compare: a keyword match, else the first price. */
export function pickDefault(candidates: PriceCandidate[], keywords: RegExp): number {
  const i = candidates.findIndex((c) => keywords.test(c.label));
  return i >= 0 ? i : 0;
}

/** In the second screenshot, the candidate with the same label as the one picked in the first. */
export function matchLabel(candidates: PriceCandidate[], label: string): number | undefined {
  const key = norm(label);
  if (!key) return undefined;
  const i = candidates.findIndex((c) => norm(c.label) === key);
  return i >= 0 ? i : undefined;
}

/** Labels found in both screenshots, for a side-by-side of every option (UberX, Comfort, XL…). */
export function pairByLabel(a: PriceCandidate[], b: PriceCandidate[]): { label: string; mine: number; clean: number }[] {
  const pairs: { label: string; mine: number; clean: number }[] = [];
  for (const x of a) {
    const j = matchLabel(b, x.label);
    if (j !== undefined && !pairs.some((p) => norm(p.label) === norm(x.label))) pairs.push({ label: x.label, mine: x.amount, clean: b[j].amount });
  }
  return pairs;
}
