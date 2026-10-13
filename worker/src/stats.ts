// Turns stored checks into the numbers the public dashboard shows.
import type { StoredRow } from '../../shared/observation';

export type Row = Pick<StoredRow, 'ts' | 'kind' | 'install' | 'site' | 'name' | 'app' | 'option' | 'verdict' | 'pct' | 'region'>;

export interface Group {
  key: string;
  checks: number;
  higher: number;
  lower: number;
  same: number;
  unstable: number;
  contributors: number;
  /** How much higher, as a median percent, in the checks where the person's price was higher. */
  higherBy: number;
}

export interface Stats {
  generatedAt: number;
  totals: { checks: number; contributors: number; sites: number; apps: number; higherShare: number; higherBy: number };
  sites: Group[];
  apps: Group[];
  regions: Group[];
  weekly: { week: string; checks: number; higher: number }[];
  notable: { where: string; what: string; pct: number; ts: number }[];
}

const DAY = 86_400_000;

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return Math.round((s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2) * 10) / 10;
}

function group(rows: Row[], keyOf: (r: Row) => string | null): Group[] {
  const map = new Map<string, Row[]>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      checks: list.length,
      higher: list.filter((r) => r.verdict === 'higher').length,
      lower: list.filter((r) => r.verdict === 'lower').length,
      same: list.filter((r) => r.verdict === 'same').length,
      unstable: list.filter((r) => r.verdict === 'unstable').length,
      contributors: new Set(list.map((r) => r.install)).size,
      higherBy: median(list.filter((r) => r.verdict === 'higher').map((r) => r.pct)),
    }))
    .sort((a, b) => b.checks - a.checks || a.key.localeCompare(b.key));
}

/** Monday of the week a time falls in, as YYYY-MM-DD (UTC). */
export function weekOf(ts: number): string {
  const d = new Date(ts);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10);
}

export function aggregate(rows: Row[], now: number): Stats {
  const decisive = rows.filter((r) => r.verdict !== 'unstable');
  const weeks: Stats['weekly'] = [];
  for (let i = 25; i >= 0; i--) weeks.push({ week: weekOf(now - i * 7 * DAY), checks: 0, higher: 0 });
  for (const r of rows) {
    const w = weeks.find((x) => x.week === weekOf(r.ts));
    if (!w) continue;
    w.checks++;
    if (r.verdict === 'higher') w.higher++;
  }
  const sites = group(rows.filter((r) => r.kind === 'web'), (r) => r.site);
  const apps = group(rows.filter((r) => r.kind === 'app'), (r) => r.app);
  return {
    generatedAt: now,
    totals: {
      checks: rows.length,
      contributors: new Set(rows.map((r) => r.install)).size,
      sites: sites.length,
      apps: apps.length,
      higherShare: decisive.length ? Math.round((decisive.filter((r) => r.verdict === 'higher').length / decisive.length) * 1000) / 10 : 0,
      higherBy: median(rows.filter((r) => r.verdict === 'higher').map((r) => r.pct)),
    },
    sites: sites.slice(0, 50),
    apps,
    regions: group(rows, (r) => r.region).slice(0, 60),
    weekly: weeks,
    notable: rows
      .filter((r) => r.verdict === 'higher' && r.ts > now - 30 * DAY)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10)
      .map((r) => ({ where: r.site ?? r.app ?? '', what: r.name ?? r.option ?? '', pct: r.pct, ts: r.ts })),
  };
}
