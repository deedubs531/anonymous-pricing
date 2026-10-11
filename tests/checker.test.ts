import { describe, expect, it } from 'vitest';
import { fetchAnonymous } from '../checker/check';
import { compare, describe as describeVerdict, money } from '../checker/compare';
import { extractPrice, parsePrice } from '../checker/extract';
import { detectPlatform } from '../src/platform';

const page = (head: string, body = '') => new DOMParser().parseFromString(`<html><head>${head}</head><body>${body}</body></html>`, 'text/html');
const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

describe('parsePrice', () => {
  it('reads common price formats', () => {
    expect(parsePrice(19.99)).toBe(19.99);
    expect(parsePrice('$1,299.99')).toBe(1299.99);
    expect(parsePrice('19,99 €')).toBe(19.99);
    expect(parsePrice('1.299,99')).toBe(1299.99);
    expect(parsePrice('USD 24')).toBe(24);
  });

  it('rejects things that are not prices', () => {
    expect(parsePrice('')).toBeUndefined();
    expect(parsePrice('Free')).toBeUndefined();
    expect(parsePrice(0)).toBeUndefined();
    expect(parsePrice(null)).toBeUndefined();
  });
});

describe('extractPrice', () => {
  it('reads a schema.org Product offer', () => {
    const doc = page(ld({ '@context': 'https://schema.org', '@type': 'Product', name: 'Kettle', offers: { '@type': 'Offer', price: '34.50', priceCurrency: 'USD' } }));
    expect(extractPrice(doc)).toEqual({ price: 34.5, currency: 'USD', name: 'Kettle', via: 'json-ld' });
  });

  it('finds products inside @graph and takes the lowest offer', () => {
    const doc = page(
      ld({
        '@graph': [
          { '@type': 'WebPage', name: 'Page' },
          { '@type': ['Product'], name: 'Shoe', offers: [{ '@type': 'Offer', price: 90 }, { '@type': 'Offer', price: 80 }] },
        ],
      }),
    );
    expect(extractPrice(doc)?.price).toBe(80);
  });

  it('reads AggregateOffer lowPrice and variants of a ProductGroup', () => {
    expect(extractPrice(page(ld({ '@type': 'Product', offers: { '@type': 'AggregateOffer', lowPrice: '12', highPrice: '20' } })))?.price).toBe(12);
    const group = { '@type': 'ProductGroup', name: 'Tee', hasVariant: [{ '@type': 'Product', offers: { '@type': 'Offer', price: 15 } }] };
    expect(extractPrice(page(ld(group)))?.price).toBe(15);
  });

  it('skips broken JSON-LD and falls back to microdata, then meta tags', () => {
    const micro = page('<script type="application/ld+json">{oops</script>', '<div itemscope itemtype="https://schema.org/Product"><span itemprop="name">Lamp</span><meta itemprop="price" content="45.00"><meta itemprop="priceCurrency" content="USD"></div>');
    expect(extractPrice(micro)).toEqual({ price: 45, currency: 'USD', name: 'Lamp', via: 'microdata' });
    const meta = page('<meta property="product:price:amount" content="9.99"><meta property="product:price:currency" content="EUR"><meta property="og:title" content="Mug">');
    expect(extractPrice(meta)).toEqual({ price: 9.99, currency: 'EUR', name: 'Mug', via: 'meta' });
  });

  it('returns nothing for pages without a price', () => {
    expect(extractPrice(page('<title>Home</title>', '<p>$5 off today</p>'))).toBeUndefined();
  });
});

describe('compare', () => {
  it('flags a higher signed-in price with the difference', () => {
    expect(compare(21.99, [19.99, 19.99])).toEqual({ kind: 'higher', mine: 21.99, anon: 19.99, diff: 2, percent: 10 });
  });

  it('recognises lower and equal prices', () => {
    expect(compare(18, [20, 20]).kind).toBe('lower');
    expect(compare(20, [20.001, 20]).kind).toBe('same');
  });

  it('refuses to blame your data when signed-out prices change on their own', () => {
    expect(compare(25, [20, 22])).toEqual({ kind: 'unstable', mine: 25, anonPrices: [20, 22] });
  });

  it('explains missing prices', () => {
    expect(compare(10, [], 'blocked')).toEqual({ kind: 'no-anon', mine: 10, reason: 'blocked' });
    expect(compare(undefined, [10, 10])).toEqual({ kind: 'no-mine' });
  });

  it('describes verdicts in plain language', () => {
    expect(describeVerdict(compare(21.99, [19.99, 19.99]), 'USD')).toMatchObject({ title: "You're seeing $2.00 more (10%)", tone: 'bad' });
    expect(money(5, 'not-a-currency')).toBe('5.00');
  });
});

describe('fetchAnonymous', () => {
  const html = (price: number) => `<html><head>${ld({ '@type': 'Product', offers: { price } })}</head></html>`;

  it('fetches twice without cookies', async () => {
    const calls: RequestInit[] = [];
    const prices = [10, 11];
    const result = await fetchAnonymous('https://shop.test/p', async (_u, init) => {
      calls.push(init);
      return new Response(html(prices[calls.length - 1]));
    });
    expect(result.prices).toEqual([10, 11]);
    expect(calls.map((c) => c.credentials)).toEqual(['omit', 'omit']);
  });

  it('reports blocks and pages without prices', async () => {
    expect((await fetchAnonymous('u', async () => new Response('', { status: 403 }))).failure).toMatch(/blocked/);
    expect((await fetchAnonymous('u', async () => new Response('<html></html>'))).failure).toMatch(/doesn't include a price/);
    expect((await fetchAnonymous('u', async () => Promise.reject(new TypeError('net')))).failure).toMatch(/refused/);
  });
});

describe('detectPlatform', () => {
  const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';
  const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
  const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';

  it('tells Safari on iPhone from other iPhone browsers, including Brave', () => {
    expect(detectPlatform(IPHONE_SAFARI)).toBe('ios-safari');
    expect(detectPlatform(IPHONE_CHROME)).toBe('ios-other');
    expect(detectPlatform(IPHONE_SAFARI, 5, true)).toBe('ios-other');
  });

  it('spots iPads asking for desktop sites, Android and computers', () => {
    expect(detectPlatform(IPAD_DESKTOP, 5)).toBe('ios-safari');
    expect(detectPlatform(IPAD_DESKTOP, 0)).toBe('desktop');
    expect(detectPlatform(ANDROID)).toBe('android');
  });
});
