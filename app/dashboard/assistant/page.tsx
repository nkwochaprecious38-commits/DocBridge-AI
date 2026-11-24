import { getContext } from "@/lib/session";
import { PageTitle, Notice } from "@/components/ui";
import { ChatBox } from "@/components/ChatBox";
import { Compare } from "./compare";
import { aiEnabled } from "@/lib/ai";

export default async function Assistant() {
  const { supabase, orgId } = await getContext();
  const { data: docs } = await supabase.from("documents").select("id,name").eq("org_id", orgId).in("status", ["processed", "awaiting_review", "approved"]).order("name").limit(500);
  return (
    <>
      <PageTitle title="AI Document Assistant" text="DocBridge AI retrieves passages from your authorized document library, cites the document and page, and separates stated facts from interpretation." />
      {!aiEnabled && <Notice kind="warn">The assistant is not active: ANTHROPIC_API_KEY is not set on the server.</Notice>}
      <ChatBox examples={["Summarize the latest financial report", "Identify all payment obligations", "Find documents mentioning a supplier", "What is the expiration date?"]} />
      <h2 className="mb-3 mt-10 text-lg font-bold">Compare documents</h2>
      <Compare docs={docs ?? []} />
    </>
  );
}
