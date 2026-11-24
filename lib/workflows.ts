import type { SupabaseClient } from "@supabase/supabase-js";

type Ctx = { supabase: SupabaseClient; orgId: string; userId: string };
export type Step = { type: StepType; params?: Record<string, any> };
export type StepType = "detect_type" | "extract" | "validate" | "flag_missing" | "save" | "require_approval" | "assign_task" | "notify";

export const STEP_LABEL: Record<StepType, string> = {
  detect_type: "Detect the document type",
  extract: "Extract structured information",
  validate: "Validate required fields",
  flag_missing: "Flag missing information",
  save: "Save structured data",
  require_approval: "Wait for human approval",
  assign_task: "Assign a task",
  notify: "Notify the team",
};

export const INVOICE_TEMPLATE: Step[] = [
  { type: "detect_type" }, { type: "extract" }, { type: "validate" }, { type: "flag_missing" },
  { type: "save" }, { type: "notify", params: { message: "A new invoice was processed" } },
];

export async function runMatchingWorkflows(c: Ctx, documentId: string, categoryName: string) {
  const { data: wfs } = await c.supabase.from("workflows").select("*").eq("org_id", c.orgId).eq("enabled", true).eq("trigger_type", "document_uploaded");
  for (const wf of wfs ?? []) {
    if (wf.trigger_category && wf.trigger_category !== categoryName) continue;
    await runWorkflow(c, wf, documentId);
  }
}

export async function runWorkflow(c: Ctx, wf: any, documentId: string, resume?: { executionId: string; from: number }) {
  const { supabase, orgId, userId } = c;
  let execId = resume?.executionId;
  let log: any[] = [];
  if (!execId) {
    const { data } = await supabase.from("workflow_executions").insert({ org_id: orgId, workflow_id: wf.id, document_id: documentId }).select().single();
    execId = data!.id;
  } else {
    const { data } = await supabase.from("workflow_executions").select("log").eq("id", execId).single();
    log = data?.log ?? [];
  }
  const steps: Step[] = wf.steps ?? [];
  const note = (step: string, status: string, detail?: string) => log.push({ step, status, detail, at: new Date().toISOString() });
  const finish = (status: string, error?: string, next?: number) =>
    supabase.from("workflow_executions").update({ status, error: error ?? null, log, next_step: next ?? 0, finished_at: status === "running" || status === "awaiting_approval" ? null : new Date().toISOString() }).eq("id", execId!);

  try {
    const { data: doc } = await supabase.from("documents").select("id,name,category_id,categories(name)").eq("id", documentId).single();
    const { data: rec } = await supabase.from("extraction_records").select("*").eq("document_id", documentId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    for (let i = resume?.from ?? 0; i < steps.length; i++) {
      const s = steps[i];
      const label = STEP_LABEL[s.type] ?? s.type;
      switch (s.type) {
        case "detect_type":
          note(label, "ok", `Category: ${(doc as any)?.categories?.name ?? "Uncategorized"}`); break;
        case "extract":
          note(label, rec ? "ok" : "skipped", rec ? `Schema: ${rec.schema_name}` : "No extraction schema applies to this category"); break;
        case "validate": {
          const required: string[] = s.params?.required ?? rec?.missing_fields ?? [];
          const missing = rec ? (s.params?.required ? required.filter((f) => rec.data?.[f] == null || rec.data?.[f] === "") : rec.missing_fields) : [];
          note(label, missing.length ? "warning" : "ok", missing.length ? `Missing: ${missing.join(", ")}` : "All required fields present"); break;
        }
        case "flag_missing":
          if (rec?.missing_fields?.length) {
            await supabase.from("tasks").insert({ org_id: orgId, title: `Missing information in ${doc?.name}`, detail: `Fields: ${rec.missing_fields.join(", ")}`, kind: "review", document_id: documentId, execution_id: execId, created_by: userId });
            note(label, "warning", `Created review task for ${rec.missing_fields.length} field(s)`);
          } else note(label, "ok", "Nothing to flag");
          break;
        case "save":
          note(label, rec ? "ok" : "skipped", rec ? "Structured record stored" : "No structured record to save"); break;
        case "assign_task":
          await supabase.from("tasks").insert({ org_id: orgId, title: s.params?.title ?? `Review ${doc?.name}`, assignee: s.params?.assignee ?? userId, kind: "assigned", document_id: documentId, execution_id: execId, created_by: userId });
          note(label, "ok", "Task created"); break;
        case "notify":
          await supabase.from("notifications").insert({ org_id: orgId, user_id: s.params?.user_id ?? userId, title: s.params?.message ?? "Workflow notification", body: doc?.name });
          note(label, "ok", "Notification sent"); break;
        case "require_approval":
          await supabase.from("tasks").insert({ org_id: orgId, title: `Approval needed: ${wf.name}`, detail: doc?.name, kind: "approval", document_id: documentId, execution_id: execId, created_by: userId });
          await supabase.from("agent_runs").insert({ org_id: orgId, agent: "Workflow Agent", document_id: documentId, status: "awaiting_approval", input: { workflow: wf.name }, output: { step: i } });
          note(label, "waiting", "Paused until a person approves");
          await finish("awaiting_approval", undefined, i + 1);
          return;
      }
    }
    await finish("succeeded");
    await supabase.from("agent_runs").insert({ org_id: orgId, agent: "Workflow Agent", document_id: documentId, status: "succeeded", input: { workflow: wf.name }, output: { steps: steps.length } });
  } catch (e: any) {
    note("Error", "failed", e.message);
    await finish("failed", e.message);
  }
}
