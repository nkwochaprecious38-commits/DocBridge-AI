"use client";
import { useState } from "react";
import { Alert } from "@/components/AuthParts";

type Doc = { id: string; name: string };
export function Compare({ docs }: { docs: Doc[] }) {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [out, setOut] = useState<{ result: any; names: string[] } | null>(null);
  async function go() {
    setBusy(true); setErr(""); setOut(null);
    const r = await fetch("/api/app/compare", { method: "POST", body: JSON.stringify({ a, b }) }); const j = await r.json(); setBusy(false);
    if (!r.ok) setErr(j.error); else setOut(j);
  }
  const List = ({ t, items }: { t: string; items?: string[] }) => items?.length ? <div><h4 className="text-xs font-bold uppercase tracking-wide text-teal">{t}</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null;
  return (
    <div className="card p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label className="label" htmlFor="ca">Document A</label><select id="ca" className="input" value={a} onChange={(e) => setA(e.target.value)}><option value="">Select</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="label" htmlFor="cb">Document B</label><select id="cb" className="input" value={b} onChange={(e) => setB(e.target.value)}><option value="">Select</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <button className="btn-primary" disabled={!a || !b || a === b || busy} onClick={go}>{busy ? "Comparing" : "Compare"}</button>
      </div>
      {err && <div className="mt-4"><Alert kind="error">{err}</Alert></div>}
      {out && (
        <div className="mt-5 space-y-4">
          <p className="text-sm">{out.result.summary}</p>
          {out.result.differences?.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-mist"><tr><th className="th">Topic</th><th className="th">{out.names[0]}</th><th className="th">{out.names[1]}</th></tr></thead>
            <tbody className="divide-y divide-navy/10">{out.result.differences.map((d: any, i: number) => <tr key={i}><td className="td font-medium">{d.topic}</td><td className="td">{d.a}{d.a_page ? <span className="text-xs text-navy/50"> (p. {d.a_page})</span> : null}</td><td className="td">{d.b}{d.b_page ? <span className="text-xs text-navy/50"> (p. {d.b_page})</span> : null}</td></tr>)}</tbody></table></div>}
          <div className="grid gap-4 sm:grid-cols-2"><List t="Changed terms" items={out.result.changed_terms} /><List t="Missing in B" items={out.result.missing_in_b} /><List t="Missing in A" items={out.result.missing_in_a} /><List t="Conflicts" items={out.result.conflicts} /><List t="Date changes" items={out.result.date_changes} /><List t="Amount variations" items={out.result.amount_variations} /></div>
          <p className="text-xs text-navy/60">AI generated comparison of the document text. Verify important findings against the source pages.</p>
        </div>)}
    </div>
  );
}
