import { compare, money } from '../../checker/compare';
import { h } from '../dom';
import '../styles.css';
import './appcheck.css';
import { APPS, appById, type AppInfo } from './apps';
import { gapSeconds, pattern, patternSentence, percentOver, reportText } from './log';
import { readText } from './ocr';
import { findPrices, matchLabel, pairByLabel, pickDefault, type PriceCandidate } from './prices';
import { allChecks, deleteCheck, saveCheck, type StoredCheck } from './store';

interface Side {
  price?: number;
  at?: number;
  candidates: PriceCandidate[];
  picked?: number;
  image?: Blob;
  status?: string;
}

const LAST_APP_KEY = 'whopaysmore.app';
const emptySide = (): Side => ({ candidates: [] });

function savedApp(): AppInfo {
  try {
    return appById(localStorage.getItem(LAST_APP_KEY) ?? '') ?? APPS[0];
  } catch {
    return APPS[0];
  }
}

const state = { app: savedApp(), label: '', mine: emptySide(), clean: emptySide() };
let checks: StoredCheck[] = [];

const checkCard = h('div', { class: 'setup check-card' });
const logSection = h('section', { id: 'my-checks', 'aria-labelledby': 'my-checks-h' });

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
const strong = (t: string) => h('strong', {}, t);

/** When a screenshot was taken, if the file says so and it's recent; otherwise now. */
function screenshotTime(file: File): number {
  const now = Date.now();
  return file.lastModified && file.lastModified <= now && now - file.lastModified < 30 * 60_000 ? file.lastModified : now;
}

async function addScreenshot(side: Side, file: File, other: Side): Promise<void> {
  Object.assign(side, { image: file, at: screenshotTime(file), candidates: [], picked: undefined, price: undefined, status: 'Reading screenshot…' });
  render();
  try {
    const text = await readText(file, (p) => {
      side.status = `Reading screenshot… ${Math.round(p * 100)}%`;
      render();
    });
    side.candidates = findPrices(text);
    side.status = side.candidates.length ? undefined : 'Couldn\'t find a price in that screenshot. Type it below.';
    if (side.candidates.length) {
      // Pick the same option as the other screenshot (e.g. UberX), else the most likely one.
      const otherLabel = other.picked !== undefined ? other.candidates[other.picked]?.label : undefined;
      const same = otherLabel ? matchLabel(side.candidates, otherLabel) : undefined;
      const i = same ?? pickDefault(side.candidates, state.app.keywords);
      side.picked = i;
      side.price = side.candidates[i].amount;
    }
  } catch {
    side.status = 'Couldn\'t read the screenshot on this device. Type the price below.';
  }
  render();
}

function sidePanel(title: string, hint: string, side: Side, other: Side): HTMLElement {
  const file = h('input', {
    type: 'file',
    accept: 'image/*',
    class: 'visually-hidden',
    onchange: (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) void addScreenshot(side, f, other);
    },
  });
  const typed = h('input', {
    type: 'text',
    inputmode: 'decimal',
    placeholder: 'or type it, e.g. 24.80',
    'aria-label': `${title} price`,
    value: side.price !== undefined && side.picked === undefined ? side.price.toFixed(2) : '',
    onchange: (e: Event) => {
      const n = Number.parseFloat((e.target as HTMLInputElement).value.replace(/[^\d.]/g, ''));
      if (n > 0) Object.assign(side, { price: n, at: Date.now(), picked: undefined });
      render();
    },
  });
  return h(
    'div',
    { class: 'side' },
    h('h3', {}, title),
    h('p', { class: 'muted small' }, hint),
    h('div', { class: 'row' }, h('label', { class: 'button' }, file, side.image ? 'Change screenshot' : 'Add screenshot'), typed),
    side.status && h('p', { class: 'muted small' }, side.status),
    side.candidates.length > 1 && h('p', { class: 'small' }, 'Tap the price to compare:'),
    side.candidates.length > 0 &&
      h(
        'div',
        { class: 'chips' },
        side.candidates.map((c, i) =>
          h(
            'button',
            {
              type: 'button',
              class: 'chip',
              'aria-pressed': String(i === side.picked),
              onclick: () => {
                side.picked = i;
                side.price = c.amount;
                render();
              },
            },
            `${c.label ? `${c.label} · ` : ''}${money(c.amount)}`,
          ),
        ),
      ),
    side.price !== undefined && side.at !== undefined && h('p', { class: 'done' }, `✓ ${money(side.price)} at ${time(side.at)}`),
  );
}

