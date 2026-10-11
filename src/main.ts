import { companies, laws, REVIEWED, vendors } from './data';
import { dayKey, h } from './dom';
import { AG_DIRECTORY, complaintOffices, FTC_REPORT, GPC_SOURCE, GPC_STATES, myths, scenarios, STAGE_LABELS, states, tips } from './guide';
import {
  filterCompanies,
  formatDate,
  KIND_LABELS,
  KIND_ORDER,
  lawStatus,
  PRACTICE_LABELS,
  practices,
  rightsFor,
  SECTOR_LABELS,
  signals,
  timeline,
  tipsFor,
  type Filter,
} from './logic';
import type { Company, EvidenceKind, Sector, Source, Tip } from './types';
import './styles.css';

const STATUS_LABELS: Record<Company['status'], string> = {
  ongoing: 'No sign it has stopped',
  'says-stopped': 'Company says it stopped',
  unknown: 'Current practice not rechecked',
};

const STATE_KEY = 'whopaysmore.state';
const BILL_TRACKER: Source = {
  label: 'State bill tracker',
  url: 'https://stateofsurveillance.org/news/surveillance-pricing-24-states-ban-algorithmic-pricing-tracker-2026/',
};

const today = dayKey();
const filter: Filter = { query: '', kind: 'all', sector: 'all' };
const companyName = new Map(companies.map((c) => [c.id, c.name]));

function link(url: string, label: string, cls = 'link'): HTMLAnchorElement {
  return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: cls }, label);
}

function sourceList(sources: Source[], lead = 'Sources: '): HTMLElement {
  return h('p', { class: 'sources' }, lead, sources.flatMap((s, i) => [i ? ' · ' : '', link(s.url, s.label)]));
}

function badge(kind: EvidenceKind): HTMLElement {
  return h('span', { class: `badge ${kind}`, title: KIND_LABELS[kind].hint }, KIND_LABELS[kind].label);
}

