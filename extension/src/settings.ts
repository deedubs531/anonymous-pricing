// Extension settings and history, kept in the browser's extension storage.
import type { Verdict } from '../../checker/compare';
import type { ObservationDraft } from '../../checker/ui';

export interface HistoryEntry {
  ts: number;
  site: string;
  name?: string;
  url: string;
  verdict: Verdict['kind'];
  mine?: number;
  anon?: number;
  currency?: string;
  shared: boolean;
}

export interface Settings {
  /** Check product pages as soon as they open. */
  autoCheck: boolean;
  /** Add every check to the shared totals. */
  share: boolean;
  /** The person has seen the welcome page and made a choice about sharing. */
  chosen: boolean;
  /** Sites where the extension stays quiet. */
  paused: string[];
}

export const DEFAULTS: Settings = { autoCheck: true, share: false, chosen: false, paused: [] };

export async function getSettings(): Promise<Settings> {
  const s = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...s } as Settings;
}

export const setSettings = (patch: Partial<Settings>) => chrome.storage.local.set(patch);

export async function getHistory(): Promise<HistoryEntry[]> {
  const { history } = await chrome.storage.local.get('history');
  return (history as HistoryEntry[] | undefined) ?? [];
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const list = await getHistory();
  await chrome.storage.local.set({ history: [entry, ...list].slice(0, 50) });
}

export async function installId(): Promise<string> {
  const { install } = await chrome.storage.local.get('install');
  if (typeof install === 'string') return install;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ install: id });
  return id;
}

/** Messages from the page script to the background. */
export type Message =
  | { type: 'checked'; url: string; verdict: Verdict['kind']; draft?: ObservationDraft }
  | { type: 'share'; url: string; draft: ObservationDraft };

export function entryFor(url: string, verdict: Verdict['kind'], draft: ObservationDraft | undefined, shared: boolean): HistoryEntry {
  return {
    ts: Date.now(),
    site: new URL(url).hostname.replace(/^www\./, ''),
    url: url.split(/[?#]/)[0],
    name: draft?.name,
    verdict,
    mine: draft?.mine,
    anon: draft?.anon[0],
    currency: draft?.currency,
    shared,
  };
}
