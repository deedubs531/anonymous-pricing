import type { Company, EvidenceKind, Law, PartialDate, Practice, Scenario, Sector, Stage, Tip } from './types';

export const STAGES: Stage[] = ['before', 'during', 'after'];

export const KIND_ORDER: EvidenceKind[] = ['measured', 'admitted', 'scrutiny'];

export const KIND_LABELS: Record<EvidenceKind, { label: string; hint: string }> = {
  measured: { label: 'Tested', hint: 'Independent testers saw different prices for the same thing at the same time' },
  admitted: { label: 'Admitted', hint: 'The company disclosed or admitted varying prices' },
  scrutiny: { label: 'Investigated', hint: 'A regulator, lawmaker or lawsuit is looking into it' },
};

export const PRACTICE_LABELS: Record<Practice, string> = {
  'personal-data': 'Personal data',
  location: 'Location',
  device: 'Device',
  age: 'Age',
  membership: 'Membership',
  'price-test': 'Price tests',
  steering: 'Pricier options first',
  unexplained: 'Unexplained gaps',
};

export const SECTOR_LABELS: Record<Sector, string> = {
  'grocery-delivery': 'Grocery delivery',
  'food-delivery': 'Food delivery',
  rideshare: 'Rideshare',
  retail: 'Retail',
  grocery: 'Grocery stores',
  travel: 'Travel',
  airline: 'Airlines',
  dating: 'Dating',
  education: 'Education',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DATE_RE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

export function isPartialDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [, , month, day] = m;
  if (month && (+month < 1 || +month > 12)) return false;
  if (day) {
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
  }
  return true;
}

/** "2012" → "2012", "2025-12" → "Dec 2025", "2026-01-08" → "Jan 8, 2026". */
export function formatDate(value: PartialDate): string {
  const m = DATE_RE.exec(value);
  if (!m) return value;
  const [, year, month, day] = m;
  if (!month) return year;
  const name = MONTHS[+month - 1];
  return day ? `${name} ${+day}, ${year}` : `${name} ${year}`;
}

/** Evidence kinds a company has, strongest first. */
export function signals(company: Company): EvidenceKind[] {
  const kinds = new Set(company.evidence.map((e) => e.kind));
  return KIND_ORDER.filter((k) => kinds.has(k));
}

export function practices(company: Company): Practice[] {
  return [...new Set(company.evidence.flatMap((e) => e.practices))];
}

/** Partial dates sort correctly as strings ("2025-12" < "2025-12-01" < "2026"). */
export function latestDate(company: Company): PartialDate {
  return company.evidence.reduce((max, e) => (e.date > max ? e.date : max), '');
}

/** Evidence newest first. */
export function timeline(company: Company): Company['evidence'] {
  return [...company.evidence].sort((a, b) => b.date.localeCompare(a.date));
}

export interface Filter {
  query: string;
  kind: EvidenceKind | 'all';
  sector: Sector | 'all';
}

export function filterCompanies(list: Company[], filter: Filter): Company[] {
  const q = filter.query.trim().toLowerCase();
  return list
    .filter((c) => filter.kind === 'all' || c.evidence.some((e) => e.kind === filter.kind))
    .filter((c) => filter.sector === 'all' || c.sector === filter.sector)
    .filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        SECTOR_LABELS[c.sector].toLowerCase().includes(q) ||
        c.evidence.some((e) => `${e.title} ${e.summary}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => latestDate(b).localeCompare(latestDate(a)) || a.name.localeCompare(b.name));
}

export interface LawStatus {
  label: string;
  tone: 'active' | 'upcoming' | 'proposed';
}

/** Where a law stands on `today` (YYYY-MM-DD). */
export function lawStatus(law: Law, today: string): LawStatus {
  if (law.stage === 'proposed') return { label: 'Proposed', tone: 'proposed' };
  if (!law.effective) return { label: 'Signed, start date unclear', tone: 'upcoming' };
  return law.effective <= today
    ? { label: `In effect since ${formatDate(law.effective)}`, tone: 'active' }
    : { label: `Starts ${formatDate(law.effective)}`, tone: 'upcoming' };
}

/** Tips for a scenario (or all of them), grouped by stage in purchase order. */
export function tipsFor(scenarioId: string, allTips: Tip[], allScenarios: Scenario[]): { stage: Stage; tips: Tip[] }[] {
  const scenario = allScenarios.find((s) => s.id === scenarioId);
  const chosen = scenario ? allTips.filter((t) => scenario.tips.includes(t.id)) : allTips;
  return STAGES.map((stage) => ({ stage, tips: chosen.filter((t) => t.stage === stage) })).filter((g) => g.tips.length);
}

export interface Rights {
  laws: { law: Law; status: LawStatus }[];
  gpc: boolean;
}

/** Pricing laws that apply in a state (its own, then federal) and whether sites must honor Global Privacy Control. */
export function rightsFor(code: string, today: string, allLaws: Law[], gpcStates: string[]): Rights {
  const applies = (l: Law, where: string) => l.states.includes(where);
  const laws = [...allLaws.filter((l) => applies(l, code)), ...allLaws.filter((l) => applies(l, 'US'))];
  return { laws: laws.map((law) => ({ law, status: lawStatus(law, today) })), gpc: gpcStates.includes(code) };
}
