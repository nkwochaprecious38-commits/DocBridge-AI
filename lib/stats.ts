import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadStats(supabase: SupabaseClient, orgId: string) {
  const [docs, jobs, recs, queries, execs, cats] = await Promise.all([
    supabase.from("documents").select("id,name,file_type,status,size_bytes,category_id,created_at,page_count").eq("org_id", orgId).order("created_at", { ascending: false }).limit(2000),
    supabase.from("processing_jobs").select("id,status,created_at,document_id,error").eq("org_id", orgId).order("created_at", { ascending: false }).limit(500),
    supabase.from("extraction_records").select("id,document_id,schema_name,status,created_at,missing_fields").eq("org_id", orgId).order("created_at", { ascending: false }).limit(500),
    supabase.from("ai_queries").select("id,kind,question,created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50),
    supabase.from("workflow_executions").select("id,status,created_at,workflows(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(100),
    supabase.from("categories").select("id,name").eq("org_id", orgId),
  ]);
  const d = docs.data ?? [], j = jobs.data ?? [], r = recs.data ?? [];
  const count = (s: string) => d.filter((x) => x.status === s).length;
  const catName = new Map((cats.data ?? []).map((c) => [c.id, c.name]));
  const byCat: Record<string, number> = {};
  d.forEach((x) => { const n = (x.category_id && catName.get(x.category_id)) || "Uncategorized"; byCat[n] = (byCat[n] ?? 0) + 1; });
  const days: Record<string, { day: string; Processed: number; Failed: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 864e5);
    days[dt.toISOString().slice(0, 10)] = { day: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }), Processed: 0, Failed: 0 };
  }
  j.forEach((x) => { const k = x.created_at.slice(0, 10); if (days[k]) { if (x.status === "succeeded") days[k].Processed++; if (x.status === "failed") days[k].Failed++; } });
  return {
    docs: d, jobs: j, records: r, queries: queries.data ?? [], execs: execs.data ?? [],
    total: d.length,
    processed: count("processed") + count("awaiting_review") + count("approved"),
    queue: count("uploaded") + count("processing"),
    awaiting: count("awaiting_review"),
    failed: count("failed"),
    successfulExtractions: r.length,
    storage: d.reduce((a, x) => a + (x.size_bytes ?? 0), 0),
    categoryData: Object.entries(byCat).map(([name, value]) => ({ name, value })),
    activity: Object.values(days),
  };
}
