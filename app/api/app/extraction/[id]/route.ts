import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { audit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.data && typeof body.data === "object") {
    patch.data = body.data;
    patch.missing_fields = Object.entries(body.data).filter(([, v]) => v === null || v === "" || (Array.isArray(v) && !v.length)).map(([k]) => k);
  }
  if (body.status === "approved" || body.status === "rejected" || body.status === "awaiting_review") {
    patch.status = body.status;
    patch.approved_by = body.status === "approved" ? c.user.id : null;
  }
  const { data: rec, error } = await c.supabase.from("extraction_records").update(patch).eq("id", id).select().single();
  if (error || !rec) return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 400 });
  if (patch.status === "approved") {
    await c.supabase.from("documents").update({ status: "approved" }).eq("id", rec.document_id);
    await audit(c.supabase, c.orgId, c.user.id, "extraction.approved", "extraction_record", id);
  } else if (body.data) await audit(c.supabase, c.orgId, c.user.id, "extraction.edited", "extraction_record", id);
  return NextResponse.json({ record: rec });
}
