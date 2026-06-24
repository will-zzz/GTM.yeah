import type { Lead } from "../types";

interface Props {
  lead: Lead;
}

function priorityColor(priority: Lead["priority"]) {
  switch (priority) {
    case "High":
      return "bg-emerald-600 text-white";
    case "Medium":
      return "bg-amber-500 text-white";
    case "Low":
      return "bg-slate-400 text-white";
    default:
      return "bg-slate-200 text-slate-600";
  }
}

export default function LeadCard({ lead }: Props) {
  const isReady = lead.status === "Ready for CPA";

  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{lead.companyName}</h3>
          {lead.domain && (
            <p className="text-xs text-muted">{lead.domain}</p>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
            isReady
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {isReady ? "Ready" : "Incomplete"}
        </span>
      </div>

      {isReady ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand text-white text-xs font-semibold px-2.5 py-1">
              Lead Score {lead.leadScore}
            </span>
            {lead.priority && (
              <span
                className={`rounded-md text-xs font-semibold px-2 py-0.5 ${priorityColor(lead.priority)}`}
              >
                {lead.priority}
              </span>
            )}
          </div>
          {lead.pitchHook && (
            <p className="text-sm text-slate-700 italic leading-relaxed">
              &ldquo;{lead.pitchHook}&rdquo;
            </p>
          )}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
            <dt className="font-medium text-slate-600">Entity</dt>
            <dd>{lead.entityType ?? "—"}</dd>
            <dt className="font-medium text-slate-600">Contact</dt>
            <dd>{lead.primaryContactName ?? "—"}</dd>
          </dl>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-700">
            Missing required handoff fields
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.missingFields.map((field) => (
              <span key={field} className="chip-missing text-xs rounded-md px-2 py-0.5">
                {field}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] text-slate-400 font-mono truncate" title={lead.id}>
        {lead.id}
      </p>
    </article>
  );
}
