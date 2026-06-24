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

  const tadpoles = leads.filter((l) => l.status === "Stuck in Tadpole Stage");
  const frogs = leads.filter((l) => l.status === "Ready for CPA");

  return (
    <div className="lily-pad p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-frog-dark">Handoff Board</h2>
        <span className="text-xs text-frog/60">polls every 3s</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && leads.length === 0 ? (
        <p className="text-sm text-frog/60 text-center py-8">Loading the pond…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section>
            <header className="flex items-center gap-2 mb-3">
              <span className="text-lg">🐛</span>
              <h3 className="font-semibold text-frog-dark">Tadpole Stage</h3>
              <span className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                {tadpoles.length}
              </span>
            </header>
            <div className="space-y-3">
              {tadpoles.length === 0 ? (
                <p className="text-sm text-frog/50 italic py-4 text-center">
                  No stuck leads — nice and tidy.
                </p>
              ) : (
                tadpoles.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </section>

          <section>
            <header className="flex items-center gap-2 mb-3">
              <span className="text-lg">🐸</span>
              <h3 className="font-semibold text-frog-dark">Ready for CPA</h3>
              <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                {frogs.length}
              </span>
            </header>
            <div className="space-y-3">
              {frogs.length === 0 ? (
                <p className="text-sm text-frog/50 italic py-4 text-center">
                  Fire a valid webhook to spawn a frog.
                </p>
              ) : (
                frogs.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
