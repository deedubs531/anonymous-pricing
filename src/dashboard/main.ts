import { API_URL, SITE_URL } from '../../shared/config';
import type { Group, Stats } from '../../worker/src/stats';
import { APPS } from '../appcheck/apps';
import { h } from '../dom';
import { formatDate } from '../logic';
import '../styles.css';
import './dashboard.css';
import { chartRows, compact, decisive, niceScale, shares, signed, weekLabels } from './view';

const app = document.querySelector<HTMLElement>('#app')!;
const appName = (id: string) => APPS.find((a) => a.id === id)?.name ?? id;

// ---- Tooltip: one shared element, shown on hover and keyboard focus ----

const tooltip = h('div', { class: 'viz-tooltip', role: 'status', hidden: true });
document.body.append(tooltip);

function tip(target: HTMLElement, value: string, label: string): void {
  const show = (x: number, y: number) => {
    tooltip.replaceChildren(h('strong', {}, value), h('br'), label);
    tooltip.hidden = false;
    const w = tooltip.offsetWidth;
    tooltip.style.left = `${Math.max(8, Math.min(x - w / 2, innerWidth - w - 8))}px`;
    tooltip.style.top = `${Math.max(8, y - tooltip.offsetHeight - 12)}px`;
  };
  const hide = () => (tooltip.hidden = true);
  target.tabIndex = 0;
  target.setAttribute('aria-label', `${label}: ${value}`);
  target.addEventListener('pointermove', (e) => show(e.clientX, e.clientY));
  target.addEventListener('pointerleave', hide);
  target.addEventListener('focus', () => {
    const r = target.getBoundingClientRect();
    show(r.left + r.width / 2, r.top);
  });
  target.addEventListener('blur', hide);
}

// ---- Pieces ----

function legend(items: [string, string][]): HTMLElement {
  return h('ul', { class: 'legend' }, items.map(([label, color]) => h('li', { style: `--swatch: var(${color})` }, label)));
}

function tableView(head: string[], rows: (string | number)[][], numeric: number[] = []): HTMLElement {
  return h(
    'details',
    { class: 'table-view' },
    h('summary', { class: 'link' }, 'Show as a table'),
    h(
      'div',
      { class: 'table-scroll' },
      h(
        'table',
        { class: 'data' },
        h('thead', {}, h('tr', {}, head.map((c, i) => h('th', { class: numeric.includes(i) ? 'num' : null }, c)))),
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => h('td', { class: numeric.includes(i) ? 'num' : null }, String(c)))))),
      ),
    ),
  );
}

/** One 100% bar per site or app: lower | same | higher for the person's own price. */
function outcomeChart(title: string, caption: string, groups: Group[], nameOf: (key: string) => string, who: string): HTMLElement {
  const { shown, hidden } = chartRows(groups);
  const rows = shown.map((g) => {
    const s = shares(g);
    const n = decisive(g);
    const track = h('div', { class: 'track' });
    for (const [kind, label, color] of [
      ['lower', `Lower for the ${who}`, '--viz-lower'],
      ['same', 'Same price', '--viz-same'],
      ['higher', `Higher for the ${who}`, '--viz-higher'],
    ] as const) {
      if (!g[kind]) continue;
      const seg = h('span', { class: 'seg', style: `flex: ${g[kind]} 1 0; background: var(${color})` });
      tip(seg, `${g[kind]} of ${n} checks (${s[kind]}%)`, `${nameOf(g.key)} · ${label}`);
      track.append(seg);
    }
    return [
      h('div', { class: 'name' }, nameOf(g.key), h('small', {}, `${n} check${n === 1 ? '' : 's'}${g.higher ? ` · higher by ${signed(g.higherBy)}` : ''}`)),
      track,
      h('div', { class: 'value', title: `Higher for the ${who}` }, `${s.higher}%`),
    ];
  });
  return h(
    'figure',
    { class: 'chart viz-root' },
    h('h3', {}, title),
    h('figcaption', {}, caption),
    legend([
      [`Higher for the ${who}`, '--viz-higher'],
      ['Same', '--viz-same'],
      [`Lower for the ${who}`, '--viz-lower'],
    ]),
    shown.length
      ? h('div', { class: 'bars' }, h('span', { class: 'muted small' }), h('span'), h('span', { class: 'muted small value' }, 'Higher'), ...rows.flat())
      : h('p', { class: 'muted' }, 'Not enough checks yet to chart. Each needs at least three.'),
    hidden > 0 && h('p', { class: 'muted small' }, `${hidden} more with fewer than three checks are in the table.`),
    tableView(
      ['Name', 'Checks', 'Higher', 'Same', 'Lower', 'Changing', 'Higher by (median)', 'People'],
      groups.map((g) => [nameOf(g.key), g.checks, g.higher, g.same, g.lower, g.unstable, g.higher ? signed(g.higherBy) : '–', g.contributors]),
      [1, 2, 3, 4, 5, 6, 7],
    ),
  );
}

