"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/AuthParts";

const safe = (t: unknown) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&lt;(\/?)b&gt;/g, "<$1b>");

export function SearchClient({ cats, tags }: { cats: { id: string; name: string }[]; tags: string[] }) {
  const [f, setF] = useState({ query: "", mode: "keyword", category: "", tag: "", from: "", to: "" });
  const [res, setRes] = useState<any[] | null>(null);
  const [meta, setMeta] = useState<{ expanded: string[]; note?: string }>({ expanded: [] });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function go(e: React.FormEvent) {
    e.preventDefault(); if (!f.query.trim()) return;
    setBusy(true); setErr("");
    const r = await fetch("/api/app/search", { method: "POST", body: JSON.stringify(f) }); const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error); setRes(j.results); setMeta({ expanded: j.expanded ?? [], note: j.note });
  }
  return (
    <div className="space-y-5">
      <form onSubmit={go} className="card grid gap-3 p-5 sm:grid-cols-6">
        <div className="sm:col-span-4"><label className="label" htmlFor="sq">Search</label><input id="sq" className="input" value={f.query} onChange={set("query")} placeholder="payment terms, supplier name, renewal" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sm">Mode</label><select id="sm" className="input" value={f.mode} onChange={set("mode")}><option value="keyword">Keyword</option><option value="semantic">Semantic (AI expanded)</option></select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sc">Category</label><select id="sc" className="input" value={f.category} onChange={set("category")}><option value="">All</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="st">Tag</label><select id="st" className="input" value={f.tag} onChange={set("tag")}><option value="">All</option>{tags.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label" htmlFor="sf">From</label><input id="sf" type="date" className="input" value={f.from} onChange={set("from")} /></div>
        <div><label className="label" htmlFor="sto">To</label><input id="sto" type="date" className="input" value={f.to} onChange={set("to")} /></div>
        <div className="sm:col-span-6"><button className="btn-primary" disabled={busy}>{busy ? "Searching" : "Search"}</button></div>
      </form>
      {err && <Alert kind="error">{err}</Alert>}
      {meta.note && <Alert kind="info">{meta.note}</Alert>}
      {meta.expanded.length > 0 && <p className="text-sm text-navy/70">Also searched for: {meta.expanded.join(", ")}</p>}
      {res && (res.length ? <ul className="space-y-3">{res.map((r, i) => (
        <li key={i} className="card p-4"><Link href={`/dashboard/documents/${r.document_id}`} className="font-semibold text-brand">{r.document_name}</Link><span className="ml-2 text-xs text-navy/60">Page {r.page_number}</span>
          <p className="mt-2 text-sm text-navy/80 [&_b]:rounded [&_b]:bg-aqua/40 [&_b]:px-0.5 [&_b]:font-semibold" dangerouslySetInnerHTML={{ __html: safe(r.excerpt) }} /></li>))}</ul>
        : <div className="card p-6 text-sm text-navy/60">No matching pages found.</div>)}
    </div>
  );
}
