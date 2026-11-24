import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SOLUTIONS } from "@/lib/content";

export const metadata = { title: "Solutions" };

export default function Solutions() {
  return (
    <>
      <PageHeader eyebrow="Solutions" title="Built for document heavy teams." text="See how different industries use DocBridge to extract information, organize records and automate review." />
      <div className="container-x section">
        <nav aria-label="Industries" className="mb-12 flex flex-wrap gap-2">
          {SOLUTIONS.map((s) => (<a key={s.id} href={`#${s.id}`} className="rounded-full border border-navy/15 px-4 py-1.5 text-sm font-medium hover:border-brand hover:text-brand">{s.name}</a>))}
        </nav>
        <div className="space-y-6">
          {SOLUTIONS.map((s) => (
            <section key={s.id} id={s.id} className="card grid scroll-mt-24 gap-6 p-6 sm:p-8 lg:grid-cols-3">
              <div><h2 className="text-2xl font-bold">{s.name}</h2></div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-teal">The challenge</h3>
                <p className="mt-2 text-sm text-navy/75">{s.challenge}</p>
                <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-teal">How DocBridge helps</h3>
                <p className="mt-2 text-sm text-navy/75">{s.text}</p>
              </div>
              <ul className="space-y-2 text-sm">
                {s.uses.map((u) => (<li key={u} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{u}</li>))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-12"><Link href="/signup" className="btn-primary">Get Started</Link></div>
      </div>
    </>
  );
}
