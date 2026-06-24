export type HandoffStatus = "Ready for CPA" | "Incomplete";

export type Priority = "High" | "Medium" | "Low";

export interface Lead {
  id: string;
  attioRecordId: string | null;
  companyName: string;
  domain: string | null;
  entityType: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  hasFinancialHistory: boolean;
  status: HandoffStatus;
  missingFields: string[];
  leadScore: number | null;
  priority: Priority | null;
  pitchHook: string | null;
  rawPayload: unknown;
  createdAt: string;
  updatedAt: string;
}

export type ErrorType =
  | "ValidationError"
  | "ChaosFailure"
  | "UpstreamError"
  | "UnhandledError";

export type Severity = "info" | "warning" | "error" | "critical";

export interface SystemErrorLog {
  id: string;
  requestId: string;
  endpoint: string;
  errorType: ErrorType;
  severity: Severity;
  message: string;
  context: Record<string, unknown>;
  leadId: string | null;
  createdAt: string;
}

export interface AttioWebhookPayload {
  event: string;
  record: {
    id?: string;
    companyName?: string;
    domain?: string;
    entityType?: string;
    primaryContact?: { name?: string; email?: string };
    financialHistory?: boolean;
  };
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: { type: ErrorType; message: string; requestId: string };
}

export interface SystemStatus {
  ok: boolean;
  flakiness: boolean;
  environment: string;
  leadCount: number;
  errorCount: number;
}

export type WebhookSuccess =
  | { lead: Lead; warning: string }
  | { lead: Lead; degraded: boolean; degradedReason?: string };
