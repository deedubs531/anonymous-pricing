// Turns "the price I see" and "the price a signed-out visitor sees" into a plain-language verdict.

export type Verdict =
  | { kind: 'same'; mine: number; anon: number }
  | { kind: 'higher' | 'lower'; mine: number; anon: number; diff: number; percent: number }
  | { kind: 'unstable'; mine: number; anonPrices: number[] }
  | { kind: 'no-anon'; mine?: number; reason: string }
  | { kind: 'no-mine' };

/** Prices within half a cent are the same. */
const TOLERANCE = 0.005;

/**
 * `anonPrices` are two signed-out checks made one after the other. If they disagree with each
 * other, the site is changing prices on its own (testing or demand), so a difference from yours
 * can't be blamed on your data.
 */
export function compare(mine: number | undefined, anonPrices: number[], anonFailure?: string): Verdict {
  if (anonPrices.length === 0) return { kind: 'no-anon', mine, reason: anonFailure ?? 'The signed-out page had no price.' };
  if (mine === undefined) return { kind: 'no-mine' };
  const [first] = anonPrices;
  if (anonPrices.some((p) => Math.abs(p - first) > TOLERANCE)) return { kind: 'unstable', mine, anonPrices };
  const diff = Math.round((mine - first) * 100) / 100;
  if (Math.abs(diff) <= TOLERANCE) return { kind: 'same', mine, anon: first };
  return { kind: diff > 0 ? 'higher' : 'lower', mine, anon: first, diff, percent: Math.round((Math.abs(diff) / first) * 1000) / 10 };
}

export function money(n: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

/** Headline and explanation for the result card. */
export function describe(v: Verdict, currency?: string): { title: string; body: string; tone: 'bad' | 'good' | 'neutral' } {
  const m = (n: number) => money(n, currency);
  switch (v.kind) {
    case 'higher':
      return {
        title: `You're seeing ${m(v.diff)} more (${v.percent}%)`,
        body: `Your price is ${m(v.mine)}. A signed-out visitor on your same connection sees ${m(v.anon)}. Something tied to your account or cookies is raising it.`,
        tone: 'bad',
      };
    case 'lower':
      return {
        title: `You're seeing ${m(-v.diff)} less (${v.percent}%)`,
        body: `Your price is ${m(v.mine)}; signed out it's ${m(v.anon)}. Often a member or loyalty price, so being signed in helps here.`,
        tone: 'good',
      };
    case 'same':
      return { title: 'Same price signed out', body: `You and a signed-out visitor both see ${m(v.mine)}.`, tone: 'neutral' };
    case 'unstable':
      return {
        title: 'The price keeps changing',
        body: `Two signed-out checks a moment apart got ${v.anonPrices.map(m).join(' and ')} (you see ${m(v.mine)}). The site may be testing prices or changing them with demand. Try again in a minute.`,
        tone: 'neutral',
      };
    case 'no-anon':
      return { title: 'Couldn\'t get a signed-out price', body: v.reason, tone: 'neutral' };
    case 'no-mine':
      return { title: 'What price do you see?', body: 'This page doesn\'t publish its price in a form the check can read. Type the price shown to you.', tone: 'neutral' };
  }
}
