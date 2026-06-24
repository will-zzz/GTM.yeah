import { Hono } from "hono";
import { clearLeadWarnings, resetDatabase } from "../db";
import { AppError } from "../lib/errors";
import type { ApiResponse, HonoEnv } from "../types";

const dev = new Hono<HonoEnv>();

// Dev-only: wipe leads, error logs, and KV UI warnings for a clean demo slate.
dev.post("/api/dev/reset", async (c) => {
  if (c.env.ENVIRONMENT !== "development") {
    throw new AppError("ValidationError", "Reset is only available in development", {
      severity: "warning",
      status: 403,
    });
  }

  await resetDatabase(c.env);
  const warningsCleared = await clearLeadWarnings(c.env);

  const res: ApiResponse<{ warningsCleared: number }> = {
    ok: true,
    data: { warningsCleared },
  };
  return c.json(res);
});

export default dev;
