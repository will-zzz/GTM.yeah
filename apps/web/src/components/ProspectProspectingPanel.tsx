import { useCallback, useEffect, useMemo, useState } from "react";
import { discoverProspects, getProspects, sequenceProspects } from "../api";
import { useClientPagination } from "../lib/useClientPagination";
import type { Prospect } from "../types";
import PaginationBar from "./PaginationBar";

const POLL_MS = 5000;
const PAGE_SIZE = 8;

function growthTier(growth: number): "high" | "medium" | "low" {
  if (growth >= 40) return "high";
  if (growth >= 20) return "medium";
  return "low";
}

function growthChipClass(tier: ReturnType<typeof growthTier>): string {
  switch (tier) {
    case "high":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "medium":
      return "bg-amber-50 text-amber-900 border-amber-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function formatGrowth(growth: number): string {
  return `+${growth.toFixed(1)}% HC`;
}

function formatContactedAt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function matchesProspect(prospect: Prospect, query: string): boolean {
  return (
    prospect.companyName.toLowerCase().includes(query) ||
    prospect.domain.toLowerCase().includes(query) ||
    prospect.techStack.toLowerCase().includes(query) ||
    prospect.sequenceStatus.toLowerCase().includes(query)
  );
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

  const filterFn = useCallback(
    (prospect: Prospect, query: string) => matchesProspect(prospect, query),
    [],
  );

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
  } = useClientPagination(prospects, filterFn, PAGE_SIZE);

  const unassignedOnPage = useMemo(
    () => pageItems.filter((p) => p.sequenceStatus === "Unassigned"),
    [pageItems],
  );

  const selectableOnPageIds = useMemo(
    () => unassignedOnPage.map((p) => p.id),
    [unassignedOnPage],
  );

  const allPageSelected =
    selectableOnPageIds.length > 0 &&
    selectableOnPageIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageAll() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableOnPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableOnPageIds.forEach((id) => next.add(id));
        return next;
      });
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
    <div className="space-y-4">
      <div className="card p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
              Prospect Discovery Engine
            </p>
            <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">
              Pre-Sales Outbound
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
              Harmonic growth signals and Apollo technographics, sequenced via
              Instantly.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={discovering}
              onClick={handleDiscover}
              className="rounded-sm bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition"
            >
              {discovering ? "Discovering…" : "Run discovery"}
            </button>
            <button
              type="button"
              disabled={sequencing || selected.size === 0}
              onClick={handleSequence}
              className="rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              {sequencing
                ? "Sequencing…"
                : `Add to Instantly (${selected.size})`}
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-2 text-xs rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1.5">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-2 text-xs rounded-sm bg-red-50 text-red-800 border border-red-200 px-2 py-1.5">
            {error}
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Discovered accounts</h3>
          <span className="text-xs text-zinc-500">{total} entries · 5s refresh</span>
        </div>

        <div className="px-3 py-2 border-b border-zinc-200 bg-zinc-50/50">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies or tech stacks…"
            className="input-field w-full max-w-md px-2.5 py-1.5"
          />
        </div>

        {loading && prospects.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-10">Loading prospects…</p>
        ) : total === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-10">
            {query
              ? "No matches for your search."
              : "No prospects yet — run discovery to populate the grid."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-[10px] uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
                    <th className="px-3 py-2 w-9">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={togglePageAll}
                        disabled={selectableOnPageIds.length === 0}
                        aria-label="Select all unassigned on this page"
                        className="rounded-sm border-zinc-300"
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 font-medium">Domain</th>
                    <th className="px-3 py-2 font-medium">Growth</th>
                    <th className="px-3 py-2 font-medium">Tech stack</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Last contacted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {pageItems.map((prospect) => {
                    const tier = growthTier(prospect.headcountGrowth);
                    const isSequenced = prospect.sequenceStatus === "Sequenced";
                    const canSelect = !isSequenced;

                    return (
                      <tr
                        key={prospect.id}
                        className={isSequenced ? "bg-zinc-50/60" : "hover:bg-zinc-50/80"}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(prospect.id)}
                            disabled={!canSelect}
                            onChange={() => toggleOne(prospect.id)}
                            aria-label={`Select ${prospect.companyName}`}
                            className="rounded-sm border-zinc-300 disabled:opacity-40"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-zinc-900">
                          {prospect.companyName}
                        </td>
                        <td className="px-3 py-2 text-zinc-500 font-mono text-xs">
                          {prospect.domain}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-sm border px-1.5 py-px text-[11px] font-medium ${growthChipClass(tier)}`}
                          >
                            {formatGrowth(prospect.headcountGrowth)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-600 max-w-[200px] truncate">
                          {prospect.techStack}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-sm border ${
                              isSequenced
                                ? "bg-brand-light text-brand-dark border-blue-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {prospect.sequenceStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500 whitespace-nowrap">
                          {formatContactedAt(prospect.lastContactedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              total={total}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
