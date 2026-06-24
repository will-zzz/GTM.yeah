import { useEffect, useState } from "react";
import { getLeads } from "../api";
import type { Lead } from "../types";
import LeadCard from "./LeadCard";

const POLL_MS = 3000;

export default function LeadBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await getLeads();
      setLeads(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const incomplete = leads.filter((l) => l.status === "Incomplete");
  const ready = leads.filter((l) => l.status === "Ready for CPA");

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Handoff Board</h2>
        <span className="text-xs text-muted">refreshes every 3s</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && leads.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">Loading leads…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section>
            <header className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-slate-900">Incomplete</h3>
              <span className="text-xs rounded-full bg-amber-100 text-amber-900 px-2 py-0.5">
                {incomplete.length}
              </span>
            </header>
            <div className="space-y-3">
              {incomplete.length === 0 ? (
                <p className="text-sm text-muted italic py-4 text-center">
                  No incomplete handoffs.
                </p>
              ) : (
                incomplete.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </section>

          <section>
            <header className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-slate-900">Ready for CPA</h3>
              <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                {ready.length}
              </span>
            </header>
            <div className="space-y-3">
              {ready.length === 0 ? (
                <p className="text-sm text-muted italic py-4 text-center">
                  Fire a valid webhook to create a ready lead.
                </p>
              ) : (
                ready.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
