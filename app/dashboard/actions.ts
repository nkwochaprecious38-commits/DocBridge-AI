"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext, canWrite, isAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";
import { INVOICE_TEMPLATE, runWorkflow } from "@/lib/workflows";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createCategory(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const name = s(fd, "name"); if (!name) return;
  await c.supabase.from("categories").insert({ org_id: c.orgId, name, color: s(fd, "color") || "#2463EB" });
  await audit(c.supabase, c.orgId, c.user.id, "category.created", "category", name);
  revalidatePath("/dashboard/categories");
}
export async function deleteCategory(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  await c.supabase.from("categories").delete().eq("id", s(fd, "id")).eq("is_default", false);
  revalidatePath("/dashboard/categories");
}
export async function setDocumentCategory(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const id = s(fd, "id");
  await c.supabase.from("documents").update({ category_id: s(fd, "category_id") || null }).eq("id", id);
  revalidatePath(`/dashboard/documents/${id}`);
}
export async function saveSchema(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const name = s(fd, "name"); if (!name) return;
  const fields = s(fd, "fields").split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean).map((x) => {
    const [n, t] = x.split(":").map((y) => y.trim());
    return { name: n.toLowerCase().replace(/\s+/g, "_"), type: ["string", "number", "date", "array"].includes(t) ? t : "string" };
  });
  if (!fields.length) return;
  await c.supabase.from("extraction_schemas").upsert({ org_id: c.orgId, name, description: s(fd, "description"), fields }, { onConflict: "org_id,name" });
  await audit(c.supabase, c.orgId, c.user.id, "schema.saved", "schema", name);
  revalidatePath("/dashboard/extraction");
}
export async function deleteSchema(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  await c.supabase.from("extraction_schemas").delete().eq("id", s(fd, "id"));
  revalidatePath("/dashboard/extraction");
}
export async function createKnowledgeBase(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const name = s(fd, "name"); if (!name) return;
  await c.supabase.from("knowledge_bases").insert({ org_id: c.orgId, name, description: s(fd, "description") });
  revalidatePath("/dashboard/knowledge");
}
export async function deleteKnowledgeBase(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  await c.supabase.from("knowledge_bases").delete().eq("id", s(fd, "id"));
  revalidatePath("/dashboard/knowledge");
}
export async function setKbDocuments(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const kb = s(fd, "kb_id");
  const ids = fd.getAll("document_ids").map(String);
  await c.supabase.from("knowledge_base_documents").delete().eq("kb_id", kb);
  if (ids.length) await c.supabase.from("knowledge_base_documents").insert(ids.map((d) => ({ kb_id: kb, document_id: d, org_id: c.orgId })));
  revalidatePath("/dashboard/knowledge");
}
export async function saveWorkflow(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const name = s(fd, "name"); if (!name) return;
  const steps = fd.getAll("steps").map(String).filter(Boolean).map((t) => ({ type: t }));
  if (!steps.length) return;
  await c.supabase.from("workflows").insert({ org_id: c.orgId, name, trigger_type: "document_uploaded", trigger_category: s(fd, "category") || null, steps });
  await audit(c.supabase, c.orgId, c.user.id, "workflow.created", "workflow", name);
  revalidatePath("/dashboard/workflows");
}
export async function createInvoiceTemplate() {
  const c = await getContext(); if (!canWrite(c.role)) return;
  await c.supabase.from("workflows").insert({ org_id: c.orgId, name: "Invoice intake", trigger_type: "document_uploaded", trigger_category: "Invoices", steps: INVOICE_TEMPLATE });
  revalidatePath("/dashboard/workflows");
}
export async function toggleWorkflow(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  await c.supabase.from("workflows").update({ enabled: s(fd, "enabled") === "true" }).eq("id", s(fd, "id"));
  revalidatePath("/dashboard/workflows");
}
export async function deleteWorkflow(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  await c.supabase.from("workflows").delete().eq("id", s(fd, "id"));
  revalidatePath("/dashboard/workflows");
}
export async function runWorkflowNow(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const { data: wf } = await c.supabase.from("workflows").select("*").eq("id", s(fd, "id")).single();
  const doc = s(fd, "document_id");
  if (wf && doc) await runWorkflow({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, wf, doc);
  revalidatePath("/dashboard/workflows");
}
export async function createTask(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const title = s(fd, "title"); if (!title) return;
  await c.supabase.from("tasks").insert({ org_id: c.orgId, title, detail: s(fd, "detail"), assignee: s(fd, "assignee") || c.user.id, created_by: c.user.id });
  revalidatePath("/dashboard/tasks");
}
export async function updateTask(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const id = s(fd, "id"), status = s(fd, "status");
  await c.supabase.from("tasks").update({ status }).eq("id", id);
  revalidatePath("/dashboard/tasks");
}
/** Approval tasks resume or reject the paused workflow execution. */
export async function decideApproval(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const id = s(fd, "id"), approve = s(fd, "decision") === "approve";
  const { data: task } = await c.supabase.from("tasks").select("*").eq("id", id).single();
  if (!task) return;
  await c.supabase.from("tasks").update({ status: approve ? "done" : "cancelled" }).eq("id", id);
  await audit(c.supabase, c.orgId, c.user.id, approve ? "approval.granted" : "approval.rejected", "task", id);
  if (task.execution_id) {
    const { data: ex } = await c.supabase.from("workflow_executions").select("*, workflows(*)").eq("id", task.execution_id).single();
    if (ex && ex.status === "awaiting_approval") {
      if (approve) await runWorkflow({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, (ex as any).workflows, ex.document_id, { executionId: ex.id, from: ex.next_step });
      else await c.supabase.from("workflow_executions").update({ status: "rejected", finished_at: new Date().toISOString() }).eq("id", ex.id);
    }
  }
  revalidatePath("/dashboard/tasks");
}
export async function addMember(fd: FormData) {
  const c = await getContext(); if (!isAdmin(c.role)) return;
  const { data } = await c.supabase.rpc("add_member_by_email", { p_org: c.orgId, p_email: s(fd, "email"), p_role: s(fd, "role") || "member" });
  await audit(c.supabase, c.orgId, c.user.id, "member.added", "member", s(fd, "email"), { result: data });
  redirect(`/dashboard/team?added=${data === "ok" ? "1" : "notfound"}`);
}
export async function changeRole(fd: FormData) {
  const c = await getContext(); if (!isAdmin(c.role)) return;
  await c.supabase.from("memberships").update({ role: s(fd, "role") }).eq("org_id", c.orgId).eq("user_id", s(fd, "user_id"));
  revalidatePath("/dashboard/team");
}
export async function removeMember(fd: FormData) {
  const c = await getContext(); if (!isAdmin(c.role)) return;
  await c.supabase.from("memberships").delete().eq("org_id", c.orgId).eq("user_id", s(fd, "user_id"));
  await audit(c.supabase, c.orgId, c.user.id, "member.removed", "member", s(fd, "user_id"));
  revalidatePath("/dashboard/team");
}
export async function saveSettings(fd: FormData) {
  const c = await getContext();
  await c.supabase.from("profiles").update({ full_name: s(fd, "full_name") }).eq("id", c.user.id);
  if (isAdmin(c.role)) {
    const days = parseInt(s(fd, "retention_days"));
    await c.supabase.from("organizations").update({ name: s(fd, "org_name") || c.org.name, retention_days: days > 0 ? days : null }).eq("id", c.orgId);
    await audit(c.supabase, c.orgId, c.user.id, "settings.updated", "organization", c.orgId);
  }
  revalidatePath("/dashboard", "layout");
}
/** Deletes every document and its stored file for the organization. Owner only. */
export async function deleteAllDocuments() {
  const c = await getContext(); if (c.role !== "owner") return;
  const { data: docs } = await c.supabase.from("documents").select("id, storage_path").eq("org_id", c.orgId);
  const paths = Array.from(new Set((docs ?? []).filter((d) => !d.storage_path.startsWith("split:")).map((d) => d.storage_path)));
  for (let i = 0; i < paths.length; i += 100) await c.supabase.storage.from("documents").remove(paths.slice(i, i + 100));
  await c.supabase.from("documents").delete().eq("org_id", c.orgId);
  await audit(c.supabase, c.orgId, c.user.id, "documents.deleted_all", "organization", c.orgId, { count: docs?.length ?? 0 });
  revalidatePath("/dashboard", "layout");
}
export async function deleteDocument(fd: FormData) {
  const c = await getContext(); if (!canWrite(c.role)) return;
  const id = s(fd, "id");
  const { data: d } = await c.supabase.from("documents").select("storage_path, parent_id").eq("id", id).single();
  if (d && !d.parent_id) await c.supabase.storage.from("documents").remove([d.storage_path]);
  await c.supabase.from("documents").delete().eq("id", id);
  await audit(c.supabase, c.orgId, c.user.id, "document.deleted", "document", id);
  redirect("/dashboard/documents");
}
