import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppError } from "./lib/errors";
import { requestId as makeRequestId } from "./lib/ids";
import { logError } from "./lib/logger";
import errors from "./routes/errors";
import dev from "./routes/dev";
import leads from "./routes/leads";
import prospects from "./routes/prospects";
import system from "./routes/system";
import webhook from "./routes/webhook";
import type { ApiResponse, ErrorType, HonoEnv, Severity } from "./types";

const app = new Hono<HonoEnv>();

app.use("/api/*", cors());

// Attach a correlation id to every request so logs + responses line up.
app.use("/api/*", async (c, next) => {
  c.set("requestId", makeRequestId());
  await next();
});

// ---- Routes ----
app.route("/", webhook);
app.route("/", system);
app.route("/", leads);
app.route("/", prospects);
app.route("/", errors);
app.route("/", dev);

/**
 * Global error boundary. Every thrown error funnels through here, gets logged to
 * D1 as a structured SystemErrorLog, and returns a consistent ApiResponse
 * envelope so the frontend never sees an unstructured 500 or a blank body.
 */
app.onError(async (err, c) => {
  const rid = c.get("requestId") ?? makeRequestId();
  const endpoint = new URL(c.req.url).pathname;

  let errorType: ErrorType = "UnhandledError";
  let severity: Severity = "critical";
  let status = 500;
  let context: Record<string, unknown> = {};
  let leadId: string | null = null;

  if (err instanceof AppError) {
    errorType = err.errorType;
    severity = err.severity;
    status = err.status;
    context = err.context;
    leadId = err.leadId;
  } else {
    context = { stack: err instanceof Error ? err.stack : String(err) };
  }

  await logError(c.env, {
    requestId: rid,
    endpoint,
    errorType,
    severity,
    message: err instanceof Error ? err.message : String(err),
    context,
    leadId,
  });

  const body: ApiResponse<never> = {
    ok: false,
    error: {
      type: errorType,
      message: err instanceof Error ? err.message : String(err),
      requestId: rid,
    },
  };

  return c.json(body, status as 500);
});

export default app;
