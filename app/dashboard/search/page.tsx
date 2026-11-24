import { getContext } from "@/lib/session";
import { PageTitle } from "@/components/ui";
import { SearchClient } from "./search-client";

export default async function SearchPage() {
  const { supabase, orgId } = await getContext();
  const [{ data: cats }, { data: docs }] = await Promise.all([
    supabase.from("categories").select("id,name").eq("org_id", orgId).order("name"),
    supabase.from("documents").select("tags").eq("org_id", orgId),
  ]);
  const tags = Array.from(new Set((docs ?? []).flatMap((d) => d.tags ?? []))).sort();
  return (<><PageTitle title="Search" text="Search the text of every processed page. Semantic mode expands your query with related terms using AI." /><SearchClient cats={cats ?? []} tags={tags as string[]} /></>);
}
