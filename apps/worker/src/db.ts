import type {
  CroakScoreResult,
  Env,
  Lead,
  SystemErrorLog,
} from "./types";

// ---- Row shapes as stored in SQLite (snake_case, 0/1 booleans, JSON text) ----
interface LeadRow {
  id: string;
  attio_record_id: string | null;
  company_name: string;
  domain: string | null;
  entity_type: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  has_financial_history: number;
  status: string;
  missing_fields: string;
  croak_score: number | null;
  priority: string | null;
  pitch_hook: string | null;
  raw_payload: string;
  created_at: string;
  updated_at: string;
}

interface ErrorRow {
  id: string;
  request_id: string;
  endpoint: string;
  error_type: string;
  severity: string;
  message: string;
  context: string;
  lead_id: string | null;
  created_at: string;
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    attioRecordId: row.attio_record_id,
    companyName: row.company_name,
    domain: row.domain,
    entityType: row.entity_type,
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    hasFinancialHistory: Boolean(row.has_financial_history),
    status: row.status as Lead["status"],
    missingFields: safeJsonParse<string[]>(row.missing_fields, []),
    croakScore: row.croak_score,
    priority: row.priority as Lead["priority"],
    pitchHook: row.pitch_hook,
    rawPayload: safeJsonParse<unknown>(row.raw_payload, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToError(row: ErrorRow): SystemErrorLog {
  return {
    id: row.id,
    requestId: row.request_id,
    endpoint: row.endpoint,
    errorType: row.error_type as SystemErrorLog["errorType"],
    severity: row.severity as SystemErrorLog["severity"],
    message: row.message,
    context: safeJsonParse<Record<string, unknown>>(row.context, {}),
    leadId: row.lead_id,
    createdAt: row.created_at,
  };
}

// ---- Leads ----

export async function insertLead(env: Env, lead: Lead): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO leads (
       id, attio_record_id, company_name, domain, entity_type,
       primary_contact_name, primary_contact_email, has_financial_history,
       status, missing_fields, croak_score, priority, pitch_hook,
       raw_payload, created_at, updated_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      lead.id,
      lead.attioRecordId,
      lead.companyName,
      lead.domain,
      lead.entityType,
      lead.primaryContactName,
      lead.primaryContactEmail,
      lead.hasFinancialHistory ? 1 : 0,
      lead.status,
      JSON.stringify(lead.missingFields),
      lead.croakScore,
      lead.priority,
      lead.pitchHook,
      JSON.stringify(lead.rawPayload ?? null),
      lead.createdAt,
      lead.updatedAt,
    )
    .run();
}

export async function updateLeadEnrichment(
  env: Env,
  id: string,
  croak: CroakScoreResult,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE leads
       SET croak_score = ?, priority = ?, pitch_hook = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      croak.croakScore,
      croak.priority,
      croak.pitchHook,
      new Date().toISOString(),
      id,
    )
    .run();
}

export async function listLeads(env: Env): Promise<Lead[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM leads ORDER BY created_at DESC`,
  ).all<LeadRow>();
  return (results ?? []).map(mapRowToLead);
}

export async function getLead(env: Env, id: string): Promise<Lead | null> {
  const row = await env.DB.prepare(`SELECT * FROM leads WHERE id = ?`)
    .bind(id)
    .first<LeadRow>();
  return row ? mapRowToLead(row) : null;
}

export async function countLeads(env: Env): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM leads`,
  ).first<{ n: number }>();
  return row?.n ?? 0;
}

// ---- Error logs ----

export async function insertErrorLog(
  env: Env,
  log: SystemErrorLog,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO error_logs (
       id, request_id, endpoint, error_type, severity,
       message, context, lead_id, created_at
     ) VALUES (?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      log.id,
      log.requestId,
      log.endpoint,
      log.errorType,
      log.severity,
      log.message,
      JSON.stringify(log.context),
      log.leadId,
      log.createdAt,
    )
    .run();
}

export async function listErrorLogs(
  env: Env,
  limit = 50,
): Promise<SystemErrorLog[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all<ErrorRow>();
  return (results ?? []).map(mapRowToError);
}

export async function countErrorLogs(env: Env): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM error_logs`,
  ).first<{ n: number }>();
  return row?.n ?? 0;
}
