import { useCallback, useEffect, useState } from "react";
import { getStatus } from "./api";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorLogPanel from "./components/ErrorLogPanel";
import FlakinessToggle from "./components/FlakinessToggle";
import LeadBoard from "./components/LeadBoard";
import ResetDataButton from "./components/ResetDataButton";
import WebhookTester from "./components/WebhookTester";
import type { SystemStatus } from "./types";

const STATUS_POLL_MS = 5000;

export default function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [boardKey, setBoardKey] = useState(0);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatus(data);
      setStatusError(null);
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "Worker unreachable");
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const id = window.setInterval(refreshStatus, STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshStatus]);

  function handleWebhookFired() {
    refreshStatus();
    setBoardKey((k) => k + 1);
  }

  function handleReset() {
    refreshStatus();
    setBoardKey((k) => k + 1);
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface">
        <header className="border-b border-border bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                GTM<span className="text-brand">.yeah</span>
              </h1>
              <p className="text-xs text-muted">
                GTM handoff ingestor · Rivet Accounting
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ResetDataButton onReset={handleReset} />
              {statusError ? (
                <span className="text-xs rounded-full bg-red-100 text-red-800 px-3 py-1 font-medium">
                  Worker unreachable
                </span>
              ) : status ? (
                <>
                  <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-medium">
                    {status.environment}
                  </span>
                  <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-3 py-1">
                    {status.leadCount} leads
                  </span>
                  <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-3 py-1">
                    {status.errorCount} errors
                  </span>
                  {status.flakiness && (
                    <span className="text-xs rounded-full bg-amber-100 text-amber-900 px-3 py-1 font-semibold">
                      Chaos enabled
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted">Connecting…</span>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <FlakinessToggle
            flakiness={status?.flakiness ?? false}
            onChange={(next) => {
              setStatus((s) => (s ? { ...s, flakiness: next } : s));
              refreshStatus();
            }}
          />

          <WebhookTester onFired={handleWebhookFired} />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeadBoard key={boardKey} />
            </div>
            <div className="lg:col-span-1">
              <ErrorLogPanel key={boardKey} />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
