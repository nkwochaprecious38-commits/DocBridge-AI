"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryButton({ id, small }: { id: string; small?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button className={`btn-secondary ${small ? "btn-sm" : ""}`} disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        const r = await fetch(`/api/app/documents/${id}/process`, { method: "POST" });
        const j = await r.json().catch(() => ({}));
        setBusy(false);
        if (!r.ok) setErr(j.error ?? "Processing failed again");
        router.refresh();
      }}>{busy ? "Retrying" : "Retry Processing"}</button>
      {err && <span role="alert" className="text-xs text-red-600">{err}</span>}
    </span>
  );
}
