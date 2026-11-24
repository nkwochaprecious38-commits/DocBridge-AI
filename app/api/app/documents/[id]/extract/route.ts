import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { extractAndStore } from "@/lib/pipeline";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const { id } = await params;
  const { schemaId } = await req.json();
  const { data: pages } = await c.supabase.from("document_pages").select("text").eq("document_id", id).order("page_number");
  if (!pages?.length) return NextResponse.json({ error: "Process the document first" }, { status: 400 });
  try {
    const rec = await extractAndStore({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, id, schemaId, pages.map((p) => p.text).join("\n\n"));
    if (!rec) return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    await c.supabase.from("documents").update({ status: "awaiting_review" }).eq("id", id).in("status", ["processed", "approved"]);
    return NextResponse.json({ record: rec });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 422 }); }
}
