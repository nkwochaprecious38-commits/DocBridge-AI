import Link from "next/link";
import { getContext, canWrite } from "@/lib/session";
import { PageTitle, Panel } from "@/components/ui";
import { createCategory, deleteCategory } from "../actions";

export default async function Categories() {
  const { supabase, orgId, role } = await getContext();
  const [{ data: cats }, { data: docs }] = await Promise.all([
    supabase.from("categories").select("*").eq("org_id", orgId).order("name"),
    supabase.from("documents").select("category_id").eq("org_id", orgId),
  ]);
  const count = (id: string) => docs?.filter((d) => d.category_id === id).length ?? 0;
  const w = canWrite(role);
  return (
    <>
      <PageTitle title="Document Categories" text="Documents are classified automatically into these categories. Create custom categories for your own document types." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          {cats?.map((c) => (
            <div key={c.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ background: c.color }} /><div><Link href={`/dashboard/documents?category=${c.id}`} className="font-semibold hover:text-brand">{c.name}</Link><div className="text-xs text-navy/60">{count(c.id)} documents{c.is_default ? ", default" : ", custom"}</div></div></div>
              {w && !c.is_default && <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="btn-danger btn-sm">Delete</button></form>}
            </div>))}
        </div>
        {w && <Panel title="Add a category"><form action={createCategory} className="space-y-3">
          <div><label className="label" htmlFor="cname">Name</label><input id="cname" name="name" required className="input" /></div>
          <div><label className="label" htmlFor="ccolor">Color</label><input id="ccolor" name="color" type="color" defaultValue="#2463EB" className="h-10 w-full rounded-lg border border-navy/20" /></div>
          <button className="btn-primary">Add Category</button></form></Panel>}
      </div>
    </>
  );
}
