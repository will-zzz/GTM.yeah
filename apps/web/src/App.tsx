import { useCallback, useEffect, useState } from "react";
import { getStatus } from "./api";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorLogPanel from "./components/ErrorLogPanel";
import FlakinessToggle from "./components/FlakinessToggle";
import LeadBoard from "./components/LeadBoard";
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <header className="border-b border-frog/10 bg-white/60 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐸</span>
              <div>
                <h1 className="text-xl font-bold text-frog-dark tracking-tight">
                  Ribbit
                </h1>
                <p className="text-xs text-frog/70">
                  GTM Handoff Ingestor · Rivet Accounting
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusError ? (
                <span className="text-xs rounded-full bg-red-100 text-red-800 px-3 py-1 font-medium">
                  Worker unreachable
                </span>
              ) : status ? (
                <>
                  <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-medium">
                    {status.environment}
                  </span>
                  <span className="text-xs rounded-full bg-frog/10 text-frog px-3 py-1">
                    {status.leadCount} leads
                  </span>
                  <span className="text-xs rounded-full bg-frog/10 text-frog px-3 py-1">
                    {status.errorCount} errors
                  </span>
                  {status.flakiness && (
                    <span className="text-xs rounded-full bg-amber-200 text-amber-900 px-3 py-1 font-semibold animate-pulse">
                      ⛈️ chaos ON
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-frog/50">Connecting…</span>
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
