import { Hono } from "hono";
import { countErrorLogs, countLeads } from "../db";
import { getFlakiness, setFlakiness } from "../lib/resilience";
import type { ApiResponse, HonoEnv } from "../types";

const system = new Hono<HonoEnv>();

// Toggle the global "wow factor" resilience flag. Body { on?: boolean }: if
// provided, set explicitly; otherwise flip the current value. NOT chaos-affected.
system.post("/api/toggle-flakiness", async (c) => {
  let requested: boolean | undefined;
  try {
    const body = await c.req.json<{ on?: boolean }>();
    if (typeof body?.on === "boolean") requested = body.on;
  } catch {
    // empty/invalid body -> treat as a toggle
  }

  const next = requested ?? !(await getFlakiness(c.env));
  await setFlakiness(c.env, next);

  const res: ApiResponse<{ flakiness: boolean }> = {
    ok: true,
    data: { flakiness: next },
  };
  return c.json(res);
});

system.get("/api/system/status", async (c) => {
  const [flakiness, leadCount, errorCount] = await Promise.all([
    getFlakiness(c.env),
    countLeads(c.env),
    countErrorLogs(c.env),
  ]);

  return c.json({
    ok: true,
    flakiness,
    environment: c.env.ENVIRONMENT,
    leadCount,
    errorCount,
  });
});

export default system;
