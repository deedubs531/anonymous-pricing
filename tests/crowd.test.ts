import { describe, expect, it } from 'vitest';
import { cleanUrlParts, toRow, type StoredRow } from '../shared/observation';
import { aggregate, median, weekOf, type Row } from '../worker/src/stats';

const NOW = Date.UTC(2026, 9, 13, 12);
const web = { kind: 'web', source: 'extension', install: 'abc12345-test', site: 'www.HomeDepot.com', path: '/p/kettle/123?utm=x#top', name: 'Kettle', currency: 'USD', mine: 21.99, anon: [19.99, 19.99] };
const app = { kind: 'app', source: 'app-check', install: 'abc12345-test', app: 'uber', option: 'UberX', mine: 24.8, baseline: 19.6, baselineType: 'clean-account', gapSeconds: 40 };

describe('toRow', () => {
  it('stores a website check with only the host and path, and works out the verdict itself', () => {
    const row = toRow(web, NOW, { country: 'US', region: 'NY' }) as StoredRow;
    expect(row).toMatchObject({ kind: 'web', site: 'homedepot.com', path: '/p/kettle/123', name: 'Kettle', mine: 21.99, baseline: 19.99, baseline2: 19.99, verdict: 'higher', pct: 10, region: 'NY', ts: NOW });
  });

  it('stores an app check', () => {
    expect(toRow(app, NOW)).toMatchObject({ kind: 'app', app: 'uber', option: 'UberX', verdict: 'higher', pct: 26.5, gap_seconds: 40, baseline_type: 'clean-account' });
  });

  it('marks website checks whose signed-out prices disagreed as unstable', () => {
    expect((toRow({ ...web, mine: 25, anon: [20, 22] }, NOW) as StoredRow).verdict).toBe('unstable');
  });

  it('rejects junk', () => {
    expect(toRow(null, NOW)).toBe('Expected a JSON object.');
    expect(toRow({ ...web, install: 'x' }, NOW)).toBe('Missing install ID.');
    expect(toRow({ ...web, site: 'localhost' }, NOW)).toBe('Bad site or path.');
    expect(toRow({ ...web, mine: -1 }, NOW)).toBe('Bad price.');
    expect(toRow({ ...web, anon: [] }, NOW)).toBe('Missing signed-out price.');
    expect(toRow({ ...web, mine: 500 }, NOW)).toBe('Prices too far apart to be the same item.');
    expect(toRow({ ...app, app: 'taxi' }, NOW)).toBe('Unknown app.');
    expect(toRow({ ...app, gapSeconds: 7200 }, NOW)).toBe('Checks must be within an hour of each other.');
    expect(toRow({ ...web, source: 'app-check' }, NOW)).toBe('Unknown source.');
  });

  it('strips control characters and long text', () => {
    expect((toRow({ ...web, name: 'A\u0000B'.padEnd(500, 'x') }, NOW) as StoredRow).name).toHaveLength(200);
    expect(cleanUrlParts('shop.test', 'no-slash')).toBeUndefined();
  });
});

describe('aggregate', () => {
  const row = (over: Partial<Row>): Row => ({ ts: NOW, kind: 'web', install: 'a', site: 'shop.test', name: 'Kettle', app: null, option: null, verdict: 'higher', pct: 10, region: 'NY', ...over });

  it('computes medians and Monday-based weeks', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
    expect(weekOf(NOW)).toBe('2026-10-12'); // a Tuesday → that week's Monday
  });

  it('totals checks by site, app, region and week', () => {
    const rows = [
      row({}),
      row({ install: 'b', verdict: 'same', pct: 0 }),
      row({ install: 'c', verdict: 'unstable', pct: 30 }),
      row({ site: 'other.test', install: 'b', verdict: 'lower', pct: -5, region: 'CA' }),
      row({ kind: 'app', site: null, name: null, app: 'uber', option: 'UberX', pct: 26.5, ts: NOW - 40 * 86_400_000 }),
    ];
    const s = aggregate(rows, NOW);
    expect(s.totals).toEqual({ checks: 5, contributors: 3, sites: 2, apps: 1, higherShare: 50, higherBy: 18.3 });
    expect(s.sites[0]).toEqual({ key: 'shop.test', checks: 3, higher: 1, lower: 0, same: 1, unstable: 1, contributors: 3, higherBy: 10 });
    expect(s.apps).toEqual([{ key: 'uber', checks: 1, higher: 1, lower: 0, same: 0, unstable: 0, contributors: 1, higherBy: 26.5 }]);
    expect(s.regions.map((g) => [g.key, g.checks])).toEqual([['NY', 4], ['CA', 1]]);
    expect(s.weekly).toHaveLength(26);
    expect(s.weekly.at(-1)).toEqual({ week: '2026-10-12', checks: 4, higher: 1 });
    // Notable: higher checks from the last 30 days only, biggest first.
    expect(s.notable).toEqual([{ where: 'shop.test', what: 'Kettle', pct: 10, ts: NOW }]);
  });
});

describe('dashboard calculations', async () => {
  const { chartRows, compact, niceScale, shares, weekLabels } = await import('../src/dashboard/view');
  const g = (key: string, higher: number, same: number, lower: number, unstable = 0) => ({ key, checks: higher + same + lower + unstable, higher, same, lower, unstable, contributors: 1, higherBy: 10 });

  it('works out shares without the unstable checks', () => {
    expect(shares(g('a', 1, 2, 1, 5))).toEqual({ lower: 25, same: 50, higher: 25 });
    expect(shares(g('a', 0, 0, 0, 3))).toEqual({ lower: 0, same: 0, higher: 0 });
  });

  it('charts groups with enough checks, highest share first', () => {
    const { shown, hidden } = chartRows([g('few', 2, 0, 0), g('low', 1, 9, 0), g('high', 5, 5, 0)]);
    expect(shown.map((x) => x.key)).toEqual(['high', 'low']);
    expect(hidden).toBe(1);
  });

  it('picks clean axis ticks', () => {
    expect(niceScale(37)).toEqual({ top: 40, steps: [0, 10, 20, 30, 40] });
    expect(niceScale(7)).toEqual({ top: 8, steps: [0, 2, 4, 6, 8] });
    expect(niceScale(0)).toEqual({ top: 1, steps: [0, 1] });
  });

  it('labels the first week of each month and compacts big numbers', () => {
    const weeks = ['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'].map((week) => ({ week, checks: 0, higher: 0 }));
    expect(weekLabels(weeks)).toEqual(['Sep', '', 'Oct', '']);
    expect(compact(1284)).toBe('1,284');
    expect(compact(12_940)).toBe('12.9K');
  });
});
