"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/AuthParts";
import { fmtDateTime } from "@/lib/utils";
import { ChatBox } from "@/components/ChatBox";

type Page = { page_number: number; text: string; confidence: number | null };
type Rec = { id: string; schema_name: string; data: Record<string, unknown>; missing_fields: string[]; status: string };
type Props = {
  doc: { id: string; file_type: string; page_count: number; page_range: string | null; summary: any; ocr_used: boolean; status: string; canWrite: boolean };
  pages: Page[]; records: Rec[]; schemas: { id: string; name: string }[];
  history: { id: string; label: string; status: string; at: string; detail: string }[];
};
const TABS = ["Preview", "Extracted Text", "Structured Data", "AI Summary", "Ask", "Split", "History"] as const;

export function Workspace({ doc, pages, records, schemas, history }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Preview");
  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-navy/10">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 font-heading text-sm font-semibold ${tab === t ? "border-brand text-brand" : "border-transparent text-navy/60 hover:text-navy"}`}>{t}</button>
        ))}
      </div>
      {tab === "Preview" && <Preview doc={doc} />}
      {tab === "Extracted Text" && <TextView pages={pages} ocr={doc.ocr_used} />}
      {tab === "Structured Data" && <Structured doc={doc} records={records} schemas={schemas} />}
      {tab === "AI Summary" && <Summary s={doc.summary} />}
      {tab === "Ask" && <ChatBox documentId={doc.id} placeholder="Ask a question about this document" />}
      {tab === "Split" && <Split doc={doc} pages={pages} />}
      {tab === "History" && (
        <div className="card divide-y divide-navy/10">
          {history.length ? history.map((h) => (
            <div key={h.id} className="p-4 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold">{h.label}</span><span className="text-xs capitalize text-navy/60">{h.status.replace("_", " ")}</span></div>
              <div className="text-xs text-navy/60">{fmtDateTime(h.at)}</div>{h.detail && <div className="mt-1 break-words text-xs text-navy/70">{h.detail}</div>}</div>)) : <div className="p-6 text-sm text-navy/60">No history yet.</div>}
        </div>)}
    </div>
  );
}

function Preview({ doc }: { doc: Props["doc"] }) {
  const src = `/api/app/documents/${doc.id}/file`;
  const start = doc.page_range ? doc.page_range.replace(/[\[\(]/, "").split(",")[0] : "1";
  if (doc.file_type === "pdf") return <iframe title="Document preview" src={`${src}#page=${start}`} className="h-[70vh] w-full rounded-xl border border-navy/10 bg-white" />;
  if (["png", "jpg", "jpeg"].includes(doc.file_type)) return <div className="card overflow-auto p-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt="Document preview" className="mx-auto max-h-[70vh] max-w-full" /></div>;
  return <div className="card p-6 text-sm text-navy/70">A visual preview is not available for .{doc.file_type} files. Use the Extracted Text tab to read the content, or download the original file.</div>;
}

function TextView({ pages, ocr }: { pages: Page[]; ocr: boolean }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => (q.trim() ? pages.filter((p) => p.text.toLowerCase().includes(q.toLowerCase())).map((p) => p.page_number) : []), [q, pages]);
  const hl = (t: string) => {
    if (!q.trim()) return t;
    const parts = t.split(new RegExp(`(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((s, i) => (s.toLowerCase() === q.trim().toLowerCase() ? <mark key={i} className="rounded bg-aqua/50">{s}</mark> : s));
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input className="input max-w-sm" placeholder="Search within this document" aria-label="Search within this document" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <span className="text-sm text-navy/60">{hits.length ? `Found on pages ${hits.join(", ")}` : "No matches"}</span>}
        {ocr && <span className="rounded-full bg-aqua/30 px-2.5 py-0.5 text-xs font-semibold">OCR used. Confidence scores are not provided by the current OCR provider.</span>}
      </div>
      {pages.length ? pages.map((p) => (
        <div key={p.page_number} className="card mb-3 p-4"><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">Page {p.page_number}{p.confidence != null ? `, confidence ${Math.round(p.confidence * 100)} percent` : ""}</div>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{hl(p.text) || "No text on this page."}</pre></div>)) : <div className="card p-6 text-sm text-navy/60">No extracted text yet.</div>}
    </div>
  );
}

function Structured({ doc, records, schemas }: { doc: Props["doc"]; records: Rec[]; schemas: Props["schemas"] }) {
  const router = useRouter();
  const [schemaId, setSchemaId] = useState(schemas[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    setBusy(true); setErr("");
    const r = await fetch(`/api/app/documents/${doc.id}/extract`, { method: "POST", body: JSON.stringify({ schemaId }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) setErr(j.error); else router.refresh();
  }
  return (
    <div className="space-y-5">
      {doc.canWrite && (
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <div><label className="label" htmlFor="schema">Run extraction with schema</label>
            <select id="schema" className="input" value={schemaId} onChange={(e) => setSchemaId(e.target.value)}>{schemas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <button className="btn-primary" disabled={busy || !schemaId} onClick={run}>{busy ? "Extracting" : "Extract"}</button>
        </div>)}
      {err && <Alert kind="error">{err}</Alert>}
      {records.length ? records.map((r) => <RecordEditor key={r.id} rec={r} canWrite={doc.canWrite} />) : <div className="card p-6 text-sm text-navy/60">No structured data yet. Choose a schema and run extraction.</div>}
    </div>
  );
}

function RecordEditor({ rec, canWrite }: { rec: Rec; canWrite: boolean }) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(rec.data).map(([k, v]) => [k, v == null ? "" : typeof v === "object" ? JSON.stringify(v, null, 1) : String(v)])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const parse = () => Object.fromEntries(Object.entries(vals).map(([k, v]) => {
    const orig = rec.data[k];
    if (v === "") return [k, null];
    if (typeof orig === "object" && orig !== null) { try { return [k, JSON.parse(v)]; } catch { return [k, v.split("\n").filter(Boolean)]; } }
    if (typeof orig === "number" && !isNaN(Number(v))) return [k, Number(v)];
    return [k, v];
  }));
  async function save(status?: string) {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/app/extraction/${rec.id}`, { method: "PATCH", body: JSON.stringify({ data: parse(), ...(status ? { status } : {}) }) });
    setBusy(false); setMsg(r.ok ? "Saved" : "Could not save"); router.refresh();
  }
  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">{rec.schema_name} <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs font-semibold capitalize">{rec.status.replace("_", " ")}</span></h3>
        {rec.missing_fields.length > 0 && <span className="text-xs font-semibold text-amber-700">Missing: {rec.missing_fields.join(", ")}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.keys(vals).map((k) => (
          <div key={k} className={vals[k].includes("\n") || vals[k].length > 60 ? "sm:col-span-2" : ""}>
            <label className="label capitalize" htmlFor={`${rec.id}${k}`}>{k.replace(/_/g, " ")}</label>
            <textarea id={`${rec.id}${k}`} rows={vals[k].includes("\n") ? 5 : 1} className="input font-mono text-xs" disabled={!canWrite} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} placeholder="Not found in document" />
          </div>))}
      </div>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-brand">View JSON</summary><pre className="mt-2 overflow-x-auto rounded bg-mist p-3 text-xs">{JSON.stringify(rec.data, null, 2)}</pre></details>
      {canWrite && <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn-secondary" disabled={busy} onClick={() => save()}>Save Edits</button>
        <button className="btn-primary" disabled={busy || rec.status === "approved"} onClick={() => save("approved")}>Approve Results</button>
        <span className="text-sm text-navy/60" role="status">{msg}</span></div>}
    </div>
  );
}

