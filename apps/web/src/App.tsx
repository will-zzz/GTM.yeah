import { useEffect, useState } from "react";

type Status = { ok: boolean; environment?: string };

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/system/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ok: false }));
  }, []);

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-emerald-800">🐸 Ribbit</h1>
      <p className="text-emerald-700">GTM Handoff Ingestor</p>
      <div className="rounded-lg bg-white px-4 py-2 shadow text-sm">
        Worker:{" "}
        {status === null ? (
          <span className="text-gray-400">checking…</span>
        ) : status.ok ? (
          <span className="text-emerald-600 font-medium">
            connected ({status.environment})
          </span>
        ) : (
          <span className="text-red-500 font-medium">unreachable</span>
        )}
      </div>
    </div>
  );
}
