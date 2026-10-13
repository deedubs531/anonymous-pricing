// The result card shown on the store's page. Lives in a shadow root so the store's styles can't touch it.
import { fetchAnonymous, type AnonResult } from './check';
import { compare, describe, money, type Verdict } from './compare';
import { extractPrice, parsePrice, type PriceInfo } from './extract';
import type { WebObservation } from '../shared/observation';

/** A finished check of the current page. */
export interface PageCheck {
  verdict: Verdict;
  mine?: PriceInfo;
  anon: AnonResult;
}

/** What a tool shares: the check without who sent it (the sender adds its install ID and source). */
export type ObservationDraft = Omit<WebObservation, 'install' | 'source'>;

/** Sends a check to the shared totals; resolves to a short message for the button. */
export type Sharer = (draft: ObservationDraft) => Promise<string>;

import { SITE_URL } from '../shared/config';
export { SITE_URL };
const HOST_ID = 'who-pays-more-price-check';

const CSS = `
:host { all: initial; }
.card { position: fixed; z-index: 2147483647; left: 12px; right: 12px; bottom: 12px; max-width: 420px; margin: 0 auto;
  background: #fff; color: #1d1f22; border: 1px solid #dddad2; border-radius: 14px; padding: 14px 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,.18); font: 15px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { .card { background: #1f2226; color: #eceae5; border-color: #33373d; } .muted { color: #8d939b !important; } }
.brand { font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #b4361f; margin: 0 0 4px; }
h2 { font-size: 18px; margin: 0 0 6px; line-height: 1.25; }
.bad h2 { color: #b4361f; } .good h2 { color: #2f6b3a; }
p { margin: 0 0 8px; }
.muted { color: #767c84; font-size: 13px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
button, input { font: inherit; border-radius: 8px; min-height: 40px; }
button { border: 1px solid #dddad2; background: transparent; color: inherit; padding: 0 12px; cursor: pointer; }
button.primary { background: #b4361f; border-color: #b4361f; color: #fff; }
input { border: 1px solid #dddad2; padding: 0 10px; width: 8em; background: transparent; color: inherit; }
a { color: #b4361f; }
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function mount(): ShadowRoot {
  document.getElementById(HOST_ID)?.remove();
  const host = el('div', { id: HOST_ID });
  document.documentElement.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.append(el('style', { textContent: CSS }));
  return root;
}

function card(root: ShadowRoot, tone: string, ...children: (Node | string)[]): void {
  root.querySelector('.card')?.remove();
  root.append(el('div', { className: `card ${tone}` }, el('p', { className: 'brand' }, 'Who Pays More · Price check'), ...children));
}

function close(): void {
  document.getElementById(HOST_ID)?.remove();
}

function summary(v: Verdict, currency: string | undefined, name: string | undefined): string {
  const when = new Date().toLocaleString();
  const what = name ? `${name} on ${location.hostname}` : location.hostname;
  const m = (n: number) => money(n, currency);
  switch (v.kind) {
    case 'higher':
    case 'lower':
    case 'same':
      return `Price check, ${what}, ${when}: I saw ${m(v.mine)}; a signed-out visitor on the same connection saw ${m(v.anon)}. ${location.href}`;
    case 'unstable':
      return `Price check, ${what}, ${when}: I saw ${m(v.mine)}; two signed-out checks saw ${v.anonPrices.map(m).join(' and ')}. ${location.href}`;
    default:
      return `Price check, ${what}, ${when}: no comparison possible. ${location.href}`;
  }
}

/** The shareable form of a check, if it produced a comparison. */
export function toDraft(check: PageCheck, url: Location | URL = location): ObservationDraft | undefined {
  const v = check.verdict;
  if (v.kind !== 'higher' && v.kind !== 'lower' && v.kind !== 'same' && v.kind !== 'unstable') return undefined;
  return {
    kind: 'web',
    site: url.hostname,
    path: url.pathname,
    name: check.mine?.name ?? check.anon.info?.name,
    currency: check.mine?.currency ?? check.anon.info?.currency,
    mine: v.mine,
    anon: check.anon.prices,
  };
}

function showResult(root: ShadowRoot, v: Verdict, mine: PriceInfo | undefined, anon: AnonResult, share?: Sharer): void {
  const currency = mine?.currency ?? anon.info?.currency;
  const name = mine?.name ?? anon.info?.name;
  const text = describe(v, currency);

  if (v.kind === 'no-mine') {
    const input = el('input', { inputMode: 'decimal', placeholder: 'e.g. 24.99', ariaLabel: 'Price you see' });
    const submit = () => {
      const typed = parsePrice(input.value);
      if (typed !== undefined) showResult(root, compare(typed, anon.prices), { price: typed, currency, name, via: 'meta' }, anon, share);
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
    card(root, 'neutral', el('h2', {}, text.title), el('p', {}, text.body), el('div', { className: 'row' }, input, el('button', { className: 'primary', onclick: submit }, 'Compare'), el('button', { onclick: close }, 'Close')));
    input.focus();
    return;
  }

  const draft = share && toDraft({ verdict: v, mine, anon });
  const shareButton = draft ? el('button', { className: 'primary' }, 'Share anonymously') : '';
  if (shareButton && draft && share) {
    shareButton.onclick = async () => {
      shareButton.disabled = true;
      shareButton.textContent = 'Sharing…';
      shareButton.textContent = await share(draft);
    };
  }
  const copy = el('button', {}, 'Copy result');
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(summary(v, currency, name));
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Copy failed';
    }
  };
  card(
    root,
    text.tone,
    el('h2', {}, text.title),
    el('p', {}, text.body),
    name ? el('p', { className: 'muted' }, name) : '',
    el('p', { className: 'muted' }, 'Compares your signed-in view with a signed-out one from the same device and connection. It can\'t see differences by device, location or in apps. ', el('a', { href: `${SITE_URL}#price-check`, target: '_blank', rel: 'noopener' }, 'What this means')),
    el('div', { className: 'row' }, shareButton, copy, el('button', { onclick: () => void runPriceCheck(share) }, 'Check again'), el('button', { onclick: close }, 'Close')),
  );
}

/** Checks the current page without showing anything. */
export async function checkPage(): Promise<PageCheck> {
  const mine = extractPrice(document);
  const anon = await fetchAnonymous(location.href);
  let verdict = compare(mine?.price, anon.prices, anon.failure);
  const a = anon.info?.currency;
  if (mine?.currency && a && mine.currency !== a && verdict.kind !== 'no-anon') {
    verdict = { kind: 'no-anon', mine: mine.price, reason: `Signed out, the store showed a different currency (${a} instead of ${mine.currency}), so the prices can't be compared.` };
  }
  return { verdict, mine, anon };
}

/** Shows a finished check in the card. */
export function showCheck(check: PageCheck, share?: Sharer): void {
  showResult(mount(), check.verdict, check.mine, check.anon, share);
}

/** Runs the full check on the current page and shows the result. */
export async function runPriceCheck(share?: Sharer): Promise<Verdict> {
  const root = mount();
  card(root, 'neutral', el('h2', {}, 'Checking…'), el('p', { className: 'muted' }, 'Loading this page again as a signed-out visitor.'));
  const check = await checkPage();
  showResult(root, check.verdict, check.mine, check.anon, share);
  return check.verdict;
}
