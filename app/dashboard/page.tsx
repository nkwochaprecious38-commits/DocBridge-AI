import Link from "next/link";
import { getContext } from "@/lib/session";
import { loadStats } from "@/lib/stats";
import { PageTitle, StatCard, Panel, Empty, StatusBadge, TableWrap } from "@/components/ui";
import { ActivityChart, CategoryChart } from "@/components/charts";
import { fmtBytes, fmtDateTime } from "@/lib/utils";

export default async function Overview() {
  const { supabase, orgId, org } = await getContext();
  const s = await loadStats(supabase, orgId);
  const nameOf = new Map(s.docs.map((d) => [d.id, d.name]));
  return (
    <>
      <PageTitle title="Overview" text={`Live activity for ${org.name}. Figures reflect only the documents in your workspace.`} action={<Link href="/dashboard/upload" className="btn-primary">Upload Documents</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Documents" value={s.total} href="/dashboard/documents" />
        <StatCard label="Documents Processed" value={s.processed} />
        <StatCard label="Processing Queue" value={s.queue} href="/dashboard/processing" />
        <StatCard label="Successful Extractions" value={s.successfulExtractions} href="/dashboard/extraction" />
        <StatCard label="Documents Awaiting Review" value={s.awaiting} href="/dashboard/documents?status=awaiting_review" />
        <StatCard label="Failed Processing Jobs" value={s.failed} href="/dashboard/documents?status=failed" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><Panel title="Processing activity, last 14 days"><ActivityChart data={s.activity} /></Panel></div>
        <div className="lg:col-span-2"><Panel title="Document categories">{s.categoryData.length ? <CategoryChart data={s.categoryData} /> : <Empty>No documents yet.</Empty>}</Panel></div>
      </div>
      <div className="mt-6"><Panel title="Recent documents" action={<Link href="/dashboard/documents" className="text-sm font-semibold text-brand">View all</Link>}>
        {s.docs.length ? (
          <TableWrap><thead className="bg-mist"><tr><th className="th">Name</th><th className="th">Type</th><th className="th">Status</th><th className="th">Uploaded</th></tr></thead>
            <tbody className="divide-y divide-navy/10">{s.docs.slice(0, 6).map((d) => (
              <tr key={d.id}><td className="td"><Link className="font-medium text-brand" href={`/dashboard/documents/${d.id}`}>{d.name}</Link></td><td className="td uppercase">{d.file_type}</td><td className="td"><StatusBadge status={d.status} /></td><td className="td">{fmtDateTime(d.created_at)}</td></tr>))}</tbody></TableWrap>
        ) : <Empty>Upload your first document to see it here.</Empty>}
      </Panel></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Extraction history">{s.records.length ? <ul className="divide-y divide-navy/10 text-sm">{s.records.slice(0, 5).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0 truncate"><Link className="font-medium text-brand" href={`/dashboard/documents/${r.document_id}`}>{nameOf.get(r.document_id) ?? "Document"}</Link> <span className="text-navy/60">{r.schema_name}</span></span><span className="shrink-0 text-xs capitalize text-navy/60">{r.status.replace("_", " ")}</span></li>))}</ul> : <Empty>No extractions yet.</Empty>}</Panel>
        <Panel title="Recent AI queries">{s.queries.length ? <ul className="divide-y divide-navy/10 text-sm">{s.queries.slice(0, 5).map((q) => (
          <li key={q.id} className="py-2.5"><div className="truncate font-medium">{q.question}</div><div className="text-xs text-navy/60">{fmtDateTime(q.created_at)}</div></li>))}</ul> : <Empty>No questions asked yet.</Empty>}</Panel>
        <Panel title="Workflow activity">{s.execs.length ? <ul className="divide-y divide-navy/10 text-sm">{s.execs.slice(0, 5).map((e: any) => (
          <li key={e.id} className="flex justify-between gap-3 py-2.5"><span className="truncate">{e.workflows?.name}</span><span className="shrink-0 text-xs capitalize text-navy/60">{e.status.replace("_", " ")}</span></li>))}</ul> : <Empty>No workflow runs yet.</Empty>}</Panel>
        <Panel title="Storage usage"><div className="font-heading text-3xl font-extrabold">{fmtBytes(s.storage)}</div><p className="mt-1 text-sm text-navy/60">Across {s.total} documents. Plan storage limits are set by your subscription terms.</p></Panel>
      </div>
    </>
  );
}