function weeklyChart(weekly: Stats['weekly']): HTMLElement {
  const { top, steps } = niceScale(Math.max(...weekly.map((w) => w.checks)));
  const labels = weekLabels(weekly);
  const plot = h('div', { class: 'plot' });
  for (const v of steps.slice(1)) plot.append(h('i', { class: 'gridline', style: `bottom: ${(v / top) * 100}%` }));
  weekly.forEach((w) => {
    const col = h(
      'div',
      { class: 'col' },
      w.higher > 0 && h('i', { style: `height: calc(${(w.higher / top) * 100}% - 1px); background: var(--viz-higher)` }),
      w.checks - w.higher > 0 && h('i', { style: `height: calc(${((w.checks - w.higher) / top) * 100}% - 1px); background: var(--viz-other)` }),
    );
    tip(col, `${w.checks} checks · ${w.higher} higher`, `Week of ${formatDate(w.week)}`);
    plot.append(col);
  });
  return h(
    'figure',
    { class: 'chart viz-root' },
    h('h3', {}, 'Checks shared each week'),
    h('figcaption', {}, 'Red: the signed-in or own-account price was higher.'),
    legend([
      ['Higher', '--viz-higher'],
      ['Same, lower or changing', '--viz-other'],
    ]),
    h(
      'div',
      { class: 'columns' },
      h('div', { class: 'y-axis' }, steps.map((v) => h('span', { style: `bottom: ${(v / top) * 100}%` }, compact(v)))),
      plot,
      h('div', { class: 'x-axis' }, labels.map((l) => h('span', {}, l))),
    ),
    tableView(['Week of', 'Checks', 'Higher'], weekly.filter((w) => w.checks).map((w) => [formatDate(w.week), w.checks, w.higher]), [1, 2]),
  );
}

function tile(label: string, value: string): HTMLElement {
  return h('div', { class: 'tile' }, h('span', {}, label), h('strong', {}, value));
}

function header(): HTMLElement {
  return h(
    'header',
    { class: 'masthead' },
    h('p', {}, h('a', { class: 'link', href: '../' }, '← Who Pays More')),
    h('h1', {}, 'What people are finding'),
    h(
      'p',
      { class: 'lede' },
      'Price checks shared anonymously by people using the Who Pays More extension and app check. Each compares a person\'s own price with what a signed-out visitor, or a brand-new account, was shown at the same moment.',
    ),
  );
}

function emptyState(title: string, body: string): HTMLElement {
  return h(
    'section',
    { class: 'empty-state' },
    h('h2', {}, title),
    h('p', {}, body),
    h('p', {}, h('a', { class: 'link', href: `${SITE_URL}#price-check` }, 'Get the extension'), ' · ', h('a', { class: 'link', href: `${SITE_URL}app-check/` }, 'Check an app')),
  );
}

