import { useEffect, useState } from "react";
import { getErrors } from "../api";
import type { Severity, SystemErrorLog } from "../types";

const POLL_MS = 3000;

function severityClass(severity: Severity) {
  return `severity-${severity}`;
}

function severityBadge(severity: Severity) {
  const colors: Record<Severity, string> = {
    info: "bg-blue-100 text-blue-800",
    warning: "bg-amber-100 text-amber-900",
    error: "bg-red-100 text-red-800",
    critical: "bg-purple-100 text-purple-900",
  };
  return colors[severity];
}

export default function ErrorLogPanel() {
  const [errors, setErrors] = useState<SystemErrorLog[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await getErrors();
      setErrors(data);
      setFetchError(null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load errors");
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Error Log</h2>
        <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
          {errors.length} entries
        </span>
      </div>

      {fetchError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {fetchError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[520px] pr-1">
        {errors.length === 0 ? (
          <p className="text-sm text-muted italic text-center py-8">
            No errors logged yet.
          </p>
        ) : (
          errors.map((entry) => {
            const isOpen = expanded === entry.id;
            return (
              <div
                key={entry.id}
                className={`rounded-lg bg-slate-50 pl-3 pr-3 py-2 ${severityClass(entry.severity)}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${severityBadge(entry.severity)}`}
                    >
                      {entry.severity}
                    </span>
                    <span className="text-[10px] font-mono text-muted">
                      {entry.errorType}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{entry.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {entry.endpoint} · req {entry.requestId}
                  </p>
                </button>
                {isOpen && (
                  <pre className="mt-2 text-[10px] font-mono bg-slate-100 rounded p-2 overflow-x-auto">
                    {JSON.stringify(entry.context, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
