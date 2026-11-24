import { getContext, canWrite } from "@/lib/session";
import { PageTitle, Panel, Empty } from "@/components/ui";
import { STEP_LABEL, type StepType } from "@/lib/workflows";
import { saveWorkflow, createInvoiceTemplate, toggleWorkflow, deleteWorkflow, runWorkflowNow } from "../actions";
import { fmtDateTime } from "@/lib/utils";

export default async function Workflows() {
  const { supabase, orgId, role } = await getContext();
  const [{ data: wfs }, { data: execs }, { data: cats }, { data: docs }] = await Promise.all([
    supabase.from("workflows").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("workflow_executions").select("*, workflows(name), documents(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(25),
    supabase.from("categories").select("name").eq("org_id", orgId).order("name"),
    supabase.from("documents").select("id,name").eq("org_id", orgId).in("status", ["processed", "awaiting_review", "approved"]).order("created_at", { ascending: false }).limit(100),
  ]);
  const w = canWrite(role);
  return (
    <>
      <PageTitle title="Workflows" text="Automate document processing. Workflows run when a document finishes processing and can pause for human approval." action={w && <form action={createInvoiceTemplate}><button className="btn-secondary">Add Invoice Template</button></form>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {wfs?.length ? wfs.map((wf) => (
            <Panel key={wf.id} title={wf.name} action={<span className={`text-xs font-semibold ${wf.enabled ? "text-teal" : "text-navy/50"}`}>{wf.enabled ? "Enabled" : "Paused"}</span>}>
              <p className="mb-3 text-xs text-navy/60">Trigger: document processed{wf.trigger_category ? ` in category ${wf.trigger_category}` : " in any category"}</p>
              <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm">{(wf.steps as any[]).map((s, i) => <li key={i}>{STEP_LABEL[s.type as StepType] ?? s.type}</li>)}</ol>
              {w && <div className="flex flex-wrap items-center gap-2">
                <form action={toggleWorkflow}><input type="hidden" name="id" value={wf.id} /><input type="hidden" name="enabled" value={String(!wf.enabled)} /><button className="btn-secondary btn-sm">{wf.enabled ? "Pause" : "Enable"}</button></form>
                <form action={runWorkflowNow} className="flex gap-2"><input type="hidden" name="id" value={wf.id} /><select name="document_id" className="input !py-1.5 text-xs" aria-label="Document to run on" required><option value="">Run on document</option>{docs?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select><button className="btn-primary btn-sm">Run</button></form>
                <form action={deleteWorkflow}><input type="hidden" name="id" value={wf.id} /><button className="btn-danger btn-sm">Delete</button></form></div>}
            </Panel>)) : <Empty>No workflows yet. Add the invoice template or build your own.</Empty>}
        </div>
        {w && <Panel title="Build a workflow"><form action={saveWorkflow} className="space-y-3">
          <div><label className="label" htmlFor="wn">Name</label><input id="wn" name="name" required className="input" /></div>
          <div><label className="label" htmlFor="wc">Run for category</label><select id="wc" name="category" className="input"><option value="">Any category</option>{cats?.map((c) => <option key={c.name}>{c.name}</option>)}</select></div>
          <fieldset><legend className="label">Steps, in order</legend>
            {[0, 1, 2, 3, 4, 5].map((i) => <select key={i} name="steps" aria-label={`Step ${i + 1}`} className="input mb-2" defaultValue=""><option value="">{`Step ${i + 1}: none`}</option>{Object.entries(STEP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>)}</fieldset>
          <button className="btn-primary">Save Workflow</button></form></Panel>}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Workflow history</h2>
      {execs?.length ? <div className="space-y-3">{execs.map((e: any) => (
        <details key={e.id} className="card p-4"><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold">{e.workflows?.name}<span className="font-normal text-navy/60"> on {e.documents?.name ?? "removed document"}</span></span><span className={`text-xs font-semibold capitalize ${e.status === "failed" ? "text-red-600" : e.status === "awaiting_approval" ? "text-amber-700" : "text-teal"}`}>{e.status.replace("_", " ")} · {fmtDateTime(e.created_at)}</span></summary>
          {e.error && <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-sm text-red-800">Error: {e.error}</p>}
          <ul className="mt-3 space-y-1.5 text-sm">{(e.log as any[]).map((l, i) => <li key={i} className="flex gap-2"><span className={`w-16 shrink-0 text-xs font-semibold uppercase ${l.status === "failed" ? "text-red-600" : l.status === "warning" || l.status === "waiting" ? "text-amber-700" : "text-teal"}`}>{l.status}</span><span>{l.step}{l.detail ? `: ${l.detail}` : ""}</span></li>)}</ul></details>))}</div> : <Empty>No runs yet.</Empty>}
    </>
  );
}
