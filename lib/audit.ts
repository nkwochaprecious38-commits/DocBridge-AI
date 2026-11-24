import type { SupabaseClient } from "@supabase/supabase-js";

export async function audit(
  supabase: SupabaseClient, orgId: string, userId: string,
  action: string, entity?: string, entityId?: string, meta?: Record<string, unknown>
) {
  await supabase.from("audit_logs").insert({ org_id: orgId, user_id: userId, action, entity, entity_id: entityId, meta });
}
