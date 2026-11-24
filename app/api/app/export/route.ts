import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { audit } from "@/lib/audit";

/** Exports organization data as JSON. Admin only. */
export async function GET() {
  const c = await apiCtx(false);
  if ("error" in c) return c.error;
  if (!["owner", "admin"].includes(c.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const tables = ["documents", "document_pages", "extraction_records", "extraction_schemas", "categories", "knowledge_bases", "ai_queries", "workflows", "workflow_executions", "tasks", "audit_logs"];
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), organization_id: c.orgId };
  for (const t of tables) { const { data } = await c.supabase.from(t).select("*").eq("org_id", c.orgId).limit(50000); out[t] = data ?? []; }
  await audit(c.supabase, c.orgId, c.user.id, "data.exported", "organization", c.orgId);
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="docbridge-export.json"', "Cache-Control": "no-store" } });
}
