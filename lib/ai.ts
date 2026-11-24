import Anthropic from "@anthropic-ai/sdk";

export const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

export function parseJSON<T = any>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

export async function askText(system: string, user: any, maxTokens = 4000): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL, max_tokens: maxTokens, system,
    messages: [{ role: "user", content: user }],
  });
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export async function askJSON<T = any>(system: string, user: any, maxTokens = 4000): Promise<T> {
  const text = await askText(system + "\nRespond with a single valid JSON object and nothing else.", user, maxTokens);
  return parseJSON<T>(text);
}

export const clip = (s: string, n = 60000) => (s.length > n ? s.slice(0, n) : s);

/** OCR through the model's vision input. Accepts images or PDFs. */
export async function ocrWithModel(buf: Buffer, mime: string): Promise<string[]> {
  const data = buf.toString("base64");
  const block: any = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : { type: "image", source: { type: "base64", media_type: mime, data } };
  const text = await askText(
    "You are an OCR engine. Transcribe all visible text exactly as written, preserving reading order, tables (as plain rows separated by ' | '), and line breaks. Do not summarize, translate, correct, or add commentary. If a region is illegible write [illegible]. Start each page with a line '=== PAGE n ==='.",
    [block, { type: "text", text: "Transcribe this document." }], 16000
  );
  const parts = text.split(/^=== PAGE \d+ ===\s*$/m).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [text.trim()];
}
