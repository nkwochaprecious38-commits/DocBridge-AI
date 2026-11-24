import { getContext } from "@/lib/session";
import { loadStats } from "@/lib/stats";
import { PageTitle, Panel, StatCard, Empty } from "@/components/ui";
import { ActivityChart, CategoryChart, SimpleBar } from "@/components/charts";
import { fmtBytes } from "@/lib/utils";

export default async function Analytics() {
  const { supabase, orgId } = await getContext();
  const s = await loadStats(supabase, orgId);
  const types: Record<string, number> = {};
  s.docs.forEach((d) => (types[d.file_type.toUpperCase()] = (types[d.file_type.toUpperCase()] ?? 0) + 1));
  const statusCount: Record<string, number> = {};
  s.docs.forEach((d) => (statusCount[d.status] = (statusCount[d.status] ?? 0) + 1));
  const wf: Record<string, number> = {};
  s.execs.forEach((e: any) => (wf[e.status.replace("_", " ")] = (wf[e.status.replace("_", " ")] ?? 0) + 1));
  const successRate = s.jobs.length ? Math.round((s.jobs.filter((j) => j.status === "succeeded").length / s.jobs.length) * 100) : null;
  return (
    <>
      <PageTitle title="Analytics" text="Measured from your own workspace activity." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Documents" value={s.total} /><StatCard label="Pages indexed" value={s.docs.reduce((a, d) => a + (d.page_count ?? 0), 0)} />
        <StatCard label="Job success rate" value={successRate === null ? "None" : `${successRate} percent`} /><StatCard label="Storage used" value={fmtBytes(s.storage)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Processing activity, last 14 days"><ActivityChart data={s.activity} /></Panel>
        <Panel title="Documents by category">{s.categoryData.length ? <CategoryChart data={s.categoryData} /> : <Empty>No data yet.</Empty>}</Panel>
        <Panel title="Documents by file type">{Object.keys(types).length ? <SimpleBar label="Documents by file type" data={Object.entries(types).map(([name, value]) => ({ name, value }))} /> : <Empty>No data yet.</Empty>}</Panel>
        <Panel title="Documents by status">{Object.keys(statusCount).length ? <SimpleBar color="#16A6A1" label="Documents by status" data={Object.entries(statusCount).map(([name, value]) => ({ name: name.replace("_", " "), value }))} /> : <Empty>No data yet.</Empty>}</Panel>
        <Panel title="Workflow runs by outcome">{Object.keys(wf).length ? <SimpleBar color="#142B4A" label="Workflow runs by outcome" data={Object.entries(wf).map(([name, value]) => ({ name, value }))} /> : <Empty>No workflow runs yet.</Empty>}</Panel>
        <Panel title="AI usage"><div className="font-heading text-3xl font-extrabold">{s.queries.length}</div><p className="mt-1 text-sm text-navy/60">Recent assistant and comparison queries recorded (last 50 shown).</p></Panel>
      </div>
    </>
  );
}
