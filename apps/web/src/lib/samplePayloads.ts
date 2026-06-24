import type { AttioWebhookPayload } from "../types";

export const VALID_PAYLOAD: AttioWebhookPayload = {
  event: "deal.closed_won",
  record: {
    id: "attio_demo_001",
    companyName: "Lily Pad Labs",
    domain: "lilypad.io",
    entityType: "LLC",
    primaryContact: { name: "Kermit", email: "k@lilypad.io" },
    financialHistory: true,
  },
};

export const INVALID_MISSING_CONTACT: AttioWebhookPayload = {
  event: "deal.closed_won",
  record: {
    id: "attio_demo_002",
    companyName: "Bog Inc",
    domain: "boginc.com",
    entityType: "C-Corp",
    financialHistory: true,
  },
};

export const INVALID_MISSING_FINANCIALS: AttioWebhookPayload = {
  event: "deal.closed_won",
  record: {
    id: "attio_demo_003",
    companyName: "Marsh & Co",
    domain: "marsh.co",
    entityType: "S-Corp",
    primaryContact: { name: "Tad", email: "tad@marsh.co" },
    financialHistory: false,
  },
};

export const SAMPLE_PAYLOADS = [
  { label: "Valid — Lily Pad Labs 🐸", payload: VALID_PAYLOAD },
  { label: "Missing Contact 🐛", payload: INVALID_MISSING_CONTACT },
  { label: "Missing Financials 🐛", payload: INVALID_MISSING_FINANCIALS },
] as const;
