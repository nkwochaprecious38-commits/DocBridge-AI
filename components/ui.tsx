import Link from "next/link";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/utils";

export function PageTitle({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{text && <p className="mt-1 max-w-2xl text-sm text-navy/70">{text}</p>}</div>
      {action}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700"}`}>{STATUS_LABEL[status] ?? status}</span>;
}
export function StatCard({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const inner = (<div className="card p-5"><div className="text-xs font-semibold uppercase tracking-wide text-navy/60">{label}</div><div className="mt-2 font-heading text-3xl font-extrabold">{value}</div></div>);
  return href ? <Link href={href} className="block transition hover:-translate-y-0.5">{inner}</Link> : inner;
}
export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-base font-bold">{title}</h2>{action}</div>
      {children}
    </section>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-navy/20 bg-mist/50 p-6 text-center text-sm text-navy/60">{children}</div>;
}
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="card overflow-x-auto"><table className="w-full min-w-[640px]">{children}</table></div>;
}
export function Notice({ kind = "info", children }: { kind?: "info" | "warn"; children: React.ReactNode }) {
  return <div className={`mb-4 rounded-lg border p-3 text-sm ${kind === "warn" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>{children}</div>;
}
