import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { aiEnabled, askJSON } from "@/lib/ai";

export async function POST(req: Request) {
  const c = await apiCtx(false);
  if ("error" in c) return c.error;
  const { query, mode = "keyword", category, tag, from, to } = await req.json();
  const q = String(query ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });
  let effective = q, expanded: string[] = [];
  let note: string | undefined;
  if (mode === "semantic") {
    if (aiEnabled) {
      try {
        const r = await askJSON<{ terms: string[] }>("Given a search query over business documents, return up to 8 closely related words or short phrases (synonyms and related concepts) as {\"terms\": string[]}.", q, 300);
        expanded = (r.terms ?? []).slice(0, 8);
        effective = [q, ...expanded].map((t) => `"${t.replace(/"/g, "")}"`).join(" or ");
      } catch { note = "AI expansion failed; showing keyword results."; }
    } else note = "AI is not configured; showing keyword results.";
  }
  const { data, error } = await c.supabase.rpc("search_pages", { p_org: c.orgId, p_query: effective, p_limit: 60 });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  let rows = (data ?? []) as any[];
  if (category) rows = rows.filter((r) => r.category_id === category);
  if (tag) rows = rows.filter((r) => (r.tags ?? []).includes(tag));
  if (from) rows = rows.filter((r) => r.created_at >= from);
  if (to) rows = rows.filter((r) => r.created_at <= to + "T23:59:59");
  return NextResponse.json({ results: rows.slice(0, 30), expanded, note });
}
