import Link from "next/link";
import { getContext } from "@/lib/session";
import { PageTitle, StatusBadge, TableWrap, Empty } from "@/components/ui";
import { fmtBytes, fmtDate, STATUS_LABEL } from "@/lib/utils";

export default async function Documents({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase, orgId } = await getContext();
  let q = supabase.from("documents").select("id,name,file_type,size_bytes,status,created_at,page_count,folder,tags,categories(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(500);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.category) q = q.eq("category_id", sp.category);
  if (sp.q) q = q.ilike("name", `%${sp.q.replace(/[%,]/g, "")}%`);
  const [{ data: docs }, { data: cats }] = await Promise.all([q, supabase.from("categories").select("id,name").eq("org_id", orgId).order("name")]);
  return (
    <>
      <PageTitle title="Documents" text="Every document in your workspace, with its status and category." action={<Link href="/dashboard/upload" className="btn-primary">Upload Documents</Link>} />
      <form className="mb-4 grid gap-3 sm:grid-cols-4">
        <input name="q" defaultValue={sp.q} placeholder="Search by file name" className="input sm:col-span-2" aria-label="Search by file name" />
        <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Status"><option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <div className="flex gap-2"><select name="category" defaultValue={sp.category ?? ""} className="input" aria-label="Category"><option value="">All categories</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="btn-secondary">Filter</button></div>
      </form>
      {docs?.length ? (
        <TableWrap><thead className="bg-mist"><tr><th className="th">Name</th><th className="th">Type</th><th className="th">Category</th><th className="th">Pages</th><th className="th">Size</th><th className="th">Status</th><th className="th">Uploaded</th></tr></thead>
          <tbody className="divide-y divide-navy/10">{docs.map((d: any) => (
            <tr key={d.id}><td className="td"><Link className="font-medium text-brand" href={`/dashboard/documents/${d.id}`}>{d.name}</Link><div className="text-xs text-navy/50">{d.folder}{d.tags?.length ? `  Tags: ${d.tags.join(", ")}` : ""}</div></td>
              <td className="td uppercase">{d.file_type}</td><td className="td">{d.categories?.name ?? "None"}</td><td className="td">{d.page_count || "None"}</td><td className="td">{d.size_bytes ? fmtBytes(d.size_bytes) : "Split"}</td><td className="td"><StatusBadge status={d.status} /></td><td className="td">{fmtDate(d.created_at)}</td></tr>))}</tbody></TableWrap>
      ) : <Empty>No documents match. <Link href="/dashboard/upload" className="font-semibold text-brand">Upload documents</Link> to get started.</Empty>}
    </>
  );
}
