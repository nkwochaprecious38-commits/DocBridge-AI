import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Features" };

const F = [
  { id: "parsing", k: "A", t: "AI Document Parsing", d: "Convert complex documents into machine readable content. DocBridge supports PDFs, scanned documents, tables, forms and supported office formats, and preserves relevant document structure where possible.", b: ["Page level text output", "Tables and forms", "Office formats"] },
  { id: "ocr", k: "B", t: "Intelligent OCR", d: "Extract text from scanned PDFs and images with page level processing. Confidence indicators are shown when the configured OCR provider returns them.", b: ["Scanned PDFs", "PNG, JPG and JPEG", "Page level results"] },
  { id: "extraction", k: "C", t: "Structured Data Extraction", d: "Extract information using predefined or custom schemas. Define the exact fields you want and receive structured JSON that you can review, edit and approve.", b: ["Custom schemas", "JSON output", "Missing field flags"] },
  { id: "classification", k: "D", t: "Document Classification", d: "Automatically categorize documents based on their content. Defaults include Contracts, Invoices, Receipts, Reports, Resumes, Purchase Orders, Financial Statements, Legal Documents and Medical Records. Create your own categories at any time.", b: ["Default categories", "Custom categories", "Reason shown for each result"] },
  { id: "splitting", k: "E", t: "Document Splitting", d: "Detect and separate multiple documents contained in one uploaded file. Review the detected boundaries before saving individual documents.", b: ["Boundary detection", "Review before saving", "Page ranges preserved"] },
  { id: "chat", k: "F", t: "AI Document Chat", d: "Ask questions about your uploaded documents, such as what is the expiration date, identify all payment obligations, or find all documents mentioning a supplier. Answers cite the source document and page, separate stated facts from interpretation, and say so when the documents do not contain the answer.", b: ["Citations with page numbers", "Facts separated from interpretation", "Clear when no answer exists"] },
  { id: "search", k: "G", t: "Document Search", d: "Search across your library with keyword search and AI expanded semantic search. Filter by category, date range and tags, and see relevant excerpts in the results.", b: ["Keyword and semantic modes", "Category, date and tag filters", "Excerpts in results"] },
  { id: "summarization", k: "H", t: "Document Summarization", d: "Generate concise summaries including executive summaries, key findings, important dates, parties involved, obligations and action items.", b: ["Executive summary", "Dates and parties", "Action items"] },
  { id: "comparison", k: "I", t: "Document Comparison", d: "Compare documents and identify differences, missing clauses, changed terms, conflicting information, date changes and amount variations.", b: ["Changed terms", "Missing clauses", "Amount and date changes"] },
  { id: "workflows", k: "J", t: "Document Workflow Automation", d: "Build automated sequences. When an invoice is uploaded: detect the document type, extract invoice information, validate required fields, flag missing information, save structured data, and notify the assigned team member. Every run keeps a history and error report.", b: ["Triggers and steps", "Human approval steps", "History and error reporting"] },
];

export default function Features() {
  return (
    <>
      <PageHeader eyebrow="Features" title="Detailed capabilities for every stage of document work." text="Each capability is designed to keep results traceable to the source document." />
      <div className="container-x section space-y-6">
        {F.map((f) => (
          <section key={f.id} id={f.id} className="card grid scroll-mt-24 gap-6 p-6 sm:p-8 lg:grid-cols-3">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 font-heading text-sm font-bold text-brand">{f.k}</div>
              <h2 className="mt-3 text-xl font-bold">{f.t}</h2>
            </div>
            <p className="text-sm leading-relaxed text-navy/75 lg:col-span-1">{f.d}</p>
            <ul className="space-y-2 text-sm">{f.b.map((x) => (<li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />{x}</li>))}</ul>
          </section>
        ))}
        <div className="pt-6"><Link href="/signup" className="btn-primary">Get Started</Link></div>
      </div>
    </>
  );
}
