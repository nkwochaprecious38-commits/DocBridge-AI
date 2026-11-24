import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFile } from "@/lib/parse";
import { classify, extract, summarize, type FieldDef } from "@/lib/intel";
import { runMatchingWorkflows } from "@/lib/workflows";
import { audit } from "@/lib/audit";

type Ctx = { supabase: SupabaseClient; orgId: string; userId: string };

export async function logAgent(c: Ctx, agent: string, documentId: string | null, status: string, input?: unknown, output?: unknown) {
  await c.supabase.from("agent_runs").insert({ org_id: c.orgId, agent, document_id: documentId, status, input, output });
}

const SCHEMA_FOR: Record<string, string> = { Invoices: "Invoice", Contracts: "Contract", Resumes: "Resume" };

export async function extractAndStore(c: Ctx, documentId: string, schemaId: string | null, text: string, categoryName?: string) {
  let schema: any = null;
  if (schemaId) {
    ({ data: schema } = await c.supabase.from("extraction_schemas").select("*").eq("id", schemaId).maybeSingle());
  } else if (categoryName && SCHEMA_FOR[categoryName]) {
    ({ data: schema } = await c.supabase.from("extraction_schemas").select("*").eq("org_id", c.orgId).eq("name", SCHEMA_FOR[categoryName]).maybeSingle());
  }
  if (!schema) return null;
  const { data, missing } = await extract(text, schema.fields as FieldDef[]);
  const { data: rec } = await c.supabase.from("extraction_records").insert({
    org_id: c.orgId, document_id: documentId, schema_id: schema.id, schema_name: schema.name, data, missing_fields: missing,
  }).select().single();
  await logAgent(c, "Extraction Agent", documentId, "succeeded", { schema: schema.name }, { missing });
  return rec;
}

export async function processDocument(c: Ctx, documentId: string) {
  const { supabase, orgId } = c;
  const { data: doc } = await supabase.from("documents").select("*").eq("id", documentId).single();
  if (!doc) throw new Error("Document not found");
  const { data: job } = await supabase.from("processing_jobs").insert({ org_id: orgId, document_id: documentId, status: "running", attempts: 1 }).select().single();
  await supabase.from("documents").update({ status: "processing", error: null }).eq("id", documentId);

  try {
    const { data: file, error: dlErr } = await supabase.storage.from("documents").download(doc.storage_path);
    if (dlErr || !file) throw new Error(`Could not read stored file: ${dlErr?.message}`);
    const buf = Buffer.from(await file.arrayBuffer());

    const parsed = await parseFile(buf, doc.file_type, doc.name);
    await logAgent(c, "Parsing Agent", documentId, "succeeded", { file: doc.name }, { pages: parsed.pages.length, ocr: parsed.ocrUsed });

    await supabase.from("document_pages").delete().eq("document_id", documentId);
    if (parsed.pages.length) {
      await supabase.from("document_pages").insert(parsed.pages.map((p, i) => ({
        document_id: documentId, org_id: orgId, page_number: i + 1, text: p.text.replace(/\u0000/g, ""), confidence: p.confidence,
      })));
    }
    const fullText = parsed.pages.map((p) => p.text).join("\n\n");
    if (!fullText.trim()) throw new Error("No readable text was found in this document.");

    const { data: cats } = await supabase.from("categories").select("id,name").eq("org_id", orgId);
    const names = (cats ?? []).map((x) => x.name);
    const cls = await classify(fullText, names);
    const catId = cats?.find((x) => x.name === cls.category)?.id ?? null;
    await logAgent(c, "Classification Agent", documentId, "succeeded", {}, cls);

    const summary = await summarize(fullText);
    let status: string = "processed";
    try {
      const rec = await extractAndStore(c, documentId, null, fullText, cls.category);
      if (rec) status = "awaiting_review";
    } catch (e: any) {
      await logAgent(c, "Extraction Agent", documentId, "failed", {}, { error: e.message });
    }

    await supabase.from("documents").update({
      status, page_count: parsed.pages.length, category_id: catId, summary, ocr_used: parsed.ocrUsed, processed_at: new Date().toISOString(),
    }).eq("id", documentId);
    await supabase.from("processing_jobs").update({ status: "succeeded", finished_at: new Date().toISOString() }).eq("id", job!.id);
    await audit(supabase, orgId, c.userId, "document.processed", "document", documentId);

    await runMatchingWorkflows(c, documentId, cls.category);
    return { ok: true };
  } catch (e: any) {
    await supabase.from("documents").update({ status: "failed", error: e.message }).eq("id", documentId);
    await supabase.from("processing_jobs").update({ status: "failed", error: e.message, finished_at: new Date().toISOString() }).eq("id", job!.id);
    await logAgent(c, "Parsing Agent", documentId, "failed", {}, { error: e.message });
    return { ok: false, error: e.message };
  }
}
