import type { ErrorType, Severity } from "../types";

/**
 * AppError carries structured metadata so the global onError handler can log it
 * to D1 and return the correct ApiResponse envelope + HTTP status. Anything that
 * isn't an AppError is treated as an UnhandledError (severity critical).
 */
export class AppError extends Error {
  readonly errorType: ErrorType;
  readonly severity: Severity;
  readonly status: number;
  readonly context: Record<string, unknown>;
  readonly leadId: string | null;

  constructor(
    errorType: ErrorType,
    message: string,
    opts: {
      severity?: Severity;
      status?: number;
      context?: Record<string, unknown>;
      leadId?: string | null;
    } = {},
  ) {
    super(message);
    this.name = errorType;
    this.errorType = errorType;
    this.severity = opts.severity ?? "error";
    this.status = opts.status ?? 500;
    this.context = opts.context ?? {};
    this.leadId = opts.leadId ?? null;
  }
}

export class ChaosFailure extends AppError {
  constructor(context: Record<string, unknown> = {}) {
    super("ChaosFailure", "Injected chaos failure (flakiness is ON)", {
      severity: "error",
      status: 503,
      context,
    });
  }
}

export class UpstreamError extends AppError {
  constructor(service: string, context: Record<string, unknown> = {}) {
    super("UpstreamError", `Upstream call to ${service} failed`, {
      severity: "warning",
      status: 502,
      context: { service, ...context },
    });
  }
}
