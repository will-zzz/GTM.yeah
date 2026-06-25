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
    id: "handoff",
    label: "Post-Sales Handoff",
    subtitle: "Attio closed-won ingestor",
  },
  {
    id: "outbound",
    label: "Pre-Sales Outbound",
    subtitle: "Prospect discovery & sequencing",
  },
];

export default function App() {
  const [view, setView] = useState<AppView>("handoff");
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
      <div className="min-h-screen bg-surface">
        <header className="border-b border-border bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                GTM<span className="text-brand">.yeah</span>
              </h1>
              <p className="text-xs text-muted">{activeTab.subtitle}</p>
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

          <nav
            className="max-w-7xl mx-auto px-4 flex gap-1 border-t border-border"
            aria-label="GTM views"
          >
            {VIEW_TABS.map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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

              <div className="grid lg:grid-cols-3 gap-6">
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
