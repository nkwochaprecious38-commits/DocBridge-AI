import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { detectSplits } from "@/lib/intel";
import { logAgent } from "@/lib/pipeline";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

// Step 1: detect boundaries (no changes saved)
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const { id } = await params;
  const { data: pages } = await c.supabase.from("document_pages").select("page_number, text").eq("document_id", id).order("page_number");
  if (!pages?.length) return NextResponse.json({ error: "Process the document first" }, { status: 400 });
  try {
    const docs = await detectSplits(pages.map((p) => p.text));
    await logAgent({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, "Classification Agent", id, "succeeded", { task: "split detection" }, { documents: docs.length });
    return NextResponse.json({ documents: docs });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 422 }); }
}

// Step 2: save the boundaries the user reviewed as individual documents
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const { id } = await params;
  const { documents } = (await req.json()) as { documents: { title: string; start_page: number; end_page: number }[] };
  const { data: parent } = await c.supabase.from("documents").select("*").eq("id", id).single();
  if (!parent || !Array.isArray(documents) || !documents.length) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { data: pages } = await c.supabase.from("document_pages").select("page_number, text").eq("document_id", id).order("page_number");
  const created: string[] = [];
  for (const d of documents) {
    if (!(d.start_page >= 1 && d.end_page >= d.start_page && d.end_page <= (pages?.length ?? 0))) continue;
    const { data: child } = await c.supabase.from("documents").insert({
      org_id: c.orgId, uploaded_by: c.user.id, parent_id: id, name: String(d.title || "Split document").slice(0, 200),
      file_type: parent.file_type, mime_type: parent.mime_type, size_bytes: 0, storage_path: parent.storage_path,
      folder: parent.folder, tags: parent.tags, page_count: d.end_page - d.start_page + 1,
      page_range: `[${d.start_page},${d.end_page}]`, status: "processed", category_id: parent.category_id, processed_at: new Date().toISOString(),
    }).select("id").single();
    if (!child) continue;
    const slice = (pages ?? []).filter((p) => p.page_number >= d.start_page && p.page_number <= d.end_page);
    await c.supabase.from("document_pages").insert(slice.map((p, i) => ({ document_id: child.id, org_id: c.orgId, page_number: i + 1, text: p.text })));
    created.push(child.id);
  }
  await audit(c.supabase, c.orgId, c.user.id, "document.split", "document", id, { created: created.length });
  return NextResponse.json({ created });
}