function resultPanel(): HTMLElement | null {
  const { mine, clean, app } = state;
  if (mine.price === undefined || clean.price === undefined || mine.at === undefined || clean.at === undefined) return null;
  const v = compare(mine.price, [clean.price]);
  const pct = percentOver({ mine: mine.price, clean: clean.price });
  const gap = gapSeconds({ mineAt: mine.at, cleanAt: clean.at });
  const title =
    v.kind === 'higher'
      ? `Your account is quoted ${money(mine.price - clean.price)} more (${pct}%)`
      : v.kind === 'lower'
        ? `Your account is quoted ${money(clean.price - mine.price)} less (${-pct}%)`
        : 'Same price on both accounts';
  const pairs = mine.candidates.length && clean.candidates.length ? pairByLabel(mine.candidates, clean.candidates) : [];
  return h(
    'div',
    { class: `result ${v.kind === 'higher' ? 'bad' : v.kind === 'lower' ? 'good' : ''}` },
    h('h3', {}, title),
    h('p', {}, `Your account ${money(mine.price)}, clean account ${money(clean.price)}, ${gap} seconds apart.`),
    gap > app.maxGapSeconds &&
      h('p', { class: 'caveat' }, `These were ${Math.round(gap / 60)} minutes apart. ${app.kind === 'ride' ? 'Ride prices change quickly' : 'Prices can change'}, so for a fair comparison redo both within ${app.maxGapSeconds / 60} minutes.`),
    v.kind === 'higher' && h('p', { class: 'muted small' }, 'Make sure the clean account\'s price isn\'t a new-customer discount before counting this.'),
    pairs.length > 1 &&
      h(
        'table',
        { class: 'pairs' },
        h('tr', {}, h('th', {}, 'Option'), h('th', {}, 'Yours'), h('th', {}, 'Clean'), h('th', {}, 'Diff')),
        pairs.map((p) => h('tr', {}, h('td', {}, p.label), h('td', {}, money(p.mine)), h('td', {}, money(p.clean)), h('td', {}, `${percentOver(p) > 0 ? '+' : ''}${percentOver(p)}%`))),
      ),
    h('label', { class: 'small' }, 'What you priced (optional)', h('input', { type: 'text', class: 'wide', placeholder: app.kind === 'ride' ? 'e.g. Home → Airport' : 'e.g. Weekly groceries, Safeway', value: state.label, oninput: (e: Event) => (state.label = (e.target as HTMLInputElement).value) })),
    h(
      'div',
      { class: 'row' },
      h(
        'button',
        {
          type: 'button',
          class: 'button',
          onclick: async () => {
            const c: StoredCheck = {
              id: crypto.randomUUID(),
              app: app.id,
              label: state.label.trim(),
              mine: mine.price!,
              clean: clean.price!,
              mineAt: mine.at!,
              cleanAt: clean.at!,
              mineImage: mine.image,
              cleanImage: clean.image,
            };
            try {
              await saveCheck(c);
            } catch {
              // Storage blocked (private mode): keep it for this visit at least.
            }
            checks.push(c);
            Object.assign(state, { label: '', mine: emptySide(), clean: emptySide() });
            render();
            renderLog();
            document.getElementById('my-checks')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        'Save to my checks',
      ),
      h('button', { type: 'button', class: 'chip', onclick: () => (Object.assign(state, { label: '', mine: emptySide(), clean: emptySide() }), render()) }, 'Start over'),
    ),
  );
}

function render(): void {
  const { app } = state;
  checkCard.replaceChildren(
    h('h3', {}, 'Which app?'),
    h(
      'div',
      { class: 'chips' },
      APPS.map((a) =>
        h(
          'button',
          {
            type: 'button',
            class: 'chip',
            'aria-pressed': String(a.id === app.id),
            onclick: () => {
              state.app = a;
              try {
                localStorage.setItem(LAST_APP_KEY, a.id);
              } catch {
                // Not remembered; fine.
              }
              render();
            },
          },
          a.name,
        ),
      ),
    ),
    h(
      'p',
      { class: 'small' },
      strong('Price the same thing on both accounts: '),
      app.compare,
      ` Do both within ${app.maxGapSeconds / 60} minutes. `,
      h('a', { class: 'link', href: app.web, target: '_blank', rel: 'noopener' }, `Open ${app.name}`),
    ),
    h(
      'div',
      { class: 'sides' },
      sidePanel('1. Your account', 'Normal tab or the app. Screenshot the price.', state.mine, state.clean),
      sidePanel('2. Clean account', 'Private tab, signed in to the clean account. Screenshot the price.', state.clean, state.mine),
    ),
    resultPanel() ?? '',
  );
}

async function share(app: AppInfo, list: StoredCheck[], button: HTMLButtonElement): Promise<void> {
  const text = reportText(app, list);
  const files = list.flatMap((c, i) =>
    [
      [c.mineImage, `check-${i + 1}-my-account.png`],
      [c.cleanImage, `check-${i + 1}-clean-account.png`],
    ]
      .filter((x): x is [Blob, string] => x[0] instanceof Blob)
      .map(([b, name]) => new File([b], name, { type: b.type || 'image/png' })),
  );
  try {
    if (files.length && navigator.canShare?.({ files, text })) return await navigator.share({ files, text, title: `${app.name} price checks` });
    if (navigator.share) return await navigator.share({ text, title: `${app.name} price checks` });
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied report';
  } catch {
    // Share sheet dismissed; nothing to do.
  }
}

function renderLog(): void {
  const groups = APPS.map((app) => ({ app, list: checks.filter((c) => c.app === app.id).sort((a, b) => b.mineAt - a.mineAt) })).filter((g) => g.list.length);
  logSection.replaceChildren(
    h('h2', { id: 'my-checks-h' }, 'My checks'),
    groups.length
      ? h('p', { class: 'muted' }, 'Saved on this phone only. One check isn\'t proof; the same result five or more times is a pattern.')
      : h('p', { class: 'muted' }, 'Checks you save appear here, with the pattern across them and a report you can send.'),
    ...groups.map(({ app, list }) => {
      const shareButton = h('button', { type: 'button', class: 'button' }, 'Share report') as HTMLButtonElement;
      shareButton.addEventListener('click', () => void share(app, list, shareButton));
      const p = pattern(list);
      return h(
        'article',
        { class: 'company' },
        h('header', {}, h('h3', {}, app.name), h('span', { class: 'sector' }, `${list.length} check${list.length === 1 ? '' : 's'}`)),
        h('p', { class: p.higher > p.count / 2 ? 'status bad-text' : 'status' }, patternSentence(p)),
        h(
          'ul',
          { class: 'check-list' },
          list.map((c) =>
            h(
              'li',
              {},
              h('span', {}, new Date(c.mineAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }), c.label && ` · ${c.label}`),
              h('span', {}, `${money(c.mine)} vs ${money(c.clean)} `, h('strong', {}, `${percentOver(c) > 0 ? '+' : ''}${percentOver(c)}%`)),
              h(
                'button',
                {
                  type: 'button',
                  class: 'plain',
                  'aria-label': 'Delete this check',
                  onclick: async () => {
                    if (!confirm('Delete this check?')) return;
                    await deleteCheck(c.id).catch(() => undefined);
                    checks = checks.filter((x) => x.id !== c.id);
                    renderLog();
                  },
                },
                '✕',
              ),
            ),
          ),
        ),
        h('div', { class: 'row' }, shareButton),
      );
    }),
  );
}

function page(): HTMLElement {
  return h(
    'div',
    {},
    h(
      'header',
      { class: 'masthead' },
      h('p', {}, h('a', { class: 'link', href: '../' }, '← Who Pays More')),
      h('h1', {}, 'Two-account check'),
      h(
        'p',
        { class: 'lede' },
        'See whether Uber, Lyft, Instacart or DoorDash quotes your account more than a brand-new one. You price the same thing on both at the same time, add the screenshots, and it does the rest.',
      ),
    ),
    h(
      'details',
      { class: 'install', open: checks.length === 0 },
      h('summary', {}, 'First time: set up a clean account'),
      h(
        'ol',
        { class: 'steps' },
        h('li', {}, 'Make a second account on the app\'s website with a different email and phone number (a free Google Voice number works). Don\'t order anything with it.'),
        h('li', {}, 'Open a ', strong('private tab'), ' (Safari or Brave: tap the tabs button, then Private), go to the company\'s website and sign in to the clean account.'),
        h('li', {}, 'In a normal tab or the app, stay signed in to your own account. Keep both open.'),
      ),
      h('p', { class: 'muted small' }, 'Only use the clean account to look: companies can suspend duplicate accounts. New accounts often get a first-order discount, so compare prices before any discount.'),
    ),
    h('section', { 'aria-labelledby': 'check-h' }, h('h2', { id: 'check-h' }, 'New check'), checkCard),
    logSection,
    h('footer', {}, h('p', {}, 'Private: screenshots are read on this phone and saved only here. Nothing is uploaded.')),
  );
}

async function start(): Promise<void> {
  try {
    checks = await allChecks();
  } catch {
    checks = [];
  }
  document.querySelector('#app')!.replaceChildren(page());
  render();
  renderLog();
}

void start();
