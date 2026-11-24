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
  if (!membership) redirect("/login?error=no_workspace");
  const org = membership.organizations as unknown as { id: string; name: string; retention_days: number | null };
  return { supabase, user, orgId: membership.org_id as string, role: membership.role as Role, org };
}

export const canWrite = (r: Role) => r !== "viewer";
export const isAdmin = (r: Role) => r === "owner" || r === "admin";
