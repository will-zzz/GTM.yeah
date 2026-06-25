import { useState } from "react";
import { toggleFlakiness } from "../api";

interface Props {
  flakiness: boolean;
  onChange: (next: boolean) => void;
}

export default function FlakinessToggle({ flakiness, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      const { flakiness: next } = await toggleFlakiness(!flakiness);
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`card p-3 transition-colors ${
        flakiness ? "panel-chaos-on" : "panel-chaos-off"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-70 font-medium">
            System Resilience
          </p>
          <h2 className="text-sm font-semibold mt-0.5">
            {flakiness ? "Chaos mode enabled" : "Normal operation"}
          </h2>
          <p className="text-xs opacity-80 mt-1">
            {flakiness
              ? "~50% of inbound webhooks and outbound Slack alerts will fail by design."
              : "All requests flow normally. Enable chaos to demo error handling."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleToggle}
          className={`shrink-0 rounded-sm px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 border ${
            flakiness
              ? "bg-amber-400 text-zinc-900 border-amber-500 hover:bg-amber-300"
              : "bg-brand text-white border-brand hover:bg-brand-dark"
          }`}
        >
          {busy ? "Updating…" : flakiness ? "Disable chaos" : "Enable chaos"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs rounded-sm bg-red-50 text-red-800 border border-red-200 px-2 py-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
