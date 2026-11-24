import { NextResponse } from "next/server";
import { apiCtx } from "@/lib/api";
import { audit } from "@/lib/audit";

/** Streams the original file through an authenticated, RLS checked path. No public URLs are created. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await apiCtx(false);
  if ("error" in c) return c.error;
  const { id } = await params;
  const { data: doc } = await c.supabase.from("documents").select("name, storage_path, mime_type, file_type").eq("id", id).single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await c.supabase.storage.from("documents").download(doc.storage_path);
  if (error || !data) return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  const download = new URL(req.url).searchParams.get("download") === "1";
  if (download) await audit(c.supabase, c.orgId, c.user.id, "document.downloaded", "document", id);
  const type = doc.mime_type || (doc.file_type === "pdf" ? "application/pdf" : "application/octet-stream");
  return new Response(data, { headers: {
    "Content-Type": type,
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(doc.name)}"`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
