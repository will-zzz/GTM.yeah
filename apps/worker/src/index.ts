import { Hono } from "hono";
import { cors } from "hono/cors";

export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  AI?: Ai;
  ENVIRONMENT: string;
  USE_REAL_AI: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

// Phase 0 stub — replaced with full status payload in Phase 2.
app.get("/api/system/status", (c) => {
  return c.json({ ok: true, environment: c.env.ENVIRONMENT });
});

export default app;