function readSavedState(): string {
  try {
    return localStorage.getItem(STATE_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveState(code: string): void {
  try {
    localStorage.setItem(STATE_KEY, code);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
}

// ---- Companies ----

function companyCard(c: Company): HTMLElement {
  return h(
    'article',
    { class: 'company', id: `company-${c.id}` },
    h(
      'header',
      {},
      h('h3', {}, c.name),
      h('span', { class: 'sector' }, SECTOR_LABELS[c.sector]),
      h('span', { class: 'badges' }, signals(c).map(badge)),
    ),
    h('p', { class: `status ${c.status}` }, STATUS_LABELS[c.status], c.statusNote && `. ${c.statusNote}`),
    h('ul', { class: 'tags', 'aria-label': 'What drove the difference' }, practices(c).map((p) => h('li', {}, PRACTICE_LABELS[p]))),
    h(
      'details',
      {},
      h('summary', {}, c.evidence.length === 1 ? '1 piece of evidence' : `${c.evidence.length} pieces of evidence`),
      h(
        'ol',
        { class: 'timeline' },
        timeline(c).map((e) =>
          h(
            'li',
            {},
            h('p', { class: 'meta' }, h('time', {}, formatDate(e.date)), ' · ', badge(e.kind)),
            h('h4', {}, e.title),
            h('p', {}, e.summary),
            e.response && h('blockquote', {}, h('strong', {}, 'Company response: '), e.response),
            sourceList(e.sources),
          ),
        ),
      ),
    ),
  );
}

function companySection(): { section: HTMLElement; show: (id: string) => void } {
  const list = h('div', { class: 'list' });
  const count = h('span', { class: 'muted' });
  const search = h('input', {
    type: 'search',
    placeholder: 'Search companies or evidence',
    'aria-label': 'Search companies',
    oninput: () => {
      filter.query = search.value;
      renderList();
    },
  });
  const sectorSelect = h(
    'select',
    {
      'aria-label': 'Industry',
      onchange: () => {
        filter.sector = sectorSelect.value as Sector | 'all';
        renderList();
      },
    },
    h('option', { value: 'all' }, 'All industries'),
    [...new Set(companies.map((c) => c.sector))]
      .sort((a, b) => SECTOR_LABELS[a].localeCompare(SECTOR_LABELS[b]))
      .map((s) => h('option', { value: s }, SECTOR_LABELS[s])),
  );
  const chips = (['all', ...KIND_ORDER] as const).map((kind) =>
    h(
      'button',
      {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(kind === filter.kind),
        title: kind === 'all' ? null : KIND_LABELS[kind].hint,
        onclick: () => {
          filter.kind = kind;
          syncChips();
          renderList();
        },
      },
      kind === 'all' ? 'All' : KIND_LABELS[kind].label,
    ),
  );

  function syncChips(): void {
    chips.forEach((c, i) => c.setAttribute('aria-pressed', String((['all', ...KIND_ORDER] as const)[i] === filter.kind)));
  }

  function renderList(): void {
    const shown = filterCompanies(companies, filter);
    list.replaceChildren(...(shown.length ? shown.map(companyCard) : [h('p', { class: 'empty' }, 'No companies match.')]));
    count.textContent = shown.length === companies.length ? `${shown.length} companies` : `${shown.length} of ${companies.length} companies`;
  }

  /** Clears filters, opens a company's evidence and scrolls to it. */
  function show(id: string): void {
    Object.assign(filter, { query: '', kind: 'all', sector: 'all' });
    search.value = '';
    sectorSelect.value = 'all';
    syncChips();
    renderList();
    const card = document.getElementById(`company-${id}`);
    if (!card) return;
    card.querySelector('details')!.open = true;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderList();
  const section = h(
    'section',
    { id: 'companies', 'aria-labelledby': 'companies-h' },
    h('div', { class: 'section-head' }, h('h2', { id: 'companies-h' }, 'Companies'), count),
    h('dl', { class: 'legend' }, KIND_ORDER.flatMap((k) => [h('dt', {}, badge(k)), h('dd', {}, KIND_LABELS[k].hint)])),
    h('div', { class: 'controls' }, search, h('div', { class: 'chips', role: 'group', 'aria-label': 'Evidence type' }, chips), sectorSelect),
    list,
  );
  return { section, show };
}

// ---- What you can do ----

function tipItem(tip: Tip, showCompany: (id: string) => void): HTMLElement {
  return h(
    'li',
    { class: 'tip' },
    h('label', {}, h('input', { type: 'checkbox' }), h('span', {}, h('strong', {}, tip.title), h('span', { class: 'body' }, tip.body))),
    h(
      'ul',
      { class: 'why' },
      tip.why.map((r) =>
        h(
          'li',
          {},
          h(
            'a',
            {
              href: `#company-${r.company}`,
              class: 'link',
              onclick: (ev: Event) => {
                ev.preventDefault();
                showCompany(r.company);
              },
            },
            companyName.get(r.company) ?? r.company,
          ),
          `: ${r.text}`,
        ),
      ),
    ),
    tip.caveat && h('p', { class: 'limit' }, tip.caveat),
    tip.sources && sourceList(tip.sources, 'More: '),
  );
}

function guideSection(showCompany: (id: string) => void): HTMLElement {
  let current = 'all';
  const list = h('div', { class: 'checklist' });
  const options = [{ id: 'all', label: 'All tips' }, ...scenarios];
  const chips = options.map((o) =>
    h(
      'button',
      {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(o.id === current),
        onclick: () => {
          current = o.id;
          chips.forEach((c, i) => c.setAttribute('aria-pressed', String(options[i].id === current)));
          renderTips();
        },
      },
      o.label,
    ),
  );

  function renderTips(): void {
    list.replaceChildren(
      ...tipsFor(current, tips, scenarios).map((g) =>
        h('div', { class: 'stage' }, h('h3', {}, STAGE_LABELS[g.stage]), h('ol', { class: 'tips' }, g.tips.map((t) => tipItem(t, showCompany)))),
      ),
    );
  }

  renderTips();
  return h(
    'section',
    { id: 'what-you-can-do', 'aria-labelledby': 'guide-h' },
    h('h2', { id: 'guide-h' }, 'What you can do'),
    h(
      'p',
      { class: 'muted' },
      'Nothing avoids it completely, because the price is set on the company\'s side. But you can catch it, limit the data you hand over, and use the laws that exist. The most reliable check is a second quote at the same moment.',
    ),
    h('p', { class: 'label' }, 'I\'m about to…'),
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Situation' }, chips),
    list,
    h(
      'aside',
      { class: 'myths' },
      h('h3', {}, 'What doesn\'t help much'),
      h('ul', {}, myths.map((m) => h('li', {}, h('strong', {}, m.title), h('span', {}, m.body)))),
    ),
  );
}

// ---- Your rights ----

function rightsSection(): HTMLElement {
  const result = h('div', { class: 'rights' });
  const select = h(
    'select',
    {
      'aria-label': 'Your state',
      onchange: () => {
        saveState(select.value);
        renderRights();
      },
    },
    h('option', { value: '' }, 'Choose your state'),
    states.map((s) => h('option', { value: s.code }, s.name)),
  );
  select.value = readSavedState();

  function renderRights(): void {
    const state = states.find((s) => s.code === select.value);
    if (!state) {
      result.replaceChildren(h('p', { class: 'muted' }, 'Pick a state to see which pricing laws protect you, your privacy opt-outs, and where to report.'));
      return;
    }
    const rights = rightsFor(state.code, today, laws, GPC_STATES);
    const own = rights.laws.filter((r) => !r.law.states.includes('US'));
    const federal = rights.laws.filter((r) => r.law.states.includes('US'));
    const office = complaintOffices[state.code];
    result.replaceChildren(
      h('h3', {}, 'Pricing laws'),
      own.length
        ? h('ul', { class: 'law-list' }, own.map(({ law, status }) => lawRow(law.name, status.label, status.tone, law.covers)))
        : h(
            'p',
            {},
            `${state.name} has no law on personalized pricing yet. Bills have been introduced in many states. `,
            link(BILL_TRACKER.url, BILL_TRACKER.label),
          ),
      h('ul', { class: 'law-list' }, federal.map(({ law, status }) => lawRow(`Federal: ${law.name}`, status.label, status.tone, law.covers))),
      h('h3', {}, 'Privacy opt-outs'),
      h(
        'p',
        {},
        rights.gpc
          ? `Websites must honor Global Privacy Control in ${state.name}. Turn it on in your browser and it opts you out of data sales on every site you visit.`
          : `${state.name} doesn't require websites to honor Global Privacy Control yet. Turning it on is still worth it; many sites honor it anyway.`,
      ),
      sourceList([GPC_SOURCE], 'Source: '),
      h('h3', {}, 'Where to report'),
      h(
        'ul',
        { class: 'report-list' },
        h('li', {}, office ? link(office.url, office.label) : link(AG_DIRECTORY.url, AG_DIRECTORY.label), office?.phone ? ` · ${office.phone}` : ''),
        h('li', {}, link(FTC_REPORT.url, `Federal Trade Commission (${FTC_REPORT.label})`)),
      ),
      h('p', { class: 'muted small' }, 'Include screenshots of both prices, the date, time and device, and the notice (or its absence).'),
    );
  }

  renderRights();
  return h(
    'section',
    { id: 'rights', 'aria-labelledby': 'rights-h' },
    h('h2', { id: 'rights-h' }, 'Your rights'),
    h('div', { class: 'controls' }, select),
    result,
  );
}

function lawRow(name: string, status: string, tone: string, covers: string): HTMLElement {
  return h('li', {}, h('p', { class: 'meta' }, h('strong', {}, name), h('span', { class: `pill ${tone}` }, status)), h('p', { class: 'small' }, covers));
}

// ---- Page ----

function stat(value: number, label: string): HTMLElement {
  return h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label));
}

function render(root: HTMLElement): void {
  const count = (kind: EvidenceKind) => companies.filter((c) => c.evidence.some((e) => e.kind === kind)).length;
  const activeLaws = laws.filter((l) => lawStatus(l, today).tone === 'active').length;
  const companiesPart = companySection();

  root.replaceChildren(
    h(
      'header',
      { class: 'masthead' },
      h('h1', {}, 'Who Pays More'),
      h(
        'p',
        { class: 'lede' },
        'Some apps and stores charge different people different prices for the same thing. Who\'s been caught, what you can do before you pay, and your rights where you live.',
      ),
      h(
        'div',
        { class: 'stats' },
        stat(count('measured'), 'tested by outsiders'),
        stat(count('admitted'), 'admitted it'),
        stat(count('scrutiny'), 'under investigation'),
        stat(activeLaws, 'state laws in effect'),
      ),
      h(
        'nav',
        { 'aria-label': 'Sections' },
        [
          ['#what-you-can-do', 'What you can do'],
          ['#rights', 'Your rights'],
          ['#companies', 'Companies'],
          ['#laws', 'Laws'],
        ].map(([href, label]) => h('a', { href }, label)),
      ),
    ),
    guideSection(companiesPart.show),
    rightsSection(),
    companiesPart.section,
    h(
      'section',
      { id: 'laws', 'aria-labelledby': 'laws-h' },
      h('h2', { id: 'laws-h' }, 'Laws'),
      h(
        'div',
        { class: 'laws' },
        laws.map((l) => {
          const status = lawStatus(l, today);
          return h(
            'article',
            { class: 'law' },
            h('p', { class: 'meta' }, h('span', {}, l.jurisdiction), h('span', { class: `pill ${status.tone}` }, status.label)),
            h('h3', {}, l.name),
            h('p', {}, l.summary),
            h('p', { class: 'small muted' }, `Covers: ${l.covers}`),
            l.caveat && h('p', { class: 'caveat' }, l.caveat),
            sourceList(l.sources),
          );
        }),
      ),
    ),
    h(
      'section',
      { 'aria-labelledby': 'vendors-h' },
      h('h2', { id: 'vendors-h' }, 'Behind the scenes'),
      h('p', { class: 'muted' }, 'Firms that sell pricing software and data to the apps and stores above.'),
      h('ul', { class: 'vendors' }, vendors.map((v) => h('li', {}, h('strong', {}, v.name), h('span', {}, v.note), sourceList(v.sources)))),
    ),
    h(
      'footer',
      {},
      h('p', {}, `Last checked against sources ${formatDate(REVIEWED)}. Summaries come from news reports, research and company statements; follow the links for the full story. Not legal advice.`),
    ),
  );
}

render(document.querySelector('#app')!);
