import { describe, expect, it } from 'vitest';
import { appById } from '../src/appcheck/apps';
import { pattern, patternSentence, percentOver, reportText, type SavedCheck } from '../src/appcheck/log';
import { findPrices, matchLabel, pairByLabel, pickDefault } from '../src/appcheck/prices';

// Text roughly as OCR reads an Uber ride-choice screen and an Instacart cart.
const UBER = `Choose a ride
UberX 4 min $24.80
Faster
Comfort 5 min $31.15
UberXL
6 min away S42.60
Wait & Save $21.90`;

const INSTACART = `Safeway
Item subtotal $64.12
Service fee $5.13
Delivery fee 3.99
Total $73.24`;

describe('findPrices', () => {
  it('finds each price with the words next to it', () => {
    expect(findPrices(UBER)).toEqual([
      { amount: 24.8, label: 'UberX' },
      { amount: 31.15, label: 'Comfort' },
      { amount: 42.6, label: 'UberXL' },
      { amount: 21.9, label: 'Wait & Save' },
    ]);
  });

  it('uses the line above when a price stands alone', () => {
    expect(findPrices('UberXL\n$42.60')).toEqual([{ amount: 42.6, label: 'UberXL' }]);
  });

  it('skips wait-time lines when looking for a name (as sparse OCR reads Uber)', () => {
    const sparse = 'UberX\n\n$24.80\n\n4 min away - 9:52 PM\n\nComfort\n\n4 min away - 9:52 PM\n\n$31.15';
    expect(findPrices(sparse)).toEqual([
      { amount: 24.8, label: 'UberX' },
      { amount: 31.15, label: 'Comfort' },
    ]);
  });

  it('reads cart totals, including prices without a $ sign', () => {
    expect(findPrices(INSTACART).map((c) => [c.label, c.amount])).toEqual([
      ['Item subtotal', 64.12],
      ['Service fee', 5.13],
      ['Delivery fee', 3.99],
      ['Total', 73.24],
    ]);
  });

  it('ignores times, ratings and other numbers', () => {
    expect(findPrices('Arrive by 10:45 PM\n4.9 ★ 2,031 rides\n3 seats')).toEqual([]);
  });
});

describe('picking the price to compare', () => {
  it('prefers the usual option for each app', () => {
    expect(pickDefault(findPrices(UBER), appById('uber')!.keywords)).toBe(0);
    expect(pickDefault(findPrices(INSTACART), appById('instacart')!.keywords)).toBe(0);
    expect(pickDefault(findPrices('Other $5.00\nStandard $12.00'), appById('lyft')!.keywords)).toBe(1);
  });

  it('matches the same option in the second screenshot', () => {
    const second = findPrices('Comfort $28.00\nUberX $19.60');
    expect(matchLabel(second, 'UberX')).toBe(1);
    expect(matchLabel(second, 'Black')).toBeUndefined();
    expect(pairByLabel(findPrices(UBER), second)).toEqual([
      { label: 'UberX', mine: 24.8, clean: 19.6 },
      { label: 'Comfort', mine: 31.15, clean: 28 },
    ]);
  });
});

describe('saved checks', () => {
  const t0 = Date.UTC(2026, 9, 11, 21, 40);
  const check = (mine: number, clean: number, i: number): SavedCheck => ({
    id: String(i),
    app: 'uber',
    label: i === 0 ? 'Home → Airport' : '',
    mine,
    clean,
    mineAt: t0 + i * 86_400_000,
    cleanAt: t0 + i * 86_400_000 + 45_000,
  });
  const list = [check(24.8, 19.6, 0), check(20, 20, 1), check(30, 25, 2)];

  it('works out the difference and the pattern', () => {
    expect(percentOver(list[0])).toBe(26.5);
    expect(pattern(list)).toEqual({ count: 3, higher: 2, lower: 0, same: 1, averagePercent: 15.5 });
    expect(patternSentence(pattern(list))).toBe("Your account was quoted more in 2 of 3 checks, 15.5% more on average. A few more checks will show whether it's a pattern.");
    expect(patternSentence(pattern([]))).toBe('No checks yet.');
  });

  it('writes a report a regulator can read', () => {
    const text = reportText(appById('uber')!, list);
    expect(text).toContain('on my own Uber account and on a second account with no order history, on the same phone, at most 45 seconds apart');
    expect(text).toContain('My account was quoted more in 2 of 3 checks (15.5% more on average).');
    expect(text).toContain('Home → Airport · my account $24.80 · new account $19.60 · +26.5%');
  });
});
