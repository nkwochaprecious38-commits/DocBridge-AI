import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { processDocument } from "@/lib/pipeline";
import { ALLOWED_EXT } from "@/lib/utils";
import { mimeFor } from "@/lib/parse";
import { audit } from "@/lib/audit";

export const maxDuration = 300;
const MAX = 25 * 1024 * 1024;

export async function POST(req: Request) {
  const c = await apiCtx();
  if ("error" in c) return c.error;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) return NextResponse.json({ error: `.${ext} files are not supported` }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ error: "File exceeds the 25 MB limit" }, { status: 413 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });

  const folder = String(form.get("folder") || "/").slice(0, 200);
  const tags = String(form.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);
  const safe = file.name.replace(/[^A-Za-z0-9._ ]/g, "_");
  const path = `${c.orgId}/${crypto.randomUUID()}/${safe}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const up = await c.supabase.storage.from("documents").upload(path, buf, { contentType: file.type || mimeFor(ext), upsert: false });
  if (up.error) return NextResponse.json({ error: `Storage error: ${up.error.message}` }, { status: 500 });

  const { data: doc, error } = await c.supabase.from("documents").insert({
    org_id: c.orgId, uploaded_by: c.user.id, name: file.name, file_type: ext, mime_type: file.type, size_bytes: file.size,
    storage_path: path, folder, tags, status: "uploaded",
  }).select("id").single();
  if (error || !doc) {
    await c.supabase.storage.from("documents").remove([path]);
    return NextResponse.json({ error: error?.message ?? "Could not save document" }, { status: 500 });
  }
  await audit(c.supabase, c.orgId, c.user.id, "document.uploaded", "document", doc.id, { name: file.name });
  const result = await processDocument({ supabase: c.supabase, orgId: c.orgId, userId: c.user.id }, doc.id);
  return NextResponse.json({ id: doc.id, ...result });
}
