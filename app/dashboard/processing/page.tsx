import Link from "next/link";
import { getContext } from "@/lib/session";
import { PageTitle, Panel, TableWrap, Empty, StatCard } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { RetryButton } from "../documents/[id]/controls";

const AGENTS = [
  { name: "Parsing Agent", text: "Parses uploaded files and prepares machine readable content." },
  { name: "Extraction Agent", text: "Extracts structured information based on user defined schemas." },
  { name: "Classification Agent", text: "Identifies document types and assigns categories." },
  { name: "Research Agent", text: "Searches authorized document libraries and retrieves relevant information." },
  { name: "Comparison Agent", text: "Compares multiple documents and highlights differences." },
  { name: "Workflow Agent", text: "Coordinates multi step document processing tasks." },
];

export default async function Processing() {
  const { supabase, orgId } = await getContext();
  const [{ data: jobs }, { data: runs }] = await Promise.all([
    supabase.from("processing_jobs").select("id,status,attempts,error,created_at,finished_at,document_id,documents(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(30),
    supabase.from("agent_runs").select("id,agent,status,input,output,created_at,document_id,documents(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(200),
  ]);
  const by = (n: string) => (runs ?? []).filter((r) => r.agent === n);
  return (
    <>
      <PageTitle title="Document Processing" text="Monitor processing jobs and review what each agent has done. Consequential actions pause for human approval in Tasks." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Jobs running" value={jobs?.filter((j) => j.status === "running").length ?? 0} />
        <StatCard label="Succeeded" value={jobs?.filter((j) => j.status === "succeeded").length ?? 0} />
        <StatCard label="Failed" value={jobs?.filter((j) => j.status === "failed").length ?? 0} />
        <StatCard label="Awaiting approval" value={runs?.filter((r) => r.status === "awaiting_approval").length ?? 0} href="/dashboard/tasks" />
      </div>
      <h2 className="mb-3 text-lg font-bold">Processing jobs</h2>
      {jobs?.length ? (
        <TableWrap><thead className="bg-mist"><tr><th className="th">Document</th><th className="th">Status</th><th className="th">Attempts</th><th className="th">Started</th><th className="th">Error</th><th className="th"></th></tr></thead>
          <tbody className="divide-y divide-navy/10">{jobs.map((j: any) => (
            <tr key={j.id}><td className="td"><Link className="font-medium text-brand" href={`/dashboard/documents/${j.document_id}`}>{j.documents?.name}</Link></td><td className="td capitalize">{j.status}</td><td className="td">{j.attempts}</td><td className="td">{fmtDateTime(j.created_at)}</td><td className="td max-w-xs truncate text-red-700" title={j.error ?? ""}>{j.error ?? ""}</td><td className="td">{j.status === "failed" && <RetryButton id={j.document_id} small />}</td></tr>))}</tbody></TableWrap>
      ) : <Empty>No processing jobs yet.</Empty>}
      <h2 className="mb-3 mt-10 text-lg font-bold">Agents</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {AGENTS.map((a) => (
          <Panel key={a.name} title={a.name}>
            <p className="mb-3 text-sm text-navy/70">{a.text}</p>
            <div className="mb-2 text-xs text-navy/60">{by(a.name).length} recorded runs</div>
            {by(a.name).slice(0, 4).map((r: any) => (
              <details key={r.id} className="border-t border-navy/10 py-2 text-sm">
                <summary className="flex cursor-pointer items-center justify-between gap-2"><span className="truncate">{r.documents?.name ?? "Library wide"}</span><span className={`shrink-0 text-xs font-semibold capitalize ${r.status === "failed" ? "text-red-600" : "text-teal"}`}>{r.status.replace("_", " ")}</span></summary>
                <div className="mt-2 text-xs text-navy/60">{fmtDateTime(r.created_at)}</div>
                <pre className="mt-1 overflow-x-auto rounded bg-mist p-2 text-xs">{JSON.stringify(r.output ?? r.input, null, 2)}</pre>
              </details>
            ))}
            {!by(a.name).length && <Empty>No activity yet.</Empty>}
          </Panel>
        ))}
      </div>
    </>
  );
}
