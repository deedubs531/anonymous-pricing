// Who Pays More API: collects shared price checks and serves the totals for the dashboard.
//   POST /api/observations   one check (JSON, see shared/observation.ts)
//   GET  /api/stats          totals for the dashboard (cached for 5 minutes)
import { toRow } from '../../shared/observation';
import { aggregate, type Row } from './stats';

export interface Env {
  DB: D1Database;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
/** Most checks one browser can share per hour; keeps a single person from flooding the totals. */
const HOURLY_LIMIT = 60;
const STATS_WINDOW_DAYS = 180;

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS, ...extra } });

const COLUMNS = ['ts', 'kind', 'source', 'install', 'site', 'path', 'name', 'app', 'option', 'currency', 'mine', 'baseline', 'baseline2', 'baseline_type', 'verdict', 'pct', 'gap_seconds', 'country', 'region'] as const;

async function submit(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: 'Expected JSON.' }, 400);
  }
  const cf = (request as Request & { cf?: { country?: string; regionCode?: string } }).cf;
  const row = toRow(body, Date.now(), { country: cf?.country, region: cf?.country === 'US' ? cf?.regionCode : undefined });
  if (typeof row === 'string') return json({ error: row }, 400);

  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM observations WHERE install = ? AND ts > ?')
    .bind(row.install, row.ts - 3_600_000)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= HOURLY_LIMIT) return json({ error: 'Too many checks from this browser in the last hour.' }, 429);

  await env.DB.prepare(`INSERT INTO observations (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`)
    .bind(...COLUMNS.map((c) => row[c]))
    .run();
  return json({ ok: true, verdict: row.verdict, pct: row.pct }, 201);
}

async function stats(env: Env): Promise<Response> {
  const since = Date.now() - STATS_WINDOW_DAYS * 86_400_000;
  const { results } = await env.DB.prepare('SELECT ts, kind, install, site, name, app, option, verdict, pct, region FROM observations WHERE ts > ? ORDER BY ts DESC LIMIT 50000')
    .bind(since)
    .all<Row>();
  return json(aggregate(results, Date.now()), 200, { 'Cache-Control': 'public, max-age=300' });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (pathname === '/api/observations' && request.method === 'POST') return await submit(request, env);
      if (pathname === '/api/stats' && request.method === 'GET') return await stats(env);
      if (pathname === '/') return json({ name: 'Who Pays More API', endpoints: ['POST /api/observations', 'GET /api/stats'] });
      return json({ error: 'Not found.' }, 404);
    } catch (e) {
      return json({ error: 'Server error.', detail: String(e).slice(0, 200) }, 500);
    }
  },
};
