import { useState } from "react";
import { fireWebhook } from "../api";
import { SAMPLE_PAYLOADS } from "../lib/samplePayloads";
import type { ApiResponse, WebhookSuccess } from "../types";

interface Props {
  onFired?: () => void;
}

function responseSummary(res: ApiResponse<WebhookSuccess>): string {
  if (!res.ok && res.error) {
    return `${res.error.type}: ${res.error.message}`;
  }
  if (!res.ok) return "Request failed";
  if (!res.data) return "Empty response";

  if ("warning" in res.data) {
    return res.data.warning;
  }

  const lead = res.data.lead;
  if ("degraded" in res.data && res.data.degraded) {
    return `Lead saved (${lead.companyName}) — Slack alert failed`;
  }

  return `Lead ingested · ${lead.companyName} · ${lead.status}`;
}

export default function WebhookTester({ onFired }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ApiResponse<WebhookSuccess> | null>(
    null,
  );

  async function handleFire(label: string, payload: (typeof SAMPLE_PAYLOADS)[number]["payload"]) {
    setBusy(label);
    try {
      const res = await fireWebhook(payload);
      setLastResponse(res);
      if (res.ok) onFired?.();
    } catch (e) {
      setLastResponse({
        ok: false,
        error: {
          type: "UnhandledError",
          message: e instanceof Error ? e.message : "Network error",
          requestId: "client",
        },
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-3">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Attio Webhook Tester
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Fire sample closed-won payloads at{" "}
            <code className="font-mono text-[11px] bg-zinc-100 border border-zinc-200 px-1 py-px rounded-sm">
              POST /api/webhook/attio
            </code>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_PAYLOADS.map(({ label, payload }) => (
          <button
            key={label}
            type="button"
            disabled={busy !== null}
            onClick={() => handleFire(label, payload)}
            className="rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
          >
            {busy === label ? "Sending…" : label}
          </button>
        ))}
      </div>

      {lastResponse && (
        <div className="mt-3">
          <div
            className={`flex flex-wrap items-center gap-2 rounded-sm border px-3 py-2 text-sm ${
              lastResponse.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {lastResponse.ok ? "Success" : "Error"}
            </span>
            <span className="text-sm">{responseSummary(lastResponse)}</span>
            {!lastResponse.ok && lastResponse.error && (
              <span className="text-xs font-mono text-red-700 ml-auto">
                req {lastResponse.error.requestId}
              </span>
            )}
          </div>

          {lastResponse.ok && lastResponse.data && "degraded" in lastResponse.data && lastResponse.data.degraded && (
            <p className="mt-2 text-xs chip-degraded rounded-sm px-2 py-1.5">
              {lastResponse.data.degradedReason ?? "Upstream error"}
            </p>
          )}

          <details className="cursor-pointer text-xs text-zinc-500 mt-2 group">
            <summary className="select-none font-medium text-zinc-600 hover:text-zinc-800 list-none flex items-center gap-1">
              <span className="text-zinc-400 group-open:rotate-90 transition-transform inline-block">
                ▸
              </span>
              View Raw Payload Data
            </summary>
            <pre className="mt-2 font-mono text-[11px] bg-zinc-100 border border-zinc-200 rounded-sm p-2 overflow-x-auto max-h-40 text-zinc-800">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
