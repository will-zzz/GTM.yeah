import type {
  ApiResponse,
  AttioWebhookPayload,
  DiscoverProspectsResult,
  Lead,
  Prospect,
  SequenceProspectsResult,
  SystemErrorLog,
  SystemStatus,
  WebhookSuccess,
} from "./types";

class ApiClientError extends Error {
  readonly type: string;
  readonly requestId: string;

  constructor(type: string, message: string, requestId: string) {
    super(message);
    this.name = "ApiClientError";
    this.type = type;
    this.requestId = requestId;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiClientError(
      "UnhandledError",
      `Invalid JSON response (HTTP ${res.status})`,
      "unknown",
    );
  }
}

export async function getStatus(): Promise<SystemStatus> {
  const res = await fetch("/api/system/status");
  const body = await parseJson<SystemStatus>(res);
  if (!res.ok || !body.ok) {
    throw new ApiClientError(
      "UnhandledError",
      "Failed to fetch system status",
      "unknown",
    );
  }
  return body;
}

export async function getLeads(): Promise<Lead[]> {
  const res = await fetch("/api/leads");
  const body = await parseJson<ApiResponse<Lead[]>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to fetch leads",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export async function getErrors(): Promise<SystemErrorLog[]> {
  const res = await fetch("/api/errors");
  const body = await parseJson<ApiResponse<SystemErrorLog[]>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to fetch errors",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export async function fireWebhook(
  payload: AttioWebhookPayload,
): Promise<ApiResponse<WebhookSuccess>> {
  const res = await fetch("/api/webhook/attio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ApiResponse<WebhookSuccess>>(res);
}

export async function toggleFlakiness(
  on?: boolean,
): Promise<{ flakiness: boolean }> {
  const res = await fetch("/api/toggle-flakiness", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(on === undefined ? {} : { on }),
  });
  const body = await parseJson<ApiResponse<{ flakiness: boolean }>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to toggle flakiness",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export async function resetDemoData(): Promise<{ warningsCleared: number }> {
  const res = await fetch("/api/dev/reset", { method: "POST" });
  const body = await parseJson<ApiResponse<{ warningsCleared: number }>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to reset data",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export async function getProspects(): Promise<Prospect[]> {
  const res = await fetch("/api/prospects");
  const body = await parseJson<ApiResponse<Prospect[]>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to fetch prospects",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export async function discoverProspects(): Promise<DiscoverProspectsResult> {
  const res = await fetch("/api/prospects/discover", { method: "POST" });
  const body = await parseJson<ApiResponse<DiscoverProspectsResult>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to discover prospects",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export async function sequenceProspects(
  ids: string[],
): Promise<SequenceProspectsResult> {
  const res = await fetch("/api/prospects/sequence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const body = await parseJson<ApiResponse<SequenceProspectsResult>>(res);
  if (!body.ok || !body.data) {
    throw new ApiClientError(
      body.error?.type ?? "UnhandledError",
      body.error?.message ?? "Failed to sequence prospects",
      body.error?.requestId ?? "unknown",
    );
  }
  return body.data;
}

export { ApiClientError };
