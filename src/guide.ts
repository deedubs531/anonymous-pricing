// What people can do about it. Every tip points at cases in data.ts that show why it matters,
// and says plainly where it stops working.
import type { Myth, Scenario, Source, Tip, UsState } from './types';

const NY_AG_ALERT: Source = {
  label: 'NY Attorney General: compare devices and accounts, take screenshots',
  url: 'https://ag.ny.gov/press-release/2025/attorney-general-james-warns-new-yorkers-about-algorithmic-pricing-new-law-takes',
};

export const FTC_REPORT: Source = { label: 'ReportFraud.ftc.gov', url: 'https://reportfraud.ftc.gov/' };

export const tips: Tip[] = [
  {
    id: 'location',
    stage: 'before',
    title: 'Turn off location for shopping apps',
    body: 'Set store apps to "While Using" or "Never" for location, and on iPhone choose "Ask App Not to Track". Check app prices before you head to the store, not in the parking lot.',
    why: [{ company: 'target', text: 'Target\'s app switched to higher prices once it detected shoppers at the store' }],
    caveat: 'Delivery and ride apps need your address, and DoorDash and Uber both say location feeds their prices.',
  },
  {
    id: 'opt-out',
    stage: 'before',
    title: 'Opt out of data sales and turn on Global Privacy Control',
    body: 'Use "Do Not Sell or Share My Personal Information" links, and turn on Global Privacy Control in your browser (built into Firefox and Brave). In the states listed under Your rights, websites must honor it.',
    why: [{ company: 'doordash', text: 'DoorDash says it uses your address and past orders to set fees' }],
    sources: [
      { label: 'FTC findings on the data pricing tools use', url: 'https://www.mccarter.com/insights/ftc-surveillance-pricing-study-finds-personal-data-is-used-to-set-individualized-consumer-prices-and-generate-higher-profits-for-companies/' },
      { label: 'Which states require Global Privacy Control', url: 'https://www.clym.io/blog/what-is-global-privacy-control-the-opt-out-signal-12-us-states-now-require-you-to-honor' },
    ],
    caveat: 'No study yet shows this lowers what you pay. It limits the data available to pricing tools.',
  },
  {
    id: 'address',
    stage: 'before',
    title: 'Notice when a price waits for your ZIP code',
    body: 'If a price only appears after you enter an address or ZIP code, compare it with another address you really use, like work.',
    why: [
      { company: 'princeton-review', text: 'The Princeton Review charged $6,600 to $8,400 for the same course by ZIP code' },
      { company: 'staples', text: 'Staples.com showed different prices by ZIP code' },
    ],
  },
  {
    id: 'second-quote',
    stage: 'during',
    title: 'Get a second quote at the same moment',
    body: 'Ask someone in your household to price the same cart or trip on their phone right then. Screenshot both with the time showing. This is how most cases were caught.',
    why: [
      { company: 'instacart', text: 'Shoppers comparing the same Instacart cart saw item prices up to 23% apart' },
      { company: 'uber', text: 'Riders requesting the same trip saw a median 50% gap between the lowest and highest fare' },
    ],
    sources: [NY_AG_ALERT],
  },
  {
    id: 'device',
    stage: 'during',
    title: 'Check on a different device',
    body: 'Before a big purchase, compare what a phone and a computer show, and an iPhone and an Android if you have both.',
    why: [
      { company: 'home-depot', text: 'Home Depot showed phone shoppers products averaging $230, computer shoppers $120' },
      { company: 'travelocity', text: 'Travelocity showed iPhone users some hotels $15 cheaper' },
    ],
  },
  {
    id: 'logged-in',
    stage: 'during',
    title: 'Compare signed in and signed out',
    body: 'On websites, compare your signed-in price with a private window. It can go either way: members sometimes get the lower price.',
    why: [{ company: 'orbitz', text: 'Orbitz showed logged-in members lower prices' }],
    caveat: 'Doesn\'t work inside apps, which always know who you are.',
  },
  {
    id: 'other-channel',
    stage: 'during',
    title: 'Price it somewhere else',
    body: 'Compare a rival app, the store\'s own website or pickup, or a taxi. Delivery apps often charge more than the store itself.',
    why: [
      { company: 'lyft', text: 'Uber and Lyft fares for the same trip varied widely' },
    ],
    sources: [{ label: 'WGME: Instacart vs in-store prices', url: 'https://wgme.com/news/i-team/price-check-new-report-reveals-big-price-gaps-between-instacart-and-in-store-shopping-maine-inflation-convenience' }],
  },
  {
    id: 'discounts',
    stage: 'during',
    title: 'Don\'t trust crossed-out "was" prices',
    body: 'Judge the price you\'re actually paying, not the discount. Compare it with another app or a second phone instead.',
    why: [{ company: 'uber', text: 'Consumer Reports found many Uber and Lyft "discounts" measured from inflated starting prices' }],
  },
  {
    id: 'wait',
    stage: 'during',
    title: 'For rides, wait a few minutes or move your pickup point',
    body: 'A short wait, or a pickup spot around the corner, can produce a different quote.',
    why: [{ company: 'uber', text: 'Uber itself says fares change second by second with demand, traffic and GPS position' }],
  },
  {
    id: 'ask',
    stage: 'after',
    title: 'Ask for the lower price',
    body: 'If someone else paid less for the same thing at the same time, send support both screenshots and ask for the difference back.',
    why: [{ company: 'amazon', text: 'Amazon refunded 6,896 customers after its DVD price test' }],
    caveat: 'Not guaranteed. Outside the states with bans, companies usually don\'t have to.',
  },
  {
    id: 'ny-notice',
    stage: 'after',
    title: 'In New York, look for the notice',
    body: 'A price set by an algorithm with your personal data must say "This price was set by an algorithm using your personal data." A price gap with no notice may break the law.',
    why: [
      { company: 'doordash', text: 'DoorDash shows the notice and says it uses your address and past orders' },
      { company: 'instacart', text: 'New York\'s Attorney General said Instacart hid its notice in fine print' },
    ],
    caveat: 'Some ride and delivery services that price only on location are exempt.',
    sources: [NY_AG_ALERT],
  },
  {
    id: 'report',
    stage: 'after',
    title: 'Report it',
    body: 'Send your screenshots, with date, time and device, to your state Attorney General\'s consumer protection office and to the FTC. Your rights, below, lists where.',
    why: [{ company: 'instacart', text: 'A Consumer Reports study led New York\'s Attorney General to demand Instacart\'s records' }],
    sources: [FTC_REPORT],
  },
];

