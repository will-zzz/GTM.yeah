import { Hono } from "hono";
import { listErrorLogs } from "../db";
import type { ApiResponse, HonoEnv, SystemErrorLog } from "../types";

const errors = new Hono<HonoEnv>();

errors.get("/api/errors", async (c) => {
  const data = await listErrorLogs(c.env, 50);
  const res: ApiResponse<SystemErrorLog[]> = { ok: true, data };
  return c.json(res);
});

export default errors;
