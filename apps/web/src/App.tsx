import { useCallback, useEffect, useState } from "react";
import { getStatus } from "./api";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorLogPanel from "./components/ErrorLogPanel";
import FlakinessToggle from "./components/FlakinessToggle";
import LeadBoard from "./components/LeadBoard";
import ProspectProspectingPanel from "./components/ProspectProspectingPanel";
import ResetDataButton from "./components/ResetDataButton";
import WebhookTester from "./components/WebhookTester";
import type { AppView, SystemStatus } from "./types";

const STATUS_POLL_MS = 5000;

const VIEW_TABS: { id: AppView; label: string; subtitle: string }[] = [
  {
    id: "outbound",
    label: "Pre-Sales Outbound",
    subtitle: "Prospect discovery & sequencing",
  },
  {
    id: "handoff",
    label: "Post-Sales Handoff (Ingest/Review)",
    subtitle: "Attio closed-won ingestor",
  },
];

export default function App() {
  const [view, setView] = useState<AppView>("outbound");
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

  const activeTab = VIEW_TABS.find((t) => t.id === view) ?? VIEW_TABS[0];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
                GTM<span className="text-brand">.yeah</span>
              </h1>
              <p className="text-xs text-zinc-500">{activeTab.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ResetDataButton onReset={handleReset} />
              {statusError ? (
                <span className="text-xs rounded-sm bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 font-medium">
                  Worker unreachable
                </span>
              ) : status ? (
                <>
                  <span className="text-xs rounded-sm bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 font-medium">
                    {status.environment}
                  </span>
                  <span className="text-xs rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5">
                    {status.leadCount} leads
                  </span>
                  <span className="text-xs rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5">
                    {status.errorCount} errors
                  </span>
                  {status.flakiness && (
                    <span className="text-xs rounded-sm bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 font-semibold">
                      Chaos enabled
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-zinc-500">Connecting…</span>
              )}
            </div>
          </div>

          <nav
            className="max-w-7xl mx-auto px-4 flex gap-0 border-t border-zinc-200"
            aria-label="GTM views"
          >
            {VIEW_TABS.map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                    active
                      ? "border-brand text-zinc-900"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {view === "handoff" ? (
            <>
              <FlakinessToggle
                flakiness={status?.flakiness ?? false}
                onChange={(next) => {
                  setStatus((s) => (s ? { ...s, flakiness: next } : s));
                  refreshStatus();
                }}
              />

              <WebhookTester onFired={handleWebhookFired} />

              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <LeadBoard key={boardKey} />
                </div>
                <div className="lg:col-span-1">
                  <ErrorLogPanel key={boardKey} />
                </div>
              </div>
            </>
          ) : (
            <ProspectProspectingPanel key={boardKey} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
