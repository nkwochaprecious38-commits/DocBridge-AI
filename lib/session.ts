import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "admin" | "member" | "viewer";

export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(id, name, retention_days)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  let m = membership;
  if (!m) {
    // Self repair: create the workspace if the signup trigger did not. Never redirect to /login here (it loops).
    const { error } = await supabase.rpc("ensure_workspace");
    if (error) throw new Error(`Your workspace could not be created: ${error.message}. Run supabase/migrations/0003_ensure_workspace.sql.`);
    const { data } = await supabase.from("memberships").select("org_id, role, organizations(id, name, retention_days)").eq("user_id", user.id).limit(1).maybeSingle();
    m = data;
  }
  if (!m) throw new Error("No workspace is available for this account. Check the database policies in Supabase.");
  const org = m.organizations as unknown as { id: string; name: string; retention_days: number | null };
  return { supabase, user, orgId: m.org_id as string, role: m.role as Role, org };
}

export const canWrite = (r: Role) => r !== "viewer";
export const isAdmin = (r: Role) => r === "owner" || r === "admin";
