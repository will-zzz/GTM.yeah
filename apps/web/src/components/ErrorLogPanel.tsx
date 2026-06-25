import { useEffect, useState } from "react";
import { getErrors } from "../api";
import type { Severity, SystemErrorLog } from "../types";

const POLL_MS = 3000;

function severityClass(severity: Severity) {
  return `severity-${severity}`;
}

function severityBadge(severity: Severity) {
  const colors: Record<Severity, string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    error: "bg-red-50 text-red-800 border-red-200",
    critical: "bg-purple-50 text-purple-900 border-purple-200",
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
    <div className="card h-full flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Error Log</h2>
        <span className="text-[11px] rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-px">
          {errors.length} entries
        </span>
      </div>

      {fetchError && (
        <div className="mx-3 mt-2 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
          {fetchError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[520px]">
        {errors.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-8">
            No errors logged yet.
          </p>
        ) : (
          errors.map((entry) => {
            const isOpen = expanded === entry.id;
            return (
              <div
                key={entry.id}
                className={`rounded-sm bg-zinc-50 border border-zinc-200 pl-2 pr-2 py-1.5 ${severityClass(entry.severity)}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-1 py-px rounded-sm border ${severityBadge(entry.severity)}`}
                    >
                      {entry.severity}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {entry.errorType}
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-auto">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 leading-snug">{entry.message}</p>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {entry.endpoint} · req {entry.requestId}
                  </p>
                </button>
                {isOpen && (
                  <pre className="mt-1.5 text-[10px] font-mono bg-white border border-zinc-200 rounded-sm p-1.5 overflow-x-auto">
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
