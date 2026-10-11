// The database. Every claim needs at least one source; keep summaries to what the sources say.
// Company responses are part of the record: include them whenever a source reports one.
import type { Company, Law, Source, Vendor } from './types';

/** When the entries below were last checked against their sources. */
export const REVIEWED = '2026-10-11';

const CR_INSTACART: Source[] = [
  { label: 'News4Jax on the Consumer Reports study', url: 'https://www.news4jax.com/money/2025/12/10/instacarts-ai-enabled-pricing-experiments-may-be-inflating-your-grocery-bill-consumer-reports-finds/' },
  { label: 'azfamily', url: 'https://www.azfamily.com/2025/12/10/consumer-reports-instacarts-experimental-ai-pricing-may-be-inflating-your-bill' },
];

const PALLONE_INQUIRY: Source[] = [
  { label: 'Rep. Pallone\'s announcement', url: 'https://democrats-energycommerce.house.gov/media/press-releases/pallone-launches-surveillance-pricing-inquiry' },
  { label: 'List of the 25 companies', url: 'https://captaincompliance.com/news/pallone-launches-major-surveillance-pricing-inquiry-25-big-retailers-grilled-on-data-driven-personalized-pricing-amid-privacy-reckoning/' },
];

const COMER_LETTERS: Source[] = [
  { label: 'Reuters via WHBL', url: 'https://whbl.com/2026/03/05/us-house-committee-wants-travel-companies-to-answer-questions-on-use-of-ai-for-pricing/' },
  { label: 'Consumer Reports', url: 'https://advocacy.consumerreports.org/press_release/consumer-reports-applauds-the-house-committee-on-oversight-and-government-reform-for-launching-investigation-into-surveillance-pricing/' },
];

/** Evidence shared by every grocer where Consumer Reports caught Instacart price tests. */
function instacartTest(extra: string, response: string) {
  return {
    date: '2025-12',
    kind: 'measured' as const,
    practices: ['price-test' as const],
    title: 'Price tests found on its Instacart listings',
    summary: `Consumer Reports found Instacart price experiments at this retailer among others, with some shoppers seeing identical items up to 23% higher. ${extra}`.trim(),
    response,
    sources: CR_INSTACART,
  };
}

function palloneInquiry() {
  return {
    date: '2026-05-11',
    kind: 'scrutiny' as const,
    practices: ['personal-data' as const],
    title: 'Asked by Congress whether it uses personal data to set prices',
    summary: 'Rep. Frank Pallone, the top Democrat on the House Energy and Commerce Committee, asked 25 large retailers whether they use personal data to charge different prices for the same goods.',
    sources: PALLONE_INQUIRY,
  };
}

function comerLetter() {
  return {
    date: '2026-03-05',
    kind: 'scrutiny' as const,
    practices: ['personal-data' as const],
    title: 'House Oversight Committee demands pricing documents',
    summary: 'Chairman James Comer asked for documents on how its pricing algorithms work, what personal data feeds them and how much money they make.',
    sources: COMER_LETTERS,
  };
}

