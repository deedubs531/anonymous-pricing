import { money } from '../../checker/compare';
import { DASHBOARD_URL } from '../../shared/config';
import { getHistory, getSettings, setSettings, type HistoryEntry, type Settings } from './settings';

const app = document.getElementById('app')!;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
}

function toggle(label: string, hint: string, checked: boolean, onchange: (on: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox', checked });
  input.addEventListener('change', () => onchange(input.checked));
  return el('label', { className: 'toggle' }, input, el('span', {}, el('strong', {}, label), el('span', { className: 'muted' }, hint)));
}

function verdictText(h: HistoryEntry): HTMLElement {
  const m = (n?: number) => (n === undefined ? '' : money(n, h.currency));
  switch (h.verdict) {
    case 'higher':
      return el('span', { className: 'higher' }, `+${m((h.mine ?? 0) - (h.anon ?? 0))}`);
    case 'lower':
      return el('span', { className: 'lower' }, `−${m((h.anon ?? 0) - (h.mine ?? 0))}`);
    case 'same':
      return el('span', {}, 'Same');
    case 'unstable':
      return el('span', { className: 'unstable' }, 'Changing');
    default:
      return el('span', { className: 'muted' }, 'No check');
  }
}

async function render(): Promise<void> {
  const settings: Settings = await getSettings();
  const history = await getHistory();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = tab?.url?.startsWith('http') ? new URL(tab.url).hostname.replace(/^www\./, '') : undefined;
  const paused = host ? settings.paused.includes(host) : false;

  app.replaceChildren(
    toggle('Check product pages automatically', 'Compares your price with a signed-out visitor\'s on the same connection.', settings.autoCheck, (on) => setSettings({ autoCheck: on })),
    toggle('Share checks anonymously', 'Adds each check to the public totals. Never your name, account, address or browsing.', settings.share, (on) => setSettings({ share: on, chosen: true })),
    host
      ? toggle(`Pause on ${host}`, 'Stay quiet on this site.', paused, async (on) => {
          await setSettings({ paused: on ? [...settings.paused, host] : settings.paused.filter((p) => p !== host) });
        })
      : '',
    el('h2', { className: 'recent' }, 'Recent checks'),
    history.length
      ? el(
          'ul',
          { className: 'history' },
          ...history.slice(0, 8).map((h) =>
            el(
              'li',
              {},
              el('span', {}, el('a', { href: h.url, target: '_blank' }, h.name ?? h.site), el('br'), el('span', { className: 'muted' }, `${h.site} · ${new Date(h.ts).toLocaleDateString()}${h.shared ? ' · shared' : ''}`)),
              verdictText(h),
            ),
          ),
        )
      : el('p', { className: 'muted' }, 'Open a product page on a store\'s website and the check runs on its own.'),
    el('p', {}, el('a', { href: DASHBOARD_URL, target: '_blank' }, 'See what everyone has found →')),
  );
}

void render();
