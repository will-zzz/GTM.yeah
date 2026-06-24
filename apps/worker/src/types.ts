// ---- Cloudflare bindings ----
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  AI?: Ai;
  ENVIRONMENT: string;
  USE_REAL_AI: string;
}

// ---- Handoff status (the Tadpole -> Frog lifecycle) ----
export type HandoffStatus =
  | "Ready for CPA" // validated frog 🐸
  | "Stuck in Tadpole Stage"; // missing required data 🐛

export type Priority = "High" | "Medium" | "Low";

// ---- Lead (the core domain entity) ----
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
  missingFields: string[]; // e.g. ["Primary Contact", "Financial History"]
  croakScore: number | null; // 0-100
  priority: Priority | null;
  pitchHook: string | null; // 1-sentence sales hook from the LLM
  rawPayload: unknown; // original Attio webhook body
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

// ---- Structured error log ----
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
  context: Record<string, unknown>; // structured, JSON-serializable
  leadId: string | null;
  createdAt: string;
}

// ---- The CroakScore enrichment result ----
export interface CroakScoreResult {
  croakScore: number; // 0-100
  priority: Priority;
  pitchHook: string;
}

// ---- Incoming Attio webhook payload (mock shape) ----
export interface AttioWebhookPayload {
  event: string; // expect "deal.closed_won"
  record: {
    id?: string;
    companyName?: string;
    domain?: string;
    entityType?: string; // e.g. "LLC", "C-Corp", "Sole Proprietor"
    primaryContact?: { name?: string; email?: string };
    financialHistory?: boolean; // does the deal include financial history?
  };
}

// ---- Standard API envelope (consistent UI error boundaries) ----
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: { type: ErrorType; message: string; requestId: string };
}
