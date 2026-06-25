import { useCallback, useEffect, useMemo, useState } from "react";
import { discoverProspects, getProspects, sequenceProspects } from "../api";
import type { Prospect } from "../types";

const POLL_MS = 5000;

function growthTier(growth: number): "high" | "medium" | "low" {
  if (growth >= 40) return "high";
  if (growth >= 20) return "medium";
  return "low";
}

function growthChipClass(tier: ReturnType<typeof growthTier>): string {
  switch (tier) {
    case "high":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-900 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatGrowth(growth: number): string {
  return `+${growth.toFixed(1)}% HC`;
}

function formatContactedAt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function ProspectProspectingPanel() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [sequencing, setSequencing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getProspects();
      setProspects(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load prospects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const unassigned = useMemo(
    () => prospects.filter((p) => p.sequenceStatus === "Unassigned"),
    [prospects],
  );

  const selectableIds = useMemo(
    () => unassigned.map((p) => p.id),
    [unassigned],
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  }

  async function handleDiscover() {
    setDiscovering(true);
    setMessage(null);
    setError(null);
    try {
      const result = await discoverProspects();
      setMessage(
        result.discovered.length > 0
          ? `Discovered ${result.discovered.length} account(s) via Harmonic + Apollo${result.skipped ? ` (${result.skipped} already known)` : ""}.`
          : "No new accounts in this batch — run again after reset or when the pool refreshes.",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleSequence() {
    const ids = [...selected];
    if (ids.length === 0) return;

    setSequencing(true);
    setMessage(null);
    setError(null);
    try {
      const result = await sequenceProspects(ids);
      setSelected(new Set());
      setMessage(
        `Queued ${result.sequenced.length} prospect(s) in Instantly${result.notFound.length ? ` (${result.notFound.length} not found)` : ""}.`,
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sequencing failed");
    } finally {
      setSequencing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Prospect Discovery Engine
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Pre-Sales Outbound
            </h2>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Simulates a Harmonic growth-signal webhook and Apollo technographic
              enrichment, then bulk-pushes selected accounts into an Instantly
              email sequence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={discovering}
              onClick={handleDiscover}
              className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 transition"
            >
              {discovering ? "Discovering…" : "Run discovery"}
            </button>
            <button
              type="button"
              disabled={sequencing || selected.size === 0}
              onClick={handleSequence}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {sequencing
                ? "Sequencing…"
                : `Add to Instantly (${selected.size})`}
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-3 text-sm rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm rounded-lg bg-red-50 text-red-800 border border-red-200 px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Discovered accounts</h3>
          <span className="text-xs text-muted">
            {prospects.length} total · refreshes every 5s
          </span>
        </div>

        {loading && prospects.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">Loading prospects…</p>
        ) : prospects.length === 0 ? (
          <p className="text-sm text-muted text-center py-12 italic">
            No prospects yet — click Run discovery to simulate Harmonic + Apollo
            enrichment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={selectableIds.length === 0}
                      aria-label="Select all unassigned prospects"
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Headcount growth</th>
                  <th className="px-4 py-3 font-medium">Tech stack</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last contacted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prospects.map((prospect) => {
                  const tier = growthTier(prospect.headcountGrowth);
                  const isSequenced = prospect.sequenceStatus === "Sequenced";
                  const canSelect = !isSequenced;

                  return (
                    <tr
                      key={prospect.id}
                      className={isSequenced ? "bg-slate-50/80" : "hover:bg-slate-50/50"}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(prospect.id)}
                          disabled={!canSelect}
                          onChange={() => toggleOne(prospect.id)}
                          aria-label={`Select ${prospect.companyName}`}
                          className="rounded border-border disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {prospect.companyName}
                      </td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">
                        {prospect.domain}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${growthChipClass(tier)}`}
                        >
                          {formatGrowth(prospect.headcountGrowth)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                        {prospect.techStack}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                            isSequenced
                              ? "bg-brand-light text-brand-dark"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {prospect.sequenceStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {formatContactedAt(prospect.lastContactedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
