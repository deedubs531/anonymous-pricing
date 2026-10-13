// Sends one check to the shared totals.
import { API_URL } from './config';
import type { Observation } from './observation';

export interface SubmitResult {
  ok: boolean;
  message: string;
}

export async function submit(obs: Observation, apiUrl = API_URL, fetcher: typeof fetch = (u, i) => fetch(u, i)): Promise<SubmitResult> {
  if (!apiUrl) return { ok: false, message: 'Sharing isn\'t switched on yet' };
  try {
    // text/plain keeps this a "simple" request, so strict store pages don't need a CORS preflight.
    const r = await fetcher(`${apiUrl}/api/observations`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(obs) });
    if (r.ok) return { ok: true, message: 'Shared ✓ Thank you' };
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    return { ok: false, message: r.status === 429 ? 'Shared enough for this hour' : body.error ?? `Couldn't share (${r.status})` };
  } catch {
    return { ok: false, message: 'Couldn\'t reach the server' };
  }
}

/** A random ID for this browser, made once. Counts contributors without identifying anyone. */
export function installId(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined, key = 'whopaysmore.install'): string {
  try {
    const existing = storage?.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    storage?.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
