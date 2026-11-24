import { getContext, canWrite } from "@/lib/session";
import { PageTitle, Panel, Empty } from "@/components/ui";
import { createKnowledgeBase, deleteKnowledgeBase, setKbDocuments } from "../actions";
import { ChatBox } from "@/components/ChatBox";

export default async function Knowledge() {
  const { supabase, orgId, role } = await getContext();
  const [{ data: kbs }, { data: docs }, { data: links }] = await Promise.all([
    supabase.from("knowledge_bases").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("documents").select("id,name").eq("org_id", orgId).order("name").limit(500),
    supabase.from("knowledge_base_documents").select("kb_id,document_id").eq("org_id", orgId),
  ]);
  const w = canWrite(role);
  return (
    <>
      <PageTitle title="Knowledge Base" text="Group related documents into a knowledge base, then ask questions scoped to just those documents." />
      {w && <Panel title="Create a knowledge base"><form action={createKnowledgeBase} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div><label className="label" htmlFor="kn">Name</label><input id="kn" name="name" required className="input" placeholder="Supplier agreements" /></div>
        <div><label className="label" htmlFor="kd">Description</label><input id="kd" name="description" className="input" /></div>
        <button className="btn-primary">Create</button></form></Panel>}
      <div className="mt-6 space-y-6">
        {kbs?.length ? kbs.map((kb) => {
          const sel = new Set(links?.filter((l) => l.kb_id === kb.id).map((l) => l.document_id));
          return (
            <Panel key={kb.id} title={kb.name} action={w && <form action={deleteKnowledgeBase}><input type="hidden" name="id" value={kb.id} /><button className="btn-danger btn-sm">Delete</button></form>}>
              {kb.description && <p className="mb-3 text-sm text-navy/70">{kb.description}</p>}
              <details className="mb-4"><summary className="cursor-pointer text-sm font-semibold text-brand">Manage documents ({sel.size} included)</summary>
                <form action={setKbDocuments} className="mt-3"><input type="hidden" name="kb_id" value={kb.id} />
                  <div className="grid max-h-60 gap-1 overflow-y-auto sm:grid-cols-2">{docs?.map((d) => <label key={d.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="document_ids" value={d.id} defaultChecked={sel.has(d.id)} />{d.name}</label>)}</div>
                  {w && <button className="btn-secondary btn-sm mt-3">Save Documents</button>}</form></details>
              {sel.size ? <ChatBox kbId={kb.id} placeholder={`Ask about ${kb.name}`} examples={["Summarize these documents", "Identify all obligations"]} /> : <Empty>Add documents to start asking questions.</Empty>}
            </Panel>);
        }) : <Empty>No knowledge bases yet.</Empty>}
      </div>
    </>
  );
}
