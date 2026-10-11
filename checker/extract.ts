// Reads a product's price from the structured data stores publish for search engines:
// JSON-LD (schema.org Product/Offer), microdata (itemprop="price") and Open Graph price tags.
// These are in the HTML the server sends, so they can be read from a fetched page too.

export interface PriceInfo {
  /** The lowest price on the page, as a number. */
  price: number;
  currency?: string;
  name?: string;
  /** Where it was found, for the result card. */
  via: 'json-ld' | 'microdata' | 'meta';
}

/** "1,299.99", "$19.99", "19,99 €" or 19.99 → number. */
export function parsePrice(raw: unknown): number | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : undefined;
  if (typeof raw !== 'string') return undefined;
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return undefined;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot && s.length - lastComma - 1 === 2) {
    // Comma is the decimal separator ("1.299,99" or "19,99").
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

type Json = Record<string, unknown>;

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function hasType(node: Json, type: string): boolean {
  return asArray(node['@type']).some((t) => typeof t === 'string' && t.toLowerCase() === type.toLowerCase());
}

/** Every object in a JSON-LD tree (handles @graph, arrays and nesting). */
function walk(node: unknown, out: Json[] = []): Json[] {
  if (Array.isArray(node)) {
    for (const n of node) walk(n, out);
  } else if (node && typeof node === 'object') {
    out.push(node as Json);
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v, out);
  }
  return out;
}

function offerPrices(offer: Json): { prices: number[]; currency?: string } {
  const prices = [offer.price, offer.lowPrice, (offer.priceSpecification as Json | undefined)?.price]
    .map(parsePrice)
    .filter((n): n is number => n !== undefined);
  const currency = (offer.priceCurrency ?? (offer.priceSpecification as Json | undefined)?.priceCurrency) as string | undefined;
  return { prices, currency };
}

function fromJsonLd(doc: Document): PriceInfo | undefined {
  const nodes: Json[] = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      walk(JSON.parse(script.textContent ?? ''), nodes);
    } catch {
      // Broken JSON-LD is common; skip it.
    }
  }
  const products = nodes.filter((n) => hasType(n, 'Product') || hasType(n, 'ProductGroup'));
  let best: PriceInfo | undefined;
  for (const product of products) {
    for (const offer of walk(product.offers).filter((o) => hasType(o, 'Offer') || hasType(o, 'AggregateOffer') || 'price' in o)) {
      const { prices, currency } = offerPrices(offer);
      for (const price of prices) {
        if (!best || price < best.price) best = { price, currency, name: typeof product.name === 'string' ? product.name : undefined, via: 'json-ld' };
      }
    }
  }
  return best;
}

function fromMicrodata(doc: Document): PriceInfo | undefined {
  const el = doc.querySelector('[itemprop="price"]');
  const price = parsePrice(el?.getAttribute('content') ?? el?.textContent);
  if (price === undefined) return undefined;
  const currency = doc.querySelector('[itemprop="priceCurrency"]')?.getAttribute('content') ?? undefined;
  const name = doc.querySelector('[itemtype*="schema.org/Product"] [itemprop="name"]')?.textContent?.trim() || undefined;
  return { price, currency, name, via: 'microdata' };
}

function fromMeta(doc: Document): PriceInfo | undefined {
  const meta = (p: string) => doc.querySelector(`meta[property="${p}"], meta[name="${p}"]`)?.getAttribute('content') ?? undefined;
  const price = parsePrice(meta('product:price:amount') ?? meta('og:price:amount'));
  if (price === undefined) return undefined;
  return { price, currency: meta('product:price:currency') ?? meta('og:price:currency'), name: meta('og:title'), via: 'meta' };
}

/** The product price a page declares, or undefined if it doesn't publish one. */
export function extractPrice(doc: Document): PriceInfo | undefined {
  return fromJsonLd(doc) ?? fromMicrodata(doc) ?? fromMeta(doc);
}