export const STAGE_LABELS: Record<Tip['stage'], string> = {
  before: 'Before you shop',
  during: 'Before you pay',
  after: 'After you pay',
};

export const scenarios: Scenario[] = [
  { id: 'delivery', label: 'Ordering groceries or food', tips: ['opt-out', 'second-quote', 'other-channel', 'discounts', 'ny-notice', 'ask', 'report'] },
  { id: 'ride', label: 'Booking a ride', tips: ['second-quote', 'wait', 'other-channel', 'discounts', 'ny-notice', 'report'] },
  { id: 'online', label: 'Shopping online', tips: ['opt-out', 'address', 'device', 'logged-in', 'other-channel', 'ask', 'report'] },
  { id: 'store', label: 'Using a store\'s app', tips: ['location', 'other-channel', 'ask'] },
  { id: 'travel', label: 'Booking travel', tips: ['opt-out', 'device', 'logged-in', 'other-channel'] },
];

export const myths: Myth[] = [
  {
    title: 'Private or incognito browsing',
    body: 'Apps know who you are as soon as you sign in. A private window only helps on websites you can use without an account.',
  },
  {
    title: 'Using a VPN',
    body: 'A VPN changes your apparent location, which changes delivery zones, stores, taxes and demand pricing too. You can\'t tell personalization from ordinary location pricing.',
  },
];

export const states: UsState[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }));

/** States whose privacy laws require websites to honor Global Privacy Control or a similar opt-out signal (as of 2026). */
export const GPC_STATES = ['CA', 'CO', 'CT', 'DE', 'MD', 'MN', 'MT', 'NE', 'NH', 'NJ', 'OR', 'TX'];
export const GPC_SOURCE: Source = {
  label: 'Clym: the 12 states that require it',
  url: 'https://www.clym.io/blog/what-is-global-privacy-control-the-opt-out-signal-12-us-states-now-require-you-to-honor',
};

/** Where to complain. States without their own entry use the directory of attorneys general. */
export const AG_DIRECTORY: Source = { label: 'Find your Attorney General (NAAG)', url: 'https://www.naag.org/find-my-ag/' };
export const complaintOffices: Record<string, Source & { phone?: string }> = {
  NY: { label: 'New York Attorney General', url: 'https://ag.ny.gov/', phone: '1-800-771-7755' },
};
