// What a shared price check looks like, checked the same way by the tools that send it and the
// server that stores it. Nothing here identifies a person: no account, name, address or IP.
import { compare } from '../checker/compare';

export type Source = 'extension' | 'userscript' | 'bookmarklet' | 'app-check';
export type Verdict = 'higher' | 'lower' | 'same' | 'unstable';
export const APP_IDS = ['uber', 'lyft', 'instacart', 'doordash', 'ubereats'] as const;
export type AppId = (typeof APP_IDS)[number];

/** A website check: your signed-in price vs the same page fetched signed out, twice. */
export interface WebObservation {
  kind: 'web';
  site: string;
  path: string;
  name?: string;
  currency?: string;
  mine: number;
  anon: number[];
  source: Exclude<Source, 'app-check'>;
  /** A random ID made once per browser, used only to count contributors and limit spam. */
  install: string;
}

/** An app check: your account vs a clean account (or signed out), from screenshots. */
export interface AppObservation {
  kind: 'app';
  app: AppId;
  option?: string;
  mine: number;
  baseline: number;
  baselineType: 'clean-account' | 'signed-out';
  gapSeconds: number;
  source: 'app-check';
  install: string;
}

export type Observation = WebObservation | AppObservation;

/** What the server stores for each check (plus time and a coarse region it adds itself). */
export interface StoredRow {
  ts: number;
  kind: 'web' | 'app';
  source: Source;
  install: string;
  site: string | null;
  path: string | null;
  name: string | null;
  app: string | null;
  option: string | null;
  currency: string | null;
  mine: number;
  baseline: number;
  baseline2: number | null;
  baseline_type: string;
  verdict: Verdict;
  pct: number;
  gap_seconds: number | null;
  country: string | null;
  region: string | null;
}

const isPrice = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 100_000;
const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : undefined;
};

/** Only the host and path of a page: query strings and fragments can hold personal data. */
export function cleanUrlParts(site: unknown, path: unknown): { site: string; path: string } | undefined {
  if (typeof site !== 'string' || typeof path !== 'string') return undefined;
  const host = site.toLowerCase().replace(/^www\./, '');
  if (!/^[a-z0-9.-]{3,100}$/.test(host) || !host.includes('.')) return undefined;
  const p = path.split(/[?#]/)[0].slice(0, 200);
  return p.startsWith('/') ? { site: host, path: p } : undefined;
}

/** Validates a submission. Returns the row to store, or an error message. */
export function toRow(body: unknown, now: number, where: { country?: string; region?: string } = {}): StoredRow | string {
  if (!body || typeof body !== 'object') return 'Expected a JSON object.';
  const b = body as Record<string, unknown>;
  const install = typeof b.install === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(b.install) ? b.install : undefined;
  if (!install) return 'Missing install ID.';
  const base = { ts: now, install, country: where.country ?? null, region: where.region ?? null };

  if (b.kind === 'web') {
    if (!['extension', 'userscript', 'bookmarklet'].includes(b.source as string)) return 'Unknown source.';
    const parts = cleanUrlParts(b.site, b.path);
    if (!parts) return 'Bad site or path.';
    if (!isPrice(b.mine)) return 'Bad price.';
    const anon = Array.isArray(b.anon) ? b.anon.filter(isPrice).slice(0, 2) : [];
    if (!anon.length) return 'Missing signed-out price.';
    if (b.mine / anon[0] > 5 || b.mine / anon[0] < 0.2) return 'Prices too far apart to be the same item.';
    const v = compare(b.mine, anon);
    const verdict: Verdict = v.kind === 'higher' || v.kind === 'lower' || v.kind === 'same' || v.kind === 'unstable' ? v.kind : 'same';
    const currency = typeof b.currency === 'string' && /^[A-Z]{3}$/.test(b.currency) ? b.currency : null;
    return {
      ...base,
      kind: 'web',
      source: b.source as Source,
      ...parts,
      name: text(b.name, 200) ?? null,
      app: null,
      option: null,
      currency,
      mine: b.mine,
      baseline: anon[0],
      baseline2: anon[1] ?? null,
      baseline_type: 'signed-out-same-device',
      verdict,
      pct: Math.round(((b.mine - anon[0]) / anon[0]) * 1000) / 10,
      gap_seconds: null,
    };
  }

  if (b.kind === 'app') {
    if (b.source !== 'app-check') return 'Unknown source.';
    if (!APP_IDS.includes(b.app as AppId)) return 'Unknown app.';
    if (!isPrice(b.mine) || !isPrice(b.baseline)) return 'Bad price.';
    if (b.mine / b.baseline > 5 || b.mine / b.baseline < 0.2) return 'Prices too far apart to be the same trip or cart.';
    if (b.baselineType !== 'clean-account' && b.baselineType !== 'signed-out') return 'Unknown comparison.';
    const gap = typeof b.gapSeconds === 'number' && b.gapSeconds >= 0 ? Math.round(b.gapSeconds) : undefined;
    if (gap === undefined || gap > 3600) return 'Checks must be within an hour of each other.';
    const v = compare(b.mine, [b.baseline]);
    return {
      ...base,
      kind: 'app',
      source: 'app-check',
      site: null,
      path: null,
      name: null,
      app: b.app as string,
      option: text(b.option, 60) ?? null,
      currency: 'USD',
      mine: b.mine,
      baseline: b.baseline,
      baseline2: null,
      baseline_type: b.baselineType,
      verdict: v.kind === 'higher' || v.kind === 'lower' ? v.kind : 'same',
      pct: Math.round(((b.mine - b.baseline) / b.baseline) * 1000) / 10,
      gap_seconds: gap,
    };
  }
  return 'Unknown kind.';
}
