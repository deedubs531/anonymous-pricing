import { describe, expect, it } from 'vitest';
import { companies, laws, REVIEWED, vendors } from '../src/data';
import { AG_DIRECTORY, complaintOffices, FTC_REPORT, GPC_SOURCE, GPC_STATES, scenarios, states, tips } from '../src/guide';
import { filterCompanies, formatDate, isPartialDate, latestDate, lawStatus, rightsFor, signals, timeline, tipsFor } from '../src/logic';
import type { Company, Law, Tip } from '../src/types';

const allSources = [
  ...companies.flatMap((c) => c.evidence.flatMap((e) => e.sources)),
  ...laws.flatMap((l) => l.sources),
  ...vendors.flatMap((v) => v.sources),
  ...tips.flatMap((t) => t.sources ?? []),
  ...Object.values(complaintOffices),
  AG_DIRECTORY,
  FTC_REPORT,
  GPC_SOURCE,
];
const stateCodes = new Set(states.map((s) => s.code));

describe('who pays more data', () => {
  it('gives every company a unique id and at least one piece of evidence', () => {
    const ids = companies.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of companies) expect(c.evidence.length, c.name).toBeGreaterThan(0);
  });

  it('backs every claim with a source', () => {
    for (const c of companies) for (const e of c.evidence) expect(e.sources.length, `${c.name}: ${e.title}`).toBeGreaterThan(0);
    for (const l of laws) expect(l.sources.length, l.name).toBeGreaterThan(0);
    for (const v of vendors) expect(v.sources.length, v.name).toBeGreaterThan(0);
  });

  it('links only to https addresses', () => {
    for (const s of allSources) expect(new URL(s.url).protocol, s.url).toBe('https:');
  });

  it('uses valid dates that are not in the future', () => {
    const dates = [
      REVIEWED,
      ...companies.flatMap((c) => c.evidence.map((e) => e.date)),
      ...laws.flatMap((l) => [l.signed, l.effective].filter((d): d is string => !!d)),
    ];
    for (const d of dates) expect(isPartialDate(d), d).toBe(true);
    for (const c of companies) for (const e of c.evidence) expect(e.date <= REVIEWED, `${c.name}: ${e.date}`).toBe(true);
  });

  it('only gives enacted laws a start date, and never before signing', () => {
    for (const l of laws) {
      if (l.stage === 'proposed') expect(l.effective, l.name).toBeUndefined();
      if (l.signed && l.effective) expect(l.signed <= l.effective, l.name).toBe(true);
    }
  });

  it('ties every law to real states', () => {
    for (const l of laws) {
      expect(l.states.length, l.name).toBeGreaterThan(0);
      for (const code of l.states) expect(code === 'US' || stateCodes.has(code), `${l.name}: ${code}`).toBe(true);
    }
  });
});

describe('who pays more guide', () => {
  it('lists 50 states and DC once each', () => {
    expect(stateCodes.size).toBe(51);
    expect(states.length).toBe(51);
    for (const code of [...GPC_STATES, ...Object.keys(complaintOffices)]) expect(stateCodes.has(code), code).toBe(true);
  });

  it('backs every tip with a company case in the database', () => {
    const ids = new Set(companies.map((c) => c.id));
    for (const t of tips) {
      expect(t.why.length, t.id).toBeGreaterThan(0);
      for (const r of t.why) expect(ids.has(r.company), `${t.id} → ${r.company}`).toBe(true);
    }
  });

  it('builds scenarios from existing tips, and uses every tip somewhere', () => {
    const ids = new Set(tips.map((t) => t.id));
    expect(ids.size).toBe(tips.length);
    for (const s of scenarios) for (const id of s.tips) expect(ids.has(id), `${s.id} → ${id}`).toBe(true);
    const used = new Set(scenarios.flatMap((s) => s.tips));
    for (const t of tips) expect(used.has(t.id), t.id).toBe(true);
  });
});

