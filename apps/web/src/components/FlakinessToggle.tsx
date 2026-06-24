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
      className={`lily-pad p-4 transition-all duration-300 ${
        flakiness ? "storm-panel" : "calm-panel"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">
            System Resilience
          </p>
          <h2 className="text-lg font-bold">
            {flakiness ? "⛈️ Storm Mode — Flakiness ON" : "☀️ Calm Pond — Flakiness OFF"}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {flakiness
              ? "~50% of inbound webhooks and outbound Slack alerts will fail by design."
              : "All requests flow normally. Flip to demo bulletproof error handling."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleToggle}
          className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            flakiness
              ? "bg-amber-400 text-storm hover:bg-amber-300"
              : "bg-frog text-white hover:bg-frog-dark"
          }`}
        >
          {busy ? "Toggling…" : flakiness ? "Calm the pond" : "Summon storm"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm rounded-lg bg-red-100 text-red-800 px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
