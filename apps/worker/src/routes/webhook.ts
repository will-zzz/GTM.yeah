import { Hono } from "hono";
import { insertLead } from "../db";
import { AppError } from "../lib/errors";
import { newId } from "../lib/ids";
import { logError } from "../lib/logger";
import { chaosMiddleware } from "../lib/resilience";
import { generateCroakScore } from "../services/croakscore";
import { sendSlackAlert } from "../services/slack";
import { validateHandoff, type NormalizedLead } from "../services/validation";
import type { ApiResponse, AttioWebhookPayload, HonoEnv, Lead } from "../types";

const webhook = new Hono<HonoEnv>();

const WARNING_TTL_SECONDS = 300;
const ENDPOINT = "/api/webhook/attio";

function baseLead(id: string, n: NormalizedLead, payload: unknown, now: string): Lead {
  return {
    id,
    attioRecordId: n.attioRecordId,
    companyName: n.companyName,
    domain: n.domain,
    entityType: n.entityType,
    primaryContactName: n.primaryContactName,
    primaryContactEmail: n.primaryContactEmail,
    hasFinancialHistory: n.hasFinancialHistory,
    status: "Stuck in Tadpole Stage",
    missingFields: [],
    croakScore: null,
    priority: null,
    pitchHook: null,
    rawPayload: payload,
    createdAt: now,
    updatedAt: now,
  };
}

// The Tadpole-to-Frog Handoff Ingestor. Opted into chaos (inbound webhook drops).
webhook.post("/api/webhook/attio", chaosMiddleware, async (c) => {
  const rid = c.get("requestId");

  let payload: AttioWebhookPayload;
  try {
    payload = await c.req.json<AttioWebhookPayload>();
  } catch {
    throw new AppError("ValidationError", "Malformed JSON body", {
      severity: "warning",
      status: 400,
    });
  }

  const now = new Date().toISOString();
  const id = newId("lead");
  const { valid, missingFields, normalized } = validateHandoff(payload);

  // ---- Stuck in Tadpole Stage: a valid business outcome, not a 500 ----
  if (!valid) {
    const lead = baseLead(id, normalized, payload, now);
    lead.status = "Stuck in Tadpole Stage";
    lead.missingFields = missingFields;
    await insertLead(c.env, lead);

    const warning = `Stuck in Tadpole Stage — missing: ${missingFields.join(", ")}`;
    await c.env.CACHE.put(`warning:lead:${id}`, warning, {
      expirationTtl: WARNING_TTL_SECONDS,
    });

    await logError(c.env, {
      requestId: rid,
      endpoint: ENDPOINT,
      errorType: "ValidationError",
      severity: "warning",
      message: warning,
      context: { missingFields, company: lead.companyName },
      leadId: id,
    });

    const body: ApiResponse<{ lead: Lead; warning: string }> = {
      ok: true,
      data: { lead, warning },
    };
    return c.json(body);
  }

  // ---- Ready for CPA: enrich (CroakScore), persist, then alert ----
  const croak = await generateCroakScore(c.env, {
    companyName: normalized.companyName,
    domain: normalized.domain,
  });

  const lead = baseLead(id, normalized, payload, now);
  lead.status = "Ready for CPA";
  lead.croakScore = croak.croakScore;
  lead.priority = croak.priority;
  lead.pitchHook = croak.pitchHook;
  await insertLead(c.env, lead);

  // Outbound alert can fail (chaos / upstream). Trap it: the lead is already
  // saved, so we degrade gracefully instead of failing the whole request.
  let degraded = false;
  let degradedReason: string | undefined;
  try {
    await sendSlackAlert(c.env, { lead });
  } catch (e) {
    degraded = true;
    degradedReason = e instanceof Error ? e.message : String(e);
    await logError(c.env, {
      requestId: rid,
      endpoint: ENDPOINT,
      errorType: e instanceof AppError ? e.errorType : "UpstreamError",
      severity: "warning",
      message: `Lead saved but Slack alert failed: ${degradedReason}`,
      context: { leadId: id, company: lead.companyName },
      leadId: id,
    });
  }

  const body: ApiResponse<{
    lead: Lead;
    degraded: boolean;
    degradedReason?: string;
  }> = {
    ok: true,
    data: { lead, degraded, degradedReason },
  };
  return c.json(body);
});

export default webhook;
