import { getContext, isAdmin } from "@/lib/session";
import { PageTitle, Panel, TableWrap, Notice } from "@/components/ui";
import { addMember, changeRole, removeMember } from "../actions";
import { fmtDate } from "@/lib/utils";

const ROLES = ["admin", "member", "viewer"];
export default async function Team({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const sp = await searchParams;
  const { supabase, orgId, role, user } = await getContext();
  const { data: members } = await supabase.rpc("list_members", { p_org: orgId });
  const admin = isAdmin(role);
  return (
    <>
      <PageTitle title="Team Management" text="Roles: owner and admin manage the workspace, members upload and process documents, viewers have read only access." />
      {sp.added === "1" && <Notice>Member added.</Notice>}
      {sp.added === "notfound" && <Notice kind="warn">No registered account uses that email. Ask the person to create a DocBridge account first, then add them here.</Notice>}
      <TableWrap><thead className="bg-mist"><tr><th className="th">Member</th><th className="th">Role</th><th className="th">Joined</th><th className="th"></th></tr></thead>
        <tbody className="divide-y divide-navy/10">{(members as any[] | null)?.map((m) => (
          <tr key={m.user_id}><td className="td"><div className="font-medium">{m.full_name || m.email}</div><div className="text-xs text-navy/60">{m.email}{m.user_id === user.id ? " (you)" : ""}</div></td>
            <td className="td">{admin && m.role !== "owner" ? <form action={changeRole} className="flex gap-2"><input type="hidden" name="user_id" value={m.user_id} /><select name="role" defaultValue={m.role} className="input !py-1.5" aria-label={`Role for ${m.email}`}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select><button className="btn-secondary btn-sm">Update</button></form> : <span className="capitalize">{m.role}</span>}</td>
            <td className="td">{fmtDate(m.created_at)}</td>
            <td className="td">{admin && m.role !== "owner" && <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><button className="btn-danger btn-sm">Remove</button></form>}</td></tr>))}</tbody></TableWrap>
      {admin && <div className="mt-6 max-w-lg"><Panel title="Add a team member"><form action={addMember} className="space-y-3">
        <div><label className="label" htmlFor="me">Email of an existing DocBridge account</label><input id="me" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="mr">Role</label><select id="mr" name="role" className="input" defaultValue="member">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
        <button className="btn-primary">Add Member</button></form></Panel></div>}
    </>
  );
}
