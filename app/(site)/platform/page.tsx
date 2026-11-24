import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Platform" };

const FORMATS = ["PDF", "DOCX", "DOC", "XLSX", "XLS", "PPTX", "PPT", "TXT", "CSV", "PNG", "JPG", "JPEG"];
const AREAS = [
  { id: "ingestion", n: "A", title: "Document Ingestion", text: "Bring documents into organized workspaces with clear upload status.", items: ["Upload individual files", "Upload multiple files", "Drag and drop documents", "Import documents in bulk", "Connect supported cloud storage", "Organize uploaded documents into folders", "Track upload status"], note: "Cloud storage connectors are part of the architecture and become available once configured and tested for your account." },
  { id: "parsing", n: "B", title: "Document Parsing", text: "Turn files into structured, machine readable content while keeping page context.", items: ["PDF parsing", "OCR for scanned files", "Table extraction", "Image text extraction", "Chart and visual content recognition where supported", "Layout preservation", "Page level extraction", "Structured document output"] },
  { id: "extraction", n: "C", title: "Data Extraction", text: "Define custom extraction schemas and receive structured JSON for each document.", items: [], schemas: [
    { t: "Invoice", f: ["Invoice Number", "Vendor", "Invoice Date", "Due Date", "Total Amount", "Tax", "Line Items"] },
    { t: "Contract", f: ["Contract Title", "Parties", "Effective Date", "Expiration Date", "Renewal Terms", "Payment Terms", "Obligations"] },
    { t: "Resume", f: ["Candidate Name", "Email", "Phone", "Skills", "Work Experience", "Education", "Certifications"] },
  ] },
  { id: "intelligence", n: "D", title: "Document Intelligence", text: "Search, question and summarize your library with answers tied to their sources.", items: ["AI document search", "Document question answering", "Document summarization", "Multi document comparison", "Contextual document retrieval", "Citation and source references", "Knowledge base creation"] },
  { id: "automation", n: "E", title: "Workflow Automation", text: "Route documents through repeatable processes with human approval where it matters.", items: ["Document classification", "Document routing", "Automated extraction", "Approval workflows", "Processing triggers", "Notifications", "Task assignments", "Workflow history"] },
];

export default function Platform() {
  return (
    <>
      <PageHeader eyebrow="Platform" title="One ecosystem for document intelligence." text="DocBridge brings ingestion, parsing, extraction, intelligence and automation into a single connected workspace." />
      <div className="container-x section space-y-16">
        {AREAS.map((a) => (
          <section key={a.id} id={a.id} className="grid scroll-mt-24 gap-8 lg:grid-cols-3">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy font-heading font-bold text-white">{a.n}</div>
              <h2 className="mt-4 text-2xl font-bold">{a.title}</h2>
              <p className="mt-2 text-navy/70">{a.text}</p>
            </div>
            <div className="card p-6 lg:col-span-2">
              {a.items.length > 0 && (
                <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {a.items.map((i) => (<li key={i} className="flex gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />{i}</li>))}
                </ul>
              )}
              {a.schemas && (
                <div className="grid gap-5 sm:grid-cols-3">
                  {a.schemas.map((s) => (
                    <div key={s.t}>
                      <h3 className="text-sm font-bold text-brand">{s.t} extraction</h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-navy/80">{s.f.map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                  ))}
                </div>
              )}
              {a.id === "ingestion" && (
                <div className="mt-6 border-t border-navy/10 pt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-navy/60">Supported formats</div>
                  <div className="mt-3 flex flex-wrap gap-2">{FORMATS.map((f) => <span key={f} className="rounded-md bg-mist px-2.5 py-1 text-xs font-semibold">{f}</span>)}</div>
                </div>
              )}
              {a.note && <p className="mt-5 rounded-lg bg-mist p-3 text-xs text-navy/70">{a.note}</p>}
            </div>
          </section>
        ))}
        <div className="flex flex-wrap gap-3"><Link href="/signup" className="btn-primary">Get Started</Link><Link href="/features" className="btn-secondary">View Features</Link></div>
      </div>
    </>
  );
}
