// Saved checks: patterns per app and a plain-text report for a complaint.
import { compare, money } from '../../checker/compare';
import type { AppId, AppInfo } from './apps';

export interface SavedCheck {
  id: string;
  app: AppId;
  label: string;
  mine: number;
  clean: number;
  /** When each price was recorded (ms since epoch). */
  mineAt: number;
  cleanAt: number;
}

/** Percent the user's account paid over the clean account (negative = less). */
export function percentOver(c: Pick<SavedCheck, 'mine' | 'clean'>): number {
  return Math.round(((c.mine - c.clean) / c.clean) * 1000) / 10;
}

export function gapSeconds(c: Pick<SavedCheck, 'mineAt' | 'cleanAt'>): number {
  return Math.round(Math.abs(c.cleanAt - c.mineAt) / 1000);
}

export interface Pattern {
  count: number;
  higher: number;
  lower: number;
  same: number;
  averagePercent: number;
}

export function pattern(checks: SavedCheck[]): Pattern {
  const kinds = checks.map((c) => compare(c.mine, [c.clean]).kind);
  const avg = checks.length ? checks.reduce((s, c) => s + percentOver(c), 0) / checks.length : 0;
  return {
    count: checks.length,
    higher: kinds.filter((k) => k === 'higher').length,
    lower: kinds.filter((k) => k === 'lower').length,
    same: kinds.filter((k) => k === 'same').length,
    averagePercent: Math.round(avg * 10) / 10,
  };
}

/** One line a person can read: "Higher in 7 of 9 checks, 18% more on average." */
export function patternSentence(p: Pattern): string {
  if (!p.count) return 'No checks yet.';
  const avg = p.averagePercent > 0 ? `${p.averagePercent}% more on average` : p.averagePercent < 0 ? `${-p.averagePercent}% less on average` : 'no difference on average';
  const strength = p.count < 5 ? ' A few more checks will show whether it\'s a pattern.' : '';
  return `Your account was quoted more in ${p.higher} of ${p.count} check${p.count === 1 ? '' : 's'}, ${avg}.${strength}`;
}

const when = (ms: number) => new Date(ms).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export function reportText(app: AppInfo, checks: SavedCheck[]): string {
  const sorted = [...checks].sort((a, b) => a.mineAt - b.mineAt);
  const p = pattern(sorted);
  const what = app.kind === 'ride' ? 'the same trip and ride type' : 'the same store, items and address';
  const maxGap = Math.max(...sorted.map(gapSeconds));
  return [
    `Two-account price checks on ${app.name}`,
    '',
    `Between ${when(sorted[0].mineAt)} and ${when(sorted[sorted.length - 1].mineAt)}, I priced ${what} on my own ${app.name} account and on a second account with no order history, on the same phone, at most ${maxGap} seconds apart.`,
    `My account was quoted more in ${p.higher} of ${p.count} checks (${p.averagePercent}% more on average).`,
    '',
    ...sorted.map((c) => `- ${when(c.mineAt)}${c.label ? ` · ${c.label}` : ''} · my account ${money(c.mine)} · new account ${money(c.clean)} · ${percentOver(c) > 0 ? '+' : ''}${percentOver(c)}%`),
    '',
    'Screenshots of each check are available.',
  ].join('\n');
}
