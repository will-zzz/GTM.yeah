import { useCallback, useEffect, useState } from "react";
import { getLeads } from "../api";
import { useClientPagination } from "../lib/useClientPagination";
import type { Lead } from "../types";
import PaginationBar from "./PaginationBar";

const POLL_MS = 3000;
const PAGE_SIZE = 8;

function matchesLead(lead: Lead, query: string): boolean {
  const haystack = [
    lead.companyName,
    lead.domain ?? "",
    lead.status,
    lead.entityType ?? "",
    lead.primaryContactName ?? "",
    lead.primaryContactEmail ?? "",
    lead.pitchHook ?? "",
    lead.priority ?? "",
    lead.missingFields.join(" "),
    lead.id,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function priorityClass(priority: Lead["priority"]): string {
  switch (priority) {
    case "High":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Medium":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "Low":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-500 border-zinc-200";
  }
}

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

  const filterFn = useCallback(
    (lead: Lead, query: string) => matchesLead(lead, query),
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
  } = useClientPagination(leads, filterFn, PAGE_SIZE);

  const incompleteCount = leads.filter((l) => l.status === "Incomplete").length;
  const readyCount = leads.filter((l) => l.status === "Ready for CPA").length;

  return (
    <div className="card overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Handoff Review</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {incompleteCount} incomplete · {readyCount} ready · 3s refresh
          </p>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-zinc-200 bg-zinc-50/50">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leads…"
          className="input-field w-full max-w-md px-2.5 py-1.5"
        />
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
          {error}
        </div>
      )}

      {loading && leads.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">Loading leads…</p>
      ) : total === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">
          {query
            ? "No leads match your search."
            : "No handoffs yet — fire a webhook to ingest leads."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 text-left text-[10px] uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Validation / Enrichment</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Entity</th>
                  <th className="px-3 py-2 font-medium">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {pageItems.map((lead) => {
                  const isReady = lead.status === "Ready for CPA";

                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50/80 align-top">
                      <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">
                        {lead.companyName}
                      </td>
                      <td className="px-3 py-2 text-zinc-500 font-mono text-xs whitespace-nowrap">
                        {lead.domain ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-sm border ${
                            isReady
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-900 border-amber-200"
                          }`}
                        >
                          {isReady ? "Ready" : "Incomplete"}
                        </span>
                      </td>
                      <td className="px-3 py-2 min-w-[180px] max-w-xs">
                        {isReady ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              {lead.leadScore != null && (
                                <span className="text-[11px] font-medium rounded-sm border border-zinc-200 bg-zinc-100 text-zinc-800 px-1.5 py-px">
                                  Score {lead.leadScore}
                                </span>
                              )}
                              {lead.priority && (
                                <span
                                  className={`text-[11px] font-medium rounded-sm border px-1.5 py-px ${priorityClass(lead.priority)}`}
                                >
                                  {lead.priority}
                                </span>
                              )}
                            </div>
                            {lead.pitchHook && (
                              <p className="text-xs text-zinc-600 line-clamp-2 leading-snug">
                                {lead.pitchHook}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {lead.missingFields.map((field) => (
                              <span
                                key={field}
                                className="chip-missing text-[11px] rounded-sm px-1.5 py-px"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-600 whitespace-nowrap">
                        {lead.primaryContactName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-600 whitespace-nowrap">
                        {lead.entityType ?? "—"}
                      </td>
                      <td
                        className="px-3 py-2 text-[11px] font-mono text-zinc-400 max-w-[100px] truncate"
                        title={lead.id}
                      >
                        {lead.id}
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
  );
}
