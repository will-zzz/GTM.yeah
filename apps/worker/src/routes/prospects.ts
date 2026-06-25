import { Hono } from "hono";
import {
  getProspect,
  getProspectByDomain,
  insertProspect,
  listProspects,
  updateProspectStatus,
} from "../db";
import { AppError } from "../lib/errors";
import { newId } from "../lib/ids";
import {
  DISCOVERY_CANDIDATES,
  enrichProspectCandidate,
} from "../services/prospectDiscovery";
import type {
  ApiResponse,
  DiscoverProspectsResult,
  HonoEnv,
  Prospect,
  SequenceProspectsResult,
} from "../types";

const prospects = new Hono<HonoEnv>();

const INSTANTLY_CAMPAIGN = "gtm-yeah-outbound-v1";

prospects.get("/api/prospects", async (c) => {
  const data = await listProspects(c.env);
  const res: ApiResponse<Prospect[]> = { ok: true, data };
  return c.json(res);
});

/** Simulates Harmonic + Apollo enrichment from a discovery cron / webhook. */
prospects.post("/api/prospects/discover", async (c) => {
  const now = new Date().toISOString();
  const discovered: Prospect[] = [];
  let skipped = 0;

  // Pick up to 3 new accounts per discovery run (cron-style batch).
  const batchSize = 3;
  let added = 0;

  for (const candidate of DISCOVERY_CANDIDATES) {
    if (added >= batchSize) break;

    const existing = await getProspectByDomain(c.env, candidate.domain);

    if (existing) {
      skipped++;
      continue;
    }

    const enriched = enrichProspectCandidate(candidate);
    const prospect: Prospect = {
      id: newId("prospect"),
      ...enriched,
      createdAt: now,
    };

    await insertProspect(c.env, prospect);
    discovered.push(prospect);
    added++;
  }

  console.log(
    JSON.stringify({
      level: "info",
      type: "ProspectDiscovery",
      source: "harmonic+apollo",
      discovered: discovered.length,
      skipped,
    }),
  );

  const res: ApiResponse<DiscoverProspectsResult> = {
    ok: true,
    data: { discovered, skipped },
  };
  return c.json(res);
});

/** Mocks bulk insertion into Instantly and marks prospects as sequenced. */
prospects.post("/api/prospects/sequence", async (c) => {
  let body: { ids?: unknown };
  try {
    body = await c.req.json<{ ids?: unknown }>();
  } catch {
    throw new AppError("ValidationError", "Malformed JSON body", {
      severity: "warning",
      status: 400,
    });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    throw new AppError("ValidationError", "Body must include a non-empty ids array", {
      severity: "warning",
      status: 400,
    });
  }

  const ids = body.ids.filter((id): id is string => typeof id === "string");
  if (ids.length === 0) {
    throw new AppError("ValidationError", "Each id must be a string", {
      severity: "warning",
      status: 400,
    });
  }

  const now = new Date().toISOString();
  const sequenced: Prospect[] = [];
  const notFound: string[] = [];

  for (const id of ids) {
    const existing = await getProspect(c.env, id);
    if (!existing) {
      notFound.push(id);
      continue;
    }

    if (existing.sequenceStatus === "Sequenced") {
      sequenced.push(existing);
      continue;
    }

    const updated = await updateProspectStatus(c.env, id, "Sequenced", now);
    if (updated) sequenced.push(updated);
  }

  console.log(
    JSON.stringify({
      level: "info",
      type: "InstantlyBulkSequence",
      campaign: INSTANTLY_CAMPAIGN,
      count: sequenced.length,
      notFound: notFound.length,
    }),
  );

  const res: ApiResponse<SequenceProspectsResult> = {
    ok: true,
    data: { sequenced, notFound },
  };
  return c.json(res);
});

export default prospects;
