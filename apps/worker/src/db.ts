import type {
  Env,
  Lead,
  LeadScoreResult,
  Prospect,
  SequenceStatus,
  SystemErrorLog,
} from "./types";

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

interface ProspectRow {
  id: string;
  company_name: string;
  domain: string;
  headcount_growth: number;
  tech_stack: string;
  last_contacted_at: string | null;
  sequence_status: string;
  created_at: string;
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
    leadScore: row.croak_score,
    priority: row.priority as Lead["priority"],
    pitchHook: row.pitch_hook,
    rawPayload: safeJsonParse<unknown>(row.raw_payload, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToProspect(row: ProspectRow): Prospect {
  return {
    id: row.id,
    companyName: row.company_name,
    domain: row.domain,
    headcountGrowth: row.headcount_growth,
    techStack: row.tech_stack,
    lastContactedAt: row.last_contacted_at,
    sequenceStatus: row.sequence_status as SequenceStatus,
    createdAt: row.created_at,
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
      lead.leadScore,
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
  score: LeadScoreResult,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE leads
       SET croak_score = ?, priority = ?, pitch_hook = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      score.leadScore,
      score.priority,
      score.pitchHook,
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

export async function insertProspect(env: Env, prospect: Prospect): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prospects (
       id, company_name, domain, headcount_growth, tech_stack,
       last_contacted_at, sequence_status, created_at
     ) VALUES (?,?,?,?,?,?,?,?)`,
  )
    .bind(
      prospect.id,
      prospect.companyName,
      prospect.domain,
      prospect.headcountGrowth,
      prospect.techStack,
      prospect.lastContactedAt,
      prospect.sequenceStatus,
      prospect.createdAt,
    )
    .run();
}

export async function listProspects(env: Env): Promise<Prospect[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM prospects ORDER BY created_at DESC`,
  ).all<ProspectRow>();
  return (results ?? []).map(mapRowToProspect);
}

export async function getProspectByDomain(
  env: Env,
  domain: string,
): Promise<Prospect | null> {
  const row = await env.DB.prepare(`SELECT * FROM prospects WHERE domain = ?`)
    .bind(domain)
    .first<ProspectRow>();
  return row ? mapRowToProspect(row) : null;
}

export async function getProspect(
  env: Env,
  id: string,
): Promise<Prospect | null> {
  const row = await env.DB.prepare(`SELECT * FROM prospects WHERE id = ?`)
    .bind(id)
    .first<ProspectRow>();
  return row ? mapRowToProspect(row) : null;
}

export async function updateProspectStatus(
  env: Env,
  id: string,
  sequenceStatus: SequenceStatus,
  lastContactedAt: string | null,
): Promise<Prospect | null> {
  await env.DB.prepare(
    `UPDATE prospects
       SET sequence_status = ?, last_contacted_at = ?
     WHERE id = ?`,
  )
    .bind(sequenceStatus, lastContactedAt, id)
    .run();
  return getProspect(env, id);
}

export async function countLeads(env: Env): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM leads`,
  ).first<{ n: number }>();
  return row?.n ?? 0;
}

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

/** Wipes all demo data from D1. Used by the dev-only reset endpoint. */
export async function resetDatabase(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM leads`),
    env.DB.prepare(`DELETE FROM error_logs`),
    env.DB.prepare(`DELETE FROM prospects`),
  ]);
}

export async function clearLeadWarnings(env: Env): Promise<number> {
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const list = await env.CACHE.list({
      prefix: "warning:lead:",
      ...(cursor ? { cursor } : {}),
    });
    await Promise.all(list.keys.map((k) => env.CACHE.delete(k.name)));
    deleted += list.keys.length;
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return deleted;
}
