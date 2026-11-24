import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/session";

export async function apiCtx(write = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const { data: m } = await supabase.from("memberships").select("org_id, role").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
  if (!m) return { error: NextResponse.json({ error: "No workspace" }, { status: 403 }) } as const;
  if (write && m.role === "viewer") return { error: NextResponse.json({ error: "Your role is read only" }, { status: 403 }) } as const;
  return { supabase, user, orgId: m.org_id as string, role: m.role as Role };
}
