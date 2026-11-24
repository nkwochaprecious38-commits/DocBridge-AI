import { FileText, CheckCircle2, Clock, Braces, Bot } from "lucide-react";

const stats = [
  { l: "Total Documents", v: "1,284", i: FileText },
  { l: "Documents Processed", v: "1,196", i: CheckCircle2 },
  { l: "Processing Queue", v: "14", i: Clock },
  { l: "Extracted Records", v: "3,802", i: Braces },
];
const cats = [
  { n: "Contracts", p: 34, c: "bg-brand" }, { n: "Invoices", p: 27, c: "bg-teal" },
  { n: "Reports", p: 18, c: "bg-navy" }, { n: "Receipts", p: 12, c: "bg-aqua" }, { n: "Other", p: 9, c: "bg-slate-300" },
];
const activity = [
  "Supplier agreement parsed: 12 pages", "Invoice extracted: 2 fields need review",
  "Quarterly report summarized", "Intake workflow completed",
];

export function DashboardPreview() {
  return (
    <div className="card overflow-hidden" role="img" aria-label="DocBridge dashboard preview with demonstration data">
      <div className="flex items-center justify-between border-b border-navy/10 bg-mist px-4 py-2.5">
        <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy/20" /><span className="h-2.5 w-2.5 rounded-full bg-navy/20" /><span className="h-2.5 w-2.5 rounded-full bg-navy/20" /></div>
        <span className="rounded-full bg-aqua/30 px-2.5 py-0.5 text-[11px] font-semibold text-navy">Demonstration data</span>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="rounded-lg border border-navy/10 p-3">
              <s.i className="h-4 w-4 text-teal" />
              <div className="mt-2 font-heading text-xl font-bold">{s.v}</div>
              <div className="text-[11px] text-navy/60">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-navy/10 p-4 md:col-span-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy/60">Document Categories</div>
            <div className="space-y-2.5">
              {cats.map((c) => (
                <div key={c.n}>
                  <div className="mb-1 flex justify-between text-xs"><span>{c.n}</span><span className="text-navy/60">{c.p}%</span></div>
                  <div className="h-1.5 rounded-full bg-mist"><div className={`h-1.5 rounded-full ${c.c}`} style={{ width: `${c.p * 2.4}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-navy/10 p-4 md:col-span-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy/60">Recent Activity</div>
            <ul className="space-y-2.5 text-sm">
              {activity.map((a) => (<li key={a} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />{a}</li>))}
            </ul>
          </div>
        </div>
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand"><Bot className="h-4 w-4" />AI Document Assistant</div>
          <p className="text-sm"><span className="font-semibold">Question:</span> What is the expiration date in the supplier agreement?</p>
          <p className="mt-1.5 text-sm text-navy/80"><span className="font-semibold">Answer:</span> Stated in the document, page 9. <span className="rounded bg-white px-1.5 py-0.5 text-xs text-teal">Source: Supplier Agreement, p. 9</span></p>
        </div>
      </div>
    </div>
  );
}
