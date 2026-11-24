"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Send } from "lucide-react";

type Fact = { statement: string; quote?: string; document_id?: string; document?: string; page?: number; verified?: boolean };
type Answer = { found: boolean; answer: string; facts: Fact[]; interpretation: string };
type Turn = { q: string; a?: Answer; error?: string };

const EXAMPLES = ["Summarize this document", "What dates are mentioned?", "Identify all payment obligations", "Identify missing information"];

export function ChatBox({ documentId, kbId, placeholder = "Ask a question about your documents", examples = EXAMPLES }: { documentId?: string; kbId?: string; placeholder?: string; examples?: string[] }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true); setQ("");
    setTurns((t) => [...t, { q: text }]);
    const res = await fetch("/api/app/assistant", { method: "POST", body: JSON.stringify({ question: text, documentId, kbId }) });
    const j = await res.json().catch(() => ({ error: "Unexpected response" }));
    setTurns((t) => t.map((x, i) => (i === t.length - 1 ? (res.ok ? { ...x, a: j } : { ...x, error: j.error }) : x)));
    setBusy(false);
    setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="card flex flex-col">
      <div className="max-h-[60vh] min-h-[16rem] space-y-6 overflow-y-auto p-5" aria-live="polite">
        {!turns.length && (
          <div><p className="text-sm text-navy/70">Answers are drawn only from your documents and cite the source and page. If the documents do not contain the answer, DocBridge AI will say so.</p>
            <div className="mt-3 flex flex-wrap gap-2">{examples.map((e) => <button key={e} className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand" onClick={() => ask(e)}>{e}</button>)}</div></div>)}
        {turns.map((t, i) => (
          <div key={i} className="space-y-3">
            <div className="ml-auto max-w-[85%] rounded-xl bg-brand px-4 py-2.5 text-sm text-white">{t.q}</div>
            {!t.a && !t.error && <div className="text-sm text-navy/60">Searching documents</div>}
            {t.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{t.error}</div>}
            {t.a && (
              <div className="space-y-3 rounded-xl bg-mist p-4 text-sm">
                <p className="font-medium">{t.a.answer}</p>
                {!t.a.found && <p className="text-xs text-navy/60">No supporting passages were found in the documents you can access.</p>}
                {t.a.facts?.length > 0 && (
                  <div><div className="mb-2 text-xs font-bold uppercase tracking-wide text-teal">Stated in the documents</div>
                    <ul className="space-y-2">{t.a.facts.map((f, k) => (
                      <li key={k} className="rounded-lg bg-white p-3"><div>{f.statement}</div>
                        {f.quote && <blockquote className="mt-1 border-l-2 border-aqua pl-2 text-xs italic text-navy/70">{f.quote}</blockquote>}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          {f.document_id ? <Link href={`/dashboard/documents/${f.document_id}`} className="font-semibold text-brand">{f.document}, page {f.page}</Link> : <span className="text-red-600">Source not resolved</span>}
                          <span className={f.verified ? "text-emerald-700" : "text-amber-700"}>{f.verified ? "Quote matched in source" : "Quote not matched: verify manually"}</span></div></li>))}</ul></div>)}
                {t.a.interpretation && <div className="rounded-lg border border-dashed border-navy/20 p-3"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-navy/60">AI generated interpretation</div><p className="text-navy/80">{t.a.interpretation}</p></div>}
              </div>)}
          </div>))}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t border-navy/10 p-3" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Question" />
        <button className="btn-primary" disabled={busy || !q.trim()} aria-label="Send question"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