function Summary({ s }: { s: any }) {
  if (!s) return <div className="card p-6 text-sm text-navy/60">No summary yet.</div>;
  const List = ({ title, items }: { title: string; items?: string[] }) => items?.length ? (<div><h4 className="text-xs font-bold uppercase tracking-wide text-teal">{title}</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>) : null;
  return (
    <div className="card space-y-5 p-6">
      <div className="inline-block rounded-full bg-mist px-3 py-1 text-xs font-semibold">{s.ai_generated ? "AI generated interpretation of the document text" : "Opening excerpt only. AI summaries are unavailable until an AI provider is configured."}</div>
      <div><h4 className="text-xs font-bold uppercase tracking-wide text-teal">Executive summary</h4><p className="mt-2 text-sm leading-relaxed">{s.executive}</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><List title="Key findings" items={s.key_findings} /><List title="Important dates" items={s.important_dates} /><List title="Parties involved" items={s.parties} /><List title="Obligations" items={s.obligations} /><List title="Action items" items={s.action_items} /></div>
    </div>
  );
}

function Split({ doc, pages }: { doc: Props["doc"]; pages: Page[] }) {
  const router = useRouter();
  const [parts, setParts] = useState<{ title: string; start_page: number; end_page: number; type?: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(0);
  async function detect() {
    setBusy(true); setErr("");
    const r = await fetch(`/api/app/documents/${doc.id}/split`, { method: "POST" }); const j = await r.json(); setBusy(false);
    if (!r.ok) setErr(j.error); else setParts(j.documents);
  }
  async function save() {
    setBusy(true);
    const r = await fetch(`/api/app/documents/${doc.id}/split`, { method: "PUT", body: JSON.stringify({ documents: parts }) }); const j = await r.json(); setBusy(false);
    if (r.ok) { setDone(j.created.length); setParts(null); router.refresh(); } else setErr(j.error);
  }
  const upd = (i: number, k: string, v: string | number) => setParts((p) => p!.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  return (
    <div className="space-y-4">
      <p className="text-sm text-navy/70">Detect separate documents inside this file ({pages.length} pages). Review and adjust the boundaries before saving.</p>
      {doc.canWrite && <button className="btn-primary" disabled={busy || !pages.length} onClick={detect}>{busy && !parts ? "Detecting" : "Detect Document Boundaries"}</button>}
      {err && <Alert kind="error">{err}</Alert>}
      {done > 0 && <Alert kind="success">{done} documents saved. Find them in the Documents list.</Alert>}
      {parts && (
        <div className="card p-5">
          {parts.length === 0 && <p className="text-sm">No separate documents were detected.</p>}
          <div className="space-y-3">{parts.map((p, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_90px_90px_auto]">
              <div><label className="label" htmlFor={`t${i}`}>Title{p.type ? ` (${p.type})` : ""}</label><input id={`t${i}`} className="input" value={p.title} onChange={(e) => upd(i, "title", e.target.value)} /></div>
              <div><label className="label" htmlFor={`s${i}`}>From page</label><input id={`s${i}`} type="number" min={1} max={pages.length} className="input" value={p.start_page} onChange={(e) => upd(i, "start_page", Number(e.target.value))} /></div>
              <div><label className="label" htmlFor={`e${i}`}>To page</label><input id={`e${i}`} type="number" min={1} max={pages.length} className="input" value={p.end_page} onChange={(e) => upd(i, "end_page", Number(e.target.value))} /></div>
              <button className="btn-danger btn-sm" onClick={() => setParts(parts.filter((_, n) => n !== i))}>Remove</button>
            </div>))}</div>
          {parts.length > 0 && <button className="btn-primary mt-5" disabled={busy} onClick={save}>Save {parts.length} Documents</button>}
        </div>)}
    </div>
  );
}
