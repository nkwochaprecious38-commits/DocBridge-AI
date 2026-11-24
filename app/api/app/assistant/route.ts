import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { aiEnabled, askJSON } from "@/lib/ai";
import { logAgent } from "@/lib/pipeline";

export const maxDuration = 120;
const STOP = new Set("the a an of to in on for and or is are was were what which who how when where all any find me my this that with from about does do show list identify give summarize summary documents document".split(" "));

type Passage = { document_id: string; document_name: string; page_number: number; text: string };

export async function POST(req: Request) {
  const c = await apiCtx(false);
  if ("error" in c) return c.error;
  const { question, documentId, kbId } = await req.json();
  const q = String(question ?? "").trim();
  if (!q) return NextResponse.json({ error: "Enter a question" }, { status: 400 });
  if (!aiEnabled) return NextResponse.json({ error: "The assistant needs ANTHROPIC_API_KEY to be configured on the server." }, { status: 503 });

  // Restrict scope to a document or knowledge base when requested
  let scope: string[] | null = null;
  if (documentId) scope = [documentId];
  else if (kbId) {
    const { data } = await c.supabase.from("knowledge_base_documents").select("document_id").eq("kb_id", kbId);
    scope = (data ?? []).map((d) => d.document_id);
  }

  // Retrieve: full text search on keywords, then fall back to the opening pages for broad questions
  const terms = q.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  let passages: Passage[] = [];
  if (terms.length) {
    const { data } = await c.supabase.rpc("search_pages", { p_org: c.orgId, p_query: terms.join(" or "), p_limit: 40 });
    const ids = (Array.from(new Set((data ?? []).filter((r: any) => !scope || scope.includes(r.document_id)).map((r: any) => `${r.document_id}:${r.page_number}`))) as string[]).slice(0, 8);
    for (const key of ids) {
      const [d, p] = key.split(":");
      const { data: pg } = await c.supabase.from("document_pages").select("text").eq("document_id", d).eq("page_number", Number(p)).single();
      const meta = (data as any[]).find((r) => r.document_id === d);
      if (pg) passages.push({ document_id: d, document_name: meta.document_name, page_number: Number(p), text: pg.text.slice(0, 4000) });
    }
  }
  if (!passages.length && (documentId || (scope && scope.length))) {
    const target = documentId ?? scope![0];
    const { data: pgs } = await c.supabase.from("document_pages").select("page_number, text, documents(name)").eq("document_id", target).order("page_number").limit(6);
    passages = (pgs ?? []).map((p: any) => ({ document_id: target, document_name: p.documents?.name, page_number: p.page_number, text: p.text.slice(0, 4000) }));
  }
  // Include verified structured records for the retrieved documents
  const docIds = Array.from(new Set(passages.map((p) => p.document_id)));
  const { data: recs } = docIds.length ? await c.supabase.from("extraction_records").select("document_id, schema_name, data, status").in("document_id", docIds) : { data: [] as any[] };

  if (!passages.length) {
    const answer = { found: false, answer: "The available documents do not contain information that answers this question.", facts: [], interpretation: "", sources: [] };
    await c.supabase.from("ai_queries").insert({ org_id: c.orgId, user_id: c.user.id, question: q, answer });
    return NextResponse.json(answer);
  }

  const context = passages.map((p, i) => `[S${i + 1}] Document: ${p.document_name} | Page ${p.page_number}\n${p.text}`).join("\n\n")
    + (recs?.length ? "\n\nStructured records (extracted, review status shown):\n" + recs.map((r: any) => `Document ${r.document_id} ${r.schema_name} (${r.status}): ${JSON.stringify(r.data)}`).join("\n") : "");

  try {
    const r = await askJSON<any>(
      `You answer questions strictly from the provided document passages. Rules: (1) Only state facts that appear in the passages. (2) Every fact must cite a source id like S1 and include a short verbatim quote. (3) Put any reasoning, inference or suggestion in "interpretation", clearly separate from facts. (4) If the passages do not contain the answer, set found to false and say so. Never invent information. Return JSON: {"found": boolean, "answer": string, "facts": [{"statement": string, "source": "S1", "quote": string}], "interpretation": string}.`,
      `Question: ${q}\n\nPassages:\n${context}`, 3000);
    const facts = (r.facts ?? []).map((f: any) => {
      const idx = parseInt(String(f.source).replace(/\D/g, "")) - 1;
      const p = passages[idx];
      return { statement: f.statement, quote: f.quote, document_id: p?.document_id, document: p?.document_name, page: p?.page_number,
        verified: p ? p.text.replace(/\s+/g, " ").toLowerCase().includes(String(f.quote ?? "").replace(/\s+/g, " ").toLowerCase().slice(0, 60)) && String(f.quote ?? "").length > 3 : false };
    });
    const answer = { found: r.found !== false, answer: r.answer, facts, interpretation: r.interpretation ?? "" };
    await c.supabase.from("ai_queries").insert({ org_id: c.orgId, user_id: c.user.id, question: q, answer });
    await logAgent({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, "Research Agent", documentId ?? null, "succeeded", { question: q }, { facts: facts.length, passages: passages.length });
    return NextResponse.json(answer);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 422 }); }
}
