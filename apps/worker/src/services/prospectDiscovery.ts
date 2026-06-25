import type { Prospect } from "../types";

/** Mock Harmonic headcount growth signal (% YoY). Deterministic from domain. */
export function mockHarmonicHeadcountGrowth(domain: string): number {
  let h = 0;
  for (let i = 0; i < domain.length; i++) {
    h = (h * 31 + domain.charCodeAt(i)) >>> 0;
  }
  // 5%–85% growth band for demo variety
  return Math.round(((h % 8000) / 100 + 5) * 10) / 10;
}

const APOLLO_STACKS = [
  "QuickBooks, Stripe, Gusto",
  "Xero, HubSpot, Slack",
  "NetSuite, Salesforce, Zoom",
  "FreshBooks, Rippling, Notion",
  "Sage Intacct, Greenhouse, Figma",
  "Wave, Deel, Linear",
];

/** Mock Apollo technographic enrichment. */
export function mockApolloTechStack(domain: string): string {
  let h = 0;
  for (let i = 0; i < domain.length; i++) {
    h = (h * 17 + domain.charCodeAt(i)) >>> 0;
  }
  return APOLLO_STACKS[h % APOLLO_STACKS.length];
}

/** High-potential domains surfaced by a simulated discovery cron / webhook. */
export const DISCOVERY_CANDIDATES: Pick<Prospect, "companyName" | "domain">[] = [
  { companyName: "LedgerFlow", domain: "ledgerflow.io" },
  { companyName: "FinOps Collective", domain: "finopscollective.com" },
  { companyName: "ClosePilot", domain: "closepilot.co" },
  { companyName: "TaxStack", domain: "taxstack.ai" },
  { companyName: "Bookshelf Pro", domain: "bookshelfpro.com" },
  { companyName: "ReconcileHQ", domain: "reconcilehq.io" },
  { companyName: "AuditTrail Systems", domain: "audittrail.systems" },
  { companyName: "MarginWorks", domain: "marginworks.com" },
];

export function enrichProspectCandidate(
  candidate: Pick<Prospect, "companyName" | "domain">,
): Omit<Prospect, "id" | "createdAt"> {
  return {
    companyName: candidate.companyName,
    domain: candidate.domain,
    headcountGrowth: mockHarmonicHeadcountGrowth(candidate.domain),
    techStack: mockApolloTechStack(candidate.domain),
    lastContactedAt: null,
    sequenceStatus: "Unassigned",
  };
}
