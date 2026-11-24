import Link from "next/link";
import { getContext, canWrite } from "@/lib/session";
import { PageTitle, Panel, TableWrap, Empty, Notice } from "@/components/ui";
import { saveSchema, deleteSchema } from "../actions";
import { aiEnabled } from "@/lib/ai";
import { fmtDate } from "@/lib/utils";

export default async function Extraction() {
  const { supabase, orgId, role } = await getContext();
  const [{ data: schemas }, { data: records }] = await Promise.all([
    supabase.from("extraction_schemas").select("*").eq("org_id", orgId).order("name"),
    supabase.from("extraction_records").select("id,document_id,schema_name,status,missing_fields,created_at,documents(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50),
  ]);
  const w = canWrite(role);
  return (
    <>
      <PageTitle title="Data Extraction" text="Define the exact fields to extract. Results are stored as structured JSON that you review, edit and approve in each document workspace." />
      {!aiEnabled && <Notice kind="warn">Extraction needs ANTHROPIC_API_KEY on the server. Schemas can be defined now.</Notice>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Schemas">
          <div className="space-y-3">
            {schemas?.map((s) => (
              <details key={s.id} className="rounded-lg border border-navy/10 p-3"><summary className="flex cursor-pointer items-center justify-between font-semibold">{s.name}<span className="text-xs font-normal text-navy/60">{(s.fields as any[]).length} fields</span></summary>
                <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">{(s.fields as any[]).map((f) => <li key={f.name}>{f.name} <span className="text-xs text-navy/50">{f.type}</span></li>)}</ul>
                {w && <form action={deleteSchema} className="mt-3"><input type="hidden" name="id" value={s.id} /><button className="btn-danger btn-sm">Delete Schema</button></form>}</details>))}
          </div>
        </Panel>
        {w && <Panel title="Create or update a schema">
          <form action={saveSchema} className="space-y-3">
            <div><label className="label" htmlFor="sname">Schema name</label><input id="sname" name="name" required className="input" placeholder="Purchase Order" /></div>
            <div><label className="label" htmlFor="sdesc">Description</label><input id="sdesc" name="description" className="input" /></div>
            <div><label className="label" htmlFor="sfields">Fields, one per line</label><textarea id="sfields" name="fields" required rows={6} className="input font-mono text-xs" placeholder={"po_number\nsupplier\norder_date: date\ntotal: number\nitems: array"} /><p className="mt-1 text-xs text-navy/60">Optional type after a colon: string, number, date or array.</p></div>
            <button className="btn-primary">Save Schema</button>
          </form>
        </Panel>}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Extraction history</h2>
      {records?.length ? (
        <TableWrap><thead className="bg-mist"><tr><th className="th">Document</th><th className="th">Schema</th><th className="th">Status</th><th className="th">Missing fields</th><th className="th">Date</th></tr></thead>
          <tbody className="divide-y divide-navy/10">{records.map((r: any) => (
            <tr key={r.id}><td className="td"><Link href={`/dashboard/documents/${r.document_id}`} className="font-medium text-brand">{r.documents?.name}</Link></td><td className="td">{r.schema_name}</td><td className="td capitalize">{r.status.replace("_", " ")}</td><td className="td">{r.missing_fields?.length ? r.missing_fields.join(", ") : "None"}</td><td className="td">{fmtDate(r.created_at)}</td></tr>))}</tbody></TableWrap>
      ) : <Empty>No extractions yet. Open a document and run extraction.</Empty>}
    </>
  );
}
