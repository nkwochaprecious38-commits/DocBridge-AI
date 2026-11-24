import { aiEnabled, ocrWithModel } from "@/lib/ai";

export type ParsedPage = { text: string; confidence: number | null };
export type ParseResult = { pages: ParsedPage[]; ocrUsed: boolean; warnings: string[] };

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", pdf: "application/pdf" };
export const mimeFor = (ext: string) => MIME[ext] || "application/octet-stream";

function chunk(text: string, size = 3500): ParsedPage[] {
  const t = text.trim();
  if (!t) return [{ text: "", confidence: null }];
  const out: ParsedPage[] = [];
  for (let i = 0; i < t.length; i += size) out.push({ text: t.slice(i, i + size), confidence: null });
  return out;
}

async function llamaParse(buf: Buffer, name: string): Promise<string[]> {
  const key = process.env.LLAMA_CLOUD_API_KEY!;
  const base = "https://api.cloud.llamaindex.ai/api/v1/parsing";
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)]), name);
  const up = await fetch(`${base}/upload`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!up.ok) throw new Error(`LlamaParse upload failed (${up.status})`);
  const { id } = await up.json();
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(`${base}/job/${id}`, { headers: { Authorization: `Bearer ${key}` } });
    const j = await st.json();
    if (j.status === "SUCCESS") {
      const r = await fetch(`${base}/job/${id}/result/markdown`, { headers: { Authorization: `Bearer ${key}` } });
      const { markdown } = await r.json();
      return String(markdown).split(/\n---\n|\f/).map((s) => s.trim()).filter(Boolean);
    }
    if (j.status === "ERROR" || j.status === "CANCELED") throw new Error("LlamaParse job failed");
  }
  throw new Error("LlamaParse timed out");
}

export async function parseFile(buf: Buffer, ext: string, name: string): Promise<ParseResult> {
  const warnings: string[] = [];
  const llama = Boolean(process.env.LLAMA_CLOUD_API_KEY);

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const pages: string[] = [];
    let total = 0;
    try {
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      const res = await parser.getText();
      await parser.destroy();
      total = res.total;
      for (const pg of res.pages) pages.push(pg.text.trim());
    } catch (e: any) {
      warnings.push(`Embedded text extraction failed: ${e.message}`);
    }
    const chars = pages.join("").replace(/\s/g, "").length;
    const scanned = pages.length === 0 || chars < 30 * Math.max(1, total);
    if (!scanned) return { pages: pages.map((text) => ({ text, confidence: null })), ocrUsed: false, warnings };
    // Scanned PDF: use an OCR provider
    if (llama) {
      const md = await llamaParse(buf, name);
      return { pages: md.map((text) => ({ text, confidence: null })), ocrUsed: true, warnings };
    }
    if (aiEnabled) {
      const t = await ocrWithModel(buf, "application/pdf");
      return { pages: t.map((text) => ({ text, confidence: null })), ocrUsed: true, warnings };
    }
    throw new Error("This PDF has no embedded text. Configure an OCR provider (ANTHROPIC_API_KEY or LLAMA_CLOUD_API_KEY) to read scanned documents.");
  }

  if (["png", "jpg", "jpeg"].includes(ext)) {
    if (llama) {
      const md = await llamaParse(buf, name);
      return { pages: md.map((text) => ({ text, confidence: null })), ocrUsed: true, warnings };
    }
    if (!aiEnabled) throw new Error("Image text extraction requires an OCR provider. Set ANTHROPIC_API_KEY or LLAMA_CLOUD_API_KEY.");
    const t = await ocrWithModel(buf, mimeFor(ext));
    return { pages: [{ text: t.join("\n\n"), confidence: null }], ocrUsed: true, warnings };
  }

  if (ext === "txt" || ext === "csv") return { pages: chunk(buf.toString("utf8")), ocrUsed: false, warnings };

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return { pages: chunk(r.value), ocrUsed: false, warnings };
  }

  if (ext === "xlsx" || ext === "xls") {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(buf, { type: "buffer" });
      const pages = wb.SheetNames.map((n) => ({ text: `Sheet: ${n}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[n]), confidence: null }));
      return { pages: pages.length ? pages : [{ text: "", confidence: null }], ocrUsed: false, warnings };
    } catch (e) {
      if (!llama) throw e;
    }
  }

  if (ext === "pptx") {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buf);
    const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
    const pages: ParsedPage[] = [];
    for (const f of slides) {
      const xml = await zip.files[f].async("string");
      const text = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(" ")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      pages.push({ text, confidence: null });
    }
    return { pages: pages.length ? pages : [{ text: "", confidence: null }], ocrUsed: false, warnings };
  }

  if (["doc", "ppt", "xls"].includes(ext)) {
    if (llama) {
      const md = await llamaParse(buf, name);
      return { pages: md.map((text) => ({ text, confidence: null })), ocrUsed: false, warnings };
    }
    throw new Error(`Legacy .${ext} files need LlamaParse. Set LLAMA_CLOUD_API_KEY, or convert the file to a newer format.`);
  }
  throw new Error(`Unsupported file type: ${ext}`);
}