function render(stats: Stats): void {
  const t = stats.totals;
  app.replaceChildren(
    header(),
    h(
      'section',
      { class: 'hero', 'aria-label': 'Headline' },
      h('div', { class: 'hero-value' }, `${t.higherShare}%`),
      h('p', { class: 'hero-label' }, `of checks found a higher price for the signed-in shopper or their own account${t.higherBy ? `, typically by ${signed(t.higherBy)}` : ''}.`),
    ),
    h('div', { class: 'tiles' }, tile('Checks shared', compact(t.checks)), tile('People contributing', compact(t.contributors)), tile('Websites', compact(t.sites)), tile('Apps', compact(t.apps))),
    h(
      'section',
      { 'aria-labelledby': 'sites-h' },
      h('h2', { id: 'sites-h' }, 'Websites'),
      outcomeChart('Signed in vs signed out, by website', 'Your price compared with a signed-out visitor on the same device and connection. Websites with the largest share of higher prices first.', stats.sites, (k) => k, 'signed-in shopper'),
    ),
    h(
      'section',
      { 'aria-labelledby': 'apps-h' },
      h('h2', { id: 'apps-h' }, 'Apps'),
      outcomeChart('Own account vs brand-new account, by app', 'From the two-account check: the same ride or cart priced on both accounts within minutes.', stats.apps, appName, 'own account'),
    ),
    h('section', { 'aria-labelledby': 'trend-h' }, h('h2', { id: 'trend-h' }, 'Over time'), weeklyChart(stats.weekly)),
    h(
      'section',
      { 'aria-labelledby': 'gaps-h' },
      h('h2', { id: 'gaps-h' }, 'Biggest gaps this month'),
      stats.notable.length
        ? h(
            'div',
            { class: 'table-scroll' },
            h(
              'table',
              { class: 'data' },
              h('thead', {}, h('tr', {}, h('th', {}, 'Where'), h('th', {}, 'What'), h('th', { class: 'num' }, 'Higher by'), h('th', {}, 'When'))),
              h(
                'tbody',
                {},
                stats.notable.map((n) => h('tr', {}, h('td', {}, appName(n.where)), h('td', {}, n.what || '–'), h('td', { class: 'num' }, signed(n.pct)), h('td', {}, new Date(n.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })))),
              ),
            ),
          )
        : h('p', { class: 'muted' }, 'No higher prices shared in the last 30 days.'),
    ),
    stats.regions.length === 0
      ? ''
      : h(
        'section',
        { 'aria-labelledby': 'regions-h' },
        h('h2', { id: 'regions-h' }, 'By state'),
        h(
          'div',
          { class: 'table-scroll' },
          h(
            'table',
            { class: 'data' },
            h('thead', {}, h('tr', {}, h('th', {}, 'State'), h('th', { class: 'num' }, 'Checks'), h('th', { class: 'num' }, 'Higher'), h('th', { class: 'num' }, 'Higher by'))),
            h('tbody', {}, stats.regions.map((g) => h('tr', {}, h('td', {}, g.key), h('td', { class: 'num' }, String(g.checks)), h('td', { class: 'num' }, `${shares(g).higher}%`), h('td', { class: 'num' }, g.higher ? signed(g.higherBy) : '–')))),
          ),
        ),
      ),
    h(
      'footer',
      {},
      h(
        'p',
        {},
        `Updated ${new Date(stats.generatedAt).toLocaleString()}. Covers the last 180 days. "Changing" checks, where two signed-out loads disagreed, are left out of the percentages. These are what contributors were shown, not proof of why; a signed-out price can differ for ordinary reasons like member discounts. No names, accounts, addresses or IP addresses are collected.`,
      ),
    ),
  );
}

async function start(): Promise<void> {
  app.replaceChildren(header(), h('p', { class: 'muted' }, 'Loading…'));
  if (!API_URL) {
    app.replaceChildren(header(), emptyState('Sharing isn\'t switched on yet', 'Once it is, every check people choose to share will show up here.'));
    return;
  }
  try {
    const r = await fetch(`${API_URL}/api/stats`);
    if (!r.ok) throw new Error(String(r.status));
    const stats = (await r.json()) as Stats;
    if (!stats.totals.checks) app.replaceChildren(header(), emptyState('No checks shared yet', 'Be one of the first: install the extension or run an app check, and choose to share.'));
    else render(stats);
  } catch {
    app.replaceChildren(header(), emptyState('Couldn\'t load the findings', 'The server didn\'t answer. Try again in a minute.'));
  }
}

void start();
