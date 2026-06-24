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
  const isFrog = lead.status === "Ready for CPA";

  return (
    <article className="lily-pad p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-frog-dark">{lead.companyName}</h3>
          {lead.domain && (
            <p className="text-xs text-frog/70">{lead.domain}</p>
          )}
        </div>
        <span className="text-xl shrink-0">{isFrog ? "🐸" : "🐛"}</span>
      </div>

      {isFrog ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-frog text-white text-xs font-bold px-3 py-1">
              CroakScore {lead.croakScore}
            </span>
            {lead.priority && (
              <span
                className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${priorityColor(lead.priority)}`}
              >
                {lead.priority}
              </span>
            )}
          </div>
          {lead.pitchHook && (
            <p className="text-sm text-frog-dark/90 italic leading-relaxed">
              &ldquo;{lead.pitchHook}&rdquo;
            </p>
          )}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-frog/80">
            <dt className="font-medium">Entity</dt>
            <dd>{lead.entityType ?? "—"}</dd>
            <dt className="font-medium">Contact</dt>
            <dd>{lead.primaryContactName ?? "—"}</dd>
          </dl>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-red-800">
            Stuck — missing required handoff data
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.missingFields.map((field) => (
              <span key={field} className="chip-missing text-xs rounded-full px-2.5 py-0.5">
                {field}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] text-frog/50 font-mono truncate" title={lead.id}>
        {lead.id}
      </p>
    </article>
  );
}
