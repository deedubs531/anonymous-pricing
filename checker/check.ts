// Fetches the current page again as a signed-out visitor: same address, same network, no cookies.
import { extractPrice, type PriceInfo } from './extract';

export interface AnonResult {
  prices: number[];
  info?: PriceInfo;
  failure?: string;
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

async function fetchOnce(url: string, fetcher: Fetcher): Promise<{ info?: PriceInfo; failure?: string }> {
  let response: Response;
  try {
    // credentials: 'omit' sends no cookies, so the store can't tell who you are from your login.
    response = await fetcher(url, { credentials: 'omit', cache: 'no-store', redirect: 'follow' });
  } catch {
    return { failure: 'The store refused the signed-out request.' };
  }
  if (response.status === 403 || response.status === 429 || response.status === 503) {
    return { failure: `The store blocked the signed-out request (error ${response.status}). Some stores block automated checks.` };
  }
  if (!response.ok) return { failure: `The store answered with error ${response.status}.` };
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  const info = extractPrice(doc);
  return info ? { info } : { failure: 'Signed out, the page doesn\'t include a price. The store may require signing in, or load prices later with scripts.' };
}

/** Two signed-out checks, one after the other, to catch prices that change on their own. */
export async function fetchAnonymous(url: string, fetcher: Fetcher = (u, i) => fetch(u, i)): Promise<AnonResult> {
  const prices: number[] = [];
  let info: PriceInfo | undefined;
  for (let i = 0; i < 2; i++) {
    const r = await fetchOnce(url, fetcher);
    if (!r.info) return { prices, info, failure: r.failure };
    info ??= r.info;
    prices.push(r.info.price);
  }
  return { prices, info };
}
