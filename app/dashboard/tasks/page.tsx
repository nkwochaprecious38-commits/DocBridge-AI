import Link from "next/link";
import { getContext, canWrite } from "@/lib/session";
import { PageTitle, Panel, Empty } from "@/components/ui";
import { createTask, updateTask, decideApproval } from "../actions";
import { fmtDateTime } from "@/lib/utils";

export default async function Tasks() {
  const { supabase, orgId, role, user } = await getContext();
  const [{ data: tasks }, { data: notes }, { data: runs }] = await Promise.all([
    supabase.from("tasks").select("*, documents(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(100),
    supabase.from("notifications").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(10),
    supabase.from("agent_runs").select("id").eq("org_id", orgId).eq("status", "awaiting_approval"),
  ]);
  const w = canWrite(role);
  const open = tasks?.filter((t) => t.status === "open" || t.status === "in_progress") ?? [];
  const closed = tasks?.filter((t) => t.status === "done" || t.status === "cancelled") ?? [];
  return (
    <>
      <PageTitle title="Tasks" text="Review items, assigned work and approvals requested by workflows." />
      {(runs?.length ?? 0) > 0 && <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{runs!.length} agent action(s) are waiting for human approval below.</div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold">Open</h2>
          {open.length ? open.map((t: any) => (
            <div key={t.id} className="card p-4"><div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-semibold">{t.title}</div>{t.detail && <div className="text-sm text-navy/70">{t.detail}</div>}
                <div className="mt-1 text-xs text-navy/60">{t.kind === "approval" ? "Approval request" : t.kind === "review" ? "Review" : "Task"} · {fmtDateTime(t.created_at)}{t.assignee === user.id ? " · Assigned to you" : ""}{t.documents?.name && <> · <Link href={`/dashboard/documents/${t.document_id}`} className="text-brand">{t.documents.name}</Link></>}</div></div>
              {w && (t.kind === "approval" ? (
                <form action={decideApproval} className="flex gap-2"><input type="hidden" name="id" value={t.id} /><button name="decision" value="approve" className="btn-primary btn-sm">Approve</button><button name="decision" value="reject" className="btn-danger btn-sm">Reject</button></form>
              ) : (
                <form action={updateTask} className="flex gap-2"><input type="hidden" name="id" value={t.id} /><button name="status" value="done" className="btn-primary btn-sm">Mark Done</button><button name="status" value="cancelled" className="btn-secondary btn-sm">Cancel</button></form>))}
            </div></div>)) : <Empty>No open tasks.</Empty>}
          {closed.length > 0 && <><h2 className="pt-4 text-lg font-bold">Closed</h2>{closed.slice(0, 10).map((t) => <div key={t.id} className="card p-3 text-sm text-navy/60">{t.title} <span className="text-xs capitalize">({t.status})</span></div>)}</>}
        </div>
        <div className="space-y-6">
          {w && <Panel title="New task"><form action={createTask} className="space-y-3"><div><label className="label" htmlFor="tt">Title</label><input id="tt" name="title" required className="input" /></div><div><label className="label" htmlFor="td">Details</label><textarea id="td" name="detail" rows={3} className="input" /></div><button className="btn-primary">Create Task</button></form></Panel>}
          <Panel title="Notifications">{notes?.length ? <ul className="space-y-2 text-sm">{notes.map((n) => <li key={n.id}><div className="font-medium">{n.title}</div><div className="text-xs text-navy/60">{n.body} · {fmtDateTime(n.created_at)}</div></li>)}</ul> : <Empty>No notifications.</Empty>}</Panel>
        </div>
      </div>
    </>
  );
}