export const companies: Company[] = [
  {
    id: 'instacart',
    name: 'Instacart',
    sector: 'grocery-delivery',
    status: 'says-stopped',
    statusNote: 'Instacart said in December 2025 it was ending all item price tests. New York\'s Attorney General has asked whether partners can still run them.',
    evidence: [
      {
        date: '2025-12',
        kind: 'measured',
        practices: ['price-test', 'unexplained'],
        title: 'Same items, same store, same time: different prices',
        summary:
          '437 shoppers in four cities put identical items from the same stores in their carts at the same time. 74% of items were offered at more than one price. The gap between highest and lowest averaged 13% and reached 23%; whole baskets differed by about 7%.',
        response: 'Instacart said these were randomized A/B tests run with retailers, not dynamic pricing, and that prices never change in real time.',
        sources: [
          { label: 'ConsumerAffairs on the Consumer Reports / Groundwork study', url: 'https://www.consumeraffairs.com/news/study-found-instacart-showed-different-prices-to-different-shoppers-121025.html' },
          { label: 'NewsChannel 9', url: 'https://newschannel9.com/news/nation-world/instacart-may-be-pricing-same-products-differently-consumer-reports-groundwork-collaborative-study-shows-shopping' },
        ],
      },
      {
        date: '2025-12',
        kind: 'admitted',
        practices: ['price-test'],
        title: 'Instacart confirms price tests and says it will end them',
        summary:
          'After the study, Instacart said it would end all item price tests on its platform and that retailers could no longer use its Eversight tool to run them.',
        sources: [
          { label: 'APH Networks', url: 'https://aphnetworks.com/news/31190-instacart-ends-ai-pricing-tests-showing-different-prices-same-items' },
          { label: 'Consumer Reports', url: 'https://pressroom.consumerreports.org/money/questionable-business-practices/instacart-stops-ai-pricing-experiments-a1176475852/' },
        ],
      },
      {
        date: '2026-01-08',
        kind: 'scrutiny',
        practices: ['personal-data', 'price-test'],
        title: 'New York Attorney General demands records',
        summary:
          'The AG asked for Instacart\'s pricing-test records and said its required notice ("This price was set by an algorithm using your personal data") was hidden behind fine print instead of shown next to prices.',
        sources: [
          { label: 'NY Attorney General press release', url: 'https://ag.ny.gov/press-release/2026/attorney-general-james-demands-answers-instacart-about-algorithmic-pricing' },
          { label: 'The letter (PDF)', url: 'https://ag.ny.gov/sites/default/files/letters/letter-to-instacart-on-pricing-practices-letters-2026.pdf' },
        ],
      },
      {
        date: '2026-03',
        kind: 'scrutiny',
        practices: ['personal-data'],
        title: 'FTC demand and congressional letter',
        summary:
          'Reuters reported an FTC civil investigative demand to Instacart, and the House Oversight Committee wrote to the company about its pricing on March 5, 2026.',
        sources: [{ label: 'Skadden summary', url: 'https://www.skadden.com/insights/publications/2026/03/weighing-the-cost' }],
      },
    ],
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    sector: 'food-delivery',
    status: 'ongoing',
    evidence: [
      {
        date: '2025-11',
        kind: 'admitted',
        practices: ['personal-data', 'location'],
        title: 'New York notice: your data sets fees',
        summary:
          'To comply with New York\'s disclosure law, DoorDash shows a notice explaining that it uses information like your delivery address and past orders to set fees and offer personalized promotions.',
        sources: [
          { label: 'Yahoo News', url: 'https://www.yahoo.com/news/articles/uber-doordash-now-disclose-algorithms-183601969.html' },
          { label: 'TechCrunch', url: 'https://techcrunch.com/2025/11/29/new-york-state-law-takes-aim-at-personalized-pricing/' },
        ],
      },
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    sector: 'rideshare',
    status: 'ongoing',
    evidence: [
      { ...comerLetter(), response: 'Uber said fares depend on location, time and demand.' },
      {
        date: '2025-11',
        kind: 'admitted',
        practices: ['location'],
        title: 'New York notice on Uber Eats',
        summary:
          'Uber Eats added New York\'s required notice that personal data sets prices. Uber says the only personal data involved is location, which the law counts as personal data.',
        response: 'Uber said it "did not consider anything beyond geographic factors and demand in setting prices."',
        sources: [
          { label: 'Yahoo News', url: 'https://www.yahoo.com/news/articles/uber-doordash-now-disclose-algorithms-183601969.html' },
          { label: 'NewsBreak', url: 'https://www.newsbreak.com/the-cool-down-314855763/4896665580935-uber-says-it-doesn-t-personalize-fares-but-new-york-app-says-personal-data-may-set-prices' },
        ],
      },
      {
        date: '2026-06',
        kind: 'measured',
        practices: ['unexplained'],
        title: 'Riders requesting the same trip saw very different fares',
        summary:
          '174 volunteers in 18 states priced the same routes, usually within six minutes of each other and often in the same minute. The median gap between the lowest and highest fare was about 50%. Testers also found many "discounts" measured from inflated starting prices.',
        response: 'Uber said it "does not personalize prices, period," and that the trips differed because marketplace conditions, traffic and GPS position change second by second.',
        sources: [
          { label: 'Consumer Reports press release', url: 'https://www.consumerreports.org/media-room/press-releases/2026/06/consumer-reports-investigation-reveals-uber-and-lyft-ai-driven-pricing-tactics-lead-to-significantly-different-prices/' },
          { label: 'ClickOnDetroit', url: 'https://clickondetroit.com/news/local/2026/06/17/consumer-reports-investigates-how-uber-lyft-use-ai-to-set-what-you-pay' },
        ],
      },
      {
        date: '2026-07-07',
        kind: 'scrutiny',
        practices: ['unexplained'],
        title: 'Consumer Reports asks the FTC to investigate',
        summary: 'Consumer Reports asked the FTC to investigate Uber and Lyft pricing, with a petition signed by 32,330 people.',
        sources: [{ label: 'Letter to the FTC (PDF)', url: 'https://advocacy.consumerreports.org/wp-content/uploads/2026/07/Letter-to-FTC-re-Uber_Lyft-1.pdf' }],
      },
    ],
  },
  {
    id: 'lyft',
    name: 'Lyft',
    sector: 'rideshare',
    status: 'ongoing',
    evidence: [
      comerLetter(),
      {
        date: '2026-06',
        kind: 'measured',
        practices: ['unexplained'],
        title: 'Riders requesting the same trip saw very different fares',
        summary:
          'In the same Consumer Reports test as Uber (174 volunteers, 18 states, near-simultaneous requests), Lyft riders were often quoted very different prices for nearly identical trips.',
        response: 'Lyft disputes the findings and denies setting prices based on who a rider is.',
        sources: [
          { label: 'Consumer Reports press release', url: 'https://www.consumerreports.org/media-room/press-releases/2026/06/consumer-reports-investigation-reveals-uber-and-lyft-ai-driven-pricing-tactics-lead-to-significantly-different-prices/' },
          { label: 'Spectrum News', url: 'https://spectrumlocalnews.com/us/snplus/transportation/2026/06/15/consumer-reports-uber-lyft-fares-fake-discounts' },
        ],
      },
      {
        date: '2026-07-07',
        kind: 'scrutiny',
        practices: ['unexplained'],
        title: 'Consumer Reports asks the FTC to investigate',
        summary: 'Consumer Reports asked the FTC to investigate Uber and Lyft pricing, with a petition signed by 32,330 people.',
        sources: [{ label: 'Letter to the FTC (PDF)', url: 'https://advocacy.consumerreports.org/wp-content/uploads/2026/07/Letter-to-FTC-re-Uber_Lyft-1.pdf' }],
      },
    ],
  },
  {
    id: 'target',
    name: 'Target',
    sector: 'retail',
    status: 'says-stopped',
    statusNote: 'A 2022 settlement bars Target from using location to raise app prices.',
    evidence: [
      {
        date: '2022',
        kind: 'scrutiny',
        practices: ['location'],
        title: '$5 million settlement over location-based app prices',
        summary:
          'Seven California district attorneys said Target\'s app used geofencing to show higher prices once shoppers were at a store, and that registers charged more than advertised prices. Target paid more than $5 million; the settlement bars it from using the technology to raise prices and requires it to say where each advertised price is valid.',
        sources: [
          { label: 'NBC San Diego', url: 'https://nbcsandiego.com/news/local/target-penalized-5m-for-overcharging-customers-on-app/2892313' },
          { label: 'CBS News', url: 'https://www.cbsnews.com/sanfrancisco/news/target-reaches-5m-settlement-with-california-district-attorneys-over-alleged-false-advertising/' },
        ],
      },
      instacartTest('Instacart later said it stopped running experiments for Target.', 'Target told Consumer Reports it has no business relationship with Instacart.'),
      palloneInquiry(),
      {
        date: '2019-02',
        kind: 'measured',
        practices: ['location'],
        title: 'App prices rose once shoppers reached the store',
        summary:
          'A KARE 11 investigation found the Target app switched to higher prices when it detected you in or near a store. A TV went from $499.99 to $599.99 in the parking lot; 4 of 10 products tested went up inside, including a Dyson vacuum (+$148) and a car seat (+$72).',
        response: 'Target said: "The Target app shows in-store pricing while in store, and online pricing while on the go."',
        sources: [
          { label: 'KARE 11', url: 'https://kare11.com/article/money/consumer/how-to-avoid-target-app-parking-lot-price-switch/89-9ef4106a-895d-4522-8a00-c15cff0a0514' },
          { label: 'Bob Sullivan', url: 'https://bobsullivan.net/?p=9957' },
        ],
      },
    ],
  },
  {
    id: 'tinder',
    name: 'Tinder',
    sector: 'dating',
    status: 'says-stopped',
    statusNote: 'Tinder said it would phase out age-based pricing for users 29 and older.',
    evidence: [
      {
        date: '2019',
        kind: 'scrutiny',
        practices: ['age'],
        title: 'Age-pricing class action in California',
        summary:
          'Tinder agreed to a $23 million settlement of a class action over charging older users more. A federal appeals court undid the settlement in 2021; Tinder said it would end its "age-based discounts".',
        sources: [{ label: 'Consumer Reports', url: 'https://www.consumerreports.org/consumer-protection/tinder-is-phasing-out-higher-prices-for-users-ages-29-plus-a3881901881' }],
      },
      {
        date: '2022-02',
        kind: 'measured',
        practices: ['age', 'personal-data'],
        title: 'Users over 30 paid 65% more for Tinder Plus',
        summary:
          'Consumers International and Mozilla tested Tinder Plus prices in six countries (including the US) in 2021. 30 to 49-year-olds were charged 65% more on average than 18 to 29-year-olds. Results for gender and sexual orientation were inconclusive.',
        response: 'Tinder called the report "deeply flawed" and its allegations "completely false and outrageous".',
        sources: [
          { label: 'BuzzFeed News', url: 'https://www.buzzfeednews.com/article/emilybakerwhite/tinder-plus-pricing-study' },
          { label: 'Consumer NZ', url: 'https://published1.consumer.org.nz/articles/over-thirty-you-could-be-paying-more-to-swipe-right' },
        ],
      },
    ],
  },
  {
    id: 'princeton-review',
    name: 'The Princeton Review',
    sector: 'education',
    status: 'unknown',
    evidence: [
      {
        date: '2015-09',
        kind: 'measured',
        practices: ['location'],
        title: 'SAT tutoring priced by ZIP code',
        summary:
          'The same online Premier course cost $6,600 to $8,400 depending on the ZIP code typed in. ProPublica found Asian Americans were nearly twice as likely to be quoted a higher price.',
        response: 'The company said prices reflect costs and local market conditions, and that the effect was unintentional.',
        sources: [
          { label: 'ProPublica', url: 'https://www.propublica.org/article/asians-nearly-twice-as-likely-to-get-higher-price-from-princeton-review' },
          { label: 'NBC News', url: 'https://www.nbcnews.com/news/asian-america/report-princeton-review-s-overcharging-asians-called-tiger-mom-tax-n420401' },
        ],
      },
    ],
  },
  {
    id: 'staples',
    name: 'Staples',
    sector: 'retail',
    status: 'unknown',
    evidence: [
      {
        date: '2012',
        kind: 'measured',
        practices: ['location'],
        title: 'Online prices varied by ZIP code',
        summary:
          'The Wall Street Journal found Staples.com showed different prices by ZIP code, apparently based on distance to a rival store. People in lower-income ZIP codes tended to see the higher prices.',
        sources: [{ label: 'ProPublica (summarizing the WSJ)', url: 'https://www.propublica.org/article/asians-nearly-twice-as-likely-to-get-higher-price-from-princeton-review' }],
      },
    ],
  },
  {
    id: 'home-depot',
    name: 'Home Depot',
    sector: 'retail',
    status: 'unknown',
    evidence: [
      {
        date: '2014-11',
        kind: 'measured',
        practices: ['device', 'steering'],
        title: 'Phone shoppers were shown pricier products',
        summary:
          'Northeastern University researchers found that the same searches returned products averaging $120 on a computer and $230 on a phone.',
        sources: [
          { label: 'Science News', url: 'https://www.sciencenews.org/article/e-commerce-sites-personalize-search-results-maximize-profits' },
          { label: 'The study (PDF)', url: 'https://khoury.northeastern.edu/home/ancsaaa/files/price-ancsa.pdf' },
        ],
      },
    ],
  },
  {
    id: 'travelocity',
    name: 'Travelocity',
    sector: 'travel',
    status: 'unknown',
    evidence: [
      {
        date: '2014-11',
        kind: 'measured',
        practices: ['device'],
        title: 'iPhone users saw cheaper hotels',
        summary:
          'Northeastern University researchers found iPhone users saw about 5% of hotels $15 cheaper than Android users did, and in a different order.',
        sources: [
          { label: 'Science News', url: 'https://www.sciencenews.org/article/e-commerce-sites-personalize-search-results-maximize-profits' },
          { label: 'The study (PDF)', url: 'https://khoury.northeastern.edu/home/ancsaaa/files/price-ancsa.pdf' },
        ],
      },
    ],
  },
  {
    id: 'orbitz',
    name: 'Orbitz',
    sector: 'travel',
    status: 'unknown',
    evidence: [
      {
        date: '2012-06',
        kind: 'admitted',
        practices: ['device', 'steering'],
        title: 'Mac users steered to pricier hotels',
        summary:
          'Orbitz told the Wall Street Journal it was showing different hotel offers to Mac and PC visitors, after finding Mac users spent $20 to $30 more a night.',
        response: 'Orbitz said it does not show the same room to different users at different prices, and that users can sort by price.',
        sources: [
          { label: 'Benton Institute (WSJ headline)', url: 'https://www.benton.org/headlines/orbitz-mac-users-steered-pricier-hotels' },
          { label: 'Christian Science Monitor', url: 'https://csmonitor.com/Business/Donald-Marron/2012/0626/On-Orbitz-Windows-users-directed-to-cheaper-hotels' },
        ],
      },
      {
        date: '2014-11',
        kind: 'measured',
        practices: ['membership'],
        title: 'Logged-in members saw lower prices',
        summary: 'Northeastern University researchers found Orbitz and its sister site CheapTickets showed lower prices to logged-in members than to other visitors.',
        sources: [{ label: 'Science News', url: 'https://www.sciencenews.org/article/e-commerce-sites-personalize-search-results-maximize-profits' }],
      },
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    sector: 'retail',
    status: 'says-stopped',
    statusNote: 'Amazon ended its 2000 test and said future tests would give everyone the lowest test price.',
    evidence: [
      palloneInquiry(),
      {
        date: '2000-09',
        kind: 'admitted',
        practices: ['price-test'],
        title: 'Random DVD price test, then an apology',
        summary:
          'Amazon varied prices on 68 DVDs for different customers over six days. After complaints it called the test a mistake and refunded 6,896 customers an average of $3.10.',
        response: 'Jeff Bezos: "We\'ve never tested and we never will test prices based on customer demographics."',
        sources: [
          { label: 'Amazon statement', url: 'https://press.aboutamazon.com/2000/9/amazon-com-issues-statement-regarding-random-price-testing' },
          { label: 'Computerworld', url: 'https://www.computerworld.com/article/1356061/amazon-apologizes-for-price-testing-program-that-angered-customers.html' },
        ],
      },
    ],
  },
  {
    id: 'delta',
    name: 'Delta Air Lines',
    sector: 'airline',
    status: 'unknown',
    evidence: [
      {
        date: '2025-07',
        kind: 'scrutiny',
        practices: ['personal-data'],
        title: 'Senators question AI-set fares',
        summary:
          'Delta told investors AI from the startup Fetcherr priced about 3% of its domestic fares, aiming for 20%. Three senators wrote warning this could mean individual fares set at each person\'s "pain point".',
        response: 'Delta: "Our ticket pricing never takes into account personal data." Fetcherr said it does not use personally identifiable information.',
        sources: [
          { label: 'Axios', url: 'https://www.axios.com/2025/07/22/delta-ai-ticket-prices-senators' },
          { label: 'NBC News', url: 'https://www.nbcnews.com/business/travel/delta-air-lines-assures-us-lawmakers-will-not-personalize-fares-using-rcna222579' },
        ],
      },
    ],
  },
  {
    id: 'albertsons',
    name: 'Albertsons & Safeway',
    sector: 'grocery',
    status: 'unknown',
    evidence: [
      instacartTest(
        'At a Safeway near Seattle, the same basket cost some shoppers about $114 and others nearly $124.',
        'Safeway did not respond to Consumer Reports.',
      ),
      palloneInquiry(),
    ],
  },
  {
    id: 'costco',
    name: 'Costco',
    sector: 'grocery',
    status: 'says-stopped',
    statusNote: 'Instacart said it stopped running price experiments for Costco.',
    evidence: [instacartTest('', 'Costco did not respond to Consumer Reports.'), palloneInquiry()],
  },
  {
    id: 'sprouts',
    name: 'Sprouts Farmers Market',
    sector: 'grocery',
    status: 'unknown',
    evidence: [instacartTest('', 'Sprouts declined to comment.')],
  },
  {
    id: 'walmart',
    name: 'Walmart',
    sector: 'retail',
    status: 'unknown',
    evidence: [palloneInquiry()],
  },
  {
    id: 'jetblue',
    name: 'JetBlue',
    sector: 'airline',
    status: 'unknown',
    evidence: [
      {
        date: '2026-04',
        kind: 'scrutiny',
        practices: ['personal-data'],
        title: 'Class action and lawmakers\' letter after a "clear your cookies" reply',
        summary:
          'After a passenger complained about a $230 fare jump, JetBlue\'s social media account suggested clearing cache and cookies or using an incognito window. A proposed class action in Brooklyn federal court then accused JetBlue of using trackers and personal data to set fares, and Rep. Greg Casar and Sen. Ruben Gallego asked the airline how it uses personal data in pricing.',
        response: 'JetBlue said the reply was wrong, that fares are not set using cached data or other personal information, and that all customers can buy the same fares.',
        sources: [
          { label: 'Yahoo Finance (Reuters)', url: 'https://finance.yahoo.com/economy/policy/articles/lawsuit-accuses-jetblue-using-customers-132004394.html' },
          { label: 'PYMNTS', url: 'https://www.pymnts.com/travel-payments/2026/lawmakers-question-jetblue-about-surveillance-pricing-allegations/' },
        ],
      },
    ],
  },
  {
    id: 'booking',
    name: 'Booking Holdings',
    sector: 'travel',
    status: 'unknown',
    evidence: [comerLetter()],
  },
  {
    id: 'expedia',
    name: 'Expedia',
    sector: 'travel',
    status: 'unknown',
    evidence: [{ ...comerLetter(), response: 'Expedia said it does not raise prices based on user data or activity.' }],
  },
  {
    id: 'kroger',
    name: 'Kroger',
    sector: 'grocery',
    status: 'unknown',
    evidence: [
      instacartTest('', 'Kroger did not respond to Consumer Reports.'),
      palloneInquiry(),
      {
        date: '2024-08-05',
        kind: 'scrutiny',
        practices: ['personal-data'],
        title: 'Lawmakers question digital shelf tags and cameras',
        summary:
          'Senators Warren and Casey, and later six House members, wrote to Kroger about electronic shelf labels and reported plans for in-store cameras with facial recognition, warning prices could change by demographics.',
        response: 'Kroger said it does "not use facial recognition technology in connection with electronic shelf labels or pricing."',
        sources: [
          { label: 'Grocery Dive', url: 'https://www.grocerydive.com/news/kroger-electronic-shelf-labels-instore-technology-senators-inflation/723939/' },
          { label: 'The Record', url: 'https://therecord.media/kroger-facial-recognition-lawmakers-concerns' },
        ],
      },
    ],
  },
];

const NY_AG_ALERT: Source = {
  label: 'NY Attorney General consumer alert',
  url: 'https://ag.ny.gov/press-release/2025/attorney-general-james-warns-new-yorkers-about-algorithmic-pricing-new-law-takes',
};

const FTC_STUDY: Vendor['sources'] = [
  { label: 'McCarter & English on the FTC findings', url: 'https://www.mccarter.com/insights/ftc-surveillance-pricing-study-finds-personal-data-is-used-to-set-individualized-consumer-prices-and-generate-higher-profits-for-companies/' },
];

/** Companies that sell pricing tools to the apps and stores above. */
export const vendors: Vendor[] = [
  { name: 'Mastercard', note: 'One of six firms whose documents shaped the FTC\'s January 2025 surveillance-pricing findings.', sources: FTC_STUDY },
  { name: 'Accenture', note: 'One of six firms in the FTC\'s January 2025 findings.', sources: FTC_STUDY },
  { name: 'PROS', note: 'One of six firms in the FTC\'s January 2025 findings.', sources: FTC_STUDY },
  { name: 'Bloomreach', note: 'One of six firms in the FTC\'s January 2025 findings.', sources: FTC_STUDY },
  { name: 'Revionics', note: 'One of six firms in the FTC\'s January 2025 findings.', sources: FTC_STUDY },
  { name: 'McKinsey & Co.', note: 'One of six firms in the FTC\'s January 2025 findings.', sources: FTC_STUDY },
  {
    name: 'Eversight',
    note: 'Instacart-owned price-testing tool that retailers used on Instacart until December 2025.',
    sources: [{ label: 'APH Networks', url: 'https://aphnetworks.com/news/31190-instacart-ends-ai-pricing-tests-showing-different-prices-same-items' }],
  },
  {
    name: 'Fetcherr',
    note: 'AI fare-pricing startup used by Delta. Says it does not use personally identifiable information.',
    sources: [{ label: 'Axios', url: 'https://www.axios.com/2025/07/22/delta-ai-ticket-prices-senators' }],
  },
];

export const laws: Law[] = [
  {
    id: 'ny-disclosure',
    jurisdiction: 'New York',
    name: 'Algorithmic Pricing Disclosure Act',
    states: ['NY'],
    covers: 'Most businesses. Insurers, regulated financial firms and some ride and delivery services that price only on location are exempt.',
    kind: 'disclosure',
    stage: 'enacted',
    effective: '2025-11-10',
    summary:
      'Prices set by an algorithm using your personal data must carry the notice "This price was set by an algorithm using your personal data." Up to $1,000 per violation, enforced by the Attorney General.',
    sources: [
      { label: 'Duane Morris', url: 'https://www.duanemorris.com/alerts/new_yorks_algorithmic_pricing_disclosure_act_is_in_effect_0326.html' },
      NY_AG_ALERT,
      { label: 'TechCrunch', url: 'https://techcrunch.com/2025/11/29/new-york-state-law-takes-aim-at-personalized-pricing/' },
    ],
  },
  {
    id: 'md-hb895',
    jurisdiction: 'Maryland',
    name: 'Protection From Predatory Pricing Act (HB 895)',
    states: ['MD'],
    covers: 'Grocery stores of 15,000 sq ft or more and third-party delivery services.',
    kind: 'ban',
    stage: 'enacted',
    signed: '2026-04-28',
    effective: '2026-10-01',
    summary:
      'Grocery stores (15,000 sq ft and up) and third-party delivery services may not use personal data to charge individual shoppers higher food prices. Discounts and loyalty programs are still allowed.',
    sources: [
      { label: 'Hunton', url: 'https://www.hunton.com/privacy-and-cybersecurity-law-blog/maryland-enacts-first-of-its-kind-ban-on-surveillance-pricing-for-grocery-sales' },
      { label: 'Skadden', url: 'https://skadden.com/insights/publications/2026/05/maryland-becomes-the-first-state-to-restrict-surveillance-pricing' },
    ],
  },
  {
    id: 'ct-hb5563',
    jurisdiction: 'Connecticut',
    name: 'HB 5563',
    states: ['CT'],
    covers: 'Retail sellers, including grocery stores, and third-party delivery services.',
    kind: 'ban',
    stage: 'enacted',
    signed: '2026-06-04',
    effective: '2027-07-01',
    summary:
      'Bans charging people different prices based on their personal data, and requires a notice where personal data influences a price. Group discounts (students, veterans, seniors, teachers), voluntary loyalty programs, and differences for location, delivery cost, timing or supply and demand are allowed. Enforced by the Attorney General; consumers can\'t sue under it.',
    sources: [
      { label: 'Consumer Reports on the signing', url: 'https://advocacy.consumerreports.org/press_release/consumer-reports-statement-on-the-signing-of-connecticuts-surveillance-pricing-bill-into-law/' },
      { label: 'EPIC', url: 'https://epic.org/connecticut-is-second-state-to-enact-surveillance-pricing-ban/' },
    ],
  },
  {
    id: 'ny-one-fair-price',
    jurisdiction: 'New York',
    name: 'One Fair Price Act',
    states: ['NY'],
    covers: 'Businesses selling goods or services to New Yorkers. Insurance-regulated companies are exempt.',
    kind: 'ban',
    stage: 'enacted',
    signed: '2026-06-17',
    effective: '2026-12-14',
    summary:
      'Bans using personal data in an algorithm to offer different customers different prices for the same goods or services. Penalties rise to $5,000 for a first violation and $20,000 after that.',
    caveat: 'The signing date comes from secondary sources; the start date is 180 days after signing. Confirm both with the state before relying on them.',
    sources: [
      { label: 'NY Attorney General on passage', url: 'https://ag.ny.gov/press-release/2026/new-yorkers-join-attorney-general-james-celebrating-passage-one-fair-price-act' },
      { label: 'EPIC', url: 'https://epic.org/new-york-becomes-third-state-to-pass-surveillance-pricing-ban/' },
    ],
  },
  {
    id: 'ftc-policy-statement',
    jurisdiction: 'United States (FTC)',
    name: 'Proposed policy statement on personalized pricing',
    states: ['US'],
    covers: 'Businesses nationwide, if adopted.',
    kind: 'guidance',
    stage: 'proposed',
    summary:
      'Voted out for comment on August 19, 2026. Would expect clear disclosure of personalized pricing and the data behind it. Not a ban, and no money penalties on its own. Comments closed September 25, 2026.',
    sources: [
      { label: 'King & Spalding', url: 'https://www.kslaw.com/insights/articles/ftc-proposes-enforcement-framework-for-personalized-pricing%E2%80%9D-amid-growing-federal-and-state-scrutin' },
    ],
  },
];
