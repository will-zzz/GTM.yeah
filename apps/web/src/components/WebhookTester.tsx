import { useState } from "react";
import { fireWebhook } from "../api";
import { SAMPLE_PAYLOADS } from "../lib/samplePayloads";
import type { ApiResponse, WebhookSuccess } from "../types";

interface Props {
  onFired?: () => void;
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
    <div className="card p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Attio Webhook Tester
      </h2>
      <p className="text-sm text-muted mb-4">
        Fire sample closed-won payloads at{" "}
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
          POST /api/webhook/attio
        </code>
      </p>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_PAYLOADS.map(({ label, payload }) => (
          <button
            key={label}
            type="button"
            disabled={busy !== null}
            onClick={() => handleFire(label, payload)}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            {busy === label ? "Sending…" : label}
          </button>
        ))}
      </div>

      {lastResponse && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                lastResponse.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {lastResponse.ok ? "Success" : "Error"}
            </span>
            {!lastResponse.ok && lastResponse.error && (
              <span className="text-xs text-red-700">
                {lastResponse.error.type} · req {lastResponse.error.requestId}
              </span>
            )}
          </div>

          {!lastResponse.ok && lastResponse.error && (
            <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {lastResponse.error.message}
            </div>
          )}

          {lastResponse.ok && lastResponse.data && "degraded" in lastResponse.data && lastResponse.data.degraded && (
            <div className="mb-2 rounded-lg chip-degraded px-3 py-2 text-sm">
              Lead saved, but Slack alert failed:{" "}
              {lastResponse.data.degradedReason ?? "upstream error"}
            </div>
          )}

          {lastResponse.ok && lastResponse.data && "warning" in lastResponse.data && (
            <div className="mb-2 rounded-lg chip-missing px-3 py-2 text-sm">
              {lastResponse.data.warning}
            </div>
          )}

          <pre className="text-xs font-mono bg-slate-100 rounded-lg p-3 overflow-x-auto max-h-48 text-slate-800">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
