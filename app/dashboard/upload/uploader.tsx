"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { ALLOWED_EXT, fmtBytes } from "@/lib/utils";

type Item = { file: File; state: "queued" | "uploading" | "done" | "error"; message?: string; id?: string };

export function Uploader() {
  const [items, setItems] = useState<Item[]>([]);
  const [folder, setFolder] = useState("/");
  const [tags, setTags] = useState("");
  const [drag, setDrag] = useState(false);
  const [running, setRunning] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function add(list: FileList | File[]) {
    const next: Item[] = [];
    for (const file of Array.from(list)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXT.includes(ext)) next.push({ file, state: "error", message: `.${ext} is not supported` });
      else if (file.size > 25 * 1024 * 1024) next.push({ file, state: "error", message: "Larger than 25 MB" });
      else next.push({ file, state: "queued" });
    }
    setItems((p) => [...p, ...next]);
  }
  const patch = (i: number, v: Partial<Item>) => setItems((p) => p.map((x, k) => (k === i ? { ...x, ...v } : x)));

  async function run() {
    setRunning(true);
    const queue = items.map((x, i) => ({ x, i })).filter(({ x }) => x.state === "queued");
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const { x, i } = queue[cursor++];
        patch(i, { state: "uploading" });
        const fd = new FormData();
        fd.append("file", x.file); fd.append("folder", folder || "/"); fd.append("tags", tags);
        try {
          const res = await fetch("/api/app/documents", { method: "POST", body: fd });
          const j = await res.json();
          if (!res.ok) patch(i, { state: "error", message: j.error });
          else if (j.ok === false) patch(i, { state: "error", message: `Uploaded, but processing failed: ${j.error}`, id: j.id });
          else patch(i, { state: "done", id: j.id });
        } catch { patch(i, { state: "error", message: "Network error" }); }
      }
    };
    await Promise.all([worker(), worker()]);
    setRunning(false);
  }
  const pending = items.filter((x) => x.state === "queued").length;

  return (
    <div className="space-y-5">
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={`card flex flex-col items-center gap-3 border-2 border-dashed p-10 text-center ${drag ? "border-brand bg-brand/5" : "border-navy/20"}`}>
        <UploadCloud className="h-10 w-10 text-brand" />
        <p className="font-heading font-bold">Drag and drop documents here</p>
        <p className="text-sm text-navy/60">PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, CSV, PNG, JPG, JPEG. Up to 25 MB each.</p>
        <button type="button" className="btn-secondary" onClick={() => input.current?.click()}>Choose Files</button>
        <input ref={input} type="file" multiple hidden aria-label="Choose files" accept={ALLOWED_EXT.map((e) => "." + e).join(",")} onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </div>
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="folder">Folder</label><input id="folder" className="input" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="/Contracts/2026" /></div>
        <div><label className="label" htmlFor="tags">Tags (comma separated)</label><input id="tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="supplier, renewal" /></div>
      </div>
      {items.length > 0 && (
        <div className="card divide-y divide-navy/10">
          {items.map((x, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0"><div className="truncate font-medium">{x.file.name}</div><div className="text-xs text-navy/60">{fmtBytes(x.file.size)}</div>
                {x.message && <div className="mt-1 text-xs text-red-600">{x.message}{x.id && <> <Link className="font-semibold underline" href={`/dashboard/documents/${x.id}`}>Open</Link></>}</div>}</div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`text-xs font-semibold ${x.state === "done" ? "text-emerald-700" : x.state === "error" ? "text-red-600" : "text-navy/60"}`}>
                  {x.state === "queued" ? "Queued" : x.state === "uploading" ? "Uploading and processing" : x.state === "done" ? "Processed" : "Failed"}</span>
                {x.state === "done" && x.id && <Link href={`/dashboard/documents/${x.id}`} className="btn-secondary btn-sm">Open</Link>}
                {(x.state === "queued" || x.state === "error") && !running && <button aria-label="Remove file" onClick={() => setItems((p) => p.filter((_, k) => k !== i))}><X className="h-4 w-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={!pending || running} onClick={run}>{running ? "Processing" : `Upload ${pending || ""} File${pending === 1 ? "" : "s"}`}</button>
        {items.length > 0 && !running && <button className="btn-secondary" onClick={() => setItems([])}>Clear List</button>}
      </div>
      <p className="text-xs text-navy/60">Cloud storage imports (Google Drive, SharePoint, OneDrive, Dropbox, Amazon S3, Google Cloud Storage) are not connected in this deployment. See Settings for integration status.</p>
    </div>
  );
}
