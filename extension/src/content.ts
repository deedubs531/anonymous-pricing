// Runs on every page. On product pages it checks the price (automatically, or when the button is
// tapped) and shows a small badge; the full result card opens from the badge.
import type { Verdict } from '../../checker/compare';
import { money } from '../../checker/compare';
import { extractPrice } from '../../checker/extract';
import { checkPage, runPriceCheck, showCheck, toDraft, type PageCheck, type Sharer } from '../../checker/ui';
import { getSettings, type Message } from './settings';

const BADGE_ID = 'who-pays-more-badge';

const send = (msg: Message) => chrome.runtime.sendMessage(msg) as Promise<string | undefined>;
const share: Sharer = async (draft) => (await send({ type: 'share', url: location.href, draft })) ?? 'Couldn\'t share';

function badge(text: string, color: string, onclick: () => void): HTMLButtonElement {
  document.getElementById(BADGE_ID)?.remove();
  const b = document.createElement('button');
  b.id = BADGE_ID;
  b.type = 'button';
  b.textContent = text;
  b.setAttribute(
    'style',
    `all:initial;position:fixed;z-index:2147483646;left:12px;bottom:12px;padding:8px 14px;border-radius:999px;background:${color};color:#fff;` +
      'font:600 14px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;',
  );
  b.addEventListener('click', () => {
    b.remove();
    onclick();
  });
  document.documentElement.append(b);
  return b;
}

function badgeFor(check: PageCheck): void {
  const v: Verdict = check.verdict;
  const currency = check.mine?.currency ?? check.anon.info?.currency;
  const open = () => showCheck(check, share);
  if (v.kind === 'higher') badge(`⚠ You see ${money(v.diff, currency)} more`, '#b4361f', open);
  else if (v.kind === 'lower') badge(`You see ${money(-v.diff, currency)} less`, '#2f6b3a', open);
  else if (v.kind === 'unstable') badge('Price keeps changing', '#8a5a00', open);
  else if (v.kind === 'same') {
    const b = badge('✓ Same price signed out', '#4a4f56', open);
    setTimeout(() => b.remove(), 6000);
  }
}

let lastUrl = '';

async function update(): Promise<void> {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  document.getElementById(BADGE_ID)?.remove();
  if (!extractPrice(document)) return;
  const settings = await getSettings();
  if (settings.paused.includes(location.hostname.replace(/^www\./, ''))) return;
  if (!settings.autoCheck) {
    badge('Price check', '#b4361f', () => void runPriceCheck(share));
    return;
  }
  const url = location.href;
  const check = await checkPage();
  if (url !== location.href) return; // the page changed while checking
  badgeFor(check);
  await send({ type: 'checked', url, verdict: check.verdict.kind, draft: toDraft(check) });
}

void update();
setInterval(() => void update(), 2000);
