import { insertErrorLog } from "../db";
import type { Env, ErrorType, Severity, SystemErrorLog } from "../types";
import { newId } from "./ids";

export interface LogErrorInput {
  requestId: string;
  endpoint: string;
  errorType: ErrorType;
  severity: Severity;
  message: string;
  context?: Record<string, unknown>;
  leadId?: string | null;
}

/**
 * Persists a structured error to D1 and emits a one-line structured JSON log to
 * the terminal. Logging must never throw — if the D1 write fails we still emit
 * to console so a logging fault can never mask the original error.
 */
export async function logError(
  env: Env,
  input: LogErrorInput,
): Promise<SystemErrorLog> {
  const entry: SystemErrorLog = {
    id: newId("err"),
    requestId: input.requestId,
    endpoint: input.endpoint,
    errorType: input.errorType,
    severity: input.severity,
    message: input.message,
    context: input.context ?? {},
    leadId: input.leadId ?? null,
    createdAt: new Date().toISOString(),
  };

  // One-line structured log for terminal visibility during the demo.
  console.error(
    JSON.stringify({
      level: entry.severity,
      type: entry.errorType,
      requestId: entry.requestId,
      endpoint: entry.endpoint,
      message: entry.message,
      ...entry.context,
    }),
  );

  try {
    await insertErrorLog(env, entry);
  } catch (e) {
    console.error(
      JSON.stringify({
        level: "critical",
        type: "LoggerFailure",
        message: "Failed to persist error log to D1",
        cause: e instanceof Error ? e.message : String(e),
      }),
    );
  }

  return entry;
}
