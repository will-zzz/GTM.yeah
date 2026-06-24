import { useState } from "react";
import { resetDemoData } from "../api";

interface Props {
  onReset?: () => void;
}

export default function ResetDataButton({ onReset }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (
      !window.confirm(
        "Reset all demo data? This clears leads, error logs, and warnings.",
      )
    ) {
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const { warningsCleared } = await resetDemoData();
      setMessage(`Reset complete — ${warningsCleared} warning(s) cleared.`);
      onReset?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={handleReset}
        className="text-xs rounded-lg border border-border bg-white px-3 py-1 font-medium text-muted hover:bg-slate-50 disabled:opacity-50 transition"
        title="Dev only — clears leads, errors, and KV warnings"
      >
        {busy ? "Resetting…" : "Reset data"}
      </button>
      {message && (
        <span className="text-[10px] text-emerald-700">{message}</span>
      )}
      {error && <span className="text-[10px] text-red-700">{error}</span>}
    </div>
  );
}
