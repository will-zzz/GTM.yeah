import type { AttioWebhookPayload } from "../types";

export interface NormalizedLead {
  attioRecordId: string | null;
  companyName: string;
  domain: string | null;
  entityType: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  hasFinancialHistory: boolean;
}

export interface ValidationResult {
  valid: boolean;
  missingFields: string[]; // human-readable labels
  normalized: NormalizedLead;
}

const clean = (v: string | undefined | null): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

/**
 * Strict handoff validation. A lead is "Ready for CPA" only when Company Name,
 * Entity Type, a complete Primary Contact (name + email), and Financial History
 * are all present. Otherwise it is marked Incomplete with missingFields populated.
 */
export function validateHandoff(payload: AttioWebhookPayload): ValidationResult {
  const record = payload?.record ?? {};
  const missingFields: string[] = [];

  const companyName = clean(record.companyName);
  if (!companyName) missingFields.push("Company Name");

  const entityType = clean(record.entityType);
  if (!entityType) missingFields.push("Entity Type");

  const primaryContactName = clean(record.primaryContact?.name);
  const primaryContactEmail = clean(record.primaryContact?.email);
  if (!primaryContactName || !primaryContactEmail) {
    missingFields.push("Primary Contact");
  }

  const hasFinancialHistory = record.financialHistory === true;
  if (!hasFinancialHistory) missingFields.push("Financial History");

  return {
    valid: missingFields.length === 0,
    missingFields,
    normalized: {
      attioRecordId: clean(record.id),
      companyName: companyName ?? "Unknown Company",
      domain: clean(record.domain),
      entityType,
      primaryContactName,
      primaryContactEmail,
      hasFinancialHistory,
    },
  };
}
