import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { processDocument } from "@/lib/pipeline";

export const maxDuration = 300;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const { id } = await params;
  const { data: prior } = await c.supabase.from("processing_jobs").select("attempts").eq("document_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const r = await processDocument({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, id);
  if (prior) await c.supabase.from("processing_jobs").update({ attempts: (prior.attempts ?? 1) + 1 }).eq("document_id", id).order("created_at", { ascending: false }).limit(1);
  return NextResponse.json(r, { status: r.ok ? 200 : 422 });
}
