// Who Pays More: a sourced list of companies caught (or accused of) charging people different prices.

/** A date as precise as the source allows: "2012", "2025-12" or "2026-01-08". */
export type PartialDate = string;

/**
 * How strong a piece of evidence is.
 * - measured: independent testers saw different prices for the same thing at (nearly) the same time
 * - admitted: the company itself disclosed or admitted varying prices (a legal notice, a statement)
 * - scrutiny: a regulator, lawmaker or lawsuit is looking into it; nothing proven
 */
export type EvidenceKind = 'measured' | 'admitted' | 'scrutiny';

/** What seemed to drive the price difference. */
export type Practice =
  | 'personal-data' // purchase history, address, other data about you
  | 'location' // where you are (ZIP code, inside a store)
  | 'device' // phone vs computer, iPhone vs Android, Mac vs PC
  | 'age'
  | 'membership' // logged in or a member vs not
  | 'price-test' // the company says prices were randomly tested
  | 'steering' // same prices, but pricier options shown first
  | 'unexplained'; // gaps the company attributes to demand, timing or GPS

export type Sector =
  | 'grocery-delivery'
  | 'food-delivery'
  | 'rideshare'
  | 'retail'
  | 'grocery'
  | 'travel'
  | 'airline'
  | 'dating'
  | 'education';

export interface Source {
  label: string;
  url: string;
}

export interface Evidence {
  date: PartialDate;
  kind: EvidenceKind;
  practices: Practice[];
  title: string;
  summary: string;
  /** What the company said back, in its own words where possible. */
  response?: string;
  sources: Source[];
}

/**
 * - ongoing: no sign it has stopped
 * - says-stopped: the company says it ended the practice
 * - unknown: old evidence, current behavior not checked
 */
export type CompanyStatus = 'ongoing' | 'says-stopped' | 'unknown';

export interface Company {
  id: string;
  name: string;
  sector: Sector;
  status: CompanyStatus;
  statusNote?: string;
  evidence: Evidence[];
}

/** A company that sells pricing software to others, named in a regulator's study. */
export interface Vendor {
  name: string;
  note: string;
  sources: Source[];
}

export type LawKind = 'disclosure' | 'ban' | 'guidance';

export interface Law {
  id: string;
  jurisdiction: string;
  name: string;
  kind: LawKind;
  /** Two-letter state codes it applies in, or "US" for federal. */
  states: string[];
  /** Who has to follow it. */
  covers: string;
  /** enacted = signed into law; proposed = still a bill or a draft. */
  stage: 'enacted' | 'proposed';
  signed?: PartialDate;
  effective?: PartialDate;
  summary: string;
  /** Shown when sources disagree or a detail couldn't be confirmed. */
  caveat?: string;
  sources: Source[];
}

/** When in a purchase a tip applies. */
export type Stage = 'before' | 'during' | 'after';

/** A case in the database that shows why a tip matters. */
export interface TipReason {
  company: string; // Company.id
  text: string;
}

export interface Tip {
  id: string;
  stage: Stage;
  title: string;
  body: string;
  why: TipReason[];
  /** Extra backing that isn't a company case (a regulator's advice, a study). */
  sources?: Source[];
  /** Limits of the tip, said plainly. */
  caveat?: string;
}

/** "I'm about to…": a situation and the tips that fit it, in order. */
export interface Scenario {
  id: string;
  label: string;
  tips: string[]; // Tip.id
}

/** Common advice that doesn't help much, and why. */
export interface Myth {
  title: string;
  body: string;
}

export interface UsState {
  code: string;
  name: string;
}