describe('who pays more logic', () => {
  const company = (over: Partial<Company>): Company => ({ id: 'x', name: 'X', sector: 'retail', status: 'unknown', evidence: [], ...over });
  const ev = (date: string, kind: Company['evidence'][number]['kind'], title = 't'): Company['evidence'][number] => ({
    date,
    kind,
    practices: ['location'],
    title,
    summary: 's',
    sources: [{ label: 'l', url: 'https://example.com' }],
  });

  it('checks partial dates', () => {
    expect(isPartialDate('2012')).toBe(true);
    expect(isPartialDate('2025-12')).toBe(true);
    expect(isPartialDate('2026-01-08')).toBe(true);
    expect(isPartialDate('2025-13')).toBe(false);
    expect(isPartialDate('2026-02-30')).toBe(false);
    expect(isPartialDate('Dec 2025')).toBe(false);
  });

  it('formats dates as precisely as they are known', () => {
    expect(formatDate('2012')).toBe('2012');
    expect(formatDate('2025-12')).toBe('Dec 2025');
    expect(formatDate('2026-01-08')).toBe('Jan 8, 2026');
  });

  it('lists signals strongest first, once each', () => {
    const c = company({ evidence: [ev('2026', 'scrutiny'), ev('2025', 'measured'), ev('2024', 'scrutiny')] });
    expect(signals(c)).toEqual(['measured', 'scrutiny']);
  });

  it('orders evidence newest first across date precisions', () => {
    const c = company({ evidence: [ev('2025-12', 'measured', 'a'), ev('2026-01-08', 'scrutiny', 'b'), ev('2012', 'admitted', 'c')] });
    expect(timeline(c).map((e) => e.title)).toEqual(['b', 'a', 'c']);
    expect(latestDate(c)).toBe('2026-01-08');
  });

  it('filters by evidence type, industry and search text, newest first', () => {
    const list = [
      company({ id: 'a', name: 'Alpha', sector: 'rideshare', evidence: [ev('2020', 'measured', 'Fares differ')] }),
      company({ id: 'b', name: 'Beta', sector: 'retail', evidence: [ev('2024', 'scrutiny')] }),
      company({ id: 'c', name: 'Gamma', sector: 'retail', evidence: [ev('2022', 'measured')] }),
    ];
    const names = (f: Partial<Parameters<typeof filterCompanies>[1]>) => filterCompanies(list, { query: '', kind: 'all', sector: 'all', ...f }).map((c) => c.name);
    expect(names({})).toEqual(['Beta', 'Gamma', 'Alpha']);
    expect(names({ kind: 'measured' })).toEqual(['Gamma', 'Alpha']);
    expect(names({ sector: 'retail', kind: 'measured' })).toEqual(['Gamma']);
    expect(names({ query: 'fares' })).toEqual(['Alpha']);
    expect(names({ query: '  RIDESHARE ' })).toEqual(['Alpha']);
  });

  it('describes where a law stands on a given day', () => {
    const law = (over: Partial<Law>): Law => ({ id: 'l', jurisdiction: 'J', name: 'N', kind: 'ban', stage: 'enacted', states: ['NY'], covers: '', summary: 's', sources: [], ...over });
    expect(lawStatus(law({ effective: '2026-10-01' }), '2026-10-01')).toEqual({ label: 'In effect since Oct 1, 2026', tone: 'active' });
    expect(lawStatus(law({ effective: '2026-12-14' }), '2026-10-11')).toEqual({ label: 'Starts Dec 14, 2026', tone: 'upcoming' });
    expect(lawStatus(law({}), '2026-10-11').tone).toBe('upcoming');
    expect(lawStatus(law({ stage: 'proposed' }), '2026-10-11').label).toBe('Proposed');
  });

  it('groups tips by stage in purchase order, for a scenario or all', () => {
    const tip = (id: string, stage: Tip['stage']): Tip => ({ id, stage, title: id, body: '', why: [] });
    const all = [tip('a', 'after'), tip('b', 'before'), tip('c', 'during'), tip('d', 'before')];
    const scenes = [{ id: 's', label: 'S', tips: ['a', 'd'] }];
    expect(tipsFor('all', all, scenes).map((g) => [g.stage, g.tips.map((t) => t.id)])).toEqual([
      ['before', ['b', 'd']],
      ['during', ['c']],
      ['after', ['a']],
    ]);
    expect(tipsFor('s', all, scenes).map((g) => [g.stage, g.tips.map((t) => t.id)])).toEqual([
      ['before', ['d']],
      ['after', ['a']],
    ]);
  });

  it('finds a state\'s own laws first, then federal ones', () => {
    const law = (id: string, st: string[], effective?: string): Law => ({ id, jurisdiction: 'J', name: id, kind: 'ban', stage: 'enacted', states: st, covers: '', effective, summary: '', sources: [] });
    const all = [law('fed', ['US'], '2020-01-01'), law('ny', ['NY'], '2027-01-01'), law('md', ['MD'], '2026-10-01')];
    const ny = rightsFor('NY', '2026-10-11', all, ['MD']);
    expect(ny.laws.map((r) => [r.law.id, r.status.tone])).toEqual([
      ['ny', 'upcoming'],
      ['fed', 'active'],
    ]);
    expect(ny.gpc).toBe(false);
    expect(rightsFor('MD', '2026-10-11', all, ['MD']).gpc).toBe(true);
    expect(rightsFor('WY', '2026-10-11', all, ['MD']).laws.map((r) => r.law.id)).toEqual(['fed']);
  });
});
