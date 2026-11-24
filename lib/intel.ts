import { aiEnabled, askJSON, clip } from "@/lib/ai";

export type FieldDef = { name: string; type: string };

const KEYWORDS: Record<string, string[]> = {
  Invoices: ["invoice", "bill to", "amount due", "invoice number"],
  Contracts: ["agreement", "hereinafter", "governing law", "term and termination", "parties"],
  Receipts: ["receipt", "thank you for your purchase", "change due"],
  Resumes: ["curriculum vitae", "work experience", "education", "skills", "resume"],
  "Purchase Orders": ["purchase order", "po number", "ship to"],
  "Financial Statements": ["balance sheet", "income statement", "cash flow", "total assets"],
  "Medical Records": ["patient", "diagnosis", "prescription", "clinical"],
  "Legal Documents": ["plaintiff", "defendant", "court", "hereby"],
  Reports: ["executive summary", "findings", "conclusion", "report"],
};

export function heuristicClassify(text: string, categories: string[]): string {
  const t = text.toLowerCase();
  let best = "Other", score = 0;
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    if (!categories.includes(cat)) continue;
    const s = kws.filter((k) => t.includes(k)).length;
    if (s > score) { score = s; best = cat; }
  }
  return score >= 2 ? best : categories.includes("Other") ? "Other" : categories[0];
}

export async function classify(text: string, categories: string[]) {
  if (!aiEnabled) return { category: heuristicClassify(text, categories), method: "keyword rules", reason: "AI is not configured" };
  const r = await askJSON<{ category: string; reason: string }>(
    `Classify the document into exactly one of these categories: ${JSON.stringify(categories)}. Use "Other" if none fits. Base the decision only on the document text. Return {"category": string, "reason": string}.`,
    clip(text, 12000), 400);
  const category = categories.find((c) => c.toLowerCase() === String(r.category).toLowerCase()) ?? "Other";
  return { category, method: "AI", reason: r.reason };
}

export async function summarize(text: string) {
  if (!aiEnabled) return { ai_generated: false, executive: text.replace(/\s+/g, " ").slice(0, 500), key_findings: [], important_dates: [], parties: [], obligations: [], action_items: [] };
  const r = await askJSON(
    `Summarize the document using only information stated in it. Never invent facts. Return JSON: {"executive": string (3 to 5 sentences), "key_findings": string[], "important_dates": string[], "parties": string[], "obligations": string[], "action_items": string[]}. Use empty arrays when the document does not contain that information.`,
    clip(text), 2000);
  return { ai_generated: true, ...r };
}

export async function extract(text: string, fields: FieldDef[]) {
  if (!aiEnabled) throw new Error("Structured extraction requires ANTHROPIC_API_KEY.");
  const data = await askJSON<Record<string, unknown>>(
    `Extract these fields from the document: ${JSON.stringify(fields)}. Copy values as they appear in the document. Dates as written. Numbers as numbers without currency symbols. Arrays for type "array". If a field is not present in the document use null. Never guess. Return a JSON object keyed by field name.`,
    clip(text), 4000);
  const out: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const f of fields) {
    const v = data[f.name] ?? null;
    out[f.name] = v;
    if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) missing.push(f.name);
  }
  return { data: out, missing };
}

export async function detectSplits(pages: string[]) {
  if (!aiEnabled) throw new Error("Document splitting requires ANTHROPIC_API_KEY.");
  const digest = pages.map((p, i) => `--- PAGE ${i + 1} ---\n${p.slice(0, 700)}`).join("\n");
  const r = await askJSON<{ documents: { title: string; start_page: number; end_page: number; type: string }[] }>(
    `The following pages come from one uploaded file that may contain several separate documents combined. Identify where each document starts and ends. Pages are numbered from 1 and every page must belong to exactly one document, in order. Return {"documents":[{"title":string,"start_page":number,"end_page":number,"type":string}]}.`,
    clip(digest, 80000), 2000);
  const docs = (r.documents || []).filter((d) => d.start_page >= 1 && d.end_page >= d.start_page && d.end_page <= pages.length);
  return docs;
}

export async function compareDocs(a: { name: string; pages: string[] }, b: { name: string; pages: string[] }) {
  if (!aiEnabled) throw new Error("Comparison requires ANTHROPIC_API_KEY.");
  const fmt = (d: { name: string; pages: string[] }) => d.pages.map((p, i) => `[Page ${i + 1}] ${p}`).join("\n");
  return askJSON(
    `Compare Document A and Document B using only their text. Return JSON: {"summary": string, "differences": [{"topic": string, "a": string, "b": string, "a_page": number|null, "b_page": number|null}], "missing_in_b": string[], "missing_in_a": string[], "changed_terms": string[], "conflicts": string[], "date_changes": string[], "amount_variations": string[]}. Use empty arrays when nothing applies. Do not infer beyond the text.`,
    `Document A (${a.name}):\n${clip(fmt(a), 40000)}\n\nDocument B (${b.name}):\n${clip(fmt(b), 40000)}`, 4000);
}
