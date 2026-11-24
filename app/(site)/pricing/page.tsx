import { PageHeader } from "@/components/PageHeader";
import { PLANS } from "@/lib/plans";
import { Check } from "lucide-react";

export const metadata = { title: "Pricing" };

export default function Pricing() {
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Choose the plan that fits your team." text="Subscriptions are billed monthly through Selar. Select a plan to continue to secure checkout." />
      <div className="container-x section">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`card flex flex-col p-7 ${p.highlighted ? "border-brand ring-2 ring-brand/30" : ""}`}>
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="mt-2 min-h-[3rem] text-sm text-navy/70">{p.blurb}</p>
              <div className="mt-5 flex items-baseline gap-2"><span className="font-heading text-4xl font-extrabold">{p.price}</span><span className="text-sm text-navy/60">{p.period}</span></div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (<li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{f}</li>))}
              </ul>
              <dl className="mt-6 space-y-3 border-t border-navy/10 pt-5 text-sm">
                <div><dt className="font-semibold">Document processing limit</dt><dd className="text-navy/60">{p.limits.documents}</dd></div>
                <div><dt className="font-semibold">Storage limit</dt><dd className="text-navy/60">{p.limits.storage}</dd></div>
                <div><dt className="font-semibold">AI usage limit</dt><dd className="text-navy/60">{p.limits.ai}</dd></div>
              </dl>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className={`mt-8 ${p.highlighted ? "btn-primary" : "btn-secondary"}`}>Subscribe to {p.name}</a>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm text-navy/60">Prices and billing period are taken from the Selar checkout pages. Selar does not list usage limits for these plans, so limit values are shown as placeholders until your terms are confirmed.</p>
      </div>
    </>
  );
}
