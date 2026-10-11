// The apps the two-account check covers, and what a fair comparison means for each.

export type AppId = 'uber' | 'lyft' | 'instacart' | 'doordash' | 'ubereats';

export interface AppInfo {
  id: AppId;
  name: string;
  kind: 'ride' | 'order';
  /** The company's mobile website, where both accounts can be signed in at once (one per tab). */
  web: string;
  /** What has to match between the two checks. */
  compare: string;
  /** Longest fair gap between the two checks, in seconds. Ride prices move faster than carts. */
  maxGapSeconds: number;
  /** Words near the price that usually mark the one to compare. */
  keywords: RegExp;
}

export const APPS: AppInfo[] = [
  {
    id: 'uber',
    name: 'Uber',
    kind: 'ride',
    web: 'https://m.uber.com',
    compare: 'The same pickup, drop-off and ride type (for example UberX).',
    maxGapSeconds: 120,
    keywords: /uber\s?x\b|uberx|standard/i,
  },
  {
    id: 'lyft',
    name: 'Lyft',
    kind: 'ride',
    web: 'https://www.lyft.com',
    compare: 'The same pickup, drop-off and ride type (for example Standard).',
    maxGapSeconds: 120,
    keywords: /standard|\blyft\b/i,
  },
  {
    id: 'instacart',
    name: 'Instacart',
    kind: 'order',
    web: 'https://www.instacart.com',
    compare: 'The same store, the same items and the same delivery address. Compare the item subtotal, not fees.',
    maxGapSeconds: 600,
    keywords: /subtotal|items? total/i,
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    kind: 'order',
    web: 'https://www.doordash.com',
    compare: 'The same restaurant or store, the same items and the same address. Compare the subtotal, not fees.',
    maxGapSeconds: 600,
    keywords: /subtotal/i,
  },
  {
    id: 'ubereats',
    name: 'Uber Eats',
    kind: 'order',
    web: 'https://www.ubereats.com',
    compare: 'The same restaurant or store, the same items and the same address. Compare the subtotal, not fees.',
    maxGapSeconds: 600,
    keywords: /subtotal/i,
  },
];

export const appById = (id: string): AppInfo | undefined => APPS.find((a) => a.id === id);
