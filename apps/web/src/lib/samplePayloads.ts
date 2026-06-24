import type { AttioWebhookPayload } from "../types";

export const VALID_PAYLOAD: AttioWebhookPayload = {
  event: "deal.closed_won",
  record: {
    id: "attio_demo_001",
    companyName: "Northwind Analytics",
    domain: "northwind.io",
    entityType: "LLC",
    primaryContact: { name: "Sarah Chen", email: "sarah@northwind.io" },
    financialHistory: true,
  },
};

export const INVALID_MISSING_CONTACT: AttioWebhookPayload = {
  event: "deal.closed_won",
  record: {
    id: "attio_demo_002",
    companyName: "Summit Retail Group",
    domain: "summitretail.com",
    entityType: "C-Corp",
    financialHistory: true,
  },
};

export const INVALID_MISSING_FINANCIALS: AttioWebhookPayload = {
  event: "deal.closed_won",
  record: {
    id: "attio_demo_003",
    companyName: "Meridian Health Co",
    domain: "meridianhealth.co",
    entityType: "S-Corp",
    primaryContact: { name: "James Ortiz", email: "jortiz@meridianhealth.co" },
    financialHistory: false,
  },
};

export const SAMPLE_PAYLOADS = [
  { label: "Valid — Northwind Analytics", payload: VALID_PAYLOAD },
  { label: "Missing Contact", payload: INVALID_MISSING_CONTACT },
  { label: "Missing Financials", payload: INVALID_MISSING_FINANCIALS },
] as const;
