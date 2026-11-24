import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext, canWrite } from "@/lib/session";
import { StatusBadge } from "@/components/ui";
import { fmtBytes, fmtDate } from "@/lib/utils";
import { Workspace } from "./workspace";
import { RetryButton } from "./controls";
import { deleteDocument, setDocumentCategory } from "../../actions";

export default async function DocumentWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, role } = await getContext();
  const { data: doc } = await supabase.from("documents").select("*, categories(name)").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!doc) notFound();
  const [{ data: pages }, { data: records }, { data: schemas }, { data: cats }, { data: jobs }, { data: runs }] = await Promise.all([
    supabase.from("document_pages").select("page_number,text,confidence").eq("document_id", id).order("page_number"),
    supabase.from("extraction_records").select("id,schema_name,data,missing_fields,status").eq("document_id", id).order("created_at", { ascending: false }),
    supabase.from("extraction_schemas").select("id,name").eq("org_id", orgId).order("name"),
    supabase.from("categories").select("id,name").eq("org_id", orgId).order("name"),
    supabase.from("processing_jobs").select("id,status,error,created_at,attempts").eq("document_id", id).order("created_at", { ascending: false }),
    supabase.from("agent_runs").select("id,agent,status,output,created_at").eq("document_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  const history = [
    ...(jobs ?? []).map((j) => ({ id: j.id, label: `Processing job, attempt ${j.attempts}`, status: j.status, at: j.created_at, detail: j.error ?? "" })),
    ...(runs ?? []).map((r) => ({ id: r.id, label: r.agent, status: r.status, at: r.created_at, detail: r.output ? JSON.stringify(r.output) : "" })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const w = canWrite(role);
  return (
    <>
      <Link href="/dashboard/documents" className="text-sm font-semibold text-brand">Back to Documents</Link>
      <div className="card mt-3 mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><h1 className="break-words text-2xl font-bold">{doc.name}</h1>
            <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-navy/60">File type</dt><dd className="font-medium uppercase">{doc.file_type}</dd></div>
              <div><dt className="text-xs text-navy/60">Uploaded</dt><dd className="font-medium">{fmtDate(doc.created_at)}</dd></div>
              <div><dt className="text-xs text-navy/60">Pages</dt><dd className="font-medium">{doc.page_count || "None"}</dd></div>
              <div><dt className="text-xs text-navy/60">Size</dt><dd className="font-medium">{doc.size_bytes ? fmtBytes(doc.size_bytes) : "Split from parent"}</dd></div>
              <div><dt className="text-xs text-navy/60">Status</dt><dd className="mt-0.5"><StatusBadge status={doc.status} /></dd></div>
              <div className="col-span-2"><dt className="text-xs text-navy/60">Category</dt>
                <dd>{w ? <form action={setDocumentCategory} className="flex gap-2"><input type="hidden" name="id" value={id} /><select name="category_id" defaultValue={doc.category_id ?? ""} className="input !py-1.5" aria-label="Category"><option value="">None</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="btn-secondary btn-sm">Save</button></form> : (doc as any).categories?.name ?? "None"}</dd></div>
            </dl></div>
          <div className="flex flex-wrap gap-2">
            {!doc.parent_id && <a className="btn-secondary" href={`/api/app/documents/${id}/file?download=1`}>Download Original</a>}
            <a className="btn-secondary" href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ name: doc.name, pages, structured_data: records, summary: doc.summary }, null, 2))}`} download={`${doc.name}.processed.json`}>Download Processed JSON</a>
            {w && doc.status === "failed" && <RetryButton id={id} />}
            {w && <form action={deleteDocument}><input type="hidden" name="id" value={id} /><button className="btn-danger">Delete</button></form>}
          </div>
        </div>
        {doc.error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Processing error: {doc.error}</div>}
      </div>
      <Workspace doc={{ id, file_type: doc.file_type, page_count: doc.page_count, page_range: doc.page_range, summary: doc.summary, ocr_used: doc.ocr_used, status: doc.status, canWrite: w }}
        pages={pages ?? []} records={records ?? []} schemas={schemas ?? []} history={history} />
    </>
  );
}
