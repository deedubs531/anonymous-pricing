// Small calculations behind the dashboard charts (kept apart from the DOM so they can be tested).
import type { Group, Stats } from '../../worker/src/stats';

/** Checks that compared cleanly (unstable ones are left out of the shares). */
export const decisive = (g: Group) => g.higher + g.same + g.lower;

export function shares(g: Group): { lower: number; same: number; higher: number } {
  const n = decisive(g);
  if (!n) return { lower: 0, same: 0, higher: 0 };
  const pct = (x: number) => Math.round((x / n) * 1000) / 10;
  return { lower: pct(g.lower), same: pct(g.same), higher: pct(g.higher) };
}

/** Groups worth charting (enough checks to mean something), highest share "higher" first. */
export function chartRows(groups: Group[], minChecks = 3, max = 15): { shown: Group[]; hidden: number } {
  const enough = groups.filter((g) => decisive(g) >= minChecks);
  const shown = [...enough].sort((a, b) => shares(b).higher - shares(a).higher || decisive(b) - decisive(a)).slice(0, max);
  return { shown, hidden: groups.length - shown.length };
}

/** A clean axis maximum and ticks: 0, step, 2·step… covering `max`. */
export function niceScale(max: number, ticks = 4): { top: number; steps: number[] } {
  if (max <= 0) return { top: 1, steps: [0, 1] };
  const rough = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const top = Math.ceil(max / step) * step;
  const steps: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) steps.push(Math.round(v * 1000) / 1000);
  return { top, steps };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Week labels: the month name on the first week of each month, blank otherwise. */
export function weekLabels(weeks: Stats['weekly']): string[] {
  let last = -1;
  return weeks.map((w) => {
    const m = Number(w.week.slice(5, 7)) - 1;
    if (m === last) return '';
    last = m;
    return MONTHS[m];
  });
}

/** "1,284", "12.9K" */
export function compact(n: number): string {
  return n >= 10_000 ? `${Math.round(n / 100) / 10}K` : n.toLocaleString('en-US');
}

export const signed = (pct: number) => `${pct > 0 ? '+' : ''}${pct}%`;
