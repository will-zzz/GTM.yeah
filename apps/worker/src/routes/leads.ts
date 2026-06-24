import { Hono } from "hono";
import { getLead, listLeads } from "../db";
import type { ApiResponse, HonoEnv, Lead } from "../types";

const leads = new Hono<HonoEnv>();

// Read endpoints — intentionally NOT chaos-affected so the dashboard stays usable.
leads.get("/api/leads", async (c) => {
  const data = await listLeads(c.env);
  const res: ApiResponse<Lead[]> = { ok: true, data };
  return c.json(res);
});

leads.get("/api/leads/:id", async (c) => {
  const id = c.req.param("id");
  const lead = await getLead(c.env, id);

  if (!lead) {
    const res: ApiResponse<never> = {
      ok: false,
      error: {
        type: "ValidationError",
        message: `Lead ${id} not found`,
        requestId: c.get("requestId"),
      },
    };
    return c.json(res, 404);
  }

  const warning = await c.env.CACHE.get(`warning:lead:${id}`);
  const res: ApiResponse<{ lead: Lead; warning: string | null }> = {
    ok: true,
    data: { lead, warning },
  };
  return c.json(res);
});

export default leads;
