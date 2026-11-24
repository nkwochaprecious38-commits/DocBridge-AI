import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { compareDocs } from "@/lib/intel";
import { logAgent } from "@/lib/pipeline";

export const maxDuration = 120;

export async function POST(req: Request) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const { a, b } = await req.json();
  if (!a || !b || a === b) return NextResponse.json({ error: "Choose two different documents" }, { status: 400 });
  const load = async (id: string) => {
    const { data: d } = await c.supabase.from("documents").select("name").eq("id", id).single();
    const { data: p } = await c.supabase.from("document_pages").select("text").eq("document_id", id).order("page_number");
    return d && p?.length ? { name: d.name, pages: p.map((x) => x.text) } : null;
  };
  const [da, db] = await Promise.all([load(a), load(b)]);
  if (!da || !db) return NextResponse.json({ error: "Both documents must be processed" }, { status: 400 });
  try {
    const result = await compareDocs(da, db);
    await logAgent({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, "Comparison Agent", null, "succeeded", { a: da.name, b: db.name }, { summary: (result as any).summary });
    await c.supabase.from("ai_queries").insert({ org_id: c.orgId, user_id: c.user.id, kind: "compare", question: `Compare ${da.name} with ${db.name}`, answer: result });
    return NextResponse.json({ result, names: [da.name, db.name] });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 422 }); }
}
