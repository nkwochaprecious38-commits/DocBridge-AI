import { getContext, isAdmin } from "@/lib/session";
import { PageTitle, Panel, TableWrap, Empty } from "@/components/ui";
import { saveSettings, deleteAllDocuments } from "../actions";
import { aiEnabled } from "@/lib/ai";
import { PLANS } from "@/lib/plans";
import { fmtDateTime } from "@/lib/utils";

const INTEGRATIONS = [
  { n: "AI language model (Anthropic)", on: aiEnabled, env: "ANTHROPIC_API_KEY" },
  { n: "LlamaParse (optional parser)", on: Boolean(process.env.LLAMA_CLOUD_API_KEY), env: "LLAMA_CLOUD_API_KEY" },
  { n: "Google Drive", on: false, env: "Connector not built" }, { n: "Microsoft SharePoint", on: false, env: "Connector not built" },
  { n: "OneDrive", on: false, env: "Connector not built" }, { n: "Dropbox", on: false, env: "Connector not built" },
  { n: "Amazon S3", on: false, env: "Connector not built" }, { n: "Google Cloud Storage", on: false, env: "Connector not built" },
  { n: "External vector database", on: false, env: "Not connected. Search uses Postgres full text indexing" },
];

export default async function Settings() {
  const { supabase, orgId, role, org, user } = await getContext();
  const admin = isAdmin(role);
  const [{ data: profile }, { data: sub }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin ? supabase.from("audit_logs").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(25) : Promise.resolve({ data: [] as any[] }),
  ]);
  return (
    <>
      <PageTitle title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile and workspace"><form action={saveSettings} className="space-y-3">
          <div><label className="label" htmlFor="fn">Your name</label><input id="fn" name="full_name" defaultValue={profile?.full_name ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="em">Email</label><input id="em" value={user.email ?? ""} disabled className="input bg-mist" /></div>
          {admin && <><div><label className="label" htmlFor="on">Organization name</label><input id="on" name="org_name" defaultValue={org.name} className="input" /></div>
            <div><label className="label" htmlFor="rd">Document retention in days</label><input id="rd" name="retention_days" type="number" min={1} defaultValue={org.retention_days ?? ""} placeholder="Keep indefinitely" className="input" /><p className="mt-1 text-xs text-navy/60">Retention is enforced by the scheduled purge function described in the README.</p></div></>}
          <button className="btn-primary">Save Settings</button></form></Panel>
        <Panel title="Subscription">
          {sub ? <p className="text-sm">Plan: <strong className="capitalize">{sub.plan}</strong>, status {sub.status}.</p> : <p className="text-sm text-navy/70">No subscription is recorded for this workspace. Choose a plan on the Pricing page to subscribe through Selar.</p>}
          <ul className="mt-3 space-y-1 text-sm">{PLANS.map((p) => <li key={p.id}><a className="font-semibold text-brand" target="_blank" rel="noopener noreferrer" href={p.url}>{p.name}</a> {p.price} {p.period}</li>)}</ul></Panel>
        <Panel title="Integrations and credentials"><ul className="divide-y divide-navy/10 text-sm">{INTEGRATIONS.map((i) => <li key={i.n} className="flex items-center justify-between gap-3 py-2"><span>{i.n}</span><span className={`text-right text-xs font-semibold ${i.on ? "text-emerald-700" : "text-navy/50"}`}>{i.on ? "Configured" : `Not configured: ${i.env}`}</span></li>)}</ul><p className="mt-3 text-xs text-navy/60">Status reflects server environment variables only. An integration is not live until it has been configured and tested.</p></Panel>
        {admin && <Panel title="Data export and deletion">
          <p className="mb-3 text-sm text-navy/70">Export all workspace records as JSON. Original files can be downloaded from each document.</p>
          <a href="/api/app/export" className="btn-secondary">Export Workspace Data</a>
          {role === "owner" && <form action={deleteAllDocuments} className="mt-6 border-t border-navy/10 pt-5"><p className="mb-3 text-sm text-navy/70">Permanently delete every document, extracted text and stored file in this workspace. This cannot be undone.</p><button className="btn-danger">Delete All Documents</button></form>}</Panel>}
      </div>
      {admin && <><h2 className="mb-3 mt-8 text-lg font-bold">Audit log</h2>{logs?.length ? <TableWrap><thead className="bg-mist"><tr><th className="th">When</th><th className="th">Action</th><th className="th">Entity</th></tr></thead><tbody className="divide-y divide-navy/10">{logs.map((l: any) => <tr key={l.id}><td className="td">{fmtDateTime(l.created_at)}</td><td className="td">{l.action}</td><td className="td text-xs text-navy/60">{l.entity} {String(l.entity_id ?? "").slice(0, 8)}</td></tr>)}</tbody></TableWrap> : <Empty>No audit entries yet.</Empty>}</>}
    </>
  );
}
